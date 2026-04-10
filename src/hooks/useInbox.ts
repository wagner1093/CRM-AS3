import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface InboxContact {
  id: string;
  name: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  source: string | null;
  avatar_url: string | null;
  notes: string | null;
  status: string | null;
}

export interface InboxConversation {
  id: string;
  contact_id: string | null;
  contact: InboxContact | null;
  channel: string | null;
  status: string | null;
  ai_summary: string | null;
  ai_intent: string | null;
  ai_stage: string | null;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string | null;
  phone: string | null;
  unread_count: number;
  is_duplicate_name?: boolean;
}

export interface InboxMessage {
  id: string;
  conversation_id: string | null;
  content: string;
  direction: string | null;
  sender: string | null;
  phone: string | null;
  media_url?: string | null;
  media_type?: string | null;
  file_name?: string | null;
  sender_name?: string | null;
  sender_avatar?: string | null;
  created_at: string | null;
  forwarded?: boolean | null;
}

export function useInbox() {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<InboxConversation[]>([]);
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Fetch all conversations with contacts
  const fetchConversations = useCallback(async () => {
    const { data, error } = await supabase
      .from("conversations")
      .select("*, unread_count, contacts(id, name, phone, whatsapp, email, source, avatar_url, notes, status)")
      .order("last_message_at", { ascending: false });

    if (error) {
      console.error("Error fetching conversations:", error);
      return;
    }

    const mapped: InboxConversation[] = (data || []).map((c: any) => ({
      id: c.id,
      contact_id: c.contact_id,
      contact: c.contacts
        ? {
            id: c.contacts.id,
            name: c.contacts.name,
            phone: c.contacts.phone,
            whatsapp: c.contacts.whatsapp,
            email: c.contacts.email,
            source: c.contacts.source,
            avatar_url: c.contacts.avatar_url,
            notes: c.contacts.notes,
            status: c.contacts.status,
          }
        : null,
      channel: c.channel,
      status: c.status,
      ai_summary: c.ai_summary,
      ai_intent: c.ai_intent,
      ai_stage: c.ai_stage,
      last_message: c.last_message,
      last_message_at: c.last_message_at,
      created_at: c.created_at,
      phone: c.phone,
      unread_count: c.unread_count || 0,
    }));

    // Identify duplicate contact names
    const nameCounts: Record<string, number> = {};
    mapped.forEach((c) => {
      const name = c.contact?.name || c.phone || "Desconhecido";
      nameCounts[name] = (nameCounts[name] || 0) + 1;
    });

    setConversations(mapped.map(c => ({
      ...c,
      is_duplicate_name: nameCounts[c.contact?.name || ""] > 1
    } as any)));
    setLoading(false);
  }, []);

  // Fetch messages for selected conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      return;
    }

    setMessages(data || []);
  }, []);

  // Send a message via edge function
  const sendMessage = useCallback(
    async (text: string) => {
      if (!selectedId || !text.trim()) return;

      setSending(true);
      try {
        const { data, error } = await supabase.functions.invoke("whatsapp-send", {
          body: { conversation_id: selectedId, text: text.trim() }
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        toast({ title: "Mensagem enviada" });
      } catch (err: any) {
        console.error("Error sending message:", err);
        toast({
          title: "Erro ao enviar mensagem",
          description: err.message || "Tente novamente",
          variant: "destructive",
        });
      } finally {
        setSending(false);
      }
    },
    [selectedId, toast]
  );

  const sendMedia = useCallback(
    async (text: string, media: string, mediaType: string, fileName?: string) => {
      if (!selectedId || (!text.trim() && !media)) return;

      setSending(true);
      try {
        const { data, error } = await supabase.functions.invoke("whatsapp-send", {
          body: { conversation_id: selectedId, text: text.trim(), media, mediaType, fileName }
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        toast({ title: "Arquivo enviado" });
      } catch (err: any) {
        console.error("Error sending media:", err);
        toast({
          title: "Erro ao enviar arquivo",
          description: err.message || "Tente novamente",
          variant: "destructive",
        });
      } finally {
        setSending(false);
      }
    },
    [selectedId, toast]
  );

  const updateContact = useCallback(async (contactId: string, updates: Partial<InboxContact>) => {
    const { error } = await supabase
      .from("contacts")
      .update(updates)
      .eq("id", contactId);

    if (error) {
      console.error("Error updating contact:", error);
      toast({ title: "Erro ao atualizar contato", variant: "destructive" });
      return false;
    }

    setConversations(prev => prev.map(c => 
      c.contact?.id === contactId 
        ? { ...c, contact: { ...c.contact, ...updates } as any } 
        : c
    ));
    toast({ title: "Contato atualizado" });
    return true;
  }, [toast]);

  const markAsRead = useCallback(async (conversationId: string) => {
    const { error } = await supabase
      .from("conversations")
      .update({ unread_count: 0 } as any)
      .eq("id", conversationId);

    if (error) {
      console.error("Error marking as read:", error);
    } else {
      setConversations(prev => prev.map(c => 
        c.id === conversationId ? { ...c, unread_count: 0 } : c
      ));
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Fetch messages when selection changes
  useEffect(() => {
    if (selectedId) {
      fetchMessages(selectedId);
    } else {
      setMessages([]);
    }
  }, [selectedId, fetchMessages]);

  // Real-time subscription for updates
  useEffect(() => {
    const channel = supabase
      .channel("inbox-realtime-updates")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newMsg = payload.new as InboxMessage;
          if (newMsg.conversation_id === selectedId) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              const filtered = prev.filter((m) => !m.id.startsWith("temp-"));
              return [...filtered, newMsg];
            });
            // Auto-mark as read if we are looking at this conversation
            markAsRead(newMsg.conversation_id);
          }
          // Slight delay to ensure DB triggers/logic finished
          setTimeout(fetchConversations, 300);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "conversations" },
        (payload) => {
          const updatedConv = payload.new as any;
          // If the active conversation got an update with unread messages, clear them immediately
          if (updatedConv.id === selectedId && updatedConv.unread_count > 0) {
            markAsRead(updatedConv.id);
          } else {
            // Only refresh if it's not the current one we just marked as read (to avoid loops)
            setTimeout(() => fetchConversations(), 300);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedId, fetchConversations, markAsRead]);

  return {
    conversations,
    messages,
    selectedId,
    setSelectedId,
    loading,
    sending,
    sendMessage,
    sendMedia,
    markAsRead,
    updateContact,
    refresh: fetchConversations,
  };
}
