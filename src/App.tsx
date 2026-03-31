import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import DashboardPage from "@/pages/DashboardPage";
import InboxPage from "@/pages/InboxPage";
import PipelinePage from "@/pages/PipelinePage";
import InventoryPage from "@/pages/InventoryPage";
import FollowupPage from "@/pages/FollowupPage";
import WaitlistPage from "@/pages/WaitlistPage";
import RepassePage from "@/pages/RepassePage";
import AdsPage from "@/pages/AdsPage";
import StudioIAPage from "@/pages/StudioIAPage";
import SettingsPage from "@/pages/SettingsPage";
import LoginPage from "@/pages/LoginPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/inbox" element={<InboxPage />} />
              <Route path="/pipeline" element={<PipelinePage />} />
              <Route path="/estoque" element={<InventoryPage />} />
              <Route path="/followup" element={<FollowupPage />} />
              <Route path="/lista-inteligente" element={<WaitlistPage />} />
              <Route path="/repasse" element={<RepassePage />} />
              <Route path="/ads" element={<AdsPage />} />
              <Route path="/studio-ia" element={<StudioIAPage />} />
              <Route path="/configuracoes" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
