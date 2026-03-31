import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Send, Bot, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { useInbox } from "@/hooks/useInbox";

const InboxPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    conversations,
    messages,
    selectedId,
    setSelectedId,
    sendMessage,
    loading,
    sending,
  } = useInbox();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [newMessage, setNewMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const conv = searchParams.get("conv");
    if (conv) setSelectedId(conv);
  }, [searchParams, setSelectedId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedId, messages]);

  const getContactName = (conv: typeof conversations[0]) =>
    conv.contact?.name || conv.phone || "Desconhecido";

  const getContactPhone = (conv: typeof conversations[0]) =>
    conv.contact?.phone || conv.contact?.whatsapp || conv.phone || "";

  const filtered = conversations.filter((c) => {
    const contactName = getContactName(c);
    const contactPhone = getContactPhone(c);
    const matchSearch =
      contactName.toLowerCase().includes(search.toLowerCase()) ||
      contactPhone.includes(search);
    const matchStatus = filterStatus === "all" || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const selected = conversations.find((c) => c.id === selectedId);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    const text = newMessage;
    setNewMessage("");
    await sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const getStatusBadge = (status: string | null) => {
    const map: Record<string, { label: string; className: string }> = {
      open: { label: "Aberto", className: "bg-success/10 text-success border-success/20" },
      new: { label: "Novo", className: "bg-accent/10 text-accent border-accent/20" },
      waiting_customer: { label: "Aguardando", className: "bg-warning/10 text-warning border-warning/20" },
      won: { label: "Ganho", className: "bg-success/20 text-success border-success/30" },
      lost: { label: "Perdido", className: "bg-destructive/10 text-destructive border-destructive/20" },
    };
    const s = map[status || "open"] || map.open;
    return <span className={`text-[11px] px-2 py-0.5 rounded-full border ${s.className}`}>{s.label}</span>;
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-theme(spacing.20))] items-center justify-center">
        <div className="text-muted-foreground">Carregando conversas...</div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-theme(spacing.20))] -m-6 lg:-m-8">
      {/* Conversation list */}
      <div className="w-[360px] border-r flex flex-col glass-panel">
        <div className="p-4 border-b space-y-3">
          <h2 className="font-semibold text-lg">Inbox WhatsApp</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar contato..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl glass-input border-0"
            />
          </div>
          <div className="flex gap-1.5">
            {[
              { key: "all", label: "Todos" },
              { key: "open", label: "Abertos" },
              { key: "new", label: "Novos" },
              { key: "waiting_customer", label: "Aguardando" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilterStatus(f.key)}
                className={`filter-pill text-xs ${filterStatus === f.key ? "active" : ""}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>Nenhuma conversa encontrada</p>
              <p className="text-xs mt-1">Mensagens recebidas no WhatsApp aparecerão aqui automaticamente</p>
            </div>
          ) : (
            filtered.map((conv) => (
              <motion.button
                key={conv.id}
                onClick={() => setSelectedId(conv.id)}
                whileTap={{ scale: 0.98 }}
                className={`w-full text-left p-4 border-b border-border/30 transition-all duration-200 ${
                  selectedId === conv.id
                    ? "bg-accent/5 border-l-2 border-l-accent"
                    : "hover:bg-muted/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-11 h-11 rounded-full bg-primary/5 border border-border flex items-center justify-center text-sm font-semibold shrink-0">
                    {getInitials(getContactName(conv))}
                    {conv.unread_count > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center">
                        {conv.unread_count > 99 ? "99+" : conv.unread_count}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`font-medium text-sm ${conv.unread_count > 0 ? "font-semibold" : ""}`}>
                        {getContactName(conv)}
                      </span>
                      {getStatusBadge(conv.status)}
                    </div>
                    <p className={`text-xs truncate mt-1 ${conv.unread_count > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                      {conv.last_message || "Sem mensagens"}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      {conv.last_message_at && (
                        <span className="text-[11px] text-muted-foreground">
                          {format(new Date(conv.last_message_at), "dd/MM HH:mm", { locale: ptBR })}
                        </span>
                      )}
                      {conv.channel && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                          {conv.channel}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.button>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {selected ? (
          <>
            <div className="p-4 border-b glass-panel flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/5 border border-border flex items-center justify-center text-sm font-semibold">
                  {getInitials(getContactName(selected))}
                </div>
                <div>
                  <p className="font-semibold text-sm">{getContactName(selected)}</p>
                  <p className="text-xs text-muted-foreground">
                    {getContactPhone(selected) || "Sem número"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(selected.status)}
                {selected.ai_stage && (
                  <Badge variant="outline" className="text-xs rounded-full">
                    {selected.ai_stage}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-background">
              <AnimatePresence>
                {messages.map((msg, i) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={
                        msg.direction === "outbound"
                          ? "chat-bubble-outbound"
                          : "chat-bubble-inbound"
                      }
                    >
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                      {msg.created_at && (
                        <p
                          className={`text-[10px] mt-1.5 ${
                            msg.direction === "outbound"
                              ? "text-primary-foreground/50"
                              : "text-muted-foreground"
                          }`}
                        >
                          {format(new Date(msg.created_at), "HH:mm")}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 border-t glass-panel flex gap-3">
              <Input
                placeholder="Digite uma mensagem..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={sending}
                className="flex-1 rounded-xl glass-input border-0 h-11"
              />
              <Button
                size="icon"
                className="rounded-xl h-11 w-11 shadow-md"
                onClick={handleSend}
                disabled={sending || !newMessage.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
            <MessageSquare className="w-12 h-12 opacity-30" />
            <p>Selecione uma conversa</p>
            <p className="text-xs">Mensagens do WhatsApp via Evolution API</p>
          </div>
        )}
      </div>

      {/* AI Panel */}
      {selected && (
        <div className="w-[320px] border-l glass-panel p-5 overflow-y-auto space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Bot className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-semibold">Análise IA</h3>
            </div>
            <div className="p-3 rounded-xl bg-muted/40 backdrop-blur-sm border border-border/30">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {selected.ai_summary || "Sem análise disponível ainda."}
              </p>
            </div>
            {selected.ai_intent && (
              <div className="mt-3 flex items-center gap-2">
                <Badge variant="outline" className="text-xs rounded-full">
                  Intenção: {selected.ai_intent}
                </Badge>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs rounded-xl h-9"
              onClick={() => navigate("/pipeline")}
            >
              Ver Pipeline
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs rounded-xl h-9"
              onClick={() => navigate("/followup")}
            >
              Iniciar Follow-up
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InboxPage;
