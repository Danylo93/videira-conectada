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
  isCursoCoordenador?: boolean; // Coordenação do Trilho do Vencedor
  isObreiro?: boolean; // Verdadeiro quando o papel real é obreiro (acesso nível pastor)
  isKids?: boolean; // Perfil do ministério Kids
  isRadicais?: boolean; // Perfil do ministério Radicais Livres (jovens)
  createdAt: Date;
}

// Helper function to check if user has financial access
export function hasFinancialAccess(user: User | null): boolean {
  if (!user) return false;
  return user.role === 'pastor' || user.role === 'obreiro' || user.isTesoureiro === true;
}

/**
 * Id do pastor usado para escopar consultas "de pastor".
 * Para um pastor de verdade é o próprio id; para um obreiro (acesso nível
 * pastor) é o id do pastor sob o qual ele está, de modo que ele enxergue
 * toda a igreja, e não a própria rede (vazia).
 */
export function getPastorScopeId(user: User): string {
  return user.isObreiro && user.pastorId ? user.pastorId : user.id;
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
