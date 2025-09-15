// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Dashboard } from "@/pages/Dashboard";
import { CellManagement } from "@/pages/CellManagement";
import { LeaderManagement } from "@/pages/LeaderManagement";
import { DiscipuladorManagement } from "@/pages/DiscipuladorManagement";
import { CellReports } from "@/pages/CellReports";
import { NetworkReports } from "@/pages/NetworkReports";
import { Statistics } from "@/pages/Statistics";
import NotFound from "./pages/NotFound";

import FancyLoader from "./components/FancyLoader";
import { useDelayedLoading } from "./hooks/useDelayedLoading";

import { Auth } from "./pages/Auth";

// CURSOS
import Courses from "./pages/cursos/Courses";          // <-- roteador (Pastor/Discipulador/Líder)
import CourseAdmin from "./pages/cursos/CourseAdmin";  // <-- admin do Pastor (rota separada /admin-cursos)

const queryClient = new QueryClient();

function ReportsRouter() {
  const { user } = useAuth();
  if (!user) return null;
  return user.role === "lider" ? <CellReports /> : <NetworkReports />;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  // mostra o loader até a auth terminar + garante um tempo mínimo pra animação
  const showLoader = useDelayedLoading(!loading, 2600);
  if (showLoader) {
    return (
      <FancyLoader
        message="Carregando dados…"
        tips={[
          "Conferindo conexões…",
          "Atualizando informações…",
          "Organizando a visualização…",
        ]}
      />
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/auth" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  // mesmo esquema aqui pra deixar a transição suave
  const showLoader = useDelayedLoading(!loading, 1200);
  if (showLoader) {
    return (
      <FancyLoader
        message="Preparando a entrada…"
        tips={[
          "Verificando suas credenciais…",
          "Abençoando a sessão 🙌",
          "Quase lá…",
        ]}
      />
    );
  }

  return isAuthenticated ? <Navigate to="/" replace /> : <>{children}</>;
}

function AppContent() {
  return (
    <Routes>
      {/* público */}
      <Route
        path="/auth"
        element={
          <PublicRoute>
            <Auth />
          </PublicRoute>
        }
      />

      {/* privado */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/celula" element={<CellManagement />} />
        <Route path="/lideres" element={<LeaderManagement />} />
        <Route path="/discipuladores" element={<DiscipuladorManagement />} />
        <Route path="/relatorios" element={<ReportsRouter />} />
        <Route path="/cursos" element={<Courses />} />            {/* <- agora aponta pro roteador por papel */}
        <Route path="/admin-cursos" element={<CourseAdmin />} />  {/* <- admin do Pastor direto */}
        <Route path="/eventos" element={<div>Eventos (Em breve)</div>} />
        <Route path="/estatisticas" element={<Statistics />} />
        <Route path="/gerenciar" element={<div>Gerenciar Igreja (Em breve)</div>} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
