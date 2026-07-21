import { useAuth } from '@/contexts/AuthContext';
import { useProfileMode } from '@/contexts/ProfileModeContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Outlet, useLocation } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export function DashboardLayout() {
  const { user } = useAuth();
  const { mode } = useProfileMode();
  const location = useLocation();

  if (!user) return null;

  const isRadicais = mode === 'radicais';

  return (
    <SidebarProvider>
      <div className={`min-h-screen flex w-full ${isRadicais ? 'bg-[hsl(20,45%,7%)]' : 'bg-background'}`}>
        {/* Gradiente sutil de fundo no modo radicais — dá profundidade */}
        {isRadicais && (
          <div className="pointer-events-none fixed inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-950/20 via-transparent to-amber-950/15" />
            <div className="absolute top-0 right-0 h-[50vh] w-[50vw] rounded-full bg-orange-500/[0.03] blur-[120px]" />
            <div className="absolute bottom-0 left-0 h-[40vh] w-[40vw] rounded-full bg-amber-500/[0.03] blur-[100px]" />
          </div>
        )}
        <Sidebar />
        {/* min-w-0 impede que tabelas largas empurrem a página além da viewport;
            o scroll horizontal fica contido nos próprios containers das tabelas. */}
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 p-4 sm:p-6 overflow-x-hidden">
            {/* Entrada suave a cada navegação; ErrorBoundary por rota evita que
                um erro numa tela derrube o app inteiro (key reseta ao navegar). */}
            <div key={location.pathname} className="animate-fade-up">
              <ErrorBoundary key={location.pathname}>
                <Outlet />
              </ErrorBoundary>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}