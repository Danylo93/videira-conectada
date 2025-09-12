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
  createdAt: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}