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
  ClipboardList,
  Droplets,
  LucideIcon
} from 'lucide-react';
import { getProfileModeConfig } from '@/config/profileModes';
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

import logoRadicaisBranco from '@/assets/logo-rl-branco.png';

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
    title: 'Relatórios',
    url: '/relatorios',
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
    roles: ['pastor', 'obreiro', 'lider'], // Líderes com is_tesoureiro também terão acesso
    kidsMode: false, // Não aparece no modo Kids
  },
  {
    title: 'Dizimistas',
    url: '/dizimistas',
    icon: Users,
    roles: ['pastor', 'obreiro', 'lider'], // Líderes com is_tesoureiro também terão acesso
    kidsMode: false, // Não aparece no modo Kids
  },
  {
    title: 'Batismo',
    url: '/batizantes',
    icon: Droplets,
    roles: ['pastor', 'obreiro', 'discipulador', 'lider'],
    kidsMode: false, // Não aparece no modo Kids
  },
  {
    title: 'Escalas',
    url: '/escalas',
    icon: ClipboardList,
    roles: ['pastor', 'discipulador', 'lider'],
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
  const isRadicais = mode === 'radicais';
  const config = getProfileModeConfig(mode);

  // Navegação enxuta para líderes: apenas o essencial do dia a dia
  const LIDER_ALLOWED_URLS = ['/', '/celula', '/relatorios'];

  const filteredItems = navigationItems.filter(item => {
    // Verifica se o item está disponível para o role do usuário
    const hasRoleAccess = item.roles.includes(user.role);

    // Se for item financeiro (Financeiro ou Dizimistas), verifica também se é tesoureiro
    const isFinancialItem = item.url === '/financeiro' || item.url === '/dizimistas';
    const hasTesoureiroAccess = isFinancialItem && user.isTesoureiro === true;

    if (!hasRoleAccess && !hasTesoureiroAccess) return false;

    // Líder vê somente: Dashboard, Minha Célula e Relatórios
    // (tesoureiro mantém acesso aos itens financeiros)
    if (user.role === 'lider' && !LIDER_ALLOWED_URLS.includes(item.url) && !hasTesoureiroAccess) {
      return false;
    }

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

  const filteredAccountItems = accountItems.filter(item => {
    if (!item.roles.includes(user.role)) return false;
    // Líder: apenas Perfil na seção de conta
    if (user.role === 'lider' && item.url !== '/perfil') return false;
    return true;
  });

  const isActive = (path: string) => location.pathname === path;

  return (
    <SidebarComponent className={collapsed ? "w-14" : "w-64"}>
      <SidebarContent>
        {/* Logo Section */}
        <div className={`p-4 border-b ${isRadicais ? 'border-white/10' : ''}`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md ${
              isRadicais
                ? 'bg-gradient-to-br from-orange-500/20 to-amber-500/20 ring-1 ring-orange-500/30'
                : 'bg-white'
            }`}>
              <img
                src={isRadicais ? logoRadicaisBranco : config.logo}
                alt={`${config.sidebarTitle} Logo`}
                className={`w-9 h-9 ${isRadicais ? 'brightness-200 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]' : ''} ${config.logoRounded ? 'rounded-full' : ''}`}
              />
            </div>
            {!collapsed && (
              <div>
                <h2 className={`font-bold text-lg ${
                  isRadicais
                    ? 'bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent'
                    : config.titleGradientClass
                }`}>
                  {config.sidebarTitle}
                </h2>
                {config.sidebarSubtitle && (
                  <p className={`text-xs ${isRadicais ? 'text-white/40' : 'text-muted-foreground'}`}>
                    {config.sidebarSubtitle}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className={isRadicais ? 'text-white/30' : ''}>
            Navegação
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="stagger">
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title} className="stagger-item">
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    className={cn(
                      'group relative flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 hover:translate-x-0.5 active:scale-[0.98]',
                      isActive(item.url)
                        ? isRadicais
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20 font-medium'
                          : 'bg-primary text-primary-foreground shadow-soft font-medium'
                        : isRadicais
                          ? 'text-white/60 hover:text-white/90 hover:bg-white/5'
                          : 'text-sidebar-foreground hover:bg-muted'
                    )}
                  >
                    <NavLink to={item.url}>
                      {isActive(item.url) && !isRadicais && (
                        <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary-foreground/80" />
                      )}
                      <item.icon className="w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className={isRadicais ? 'text-white/30' : ''}>
            Conta
          </SidebarGroupLabel>
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
                        ? isRadicais
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20'
                          : 'bg-primary text-primary-foreground grape-glow'
                        : isRadicais
                          ? 'text-white/60 hover:text-white/90 hover:bg-white/5'
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
          <div className={`mt-auto p-4 border-t ${isRadicais ? 'border-white/10' : ''}`}>
            <div className={`rounded-lg p-3 ${
              isRadicais
                ? 'bg-orange-500/10 border border-orange-500/20'
                : 'bg-muted'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  isRadicais ? 'bg-orange-400' : 'bg-success'
                }`}></div>
                <span className={`text-sm font-medium ${isRadicais ? 'text-orange-200' : ''}`}>
                  {user.role === 'pastor' && (user.isObreiro ? 'Obreiro' : 'Pastor')}
                  {user.role === 'discipulador' && 'Discipulador'}
                  {user.role === 'lider' && 'Líder'}
                </span>
              </div>
              {user.celula && (
                <p className={`text-xs mt-1 ${isRadicais ? 'text-orange-300/50' : 'text-muted-foreground'}`}>
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