import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, MessageSquare, Car, Kanban, Users, LayoutDashboard, RotateCcw, Megaphone, Repeat, Settings, ArrowRight } from "lucide-react";
import { mockConversations, mockVehicles, mockContacts } from "@/data/mockData";
import { motion, AnimatePresence } from "framer-motion";

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const pages = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Inbox", path: "/inbox", icon: MessageSquare },
  { label: "Pipeline", path: "/pipeline", icon: Kanban },
  { label: "Estoque", path: "/estoque", icon: Car },
  { label: "Follow-up", path: "/followup", icon: RotateCcw },
  { label: "Lista Inteligente", path: "/lista-inteligente", icon: Users },
  { label: "Repasse", path: "/repasse", icon: Repeat },
  { label: "Ads", path: "/ads", icon: Megaphone },
  { label: "Configurações", path: "/configuracoes", icon: Settings },
];

const SearchModal = ({ open, onOpenChange }: SearchModalProps) => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  // ⌘K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onOpenChange]);

  const q = query.toLowerCase();

  const filteredPages = useMemo(() => pages.filter(p => p.label.toLowerCase().includes(q)), [q]);
  const filteredContacts = useMemo(() => mockContacts.filter(c => c.full_name.toLowerCase().includes(q)).slice(0, 4), [q]);
  const filteredVehicles = useMemo(() => mockVehicles.filter(v => `${v.make} ${v.model}`.toLowerCase().includes(q)).slice(0, 4), [q]);

  const goTo = (path: string) => {
    navigate(path);
    onOpenChange(false);
  };

  const hasResults = filteredPages.length > 0 || filteredContacts.length > 0 || filteredVehicles.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden rounded-2xl border border-border bg-card/95 backdrop-blur-2xl shadow-2xl">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar páginas, contatos, veículos..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground text-foreground"
            autoFocus
          />
          <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground font-mono">ESC</kbd>
        </div>

        <div className="max-h-[400px] overflow-y-auto p-2">
          {!query && (
            <p className="text-xs text-muted-foreground px-3 py-4 text-center">Comece a digitar para buscar...</p>
          )}

          {query && !hasResults && (
            <p className="text-xs text-muted-foreground px-3 py-6 text-center">Nenhum resultado para "{query}"</p>
          )}

          <AnimatePresence>
            {query && filteredPages.length > 0 && (
              <div className="mb-2">
                <p className="text-[10px] font-semibold uppercase text-muted-foreground px-3 py-1.5 tracking-wider">Páginas</p>
                {filteredPages.map(page => (
                  <motion.button
                    key={page.path}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => goTo(page.path)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-secondary/70 transition-colors text-left group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                      <page.icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <span className="flex-1 text-foreground font-medium">{page.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.button>
                ))}
              </div>
            )}

            {query && filteredContacts.length > 0 && (
              <div className="mb-2">
                <p className="text-[10px] font-semibold uppercase text-muted-foreground px-3 py-1.5 tracking-wider">Contatos</p>
                {filteredContacts.map(contact => (
                  <motion.button
                    key={contact.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => goTo("/inbox")}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-secondary/70 transition-colors text-left group"
                  >
                    <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-[10px] font-bold text-accent">
                      {contact.full_name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex-1">
                      <p className="text-foreground font-medium">{contact.full_name}</p>
                      <p className="text-xs text-muted-foreground">{contact.phone_e164}</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.button>
                ))}
              </div>
            )}

            {query && filteredVehicles.length > 0 && (
              <div className="mb-2">
                <p className="text-[10px] font-semibold uppercase text-muted-foreground px-3 py-1.5 tracking-wider">Veículos</p>
                {filteredVehicles.map(v => (
                  <motion.button
                    key={v.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => goTo("/estoque")}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-secondary/70 transition-colors text-left group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                      <Car className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-foreground font-medium">{v.make} {v.model} {v.year}</p>
                      <p className="text-xs text-muted-foreground">R$ {v.price.toLocaleString("pt-BR")}</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.button>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SearchModal;
