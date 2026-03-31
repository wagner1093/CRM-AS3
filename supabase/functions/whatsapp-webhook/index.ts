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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    console.log("Webhook received:", JSON.stringify(body).substring(0, 500));

    // Forward to n8n webhook
    const n8nWebhookUrl = "https://agencia-wg1234-n8n.yj3mui.easypanel.host/webhook/as3motors-whatsapp";
    try {
      await fetch(n8nWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      console.log("Forwarded to n8n");
    } catch (n8nErr) {
      console.error("Error forwarding to n8n:", n8nErr);
    }

    const event = body.event;

    // Handle messages.upsert (incoming messages)
    if (event === "messages.upsert") {
      const data = body.data;
      if (!data) {
        return new Response(JSON.stringify({ ok: true, skipped: "no data" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const message = data.message || data;
      const key = message.key || {};
      const remoteJid = key.remoteJid || "";
      const fromMe = key.fromMe || false;
      const messageContent =
        message.message?.conversation ||
        message.message?.extendedTextMessage?.text ||
        message.message?.imageMessage?.caption ||
        message.message?.videoMessage?.caption ||
        "";

      if (!messageContent || !remoteJid) {
        return new Response(JSON.stringify({ ok: true, skipped: "no content or jid" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Extract phone number from remoteJid (e.g., "5511999001122@s.whatsapp.net")
      const phone = remoteJid.replace("@s.whatsapp.net", "").replace("@g.us", "");
      const direction = fromMe ? "outbound" : "inbound";
      const senderName = message.pushName || phone;

      // Find or create contact - search by phone or whatsapp
      let { data: contact } = await supabase
        .from("contacts")
        .select("id, name")
        .or(`phone.eq.${phone},whatsapp.eq.${phone}`)
        .maybeSingle();

      if (!contact) {
        const { data: newContact, error: contactErr } = await supabase
          .from("contacts")
          .insert({ name: senderName, phone, whatsapp: phone, source: "whatsapp" })
          .select("id, name")
          .single();

        if (contactErr) {
          console.error("Error creating contact:", contactErr);
          throw contactErr;
        }
        contact = newContact;
      }

      // Find conversation by contact_id OR by phone
      let { data: conversation } = await supabase
        .from("conversations")
        .select("id")
        .or(`contact_id.eq.${contact.id},phone.eq.${phone}`)
        .eq("channel", "whatsapp")
        .maybeSingle();

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
          })
          .select("id")
          .single();

        if (convErr) {
          console.error("Error creating conversation:", convErr);
          throw convErr;
        }
        conversation = newConv;
      } else {
        // Update conversation with latest message and ensure contact_id/phone are set
        await supabase
          .from("conversations")
          .update({
            contact_id: contact.id,
            phone,
            last_message: messageContent,
            last_message_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", conversation.id);
      }

      // Insert message
      const { error: msgErr } = await supabase.from("messages").insert({
        conversation_id: conversation.id,
        content: messageContent,
        direction,
        sender: fromMe ? "agent" : "client",
        phone,
      });

      if (msgErr) {
        console.error("Error inserting message:", msgErr);
        throw msgErr;
      }

      console.log(`Message saved: ${direction} from ${phone}`);

      return new Response(JSON.stringify({ ok: true, conversation_id: conversation.id }), {
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
