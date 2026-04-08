import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import AppHeader from "./AppHeader";

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/10">
      <AppSidebar />
      <div 
        className="min-h-screen flex flex-col" 
        style={{ paddingLeft: "var(--sidebar-width)" }}
      >
        <AppHeader />
        {/* O pt-16 (64px) compensa exatamente a altura do Header Fixo. Páginas definem seus próprios paddings internos. */}
        <main className="flex-1 flex flex-col overflow-y-auto pt-16 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
