import { supabase } from './client';
import { applyProfileScope } from '@/lib/profileScope';
import { getPastorScopeId, type User } from '@/types/auth';
import type { ProfileMode } from '@/contexts/ProfileModeContext';

export interface RosterProfile {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role?: string;
  discipulador_uuid?: string | null;
  pastor_uuid?: string | null;
  created_at: string;
}

const ROSTER_COLUMNS = 'id, name, email, phone, role, discipulador_uuid, pastor_uuid, created_at';

/**
 * Camada de dados de perfis (papéis discipulador/líder), centralizando o
 * escopo por Modo de Perfil (applyProfileScope) e por pastor (getPastorScopeId).
 * Evita repetir o mesmo `from('profiles')...eq('role')...applyProfileScope` em
 * cada página.
 */
export const profilesService = {
  /** Discipuladores sob o pastor do usuário, no escopo do modo atual. */
  async getDiscipuladores(user: User, mode: ProfileMode): Promise<RosterProfile[]> {
    let query = supabase
      .from('profiles')
      .select(ROSTER_COLUMNS)
      .in('role', ['discipulador', 'obreiro', 'pastor'])
      .eq('pastor_uuid', getPastorScopeId(user));
    query = applyProfileScope(query, mode);
    const { data, error } = await query.order('name');
    if (error) throw error;
    return (data ?? []) as RosterProfile[];
  },

  /**
   * Líderes no escopo do modo atual.
   * - pastor/obreiro: todos os líderes sob o pastor real
   * - discipulador: apenas os líderes da própria rede
   * Pode ser refinado por `discipuladorId`.
   */
  async getLeaders(
    user: User,
    mode: ProfileMode,
    opts: { discipuladorId?: string } = {},
  ): Promise<RosterProfile[]> {
    let query = supabase.from('profiles').select(ROSTER_COLUMNS).in('role', ['lider', 'obreiro', 'pastor']);

    if (user.role === 'discipulador') {
      query = query.eq('discipulador_uuid', user.id);
    } else {
      query = query.eq('pastor_uuid', getPastorScopeId(user));
    }
    if (opts.discipuladorId) {
      query = query.eq('discipulador_uuid', opts.discipuladorId);
    }

    query = applyProfileScope(query, mode);
    const { data, error } = await query.order('name');
    if (error) throw error;
    return (data ?? []) as RosterProfile[];
  },
};
