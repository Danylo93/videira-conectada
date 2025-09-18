import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, RefreshCw, TrendingUp, Users, Target, Calendar } from 'lucide-react';
import FancyLoader from '@/components/FancyLoader';
import { StatisticsChart } from '@/components/statistics/StatisticsChart';
import { NetworkChart } from '@/components/statistics/NetworkChart';
import { useStatistics, useNetworkStatistics } from '@/hooks/useStatistics';
import { toast } from '@/hooks/use-toast';

interface SimpleUser {
  id: string;
  name: string;
}

export function StatisticsNew() {
  const { user } = useAuth();
  const [filterType, setFilterType] = useState<'geral' | 'discipulador' | 'lider'>('geral');
  const [selectedDiscipulador, setSelectedDiscipulador] = useState('');
  const [selectedLeader, setSelectedLeader] = useState('');
  const [discipuladores, setDiscipuladores] = useState<SimpleUser[]>([]);
  const [leaders, setLeaders] = useState<SimpleUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Usar os novos hooks de estatísticas
  const { data: generalStats, loading: generalLoading, refetch: refetchGeneral } = useStatistics();
  const { data: networkStats, loading: networkLoading, refetch: refetchNetwork } = useNetworkStatistics();

  const handleExport = () => {
    toast({
      title: 'Exportação',
      description: 'Funcionalidade de exportação será implementada em breve.',
    });
  };

  const handleRefresh = () => {
    refetchGeneral();
    refetchNetwork();
    toast({
      title: 'Atualizado',
      description: 'Dados atualizados com sucesso!',
    });
  };

  if (!user || !['pastor', 'obreiro', 'discipulador'].includes(user.role)) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Acesso restrito para pastores, obreiros e discipuladores.</p>
      </div>
    );
  }

  if (generalLoading || networkLoading) {
    return (
      <FancyLoader
        message="Analisando os frutos da videira"
        tips={[
          "Contando cada cacho de uva com precisão divina…",
          "Organizando os dados como as tábuas da lei…",
          "Preparando gráficos que fariam Moisés chorar de emoção…",
        ]}
      />
    );
  }

  const isPastor = user.role === 'pastor';
  const isDiscipulador = user.role === 'discipulador';

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Estatísticas e Relatórios</h1>
          <p className="text-muted-foreground">
            Análise detalhada do crescimento da rede de discipulado
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={generalLoading || networkLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${(generalLoading || networkLoading) ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Filtros de Visualização
          </CardTitle>
          <CardDescription>
            Selecione o escopo dos dados que deseja visualizar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Tipo de Visualização</label>
              <Select value={filterType} onValueChange={(value: 'geral' | 'discipulador' | 'lider') => setFilterType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="geral">Visão Geral</SelectItem>
                  {isPastor && <SelectItem value="discipulador">Por Discipulador</SelectItem>}
                  <SelectItem value="lider">Por Líder</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filterType === 'discipulador' && isPastor && (
              <div>
                <label className="text-sm font-medium mb-2 block">Discipulador</label>
                <Select value={selectedDiscipulador} onValueChange={setSelectedDiscipulador}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o discipulador" />
                  </SelectTrigger>
                  <SelectContent>
                    {discipuladores.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {filterType === 'lider' && (
              <div>
                <label className="text-sm font-medium mb-2 block">Líder</label>
                <Select value={selectedLeader} onValueChange={setSelectedLeader}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o líder" />
                  </SelectTrigger>
                  <SelectContent>
                    {leaders.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas Principais */}
      {generalStats && (
        <StatisticsChart 
          data={generalStats}
          title="Estatísticas Gerais"
          description="Visão geral do crescimento e presença na rede"
        />
      )}

      {/* Dados da Rede */}
      {networkStats && (isPastor || isDiscipulador) && (
        <NetworkChart 
          data={networkStats}
          title="Rede de Discipulado"
          description="Análise detalhada da estrutura de discipulado"
        />
      )}

      {/* Resumo Executivo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Resumo Executivo
          </CardTitle>
          <CardDescription>
            Principais indicadores e insights da rede
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-primary/5 rounded-lg">
              <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold text-lg">{generalStats?.totalMembers || 0}</h3>
              <p className="text-sm text-muted-foreground">Membros Ativos</p>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-orange-600" />
              <h3 className="font-semibold text-lg">{generalStats?.totalFrequentadores || 0}</h3>
              <p className="text-sm text-muted-foreground">Frequentadores</p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Target className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <h3 className="font-semibold text-lg">{generalStats?.totalLeaders || 0}</h3>
              <p className="text-sm text-muted-foreground">Líderes</p>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <h3 className="font-semibold text-lg">
                {generalStats?.growthRate >= 0 ? '+' : ''}{generalStats?.growthRate.toFixed(1) || 0}%
              </h3>
              <p className="text-sm text-muted-foreground">Crescimento</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights e Recomendações */}
      <Card>
        <CardHeader>
          <CardTitle>Insights e Recomendações</CardTitle>
          <CardDescription>
            Análise automática dos dados e sugestões de melhoria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {generalStats?.growthRate > 0 && (
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <h4 className="font-semibold text-green-800">Crescimento Positivo</h4>
                  <p className="text-sm text-green-700">
                    A rede está crescendo {generalStats.growthRate.toFixed(1)}% em relação ao período anterior. 
                    Continue mantendo o foco na multiplicação e no discipulado.
                  </p>
                </div>
              </div>
            )}

            {generalStats?.averagePresence < 50 && (
              <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                <div>
                  <h4 className="font-semibold text-yellow-800">Presença Baixa</h4>
                  <p className="text-sm text-yellow-700">
                    A presença média está em {generalStats.averagePresence}%. 
                    Considere implementar estratégias para aumentar o engajamento nas células.
                  </p>
                </div>
              </div>
            )}

            {networkStats && networkStats.averagePresence > 80 && (
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <h4 className="font-semibold text-blue-800">Excelente Engajamento</h4>
                  <p className="text-sm text-blue-700">
                    A rede está com {networkStats.averagePresence}% de presença média. 
                    Este é um indicador muito positivo do comprometimento dos membros.
                  </p>
                </div>
              </div>
            )}

            {generalStats && generalStats.totalFrequentadores > generalStats.totalMembers && (
              <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <div>
                  <h4 className="font-semibold text-purple-800">Oportunidade de Consolidação</h4>
                  <p className="text-sm text-purple-700">
                    Há mais frequentadores ({generalStats.totalFrequentadores}) que membros ({generalStats.totalMembers}). 
                    Foque em estratégias de consolidação para transformar frequentadores em membros.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
