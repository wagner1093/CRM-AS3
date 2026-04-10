import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface QuickReply {
  id: string;
  shortcut: string;
  content: string;
}

export function useQuickReplies() {
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQuickReplies() {
      try {
        const { data, error } = await supabase
          .from("quick_replies")
          .select("*")
          .order("shortcut", { ascending: true });

        if (error) throw error;
        setQuickReplies(data || []);
      } catch (err) {
        console.error("Error fetching quick replies:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchQuickReplies();
  }, []);

  return { quickReplies, loading };
}
