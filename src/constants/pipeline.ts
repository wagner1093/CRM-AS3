export const PIPELINE_STAGES = [
  { key: "new", label: "Novo", color: "bg-muted" },
  { key: "qualified", label: "Qualificado", color: "bg-info/10" },
  { key: "negotiation", label: "Negociação", color: "bg-warning/10" },
  { key: "tradein_eval", label: "Avaliação Troca", color: "bg-accent/20" },
  { key: "financing", label: "Financiamento", color: "bg-info/10" },
  { key: "scheduled", label: "Agendado", color: "bg-success/10" },
  { key: "docs", label: "Documentação", color: "bg-muted" },
  { key: "won", label: "Ganho ✅", color: "bg-success/20" },
  { key: "lost", label: "Perdido ❌", color: "bg-destructive/10" },
] as const;
