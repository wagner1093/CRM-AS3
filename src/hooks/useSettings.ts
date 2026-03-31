import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export interface AppSettings {
  id: number;
  profile_name: string;
  profile_email: string;
  profile_phone: string;
  company_name: string;
  company_cnpj: string;
  company_address: string;
  company_site: string;
  notif_new_lead: boolean;
  notif_deal_won: boolean;
  notif_followup: boolean;
  notif_email: boolean;
  notif_whatsapp: boolean;
  notif_sound: boolean;
  notif_desktop: boolean;
  auto_assign: boolean;
  auto_followup: boolean;
  auto_ai_label: boolean;
  auto_welcome: boolean;
  default_commission: number;
  currency: string;
  monthly_sales_goal: number;
  monthly_leads_goal: number;
  tax_included: boolean;
}

export function useSettings() {
  return useQuery({
    queryKey: ["app-settings"],
    queryFn: async () => {
      // Tenta buscar a configuração de ID 1 (global)
      const { data, error } = await supabase
        .from("app_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();

      if (error) {
        console.error("Erro ao carregar configurações:", error);
        throw error;
      }
      
      return data as AppSettings | null;
    },
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Partial<AppSettings>) => {
      const { error } = await supabase
        .from("app_settings")
        .upsert({ id: 1, ...data, updated_at: new Date().toISOString() })
        .eq("id", 1);

      if (error) {
        console.error("Erro ao salvar configurações:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-settings"] });
      toast({
        title: "Sucesso",
        description: "Configurações salvas corretamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: "Falha ao salvar as configurações no banco.",
        variant: "destructive",
      });
    },
  });
}
