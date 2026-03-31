import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, MessageSquare, Kanban, Car, RotateCcw, Users, Repeat, Megaphone, ChevronRight, Sun, Moon, Settings, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/inbox", icon: MessageSquare, label: "Inbox" },
  { to: "/pipeline", icon: Kanban, label: "Pipeline" },
  { to: "/estoque", icon: Car, label: "Estoque" },
  { to: "/followup", icon: RotateCcw, label: "Follow-up" },
  { to: "/lista-inteligente", icon: Users, label: "Lista Inteligente" },
  { to: "/repasse", icon: Repeat, label: "Repasse" },
  { to: "/ads", icon: Megaphone, label: "Ads" },
  { to: "/studio-ia", icon: Sparkles, label: "Estúdio IA" },
  { to: "/configuracoes", icon: Settings, label: "Configurações" },
];

const AppSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 z-40 flex flex-col border-r border-border bg-card" style={{ width: "var(--sidebar-width)" }}>
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate("/")}>
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <Car className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg tracking-tight text-foreground">AutoCRM</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-0.5 px-3 mt-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to || (item.to !== "/" && location.pathname.startsWith(item.to));
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className="relative"
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-new"
                  className="absolute inset-0 rounded-xl bg-secondary"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                />
              )}
              <div className={`relative z-10 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200 ${
                isActive 
                  ? "text-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}>
                <item.icon className="w-[18px] h-[18px]" />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              </div>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom: Theme Toggle */}
      <div className="px-4 pb-5 space-y-3">
        <div className="flex items-center bg-secondary rounded-full p-1">
          <button
            onClick={() => { if (isDark) toggleTheme(); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-xs font-medium transition-all duration-200 ${
              !isDark ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => { if (!isDark) toggleTheme(); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-xs font-medium transition-all duration-200 ${
              isDark ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
