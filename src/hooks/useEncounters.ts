import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { EncounterWithGod, CreateEncounterWithGodData, UpdateEncounterWithGodData, EncounterFilters, EncounterStats } from '@/types/encounter';
import { toast } from '@/hooks/use-toast';
import { encountersService } from '@/integrations/supabase/encounters';
import { getTotalOfferings } from '@/integrations/supabase/offerings';

export function useEncounters(filters?: EncounterFilters) {
  const { user } = useAuth();
  const [encounters, setEncounters] = useState<EncounterWithGod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEncounters = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await encountersService.getEncounters(filters);
      setEncounters(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar encontros';
      setError(errorMessage);
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, filters]); // Adicionar filters como dependência

  useEffect(() => {
    if (user) {
      fetchEncounters();
    }
  }, [user, fetchEncounters]);

  const createEncounter = async (data: CreateEncounterWithGodData): Promise<EncounterWithGod> => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const newEncounter = await encountersService.createEncounter(data, user.id);
      setEncounters(prev => [newEncounter, ...prev]);
      toast({
        title: 'Sucesso',
        description: 'Encontro registrado com sucesso!',
      });
      return newEncounter;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar encontro';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    }
  };

  const updateEncounter = async (data: UpdateEncounterWithGodData): Promise<EncounterWithGod> => {
    try {
      const updatedEncounter = await encountersService.updateEncounter(data.id, data);
      setEncounters(prev => 
        prev.map(encounter => 
          encounter.id === data.id ? updatedEncounter : encounter
        )
      );
      toast({
        title: 'Sucesso',
        description: 'Encontro atualizado com sucesso!',
      });
      return updatedEncounter;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar encontro';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    }
  };

  const deleteEncounter = async (id: string): Promise<void> => {
    try {
      await encountersService.deleteEncounter(id);
      setEncounters(prev => prev.filter(encounter => encounter.id !== id));
      toast({
        title: 'Sucesso',
        description: 'Encontro excluído com sucesso!',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir encontro';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    }
  };

  return {
    encounters,
    loading,
    error,
    refetch: fetchEncounters,
    createEncounter,
    updateEncounter,
    deleteEncounter,
  };
}

export function useEncounterStats(startDate?: Date, endDate?: Date, eventId?: string) {
  const [stats, setStats] = useState<EncounterStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await encountersService.getEncounterStats(startDate, endDate, eventId);
      
      // Buscar total de ofertas com tratamento de erro robusto
      let totalOfferings = 0;
      try {
        const { data: offeringsData, error: offeringsError } = await getTotalOfferings(eventId);
        if (offeringsError) {
          console.warn('Erro ao buscar ofertas:', offeringsError);
        } else {
          totalOfferings = offeringsData || 0;
        }
      } catch (error) {
        console.warn('Erro ao buscar ofertas:', error);
        totalOfferings = 0;
      }
      
      // Manter ofertas separadas do totalAmount
      const updatedStats = {
        ...data,
        totalOfferings,
      };
      
      setStats(updatedStats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar estatísticas';
      setError(errorMessage);
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, eventId]);

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
