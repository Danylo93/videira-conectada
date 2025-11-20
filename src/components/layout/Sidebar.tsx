import { useAuth } from '@/contexts/AuthContext';
import { useProfileMode } from '@/contexts/ProfileModeContext';
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
  DollarSign,
  LucideIcon
} from 'lucide-react';
import logoVideira from '@/assets/logo-videira.png';
import logoKids from '@/assets/logo-kids.jpg';
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
  kidsMode?: boolean; // Se true, aparece apenas no modo Kids. Se false, aparece apenas no modo normal. Se undefined, aparece em ambos
}

const navigationItems: NavigationItem[] = [
  {
    title: 'Dashboard',
    url: '/',
    icon: Home,
    roles: ['pastor', 'obreiro', 'discipulador', 'lider'],
  },
  {
    title: 'Minhas Células',
    url: '/celula',
    icon: Users,
    roles: ['lider', 'pastor'],
  },
  {
    title: 'Líderes',
    url: '/lideres',
    icon: Users,
    roles: ['discipulador', 'pastor'],
  },
  {
    title: 'Discipuladores',
    url: '/discipuladores',
    icon: Users,
    roles: ['pastor'],
  },
  {
    title: 'Relatório de Célula Mensal',
    url: '/relatorios',
    icon: FileText,
    roles: ['pastor', 'obreiro', 'discipulador', 'lider'],
  },
  {
    title: 'Relatório de Célula Semanal',
    url: '/relatorios-semanal',
    icon: FileText,
    roles: ['pastor', 'obreiro', 'discipulador', 'lider'],
  },
  {
    title: 'Relatórios de Culto',
    url: '/relatorios-culto',
    icon: Church,
    roles: ['pastor', 'lider'],
    kidsMode: undefined, // Aparece em ambos os modos, mas o título muda
  },
  {
    title: 'Cursos',
    url: '/cursos',
    icon: GraduationCap,
    roles: ['pastor', 'obreiro', 'discipulador', 'lider'],
    kidsMode: false, // Não aparece no modo Kids
  },
  {
    title: 'Agenda',
    url: '/eventos',
    icon: Calendar,
    roles: ['pastor', 'obreiro', 'discipulador', 'lider'],
    kidsMode: false, // Não aparece no modo Kids
  },
  {
    title: 'Financeiro',
    url: '/financeiro',
    icon: DollarSign,
    roles: ['pastor', 'obreiro'],
    kidsMode: false, // Não aparece no modo Kids
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
    kidsMode: false, // Não aparece no modo Kids
  },
  {
    title: 'Estatísticas',
    url: '/estatisticas',
    icon: BarChart3,
    roles: ['pastor', 'obreiro', 'discipulador'],
    kidsMode: false, // Não aparece no modo Kids
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
  const { mode } = useProfileMode();
  const { state } = useSidebar();
  const location = useLocation();

  if (!user) return null;

  const collapsed = state === "collapsed";
  const isKidsMode = mode === 'kids';

  const filteredItems = navigationItems.filter(item => {
    // Verifica se o item está disponível para o role do usuário
    if (!item.roles.includes(user.role)) return false;
    
    // Filtra por modo Kids
    if (isKidsMode) {
      // No modo Kids, mostra apenas itens sem kidsMode ou com kidsMode === true
      if (item.kidsMode === false) return false;
    } else {
      // No modo normal, mostra apenas itens sem kidsMode ou com kidsMode === false
      if (item.kidsMode === true) return false;
    }
    
    return true;
  }).map(item => {
    // Renomeia "Relatórios de Culto" para "Domingo Kids" no modo Kids
    if (item.url === '/relatorios-culto' && isKidsMode) {
      return { ...item, title: 'Domingo Kids' };
    }
    return item;
  });

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
              <img 
                src={isKidsMode ? logoKids : logoVideira} 
                alt={isKidsMode ? "Videira Kids Logo" : "Videira Logo"} 
                className={`w-9 h-9 ${isKidsMode ? 'rounded-full' : ''}`}
              />
            </div>
            {!collapsed && (
              <div>
                <h2 className={`font-bold text-lg ${isKidsMode ? 'bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent' : 'bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent'}`}>
                  {isKidsMode ? 'Videira Kids' : 'Videira'}
                </h2>
                {!isKidsMode && (
                  <p className="text-xs text-muted-foreground">São Miguel</p>
                )}
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