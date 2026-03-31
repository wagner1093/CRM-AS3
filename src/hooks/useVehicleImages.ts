import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface VehicleImage {
  id: string;
  vehicle_id: string;
  storage_path: string;
  url: string;
  position: number;
  created_at: string | null;
}

export function useVehicleImages(vehicleId: string | undefined) {
  return useQuery({
    queryKey: ["vehicle-images", vehicleId],
    enabled: !!vehicleId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicle_images")
        .select("*")
        .eq("vehicle_id", vehicleId!)
        .order("position", { ascending: true });
      if (error) throw error;
      return data as VehicleImage[];
    },
  });
}

export function useAllVehicleImages(vehicleIds: string[]) {
  return useQuery({
    queryKey: ["vehicle-images-all", vehicleIds.sort().join(",")],
    enabled: vehicleIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicle_images")
        .select("*")
        .in("vehicle_id", vehicleIds)
        .order("position", { ascending: true });
      if (error) throw error;
      return data as VehicleImage[];
    },
  });
}

export function useUploadVehicleImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ vehicleId, file, position }: { vehicleId: string; file: File; position: number }) => {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${vehicleId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("vehicle-photos")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("vehicle-photos")
        .getPublicUrl(path);

      const { error: dbError } = await supabase
        .from("vehicle_images")
        .insert({
          vehicle_id: vehicleId,
          storage_path: path,
          url: urlData.publicUrl,
          position,
        });
      if (dbError) throw dbError;

      return urlData.publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-images"] });
      queryClient.invalidateQueries({ queryKey: ["vehicle-images-all"] });
    },
  });
}

export function useDeleteVehicleImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, storagePath }: { id: string; storagePath: string }) => {
      await supabase.storage.from("vehicle-photos").remove([storagePath]);
      const { error } = await supabase.from("vehicle_images").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-images"] });
      queryClient.invalidateQueries({ queryKey: ["vehicle-images-all"] });
    },
  });
}

export function useReorderVehicleImages() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: { id: string; position: number }[]) => {
      for (const u of updates) {
        const { error } = await supabase
          .from("vehicle_images")
          .update({ position: u.position })
          .eq("id", u.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-images"] });
      queryClient.invalidateQueries({ queryKey: ["vehicle-images-all"] });
    },
  });
}
