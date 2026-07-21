import { Users, Sparkles, Flame, type LucideIcon } from 'lucide-react';
import type { ProfileMode } from '@/contexts/ProfileModeContext';
import logoVideira from '@/assets/logo-videira.png';
import logoKids from '@/assets/logo-kids.jpg';
import logoRadicais from '@/assets/logo-rl.jpg';

/**
 * Fonte única de verdade para a apresentação de cada Modo de Perfil
 * (normal / kids / radicais). Em vez de espalhar `mode === 'kids' ? ... : ...`
 * por Header, Sidebar, Dashboard etc., todos consomem esta config.
 */
export interface ProfileModeConfig {
  mode: ProfileMode;
  /** Rótulo no menu "Modo de Perfil" (ex.: "Modo Kids"). */
  menuLabel: string;
  /** Rótulo curto para badges/títulos (ex.: "Kids"). */
  shortLabel: string;
  /** Nome do sistema exibido no Header. */
  systemName: string;
  /** Marca curta do ministério (usada na tela de login). */
  brandName: string;
  /** Título exibido na Sidebar. */
  sidebarTitle: string;
  /** Subtítulo opcional na Sidebar. */
  sidebarSubtitle?: string;
  /** Texto do badge no Header (ausente no modo normal). */
  badgeLabel?: string;
  icon: LucideIcon;
  logo: string;
  logoRounded: boolean;
  /** Classe aplicada em <html> para o tema (ausente no normal). */
  themeClass?: string;
  /** Classes Tailwind do gradiente do título. */
  titleGradientClass: string;
  /** Domínio usado para gerar e-mails de novas contas neste escopo. */
  emailDomain: string;
  /** Apelido do pastor neste modo (ex.: Kids = Pastora Tainá). */
  pastorAlias?: { name: string; role: string };
}

const NORMAL_TITLE_GRADIENT =
  'bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent';

export const PROFILE_MODE_CONFIG: Record<ProfileMode, ProfileModeConfig> = {
  normal: {
    mode: 'normal',
    menuLabel: 'Modo Normal',
    shortLabel: 'Normal',
    systemName: 'Sistema Videira São Miguel',
    brandName: 'Videira São Miguel',
    sidebarTitle: 'Videira',
    sidebarSubtitle: 'São Miguel',
    icon: Users,
    logo: logoVideira,
    logoRounded: false,
    titleGradientClass: NORMAL_TITLE_GRADIENT,
    emailDomain: 'videirasaomiguel.com',
  },
  kids: {
    mode: 'kids',
    menuLabel: 'Modo Kids',
    shortLabel: 'Kids',
    systemName: 'Videira Kids',
    brandName: 'Videira Kids',
    sidebarTitle: 'Videira Kids',
    badgeLabel: 'Kids',
    icon: Sparkles,
    logo: logoKids,
    logoRounded: true,
    themeClass: 'kids-mode',
    titleGradientClass: 'bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent',
    emailDomain: 'radicaiskids.com',
    pastorAlias: { name: 'Tainá', role: 'Pastora' },
  },
  radicais: {
    mode: 'radicais',
    menuLabel: 'Modo Radicais Livres',
    shortLabel: 'Radicais',
    systemName: 'Radicais Livres São Miguel',
    brandName: 'Radicais Livres São Miguel',
    sidebarTitle: 'Radicais Livres',
    sidebarSubtitle: 'São Miguel',
    badgeLabel: 'Radicais',
    icon: Flame,
    logo: logoRadicais,
    logoRounded: true,
    themeClass: 'radicais-mode',
    titleGradientClass: 'bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent',
    emailDomain: 'rlsaomiguel.com',
  },
};

/** Ordem canônica dos modos (usada em menus e no ciclo de toggle). */
export const PROFILE_MODE_ORDER: ProfileMode[] = ['normal', 'kids', 'radicais'];

export const getProfileModeConfig = (mode: ProfileMode): ProfileModeConfig =>
  PROFILE_MODE_CONFIG[mode] ?? PROFILE_MODE_CONFIG.normal;

/**
 * Modo padrão para um usuário sem preferência salva: cai no escopo do próprio
 * perfil (radicais > kids > normal), para que cada um veja seus próprios dados.
 */
export function getDefaultModeForUser(
  user: { isRadicais?: boolean; isKids?: boolean } | null,
): ProfileMode {
  if (user?.isRadicais) return 'radicais';
  if (user?.isKids) return 'kids';
  return 'normal';
}
