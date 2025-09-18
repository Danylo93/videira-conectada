import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { statisticsService, type StatisticsData } from '@/integrations/supabase/statistics';
import { toast } from '@/hooks/use-toast';

export function useStatistics() {
  const { user } = useAuth();
  const [data, setData] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStatistics = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const statistics = await statisticsService.getGeneralStatistics(user);
      setData(statistics);
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
  };

  useEffect(() => {
    loadStatistics();
  }, [user]);

  return {
    data,
    loading,
    error,
    refetch: loadStatistics,
  };
}

export function useNetworkStatistics() {
  const { user } = useAuth();
  const [networkData, setNetworkData] = useState<StatisticsData['networkData'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNetworkData = async () => {
    if (!user || !['pastor', 'discipulador'].includes(user.role)) return;

    try {
      setLoading(true);
      setError(null);
      const statistics = await statisticsService.getGeneralStatistics(user);
      setNetworkData(statistics.networkData || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar dados da rede';
      setError(errorMessage);
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNetworkData();
  }, [user]);

  return {
    networkData,
    loading,
    error,
    refetch: loadNetworkData,
  };
}
