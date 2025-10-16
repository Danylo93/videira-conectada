import { useAuth } from '@/contexts/AuthContext';
import { useLocation, NavLink } from 'react-router-dom';
import {
  Home,
  Users,
  FileText,
  GraduationCap,
  Calendar,
  BarChart3,
  Church,
  Settings,
  UserCircle2,
  Heart,
  LucideIcon
} from 'lucide-react';
import logoVideira from '@/assets/logo-videira.png';
import {
  Sidebar as SidebarComponent,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

interface NavigationItem {
  title: string;
  url: string;
  icon: LucideIcon;
  roles: string[];
}

const navigationItems: NavigationItem[] = [
  {
    title: 'Dashboard',
    url: '/',
    icon: Home,
    roles: ['pastor', 'obreiro', 'discipulador', 'lider'],
  },
  {
    title: 'Minha Célula',
    url: '/celula',
    icon: Users,
    roles: ['lider'],
  },
  {
    title: 'Líderes',
    url: '/lideres',
    icon: Users,
    roles: ['discipulador'],
  },
  {
    title: 'Discipuladores',
    url: '/discipuladores',
    icon: Users,
    roles: ['pastor'],
  },
  {
    title: 'Relatórios de Célula',
    url: '/relatorios',
    icon: FileText,
    roles: ['pastor', 'obreiro', 'discipulador', 'lider'],
  },
  {
    title: 'Cursos',
    url: '/cursos',
    icon: GraduationCap,
    roles: ['pastor', 'obreiro', 'discipulador', 'lider'],
  },
  {
    title: 'Gerenciar Eventos',
    url: '/eventos',
    icon: Calendar,
    roles: ['pastor', 'obreiro', 'discipulador', 'lider'],
  },
  {
    title: 'Dízimos e Ofertas',
    url: '/dizimos-ofertas',
    icon: Church,
    roles: ['pastor', 'obreiro'],
  },
  // {
  //   title: 'Gerenciar Encontro com Deus',
  //   url: '/encounters',
  //   icon: Heart,
  //   roles: ['pastor', 'discipulador'],
  // },
  {
    title: 'Encontro com Deus',
    url: '/encounters/events',
    icon: Calendar,
    roles: ['pastor', 'discipulador'],
  },
  {
    title: 'Estatísticas',
    url: '/estatisticas',
    icon: BarChart3,
    roles: ['pastor', 'obreiro', 'discipulador'],
  },
  {
    title: 'Gerenciar Igreja',
    url: '/gerenciar',
    icon: Church,
    roles: ['pastor', 'obreiro'],
  },
];

const accountItems: NavigationItem[] = [
  {
    title: 'Perfil',
    url: '/perfil',
    icon: UserCircle2,
    roles: ['pastor', 'obreiro', 'discipulador', 'lider'],
  },
  {
    title: 'Configurações',
    url: '/configuracoes',
    icon: Settings,
    roles: ['pastor', 'obreiro', 'discipulador', 'lider'],
  },
];

export function Sidebar() {
  const { user } = useAuth();
  const { state } = useSidebar();
  const location = useLocation();

  if (!user) return null;

  const collapsed = state === "collapsed";

  const filteredItems = navigationItems.filter(item =>
    item.roles.includes(user.role)
  );

  const filteredAccountItems = accountItems.filter(item =>
    item.roles.includes(user.role)
  );

  const isActive = (path: string) => location.pathname === path;

  return (
    <SidebarComponent className={collapsed ? "w-14" : "w-64"}>
      <SidebarContent>
        {/* Logo Section */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md">
              <img src={logoVideira} alt="Videira Logo" className="w-9 h-9" />
            </div>
            {!collapsed && (
              <div>
                <h2 className="font-bold text-lg bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  Videira
                </h2>
                <p className="text-xs text-muted-foreground">São Miguel</p>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg transition-smooth',
                      isActive(item.url)
                        ? 'bg-primary text-primary-foreground grape-glow'
                        : 'text-sidebar-foreground hover:bg-muted'
                    )}
                  >
                    <NavLink to={item.url}>
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Conta</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredAccountItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg transition-smooth',
                      isActive(item.url)
                        ? 'bg-primary text-primary-foreground grape-glow'
                        : 'text-sidebar-foreground hover:bg-muted'
                    )}
                  >
                    <NavLink to={item.url}>
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User Role Badge */}
        {!collapsed && (
          <div className="mt-auto p-4 border-t">
            <div className="bg-muted rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">
                  {user.role === 'pastor' && 'Pastor'}
                  {user.role === 'obreiro' && 'Obreiro'}
                  {user.role === 'discipulador' && 'Discipulador'}
                  {user.role === 'lider' && 'Líder'}
                </span>
              </div>
              {user.celula && (
                <p className="text-xs text-muted-foreground mt-1">
                  {user.celula}
                </p>
              )}
            </div>
          </div>
        )}
      </SidebarContent>
    </SidebarComponent>
  );
}