import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { WaitlistProfile, WaitlistPreferences, Contact } from "@/types/crm";

export function useWaitlist() {
  return useQuery({
    queryKey: ["waitlist"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("waitlist")
        .select(`
          *,
          contact:contacts(*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Map database names to frontend types
      return data.map((item: any) => ({
        ...item,
        contact: {
          ...item.contact,
          full_name: item.contact.name,
          phone_e164: item.contact.phone,
        }
      })) as WaitlistProfile[];
    },
  });
}

export function useWaitlistPreferences(waitlistId?: string) {
  return useQuery({
    queryKey: ["waitlist-preferences", waitlistId],
    queryFn: async () => {
      if (!waitlistId) return null;
      const { data, error } = await supabase
        .from("waitlist_preferences")
        .select("*")
        .eq("waitlist_id", waitlistId)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data as WaitlistPreferences | null;
    },
    enabled: !!waitlistId,
  });
}

export function useAddWaitlistEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contact, waitlist, preferences }: { 
      contact: Partial<Contact>, 
      waitlist: any, 
      preferences: any 
    }) => {
      // 1. Create or Find Contact
      const { data: contactData, error: contactError } = await supabase
        .from("contacts")
        .upsert({
          name: contact.full_name,
          phone: contact.phone_e164,
          email: contact.email,
          whatsapp: contact.phone_e164, // Required by schema
        }, { onConflict: 'whatsapp' })
        .select()
        .single();

      if (contactError) throw contactError;

      // 2. Create Waitlist Entry
      const { data: waitlistData, error: waitlistError } = await supabase
        .from("waitlist")
        .insert({
          contact_id: contactData.id,
          status: waitlist.status,
          priority_score: waitlist.priority_score,
          notes: waitlist.notes,
        })
        .select()
        .single();

      if (waitlistError) throw waitlistError;

      // 3. Create Preferences
      const { error: prefError } = await supabase
        .from("waitlist_preferences")
        .insert({
          waitlist_id: waitlistData.id,
          ...preferences,
        });

      if (prefError) throw prefError;

      return waitlistData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waitlist"] });
    },
  });
}
