import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Auth } from "@/pages/Auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Dashboard } from "@/pages/Dashboard";
import { CellManagement } from "@/pages/CellManagement";
import { CourseRegistration } from "@/pages/CourseRegistration";
import { CellReports } from "@/pages/CellReports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/auth" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return isAuthenticated ? <Navigate to="/" replace /> : <>{children}</>;
}

function AppContent() {
  return (
    <Routes>
      <Route path="/auth" element={
        <PublicRoute>
          <Auth />
        </PublicRoute>
      } />
      <Route path="/" element={
        <ProtectedRoute>
          <DashboardLayout>
            <Dashboard />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/celula" element={
        <ProtectedRoute>
          <DashboardLayout>
            <CellManagement />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/relatorios" element={
        <ProtectedRoute>
          <DashboardLayout>
            <CellReports />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/cursos" element={
        <ProtectedRoute>
          <DashboardLayout>
            <CourseRegistration />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/eventos" element={<div>Eventos (Em breve)</div>} />
      <Route path="/estatisticas" element={<div>Estatísticas (Em breve)</div>} />
      <Route path="/gerenciar" element={<div>Gerenciar Igreja (Em breve)</div>} />
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
