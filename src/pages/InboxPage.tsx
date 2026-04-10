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
  Paperclip,
  Trash2,
  Reply,
  MapPin,
  Smile,
  CheckCheck,
  Star
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { useInbox } from "@/hooks/useInbox";
import type { InboxMessage } from "@/hooks/useInbox";
import { useQuickReplies } from "@/hooks/useQuickReplies";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Textarea } from "@/components/ui/textarea";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const InboxPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    conversations,
    messages,
    setMessages,
    selectedId,
    setSelectedId,
    sendMessage,
    sendMedia,
    markAsRead,
    markConversationUnread,
    updateContact,
    loading,
    sending,
  } = useInbox();

  const { data: profile } = useProfile();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [newMessage, setNewMessage] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedNotes, setEditedNotes] = useState("");
  
  // Quick Replies State
  const { quickReplies } = useQuickReplies();
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [quickReplyFilter, setQuickReplyFilter] = useState("");
  const [selectedQuickIndex, setSelectedQuickIndex] = useState(0);

  // Search in chat
  const [chatSearch, setChatSearch] = useState("");
  const [showChatSearch, setShowChatSearch] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Forward state
  const [forwardingMsg, setForwardingMsg] = useState<InboxMessage | null>(null);
  const [forwardSearch, setForwardSearch] = useState("");

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRecorderRef = useRef<{ recorder: MediaRecorder | null; stream: MediaStream | null; chunks: Blob[]; canceled: boolean }>({
    recorder: null,
    stream: null,
    chunks: [],
    canceled: false,
  });

  // Reply State
  const [replyingTo, setReplyingTo] = useState<InboxMessage | null>(null);

  // Pending Media State
  const [pendingMedia, setPendingMedia] = useState<{ url: string, type: string, name: string, file: File } | null>(null);
  const [mediaCaption, setMediaCaption] = useState("");

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_DIMENSION = 1600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIMENSION) {
            height *= MAX_DIMENSION / width;
            width = MAX_DIMENSION;
          }
        } else {
          if (height > MAX_DIMENSION) {
            width *= MAX_DIMENSION / height;
            height = MAX_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = reject;
    });
  };

  const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSendPendingMedia = async () => {
    if (!pendingMedia || sending) return;
    
    // Capture state values before nullifying
    const mediaToProcess = pendingMedia;
    const captionToSend = mediaCaption;
    const replyId = replyingTo?.external_id || replyingTo?.id;

    // Immediately hide the UI preview overlay for snappy feedback
    setPendingMedia(null);
    setMediaCaption("");
    setReplyingTo(null);

    // Process the heavy compression in the background queue
    setTimeout(async () => {
      let finalBase64 = "";
      if (mediaToProcess.type === "image" && !mediaToProcess.file.type.includes("gif")) {
        finalBase64 = await compressImage(mediaToProcess.file);
      } else {
        finalBase64 = await getBase64(mediaToProcess.file);
      }

      await sendMedia(captionToSend, finalBase64, mediaToProcess.type, mediaToProcess.name, replyId);
      
      // Clean up Blob memory
      if (mediaToProcess.url.startsWith("blob:")) URL.revokeObjectURL(mediaToProcess.url);
    }, 10);
  };

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

  // Delete message handler
  const handleDeleteMessage = async (msg: InboxMessage, forEveryone: boolean = false) => {
    if (!selectedId) return;
    try {
      if (forEveryone && msg.external_id) {
        // Call Evolution API to delete for everyone
        await supabase.functions.invoke("whatsapp-send", {
          body: { 
            conversation_id: selectedId, 
            action: "delete",
            messageId: msg.external_id 
          }
        });
      }
      // Always remove locally
      const { error } = await supabase.from("messages").delete().eq("id", msg.id);
      if (!error) {
        // Remove from local state immediately
        setMessages(prev => prev.filter(m => m.id !== msg.id));
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // Forward message handler
  const handleForwardMessage = async (msg: InboxMessage, targetConvId: string) => {
    try {
      if (msg.media_url && msg.media_type) {
        await supabase.functions.invoke("whatsapp-send", {
          body: { 
            conversation_id: targetConvId, 
            text: msg.content || "",
            media: msg.media_url,
            mediaType: msg.media_type,
            fileName: msg.file_name
          }
        });
      } else {
        await supabase.functions.invoke("whatsapp-send", {
          body: { conversation_id: targetConvId, text: msg.content }
        });
      }
      setForwardingMsg(null);
      setForwardSearch("");
      toast({ title: "Mensagem encaminhada" });
    } catch (err) {
      console.error("Forward error:", err);
      toast({ title: "Erro ao encaminhar", variant: "destructive" });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedId) return;

    let mediaType = "document";
    if (file.type.startsWith("image/")) mediaType = "image";
    else if (file.type.startsWith("video/")) mediaType = "video";
    const objectUrl = URL.createObjectURL(file);
    setPendingMedia({ url: objectUrl, type: mediaType, name: file.name, file });
    
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (videoInputRef.current) videoInputRef.current.value = "";
    if (docInputRef.current) docInputRef.current.value = "";
  };

  const handleSaveContact = async () => {
    if (!selected?.contact?.id) return;
    const success = await updateContact(selected.contact.id, {
      name: editedName,
      notes: editedNotes
    } as any);
    if (success) setIsEditing(false);
  };

  const handleToggleStar = async (msg: InboxMessage) => {
    // Optimistic update
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_starred: !msg.is_starred } : m));
    
    const { error } = await supabase
      .from("messages")
      .update({ is_starred: !msg.is_starred })
      .eq("id", msg.id);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a sinalização.",
        variant: "destructive",
      });
      // Revert if error
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_starred: msg.is_starred } : m));
    }
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
    if (!newMessage.trim() && !replyingTo) return;
    if (sending) return;
    const text = newMessage;
    setNewMessage("");
    await sendMessage(text, replyingTo?.external_id || replyingTo?.id);
    setReplyingTo(null);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      audioRecorderRef.current = { recorder, stream, chunks: [], canceled: false };

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioRecorderRef.current.chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const { chunks, canceled } = audioRecorderRef.current;
        stream.getTracks().forEach(t => t.stop());
        
        if (!canceled && chunks.length > 0) {
          const audioBlob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64 = reader.result as string;
            await sendMedia("", base64, "audio", "audio.ogg", replyingTo?.external_id || replyingTo?.id);
            setReplyingTo(null);
          };
        }
        setIsRecording(false);
        setRecordingTime(0);
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      };

      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (err) {
      console.error("Microphone error:", err);
    }
  };

  const stopRecording = (cancel: boolean = false) => {
    const { recorder } = audioRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      audioRecorderRef.current.canceled = cancel;
      recorder.stop();
    }
  };

  // Format recording time (MM:SS)
  const formatRecordingTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showQuickReplies) {
      const filtered = quickReplies.filter(qr => qr.shortcut.toLowerCase().includes(quickReplyFilter.toLowerCase()));
      
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedQuickIndex(prev => (prev + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedQuickIndex(prev => (prev - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        if (filtered[selectedQuickIndex]) {
          const content = filtered[selectedQuickIndex].content;
          setNewMessage(content);
          setShowQuickReplies(false);
        }
      } else if (e.key === "Escape") {
        setShowQuickReplies(false);
      }
      return;
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewMessage(val);

    if (val.includes("/")) {
      const parts = val.split("/");
      const lastPart = parts[parts.length - 1];
      if (!lastPart.includes(" ")) {
        setQuickReplyFilter(lastPart);
        setShowQuickReplies(true);
        setSelectedQuickIndex(0);
      } else {
        setShowQuickReplies(false);
      }
    } else {
      setShowQuickReplies(false);
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

  // Render read receipt ticks for outbound messages
  const renderTicks = (msg: InboxMessage) => {
    if (msg.direction !== "outbound") return null;
    const ack = msg.ack ?? 0;
    if (ack >= 3) {
      // Read - double blue ticks
      return <CheckCheck className="w-[14px] h-[14px] text-[#53bdeb] shrink-0" strokeWidth={2.5} />;
    } else if (ack >= 2) {
      // Delivered - double grey ticks
      return <CheckCheck className="w-[14px] h-[14px] text-white/50 shrink-0" strokeWidth={2.5} />;
    } else if (ack >= 1) {
      // Sent - single grey tick
      return <Check className="w-[14px] h-[14px] text-white/50 shrink-0" strokeWidth={2.5} />;
    }
    // Pending
    return <div className="w-3 h-3 border border-white/30 rounded-full shrink-0 animate-pulse" />;
  };

  const filteredMessages = messages.filter(m => 
    !chatSearch || m.content?.toLowerCase().includes(chatSearch.toLowerCase())
  );

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
            
            {/* Inner Timestamp + Ticks */}
            {msg.created_at && (
              <div className="absolute bottom-1 right-2 text-[10px] text-white/90 drop-shadow-md z-20 font-medium flex items-center gap-1">
                {format(new Date(msg.created_at), "HH:mm")}
                {renderTicks(msg)}
              </div>
            )}
          </div>
        )}

        {/* Video with WhatsApp-style player */}
        {isVideo && msg.media_url && (
          <div className="relative rounded-[8px] overflow-hidden cursor-pointer group">
            <video 
              src={msg.media_url} 
              className="w-full max-w-[340px] h-auto object-cover rounded-[8px]" 
              controls
              preload="metadata"
            />
            {/* Bottom Gradient for Timestamp */}
            <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black/60 to-transparent pointer-events-none z-10" />
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

        {/* Integrated Timestamp + Ticks (Hidden for Images/Videos as they have their own inner timestamp) */}
        {msg.created_at && !isImage && !isVideo && (
          <div className="message-timestamp-inside flex items-center gap-1">
            {format(new Date(msg.created_at), "HH:mm")}
            {renderTicks(msg)}
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
              <ContextMenu key={conv.id}>
                <ContextMenuTrigger>
                  <motion.button
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
                          {conv.is_typing ? (
                            <span className="text-[11px] text-[#00a884] font-medium flex items-center gap-1 animate-pulse italic">
                              Digitando...
                            </span>
                          ) : (
                            <p className={`text-xs truncate ${conv.unread_count > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                              {conv.last_message || "Sem mensagens"}
                            </p>
                          )}
                          {conv.unread_count > 0 && selectedId !== conv.id && (
                            <span className="w-5 h-5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center">
                              {conv.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-48 rounded-xl shadow-xl">
                  <ContextMenuItem className="gap-3 py-2 cursor-pointer" onClick={() => handleSelectConversation(conv.id)}>
                    <MessageSquare className="w-4 h-4" /> Abrir conversa
                  </ContextMenuItem>
                  <ContextMenuItem className="gap-3 py-2 cursor-pointer" onClick={() => markConversationUnread(conv.id)}>
                    <Check className="w-4 h-4" /> Marcar como não lida
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
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
                    {selected.is_typing ? (
                      <p className="text-[11px] text-[#00a884] font-medium animate-pulse flex items-center gap-1">
                        <span className="flex gap-0.5">
                          <span className="w-0.5 h-0.5 bg-[#00a884] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                          <span className="w-0.5 h-0.5 bg-[#00a884] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                          <span className="w-0.5 h-0.5 bg-[#00a884] rounded-full animate-bounce"></span>
                        </span>
                        Digitando...
                      </p>
                    ) : (
                      <p className="text-[11px] text-muted-foreground">
                        {selected.contact?.status || "Disponível"}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <AnimatePresence>
                    {showChatSearch && (
                      <motion.div 
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 200, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        className="mr-2"
                      >
                        <Input 
                          placeholder="Pesquisar mensagens..."
                          value={chatSearch}
                          onChange={(e) => setChatSearch(e.target.value)}
                          className="h-9 text-xs rounded-full bg-slate-100 dark:bg-slate-800 border-0 focus-visible:ring-1 focus-visible:ring-accent/30"
                          autoFocus
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`rounded-full w-9 h-9 ${showChatSearch ? "bg-accent/10 text-accent" : ""}`}
                    onClick={() => {
                      if (showChatSearch) setChatSearch("");
                      setShowChatSearch(!showChatSearch);
                    }}
                  >
                    <Search className="w-4 h-4 opacity-70" />
                  </Button>
                  
                  <div className="w-[1px] h-4 bg-border mx-1" />
                  
                  <Button variant="ghost" size="icon" className="rounded-full w-9 h-9">
                    <Video className="w-4 h-4 opacity-70" />
                  </Button>
                  <Button variant="ghost" size="icon" className="rounded-full w-9 h-9">
                    <Phone className="w-4 h-4 opacity-70" />
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

              {/* Main Content Toggle */}
              {!pendingMedia ? (
                <>
                  {/* Messages Area - ONLY THIS SCROLLS */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-background/40 custom-scrollbar">
                <AnimatePresence>
                  {filteredMessages.map((msg, i) => {
                    const isGroup = selected?.channel === "whatsapp" && selected.contact?.source === "whatsapp_group";
                    const prevMsg = messages[i - 1];
                    const isSequential = prevMsg && prevMsg.phone === msg.phone && prevMsg.sender_name === msg.sender_name;
                    const isOutbound = msg.direction === "outbound";
                    
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex w-full group/msg ${isOutbound ? "justify-end" : "justify-start"} ${isSequential ? "mt-[2px]" : "mt-3"}`}
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
                            `relative whatsapp-bubble-dark ${isOutbound ? "whatsapp-outbound" : "whatsapp-inbound"} ` +
                            `${(msg.media_type?.startsWith("image") || msg.media_type?.startsWith("video")) ? "p-[3px] sm:p-[3px]" : ""} ` +
                            `${isSequential ? (isOutbound ? "rounded-tr-md" : "rounded-tl-md") : ""}`
                          }>
                            {/* Actions Dropdown */}
                            <div className={`absolute top-0 opacity-0 group-hover/msg:opacity-100 transition-opacity z-20 ${isOutbound ? "left-0 -translate-x-full pr-2" : "right-0 translate-x-full pl-2"}`}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-background/50 hover:bg-background backdrop-blur-sm shadow-sm border border-border/50">
                                    <ChevronRight className="w-4 h-4 text-muted-foreground rotate-90" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align={isOutbound ? "end" : "start"} className="w-48 rounded-xl shadow-xl">
                                  <DropdownMenuItem className="gap-3 py-2 cursor-pointer" onClick={() => setReplyingTo(msg)}>
                                    <Reply className="w-4 h-4" /> Responder
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="gap-3 py-2 cursor-pointer" onClick={() => setForwardingMsg(msg)}>
                                    <Forward className="w-4 h-4" /> Encaminhar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="gap-3 py-2 cursor-pointer" onClick={() => handleToggleStar(msg)}>
                                    <Star className={`w-4 h-4 ${msg.is_starred ? "fill-yellow-400 text-yellow-400" : ""}`} /> 
                                    {msg.is_starred ? "Remover sinalização" : "Sinalizar"}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="gap-3 py-2 cursor-pointer" onClick={() => handleDeleteMessage(msg, false)}>
                                    <Trash2 className="w-4 h-4" /> Apagar para mim
                                  </DropdownMenuItem>
                                  {isOutbound && msg.external_id && (
                                    <DropdownMenuItem className="gap-3 py-2 text-red-500 hover:text-red-600 focus:text-red-600 cursor-pointer" onClick={() => handleDeleteMessage(msg, true)}>
                                      <Trash2 className="w-4 h-4" /> Apagar para todos
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

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
                {replyingTo && (
                  <div className="mx-2 mb-2 p-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-xl border-l-4 border-l-[#00a884] flex items-start justify-between shadow-sm animate-in slide-in-from-bottom-2">
                    <div className="flex-1 overflow-hidden pr-2">
                      <p className="text-xs font-bold text-[#00a884] mb-0.5">{replyingTo.sender_name || getContactName(selected)}</p>
                      <p className="text-xs text-muted-foreground truncate">{replyingTo.content || "Mídia anexa"}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full shrink-0" onClick={() => setReplyingTo(null)}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}
                <div className="px-4 py-3 rounded-2xl flex gap-3 items-center bg-white dark:bg-slate-900 shadow-xl border border-border/50 backdrop-blur-xl">
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileUpload} />
                  <input type="file" ref={docInputRef} className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar" onChange={handleFileUpload} />
                  
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
                      <DropdownMenuItem className="rounded-xl gap-4 py-3 cursor-pointer" onClick={() => docInputRef.current?.click()}>
                        <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center">
                          <FileIcon className="w-4 h-4 text-indigo-500" />
                        </div>
                        <span className="font-medium text-sm">Documento</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="rounded-xl gap-4 py-3 cursor-pointer">
                        <div className="w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center">
                          <User className="w-4 h-4 text-teal-500" />
                        </div>
                        <span className="font-medium text-sm">Contato</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Input or Recording UI */}
                  {isRecording ? (
                    <div className="flex-1 flex items-center gap-4 bg-red-50/50 dark:bg-red-950/20 px-4 py-1.5 rounded-xl border border-red-100 dark:border-red-900/30">
                      <div className="flex items-center gap-2 text-red-500 animate-pulse">
                        <Mic className="w-4 h-4" />
                        <span className="text-sm font-medium font-mono">{formatRecordingTime(recordingTime)}</span>
                      </div>
                      <span className="text-sm text-red-500/70 flex-1 opacity-70">Gravando áudio...</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => stopRecording(true)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 h-8 px-3 rounded-lg"
                      >
                        Cancelar
                      </Button>
                    </div>
                  ) : (
                  {/* Quick Replies Selector */}
                  {showQuickReplies && (
                    <div className="absolute bottom-[calc(100%+8px)] left-0 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-border/40 overflow-hidden z-[100] animate-in slide-in-from-bottom-2">
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-b flex justify-between items-center text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                        <span>Respostas Rápidas</span>
                        <span>{quickReplies.filter(qr => qr.shortcut.includes(quickReplyFilter)).length} encontrados</span>
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        {quickReplies
                          .filter(qr => qr.shortcut.toLowerCase().includes(quickReplyFilter.toLowerCase()))
                          .map((qr, idx) => (
                          <div 
                            key={qr.id}
                            className={`p-3 cursor-pointer transition-colors flex flex-col gap-0.5 ${idx === selectedQuickIndex ? "bg-[#00a884]/10 border-l-4 border-l-[#00a884]" : "hover:bg-slate-50 dark:hover:bg-slate-800"}`}
                            onClick={() => {
                              setNewMessage(qr.content);
                              setShowQuickReplies(false);
                            }}
                          >
                            <span className="text-xs font-bold text-[#00a884]">/{qr.shortcut}</span>
                            <span className="text-[11px] text-muted-foreground truncate">{qr.content}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Input
                    placeholder="Digite uma mensagem..."
                    value={newMessage}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onPaste={(e) => {
                      const items = e.clipboardData?.items;
                      if (!items) return;
                      for (let i = 0; i < items.length; i++) {
                        if (items[i].type.indexOf("image") !== -1) {
                          e.preventDefault();
                          const file = items[i].getAsFile();
                          if (file) {
                            const objectUrl = URL.createObjectURL(file);
                            setPendingMedia({ url: objectUrl, type: "image", name: file.name || "imagem.png", file });
                          }
                        }
                      }
                    }}
                    disabled={sending}
                    className="flex-1 rounded-xl bg-transparent border-0 h-11 px-2 text-sm focus-visible:ring-0 placeholder:text-slate-400"
                  />
                  )}

                  {/* Send or Mic Button */}
                  {newMessage.trim() || replyingTo ? (
                    <Button
                      size="icon"
                      className="rounded-full h-11 w-11 shadow-lg bg-[#00a884] hover:bg-[#008f6f] shrink-0 transform active:scale-95 transition-all text-white"
                      onClick={handleSend}
                      disabled={sending}
                    >
                      <Send className="w-4 h-4 translate-x-[-1px] translate-y-[1px]" strokeWidth={2.5} />
                    </Button>
                  ) : (
                    <Button
                      size="icon"
                      className={`rounded-full h-11 w-11 shadow-lg shrink-0 transform active:scale-95 transition-all text-white ${
                        isRecording 
                          ? "bg-red-500 hover:bg-red-600 animate-pulse" 
                          : "bg-[#00a884] hover:bg-[#008f6f]"
                      }`}
                      onClick={() => isRecording ? stopRecording(false) : startRecording()}
                    >
                      {isRecording ? <Send className="w-4 h-4" /> : <Mic className="w-5 h-5" />}
                    </Button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col bg-[#e9edef] dark:bg-[#0b141a] z-50 animate-in fade-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="h-[60px] flex items-center px-4 gap-4 bg-[#f0f2f5] dark:bg-[#202c33] border-b border-border/10 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => { setPendingMedia(null); setMediaCaption(""); }}>
                  <X className="w-5 h-5 text-muted-foreground" />
                </Button>
                <span className="font-medium text-foreground">Visão de envio</span>
              </div>
              
              {/* Preview Area */}
              <div className="flex-1 min-h-0 overflow-hidden flex items-center justify-center p-4 sm:p-8">
                {pendingMedia.type === "image" ? (
                  <img src={pendingMedia.url} alt="Preview" className="max-w-full max-h-full object-contain drop-shadow-xl rounded-md" />
                ) : pendingMedia.type === "video" ? (
                  <video src={pendingMedia.url} controls className="max-w-full max-h-full rounded-md drop-shadow-xl" />
                ) : (
                  <div className="flex flex-col items-center gap-4 p-8 bg-white dark:bg-[#202c33] rounded-xl shadow-lg">
                    <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center">
                      <FileText className="w-10 h-10" />
                    </div>
                    <span className="font-semibold text-lg">{pendingMedia.name}</span>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-4 bg-[#f0f2f5] dark:bg-[#202c33] flex justify-center pb-8 shrink-0">
                <div className="w-full max-w-2xl relative flex items-end">
                  <Input
                    value={mediaCaption}
                    onChange={(e) => setMediaCaption(e.target.value)}
                    placeholder="Adicione uma legenda..."
                    className="bg-white dark:bg-[#2a3942] border-0 focus-visible:ring-0 text-base h-12 rounded-xl pr-14 custom-scrollbar"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendPendingMedia();
                      }
                    }}
                  />
                  <Button 
                    className="absolute right-2 bottom-1.5 h-9 w-9 rounded-full bg-[#00a884] hover:bg-[#008f6f] text-white flex items-center justify-center p-0"
                    onClick={handleSendPendingMedia}
                    disabled={sending}
                  >
                     <Send className="w-4 h-4 ml-[2px]" />
                  </Button>
                </div>
              </div>
            </div>
          )}
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

                {/* Starred Messages Section */}
                <div className="p-5 border-b border-border/30">
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                    <h4 className="text-[11px] font-bold text-accent uppercase tracking-wider">Mensagens Favoritas</h4>
                  </div>
                  <div className="space-y-3">
                    {messages.filter(m => m.is_starred).length > 0 ? (
                      messages.filter(m => m.is_starred).map(m => (
                        <div key={m.id} className="p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/10 text-xs">
                          <p className="text-muted-foreground line-clamp-3">{m.content || "Mídia"}</p>
                          <div className="mt-2 flex justify-between items-center text-[10px] opacity-60">
                            <span>{m.created_at ? format(new Date(m.created_at), "dd/MM HH:mm") : ""}</span>
                            <span className="bg-yellow-100 text-yellow-700 px-1.5 rounded uppercase font-bold">{m.direction === "outbound" ? "Você" : "Cliente"}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground/60 italic text-center py-2">Nenhuma mensagem favoritada.</p>
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

        {/* Forward Message Modal */}
        <AnimatePresence>
          {forwardingMsg && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => { setForwardingMsg(null); setForwardSearch(""); }}
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-white dark:bg-[#202c33] rounded-2xl shadow-2xl w-full max-w-md max-h-[70vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 border-b flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="rounded-full h-8 w-8" onClick={() => { setForwardingMsg(null); setForwardSearch(""); }}>
                    <X className="w-4 h-4" />
                  </Button>
                  <h3 className="font-semibold text-sm">Encaminhar mensagem</h3>
                </div>
                <div className="p-3 border-b">
                  <Input
                    placeholder="Buscar conversa..."
                    value={forwardSearch}
                    onChange={(e) => setForwardSearch(e.target.value)}
                    className="h-9 rounded-xl text-sm"
                    autoFocus
                  />
                </div>
                <div className="flex-1 overflow-y-auto">
                  {conversations
                    .filter(c => {
                      if (!forwardSearch) return true;
                      const name = c.contact?.name || c.phone || "";
                      return name.toLowerCase().includes(forwardSearch.toLowerCase());
                    })
                    .map(conv => (
                      <button
                        key={conv.id}
                        className="w-full text-left p-3 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors"
                        onClick={() => forwardingMsg && handleForwardMessage(forwardingMsg, conv.id)}
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/10 border border-border flex items-center justify-center text-xs font-semibold overflow-hidden shrink-0">
                          {conv.contact?.avatar_url ? (
                            <img src={conv.contact.avatar_url} className="w-full h-full object-cover" alt="" />
                          ) : (
                            getInitials(getContactName(conv))
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{getContactName(conv)}</p>
                          <p className="text-xs text-muted-foreground truncate">{conv.last_message || "Sem mensagens"}</p>
                        </div>
                        <Forward className="w-4 h-4 text-muted-foreground shrink-0" />
                      </button>
                    ))
                  }
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default InboxPage;
