import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookToken = Deno.env.get("WEBHOOK_TOKEN");
    const receivedToken = req.headers.get("x-webhook-token") || new URL(req.url).searchParams.get("token");

    if (webhookToken && receivedToken !== webhookToken) {
      console.error("Unauthorized webhook attempt");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle GET requests for testing
    if (req.method === "GET") {
      return new Response(JSON.stringify({ ok: true, message: "Webhook is running and token is valid!" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    console.log("Webhook received:", JSON.stringify(body).substring(0, 500));
    await supabase.from("webhook_logs").insert({ payload: body });



    const event = (body.event || "").toLowerCase();

    // Handle messages.upsert (incoming messages)
    if (event === "messages.upsert") {
      const data = body.data;
      if (!data) {
        return new Response(JSON.stringify({ ok: true, skipped: "no data" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const msgObj = data.message || {};
      const key = data.key || {};
      const remoteJid = key.remoteJid || "";
      const fromMe = key.fromMe || false;
      const messageContent =
        msgObj.conversation ||
        msgObj.extendedTextMessage?.text ||
        msgObj.imageMessage?.caption ||
        msgObj.videoMessage?.caption ||
        "";

      // Detect forwarded messages (Evolution API sets contextInfo.isForwarded)
      const contextInfo = 
        msgObj.extendedTextMessage?.contextInfo ||
        msgObj.imageMessage?.contextInfo ||
        msgObj.videoMessage?.contextInfo ||
        msgObj.audioMessage?.contextInfo ||
        msgObj.documentMessage?.contextInfo ||
        {};
      const isForwarded = contextInfo.isForwarded === true || (contextInfo.forwardingScore || 0) > 0;

      // Evolution API media extraction
      const isMedia = !!(msgObj.imageMessage || msgObj.videoMessage || msgObj.audioMessage || msgObj.documentMessage);
      const rawBase64 = msgObj.base64 || data.base64;
      const mimeType = 
        msgObj.imageMessage?.mimetype || 
        msgObj.videoMessage?.mimetype || 
        msgObj.audioMessage?.mimetype || 
        msgObj.documentMessage?.mimetype || 
        "";
      const fileName = msgObj.documentMessage?.fileName || msgObj.audioMessage?.fileName || null;

      let mediaUrl = null;
      let mediaType = null;

      if (rawBase64 && isMedia) {
        mediaUrl = rawBase64.startsWith("data:") ? rawBase64 : `data:${mimeType || "image/jpeg"};base64,${rawBase64}`;
        mediaType = mimeType || "image/jpeg";
      }

      if (!messageContent && !mediaUrl && !remoteJid) {
        return new Response(JSON.stringify({ ok: true, skipped: "no content or jid" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Extract phone number and check if it's a group
      const isGroup = remoteJid.endsWith("@g.us");
      const phone = remoteJid.replace("@s.whatsapp.net", "").replace("@g.us", "");
      const direction = fromMe ? "outbound" : "inbound";
      
      let senderName = data.pushName || phone;
      let avatarUrl = null;

      // Logic to find group name and avatar if it's a group
      if (isGroup) {
        try {
          // Check if group metadata is needed
          let { data: existingGroup } = await supabase
            .from("contacts")
            .select("name, avatar_url")
            .eq("phone", phone)
            .maybeSingle();

          if (!existingGroup || !existingGroup.avatar_url || existingGroup.name === phone) {
            const instance = body.instance;
            const apikey = body.apikey;
            const serverUrl = body.server_url;
            
            if (instance && apikey && serverUrl) {
              const findGroupUrl = `${serverUrl}/group/findGroupInfos/${instance}?groupJid=${remoteJid}`;
              const resp = await fetch(findGroupUrl, { headers: { apikey } });
              
              if (resp.ok) {
                const groupInfo = await resp.json();
                senderName = groupInfo.subject || senderName;
                avatarUrl = groupInfo.pictureUrl || null;
                console.log(`Group info found: ${senderName}, avatar: ${!!avatarUrl}`);
              }
            }
          } else {
            senderName = existingGroup.name;
            avatarUrl = existingGroup.avatar_url;
          }
        } catch (groupErr) {
          console.error("Error fetching group info:", groupErr);
        }
      } else if (!fromMe) {
        // For individuals, only fetch avatar if missing and only update name if not fromMe
        try {
          let { data: existingContact } = await supabase
            .from("contacts")
            .select("name, avatar_url")
            .eq("phone", phone)
            .maybeSingle();

          if (!existingContact || !existingContact.avatar_url) {
            const instance = body.instance;
            const apikey = body.apikey;
            const serverUrl = body.server_url;
            
            if (instance && apikey && serverUrl) {
              const fetchAvatarUrl = `${serverUrl}/chat/fetchProfilePictureUrl/${instance}`;
              const resp = await fetch(fetchAvatarUrl, {
                method: "POST",
                headers: { "apikey": apikey, "Content-Type": "application/json" },
                body: JSON.stringify({ number: remoteJid })
              });
              
              if (resp.ok) {
                const avatarInfo = await resp.json();
                avatarUrl = avatarInfo.profilePictureUrl || null;
                console.log(`Avatar found for ${phone}: ${!!avatarUrl}`);
              }
            }
          } else {
            avatarUrl = existingContact.avatar_url;
          }
        } catch (avatarErr) {
          console.error("Error fetching avatar:", avatarErr);
        }
      }

      // For groups, identify the actual sender (participant)
      let msgSenderName = senderName;
      let msgSenderAvatar = null;

      if (isGroup && !fromMe) {
        msgSenderName = data.pushName || phone;
        const participantJid = key.participant || key.participantAlt || remoteJid;
        
        // Try to fetch participant avatar if it's a group
        try {
          const instance = body.instance;
          const apikey = body.apikey;
          const serverUrl = body.server_url;
          
          if (instance && apikey && serverUrl) {
            const fetchAvatarUrl = `${serverUrl}/chat/fetchProfilePictureUrl/${instance}`;
            const resp = await fetch(fetchAvatarUrl, {
              method: "POST",
              headers: { "apikey": apikey, "Content-Type": "application/json" },
              body: JSON.stringify({ number: participantJid })
            });
            
            if (resp.ok) {
              const avatarInfo = await resp.json();
              msgSenderAvatar = avatarInfo.profilePictureUrl || null;
            }
          }
        } catch (err) {
          console.error("Error fetching participant avatar:", err);
        }
      } else if (!isGroup && !fromMe) {
        msgSenderAvatar = avatarUrl;
      }

      // Find or create contact - search by phone or whatsapp
      let { data: contact } = await supabase
        .from("contacts")
        .select("id, name, avatar_url")
        .or(`phone.eq.${phone},whatsapp.eq.${phone}`)
        .maybeSingle();

      if (!contact) {
        const { data: newContact, error: contactErr } = await supabase
          .from("contacts")
          .insert({ 
            name: isGroup ? senderName : msgSenderName, 
            phone, 
            whatsapp: phone, 
            source: isGroup ? "whatsapp_group" : "whatsapp",
            avatar_url: isGroup ? (avatarUrl || msgSenderAvatar) : avatarUrl
          })
          .select("id, name, avatar_url")
          .single();

        if (contactErr) {
          console.error("Error creating contact:", contactErr);
          throw contactErr;
        }
        contact = newContact;
      } else {
        // Update contact info if it's a direct message or if the group name changed
        const shouldUpdateName = isGroup || (!fromMe && (contact.name === phone || !contact.name));
        const currentAvatar = isGroup ? avatarUrl : msgSenderAvatar;
        const shouldUpdateAvatar = currentAvatar && contact.avatar_url !== currentAvatar;

        if (shouldUpdateName || shouldUpdateAvatar) {
          await supabase
            .from("contacts")
            .update({ 
              ...(shouldUpdateName ? { name: isGroup ? senderName : msgSenderName } : {}),
              ...(shouldUpdateAvatar ? { avatar_url: currentAvatar } : {})
            })
            .eq("id", contact.id);
        }
      }

      let { data: existingConvs } = await supabase
        .from("conversations")
        .select("id, unread_count")
        .or(`contact_id.eq.${contact.id},phone.eq.${phone}`)
        .eq("channel", "whatsapp")
        .order("created_at", { ascending: false })
        .limit(1);

      let conversation = existingConvs && existingConvs.length > 0 ? existingConvs[0] : null;

      if (!conversation) {
        const { data: newConv, error: convErr } = await supabase
          .from("conversations")
          .insert({
            contact_id: contact.id,
            phone,
            channel: "whatsapp",
            status: "open",
            last_message: messageContent,
            last_message_at: new Date().toISOString(),
            unread_count: direction === "inbound" ? 1 : 0
          })
          .select("id, unread_count")
          .single();

        if (convErr) {
          console.error("Error creating conversation:", convErr);
          throw convErr;
        }
        conversation = newConv;
      } else {
        // Update conversation with latest message and increment unread_count if inbound
        // Build a human-readable last_message preview
        let lastMsgPreview = messageContent;
        if (!lastMsgPreview && mediaUrl) {
          if (mediaType?.startsWith("audio")) lastMsgPreview = "🎤 Áudio";
          else if (mediaType?.startsWith("video")) lastMsgPreview = "🎥 Vídeo";
          else if (mediaType?.startsWith("image")) lastMsgPreview = "📷 Imagem";
          else if (mediaType?.includes("pdf")) lastMsgPreview = "📄 PDF";
          else lastMsgPreview = "📎 Arquivo";
        }
        const updateData: any = {
          contact_id: contact.id,
          phone,
          last_message: lastMsgPreview || "",
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        if (direction === "inbound") {
          updateData.unread_count = (conversation.unread_count || 0) + 1;
        }

        await supabase
          .from("conversations")
          .update(updateData)
          .eq("id", conversation.id);
      }

      // Insert message with external_id to prevent duplicates
      let msgContent = messageContent;
      if (!msgContent && mediaUrl) {
        if (mediaType?.startsWith("audio")) msgContent = "🎤 Áudio";
        else if (mediaType?.startsWith("video")) msgContent = "🎥 Vídeo";
        else if (mediaType?.startsWith("image")) msgContent = "📷 Imagem";
        else if (mediaType?.includes("pdf")) msgContent = "📄 PDF";
        else msgContent = "📎 Arquivo";
      }
      const { error: msgErr } = await supabase.from("messages").insert({
        conversation_id: conversation.id,
        content: msgContent || "",
        direction,
        sender: fromMe ? "agent" : "client",
        phone,
        media_url: mediaUrl,
        media_type: mediaType,
        file_name: fileName,
        sender_name: fromMe ? null : msgSenderName,
        sender_avatar: fromMe ? null : msgSenderAvatar,
        external_id: key.id,
        forwarded: isForwarded,
      });

      if (msgErr) {
        // If it's a unique constraint violation, we ignore it as it's a duplicate retry
        if (msgErr.code === "23505") {
          console.log(`Duplicate message ignored: ${key.id}`);
          return new Response(JSON.stringify({ ok: true, ignored: "duplicate" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        console.error("Error inserting message:", msgErr);
        throw msgErr;
      }

      console.log(`Message saved: ${direction} from ${phone}`);

      return new Response(JSON.stringify({ ok: true, conversation_id: conversation.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle messages.update (ACK / read receipts)
    if (event === "messages.update") {
      const updates = Array.isArray(body.data) ? body.data : [body.data];
      
      for (const update of updates) {
        if (!update) continue;
        
        const msgId = update.key?.id || update.id;
        const ackStatus = update.update?.status || update.status;
        
        if (msgId && ackStatus !== undefined) {
          // Map Evolution ACK statuses: 
          // DELIVERY_ACK (2) = delivered, READ (3) = read, PLAYED (4) = played (voice)
          const ackValue = typeof ackStatus === "number" ? ackStatus : parseInt(ackStatus);
          
          if (!isNaN(ackValue) && ackValue >= 0) {
            const { error: ackErr } = await supabase
              .from("messages")
              .update({ ack: ackValue })
              .eq("external_id", msgId);
              
            if (ackErr) {
              console.error(`ACK update error for ${msgId}:`, ackErr);
            } else {
              console.log(`ACK updated: ${msgId} -> ${ackValue}`);
            }
          }
        }
      }
      
      return new Response(JSON.stringify({ ok: true, event: "messages.update" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle presence.update (Typing indicators)
    if (event === "presence.update") {
      const data = body.data || {};
      const remoteJid = data.id || data.remoteJid;
      const presence = data.presence; // 'composing', 'recording', 'paused', etc.
      
      if (remoteJid && presence) {
        const isTyping = presence === "composing" || presence === "recording";
        const phone = remoteJid.replace("@s.whatsapp.net", "").replace("@g.us", "");
        
        // Find conversation by phone
        await supabase
          .from("conversations")
          .update({ is_typing: isTyping })
          .eq("phone", phone)
          .eq("channel", "whatsapp");
          
        console.log(`Presence updated for ${phone}: ${presence} (is_typing: ${isTyping})`);
      }
      
      return new Response(JSON.stringify({ ok: true, event: "presence.update" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle connection.update
    if (event === "connection.update") {
      console.log("Connection update:", JSON.stringify(body.data));
      return new Response(JSON.stringify({ ok: true, event: "connection.update" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Default: acknowledge
    return new Response(JSON.stringify({ ok: true, event }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
