import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDeals, useUpdateDealStage, DealWithRelations } from "@/hooks/useDeals";
import { PIPELINE_STAGES } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Mail, Car, CreditCard, Calendar, Clock, ChevronRight, MessageSquare, MoreHorizontal, Plus, Filter, GripVertical, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import NewDealDialog from "@/components/NewDealDialog";
import EditDealDialog from "@/components/EditDealDialog";

const paymentLabels: Record<string, string> = {
  a_vista: "À Vista",
  financiamento: "Financiamento",
  troca: "Troca",
  misto: "Misto",
  indefinido: "Indefinido",
};

const PipelinePage = () => {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [draggedDeal, setDraggedDeal] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [newDealOpen, setNewDealOpen] = useState(false);
  const [editDeal, setEditDeal] = useState<DealWithRelations | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: deals = [], isLoading, error } = useDeals();
  const updateStage = useUpdateDealStage();

  const stageTotal = (stageKey: string) => {
    return deals
      .filter(d => d.stage === stageKey)
      .reduce((sum, d) => sum + (d.vehicle?.price || d.value || 0), 0);
  };

  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    setDraggedDeal(dealId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", dealId);
  };

  const handleDragOver = (e: React.DragEvent, stageKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStage(stageKey);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData("text/plain");
    if (!dealId) return;

    const deal = deals.find(d => d.id === dealId);
    if (!deal || deal.stage === targetStage) return;

    const stageLabel = PIPELINE_STAGES.find(s => s.key === targetStage)?.label || targetStage;
    toast({
      title: `Movido para ${stageLabel}`,
      description: deal.contact?.name || "",
    });

    updateStage.mutate({ dealId, stage: targetStage });
    setDraggedDeal(null);
    setDragOverStage(null);
  };

  const handleDragEnd = () => {
    setDraggedDeal(null);
    setDragOverStage(null);
  };

  const moveDealToStage = (deal: DealWithRelations, stageKey: string) => {
    const stageLabel = PIPELINE_STAGES.find(s => s.key === stageKey)?.label || stageKey;
    toast({ title: `Movido para ${stageLabel}`, description: deal.contact?.name || "" });
    updateStage.mutate({ dealId: deal.id, stage: stageKey });
  };

  const totalDeals = deals.length;
  const totalValue = deals.reduce((sum, d) => sum + (d.vehicle?.price || d.value || 0), 0);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive text-sm">Erro ao carregar deals: {(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col min-w-0 overflow-hidden h-[calc(100vh-3rem)] lg:h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="shrink-0 pb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalDeals} negócios · R$ {(totalValue / 1000).toFixed(0)}k em pipeline
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="filter-pill flex items-center gap-2"
            onClick={() => toast({ title: "Filtros", description: "Em breve." })}
          >
            <Filter className="w-4 h-4" />
            Filtrar
          </button>
          <button
            className="filter-pill active flex items-center gap-2"
            onClick={() => setNewDealOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Novo Negócio
          </button>
        </div>
      </div>

      {/* Kanban */}
      <div className="flex-1 min-w-0 overflow-x-auto overflow-y-hidden -mx-6 lg:-mx-8 px-6 lg:px-8">
        <div className="flex gap-4 h-full pb-4" style={{ minWidth: "fit-content" }}>
          {PIPELINE_STAGES.map((stage) => {
            const stageDeals = deals.filter(d => d.stage === stage.key);
            const total = stageTotal(stage.key);
            const isDragOver = dragOverStage === stage.key;

            return (
              <div
                key={stage.key}
                className={cn(
                  "rounded-2xl p-4 flex flex-col transition-all duration-200",
                  isDragOver ? "bg-accent/10 ring-2 ring-accent/30" : "bg-muted/70",
                )}
                style={{ width: 340, minWidth: 340, maxHeight: "100%" }}
                onDragOver={(e) => handleDragOver(e, stage.key)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, stage.key)}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4 px-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">{stage.label}</h3>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-background text-muted-foreground border border-border">
                      {stageDeals.length}
                    </span>
                  </div>
                  {total > 0 && (
                    <span className="text-xs font-semibold text-muted-foreground">
                      R$ {(total / 1000).toFixed(0)}k
                    </span>
                  )}
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1" style={{ scrollbarWidth: "thin" }}>
                  {isLoading ? (
                    Array.from({ length: 2 }).map((_, i) => (
                      <Skeleton key={i} className="h-32 rounded-xl" />
                    ))
                  ) : (
                    <AnimatePresence mode="popLayout">
                      {stageDeals.map((deal) => {
                        const isExpanded = expandedCard === deal.id;
                        const isDragging = draggedDeal === deal.id;
                        const contactName = deal.contact?.name || "Sem contato";
                        const contactPhone = deal.contact?.whatsapp || deal.contact?.phone || "";
                        const contactEmail = deal.contact?.email;
                        const initials = contactName.split(" ").map(n => n[0]).join("").slice(0, 2);

                        return (
                          <motion.div
                            key={deal.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: isDragging ? 0.5 : 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            draggable
                            onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, deal.id)}
                            onDragEnd={handleDragEnd}
                            className={cn(
                              "kanban-card group relative",
                              isDragging && "opacity-50 ring-2 ring-accent",
                            )}
                            onClick={() => setExpandedCard(isExpanded ? null : deal.id)}
                          >
                            {/* Drag Handle */}
                            <div className="absolute left-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-40 transition-opacity cursor-grab active:cursor-grabbing">
                              <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
                            </div>

                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-sm font-semibold text-foreground border border-border">
                                  {initials}
                                </div>
                                <div>
                                  <p className="font-semibold text-sm">{contactName}</p>
                                  <p className="text-xs text-muted-foreground">{contactPhone}</p>
                                </div>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-secondary"
                                    onClick={e => e.stopPropagation()}
                                  >
                                    <MoreHorizontal className="w-4 h-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => { setEditDeal(deal); }}>
                                    <Pencil className="w-4 h-4 mr-2" /> Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => navigate(`/inbox`)}>
                                    <MessageSquare className="w-4 h-4 mr-2" /> Abrir conversa
                                  </DropdownMenuItem>
                                  {PIPELINE_STAGES.filter(s => s.key !== deal.stage).map(s => (
                                    <DropdownMenuItem key={s.key} onClick={() => moveDealToStage(deal, s.key)}>
                                      Mover para {s.label}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            {/* Urgency badge */}
                            {deal.urgency && (
                              <div className="flex items-center gap-2 mb-3">
                                <Badge variant="outline" className="text-[11px] font-medium capitalize">
                                  {deal.urgency}
                                </Badge>
                              </div>
                            )}

                            {/* Vehicle */}
                            {deal.vehicle && (
                              <div
                                className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/80 mb-3 cursor-pointer hover:bg-secondary transition-colors"
                                onClick={(e) => { e.stopPropagation(); navigate("/estoque"); }}
                              >
                                <Car className="w-4 h-4 text-muted-foreground shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium truncate">
                                    {deal.vehicle.brand} {deal.vehicle.model} {deal.vehicle.year}
                                  </p>
                                  <p className="text-[11px] text-muted-foreground">{deal.vehicle.color}</p>
                                </div>
                                <span className="text-sm font-bold whitespace-nowrap">
                                  R$ {((deal.vehicle.price || 0) / 1000).toFixed(0)}k
                                </span>
                              </div>
                            )}

                            {/* Vehicle interest text (when no vehicle linked) */}
                            {!deal.vehicle && deal.vehicle_interest && (
                              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/80 mb-3">
                                <Car className="w-4 h-4 text-muted-foreground shrink-0" />
                                <p className="text-xs text-muted-foreground">{deal.vehicle_interest}</p>
                              </div>
                            )}

                            <div className="flex items-center gap-2 flex-wrap">
                              {deal.payment_type && (
                                <Badge variant="outline" className="text-[11px] font-medium gap-1">
                                  <CreditCard className="w-3 h-3" />
                                  {paymentLabels[deal.payment_type] || deal.payment_type}
                                </Badge>
                              )}
                              {deal.value && (
                                <Badge variant="outline" className="text-[11px] font-medium">
                                  R$ {deal.value.toLocaleString("pt-BR")}
                                </Badge>
                              )}
                            </div>

                            {/* Expanded */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.25 }}
                                  className="overflow-hidden"
                                >
                                  <div className="mt-3 pt-3 border-t space-y-3">
                                    {deal.notes && (
                                      <div className="p-3 rounded-lg bg-accent/5 border border-accent/10">
                                        <p className="text-[11px] font-semibold text-accent-foreground mb-1 flex items-center gap-1">
                                          <MessageSquare className="w-3 h-3" /> Notas
                                        </p>
                                        <p className="text-xs text-muted-foreground leading-relaxed">{deal.notes}</p>
                                      </div>
                                    )}

                                    <button
                                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-accent/10 text-accent text-xs font-semibold hover:bg-accent/20 transition-colors mb-2"
                                      onClick={(e) => { e.stopPropagation(); setEditDeal(deal); }}
                                    >
                                      <Pencil className="w-3.5 h-3.5" /> Editar Negócio
                                    </button>

                                    <div className="flex gap-2">
                                      {contactPhone && (
                                        <a
                                          href={`tel:${contactPhone}`}
                                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-secondary text-xs font-medium hover:bg-muted transition-colors"
                                          onClick={e => e.stopPropagation()}
                                        >
                                          <Phone className="w-3.5 h-3.5" /> Ligar
                                        </a>
                                      )}
                                      <button
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-secondary text-xs font-medium hover:bg-muted transition-colors"
                                        onClick={(e) => { e.stopPropagation(); navigate(`/inbox`); }}
                                      >
                                        <MessageSquare className="w-3.5 h-3.5" /> Chat
                                      </button>
                                      {contactEmail && (
                                        <a
                                          href={`mailto:${contactEmail}`}
                                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-secondary text-xs font-medium hover:bg-muted transition-colors"
                                          onClick={e => e.stopPropagation()}
                                        >
                                          <Mail className="w-3.5 h-3.5" /> Email
                                        </a>
                                      )}
                                    </div>

                                    {deal.created_at && (
                                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        Criado: {new Date(deal.created_at).toLocaleDateString("pt-BR")}
                                      </p>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  )}
                  {!isLoading && stageDeals.length === 0 && (
                    <div className="text-center py-8 text-xs text-muted-foreground rounded-xl border-2 border-dashed border-border/50">
                      Arraste um card aqui
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <NewDealDialog open={newDealOpen} onOpenChange={setNewDealOpen} />
      <EditDealDialog deal={editDeal} open={!!editDeal} onOpenChange={(open) => { if (!open) setEditDeal(null); }} />
    </div>
  );
};

export default PipelinePage;
