import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface SupabaseVehicle {
  id: string;
  brand: string | null;
  model: string | null;
  version: string | null;
  year: number | null;
  color: string | null;
  mileage: number | null;
  price: number | null;
  status: string | null;
  description: string | null;
  condition: string | null;
  engine: string | null;
  power: string | null;
  leather_seats: boolean | null;
  sunroof: boolean | null;
  electric_trunk: boolean | null;
  fuel: string | null;
  armored: boolean | null;
  armor_type: string | null;
  armor_company: string | null;
  glass_brand: string | null;
  created_at: string | null;
  // Financial / internal
  purchase_price: number | null;
  commission_as3: number | null;
  commission_external: number | null;
  commission_armor: number | null;
  commission_financing: number | null;
  cost_repairs: number | null;
  cost_detailing: number | null;
  cost_documentation: number | null;
  cost_other: number | null;
  notes_internal: string | null;
}

export function useAllVehicles() {
  return useQuery({
    queryKey: ["vehicles-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as SupabaseVehicle[];
    },
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: Partial<Omit<SupabaseVehicle, "id" | "created_at">> & { brand: string; model: string }) => {
      const { data, error } = await supabase
        .from("vehicles")
        .insert({
          brand: params.brand,
          model: params.model,
          version: params.version || null,
          year: params.year || null,
          color: params.color || null,
          mileage: params.mileage || null,
          price: params.price || null,
          status: params.status || "available",
          description: params.description || null,
          condition: params.condition || null,
          engine: params.engine || null,
          power: params.power || null,
          leather_seats: params.leather_seats ?? false,
          sunroof: params.sunroof ?? false,
          electric_trunk: params.electric_trunk ?? false,
          fuel: params.fuel || null,
          armored: params.armored ?? false,
          armor_type: params.armor_type || null,
          armor_company: params.armor_company || null,
          glass_brand: params.glass_brand || null,
          purchase_price: params.purchase_price || null,
          commission_as3: params.commission_as3 || null,
          commission_external: params.commission_external || null,
          commission_armor: params.commission_armor || null,
          commission_financing: params.commission_financing || null,
          cost_repairs: params.cost_repairs || null,
          cost_detailing: params.cost_detailing || null,
          cost_documentation: params.cost_documentation || null,
          cost_other: params.cost_other || null,
          notes_internal: params.notes_internal || null,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles-all"] });
      queryClient.invalidateQueries({ queryKey: ["vehicles-available"] });
    },
  });
}

export function useEditVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ vehicleId, data }: {
      vehicleId: string;
      data: Partial<Omit<SupabaseVehicle, "id" | "created_at">>;
    }) => {
      const { error } = await supabase
        .from("vehicles")
        .update(data)
        .eq("id", vehicleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles-all"] });
      queryClient.invalidateQueries({ queryKey: ["vehicles-available"] });
      queryClient.invalidateQueries({ queryKey: ["deals"] });
    },
  });
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vehicleId: string) => {
      // First unlink any deals referencing this vehicle
      const { error: unlinkError } = await supabase
        .from("deals")
        .update({ vehicle_id: null })
        .eq("vehicle_id", vehicleId);
      if (unlinkError) throw unlinkError;

      // Then delete the vehicle
      const { error } = await supabase
        .from("vehicles")
        .delete()
        .eq("id", vehicleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles-all"] });
      queryClient.invalidateQueries({ queryKey: ["vehicles-available"] });
    },
  });
}
