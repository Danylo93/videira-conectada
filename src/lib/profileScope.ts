import type { ProfileMode } from '@/contexts/ProfileModeContext';

/**
 * Restringe uma query da tabela `profiles` ao escopo do Modo de Perfil atual.
 *
 * - normal:    perfis que NÃO são kids e NÃO são radicais
 * - kids:      perfis com is_kids = true
 * - radicais:  perfis com is_radicais = true
 *
 * O Supabase combina chamadas `.or()` sucessivas com AND, então o modo normal
 * exige que ambos os flags estejam nulos/false.
 */
export function applyProfileScope<T>(query: T, mode: ProfileMode): T {
  // Usa `any` internamente para evitar instanciação profunda dos tipos do Supabase.
  const q = query as any;
  if (mode === 'kids') {
    return q.eq('is_kids', true);
  }
  if (mode === 'radicais') {
    return q.eq('is_radicais', true);
  }
  return q
    .or('is_kids.is.null,is_kids.eq.false')
    .or('is_radicais.is.null,is_radicais.eq.false');
}

/**
 * Flags de gravação para um novo profile de acordo com o modo de perfil atual.
 * Usado ao criar líderes/discipuladores para que nasçam no escopo correto.
 */
export function profileScopeFlags(mode: ProfileMode): { is_kids: boolean; is_radicais: boolean } {
  return {
    is_kids: mode === 'kids',
    is_radicais: mode === 'radicais',
  };
}
