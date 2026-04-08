-- Migration: Create Auto Follow-Up Engine Tables

-- Tabela de Sequências (Ex: "Campanha Carro", "Reaquecimento")
CREATE TABLE IF NOT EXISTS public.followup_sequences (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    trigger_type text DEFAULT 'manual',
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Passos (Ex: D+1, D+3)
CREATE TABLE IF NOT EXISTS public.followup_steps (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    sequence_id uuid REFERENCES public.followup_sequences(id) ON DELETE CASCADE,
    day_offset integer NOT NULL,
    message_template text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Matrículas (Leads que estão recebendo a sequência)
CREATE TABLE IF NOT EXISTS public.followup_enrollments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
    sequence_id uuid REFERENCES public.followup_sequences(id) ON DELETE CASCADE,
    status text DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'canceled')),
    last_step_day_offset integer DEFAULT -1,
    last_sent_at timestamp with time zone,
    enrolled_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.followup_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followup_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followup_enrollments ENABLE ROW LEVEL SECURITY;

-- Permissive policies
CREATE POLICY "followup_sequences_authenticated_access" ON public.followup_sequences FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "followup_steps_authenticated_access" ON public.followup_steps FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "followup_enrollments_authenticated_access" ON public.followup_enrollments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Dados padrão básicos de uma Régua para funcionar na hora
INSERT INTO public.followup_sequences (id, name, trigger_type, active) 
VALUES ('11111111-1111-1111-1111-111111111111', 'Régua de Vendas Padrão', 'manual', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.followup_steps (sequence_id, day_offset, message_template) 
VALUES 
('11111111-1111-1111-1111-111111111111', 1, 'Olá! Como foi nossa última conversa? Vi que você estava interessado, faz sentido continuarmos?'),
('11111111-1111-1111-1111-111111111111', 3, 'Oi! Estou passando pra te deixar um abraço e dizer que separei um material do veículo, quer que eu te mande?'),
('11111111-1111-1111-1111-111111111111', 7, 'Última tentativa aqui! Vou dar andamento em outros processos, mas nossa porta está sempre aberta. Um grande abraço!')
ON CONFLICT DO NOTHING;
