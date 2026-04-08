import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import AppHeader from "./AppHeader";

const AppLayout = () => {
  return (
    <div className="min-h-screen flex bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-h-screen min-w-0 overflow-hidden" style={{ marginLeft: "var(--sidebar-width)" }}>
        <AppHeader />
        <main className="flex-1 overflow-hidden flex flex-col pt-16">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
