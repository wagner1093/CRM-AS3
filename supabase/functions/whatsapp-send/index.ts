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

    const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL");
    const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");
    const EVOLUTION_INSTANCE_NAME = Deno.env.get("EVOLUTION_INSTANCE_NAME");

    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE_NAME) {
      throw new Error("Evolution API environment variables not configured");
    }

    const { conversation_id, text } = await req.json();

    if (!conversation_id || !text) {
      return new Response(JSON.stringify({ error: "conversation_id and text are required" }), {
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

    if (!phone) {
      throw new Error("Contact has no phone number");
    }

    // Send via Evolution API
    const remoteJid = `${phone.replace(/\D/g, "")}@s.whatsapp.net`;

    const evoResponse = await fetch(
      `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE_NAME}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: EVOLUTION_API_KEY,
        },
        body: JSON.stringify({
          number: remoteJid,
          text,
        }),
      }
    );

    const evoData = await evoResponse.json();

    if (!evoResponse.ok) {
      console.error("Evolution API error:", evoData);
      throw new Error(`Evolution API error [${evoResponse.status}]: ${JSON.stringify(evoData)}`);
    }

    // Save outbound message to DB
    const { error: msgErr } = await serviceSupabase.from("messages").insert({
      conversation_id,
      content: text,
      direction: "outbound",
      sender: "agent",
      phone,
    });

    if (msgErr) {
      console.error("Error saving message:", msgErr);
    }

    // Update conversation
    await serviceSupabase
      .from("conversations")
      .update({
        last_message: text,
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
