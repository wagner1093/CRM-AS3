import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface InboxContact {
  id: string;
  name: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
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
}

export interface InboxMessage {
  id: string;
  conversation_id: string | null;
  content: string;
  direction: string | null;
  sender: string | null;
  phone: string | null;
  created_at: string | null;
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
      .select("*, contacts(id, name, phone, whatsapp, email)")
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
      unread_count: 0,
    }));

    // Fetch unread counts for all conversations
    const convIds = mapped.map((c) => c.id);
    if (convIds.length > 0) {
      const { data: msgData } = await supabase
        .from("messages")
        .select("conversation_id")
        .in("conversation_id", convIds)
        .eq("direction", "inbound");

      if (msgData) {
        const countMap: Record<string, number> = {};
        msgData.forEach((m: any) => {
          countMap[m.conversation_id] = (countMap[m.conversation_id] || 0) + 1;
        });
        mapped.forEach((c) => {
          c.unread_count = countMap[c.id] || 0;
        });
      }
    }

    setConversations(mapped);
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
        // Find the conversation to get the phone number
        const conv = conversations.find((c) => c.id === selectedId);
        const phone = conv?.contact?.phone || conv?.contact?.whatsapp || conv?.phone || null;

        const { error } = await supabase.from("messages").insert({
          conversation_id: selectedId,
          content: text.trim(),
          direction: "outbound",
          sender: "agent",
          phone,
        });

        if (error) throw error;

        // Update conversation last_message
        await supabase
          .from("conversations")
          .update({
            last_message: text.trim(),
            last_message_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", selectedId);

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
    [selectedId, conversations, toast]
  );

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

  // Real-time subscription for new messages
  useEffect(() => {
    const channel = supabase
      .channel("inbox-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newMsg = payload.new as InboxMessage;

          // If message belongs to selected conversation, add it
          if (newMsg.conversation_id === selectedId) {
            setMessages((prev) => {
              // Avoid duplicates (from optimistic update)
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              // Remove temp messages
              const filtered = prev.filter((m) => !m.id.startsWith("temp-"));
              return [...filtered, newMsg];
            });
          }

          // Refresh conversation list
          fetchConversations();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "conversations" },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedId, fetchConversations]);

  return {
    conversations,
    messages,
    selectedId,
    setSelectedId,
    sendMessage,
    loading,
    sending,
    refreshConversations: fetchConversations,
  };
}
