import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Puxa todas as matrículas ativas de follow-up
    const { data: enrollments, error: enrollmentsErr } = await supabase
      .from("followup_enrollments")
      .select("*, followup_sequences(id, name, followup_steps(id, day_offset, message_template))")
      .eq("status", "active");

    if (enrollmentsErr) throw enrollmentsErr;

    const messagesSent: any[] = [];

    // 2. Itera em cada lead
    for (const enrollment of enrollments || []) {
      const { id, enrolled_at, last_step_day_offset, conversation_id } = enrollment;
      const sequence = enrollment.followup_sequences;
      if (!sequence || !sequence.followup_steps) continue;

      // Conta os dias exatos desde a matrícula
      const msDiff = new Date().getTime() - new Date(enrolled_at).getTime();
      const currentDaySince = Math.floor(msDiff / (1000 * 60 * 60 * 24)); // Passou x dias

      // Procura a step (mensagem) cujo dia é HOJE e que ainda não foi mandada
      const stepsToRun = sequence.followup_steps.filter(
        (step: any) => step.day_offset <= currentDaySince && step.day_offset > last_step_day_offset
      );

      // Manda a mensagem (ordena caso tenha perdido algum dia no meio)
      stepsToRun.sort((a: any, b: any) => a.day_offset - b.day_offset);

      for (const step of stepsToRun) {
        // Dispara de fato usando a Edge Function vizinha que já tem as regras do Evolution API
        const text = step.message_template;
        const { error: invokeErr } = await supabase.functions.invoke("whatsapp-send", {
          body: { conversation_id, text }
        });

        if (invokeErr) {
          console.error("Cron falhou ao disparar via whatsapp-send:", invokeErr);
          continue;
        }

        // Atualiza a matrícula avisando que mandou esse dia
        await supabase
          .from("followup_enrollments")
          .update({
            last_step_day_offset: step.day_offset,
            last_sent_at: new Date().toISOString()
          })
          .eq("id", id);
          
        messagesSent.push(`Lead (conv: ${conversation_id}) -> Dia: ${step.day_offset}`);
      }
    }

    return new Response(JSON.stringify({ ok: true, processed: (enrollments || []).length, messagesSent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    } catch (error) {
      console.error("Cron Error:", error);
      return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
});
