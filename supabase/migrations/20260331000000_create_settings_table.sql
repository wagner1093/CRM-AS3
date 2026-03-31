-- Migração para criar a tabela de configurações globais do CRM

CREATE TABLE IF NOT EXISTS public.app_settings (
    id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    updated_at timestamp with time zone DEFAULT now(),
    
    -- Profile / Company
    profile_name text DEFAULT 'Admin AutoCRM',
    profile_email text DEFAULT 'admin@autocrm.com',
    profile_phone text DEFAULT '+55 11 99900-0000',
    company_name text DEFAULT 'AutoCRM Veículos',
    company_cnpj text DEFAULT '12.345.678/0001-99',
    company_address text DEFAULT 'Av. Paulista, 1000 - São Paulo, SP',
    company_site text DEFAULT 'www.autocrm.com.br',
    
    -- Notifications
    notif_new_lead boolean DEFAULT true,
    notif_deal_won boolean DEFAULT true,
    notif_followup boolean DEFAULT true,
    notif_email boolean DEFAULT false,
    notif_whatsapp boolean DEFAULT true,
    notif_sound boolean DEFAULT true,
    notif_desktop boolean DEFAULT true,
    
    -- Automations
    auto_assign boolean DEFAULT true,
    auto_followup boolean DEFAULT true,
    auto_ai_label boolean DEFAULT true,
    auto_welcome boolean DEFAULT false,
    
    -- Sales
    default_commission numeric DEFAULT 2.5,
    currency text DEFAULT 'BRL',
    monthly_sales_goal numeric DEFAULT 500000,
    monthly_leads_goal numeric DEFAULT 150,
    tax_included boolean DEFAULT true
);

-- Habilitando RLS (Row Level Security)
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Política para leitura (permitir para todos os autenticados)
CREATE POLICY "Permitir leitura para todos os usuários autenticados" 
ON public.app_settings FOR SELECT 
TO authenticated 
USING (true);

-- Política para escrita (permitir para administradores/autenticados por enquanto)
CREATE POLICY "Permitir update para usuários autenticados" 
ON public.app_settings FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Política para insert (necessária caso o registro de ID 1 não exista)
CREATE POLICY "Permitir insert inicial" 
ON public.app_settings FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Inserir as configurações padrão caso a tabela esteja vazia
INSERT INTO public.app_settings (id) 
VALUES (1) 
ON CONFLICT (id) DO NOTHING;
