// src/App.tsx
import { type ReactNode, useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import type { AuthTransition } from "@/types/auth";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Dashboard } from "@/pages/Dashboard";
import { CellManagement } from "@/pages/CellManagement";
import { LeaderManagement } from "@/pages/LeaderManagement";
import { DiscipuladorManagement } from "@/pages/DiscipuladorManagement";
import { CellReports } from "@/pages/CellReports";
import { NetworkReports } from "@/pages/NetworkReports";
import { Statistics } from "@/pages/Statistics";
import { ChurchManagement } from "@/pages/ChurchManagement";
import { Profile } from "@/pages/Profile";
import { Settings } from "@/pages/Settings";
import NotFound from "./pages/NotFound";

import FancyLoader from "./components/FancyLoader";
import { useDelayedLoading } from "./hooks/useDelayedLoading";

import { Auth } from "./pages/Auth";

// CURSOS
import Courses from "./pages/cursos/Courses";          // <-- roteador (Pastor/Discipulador/Líder)
import CourseAdmin from "./pages/cursos/CourseAdmin";  // <-- admin do Pastor (rota separada /admin-cursos)

const queryClient = new QueryClient();

type LoaderCopy = {
  message: string;
  tips: string[];
};

const PROTECTED_LOADER_COPY: Record<AuthTransition, LoaderCopy> = {
  initial: {
    message: "Colhendo os frutos do seu painel",
    tips: [
      "Azeitando as engrenagens do templo digital…",
      "Conferindo se o maná dos relatórios já caiu…",
      "Separando pão e peixe pra alimentar os gráficos…",
    ],
  },
  login: {
    message: "Estendendo o tapete de púrpura pra sua chegada",
    tips: [
      "Afinando as trombetas de Jericó pro seu login triunfal…",
      "Sacudindo o pó das sandálias apostólicas pra você entrar com estilo…",
      "Misturando maná fresquinho com café santo pros indicadores despertarem…",
    ],
  },
  logout: {
    message: "Abençoando sua saída com paz e muita uva",
    tips: [
      "Guardando as tábuas do dashboard no Santo dos Santos digital…",
      "Mandando os levitas apagarem as lamparinas com carinho…",
      "Separando um cacho especial pra sua volta triunfal…",
    ],
  },
};

const PUBLIC_LOADER_COPY: Record<AuthTransition, LoaderCopy> = {
  initial: {
    message: "Abrindo os portões da Videira",
    tips: [
      "Conferindo seu nome no Livro da Vida digital…",
      "Polindo o cálice da sessão 🙌",
      "Chamando os levitas da autenticação…",
    ],
  },
  login: {
    message: "Abrindo os portões da Videira",
    tips: [
      "Conferindo seu nome no Livro da Vida digital…",
      "Polindo o cálice da sessão 🙌",
      "Chamando os levitas da autenticação…",
    ],
  },
  logout: {
    message: "Fechando o portão com abraço apostólico",
    tips: [
      "Enviando os querubins do suporte pra te escoltar com shalom…",
      "Recolhendo os pães da proposição pra próxima reunião…",
      "Desejando viagem em paz e preparando a senha celestial pra volta…",
    ],
  },
};

function ReportsRouter() {
  const { user } = useAuth();
  if (!user) return null;
  return user.role === "lider" ? <CellReports /> : <NetworkReports />;
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading, authTransition } = useAuth();
  const [loaderCopy, setLoaderCopy] = useState<LoaderCopy>(PROTECTED_LOADER_COPY.initial);


  useEffect(() => {
    if (loading) {
      setLoaderCopy(PROTECTED_LOADER_COPY[authTransition] ?? PROTECTED_LOADER_COPY.initial);
    }
  }, [authTransition, loading]);
    
    const showLoader = useDelayedLoading(!loading, 2600);
    if (showLoader) {


  // mostra o loader até a auth terminar + garante um tempo mínimo pra animação
  return <FancyLoader message={loaderCopy.message} tips={loaderCopy.tips} />;
    }
  return isAuthenticated ? <>{children}</> : <Navigate to="/auth" replace />;
}


function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading,authTransition } = useAuth();



  // mesmo esquema aqui pra deixar a transição suave
  const showLoader = useDelayedLoading(!loading, 1200);
  if (showLoader) {
    const loader = PUBLIC_LOADER_COPY[authTransition] ?? PUBLIC_LOADER_COPY.initial;
    return <FancyLoader message={loader.message} tips={loader.tips} />;
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
        <Route path="/gerenciar" element={<ChurchManagement />} />
        <Route path="/perfil" element={<Profile />} />
        <Route path="/configuracoes" element={<Settings />} />
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
