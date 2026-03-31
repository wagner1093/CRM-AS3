import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { mockWaitlistProfiles, mockWaitlistPreferences, mockWaitlistMatches, mockWaitlistNotifications, defaultMessageTemplate, mockContacts } from "@/data/mockData";
import { Contact, WaitlistProfile, WaitlistPreferences, WaitlistMatch } from "@/types/crm";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ArrowLeft, MessageSquare, Eye, X, Send, Clock, Star,
  CheckCircle2, XCircle, Pause, ChevronRight, Car, Phone, Mail,
  Baby, Briefcase, Sparkles, AlertCircle, Plus, UserPlus, Download, List
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  active: { label: "Ativo", icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
  paused: { label: "Pausado", icon: Pause, color: "text-amber-600 bg-amber-50" },
  converted: { label: "Convertido", icon: Star, color: "text-blue-600 bg-blue-50" },
  inactive: { label: "Inativo", icon: XCircle, color: "text-muted-foreground bg-muted" },
};

const matchStatusConfig: Record<string, { label: string; color: string }> = {
  suggested: { label: "Sugerido", color: "bg-blue-50 text-blue-700 border-blue-200" },
  contacted: { label: "Contatado", color: "bg-amber-50 text-amber-700 border-amber-200" },
  dismissed: { label: "Dispensado", color: "bg-muted text-muted-foreground border-border" },
  converted: { label: "Convertido", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

const reasonLabels: Record<string, string> = {
  model_exact: "Modelo exato",
  model_similar: "Modelo similar",
  body_type: "Tipo de carroceria",
  price_ok: "Preço na faixa",
  year_ok: "Ano compatível",
  must_have_hit: "Requisito atendido",
};

function getProfileSummary(wlId: string) {
  const prefs = mockWaitlistPreferences[wlId];
  if (!prefs) return "Sem preferências definidas";
  const parts: string[] = [];
  if (prefs.body_type !== "indefinido") parts.push(prefs.body_type.toUpperCase());
  if (prefs.preferred_models?.length) parts.push(prefs.preferred_models.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join("/"));
  if (prefs.max_price) parts.push(`até R$ ${(prefs.max_price / 1000).toFixed(0)}k`);
  if (prefs.must_have?.length) parts.push(prefs.must_have.map(m => m.replace(/_/g, " ")).join(", "));
  return parts.join(" · ") || "Sem preferências definidas";
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? "text-emerald-700 bg-emerald-50 border-emerald-200"
    : score >= 60 ? "text-amber-700 bg-amber-50 border-amber-200"
    : "text-muted-foreground bg-muted border-border";
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${color}`}>
      <Sparkles className="w-3 h-3" />
      {score}%
    </span>
  );
}

const emptyForm = {
  full_name: "", phone: "", email: "",
  body_type: "indefinido" as WaitlistPreferences["body_type"],
  preferred_makes: "", preferred_models: "",
  min_year: "", max_year: "", min_price: "", max_price: "",
  must_have: "", avoid: "",
  payment_preference: "indefinido" as WaitlistPreferences["payment_preference"],
  has_kids: false, trunk_priority: "",
  notes: "", priority_score: "",
};

const WaitlistPage = () => {
  const [selectedProfile, setSelectedProfile] = useState<WaitlistProfile | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [sendMatch, setSendMatch] = useState<WaitlistMatch | null>(null);
  const [messageText, setMessageText] = useState("");
  const [dismissedMatches, setDismissedMatches] = useState<Set<string>>(new Set());
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [profiles, setProfiles] = useState<WaitlistProfile[]>(mockWaitlistProfiles);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const navigate = useNavigate();
  const { toast } = useToast();

  const exportCSV = () => {
    const headers = ["Nome", "Telefone", "Email", "Status", "Prioridade", "Carroceria", "Modelos", "Marcas", "Preço Min", "Preço Max", "Ano Min", "Ano Max", "Pagamento", "Requisitos", "Observações"];
    const rows = profiles.map(p => {
      const pr = mockWaitlistPreferences[p.id];
      return [
        p.contact.full_name, p.contact.phone_e164, p.contact.email || "",
        p.status, p.priority_score || "",
        pr?.body_type || "", pr?.preferred_models?.join(";") || "", pr?.preferred_makes?.join(";") || "",
        pr?.min_price || "", pr?.max_price || "", pr?.min_year || "", pr?.max_year || "",
        pr?.payment_preference || "", pr?.must_have?.join(";") || "", p.notes || "",
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lista-inteligente-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "✅ Lista exportada!", description: `${profiles.length} contatos exportados em CSV.` });
  };

  const updateForm = (field: string, value: string | boolean) => setForm(f => ({ ...f, [field]: value }));

  const handleAddProfile = () => {
    if (!form.full_name.trim() || !form.phone.trim()) {
      toast({ title: "Preencha nome e telefone", variant: "destructive" });
      return;
    }
    const id = `wl-${Date.now()}`;
    const contactId = `c-${Date.now()}`;
    const newContact: Contact = {
      id: contactId,
      full_name: form.full_name.trim(),
      phone_e164: form.phone.trim(),
      email: form.email.trim() || null,
      created_at: new Date().toISOString(),
    };
    const newProfile: WaitlistProfile = {
      id,
      contact_id: contactId,
      contact: newContact,
      status: "active",
      priority_score: form.priority_score ? parseInt(form.priority_score) : null,
      notes: form.notes.trim() || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const newPrefs: WaitlistPreferences = {
      waitlist_id: id,
      body_type: form.body_type,
      preferred_makes: form.preferred_makes ? form.preferred_makes.split(",").map(s => s.trim().toLowerCase()).filter(Boolean) : null,
      preferred_models: form.preferred_models ? form.preferred_models.split(",").map(s => s.trim().toLowerCase()).filter(Boolean) : null,
      min_year: form.min_year ? parseInt(form.min_year) : null,
      max_year: form.max_year ? parseInt(form.max_year) : null,
      min_price: form.min_price ? parseFloat(form.min_price) : null,
      max_price: form.max_price ? parseFloat(form.max_price) : null,
      must_have: form.must_have ? form.must_have.split(",").map(s => s.trim().toLowerCase().replace(/\s+/g, "_")).filter(Boolean) : null,
      avoid: form.avoid ? form.avoid.split(",").map(s => s.trim().toLowerCase().replace(/\s+/g, "_")).filter(Boolean) : null,
      payment_preference: form.payment_preference,
      has_kids: form.has_kids,
      trunk_priority: form.trunk_priority ? parseInt(form.trunk_priority) : null,
      updated_at: new Date().toISOString(),
    };
    // Add to local state
    setProfiles(prev => [newProfile, ...prev]);
    mockWaitlistPreferences[id] = newPrefs;
    setForm({ ...emptyForm });
    setAddDialogOpen(false);
    toast({ title: "✅ Contato cadastrado!", description: `${newContact.full_name} adicionado à Lista Inteligente.` });
  };

  const filteredProfiles = useMemo(() => {
    return profiles.filter(p => {
      const matchesSearch = p.contact.full_name.toLowerCase().includes(search.toLowerCase()) ||
        p.contact.phone_e164.includes(search);
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter, profiles]);

  const profileMatches = useMemo(() => {
    if (!selectedProfile) return [];
    return mockWaitlistMatches
      .filter(m => m.waitlist_id === selectedProfile.id && !dismissedMatches.has(m.id))
      .sort((a, b) => b.match_score - a.match_score);
  }, [selectedProfile, dismissedMatches]);

  const profileNotifications = useMemo(() => {
    if (!selectedProfile) return [];
    return mockWaitlistNotifications.filter(n => n.waitlist_id === selectedProfile.id);
  }, [selectedProfile]);

  const handleSendWhatsApp = (match: WaitlistMatch) => {
    const profile = selectedProfile!;
    const vehicle = match.vehicle!;
    const text = defaultMessageTemplate
      .replace("{nome}", profile.contact.full_name.split(" ")[0])
      .replace("{modelo}", `${vehicle.make} ${vehicle.model}`)
      .replace("{ano}", String(vehicle.year))
      .replace("{versao}", vehicle.version || "")
      .replace("{preco}", `R$ ${vehicle.price.toLocaleString("pt-BR")}`)
      .replace("{km}", vehicle.km ? `${vehicle.km.toLocaleString("pt-BR")} km` : "");
    setMessageText(text);
    setSendMatch(match);
    setSendDialogOpen(true);
  };

  const confirmSendWhatsApp = () => {
    setSendDialogOpen(false);
    toast({
      title: "✅ WhatsApp enviado!",
      description: `Mensagem enviada para ${selectedProfile?.contact.full_name}. Match atualizado para "Contatado".`,
    });
  };

  const handleDismissMatch = (matchId: string) => {
    setDismissedMatches(prev => new Set(prev).add(matchId));
    toast({ title: "Match dispensado", description: "O match foi removido da lista de sugestões." });
  };

  const matchCountByProfile = useMemo(() => {
    const counts: Record<string, number> = {};
    mockWaitlistMatches.filter(m => m.status === "suggested").forEach(m => {
      counts[m.waitlist_id] = (counts[m.waitlist_id] || 0) + 1;
    });
    return counts;
  }, []);

  // List View
  if (!selectedProfile) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="page-header flex items-center justify-between">
          <div>
            <h1>Lista Inteligente</h1>
            <p>Clientes aguardando veículos compatíveis com seu perfil</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setAddDialogOpen(true)} className="rounded-xl gap-2">
              <UserPlus className="w-4 h-4" /> Novo Cadastro
            </Button>
            <Button variant="outline" onClick={exportCSV} className="rounded-xl gap-2">
              <Download className="w-4 h-4" /> Exportar CSV
            </Button>
            <Button variant="outline" size="icon" className="rounded-xl"
              onClick={() => setViewMode(v => v === "cards" ? "table" : "cards")}
              title={viewMode === "cards" ? "Ver tabela" : "Ver cards"}>
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-3 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar cliente..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-9 w-64 rounded-xl bg-card border h-10" />
          </div>
          <div className="flex gap-1.5">
            {[
              { key: "all", label: "Todos" },
              { key: "active", label: "Ativos" },
              { key: "paused", label: "Pausados" },
              { key: "converted", label: "Convertidos" },
            ].map(f => (
              <button key={f.key} onClick={() => setStatusFilter(f.key)}
                className={`filter-pill text-xs ${statusFilter === f.key ? "active" : ""}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "Ativos", value: profiles.filter(p => p.status === "active").length, icon: CheckCircle2, accent: "text-emerald-600" },
            { label: "Com Matches", value: Object.keys(matchCountByProfile).length, icon: Sparkles, accent: "text-blue-600" },
            { label: "Pausados", value: profiles.filter(p => p.status === "paused").length, icon: Pause, accent: "text-amber-600" },
            { label: "Convertidos", value: profiles.filter(p => p.status === "converted").length, icon: Star, accent: "text-violet-600" },
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

        {/* Profile list - Cards */}
        {viewMode === "cards" && (
          <div className="space-y-3">
            {filteredProfiles.map((profile, i) => {
              const st = statusConfig[profile.status];
              const matchCount = matchCountByProfile[profile.id] || 0;
              const lastNotif = mockWaitlistNotifications.filter(n => n.waitlist_id === profile.id).sort((a, b) => b.sent_at.localeCompare(a.sent_at))[0];
              return (
                <motion.div
                  key={profile.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => setSelectedProfile(profile)}
                  className="stat-card flex items-center gap-5 cursor-pointer group"
                >
                  <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-muted-foreground shrink-0">
                    {profile.contact.full_name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-sm">{profile.contact.full_name}</span>
                      <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${st.color}`}>
                        <st.icon className="w-3 h-3" />
                        {st.label}
                      </span>
                      {matchCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-accent text-accent-foreground border border-border">
                          <Sparkles className="w-3 h-3" />
                          {matchCount} match{matchCount > 1 ? "es" : ""}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{getProfileSummary(profile.id)}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                    {profile.priority_score && (
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5" />
                        <span className="font-medium">{profile.priority_score}</span>
                      </div>
                    )}
                    {lastNotif && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(lastNotif.sent_at).toLocaleDateString("pt-BR")}</span>
                      </div>
                    )}
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Profile list - Table */}
        {viewMode === "table" && (
          <div className="stat-card overflow-hidden p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Matches</TableHead>
                  <TableHead>Último Aviso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfiles.map(profile => {
                  const st = statusConfig[profile.status];
                  const matchCount = matchCountByProfile[profile.id] || 0;
                  const lastNotif = mockWaitlistNotifications.filter(n => n.waitlist_id === profile.id).sort((a, b) => b.sent_at.localeCompare(a.sent_at))[0];
                  return (
                    <TableRow key={profile.id} className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedProfile(profile)}>
                      <TableCell className="font-medium">{profile.contact.full_name}</TableCell>
                      <TableCell className="text-xs">{profile.contact.phone_e164}</TableCell>
                      <TableCell className="text-xs">{profile.contact.email || "—"}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${st.color}`}>
                          <st.icon className="w-3 h-3" /> {st.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">{profile.priority_score || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{getProfileSummary(profile.id)}</TableCell>
                      <TableCell className="text-center">{matchCount > 0 ? matchCount : "—"}</TableCell>
                      <TableCell className="text-xs">{lastNotif ? new Date(lastNotif.sent_at).toLocaleDateString("pt-BR") : "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Add Profile Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="rounded-2xl max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" /> Novo Cadastro na Lista Inteligente
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              {/* Contact info */}
              <div className="col-span-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Dados do Contato</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Nome completo *</Label>
                <Input placeholder="Ex: Carlos Silva" value={form.full_name} onChange={e => updateForm("full_name", e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Telefone (E.164) *</Label>
                <Input placeholder="+5511999001122" value={form.phone} onChange={e => updateForm("phone", e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input placeholder="email@exemplo.com" value={form.email} onChange={e => updateForm("email", e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Prioridade (0-100)</Label>
                <Input type="number" placeholder="50" value={form.priority_score} onChange={e => updateForm("priority_score", e.target.value)} className="rounded-xl" />
              </div>

              {/* Preferences */}
              <div className="col-span-2 mt-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Preferências do Veículo</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Carroceria</Label>
                <Select value={form.body_type} onValueChange={v => updateForm("body_type", v)}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["sedan", "suv", "hatch", "pickup", "wagon", "indefinido"].map(t => (
                      <SelectItem key={t} value={t}>{t.toUpperCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Pagamento</Label>
                <Select value={form.payment_preference} onValueChange={v => updateForm("payment_preference", v)}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["a_vista", "financiamento", "troca", "misto", "indefinido"].map(t => (
                      <SelectItem key={t} value={t}>{t.replace(/_/g, " ").toUpperCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Marcas preferidas</Label>
                <Input placeholder="toyota, honda" value={form.preferred_makes} onChange={e => updateForm("preferred_makes", e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Modelos preferidos</Label>
                <Input placeholder="corolla, civic" value={form.preferred_models} onChange={e => updateForm("preferred_models", e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Ano mínimo</Label>
                <Input type="number" placeholder="2020" value={form.min_year} onChange={e => updateForm("min_year", e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Ano máximo</Label>
                <Input type="number" placeholder="2025" value={form.max_year} onChange={e => updateForm("max_year", e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Preço mínimo (R$)</Label>
                <Input type="number" placeholder="50000" value={form.min_price} onChange={e => updateForm("min_price", e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Preço máximo (R$)</Label>
                <Input type="number" placeholder="150000" value={form.max_price} onChange={e => updateForm("max_price", e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Requisitos (must have)</Label>
                <Input placeholder="porta malas grande, familia" value={form.must_have} onChange={e => updateForm("must_have", e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Evitar</Label>
                <Input placeholder="motor turbo, câmbio manual" value={form.avoid} onChange={e => updateForm("avoid", e.target.value)} className="rounded-xl" />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.has_kids} onCheckedChange={v => updateForm("has_kids", v)} />
                <Label className="text-xs">Tem filhos</Label>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Prioridade porta-malas (0-10)</Label>
                <Input type="number" placeholder="7" value={form.trunk_priority} onChange={e => updateForm("trunk_priority", e.target.value)} className="rounded-xl" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Observações</Label>
                <Textarea placeholder="Ex: Tem 2 filhos, viaja muito, quer carro econômico..." value={form.notes} onChange={e => updateForm("notes", e.target.value)} className="rounded-xl" rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setForm({ ...emptyForm }); setAddDialogOpen(false); }} className="rounded-xl">Cancelar</Button>
              <Button onClick={handleAddProfile} className="rounded-xl gap-2">
                <Plus className="w-4 h-4" /> Cadastrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Detail View
  const prefs = mockWaitlistPreferences[selectedProfile.id];
  const st = statusConfig[selectedProfile.status];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Back */}
      <button onClick={() => setSelectedProfile(null)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Voltar para lista
      </button>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="stat-card mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center text-lg font-bold text-muted-foreground">
              {selectedProfile.contact.full_name.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </div>
            <div>
              <h2 className="text-xl font-bold">{selectedProfile.contact.full_name}</h2>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                <a href={`tel:${selectedProfile.contact.phone_e164}`} className="flex items-center gap-1 hover:text-foreground transition-colors">
                  <Phone className="w-3.5 h-3.5" />{selectedProfile.contact.phone_e164}
                </a>
                {selectedProfile.contact.email && (
                  <a href={`mailto:${selectedProfile.contact.email}`} className="flex items-center gap-1 hover:text-foreground transition-colors">
                    <Mail className="w-3.5 h-3.5" />{selectedProfile.contact.email}
                  </a>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full ${st.color}`}>
              <st.icon className="w-4 h-4" />
              {st.label}
            </span>
            <Button variant="outline" size="sm" className="rounded-xl text-xs"
              onClick={() => navigate(`/inbox`)}>
              <MessageSquare className="w-3.5 h-3.5 mr-1" /> Ver conversa
            </Button>
          </div>
        </div>
        {selectedProfile.notes && (
          <div className="mt-4 p-3 rounded-xl bg-secondary text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Observações: </span>{selectedProfile.notes}
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-3 gap-6">
        {/* Preferences */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="stat-card col-span-1">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-muted-foreground" /> Preferências
          </h3>
          {prefs ? (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Carroceria</span>
                <span className="font-medium">{prefs.body_type.toUpperCase()}</span>
              </div>
              {prefs.preferred_models?.length ? (
                <div className="flex justify-between items-start">
                  <span className="text-muted-foreground">Modelos</span>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {prefs.preferred_models.map(m => (
                      <span key={m} className="text-[11px] px-2 py-0.5 rounded-full bg-secondary font-medium">{m}</span>
                    ))}
                  </div>
                </div>
              ) : null}
              {prefs.preferred_makes?.length ? (
                <div className="flex justify-between items-start">
                  <span className="text-muted-foreground">Marcas</span>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {prefs.preferred_makes.map(m => (
                      <span key={m} className="text-[11px] px-2 py-0.5 rounded-full bg-secondary font-medium">{m}</span>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Faixa de preço</span>
                <span className="font-medium">
                  {prefs.min_price ? `R$ ${(prefs.min_price/1000).toFixed(0)}k` : "—"} – {prefs.max_price ? `R$ ${(prefs.max_price/1000).toFixed(0)}k` : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ano</span>
                <span className="font-medium">{prefs.min_year || "—"} – {prefs.max_year || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pagamento</span>
                <span className="font-medium">{prefs.payment_preference}</span>
              </div>
              {prefs.has_kids !== null && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tem filhos</span>
                  <span className="font-medium flex items-center gap-1">
                    {prefs.has_kids ? <><Baby className="w-3.5 h-3.5" /> Sim</> : "Não"}
                  </span>
                </div>
              )}
              {prefs.trunk_priority != null && prefs.trunk_priority > 5 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Porta-malas</span>
                  <span className="font-medium">Prioridade {prefs.trunk_priority}/10</span>
                </div>
              )}
              {prefs.must_have?.length ? (
                <div>
                  <span className="text-muted-foreground text-xs block mb-1.5">Requisitos</span>
                  <div className="flex flex-wrap gap-1">
                    {prefs.must_have.map(m => (
                      <span key={m} className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {m.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {prefs.avoid?.length ? (
                <div>
                  <span className="text-muted-foreground text-xs block mb-1.5">Evitar</span>
                  <div className="flex flex-wrap gap-1">
                    {prefs.avoid.map(m => (
                      <span key={m} className="text-[11px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                        {m.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma preferência cadastrada.</p>
          )}
        </motion.div>

        {/* Matches */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="col-span-2 space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" /> Veículos Sugeridos
            {profileMatches.length > 0 && (
              <span className="text-xs font-normal text-muted-foreground">({profileMatches.length} encontrados)</span>
            )}
          </h3>

          {profileMatches.length === 0 ? (
            <div className="stat-card flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum veículo compatível no estoque atual.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {profileMatches.map((match, i) => {
                const v = match.vehicle!;
                const mst = matchStatusConfig[match.status];
                return (
                  <motion.div key={match.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }} className="stat-card">
                    <div className="flex items-start gap-4">
                      <div className="w-20 h-16 rounded-xl bg-secondary flex items-center justify-center shrink-0 cursor-pointer hover:bg-muted transition-colors"
                        onClick={() => navigate("/estoque")}>
                        <Car className="w-8 h-8 text-muted-foreground/20" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{v.make} {v.model}</span>
                          <span className="text-sm text-muted-foreground">{v.version} · {v.year}</span>
                          <ScoreBadge score={match.match_score} />
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${mst.color}`}>
                            {mst.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm mb-2">
                          <span className="font-bold">R$ {v.price.toLocaleString("pt-BR")}</span>
                          {v.km != null && <span className="text-muted-foreground">{v.km.toLocaleString("pt-BR")} km</span>}
                          {v.color && <span className="text-muted-foreground">{v.color}</span>}
                        </div>
                        {/* Match reasons */}
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(match.match_reasons).map(([key, val]) => (
                            <span key={key} className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                              val ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-muted text-muted-foreground border-border line-through opacity-50"
                            }`}>
                              {reasonLabels[key] || key}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <Button size="sm" variant="outline" className="rounded-xl text-xs gap-1.5 h-8"
                          onClick={() => handleSendWhatsApp(match)}>
                          <Send className="w-3.5 h-3.5" /> WhatsApp
                        </Button>
                        <Button size="sm" variant="ghost" className="rounded-xl text-xs gap-1.5 h-8"
                          onClick={() => navigate("/estoque")}>
                          <Eye className="w-3.5 h-3.5" /> Ver veículo
                        </Button>
                        {match.status === "suggested" && (
                          <Button size="sm" variant="ghost" className="rounded-xl text-xs gap-1.5 h-8 text-muted-foreground"
                            onClick={() => handleDismissMatch(match.id)}>
                            <X className="w-3.5 h-3.5" /> Dispensar
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Notification history */}
          {profileNotifications.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-muted-foreground" /> Histórico de Avisos
              </h3>
              <div className="space-y-2">
                {profileNotifications.map(notif => (
                  <div key={notif.id} className="p-3 rounded-xl bg-secondary text-sm flex items-start gap-3">
                    <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground mb-1">
                        {new Date(notif.sent_at).toLocaleDateString("pt-BR")} às {new Date(notif.sent_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        {notif.vehicle && <> · {notif.vehicle.make} {notif.vehicle.model}</>}
                      </p>
                      <p className="text-sm">{notif.message_text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Send WhatsApp Dialog */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-4 h-4" /> Enviar WhatsApp
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Para: <span className="font-medium text-foreground">{selectedProfile.contact.full_name}</span> ({selectedProfile.contact.phone_e164})
            </div>
            {sendMatch?.vehicle && (
              <div className="text-sm text-muted-foreground">
                Veículo: <span className="font-medium text-foreground">{sendMatch.vehicle.make} {sendMatch.vehicle.model} {sendMatch.vehicle.year}</span>
              </div>
            )}
            <Textarea value={messageText} onChange={e => setMessageText(e.target.value)}
              rows={4} className="rounded-xl text-sm" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialogOpen(false)} className="rounded-xl">Cancelar</Button>
            <Button onClick={confirmSendWhatsApp} className="rounded-xl gap-2">
              <Send className="w-4 h-4" /> Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WaitlistPage;
