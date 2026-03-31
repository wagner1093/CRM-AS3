import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Bell, Shield, Palette, MessageSquare, Car, CreditCard, Globe, Zap, Mail, Loader2 } from "lucide-react";
import { useSettings, useUpdateSettings, AppSettings } from "@/hooks/useSettings";

const SettingsPage = () => {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();

  // Profile
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyDoc, setCompanyDoc] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companySite, setCompanySite] = useState("");

  // Notifications
  const [notifNewLead, setNotifNewLead] = useState(true);
  const [notifDealWon, setNotifDealWon] = useState(true);
  const [notifFollowup, setNotifFollowup] = useState(true);
  const [notifEmail, setNotifEmail] = useState(false);
  const [notifWhatsapp, setNotifWhatsapp] = useState(true);
  const [notifSound, setNotifSound] = useState(true);
  const [notifDesktop, setNotifDesktop] = useState(true);

  // Automations
  const [autoAssign, setAutoAssign] = useState(true);
  const [autoFollowup, setAutoFollowup] = useState(true);
  const [autoAiLabel, setAutoAiLabel] = useState(true);
  const [autoWelcome, setAutoWelcome] = useState(false);

  // Sales
  const [defaultCommission, setDefaultCommission] = useState("2.5");
  const [currency, setCurrency] = useState("BRL");
  const [salesGoal, setSalesGoal] = useState("500000");
  const [leadsGoal, setLeadsGoal] = useState("150");
  const [taxIncluded, setTaxIncluded] = useState(true);

  // Sync state from DB on load
  useEffect(() => {
    if (settings) {
      setProfileName(settings.profile_name || "");
      setProfileEmail(settings.profile_email || "");
      setProfilePhone(settings.profile_phone || "");
      setCompanyName(settings.company_name || "");
      setCompanyDoc(settings.company_cnpj || "");
      setCompanyAddress(settings.company_address || "");
      setCompanySite(settings.company_site || "");
      
      setNotifNewLead(settings.notif_new_lead ?? true);
      setNotifDealWon(settings.notif_deal_won ?? true);
      setNotifFollowup(settings.notif_followup ?? true);
      setNotifEmail(settings.notif_email ?? false);
      setNotifWhatsapp(settings.notif_whatsapp ?? true);
      setNotifSound(settings.notif_sound ?? true);
      setNotifDesktop(settings.notif_desktop ?? true);

      setAutoAssign(settings.auto_assign ?? true);
      setAutoFollowup(settings.auto_followup ?? true);
      setAutoAiLabel(settings.auto_ai_label ?? true);
      setAutoWelcome(settings.auto_welcome ?? false);

      setDefaultCommission(settings.default_commission?.toString() || "2.5");
      setCurrency(settings.currency || "BRL");
      setSalesGoal(settings.monthly_sales_goal?.toString() || "500000");
      setLeadsGoal(settings.monthly_leads_goal?.toString() || "150");
      setTaxIncluded(settings.tax_included ?? true);
    }
  }, [settings]);

  const handleSave = (section: string) => {
    const dataToUpdate: Partial<AppSettings> = {};

    if (section === "Perfil" || section === "Dados da Loja") {
      dataToUpdate.profile_name = profileName;
      dataToUpdate.profile_email = profileEmail;
      dataToUpdate.profile_phone = profilePhone;
      dataToUpdate.company_name = companyName;
      dataToUpdate.company_cnpj = companyDoc;
      dataToUpdate.company_address = companyAddress;
      dataToUpdate.company_site = companySite;
    } else if (section === "Notificações") {
      dataToUpdate.notif_new_lead = notifNewLead;
      dataToUpdate.notif_deal_won = notifDealWon;
      dataToUpdate.notif_followup = notifFollowup;
      dataToUpdate.notif_email = notifEmail;
      dataToUpdate.notif_whatsapp = notifWhatsapp;
      dataToUpdate.notif_sound = notifSound;
      dataToUpdate.notif_desktop = notifDesktop;
    } else if (section === "Automações") {
      dataToUpdate.auto_assign = autoAssign;
      dataToUpdate.auto_followup = autoFollowup;
      dataToUpdate.auto_ai_label = autoAiLabel;
      dataToUpdate.auto_welcome = autoWelcome;
    } else if (section === "Vendas") {
      dataToUpdate.default_commission = parseFloat(defaultCommission);
      dataToUpdate.currency = currency;
      dataToUpdate.monthly_sales_goal = parseFloat(salesGoal);
      dataToUpdate.monthly_leads_goal = parseFloat(leadsGoal);
      dataToUpdate.tax_included = taxIncluded;
    }

    updateSettings.mutate(dataToUpdate);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
        <span className="ml-2 text-muted-foreground">Carregando configurações...</span>
      </div>
    );
  }

  const cardClass = "glass-card p-6 space-y-5";
  const labelClass = "text-sm font-medium text-foreground";
  const descClass = "text-xs text-muted-foreground mt-0.5";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">Gerencie todas as configurações do seu CRM</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-secondary/50 backdrop-blur-sm rounded-full p-1 h-auto flex-wrap">
          <TabsTrigger value="profile" className="rounded-full text-xs gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm"><User className="w-3.5 h-3.5" />Perfil</TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-full text-xs gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm"><Bell className="w-3.5 h-3.5" />Notificações</TabsTrigger>
          <TabsTrigger value="automations" className="rounded-full text-xs gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm"><Zap className="w-3.5 h-3.5" />Automações</TabsTrigger>
          <TabsTrigger value="sales" className="rounded-full text-xs gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm"><CreditCard className="w-3.5 h-3.5" />Vendas</TabsTrigger>
          <TabsTrigger value="security" className="rounded-full text-xs gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm"><Shield className="w-3.5 h-3.5" />Segurança</TabsTrigger>
        </TabsList>

        {/* PROFILE */}
        <TabsContent value="profile">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className={cardClass}>
              <div className="flex items-center gap-4 pb-4 border-b border-border">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center text-xl font-bold text-accent-foreground">
                  {profileName?.substring(0, 2).toUpperCase() || "AC"}
                </div>
                <div>
                  <p className={labelClass}>{profileName}</p>
                  <p className={descClass}>{profileEmail}</p>
                  <Button variant="outline" size="sm" className="mt-2 rounded-full text-xs h-7">Alterar foto</Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Nome completo</label>
                  <Input value={profileName} onChange={e => setProfileName(e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <Input value={profileEmail} onChange={e => setProfileEmail(e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <label className={labelClass}>Telefone</label>
                  <Input value={profilePhone} onChange={e => setProfilePhone(e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <label className={labelClass}>Cargo</label>
                  <Select defaultValue="admin">
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="manager">Gerente</SelectItem>
                      <SelectItem value="seller">Vendedor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={() => handleSave("Perfil")} className="rounded-full" disabled={updateSettings.isPending}>
                {updateSettings.isPending && <Loader2 className="w-3 h-3 animate-spin mr-2" />}
                Salvar Perfil
              </Button>
            </div>

            <div className={cardClass}>
              <h3 className="font-semibold text-foreground flex items-center gap-2"><Car className="w-4 h-4" /> Dados da Loja</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Nome da loja</label>
                  <Input value={companyName} onChange={e => setCompanyName(e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <label className={labelClass}>CNPJ</label>
                  <Input value={companyDoc} onChange={e => setCompanyDoc(e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <label className={labelClass}>Endereço</label>
                  <Input value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <label className={labelClass}>Site</label>
                  <Input value={companySite} onChange={e => setCompanySite(e.target.value)} className="mt-1.5" />
                </div>
              </div>
              <Button onClick={() => handleSave("Dados da Loja")} className="rounded-full" disabled={updateSettings.isPending}>
                {updateSettings.isPending && <Loader2 className="w-3 h-3 animate-spin mr-2" />}
                Salvar Loja
              </Button>
            </div>
          </motion.div>
        </TabsContent>

        {/* NOTIFICATIONS */}
        <TabsContent value="notifications">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className={cardClass}>
              <h3 className="font-semibold text-foreground flex items-center gap-2"><Bell className="w-4 h-4" /> Eventos</h3>
              {[
                { label: "Novo lead recebido", desc: "Receba alerta quando um novo lead chegar", checked: notifNewLead, set: setNotifNewLead },
                { label: "Negócio fechado", desc: "Notificação quando um deal for marcado como ganho", checked: notifDealWon, set: setNotifDealWon },
                { label: "Follow-up pendente", desc: "Lembrete de follow-ups que precisam de ação", checked: notifFollowup, set: setNotifFollowup },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div>
                    <p className={labelClass}>{item.label}</p>
                    <p className={descClass}>{item.desc}</p>
                  </div>
                  <Switch checked={item.checked} onCheckedChange={item.set} />
                </div>
              ))}
            </div>

            <div className={cardClass}>
              <h3 className="font-semibold text-foreground flex items-center gap-2"><Globe className="w-4 h-4" /> Canais de Notificação</h3>
              {[
                { label: "Email", desc: "Receber notificações por email", checked: notifEmail, set: setNotifEmail, icon: Mail },
                { label: "WhatsApp", desc: "Receber notificações por WhatsApp", checked: notifWhatsapp, set: setNotifWhatsapp, icon: MessageSquare },
                { label: "Som", desc: "Tocar som ao receber notificação", checked: notifSound, set: setNotifSound, icon: Bell },
                { label: "Desktop", desc: "Push notifications no navegador", checked: notifDesktop, set: setNotifDesktop, icon: Globe },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                      <item.icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className={labelClass}>{item.label}</p>
                      <p className={descClass}>{item.desc}</p>
                    </div>
                  </div>
                  <Switch checked={item.checked} onCheckedChange={item.set} />
                </div>
              ))}
              <Button onClick={() => handleSave("Notificações")} className="rounded-full" disabled={updateSettings.isPending}>
                {updateSettings.isPending && <Loader2 className="w-3 h-3 animate-spin mr-2" />}
                Salvar Notificações
              </Button>
            </div>
          </motion.div>
        </TabsContent>

        {/* AUTOMATIONS */}
        <TabsContent value="automations">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={cardClass}>
            <h3 className="font-semibold text-foreground flex items-center gap-2"><Zap className="w-4 h-4" /> Automações do CRM</h3>
            {[
              { label: "Auto-atribuir leads", desc: "Distribuir novos leads automaticamente entre vendedores", checked: autoAssign, set: setAutoAssign },
              { label: "Follow-up automático", desc: "Iniciar sequências de follow-up ao receber lead", checked: autoFollowup, set: setAutoFollowup },
              { label: "Classificação por IA", desc: "Classificar leads como quente/morno/frio automaticamente", checked: autoAiLabel, set: setAutoAiLabel },
              { label: "Mensagem de boas-vindas", desc: "Enviar mensagem automática para novos contatos", checked: autoWelcome, set: setAutoWelcome },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div>
                  <p className={labelClass}>{item.label}</p>
                  <p className={descClass}>{item.desc}</p>
                </div>
                <Switch checked={item.checked} onCheckedChange={item.set} />
              </div>
            ))}
            <Button onClick={() => handleSave("Automações")} className="rounded-full" disabled={updateSettings.isPending}>
              {updateSettings.isPending && <Loader2 className="w-3 h-3 animate-spin mr-2" />}
              Salvar Automações
            </Button>
          </motion.div>
        </TabsContent>

        {/* SALES */}
        <TabsContent value="sales">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={cardClass}>
            <h3 className="font-semibold text-foreground flex items-center gap-2"><CreditCard className="w-4 h-4" /> Configurações de Vendas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Comissão padrão (%)</label>
                <Input value={defaultCommission} onChange={e => setDefaultCommission(e.target.value)} className="mt-1.5" type="number" step="0.1" />
              </div>
              <div>
                <label className={labelClass}>Moeda</label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BRL">Real (R$)</SelectItem>
                    <SelectItem value="USD">Dólar (US$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className={labelClass}>Meta mensal de vendas</label>
                <Input value={salesGoal} onChange={e => setSalesGoal(e.target.value)} className="mt-1.5" type="number" />
              </div>
              <div>
                <label className={labelClass}>Meta de leads/mês</label>
                <Input value={leadsGoal} onChange={e => setLeadsGoal(e.target.value)} className="mt-1.5" type="number" />
              </div>
            </div>
            <div className="flex items-center justify-between py-3 border-t border-border mt-2">
              <div>
                <p className={labelClass}>Impostos inclusos no preço</p>
                <p className={descClass}>Exibir preços com impostos já incluídos</p>
              </div>
              <Switch checked={taxIncluded} onCheckedChange={setTaxIncluded} />
            </div>
            <Button onClick={() => handleSave("Vendas")} className="rounded-full" disabled={updateSettings.isPending}>
              {updateSettings.isPending && <Loader2 className="w-3 h-3 animate-spin mr-2" />}
              Salvar Vendas
            </Button>
          </motion.div>
        </TabsContent>

        {/* SECURITY */}
        <TabsContent value="security">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className={cardClass}>
              <h3 className="font-semibold text-foreground flex items-center gap-2"><Shield className="w-4 h-4" /> Segurança</h3>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Senha atual</label>
                  <Input type="password" placeholder="••••••••" className="mt-1.5" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Nova senha</label>
                    <Input type="password" placeholder="••••••••" className="mt-1.5" />
                  </div>
                  <div>
                    <label className={labelClass}>Confirmar nova senha</label>
                    <Input type="password" placeholder="••••••••" className="mt-1.5" />
                  </div>
                </div>
                <Button onClick={() => handleSave("Senha")} className="rounded-full">Alterar Senha</Button>
              </div>
            </div>
            <div className={cardClass}>
              <h3 className="font-semibold text-foreground">Sessões Ativas</h3>
              {[
                { device: "Chrome · macOS", location: "São Paulo, BR", time: "Agora", current: true },
                { device: "Safari · iPhone", location: "São Paulo, BR", time: "2h atrás", current: false },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div>
                    <p className={labelClass}>{s.device}</p>
                    <p className={descClass}>{s.location} · {s.time}</p>
                  </div>
                  {s.current ? (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-500/10 text-green-600">Atual</span>
                  ) : (
                    <Button variant="outline" size="sm" className="rounded-full text-xs h-7">Encerrar</Button>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
