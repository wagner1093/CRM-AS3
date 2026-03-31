import { useState } from "react";
import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { User, Bell, Shield, Palette, MessageSquare, Car, CreditCard, Globe, Zap, Mail } from "lucide-react";

const SettingsPage = () => {
  const { toast } = useToast();

  // Profile
  const [profileName, setProfileName] = useState("Admin AutoCRM");
  const [profileEmail, setProfileEmail] = useState("admin@autocrm.com");
  const [profilePhone, setProfilePhone] = useState("+55 11 99900-0000");
  const [companyName, setCompanyName] = useState("AutoCRM Veículos");
  const [companyDoc, setCompanyDoc] = useState("12.345.678/0001-99");

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
  const [taxIncluded, setTaxIncluded] = useState(true);

  const handleSave = (section: string) => {
    toast({ title: `${section} salvo com sucesso!` });
  };

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
          <TabsTrigger value="channels" className="rounded-full text-xs gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm"><MessageSquare className="w-3.5 h-3.5" />Canais</TabsTrigger>
          <TabsTrigger value="security" className="rounded-full text-xs gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm"><Shield className="w-3.5 h-3.5" />Segurança</TabsTrigger>
        </TabsList>

        {/* PROFILE */}
        <TabsContent value="profile">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className={cardClass}>
              <div className="flex items-center gap-4 pb-4 border-b border-border">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center text-xl font-bold text-accent-foreground">
                  AC
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
              <Button onClick={() => handleSave("Perfil")} className="rounded-full">Salvar Perfil</Button>
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
                  <Input defaultValue="Av. Paulista, 1000 - São Paulo, SP" className="mt-1.5" />
                </div>
                <div>
                  <label className={labelClass}>Site</label>
                  <Input defaultValue="www.autocrm.com.br" className="mt-1.5" />
                </div>
              </div>
              <Button onClick={() => handleSave("Dados da Loja")} className="rounded-full">Salvar Loja</Button>
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
              <Button onClick={() => handleSave("Notificações")} className="rounded-full">Salvar Notificações</Button>
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
            <Button onClick={() => handleSave("Automações")} className="rounded-full">Salvar Automações</Button>
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
                <Input defaultValue="500000" className="mt-1.5" type="number" />
              </div>
              <div>
                <label className={labelClass}>Meta de leads/mês</label>
                <Input defaultValue="150" className="mt-1.5" type="number" />
              </div>
            </div>
            <div className="flex items-center justify-between py-3 border-t border-border mt-2">
              <div>
                <p className={labelClass}>Impostos inclusos no preço</p>
                <p className={descClass}>Exibir preços com impostos já incluídos</p>
              </div>
              <Switch checked={taxIncluded} onCheckedChange={setTaxIncluded} />
            </div>
            <Button onClick={() => handleSave("Vendas")} className="rounded-full">Salvar Vendas</Button>
          </motion.div>
        </TabsContent>

        {/* CHANNELS */}
        <TabsContent value="channels">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className={cardClass}>
              <h3 className="font-semibold text-foreground flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Integrações de Canais</h3>
              {[
                { name: "WhatsApp Business", status: "Conectado", connected: true, desc: "+55 11 99900-0000" },
                { name: "Instagram Direct", status: "Conectado", connected: true, desc: "@autocrm_veiculos" },
                { name: "Facebook Messenger", status: "Desconectado", connected: false, desc: "Clique para conectar" },
                { name: "Email SMTP", status: "Configurado", connected: true, desc: "contato@autocrm.com.br" },
              ].map((ch, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div>
                    <p className={labelClass}>{ch.name}</p>
                    <p className={descClass}>{ch.desc}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ch.connected ? "bg-green-500/10 text-green-600" : "bg-secondary text-muted-foreground"}`}>
                      {ch.status}
                    </span>
                    <Button variant="outline" size="sm" className="rounded-full text-xs h-7">
                      {ch.connected ? "Gerenciar" : "Conectar"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
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
