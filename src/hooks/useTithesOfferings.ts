import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { tithesOfferingsService } from '@/integrations/supabase/tithes-offerings';
import { TitheOffering, TitheOfferingFilters, TitheOfferingStats } from '@/types/church';

export function useTithesOfferings(filters?: TitheOfferingFilters) {
  const { user } = useAuth();
  const [tithesOfferings, setTithesOfferings] = useState<TitheOffering[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTithesOfferings = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await tithesOfferingsService.getTithesOfferings(filters);
      
      if (error) {
        setError(error);
        setTithesOfferings([]);
      } else {
        setTithesOfferings(data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setTithesOfferings([]);
    } finally {
      setLoading(false);
    }
  }, [user, filters]);

  useEffect(() => {
    fetchTithesOfferings();
  }, [fetchTithesOfferings]);

  const createTitheOffering = useCallback(async (data: Omit<TitheOffering, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };

    try {
      const { data: result, error } = await tithesOfferingsService.createTitheOffering(data);
      
      if (error) {
        return { success: false, error };
      }

      await fetchTithesOfferings();
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
  }, [user, fetchTithesOfferings]);

  const updateTitheOffering = useCallback(async (id: string, data: Partial<Omit<TitheOffering, 'id' | 'createdAt' | 'updatedAt'>>) => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };

    try {
      const { data: result, error } = await tithesOfferingsService.updateTitheOffering(id, data);
      
      if (error) {
        return { success: false, error };
      }

      await fetchTithesOfferings();
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
  }, [user, fetchTithesOfferings]);

  const deleteTitheOffering = useCallback(async (id: string) => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };

    try {
      const { error } = await tithesOfferingsService.deleteTitheOffering(id);
      
      if (error) {
        return { success: false, error };
      }

      await fetchTithesOfferings();
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
  }, [user, fetchTithesOfferings]);

  return {
    tithesOfferings,
    loading,
    error,
    createTitheOffering,
    updateTitheOffering,
    deleteTitheOffering,
    refetch: fetchTithesOfferings,
  };
}

export function useTithesOfferingsStats(month?: number, year?: number) {
  const { user } = useAuth();
  const [stats, setStats] = useState<TitheOfferingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await tithesOfferingsService.getTithesOfferingsStats(month, year);
      
      if (error) {
        setError(error);
        setStats(null);
      } else {
        setStats(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [user, month, year]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}

export function useAllMembers() {
  const { user } = useAuth();
  const [members, setMembers] = useState<Array<{ id: string; name: string; type: string; liderId?: string; discipuladorId?: string; pastorId?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await tithesOfferingsService.getAllMembers();
      
      if (error) {
        setError(error);
        setMembers([]);
      } else {
        setMembers(data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return {
    members,
    loading,
    error,
    refetch: fetchMembers,
  };
}
