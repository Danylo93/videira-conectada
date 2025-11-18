import { useEffect, useState } from 'react';
import Tree from 'react-d3-tree';
import { useAuth } from '@/contexts/AuthContext';
import { useProfileMode } from '@/contexts/ProfileModeContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, UserCheck, Calendar, Target, RefreshCw, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import FancyLoader from '@/components/FancyLoader';
import { OrganogramaList } from '@/components/organograma/OrganogramaList';

interface Profile {
  id: string;
  name: string;
  role: 'pastor' | 'obreiro' | 'discipulador' | 'lider';
  discipulador_uuid: string | null;
  pastor_uuid: string | null;
  celula?: string;
}

interface Member {
  id: string;
  name: string;
  type: 'member' | 'frequentador';
  phone?: string;
  email?: string;
  active: boolean;
  join_date: string;
}

interface PersonNode {
  id?: string;
  name: string;
  role: string;
  celula?: string;
  members?: number;
  frequentadores?: number;
  total?: number;
  averagePresence?: number;
  lastReport?: string;
  children?: PersonNode[];
}

interface ChurchStats {
  totalMembers: number;
  totalFrequentadores: number;
  totalLeaders: number;
  totalDiscipuladores: number;
  averagePresence: number;
  growthRate: number;
}

function buildTree(profiles: Profile[], membersData: Record<string, Member[]>, reportsData: Record<string, any>): (PersonNode & { id?: string })[] {
  const nodes: Record<string, PersonNode & { id: string }> = {};
  const roots: (PersonNode & { id: string })[] = [];

  // Criar nós para todos os perfis
  profiles.forEach((p) => {
    const members = membersData[p.id] || [];
    const membersCount = members.filter(m => m.type === 'member' && m.active).length;
    const frequentadoresCount = members.filter(m => m.type === 'frequentador' && m.active).length;
    const total = membersCount + frequentadoresCount;
    
    // Calcular presença média baseada nos relatórios
    const reports = reportsData[p.id] || [];
    const averagePresence = reports.length > 0 
      ? reports.reduce((sum: number, r: any) => {
          const membersPresent = Array.isArray(r.members_present) ? r.members_present.length : 0;
          const visitorsPresent = Array.isArray(r.visitors_present) ? r.visitors_present.length : 0;
          const totalPresent = membersPresent + visitorsPresent;
          return sum + (total > 0 ? (totalPresent / total) * 100 : 0);
        }, 0) / reports.length
      : 0;

    const lastReport = reports.length > 0 
      ? reports.sort((a: any, b: any) => new Date(b.week_start).getTime() - new Date(a.week_start).getTime())[0]?.week_start
      : undefined;

    nodes[p.id] = { 
      id: p.id, 
      name: p.name,
      role: p.role,
      celula: p.celula,
      members: membersCount,
      frequentadores: frequentadoresCount,
      total,
      averagePresence: Math.round(averagePresence * 100) / 100,
      lastReport,
      children: [] 
    };
  });

  // Construir hierarquia
  profiles.forEach((p) => {
    const parentId = p.discipulador_uuid || p.pastor_uuid;
    const node = nodes[p.id];
    if (parentId && nodes[parentId]) {
      nodes[parentId].children!.push(node);
    } else {
      roots.push(node);
    }
  });

  // Limpar nós vazios
  const clean = (node: PersonNode & { id: string }) => {
    if (node.children && node.children.length === 0) {
      delete node.children;
    } else {
      node.children?.forEach(clean);
    }
  };
  roots.forEach(clean);
  // Retornar preservando o id
  return roots;
}

export function ChurchManagementNew() {
  const { user } = useAuth();
  const { mode } = useProfileMode();
  const isKidsMode = mode === 'kids';
  const [treeData, setTreeData] = useState<(PersonNode & { id?: string })[]>([]);
  const [churchStats, setChurchStats] = useState<ChurchStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree');

  useEffect(() => {
    loadChurchData();
  }, [isKidsMode]);

  const loadChurchData = async () => {
    try {
      setLoading(true);

      // Carregar perfis
      let profilesQuery = supabase
        .from('profiles')
        .select('id, name, role, discipulador_uuid, pastor_uuid, celula, is_kids')
        .in('role', ['pastor', 'obreiro', 'discipulador', 'lider']);
      
      // No modo Kids, mostrar apenas perfis do modo Kids
      // No modo normal, mostrar apenas perfis do modo normal
      if (isKidsMode) {
        profilesQuery = profilesQuery.eq('is_kids', true);
      } else {
        profilesQuery = profilesQuery.or('is_kids.is.null,is_kids.eq.false');
      }
      
      const { data: profiles, error: profilesError } = await profilesQuery;

      if (profilesError) {
        console.error('Error loading profiles:', profilesError);
        return;
      }

      // Carregar membros de todos os líderes (filtrar por líderes do modo correto)
      const leaderIds = (profiles || []).filter(p => p.role === 'lider').map(p => p.id);
      let membersQuery = supabase
        .from('members')
        .select('id, name, type, phone, email, active, join_date, lider_id');
      
      if (leaderIds.length > 0) {
        membersQuery = membersQuery.in('lider_id', leaderIds);
      } else {
        membersQuery = membersQuery.eq('lider_id', ''); // Retorna vazio se não houver líderes
      }
      
      const { data: members, error: membersError } = await membersQuery;

      if (membersError) {
        console.error('Error loading members:', membersError);
        return;
      }

      // Agrupar membros por líder
      const membersData: Record<string, Member[]> = {};
      (members || []).forEach(member => {
        if (!membersData[member.lider_id]) {
          membersData[member.lider_id] = [];
        }
        membersData[member.lider_id].push(member);
      });

      // Carregar relatórios de todos os líderes (filtrar por líderes do modo correto)
      let reportsQuery = supabase
        .from('cell_reports')
        .select('lider_id, members_present, visitors_present, week_start')
        .order('week_start', { ascending: false });
      
      if (leaderIds.length > 0) {
        reportsQuery = reportsQuery.in('lider_id', leaderIds);
      } else {
        reportsQuery = reportsQuery.eq('lider_id', ''); // Retorna vazio se não houver líderes
      }
      
      const { data: reports, error: reportsError } = await reportsQuery;

      if (reportsError) {
        console.error('Error loading reports:', reportsError);
        return;
      }

      // Agrupar relatórios por líder
      const reportsData: Record<string, any[]> = {};
      (reports || []).forEach(report => {
        if (!reportsData[report.lider_id]) {
          reportsData[report.lider_id] = [];
        }
        reportsData[report.lider_id].push(report);
      });

      // Construir árvore
      let tree = buildTree((profiles as Profile[]) || [], membersData, reportsData);
      
      // No modo Kids, adaptar o nome do pastor para "Tainá"
      if (isKidsMode && user?.role === 'pastor') {
        const adaptNodeForKids = (node: PersonNode & { id?: string }): PersonNode & { id?: string } => {
          // Verificar se é o nó do pastor atual (comparar por role e id)
          // No modo Kids, o pastor raiz deve ser "Tainá"
          const isCurrentPastor = node.role === 'pastor' && (node.id === user.id || !node.id);
          
          const adaptedNode: PersonNode & { id?: string } = {
            ...node,
            name: isCurrentPastor ? 'Tainá' : node.name,
          };
          
          // Adaptar filhos recursivamente
          if (node.children && node.children.length > 0) {
            adaptedNode.children = node.children.map(adaptNodeForKids);
          }
          
          return adaptedNode;
        };
        tree = tree.map(adaptNodeForKids);
      }
      
      setTreeData(tree);

      // Calcular estatísticas gerais
      const totalMembers = (members || []).filter(m => m.type === 'member' && m.active).length;
      const totalFrequentadores = (members || []).filter(m => m.type === 'frequentador' && m.active).length;
      const totalLeaders = (profiles || []).filter(p => p.role === 'lider').length;
      const totalDiscipuladores = (profiles || []).filter(p => p.role === 'discipulador').length;

      // Calcular presença média geral
      const allReports = Object.values(reportsData).flat();
      const averagePresence = allReports.length > 0 
        ? allReports.reduce((sum, r) => {
            const membersPresent = Array.isArray(r.members_present) ? r.members_present.length : 0;
            const visitorsPresent = Array.isArray(r.visitors_present) ? r.visitors_present.length : 0;
            const totalPresent = membersPresent + visitorsPresent;
            return sum + totalPresent;
          }, 0) / allReports.length
        : 0;

      setChurchStats({
        totalMembers,
        totalFrequentadores,
        totalLeaders,
        totalDiscipuladores,
        averagePresence: Math.round(averagePresence * 100) / 100,
        growthRate: 0, // Seria calculado comparando com período anterior
      });

    } catch (error) {
      console.error('Error loading church data:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados da igreja.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadChurchData();
    toast({
      title: 'Atualizado',
      description: isKidsMode ? 'Dados do ministério kids atualizados com sucesso!' : 'Dados da igreja atualizados com sucesso!',
    });
  };

  const handleExport = () => {
    toast({
      title: 'Exportação',
      description: 'Funcionalidade de exportação será implementada em breve.',
    });
  };

  const getRoleColor = (role: string) => {
    if (isKidsMode) {
      switch (role) {
        case 'pastor': return 'bg-pink-100 text-pink-800';
        case 'obreiro': return 'bg-purple-100 text-purple-800';
        case 'discipulador': return 'bg-pink-200 text-pink-900';
        case 'lider': return 'bg-purple-200 text-purple-900';
        default: return 'bg-gray-100 text-gray-800';
      }
    }
    switch (role) {
      case 'pastor': return 'bg-purple-100 text-purple-800';
      case 'obreiro': return 'bg-blue-100 text-blue-800';
      case 'discipulador': return 'bg-green-100 text-green-800';
      case 'lider': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    if (isKidsMode) {
      switch (role) {
        case 'pastor': return 'Pastora';
        case 'obreiro': return 'Obreiro';
        case 'discipulador': return 'Discipuladora';
        case 'lider': return 'Líder Kids';
        default: return role;
      }
    }
    switch (role) {
      case 'pastor': return 'Pastor';
      case 'obreiro': return 'Obreiro';
      case 'discipulador': return 'Discipulador';
      case 'lider': return 'Líder';
      default: return role;
    }
  };

  const getPresenceStatus = (presence: number) => {
    if (presence >= 80) return { status: 'excellent', color: 'text-green-600' };
    if (presence >= 60) return { status: 'good', color: 'text-blue-600' };
    if (presence >= 40) return { status: 'average', color: 'text-yellow-600' };
    return { status: 'low', color: 'text-red-600' };
  };

  if (loading) {
    return (
      <FancyLoader
        message="Organizando a estrutura da videira"
        tips={[
          "Mapeando cada galho da árvore genealógica espiritual…",
          "Contando as folhas (membros) de cada ramo…",
          "Verificando se todos os frutos estão maduros…",
        ]}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className={`text-3xl font-bold ${isKidsMode ? 'text-pink-700' : ''}`}>
            {isKidsMode ? 'Gerenciar Ministério Kids' : 'Gerenciar Igreja'}
          </h1>
          <p className={isKidsMode ? 'text-pink-600/70' : 'text-muted-foreground'}>
            {isKidsMode 
              ? 'Organograma completo com crianças e visitantes de cada líder kids'
              : 'Organograma completo com membros e frequentadores de cada líder'
            }
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Estatísticas Gerais */}
      {churchStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className={isKidsMode ? 'border-pink-200 shadow-lg shadow-pink-100' : ''}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${isKidsMode ? 'text-pink-600/70' : 'text-muted-foreground'}`}>
                    {isKidsMode ? 'Total de Crianças' : 'Total de Membros'}
                  </p>
                  <p className={`text-2xl font-bold ${isKidsMode ? 'text-pink-600' : 'text-primary'}`}>
                    {churchStats.totalMembers}
                  </p>
                </div>
                <Users className={`w-8 h-8 ${isKidsMode ? 'text-pink-500/20' : 'text-primary/20'}`} />
              </div>
            </CardContent>
          </Card>

          <Card className={isKidsMode ? 'border-pink-200 shadow-lg shadow-pink-100' : ''}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${isKidsMode ? 'text-pink-600/70' : 'text-muted-foreground'}`}>
                    {isKidsMode ? 'Visitantes' : 'Frequentadores'}
                  </p>
                  <p className={`text-2xl font-bold ${isKidsMode ? 'text-purple-600' : 'text-orange-600'}`}>
                    {churchStats.totalFrequentadores}
                  </p>
                </div>
                <Calendar className={`w-8 h-8 ${isKidsMode ? 'text-purple-600/20' : 'text-orange-600/20'}`} />
              </div>
            </CardContent>
          </Card>

          <Card className={isKidsMode ? 'border-pink-200 shadow-lg shadow-pink-100' : ''}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${isKidsMode ? 'text-pink-600/70' : 'text-muted-foreground'}`}>
                    {isKidsMode ? 'Líderes Kids' : 'Líderes'}
                  </p>
                  <p className={`text-2xl font-bold ${isKidsMode ? 'text-purple-600' : 'text-green-600'}`}>
                    {churchStats.totalLeaders}
                  </p>
                </div>
                <Target className={`w-8 h-8 ${isKidsMode ? 'text-purple-600/20' : 'text-green-600/20'}`} />
              </div>
            </CardContent>
          </Card>

          <Card className={isKidsMode ? 'border-pink-200 shadow-lg shadow-pink-100' : ''}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${isKidsMode ? 'text-pink-600/70' : 'text-muted-foreground'}`}>
                    Presença Média
                  </p>
                  <p className={`text-2xl font-bold ${isKidsMode ? 'text-pink-600' : 'text-blue-600'}`}>
                    {churchStats.averagePresence}%
                  </p>
                </div>
                <UserCheck className={`w-8 h-8 ${isKidsMode ? 'text-pink-600/20' : 'text-blue-600/20'}`} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Organograma */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'tree' | 'list')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tree">Organograma</TabsTrigger>
          <TabsTrigger value="list">Lista Detalhada</TabsTrigger>
        </TabsList>

        <TabsContent value="tree">
          <Card className={isKidsMode ? 'border-pink-200 shadow-lg shadow-pink-100' : ''}>
            <CardHeader>
              <CardTitle className={isKidsMode ? 'text-pink-700' : ''}>
                {isKidsMode ? 'Estrutura do Ministério Kids' : 'Estrutura Organizacional'}
              </CardTitle>
              <CardDescription className={isKidsMode ? 'text-pink-600/70' : ''}>
                {isKidsMode 
                  ? 'Hierarquia completa com dados de crianças e visitantes'
                  : 'Hierarquia completa com dados de membros e frequentadores'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`w-full h-[600px] ${isKidsMode ? 'border-pink-200' : 'border'} rounded-md`}>
                {treeData.length > 0 ? (
                  <Tree 
                    data={treeData} 
                    orientation="horizontal" 
                    translate={{ x: 50, y: 300 }}
                    nodeSize={{ x: 200, y: 100 }}
                    renderCustomNodeElement={(rd3tProps) => {
                      const { nodeDatum } = rd3tProps;
                      const presenceStatus = getPresenceStatus(nodeDatum.averagePresence || 0);
                      
                      return (
                        <g>
                          <rect
                            width="180"
                            height="80"
                            x="-90"
                            y="-40"
                            fill="white"
                            stroke={
                              isKidsMode
                                ? (nodeDatum.role === 'pastor' ? '#ec4899' : nodeDatum.role === 'discipulador' ? '#f472b6' : '#a855f7')
                                : (nodeDatum.role === 'pastor' ? '#7c3aed' : nodeDatum.role === 'discipulador' ? '#10b981' : '#f59e0b')
                            }
                            strokeWidth="2"
                            rx="8"
                          />
                          <text
                            x="0"
                            y="-20"
                            textAnchor="middle"
                            fontSize="12"
                            fontWeight="bold"
                            fill={isKidsMode ? '#a855f7' : '#1f2937'}
                          >
                            {nodeDatum.name}
                          </text>
                          <text
                            x="0"
                            y="-5"
                            textAnchor="middle"
                            fontSize="10"
                            fill={isKidsMode ? '#ec4899' : '#6b7280'}
                          >
                            {getRoleLabel(nodeDatum.role)}
                          </text>
                          {nodeDatum.celula && (
                            <text
                              x="0"
                              y="8"
                              textAnchor="middle"
                              fontSize="9"
                              fill="#9ca3af"
                            >
                              {nodeDatum.celula}
                            </text>
                          )}
                          <text
                            x="0"
                            y="20"
                            textAnchor="middle"
                            fontSize="9"
                            fill="#374151"
                          >
                            M: {nodeDatum.members || 0} | F: {nodeDatum.frequentadores || 0}
                          </text>
                          <text
                            x="0"
                            y="32"
                            textAnchor="middle"
                            fontSize="9"
                            className={presenceStatus.color}
                          >
                            Presença: {nodeDatum.averagePresence || 0}%
                          </text>
                        </g>
                      );
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className={isKidsMode ? 'text-pink-600' : 'text-muted-foreground'}>
                      {isKidsMode ? 'Carregando organograma do ministério kids...' : 'Carregando organograma...'}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list">
          <Card className={isKidsMode ? 'border-pink-200 shadow-lg shadow-pink-100' : ''}>
            <CardHeader>
              <CardTitle className={isKidsMode ? 'text-pink-700' : ''}>Lista Detalhada</CardTitle>
              <CardDescription className={isKidsMode ? 'text-pink-600/70' : ''}>
                {isKidsMode 
                  ? 'Informações detalhadas de cada líder kids e suas crianças'
                  : 'Informações detalhadas de cada líder e seus membros'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OrganogramaList 
                data={treeData} 
                onNodeClick={(node) => {
                  console.log('Node clicked:', node);
                  // Aqui você pode implementar ações quando um nó for clicado
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ChurchManagementNew;
