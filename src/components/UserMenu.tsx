import { useNavigate } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { User, Settings, LogOut, HelpCircle, CreditCard } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const UserMenu = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = () => {
    toast({ title: "Você saiu do sistema" });
    navigate("/login");
    setOpen(false);
  };

  const goTo = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  const items = [
    { icon: User, label: "Meu Perfil", action: () => goTo("/configuracoes") },
    { icon: Settings, label: "Configurações", action: () => goTo("/configuracoes") },
    { icon: CreditCard, label: "Assinatura", action: () => goTo("/configuracoes") },
    { icon: HelpCircle, label: "Ajuda & Suporte", action: () => toast({ title: "Central de ajuda em breve!" }) },
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center text-xs font-bold text-accent-foreground ml-1 cursor-pointer hover:scale-105 transition-transform">
          AC
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0 rounded-2xl border border-border bg-card/95 backdrop-blur-2xl shadow-2xl" align="end" sideOffset={8}>
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm font-semibold text-foreground">Admin AutoCRM</p>
          <p className="text-xs text-muted-foreground">admin@autocrm.com</p>
        </div>
        <div className="p-1.5">
          {items.map((item, i) => (
            <button
              key={i}
              onClick={item.action}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-foreground hover:bg-secondary/70 transition-colors"
            >
              <item.icon className="w-4 h-4 text-muted-foreground" />
              {item.label}
            </button>
          ))}
        </div>
        <div className="p-1.5 border-t border-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default UserMenu;
