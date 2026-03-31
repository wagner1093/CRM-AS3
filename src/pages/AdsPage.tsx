import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Users, Eye, MousePointerClick, Target, CalendarIcon, Megaphone, Power, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, subDays, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { mockVehicles } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";
import { DateRange } from "react-day-picker";

interface AdCampaign {
  id: string;
  name: string;
  vehicleId: string | null;
  status: "active" | "paused" | "completed";
  platform: "meta" | "instagram";
  objective: string;
  budget_daily: number;
  spent_total: number;
  impressions: number;
  clicks: number;
  leads: number;
  cpl: number;
  cpc: number;
  ctr: number;
  reach: number;
  frequency: number;
  start_date: string;
  end_date: string | null;
  daily_data: { date: string; spent: number; leads: number; impressions: number; clicks: number }[];
}

// Helper to generate 30 days of daily data
const genDaily = (baseSpent: number, baseLeads: number, baseImpressions: number, daysBack = 30, pausedAfter?: number) => {
  const data = [];
  for (let i = daysBack; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const paused = pausedAfter !== undefined && i < pausedAfter;
    const variance = () => 0.7 + Math.random() * 0.6;
    const spent = paused ? 0 : Math.round(baseSpent * variance());
    const leads = paused ? 0 : Math.max(0, Math.round(baseLeads * variance()));
    const impressions = paused ? 0 : Math.round(baseImpressions * variance());
    const clicks = paused ? 0 : Math.round(impressions * (0.025 + Math.random() * 0.015));
    data.push({ date: dateStr, spent, leads, impressions, clicks });
  }
  return data;
};

const mockCampaigns: AdCampaign[] = [
  {
    id: "camp1", name: "Corolla XEi 2023 - Março", vehicleId: "v1", status: "active", platform: "meta",
    objective: "Geração de Leads", budget_daily: 80, spent_total: 2480, impressions: 62400, clicks: 1872,
    leads: 48, cpl: 51.67, cpc: 1.32, ctr: 3.0, reach: 44800, frequency: 1.39,
    start_date: "2025-02-07", end_date: null,
    daily_data: genDaily(80, 2, 2300),
  },
  {
    id: "camp2", name: "Civic Touring 2024 - Premium", vehicleId: "v2", status: "active", platform: "meta",
    objective: "Geração de Leads", budget_daily: 120, spent_total: 4560, impressions: 98400, clicks: 2952,
    leads: 72, cpl: 63.33, cpc: 1.54, ctr: 3.0, reach: 68200, frequency: 1.44,
    start_date: "2025-02-01", end_date: null,
    daily_data: genDaily(120, 3, 3400),
  },
  {
    id: "camp3", name: "T-Cross Highline - SUV", vehicleId: "v3", status: "paused", platform: "meta",
    objective: "Geração de Leads", budget_daily: 60, spent_total: 1320, impressions: 34800, clicks: 1044,
    leads: 22, cpl: 60.00, cpc: 1.26, ctr: 3.0, reach: 25600, frequency: 1.36,
    start_date: "2025-02-10", end_date: null,
    daily_data: genDaily(60, 1, 1500, 30, 5),
  },
  {
    id: "camp4", name: "Tracker Premier - Oportunidade", vehicleId: "v4", status: "active", platform: "instagram",
    objective: "Geração de Leads", budget_daily: 50, spent_total: 1250, impressions: 28800, clicks: 864,
    leads: 21, cpl: 59.52, cpc: 1.45, ctr: 3.0, reach: 21400, frequency: 1.35,
    start_date: "2025-02-15", end_date: null,
    daily_data: genDaily(50, 1, 1200),
  },
  {
    id: "camp5", name: "Pulse Impetus 2024 - Lançamento", vehicleId: "v6", status: "active", platform: "meta",
    objective: "Geração de Leads", budget_daily: 100, spent_total: 2800, impressions: 56000, clicks: 1680,
    leads: 38, cpl: 73.68, cpc: 1.67, ctr: 3.0, reach: 42000, frequency: 1.33,
    start_date: "2025-02-20", end_date: null,
    daily_data: genDaily(100, 2, 2200),
  },
  {
    id: "camp6", name: "HB20 Diamond - Encerrada", vehicleId: "v5", status: "completed", platform: "meta",
    objective: "Geração de Leads", budget_daily: 70, spent_total: 2100, impressions: 52000, clicks: 1560,
    leads: 41, cpl: 51.22, cpc: 1.35, ctr: 3.0, reach: 38000, frequency: 1.37,
    start_date: "2025-01-15", end_date: "2025-03-01",
    daily_data: genDaily(70, 2, 1900, 45),
  },
];

type DateFilter = "today" | "yesterday" | "7days" | "30days" | "60days" | "all" | "custom";

const AdsPage = () => {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<AdCampaign[]>(mockCampaigns);
  const [dateFilter, setDateFilter] = useState<DateFilter>("30days");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  const getDateRange = (): { start: Date; end: Date } => {
    const now = new Date();
    const end = endOfDay(now);
    switch (dateFilter) {
      case "today": return { start: startOfDay(now), end };
      case "yesterday": return { start: startOfDay(subDays(now, 1)), end: endOfDay(subDays(now, 1)) };
      case "7days": return { start: startOfDay(subDays(now, 7)), end };
      case "30days": return { start: startOfDay(subDays(now, 30)), end };
      case "60days": return { start: startOfDay(subDays(now, 60)), end };
      case "custom":
        if (customRange?.from && customRange?.to) return { start: startOfDay(customRange.from), end: endOfDay(customRange.to) };
        return { start: startOfDay(subDays(now, 30)), end };
      default: return { start: new Date("2020-01-01"), end };
    }
  };

  const filteredCampaigns = useMemo(() => {
    let filtered = campaigns;
    if (statusFilter !== "all") filtered = filtered.filter(c => c.status === statusFilter);
    return filtered;
  }, [campaigns, statusFilter]);

  const getFilteredDailyData = (campaign: AdCampaign) => {
    const { start, end } = getDateRange();
    return campaign.daily_data.filter(d => {
      const date = new Date(d.date);
      return isAfter(date, start) && isBefore(date, end);
    });
  };

  const totals = useMemo(() => {
    const range = getDateRange();
    let spent = 0, leads = 0, impressions = 0, clicks = 0;
    filteredCampaigns.forEach(c => {
      c.daily_data.forEach(d => {
        const date = new Date(d.date);
        if (isAfter(date, range.start) && isBefore(date, range.end)) {
          spent += d.spent;
          leads += d.leads;
          impressions += d.impressions;
          clicks += d.clicks;
        }
      });
    });
    const cpl = leads > 0 ? spent / leads : 0;
    const cpc = clicks > 0 ? spent / clicks : 0;
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    return { spent, leads, impressions, clicks, cpl, cpc, ctr };
  }, [filteredCampaigns, dateFilter, customRange]);

  const chartData = useMemo(() => {
    const { start, end } = getDateRange();
    const map = new Map<string, { date: string; spent: number; leads: number; impressions: number; clicks: number }>();
    filteredCampaigns.forEach(c => {
      c.daily_data.forEach(d => {
        const date = new Date(d.date);
        if (isAfter(date, start) && isBefore(date, end)) {
          const existing = map.get(d.date) || { date: d.date, spent: 0, leads: 0, impressions: 0, clicks: 0 };
          existing.spent += d.spent;
          existing.leads += d.leads;
          existing.impressions += d.impressions;
          existing.clicks += d.clicks;
          map.set(d.date, existing);
        }
      });
    });
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredCampaigns, dateFilter, customRange]);

  const spentByCampaign = useMemo(() => {
    const { start, end } = getDateRange();
    return filteredCampaigns.map(c => {
      const data = c.daily_data.filter(d => {
        const date = new Date(d.date);
        return isAfter(date, start) && isBefore(date, end);
      });
      const spent = data.reduce((s, d) => s + d.spent, 0);
      const leads = data.reduce((s, d) => s + d.leads, 0);
      const vehicle = mockVehicles.find(v => v.id === c.vehicleId);
      return { name: c.name.length > 20 ? c.name.slice(0, 20) + "…" : c.name, spent, leads, fullName: c.name, vehicle: vehicle ? `${vehicle.make} ${vehicle.model}` : "—" };
    }).filter(c => c.spent > 0);
  }, [filteredCampaigns, dateFilter, customRange]);

  const toggleCampaign = (id: string) => {
    setCampaigns(prev => prev.map(c => {
      if (c.id !== id) return c;
      const newStatus = c.status === "active" ? "paused" : "active";
      toast({ title: `Campanha ${newStatus === "active" ? "ativada" : "pausada"}`, description: c.name });
      return { ...c, status: newStatus };
    }));
  };

  const COLORS = ["hsl(var(--accent))", "hsl(var(--info))", "hsl(var(--success))", "hsl(var(--lead-hot))", "hsl(var(--lead-warm))", "hsl(var(--muted-foreground))"];

  const filterLabels: Record<DateFilter, string> = {
    today: "Hoje", yesterday: "Ontem", "7days": "Últimos 7 dias", "30days": "Últimos 30 dias", "60days": "Últimos 60 dias", all: "Todo período", custom: "Personalizado",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Megaphone className="w-7 h-7 text-accent" />
            Meta Ads
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Acompanhe suas campanhas e métricas em tempo real</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="active">Ativas</SelectItem>
              <SelectItem value="paused">Pausadas</SelectItem>
              <SelectItem value="completed">Encerradas</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={dateFilter}
            onValueChange={(v) => {
              const val = v as DateFilter;
              setDateFilter(val);
              if (val === "custom") setShowCustomPicker(true);
              else setShowCustomPicker(false);
            }}
          >
            <SelectTrigger className="w-[180px] h-9 text-sm">
              <CalendarIcon className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(filterLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {dateFilter === "custom" && (
            <Popover open={showCustomPicker} onOpenChange={setShowCustomPicker}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 text-sm">
                  {customRange?.from && customRange?.to
                    ? `${format(customRange.from, "dd/MM", { locale: ptBR })} - ${format(customRange.to, "dd/MM", { locale: ptBR })}`
                    : "Selecionar datas"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={customRange}
                  onSelect={setCustomRange}
                  numberOfMonths={2}
                  className={cn("p-3 pointer-events-auto")}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        {[
          { label: "Investido", value: `R$ ${totals.spent.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: DollarSign, color: "text-accent" },
          { label: "Leads", value: totals.leads.toString(), icon: Users, color: "text-success" },
          { label: "Impressões", value: totals.impressions.toLocaleString("pt-BR"), icon: Eye, color: "text-info" },
          { label: "Cliques", value: totals.clicks.toLocaleString("pt-BR"), icon: MousePointerClick, color: "text-foreground" },
          { label: "CPL", value: `R$ ${totals.cpl.toFixed(2)}`, icon: Target, color: "text-lead-warm" },
          { label: "CPC", value: `R$ ${totals.cpc.toFixed(2)}`, icon: MousePointerClick, color: "text-muted-foreground" },
          { label: "CTR", value: `${totals.ctr.toFixed(2)}%`, icon: TrendingUp, color: "text-success" },
        ].map((kpi) => (
          <Card key={kpi.label} className="glass-card border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground font-medium">{kpi.label}</span>
                <kpi.icon className={cn("w-4 h-4", kpi.color)} />
              </div>
              <p className="text-lg font-bold text-foreground">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Leads over time */}
        <Card className="lg:col-span-2 glass-card border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">Leads & Investimento por Dia</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ leads: { label: "Leads", color: "hsl(var(--success))" }, spent: { label: "Investido (R$)", color: "hsl(var(--accent))" } }} className="h-[260px] w-full">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tickFormatter={(v) => format(new Date(v), "dd/MM")} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area yAxisId="right" type="monotone" dataKey="spent" fill="hsl(var(--accent) / 0.15)" stroke="hsl(var(--accent))" strokeWidth={2} />
                <Area yAxisId="left" type="monotone" dataKey="leads" fill="hsl(var(--success) / 0.2)" stroke="hsl(var(--success))" strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Spent by campaign pie */}
        <Card className="glass-card border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">Investimento por Campanha</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ChartContainer config={{ spent: { label: "Investido", color: "hsl(var(--accent))" } }} className="h-[260px] w-full">
              <PieChart>
                <Pie data={spentByCampaign} dataKey="spent" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={2} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {spentByCampaign.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Table */}
      <Card className="glass-card border-0 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-accent" />
              Campanhas ({filteredCampaigns.length})
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {campaigns.filter(c => c.status === "active").length} ativas
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Campanha</TableHead>
                <TableHead className="text-xs">Veículo</TableHead>
                <TableHead className="text-xs">Plataforma</TableHead>
                <TableHead className="text-xs text-right">Investido</TableHead>
                <TableHead className="text-xs text-right">Leads</TableHead>
                <TableHead className="text-xs text-right">CPL</TableHead>
                <TableHead className="text-xs text-right">Cliques</TableHead>
                <TableHead className="text-xs text-right">CTR</TableHead>
                <TableHead className="text-xs text-right">Impressões</TableHead>
                <TableHead className="text-xs text-center">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaigns.map((camp) => {
                const vehicle = mockVehicles.find(v => v.id === camp.vehicleId);
                const dailyFiltered = getFilteredDailyData(camp);
                const periodSpent = dailyFiltered.reduce((s, d) => s + d.spent, 0);
                const periodLeads = dailyFiltered.reduce((s, d) => s + d.leads, 0);
                const periodClicks = dailyFiltered.reduce((s, d) => s + d.clicks, 0);
                const periodImpressions = dailyFiltered.reduce((s, d) => s + d.impressions, 0);
                const periodCPL = periodLeads > 0 ? periodSpent / periodLeads : 0;
                const periodCTR = periodImpressions > 0 ? (periodClicks / periodImpressions) * 100 : 0;

                return (
                  <TableRow key={camp.id} className="group">
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] px-1.5 py-0.5 font-medium",
                          camp.status === "active" && "border-success text-success bg-success/10",
                          camp.status === "paused" && "border-warning text-warning bg-warning/10",
                          camp.status === "completed" && "border-muted-foreground text-muted-foreground bg-muted",
                        )}
                      >
                        {camp.status === "active" ? "Ativa" : camp.status === "paused" ? "Pausada" : "Encerrada"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-foreground">{camp.name}</p>
                        <p className="text-[10px] text-muted-foreground">Desde {format(new Date(camp.start_date), "dd/MM/yyyy")}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {vehicle ? (
                        <div>
                          <p className="text-sm font-medium text-foreground">{vehicle.make} {vehicle.model}</p>
                          <p className="text-[10px] text-muted-foreground">{vehicle.year} · {vehicle.version}</p>
                        </div>
                      ) : <span className="text-muted-foreground text-xs">—</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px]">
                        {camp.platform === "meta" ? "Meta Ads" : "Instagram"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-semibold text-foreground">R$ {periodSpent.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-bold text-success">{periodLeads}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm text-foreground">R$ {periodCPL.toFixed(2)}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm text-foreground">{periodClicks.toLocaleString("pt-BR")}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm text-foreground">{periodCTR.toFixed(2)}%</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm text-muted-foreground">{periodImpressions.toLocaleString("pt-BR")}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      {camp.status !== "completed" && (
                        <div className="flex items-center justify-center gap-2">
                          <Switch
                            checked={camp.status === "active"}
                            onCheckedChange={() => toggleCampaign(camp.id)}
                            className="data-[state=checked]:bg-success"
                          />
                          <Power className={cn("w-3.5 h-3.5", camp.status === "active" ? "text-success" : "text-muted-foreground")} />
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Per-campaign sparklines */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredCampaigns.filter(c => c.status !== "completed").map((camp) => {
          const vehicle = mockVehicles.find(v => v.id === camp.vehicleId);
          const dailyFiltered = getFilteredDailyData(camp);
          const periodLeads = dailyFiltered.reduce((s, d) => s + d.leads, 0);
          const periodSpent = dailyFiltered.reduce((s, d) => s + d.spent, 0);

          return (
            <Card key={camp.id} className="glass-card border-0 overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{camp.name}</p>
                    {vehicle && <p className="text-xs text-muted-foreground">{vehicle.make} {vehicle.model} {vehicle.year}</p>}
                  </div>
                  <Badge
                    variant="outline"
                    className={cn("text-[10px] ml-2 shrink-0",
                      camp.status === "active" ? "border-success text-success" : "border-warning text-warning",
                    )}
                  >
                    {camp.status === "active" ? "Ativa" : "Pausada"}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground">Leads (período)</p>
                    <p className="text-lg font-bold text-success">{periodLeads}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Investido</p>
                    <p className="text-lg font-bold text-foreground">R$ {periodSpent.toFixed(0)}</p>
                  </div>
                </div>
                <div className="h-[80px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyFiltered}>
                      <Area type="monotone" dataKey="leads" fill="hsl(var(--success) / 0.15)" stroke="hsl(var(--success))" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AdsPage;
