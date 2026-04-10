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
    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const EVOLUTION_API_URL = "https://agencia-wg1234-evolution-api.yj3mui.easypanel.host";
    const EVOLUTION_API_KEY = "14587F3EDC5E-42B5-8D41-E4E6F96FEB8B";
    const EVOLUTION_INSTANCE_NAME = "Wg 2";

    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE_NAME) {
      throw new Error("Evolution API environment variables not configured");
    }

    const { conversation_id, text, media, mediaType, fileName } = await req.json();

    if (!conversation_id || (!text && !media)) {
      return new Response(JSON.stringify({ error: "conversation_id and at least text or media are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get conversation + contact phone
    const serviceSupabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: conversation, error: convErr } = await serviceSupabase
      .from("conversations")
      .select("id, contact_id, contacts(phone, whatsapp)")
      .eq("id", conversation_id)
      .single();

    if (convErr || !conversation) {
      throw new Error(`Conversation not found: ${convErr?.message}`);
    }

    const contact = (conversation as any).contacts;
    const phone = contact?.whatsapp || contact?.phone;
    const isGroup = contact?.source === "whatsapp_group";

    if (!phone) {
      throw new Error("Contact has no phone number");
    }

    // Send via Evolution API
    // Correct JID formatting: @g.us for groups, @s.whatsapp.net for personal
    let remoteJid = isGroup ? phone : phone.replace(/\D/g, "");
    if (!remoteJid.includes("@")) {
      remoteJid = isGroup ? `${remoteJid}@g.us` : `${remoteJid}@s.whatsapp.net`;
    }

    const endpoint = media ? "sendMedia" : "sendText";
    
    const body: any = {
      number: remoteJid,
    };

    if (media) {
      // Media should be the full base64 with prefix (data:...;base64,...)
      body.media = media;
      body.mediatype = mediaType || "image"; // Using lowercase as per some docs
      body.caption = text || "";
      if (fileName) body.fileName = fileName;

      // Extract mimetype from base64 prefix if available
      if (media.startsWith("data:")) {
        const mime = media.split(";")[0].split(":")[1];
        if (mime) body.mimetype = mime;
      }
    } else {
      body.text = text;
    }

    console.log(`Sending ${endpoint} to ${remoteJid}...`);

    const evoResponse = await fetch(
      `${EVOLUTION_API_URL}/message/${endpoint}/${encodeURIComponent(EVOLUTION_INSTANCE_NAME)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: EVOLUTION_API_KEY,
        },
        body: JSON.stringify(body),
      }
    );

    const evoData = await evoResponse.json();

    if (!evoResponse.ok) {
      console.error("Evolution API error:", evoData);
      throw new Error(`Evolution API error [${evoResponse.status}]: ${JSON.stringify(evoData)}`);
    }

    // Update conversation with the message summary
    const displayMsg = media ? (mediaType === "image" ? "📷 Foto" : "📄 Arquivo") : text;

    await serviceSupabase
      .from("conversations")
      .update({
        last_message: displayMsg,
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversation_id);

    return new Response(
      JSON.stringify({ ok: true, evolution_response: evoData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Send error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
