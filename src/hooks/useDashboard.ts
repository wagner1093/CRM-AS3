import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export interface DashboardConversation {
  id: string;
  status: string | null;
  ai_summary: string | null;
  ai_intent: string | null;
  ai_stage: string | null;
  last_message_at: string | null;
  contact: {
    id: string;
    name: string;
    phone: string | null;
  } | null;
}

export interface DashboardVehicle {
  id: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  mileage: number | null;
  price: number | null;
  status: string | null;
  purchase_price: number | null;
  commission_as3: number | null;
  commission_external: number | null;
  commission_armor: number | null;
  commission_financing: number | null;
}

export interface DashboardDeal {
  id: string;
  stage: string | null;
  value: number | null;
  created_at: string | null;
}

export function useDashboardConversations() {
  return useQuery({
    queryKey: ["dashboard-conversations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select(`
          id, status, ai_summary, ai_intent, ai_stage, last_message_at,
          contact:contacts!conversations_contact_id_fkey(id, name, phone)
        `)
        .order("last_message_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as DashboardConversation[];
    },
  });
}

export function useDashboardVehicles() {
  return useQuery({
    queryKey: ["dashboard-vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, brand, model, year, color, mileage, price, status, purchase_price, commission_as3, commission_external, commission_armor, commission_financing")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as DashboardVehicle[];
    },
  });
}

export function useDashboardDeals() {
  return useQuery({
    queryKey: ["dashboard-deals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deals")
        .select("id, stage, value, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as DashboardDeal[];
    },
  });
}
