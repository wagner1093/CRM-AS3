import { useNavigate } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { User, Settings, LogOut, HelpCircle, CreditCard, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";

const UserMenu = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const { data: profile, isLoading } = useProfile();

  const handleLogout = async () => {
    try {
      await signOut();
      toast({ title: "Você saiu do sistema" });
      navigate("/login");
      setOpen(false);
    } catch (error: any) {
      toast({ title: "Erro ao sair", description: error.message, variant: "destructive" });
    }
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

  const userEmail = profile?.email || user?.email || "usuario@autocrm.com";
  const userName = profile?.full_name || userEmail.split("@")[0] || "Usuário";
  const userInitials = userName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "AC";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center text-xs font-bold text-accent-foreground ml-1 cursor-pointer hover:scale-105 transition-transform shadow-sm">
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : userInitials}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0 rounded-2xl border border-border bg-card/95 backdrop-blur-2xl shadow-2xl" align="end" sideOffset={8}>
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm font-semibold text-foreground truncate">{userName}</p>
          <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
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
