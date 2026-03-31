import { useNavigate } from "react-router-dom";
import { useDashboardConversations, useDashboardVehicles, useDashboardDeals } from "@/hooks/useDashboard";
import { MessageSquare, Flame, TrendingUp, Car, RotateCcw, DollarSign, Percent, ShoppingCart, Wallet, ArrowUpRight, Zap, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const DashboardPage = () => {
  const navigate = useNavigate();
  const { data: conversations = [], isLoading: loadingConv } = useDashboardConversations();
  const { data: vehicles = [], isLoading: loadingVeh } = useDashboardVehicles();
  const { data: deals = [], isLoading: loadingDeals } = useDashboardDeals();

  const isLoading = loadingConv || loadingVeh || loadingDeals;

  // Conversation metrics
  const newConvs = conversations.filter(c => c.status === "new" || c.status === "open").length;
  const totalConvs = conversations.length;

  // Deal metrics
  const openDeals = deals.filter(d => !["won", "lost"].includes(d.stage || "")).length;
  const wonDeals = deals.filter(d => d.stage === "won").length;

  // Vehicle metrics
  const availableCars = vehicles.filter(v => v.status === "available");
  const soldCars = vehicles.filter(v => v.status === "sold");
  const reservedCars = vehicles.filter(v => v.status === "reserved");
  const repasseCars = vehicles.filter(v => v.status === "repasse");

  const totalStockValue = availableCars.reduce((a, v) => a + (v.price || 0), 0);
  const soldRevenue = soldCars.reduce((a, v) => a + (v.price || 0), 0);

  const getCommission = (v: typeof vehicles[0]) =>
    (v.commission_as3 || 0) + (v.commission_external || 0) + (v.commission_armor || 0) + (v.commission_financing || 0);

  const totalCommissions = soldCars.reduce((a, v) => a + getCommission(v), 0);
  const avgCommission = vehicles.length > 0
    ? vehicles.reduce((a, v) => a + getCommission(v), 0) / vehicles.length
    : 0;
  const avgTicket = soldCars.length > 0 ? soldRevenue / soldCars.length : 0;

  const vehiclesWithMileage = vehicles.filter(v => v.mileage != null && v.mileage > 0);
  const avgKm = vehiclesWithMileage.length > 0
    ? vehiclesWithMileage.reduce((a, v) => a + (v.mileage || 0), 0) / vehiclesWithMileage.length
    : 0;

  const formatCurrency = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  const formatK = (v: number) => `R$ ${(v / 1000).toFixed(0)}k`;

  const stageData = [
    { stage: "Novos", key: "new" },
    { stage: "Qualificados", key: "qualified" },
    { stage: "Negociação", key: "negotiation" },
    { stage: "Avaliação Troca", key: "trade_eval" },
    { stage: "Financiamento", key: "financing" },
    { stage: "Ganhos", key: "won" },
  ].map(s => ({ ...s, count: deals.filter(d => d.stage === s.key).length }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Visão geral do seu CRM automotivo</p>
      </div>

      {/* Hero KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Faturamento Vendas",
            value: formatCurrency(soldRevenue),
            sub: `${soldCars.length} veículo${soldCars.length !== 1 ? "s" : ""} vendido${soldCars.length !== 1 ? "s" : ""}`,
            icon: DollarSign,
            gradient: "from-[hsl(var(--accent))] to-[hsl(38_90%_42%)]",
            iconBg: "bg-accent/15",
            onClick: () => navigate("/estoque"),
          },
          {
            label: "Estoque Disponível",
            value: formatK(totalStockValue),
            sub: `${availableCars.length} veículos · ${reservedCars.length} reservados`,
            icon: Car,
            gradient: "from-[hsl(var(--info))] to-[hsl(230_80%_50%)]",
            iconBg: "bg-info/15",
            onClick: () => navigate("/estoque"),
          },
          {
            label: "Comissões (vendidos)",
            value: formatCurrency(totalCommissions),
            sub: `Média: ${formatCurrency(avgCommission)} / veículo`,
            icon: Percent,
            gradient: "from-[hsl(var(--success))] to-[hsl(160_55%_38%)]",
            iconBg: "bg-success/15",
            onClick: () => navigate("/estoque"),
          },
          {
            label: "Conversas Ativas",
            value: newConvs,
            sub: `${totalConvs} total no sistema`,
            icon: Flame,
            gradient: "from-[hsl(var(--lead-hot))] to-[hsl(15_80%_45%)]",
            iconBg: "bg-destructive/15",
            onClick: () => navigate("/inbox"),
          },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.5 }}
            onClick={kpi.onClick}
            className="group relative overflow-hidden rounded-2xl border border-border/50 p-5 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
            style={{ background: "hsl(var(--card))", backdropFilter: "blur(20px)" }}
          >
            <div className={cn("absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-10 blur-2xl group-hover:opacity-20 transition-opacity bg-gradient-to-br", kpi.gradient)} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", kpi.iconBg)}>
                  <kpi.icon className="w-5 h-5 text-foreground/70" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-xs text-muted-foreground font-medium mb-1">{kpi.label}</p>
              <p className="text-2xl font-bold text-foreground tracking-tight">{kpi.value}</p>
              {kpi.sub && <p className="text-[11px] text-muted-foreground mt-1.5">{kpi.sub}</p>}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Conversas", value: totalConvs, icon: MessageSquare },
          { label: "Negócios Abertos", value: openDeals, icon: TrendingUp },
          { label: "Ticket Médio", value: avgTicket > 0 ? formatK(avgTicket) : "—", icon: ShoppingCart },
          { label: "Negócios Ganhos", value: wonDeals, icon: DollarSign },
          { label: "Repasse", value: repasseCars.length, icon: Wallet },
          { label: "KM Médio", value: avgKm > 0 ? `${(avgKm / 1000).toFixed(0)}k` : "—", icon: Zap },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + i * 0.04, duration: 0.4 }}
            className="rounded-xl border border-border/40 p-4 bg-card/60 backdrop-blur-sm hover:bg-card transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <item.icon className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground font-medium">{item.label}</span>
            </div>
            <p className="text-xl font-bold text-foreground">{item.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Main Content Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Conversations */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="lg:col-span-3 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h2 className="font-semibold text-base text-foreground">Conversas Recentes</h2>
            <button onClick={() => navigate("/inbox")} className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              Ver todas <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="px-3 pb-3">
            {conversations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma conversa ainda</p>
            ) : (
              conversations.slice(0, 5).map((conv, i) => (
                <motion.div
                  key={conv.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.05 }}
                  onClick={() => navigate(`/inbox?conv=${conv.id}`)}
                  className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-secondary/60 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary/5 border border-border flex items-center justify-center text-sm font-semibold shrink-0">
                      {(conv.contact?.name || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{conv.contact?.name || "Desconhecido"}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[280px]">{conv.ai_summary || "Sem resumo"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-medium",
                      conv.status === "open" ? "bg-success/15 text-success" :
                      conv.status === "new" ? "bg-accent/15 text-accent" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {conv.status === "open" ? "Aberta" : conv.status === "new" ? "Nova" : conv.status || "—"}
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* Pipeline */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h2 className="font-semibold text-base text-foreground">Pipeline</h2>
            <button onClick={() => navigate("/pipeline")} className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              Abrir <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="px-5 pb-5 space-y-3">
            {stageData.map((item, i) => (
              <motion.div
                key={item.key}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.04 }}
                className="flex items-center justify-between group cursor-pointer"
                onClick={() => navigate("/pipeline")}
              >
                <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors">{item.stage}</span>
                <div className="flex items-center gap-3">
                  <div className="w-28 h-2 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: "hsl(var(--accent))" }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max((item.count / Math.max(deals.length, 1)) * 100, 4)}%` }}
                      transition={{ delay: 0.6 + i * 0.05, duration: 0.7, ease: "easeOut" }}
                    />
                  </div>
                  <span className="text-sm font-bold w-5 text-right text-foreground">{item.count}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Inventory Quick View */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="font-semibold text-base text-foreground flex items-center gap-2">
            <Car className="w-5 h-5 text-accent" />
            Estoque Rápido
          </h2>
          <button onClick={() => navigate("/estoque")} className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            Ver estoque completo <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
        <div className="px-3 pb-4">
          {availableCars.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum veículo disponível no estoque</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {availableCars.slice(0, 6).map((v, i) => (
                <motion.div
                  key={v.id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.55 + i * 0.04 }}
                  onClick={() => navigate("/estoque")}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border/30 hover:bg-secondary/40 transition-all cursor-pointer group"
                >
                  <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <Car className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{v.brand} {v.model}</p>
                    <p className="text-[11px] text-muted-foreground">{v.year} · {v.color || "—"} · {v.mileage ? `${(v.mileage/1000).toFixed(0)}k km` : "—"}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-foreground">{v.price ? formatK(v.price) : "—"}</p>
                    {getCommission(v) > 0 && (
                      <p className="text-[10px] text-success font-medium">R$ {getCommission(v).toLocaleString("pt-BR")}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardPage;
