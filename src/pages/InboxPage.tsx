import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  Search, 
  Send, 
  Bot, 
  MessageSquare, 
  MoreVertical, 
  Phone, 
  Video, 
  Image as ImageIcon, 
  File as FileIcon,
  User,
  X,
  Plus,
  Pencil,
  Check,
  ChevronRight,
  Forward,
  Download,
  ExternalLink,
  FileText,
  Mic,
  Play,
  Pause,
  Headphones,
  Paperclip
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { useInbox } from "@/hooks/useInbox";
import type { InboxMessage } from "@/hooks/useInbox";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { useProfile } from "@/hooks/useProfile";

const InboxPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    conversations,
    messages,
    selectedId,
    setSelectedId,
    sendMessage,
    sendMedia,
    markAsRead,
    updateContact,
    loading,
    sending,
  } = useInbox();

  const { data: profile } = useProfile();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [newMessage, setNewMessage] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedNotes, setEditedNotes] = useState("");
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selected = conversations.find((c) => c.id === selectedId);

  useEffect(() => {
    if (selected) {
      setEditedName(selected.contact?.name || "");
      setEditedNotes(selected.contact?.notes || "");
    }
  }, [selectedId, selected]);

  const handleSelectConversation = (id: string) => {
    setSelectedId(id);
  };

  useEffect(() => {
    const conv = searchParams.get("conv");
    if (conv) setSelectedId(conv);
  }, [searchParams, setSelectedId]);

  useEffect(() => {
    if (selectedId) {
      markAsRead(selectedId);
    }
  }, [selectedId, markAsRead]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedId, messages]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedId) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const fullBase64 = e.target?.result as string;
      const mediaType = file.type.startsWith("image/") ? "image" : "document";
      await sendMedia("", fullBase64, mediaType, file.name);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSaveContact = async () => {
    if (!selected?.contact?.id) return;
    const success = await updateContact(selected.contact.id, {
      name: editedName,
      notes: editedNotes
    } as any);
    if (success) setIsEditing(false);
  };

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

  const handleSend = async () => {
    if (!newMessage.trim() || sending || !selectedId) return;
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
    name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

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

  // Helper to make URLs clickable in messages
  const linkifyText = (text: string) => {
    if (!text) return text;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    
    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="whatsapp-link"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  // Internal Audio Component for a premium feel
  const VoiceMessage = ({ msg, direction }: { msg: InboxMessage, direction: string }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState<number | null>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);

    const togglePlay = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (audioRef.current) {
        if (isPlaying) {
          audioRef.current.pause();
        } else {
          audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
      }
    };

    const formatTime = (time: number) => {
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const onTimeUpdate = () => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
      }
    };

    const onLoadedMetadata = () => {
      if (audioRef.current) {
        setDuration(audioRef.current.duration);
      }
    };

    // Calculate progress as percentage for the green dot
    const progress = (currentTime / (duration || 1)) * 100;

    const messageAvatar = direction === "outbound" 
      ? profile?.avatar_url 
      : (msg.sender_avatar || selected?.contact?.avatar_url);

    return (
      <div className="audio-player-premium">
        <audio 
          ref={audioRef} 
          src={msg.media_url!} 
          onEnded={() => setIsPlaying(false)}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          onTimeUpdate={onTimeUpdate}
          onLoadedMetadata={onLoadedMetadata}
        />
        
        <button 
          onClick={togglePlay}
          className="text-white opacity-80 hover:opacity-100 transition-opacity"
        >
          {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
        </button>

        <div className="waveform-dots-container">
          <div className="flex-1 flex gap-[3px]">
            {[...Array(30)].map((_, i) => (
              <div 
                key={i} 
                className={`w-[2px] h-3 rounded-full transition-all ${progress > (i / 30) * 100 ? "bg-[#00a884]" : "bg-white/20"}`}
                style={{ height: `${Math.random() * 8 + 4}px` }}
              />
            ))}
          </div>
          {/* Progress Dot */}
          <div 
            className="audio-waveform-dot"
            style={{ left: `${Math.max(0, Math.min(progress, 98))}%` }}
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[9px] opacity-60 font-mono">
            {formatTime(currentTime || duration || 0)}
          </span>
          <div className="relative">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 bg-slate-800 flex items-center justify-center">
              {messageAvatar ? (
                <img 
                  src={messageAvatar} 
                  className="w-full h-full object-cover" 
                  alt="" 
                />
              ) : (
                <User className="w-5 h-5 text-white/40" />
              )}
            </div>
            <div className="mic-badge">
              <Mic className="w-2.5 h-2.5" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Renders the full content of a message bubble
  const renderMessageContent = (msg: InboxMessage) => {
    const isAudio = msg.media_type?.startsWith("audio") || msg.media_type?.includes("ogg") || msg.media_type?.includes("mpeg");
    const isImage = msg.media_type?.startsWith("image");
    const isPdf   = msg.media_type?.includes("pdf");
    const isVideo = msg.media_type?.startsWith("video");
    const isDoc   = msg.media_url && !isAudio && !isImage && !isPdf && !isVideo;

    // Improved filename detection prioritizing stored file_name
    const getFileName = () => {
      if (msg.file_name) return msg.file_name;
      if (isPdf) return "documento.pdf";
      const ext = msg.media_type?.split("/")[1] || "arquivo";
      return `arquivo.${ext}`;
    };

    return (
      <div className="w-full flex flex-col">
        {/* Forwarded badge */}
        {msg.forwarded && (
          <div className="forwarded-indicator">
            <Forward className="w-3 h-3 rotate-180 scale-x-[-1]" />
            <span>Encaminhada</span>
          </div>
        )}

        {/* Sender Info for Groups (Styled Teal label) */}
        {!msg.direction?.includes("outbound") && msg.sender_name && (
          <div className="whatsapp-sender-name">{msg.sender_name}</div>
        )}

        {/* Image with WhatsApp-style tight padding and overlay timestamp */}
        {isImage && msg.media_url && (
          <div className="relative rounded-[8px] overflow-hidden cursor-pointer group">
            <img 
              src={msg.media_url} 
              alt="Mídia" 
              className="w-full max-w-[340px] h-auto object-cover transition-transform group-hover:scale-105" 
            />
            {/* Subtle interactive overlay */}
            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
            
            {/* Bottom Gradient for Timestamp visibility */}
            <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black/60 to-transparent pointer-events-none z-10" />
            
            {/* Inner Timestamp */}
            {msg.created_at && (
              <div className="absolute bottom-1 right-2 text-[10px] text-white/90 drop-shadow-md z-20 font-medium">
                {format(new Date(msg.created_at), "HH:mm")}
              </div>
            )}
          </div>
        )}

        {/* Audio player */}
        {isAudio && msg.media_url && (
          <VoiceMessage msg={msg} direction={msg.direction || "inbound"} />
        )}

        {/* PDF / Document card (WhatsApp Native) */}
        {(isPdf || isDoc) && msg.media_url && (
          <div 
            className="flex items-center gap-3 bg-black/10 hover:bg-black/20 transition-colors cursor-pointer -mx-[12px] -mt-[8px] px-3 py-3 rounded-t-[10px] group"
            onClick={() => window.open(msg.media_url, "_blank")}
            title="Clique para baixar ou visualizar"
          >
            {/* Native Red Badge */}
            <div className="relative w-[34px] h-[40px] rounded-sm bg-[#e53935] flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 w-3 h-3 bg-white/20" style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }} />
              <span className="text-[9px] font-bold text-white uppercase">{msg.media_type?.split("/")[1]?.slice(0, 3) || "DOC"}</span>
            </div>
            
            <div className="flex-1 min-w-0 pr-1">
              <p className="text-[14px] font-medium truncate leading-tight text-white/95">{getFileName()}</p>
              <p className="text-[12px] text-white/60 font-normal mt-0.5">
                {msg.media_type?.split("/")[1]?.toUpperCase().slice(0, 4) || "PDF"} • {(Math.random() * 5 + 1).toFixed(1)} MB
              </p>
            </div>
            
            <div className="w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10 shrink-0">
              <Download className="w-4 h-4 text-white/80" />
            </div>
          </div>
        )}


        {/* Text content with linkified URLs */}
        {msg.content && !["🎤 Áudio","🎥 Vídeo","📷 Imagem","📄 PDF","📎 Arquivo"].includes(msg.content) && (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {linkifyText(msg.content)}
          </p>
        )}

        {/* Integrated Timestamp (Hidden for Images as they have their own inner timestamp) */}
        {msg.created_at && !isImage && (
          <div className="message-timestamp-inside">
            {format(new Date(msg.created_at), "HH:mm")}
          </div>
        )}
      </div>
    );
  };



  if (loading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <div className="text-muted-foreground">Carregando conversas...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] w-full overflow-hidden bg-slate-50/50 dark:bg-slate-950/20">
      <div className="flex flex-1 w-full overflow-hidden">
        {/* Conversation List */}
        <div className="w-[380px] border-r flex flex-col bg-slate-100/40 dark:bg-slate-900/40 backdrop-blur-sm">
          <div className="p-6 border-b space-y-4">
            <h2 className="font-bold text-xl tracking-tight">Inbox WhatsApp</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar contato..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 rounded-xl glass-input border-0"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            {filtered.map((conv) => (
              <motion.button
                key={conv.id}
                onClick={() => handleSelectConversation(conv.id)}
                className={`w-full text-left p-4 rounded-xl mb-1 transition-all duration-200 ${
                  selectedId === conv.id 
                    ? "bg-white dark:bg-slate-800 shadow-sm border-l-4 border-l-accent ring-1 ring-black/5" 
                    : "hover:bg-slate-200/50 dark:hover:bg-slate-800/30"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="relative w-11 h-11 shrink-0">
                    <div className="w-full h-full rounded-full bg-primary/5 border border-border flex items-center justify-center text-sm font-semibold overflow-hidden">
                      {conv.contact?.avatar_url ? (
                        <img src={conv.contact.avatar_url} className="w-full h-full object-cover" alt="" />
                      ) : (
                        getInitials(getContactName(conv))
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`font-medium text-sm truncate ${conv.unread_count > 0 ? "font-semibold" : ""}`}>
                        {getContactName(conv)}
                      </span>
                      {conv.last_message_at && (
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(conv.last_message_at), "HH:mm")}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className={`text-xs truncate ${conv.unread_count > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                        {conv.last_message || "Sem mensagens"}
                      </p>
                      {conv.unread_count > 0 && selectedId !== conv.id && (
                        <span className="w-5 h-5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col relative bg-white/30 dark:bg-slate-900/20 overflow-hidden">
          {selected ? (
            <>
              {/* Chat Header */}
              <div className="px-6 py-4 border-b glass-panel flex items-center justify-between z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shrink-0 shadow-sm">
                <div 
                  className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-1 rounded-lg transition-colors"
                  onClick={() => setShowDetails(true)}
                >
                  <div className="relative w-10 h-10 shrink-0">
                    <div className="w-full h-full rounded-full bg-primary/10 border border-border flex items-center justify-center overflow-hidden">
                      {selected.contact?.avatar_url ? (
                        <img 
                          src={selected.contact.avatar_url} 
                          className="w-full h-full object-cover" 
                          alt=""
                        />
                      ) : (
                        <User className="w-5 h-5 opacity-40" />
                      )}
                    </div>
                  </div>
                  <div>
                    <h2 className="font-semibold text-sm leading-tight">
                      {getContactName(selected)}
                    </h2>
                    <p className="text-[11px] text-muted-foreground">
                      {selected.contact?.status || "Disponível"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="rounded-full w-9 h-9">
                    <Video className="w-4 h-4 opacity-70" />
                  </Button>
                  <Button variant="ghost" size="icon" className="rounded-full w-9 h-9">
                    <Phone className="w-4 h-4 opacity-70" />
                  </Button>
                  <div className="w-[1px] h-4 bg-border mx-1" />
                  <Button variant="ghost" size="icon" className="rounded-full w-9 h-9">
                    <Search className="w-4 h-4 opacity-70" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`rounded-full w-9 h-9 ${showDetails ? "bg-accent/10 text-accent" : ""}`}
                    onClick={() => setShowDetails(!showDetails)}
                  >
                    <MoreVertical className="w-4 h-4 opacity-70" />
                  </Button>
                </div>
              </div>

              {/* Messages Area - ONLY THIS SCROLLS */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-background/40 custom-scrollbar">
                <AnimatePresence>
                  {messages.map((msg, i) => {
                    const isGroup = selected?.channel === "whatsapp" && selected.contact?.source === "whatsapp_group";
                    const prevMsg = messages[i - 1];
                    const isSequential = prevMsg && prevMsg.phone === msg.phone && prevMsg.sender_name === msg.sender_name;
                    const isOutbound = msg.direction === "outbound";
                    
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex w-full ${isOutbound ? "justify-end" : "justify-start"} ${isSequential ? "mt-[2px]" : "mt-3"}`}
                      >
                        <div className="flex items-end gap-2 max-w-[85%]">
                          {/* Group Chat Avatar (Only show for first sequential inbound msg) */}
                          {!isOutbound && isGroup && (
                            <div className="w-8 shrink-0">
                              {!isSequential && (
                                <div className="avatar-mini overflow-hidden bg-primary/10">
                                  {msg.sender_avatar ? (
                                    <img src={msg.sender_avatar} className="w-full h-full object-cover" alt="" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-primary opacity-40">
                                      {msg.sender_name?.slice(0, 1) || "?"}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          <div className={
                            `whatsapp-bubble-dark ${isOutbound ? "whatsapp-outbound" : "whatsapp-inbound"} ` +
                            `${msg.media_type?.startsWith("image") ? "p-[3px] sm:p-[3px]" : ""} ` +
                            `${isSequential ? (isOutbound ? "rounded-tr-md" : "rounded-tl-md") : ""}`
                          }>
                            {/* Hide sender name if sequential */}
                            {renderMessageContent({
                              ...msg,
                              sender_name: isGroup && !isSequential && !isOutbound ? msg.sender_name : null
                            })}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                <div ref={chatEndRef} />
              </div>

              <div className="p-6 pt-2 shrink-0">
                <div className="px-4 py-3 rounded-2xl flex gap-3 items-center bg-white dark:bg-slate-900 shadow-xl border border-border/50 backdrop-blur-xl">
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 shrink-0 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <Plus className="w-5 h-5 text-slate-600 dark:text-slate-400" strokeWidth={2.5} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 mb-4 shadow-2xl border-border/40 backdrop-blur-2xl">
                      <DropdownMenuItem className="rounded-xl gap-4 py-3 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                          <ImageIcon className="w-4 h-4 text-blue-500" />
                        </div>
                        <span className="font-medium text-sm">Fotos e vídeos</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="rounded-xl gap-4 py-3 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center">
                          <FileIcon className="w-4 h-4 text-indigo-500" />
                        </div>
                        <span className="font-medium text-sm">Documento</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Input
                    placeholder="Digite uma mensagem..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={sending}
                    className="flex-1 rounded-xl bg-transparent border-0 h-11 px-2 text-sm focus-visible:ring-0 placeholder:text-slate-400"
                  />
                  <Button
                    size="icon"
                    className="rounded-full h-11 w-11 shadow-lg bg-accent hover:bg-accent/90 shrink-0 transform active:scale-95 transition-all text-accent-foreground"
                    onClick={handleSend}
                    disabled={sending || !newMessage.trim()}
                  >
                    <Send className="w-4 h-4" strokeWidth={2.5} />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
              <MessageSquare className="w-12 h-12 opacity-30" />
              <p>Selecione uma conversa</p>
            </div>
          )}
        </div>

        {/* Contact Details Sidebar */}
        <AnimatePresence>
          {selected && showDetails && (
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 340, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l glass-panel flex flex-col h-full bg-background/30 backdrop-blur-md overflow-hidden shrink-0"
            >
              <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-background/50 backdrop-blur-sm z-10">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" onClick={() => setShowDetails(false)} className="rounded-full w-8 h-8">
                    <X className="w-4 h-4" />
                  </Button>
                  <h3 className="font-semibold text-sm">Dados do contato</h3>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-8 flex flex-col items-center border-b border-border/30 bg-background/20">
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="w-32 h-32 rounded-full overflow-hidden border-4 border-background shadow-2xl mb-4 cursor-pointer relative group"
                    onClick={() => setIsImageModalOpen(true)}
                  >
                    {selected.contact?.avatar_url ? (
                      <img src={selected.contact.avatar_url} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="w-full h-full bg-primary/5 flex items-center justify-center">
                        <User className="w-12 h-12 opacity-20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Search className="w-6 h-6 text-white" />
                    </div>
                  </motion.div>
                  
                  <div className="text-center w-full px-2">
                    {isEditing ? (
                      <Input 
                        value={editedName} 
                        onChange={(e) => setEditedName(e.target.value)}
                        className="h-9 text-center bg-background/50 border-accent/30 text-lg font-semibold mb-2"
                        autoFocus
                      />
                    ) : (
                      <h2 className="text-xl font-semibold mb-1 truncate">{getContactName(selected)}</h2>
                    )}
                    <p className="text-muted-foreground text-sm flex items-center justify-center gap-2">
                      <Phone className="w-3 h-3" />
                      {getContactPhone(selected) || "Sem número"}
                    </p>
                  </div>
                </div>

                <div className="p-5 border-b border-border/30">
                  <h4 className="text-[11px] font-bold text-accent uppercase tracking-wider mb-2">Recado</h4>
                  <p className="text-sm text-muted-foreground/80 italic">
                    {selected.contact?.status || "Disponível"}
                  </p>
                </div>

                <div className="p-5 border-b border-border/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-bold text-accent uppercase tracking-wider">Anotações do CRM</h4>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 w-7 p-0 rounded-full"
                      onClick={() => isEditing ? handleSaveContact() : setIsEditing(true)}
                    >
                      {isEditing ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Pencil className="w-3.5 h-3.5 opacity-40 hover:opacity-100" />}
                    </Button>
                  </div>
                  
                  {isEditing ? (
                    <Textarea 
                      value={editedNotes}
                      onChange={(e) => setEditedNotes(e.target.value)}
                      placeholder="Adicione notas sobre este cliente..."
                      className="text-xs min-h-[100px] bg-background/50 border-accent/20 rounded-xl resize-none"
                    />
                  ) : (
                    <div className="p-3 rounded-xl bg-muted/20 border border-border/30 min-h-[60px]">
                      <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {selected.contact?.notes || "Nenhuma nota adicionada ainda."}
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-5 border-b border-border/30">
                  <div className="flex items-center gap-2 mb-4">
                    <Bot className="w-3.5 h-3.5 text-accent" />
                    <h4 className="text-[11px] font-bold text-accent uppercase tracking-wider">Análise da IA</h4>
                  </div>
                  <div className="bg-accent/5 rounded-xl p-4 border border-accent/10">
                    <p className="text-xs leading-relaxed text-muted-foreground italic mb-3">
                      {selected.ai_summary || "Análise indisponível."}
                    </p>
                    {selected.ai_intent && (
                      <Badge variant="outline" className="text-[10px] rounded-full border-accent/20 bg-accent/5 text-accent px-3 py-0.5">
                        Intenção: {selected.ai_intent}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="p-5 space-y-2">
                  <Button variant="outline" className="w-full text-xs h-10 rounded-xl justify-between group" onClick={() => navigate("/pipeline")}>
                    Ver no Pipeline
                    <ChevronRight className="w-3.5 h-3.5 opacity-30 group-hover:opacity-100 transition-opacity" />
                  </Button>
                  <Button variant="outline" className="w-full text-xs h-10 rounded-xl justify-between group" onClick={() => navigate("/followup")}>
                    Agendar Follow-up
                    <ChevronRight className="w-3.5 h-3.5 opacity-30 group-hover:opacity-100 transition-opacity" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Image Lightbox */}
        <AnimatePresence>
          {isImageModalOpen && selected?.contact?.avatar_url && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
              onClick={() => setIsImageModalOpen(false)}
            >
              <Button variant="ghost" size="icon" className="absolute top-6 right-6 text-white hover:bg-white/10 rounded-full">
                <X className="w-6 h-6" />
              </Button>
              <motion.img 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                src={selected.contact.avatar_url} 
                className="max-w-full max-h-full object-contain rounded-lg"
                alt="Profile"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default InboxPage;
