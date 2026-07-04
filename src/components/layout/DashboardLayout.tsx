import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Outlet, useLocation } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export function DashboardLayout() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-4 sm:p-6">
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