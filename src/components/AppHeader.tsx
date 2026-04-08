import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import SearchModal from "./SearchModal";
import NotificationsDropdown from "./NotificationsDropdown";
import UserMenu from "./UserMenu";
import { useSettings } from "@/hooks/useSettings";
import NewDealDialog from "./NewDealDialog";

const routeTitles: Record<string, string> = {
  "/": "Dashboard",
  "/inbox": "Inbox",
  "/pipeline": "Pipeline",
  "/estoque": "Estoque",
  "/followup": "Follow-up",
  "/lista-inteligente": "Lista Inteligente",
  "/repasse": "Grupos de Repasse",
  "/ads": "Ads",
  "/configuracoes": "Configurações",
};

const AppHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [newDealOpen, setNewDealOpen] = useState(false);
  const { data: settings } = useSettings();
  const title = routeTitles[location.pathname] || settings?.company_name || "AutoCRM";
  const canGoBack = location.pathname !== "/";

  return (
    <>
      <header 
        className="h-16 flex items-center justify-between px-6 border-b border-border bg-card/80 backdrop-blur-xl fixed top-0 right-0 z-30 transition-all duration-300" 
        style={{ left: "var(--sidebar-width, 240px)" }}
      >
        <div className="flex items-center gap-3">
          {canGoBack && (
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-[18px] h-[18px]" />
            </button>
          )}
          <h1 className="text-lg font-semibold text-foreground tracking-tight">{title}</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            onClick={() => setNewDealOpen(true)}
            className="rounded-full px-4 gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90 font-medium text-xs h-9"
          >
            <Plus className="w-3.5 h-3.5" />
            Novo Lead
          </Button>

          <button
            onClick={() => setSearchOpen(true)}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          >
            <Search className="w-[18px] h-[18px]" />
          </button>

          <NotificationsDropdown />
          <UserMenu />
        </div>
      </header>

      <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />
      <NewDealDialog open={newDealOpen} onOpenChange={setNewDealOpen} />
    </>
  );
};

export default AppHeader;
