import { useState, useMemo } from "react";
import { mockVehicles } from "@/data/mockData";
import { Vehicle } from "@/types/crm";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import {
  Search, Plus, Send, Car, Users, MessageSquare, ArrowLeft, Eye,
  Trash2, Edit, ChevronRight, ExternalLink, Copy, CheckCircle2, Hash
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

// Types
interface RepasseGroup {
  id: string;
  name: string;
  whatsapp_group_id: string;
  description: string;
  members_count: number;
  created_at: string;
}

interface RepasseVehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  version: string | null;
  color: string | null;
  km: number | null;
  price: number;
  fipe_price: number;
  blindado: boolean;
  notes: string | null;
  source: "estoque" | "repasse";
  vehicle_id?: string; // ref to inventory vehicle if from estoque
}

interface RepassePost {
  id: string;
  group_id: string;
  vehicle: RepasseVehicle;
  message_text: string;
  sent_at: string;
  status: "draft" | "sent" | "responded";
}

// Mock data
const mockGroups: RepasseGroup[] = [
  { id: "rg1", name: "Repasse Premium SP", whatsapp_group_id: "120363001234567890", description: "Grupo premium de repasse São Paulo - veículos de luxo e blindados", members_count: 87, created_at: "2025-01-15" },
  { id: "rg2", name: "Repasse Geral SP/ABC", whatsapp_group_id: "120363009876543210", description: "Grupo geral de repasse região SP e ABC", members_count: 156, created_at: "2025-02-01" },
  { id: "rg3", name: "Lojistas Multimarcas", whatsapp_group_id: "120363005555555555", description: "Rede de lojistas multimarcas para troca e repasse", members_count: 203, created_at: "2025-02-20" },
];

const mockPosts: RepassePost[] = [
  {
    id: "rp1", group_id: "rg1",
    vehicle: { id: "rv1", make: "Toyota", model: "Corolla Cross", year: 2021, version: "XRX Hybrid", color: "Preto", km: 42000, price: 150000, fipe_price: 250000, blindado: true, notes: "Blindagem NIII-A, garantia até 2026", source: "repasse" },
    message_text: "🔥 OPORTUNIDADE DE REPASSE 🔥\n\n🚗 Toyota Corolla Cross 2021 XRX Hybrid\n🛡️ BLINDADO\n📍 42.000 km | Preto\n\n💰 R$ 150.000\n📊 FIPE: R$ 250.000 (R$ 100.000 ABAIXO DA FIPE!)\n\n📝 Blindagem NIII-A, garantia até 2026\n\n📲 Interessado? Chama no privado!",
    sent_at: "2025-03-08T10:30:00Z", status: "sent",
  },
  {
    id: "rp2", group_id: "rg2",
    vehicle: { id: "rv2", make: "Honda", model: "Civic", year: 2024, version: "Touring", color: "Preto", km: 5000, price: 165000, fipe_price: 185000, blindado: false, notes: null, source: "estoque", vehicle_id: "v2" },
    message_text: "🔥 OPORTUNIDADE DE REPASSE 🔥\n\n🚗 Honda Civic 2024 Touring\n📍 5.000 km | Preto\n\n💰 R$ 165.000\n📊 FIPE: R$ 185.000 (R$ 20.000 ABAIXO DA FIPE!)\n\n📲 Interessado? Chama no privado!",
    sent_at: "2025-03-09T14:00:00Z", status: "responded",
  },
];

function generateRepasseMessage(v: RepasseVehicle): string {
  const diff = v.fipe_price - v.price;
  const diffFormatted = `R$ ${diff.toLocaleString("pt-BR")}`;
  const blindadoLine = v.blindado ? "🛡️ BLINDADO\n" : "";
  const kmLine = v.km ? `📍 ${v.km.toLocaleString("pt-BR")} km` : "📍 0 km";
  const colorLine = v.color ? ` | ${v.color}` : "";
  const notesLine = v.notes ? `\n\n📝 ${v.notes}` : "";

  return `🔥 OPORTUNIDADE DE REPASSE 🔥\n\n🚗 ${v.make} ${v.model} ${v.year}${v.version ? ` ${v.version}` : ""}\n${blindadoLine}${kmLine}${colorLine}\n\n💰 R$ ${v.price.toLocaleString("pt-BR")}\n📊 FIPE: R$ ${v.fipe_price.toLocaleString("pt-BR")} (${diffFormatted} ABAIXO DA FIPE!)${notesLine}\n\n📲 Interessado? Chama no privado!`;
}

const emptyVehicle: Omit<RepasseVehicle, "id"> = {
  make: "", model: "", year: 2024, version: null, color: null, km: null,
  price: 0, fipe_price: 0, blindado: false, notes: null, source: "repasse",
};

const RepassePage = () => {
  const [selectedGroup, setSelectedGroup] = useState<RepasseGroup | null>(null);
  const [search, setSearch] = useState("");
  const [groups, setGroups] = useState<RepasseGroup[]>(mockGroups);
  const [posts, setPosts] = useState<RepassePost[]>(mockPosts);
  const [addGroupOpen, setAddGroupOpen] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [vehicleSource, setVehicleSource] = useState<"estoque" | "repasse">("repasse");
  const [selectedStockVehicle, setSelectedStockVehicle] = useState<string>("");
  const [repasseForm, setRepasseForm] = useState({ ...emptyVehicle });
  const [messageText, setMessageText] = useState("");
  const [groupForm, setGroupForm] = useState({ name: "", whatsapp_group_id: "", description: "" });
  const { toast } = useToast();

  const availableVehicles = mockVehicles.filter(v => v.status === "available");

  const filteredGroups = useMemo(() => {
    return groups.filter(g => g.name.toLowerCase().includes(search.toLowerCase()));
  }, [groups, search]);

  const groupPosts = useMemo(() => {
    if (!selectedGroup) return [];
    return posts.filter(p => p.group_id === selectedGroup.id).sort((a, b) => b.sent_at.localeCompare(a.sent_at));
  }, [selectedGroup, posts]);

  const handleAddGroup = () => {
    if (!groupForm.name.trim()) {
      toast({ title: "Preencha o nome do grupo", variant: "destructive" });
      return;
    }
    const newGroup: RepasseGroup = {
      id: `rg-${Date.now()}`,
      name: groupForm.name.trim(),
      whatsapp_group_id: groupForm.whatsapp_group_id.trim(),
      description: groupForm.description.trim(),
      members_count: 0,
      created_at: new Date().toISOString(),
    };
    setGroups(prev => [newGroup, ...prev]);
    setGroupForm({ name: "", whatsapp_group_id: "", description: "" });
    setAddGroupOpen(false);
    toast({ title: "✅ Grupo criado!", description: `${newGroup.name} adicionado.` });
  };

  const handleOpenSendDialog = () => {
    setVehicleSource("repasse");
    setSelectedStockVehicle("");
    setRepasseForm({ ...emptyVehicle });
    setMessageText("");
    setSendDialogOpen(true);
  };

  const handleSelectStockVehicle = (vehicleId: string) => {
    setSelectedStockVehicle(vehicleId);
    const v = mockVehicles.find(veh => veh.id === vehicleId);
    if (v) {
      const rv: RepasseVehicle = {
        id: `rv-${Date.now()}`,
        make: v.make, model: v.model, year: v.year, version: v.version,
        color: v.color, km: v.km, price: v.price, fipe_price: Math.round(v.price * 1.15),
        blindado: false, notes: v.notes, source: "estoque", vehicle_id: v.id,
      };
      setMessageText(generateRepasseMessage(rv));
    }
  };

  const handleGenerateMessage = () => {
    if (vehicleSource === "repasse") {
      if (!repasseForm.make || !repasseForm.model || !repasseForm.price || !repasseForm.fipe_price) {
        toast({ title: "Preencha marca, modelo, preço e FIPE", variant: "destructive" });
        return;
      }
      const rv: RepasseVehicle = { id: `rv-${Date.now()}`, ...repasseForm };
      setMessageText(generateRepasseMessage(rv));
    }
  };

  const handleSendToGroup = () => {
    if (!messageText.trim()) {
      toast({ title: "Gere a mensagem primeiro", variant: "destructive" });
      return;
    }
    let vehicle: RepasseVehicle;
    if (vehicleSource === "estoque" && selectedStockVehicle) {
      const v = mockVehicles.find(veh => veh.id === selectedStockVehicle)!;
      vehicle = {
        id: `rv-${Date.now()}`, make: v.make, model: v.model, year: v.year, version: v.version,
        color: v.color, km: v.km, price: v.price, fipe_price: Math.round(v.price * 1.15),
        blindado: false, notes: v.notes, source: "estoque", vehicle_id: v.id,
      };
    } else {
      vehicle = { id: `rv-${Date.now()}`, ...repasseForm };
    }
    const newPost: RepassePost = {
      id: `rp-${Date.now()}`, group_id: selectedGroup!.id,
      vehicle, message_text: messageText, sent_at: new Date().toISOString(), status: "sent",
    };
    setPosts(prev => [newPost, ...prev]);
    setSendDialogOpen(false);
    toast({ title: "✅ Mensagem enviada!", description: `Anúncio enviado para ${selectedGroup!.name}` });
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(messageText);
    toast({ title: "Mensagem copiada!" });
  };

  const handleDeleteGroup = (id: string) => {
    setGroups(prev => prev.filter(g => g.id !== id));
    toast({ title: "Grupo removido" });
  };

  // Group list view
  if (!selectedGroup) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="page-header flex items-center justify-between">
          <div>
            <h1>Grupos de Repasse</h1>
            <p>Gerencie grupos de WhatsApp e anuncie veículos de repasse</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setAddGroupOpen(true)} className="rounded-xl gap-2">
              <Plus className="w-4 h-4" /> Novo Grupo
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar grupo..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-9 w-64 rounded-xl bg-card border h-10" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Grupos", value: groups.length, icon: Users, accent: "text-primary" },
            { label: "Anúncios Enviados", value: posts.filter(p => p.status === "sent" || p.status === "responded").length, icon: Send, accent: "text-emerald-600" },
            { label: "Com Resposta", value: posts.filter(p => p.status === "responded").length, icon: MessageSquare, accent: "text-amber-600" },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }} className="stat-card flex items-center gap-4">
              <div className={`p-2.5 rounded-xl bg-secondary ${s.accent}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Group cards */}
        <div className="space-y-3">
          {filteredGroups.map((group, i) => {
            const groupPostCount = posts.filter(p => p.group_id === group.id).length;
            return (
              <motion.div key={group.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setSelectedGroup(group)}
                className="stat-card flex items-center gap-5 cursor-pointer group">
                <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold">{group.name}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                      {group.members_count} membros
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{group.description}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                  <div className="flex items-center gap-1">
                    <Send className="w-3.5 h-3.5" />
                    <span className="font-medium">{groupPostCount} anúncios</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl"
                    onClick={e => { e.stopPropagation(); handleDeleteGroup(group.id); }}>
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </motion.div>
            );
          })}
          {filteredGroups.length === 0 && (
            <div className="stat-card flex flex-col items-center justify-center py-12 text-center">
              <Users className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum grupo cadastrado.</p>
            </div>
          )}
        </div>

        {/* Add Group Dialog */}
        <Dialog open={addGroupOpen} onOpenChange={setAddGroupOpen}>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" /> Novo Grupo de Repasse
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Nome do grupo *</Label>
                <Input placeholder="Ex: Repasse Premium SP" value={groupForm.name}
                  onChange={e => setGroupForm(f => ({ ...f, name: e.target.value }))} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">ID do grupo WhatsApp</Label>
                <Input placeholder="120363001234567890" value={groupForm.whatsapp_group_id}
                  onChange={e => setGroupForm(f => ({ ...f, whatsapp_group_id: e.target.value }))} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Descrição</Label>
                <Textarea placeholder="Descrição do grupo..." value={groupForm.description}
                  onChange={e => setGroupForm(f => ({ ...f, description: e.target.value }))} className="rounded-xl" rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddGroupOpen(false)} className="rounded-xl">Cancelar</Button>
              <Button onClick={handleAddGroup} className="rounded-xl gap-2">
                <Plus className="w-4 h-4" /> Criar Grupo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Group detail view
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <button onClick={() => setSelectedGroup(null)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Voltar para grupos
      </button>

      {/* Group header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="stat-card mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
              <Users className="w-7 h-7 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{selectedGroup.name}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{selectedGroup.description}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {selectedGroup.members_count} membros</span>
                <span className="flex items-center gap-1"><Hash className="w-3.5 h-3.5" /> {selectedGroup.whatsapp_group_id || "Sem ID"}</span>
              </div>
            </div>
          </div>
          <Button onClick={handleOpenSendDialog} className="rounded-xl gap-2">
            <Send className="w-4 h-4" /> Enviar Anúncio
          </Button>
        </div>
      </motion.div>

      {/* Posts */}
      <h3 className="font-semibold text-sm flex items-center gap-2 mb-4">
        <MessageSquare className="w-4 h-4 text-muted-foreground" /> Anúncios Enviados
        {groupPosts.length > 0 && <span className="text-xs font-normal text-muted-foreground">({groupPosts.length})</span>}
      </h3>

      {groupPosts.length === 0 ? (
        <div className="stat-card flex flex-col items-center justify-center py-12 text-center">
          <Send className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum anúncio enviado neste grupo.</p>
          <Button variant="outline" className="mt-4 rounded-xl gap-2" onClick={handleOpenSendDialog}>
            <Plus className="w-4 h-4" /> Enviar primeiro anúncio
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {groupPosts.map((post, i) => {
            const v = post.vehicle;
            const diff = v.fipe_price - v.price;
            const statusColors: Record<string, string> = {
              draft: "bg-muted text-muted-foreground",
              sent: "bg-accent text-accent-foreground",
              responded: "bg-primary/10 text-primary",
            };
            return (
              <motion.div key={post.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }} className="stat-card">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-16 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                    <Car className="w-8 h-8 text-muted-foreground/20" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{v.make} {v.model}</span>
                      <span className="text-sm text-muted-foreground">{v.version} · {v.year}</span>
                      {v.blindado && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20 font-semibold">
                          🛡️ Blindado
                        </span>
                      )}
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${statusColors[post.status]}`}>
                        {post.status === "draft" ? "Rascunho" : post.status === "sent" ? "Enviado" : "Respondido"}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm mb-2">
                      <span className="font-bold text-primary">R$ {v.price.toLocaleString("pt-BR")}</span>
                      <span className="text-muted-foreground">FIPE: R$ {v.fipe_price.toLocaleString("pt-BR")}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        ↓ R$ {diff.toLocaleString("pt-BR")} abaixo
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Enviado em {new Date(post.sent_at).toLocaleDateString("pt-BR")} às {new Date(post.sent_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button size="sm" variant="outline" className="rounded-xl text-xs gap-1.5 h-8"
                      onClick={() => { setMessageText(post.message_text); navigator.clipboard.writeText(post.message_text); toast({ title: "Mensagem copiada!" }); }}>
                      <Copy className="w-3.5 h-3.5" /> Copiar
                    </Button>
                  </div>
                </div>
                {/* Preview da mensagem */}
                <div className="mt-3 p-3 rounded-xl bg-secondary text-xs whitespace-pre-line font-mono">
                  {post.message_text}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Send Dialog */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent className="rounded-2xl max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" /> Enviar Anúncio de Repasse
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Source selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Origem do veículo</Label>
              <div className="flex gap-2">
                <Button variant={vehicleSource === "estoque" ? "default" : "outline"} size="sm" className="rounded-xl text-xs"
                  onClick={() => setVehicleSource("estoque")}>
                  <Car className="w-3.5 h-3.5 mr-1.5" /> Do Estoque
                </Button>
                <Button variant={vehicleSource === "repasse" ? "default" : "outline"} size="sm" className="rounded-xl text-xs"
                  onClick={() => setVehicleSource("repasse")}>
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Cadastrar Repasse
                </Button>
              </div>
            </div>

            {/* From inventory */}
            {vehicleSource === "estoque" && (
              <div className="space-y-1.5">
                <Label className="text-xs">Selecionar veículo do estoque</Label>
                <Select value={selectedStockVehicle} onValueChange={handleSelectStockVehicle}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Escolha um veículo..." /></SelectTrigger>
                  <SelectContent>
                    {availableVehicles.map(v => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.make} {v.model} {v.year} {v.version} — R$ {v.price.toLocaleString("pt-BR")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedStockVehicle && (
                  <div className="space-y-1.5 mt-2">
                    <Label className="text-xs">Valor FIPE (R$) *</Label>
                    <Input type="number" placeholder="250000"
                      onChange={e => {
                        const fipe = parseFloat(e.target.value) || 0;
                        const v = mockVehicles.find(veh => veh.id === selectedStockVehicle);
                        if (v) {
                          const rv: RepasseVehicle = {
                            id: `rv-${Date.now()}`, make: v.make, model: v.model, year: v.year, version: v.version,
                            color: v.color, km: v.km, price: v.price, fipe_price: fipe,
                            blindado: false, notes: v.notes, source: "estoque", vehicle_id: v.id,
                          };
                          setMessageText(generateRepasseMessage(rv));
                        }
                      }} className="rounded-xl" />
                  </div>
                )}
              </div>
            )}

            {/* Custom repasse vehicle */}
            {vehicleSource === "repasse" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Marca *</Label>
                  <Input placeholder="Toyota" value={repasseForm.make}
                    onChange={e => setRepasseForm(f => ({ ...f, make: e.target.value }))} className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Modelo *</Label>
                  <Input placeholder="Corolla Cross" value={repasseForm.model}
                    onChange={e => setRepasseForm(f => ({ ...f, model: e.target.value }))} className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Ano</Label>
                  <Input type="number" value={repasseForm.year}
                    onChange={e => setRepasseForm(f => ({ ...f, year: parseInt(e.target.value) || 2024 }))} className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Versão</Label>
                  <Input placeholder="XRX Hybrid" value={repasseForm.version || ""}
                    onChange={e => setRepasseForm(f => ({ ...f, version: e.target.value || null }))} className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Cor</Label>
                  <Input placeholder="Preto" value={repasseForm.color || ""}
                    onChange={e => setRepasseForm(f => ({ ...f, color: e.target.value || null }))} className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Km</Label>
                  <Input type="number" placeholder="42000" value={repasseForm.km || ""}
                    onChange={e => setRepasseForm(f => ({ ...f, km: parseInt(e.target.value) || null }))} className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Preço de venda (R$) *</Label>
                  <Input type="number" placeholder="150000" value={repasseForm.price || ""}
                    onChange={e => setRepasseForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Valor FIPE (R$) *</Label>
                  <Input type="number" placeholder="250000" value={repasseForm.fipe_price || ""}
                    onChange={e => setRepasseForm(f => ({ ...f, fipe_price: parseFloat(e.target.value) || 0 }))} className="rounded-xl" />
                </div>
                <div className="flex items-center gap-3 col-span-2">
                  <input type="checkbox" checked={repasseForm.blindado}
                    onChange={e => setRepasseForm(f => ({ ...f, blindado: e.target.checked }))}
                    className="rounded" />
                  <Label className="text-xs">🛡️ Veículo blindado</Label>
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs">Observações</Label>
                  <Input placeholder="Blindagem NIII-A, garantia até 2026..." value={repasseForm.notes || ""}
                    onChange={e => setRepasseForm(f => ({ ...f, notes: e.target.value || null }))} className="rounded-xl" />
                </div>
                <div className="col-span-2">
                  <Button variant="outline" onClick={handleGenerateMessage} className="rounded-xl gap-2 w-full">
                    <MessageSquare className="w-4 h-4" /> Gerar Mensagem
                  </Button>
                </div>
              </div>
            )}

            {/* Message preview */}
            {messageText && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Prévia da Mensagem</Label>
                  <Button variant="ghost" size="sm" onClick={handleCopyMessage} className="rounded-xl text-xs gap-1.5 h-7">
                    <Copy className="w-3 h-3" /> Copiar
                  </Button>
                </div>
                <Textarea value={messageText} onChange={e => setMessageText(e.target.value)}
                  rows={10} className="rounded-xl text-xs font-mono" />
                {(() => {
                  const priceMatch = messageText.match(/💰 R\$ ([\d.,]+)/);
                  const fipeMatch = messageText.match(/FIPE: R\$ ([\d.,]+)/);
                  if (priceMatch && fipeMatch) {
                    return (
                      <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-sm">
                        <span className="font-bold text-primary">Destaque:</span> Veículo com desconto em relação à FIPE
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialogOpen(false)} className="rounded-xl">Cancelar</Button>
            <Button onClick={handleSendToGroup} disabled={!messageText.trim()} className="rounded-xl gap-2">
              <Send className="w-4 h-4" /> Enviar para Grupo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RepassePage;
