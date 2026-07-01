// src/App.tsx
import { type ReactNode, type ComponentType, useEffect, useState, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProfileModeProvider } from "@/contexts/ProfileModeContext";
import type { AuthTransition } from "@/types/auth";

// Shell sempre presente (não faz parte do code-splitting de rotas)
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import FancyLoader from "./components/FancyLoader";
import { useDelayedLoading } from "./hooks/useDelayedLoading";
import { usePageTitle } from "./hooks/use-page-title";

// Páginas carregadas sob demanda (code-splitting por rota) ------------------
const named = <T extends Record<string, unknown>>(
  factory: () => Promise<T>,
  key: keyof T,
) => lazy(() => factory().then((m) => ({ default: m[key] as ComponentType })));

const Dashboard = named(() => import("@/pages/Dashboard"), "Dashboard");
const CellManagement = named(() => import("@/pages/CellManagement"), "CellManagement");
const LeaderManagement = named(() => import("@/pages/LeaderManagement"), "LeaderManagement");
const DiscipuladorManagement = named(() => import("@/pages/DiscipuladorManagement"), "DiscipuladorManagement");
const CellReports = named(() => import("@/pages/CellReports"), "CellReports");
const CellReportsWeekly = named(() => import("@/pages/CellReportsWeekly"), "CellReportsWeekly");
const PublicWeeklyReport = named(() => import("@/pages/PublicWeeklyReport"), "PublicWeeklyReport");
const PublicWeeklyReportsDashboard = named(() => import("@/pages/PublicWeeklyReportsDashboard"), "PublicWeeklyReportsDashboard");
const PublicDizimistaRegistration = named(() => import("@/pages/PublicDizimistaRegistration"), "PublicDizimistaRegistration");
const PublicDizimistasView = named(() => import("@/pages/PublicDizimistasView"), "PublicDizimistasView");
const PublicBatismoRegistration = named(() => import("@/pages/PublicBatismoRegistration"), "PublicBatismoRegistration");
const PublicBatizantesView = named(() => import("@/pages/PublicBatizantesView"), "PublicBatizantesView");
const PublicEncounterRegistration = named(() => import("@/pages/PublicEncounterRegistration"), "PublicEncounterRegistration");
const PublicEncontroRegistrationsView = named(() => import("@/pages/PublicEncontroRegistrationsView"), "PublicEncontroRegistrationsView");
const PublicEncounterKidsRegistration = named(() => import("@/pages/PublicEncounterKidsRegistration"), "PublicEncounterKidsRegistration");
const PublicEncounterBabysRegistration = named(() => import("@/pages/PublicEncounterKidsRegistration"), "PublicEncounterBabysRegistration");
const PublicEncounterKidsRegistrationsView = named(() => import("@/pages/PublicEncounterKidsRegistrationsView"), "PublicEncounterKidsRegistrationsView");
const PublicEncounterBabysRegistrationsView = named(() => import("@/pages/PublicEncounterKidsRegistrationsView"), "PublicEncounterBabysRegistrationsView");
const PublicTrilhoCoursesWeeklyList = named(() => import("@/pages/PublicTrilhoCoursesWeeklyList"), "PublicTrilhoCoursesWeeklyList");
const PublicEscalasView = named(() => import("@/pages/PublicEscalasView"), "PublicEscalasView");
const PublicEscalasEdit = named(() => import("@/pages/PublicEscalasEdit"), "PublicEscalasEdit");
const BatizantesView = named(() => import("@/pages/BatizantesView"), "BatizantesView");
const NetworkReports = named(() => import("@/pages/NetworkReports"), "NetworkReports");
const ServiceReports = named(() => import("@/pages/ServiceReports"), "ServiceReports");
const Statistics = named(() => import("@/pages/StatisticsNew"), "StatisticsNew");
const ChurchManagement = named(() => import("@/pages/ChurchManagementNew"), "ChurchManagementNew");
const Profile = named(() => import("@/pages/Profile"), "Profile");
const Settings = named(() => import("@/pages/Settings"), "Settings");
const Auth = named(() => import("./pages/Auth"), "Auth");
const TithesOfferings = named(() => import("./pages/TithesOfferings"), "TithesOfferings");
const Financial = named(() => import("./pages/Financial"), "Financial");
const Escalas = named(() => import("./pages/Escalas"), "Escalas");

const NotFound = lazy(() => import("./pages/NotFound"));
const Courses = lazy(() => import("./pages/cursos/Courses"));
const CourseAdminNew = lazy(() => import("./pages/cursos/CourseAdminNew"));
const Events = lazy(() => import("./pages/eventos/Events"));
const Encounters = lazy(() => import("./pages/encounters/Encounters"));
const EncounterEvents = lazy(() => import("./pages/encounters/EncounterEvents"));

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
  // Líderes e pastores veem CellReports (pastor pode criar relatórios com abas)
  // Discipuladores e obreiros veem NetworkReports (apenas visualização)
  if (user.role === "lider" || user.role === "pastor") {
    return <CellReports />;
  }
  return <NetworkReports />;
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
  usePageTitle();

  return (
    <Suspense fallback={<FancyLoader message="Carregando…" tips={["Preparando esta página…"]} />}>
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
      <Route
        path="/preencher-relatorio"
        element={<PublicWeeklyReport />}
      />
      <Route
        path="/dashboard-relatorios-semanais/:pastorId"
        element={<PublicWeeklyReportsDashboard />}
      />
      <Route
        path="/dashboard-relatorios-semanais/:pastorId/:mode"
        element={<PublicWeeklyReportsDashboard />}
      />
      <Route
        path="/cadastro-dizimista"
        element={<PublicDizimistaRegistration />}
      />
      <Route
        path="/cadastro-batismo"
        element={<PublicBatismoRegistration />}
      />
      <Route
        path="/acompanhamento-batismo"
        element={<PublicBatizantesView />}
      />
      <Route
        path="/cadastro-encontro"
        element={<PublicEncounterRegistration />}
      />
      <Route
        path="/acompanhamento-encontro"
        element={<PublicEncontroRegistrationsView />}
      />
      <Route
        path="/cadastro-encontro-kids"
        element={<PublicEncounterKidsRegistration />}
      />
      <Route
        path="/cadastro-encontro-babys"
        element={<PublicEncounterBabysRegistration />}
      />
      <Route
        path="/acompanhamento-encontro-kids"
        element={<PublicEncounterKidsRegistrationsView />}
      />
      <Route
        path="/acompanhamento-encontro-babys"
        element={<PublicEncounterBabysRegistrationsView />}
      />
      <Route
        path="/lista-cursos-trilho"
        element={<PublicTrilhoCoursesWeeklyList />}
      />
      <Route
        path="/escalas"
        element={<PublicEscalasView />}
      />
      <Route
        path="/admin-escalas"
        element={<PublicEscalasEdit />}
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
        <Route path="/relatorios-semanal" element={<CellReportsWeekly />} />
        <Route path="/relatorios-culto" element={<ServiceReports />} />
        <Route path="/cursos" element={<Courses />} />            {/* <- agora aponta pro roteador por papel */}
        <Route path="/admin-cursos" element={<CourseAdminNew />} />  {/* <- admin do Pastor direto */}
        <Route path="/eventos" element={<Events />} />            {/* <- agora aponta pro roteador por papel */}
        <Route path="/encounters" element={<Encounters />} />     {/* <- Encontro com Deus (Pastor/Discipulador) */}
        <Route path="/encounters/events" element={<EncounterEvents />} /> {/* <- Eventos de Encontro (Pastor/Discipulador) */}
        <Route path="/dizimos-ofertas" element={<TithesOfferings />} /> {/* <- Dízimos e Ofertas (Pastor/Obreiro/Tesoureiro) */}
        <Route path="/financeiro" element={<Financial />} /> {/* <- Financeiro (Pastor/Obreiro/Tesoureiro) */}
        <Route path="/dizimistas" element={<PublicDizimistasView />} /> {/* <- Dizimistas (Pastor/Obreiro/Tesoureiro) */}
        <Route path="/batizantes" element={<BatizantesView />} /> {/* <- Batizantes (Pastor/Obreiro/Discipulador/Líder) */}
        <Route path="/escalas-privado" element={<Escalas />} /> {/* <- Escalas (Pastor/Discipulador/Líder) */}
        <Route path="/estatisticas" element={<Statistics />} />
        <Route path="/gerenciar" element={<ChurchManagement />} />
        <Route path="/perfil" element={<Profile />} />
        <Route path="/configuracoes" element={<Settings />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
    </Suspense>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ProfileModeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </TooltipProvider>
      </ProfileModeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
