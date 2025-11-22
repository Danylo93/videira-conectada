export type UserRole = 'pastor' | 'obreiro' | 'discipulador' | 'lider';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  discipuladorId?: string; // Para Líderes
  pastorId?: string; // Para Discipuladores
  celula?: string; // Para Líderes
  isTesoureiro?: boolean; // Indica se o usuário tem função de tesoureiro
  createdAt: Date;
}

// Helper function to check if user has financial access
export function hasFinancialAccess(user: User | null): boolean {
  if (!user) return false;
  return user.role === 'pastor' || user.role === 'obreiro' || user.isTesoureiro === true;
}

export type AuthTransition = 'initial' | 'login' | 'logout';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  authTransition: AuthTransition;
}