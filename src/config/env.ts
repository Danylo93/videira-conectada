// Environment configuration
export const config = {
  app: {
    name: 'Videira Conectada',
    version: '1.0.0',
    description: 'Sistema de Gestão de Células - Videira São Miguel',
  },
  api: {
    supabase: {
      url: import.meta.env.VITE_SUPABASE_URL || 'https://wkdfeizgfdkkkyatevpc.supabase.co',
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrZGZlaXpnZmRra2t5YXRldnBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3MDIwNDAsImV4cCI6MjA3MzI3ODA0MH0.RQZS8sWrcoipiO_v7vIyn4XP1rTenoj6EeT_YLK7T-M',
    },
  },
  features: {
    enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    enableErrorReporting: import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true',
    enableOfflineMode: import.meta.env.VITE_ENABLE_OFFLINE_MODE === 'true',
  },
  ui: {
    theme: {
      default: 'light',
      enableSystemTheme: true,
    },
    animations: {
      enableReducedMotion: false,
      defaultDuration: 300,
    },
  },
} as const;

export type Config = typeof config;
