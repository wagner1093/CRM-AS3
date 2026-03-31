import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface DealWithRelations {
  id: string;
  contact_id: string | null;
  vehicle_id: string | null;
  value: number | null;
  stage: string | null;
  notes: string | null;
  vehicle_interest: string | null;
  payment_type: string | null;
  urgency: string | null;
  created_at: string | null;
  updated_at: string | null;
  contact: {
    id: string;
    name: string;
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
  } | null;
  vehicle: {
    id: string;
    brand: string | null;
    model: string | null;
    year: number | null;
    color: string | null;
    mileage: number | null;
    price: number | null;
    status: string | null;
  } | null;
}

export function useDeals() {
  return useQuery({
    queryKey: ["deals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deals")
        .select(`
          *,
          contact:contacts!deals_contact_id_fkey(*),
          vehicle:vehicles!deals_vehicle_id_fkey(*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as DealWithRelations[];
    },
  });
}

export function useUpdateDealStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ dealId, stage }: { dealId: string; stage: string }) => {
      const { error } = await supabase
        .from("deals")
        .update({ stage, updated_at: new Date().toISOString() })
        .eq("id", dealId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
    },
  });
}

export function useUpdateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ dealId, data }: { dealId: string; data: {
      vehicle_id?: string | null;
      vehicle_interest?: string | null;
      payment_type?: string | null;
      urgency?: string | null;
      value?: number | null;
      notes?: string | null;
      stage?: string | null;
    }}) => {
      const { error } = await supabase
        .from("deals")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("id", dealId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contactId, data }: { contactId: string; data: {
      name?: string;
      phone?: string | null;
      whatsapp?: string | null;
      email?: string | null;
      notes?: string | null;
      lead_source?: string | null;
      vehicle_interest?: string | null;
      payment_type?: string | null;
      preferences?: string | null;
    }}) => {
      const { error } = await supabase
        .from("contacts")
        .update(data)
        .eq("id", contactId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ vehicleId, data }: { vehicleId: string; data: {
      brand?: string | null;
      model?: string | null;
      year?: number | null;
      color?: string | null;
      mileage?: number | null;
      price?: number | null;
      status?: string | null;
      description?: string | null;
    }}) => {
      const { error } = await supabase
        .from("vehicles")
        .update(data)
        .eq("id", vehicleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      queryClient.invalidateQueries({ queryKey: ["vehicles-available"] });
    },
  });
}

export function useDeleteDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dealId: string) => {
      const { error } = await supabase
        .from("deals")
        .delete()
        .eq("id", dealId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
    },
  });
}

export function useCreateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      contactName: string;
      contactPhone?: string;
      contactEmail?: string;
      vehicleInterest?: string;
      paymentType?: string;
      urgency?: string;
      value?: number;
      notes?: string;
      stage?: string;
    }) => {
      // 1. Create or find contact
      let contactId: string;
      
      if (params.contactPhone) {
        const { data: existing } = await supabase
          .from("contacts")
          .select("id")
          .or(`phone.eq.${params.contactPhone},whatsapp.eq.${params.contactPhone}`)
          .limit(1)
          .maybeSingle();
        
        if (existing) {
          contactId = existing.id;
        } else {
          const { data: newContact, error: contactError } = await supabase
            .from("contacts")
            .insert({
              name: params.contactName,
              phone: params.contactPhone,
              whatsapp: params.contactPhone,
              email: params.contactEmail || null,
            })
            .select("id")
            .single();
          if (contactError) throw contactError;
          contactId = newContact.id;
        }
      } else {
        const { data: newContact, error: contactError } = await supabase
          .from("contacts")
          .insert({
            name: params.contactName,
            email: params.contactEmail || null,
          })
          .select("id")
          .single();
        if (contactError) throw contactError;
        contactId = newContact.id;
      }

      // 2. Create deal
      const { data: deal, error: dealError } = await supabase
        .from("deals")
        .insert({
          contact_id: contactId,
          vehicle_interest: params.vehicleInterest || null,
          payment_type: params.paymentType || null,
          urgency: params.urgency || null,
          value: params.value || null,
          notes: params.notes || null,
          stage: params.stage || "new",
        })
        .select("id")
        .single();

      if (dealError) throw dealError;
      return deal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
    },
  });
}

export function useContacts() {
  return useQuery({
    queryKey: ["contacts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("id, name, phone, whatsapp, email")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useVehiclesAvailable() {
  return useQuery({
    queryKey: ["vehicles-available"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, brand, model, year, price, color, status")
        .in("status", ["available", "reserved"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
