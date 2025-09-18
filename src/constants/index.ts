// Application constants

export const ROUTES = {
  HOME: '/',
  AUTH: '/auth',
  CELL_MANAGEMENT: '/celula',
  LEADER_MANAGEMENT: '/lideres',
  DISCIPULADOR_MANAGEMENT: '/discipuladores',
  REPORTS: '/relatorios',
  COURSES: '/cursos',
  COURSE_ADMIN: '/admin-cursos',
  EVENTS: '/eventos',
  STATISTICS: '/estatisticas',
  CHURCH_MANAGEMENT: '/gerenciar',
  PROFILE: '/perfil',
  SETTINGS: '/configuracoes',
} as const;

export const USER_ROLES = {
  PASTOR: 'pastor',
  OBREIRO: 'obreiro',
  DISCIPULADOR: 'discipulador',
  LIDER: 'lider',
} as const;

export const MEMBER_TYPES = {
  MEMBER: 'member',
  FREQUENTADOR: 'frequentador',
} as const;

export const REPORT_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  NEEDS_CORRECTION: 'needs_correction',
} as const;

export const CELL_PHASES = {
  COMUNHAO: 'Comunhão',
  EDIFICACAO: 'Edificação',
  EVANGELISMO: 'Evangelismo',
  MULTIPLICACAO: 'Multiplicação',
} as const;

export const COURSE_TYPES = {
  MATURIDADE: 'Maturidade no Espírito',
  CTL: 'CTL',
} as const;

export const EVENT_TYPES = {
  ENCONTRO: 'Encontro',
  CONFERENCIA: 'Conferência',
  IMERSAO: 'Imersão',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const;

export const DATE_FORMATS = {
  DISPLAY: 'dd/MM/yyyy',
  DISPLAY_WITH_TIME: 'dd/MM/yyyy HH:mm',
  API: 'yyyy-MM-dd',
  API_WITH_TIME: 'yyyy-MM-dd HH:mm:ss',
} as const;

export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
  MIN_PASSWORD_LENGTH: 6,
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
} as const;

export const STORAGE_KEYS = {
  THEME: 'videira-theme',
  USER_PREFERENCES: 'videira-user-preferences',
  LAST_VISITED_ROUTE: 'videira-last-route',
} as const;
