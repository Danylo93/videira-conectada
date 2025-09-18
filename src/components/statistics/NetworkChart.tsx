import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  TrendingUp, 
  Calendar, 
  Target,
  UserCheck,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import type { NetworkData, DiscipuladorData, LeaderData } from '@/integrations/supabase/statistics';

interface NetworkChartProps {
  data: NetworkData;
  loading?: boolean;
  title?: string;
  description?: string;
}

const COLORS = {
  members: '#7c3aed',
  frequentadores: '#f59e0b',
  total: '#10b981',
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--secondary))',
};

export function NetworkChart({ data, loading = false, title = "Rede de Discipulado", description }: NetworkChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {title}
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const discipuladorChartData = data.discipuladores.map(d => ({
    name: d.name.length > 15 ? d.name.substring(0, 15) + '...' : d.name,
    fullName: d.name,
    members: d.totalMembers,
    frequentadores: d.totalFrequentadores,
    total: d.totalMembers + d.totalFrequentadores,
    leaders: d.leaders.length,
    averagePresence: d.averagePresence,
  }));

  const leaderChartData = data.discipuladores.flatMap(d => 
    d.leaders.map(l => ({
      name: l.name.length > 15 ? l.name.substring(0, 15) + '...' : l.name,
      fullName: l.name,
      discipulador: d.name,
      celula: l.celula,
      members: l.members,
      frequentadores: l.frequentadores,
      total: l.members + l.frequentadores,
      averagePresence: l.averagePresence,
      hasRecentReport: l.lastReport ? 
        (new Date().getTime() - new Date(l.lastReport).getTime()) < (7 * 24 * 60 * 60 * 1000) : false,
    }))
  );

  const pieData = [
    { name: 'Membros', value: data.totalMembers, color: COLORS.members },
    { name: 'Frequentadores', value: data.totalFrequentadores, color: COLORS.frequentadores },
  ];

  const getPresenceStatus = (presence: number) => {
    if (presence >= 80) return { status: 'excellent', color: 'text-green-600', icon: CheckCircle };
    if (presence >= 60) return { status: 'good', color: 'text-blue-600', icon: UserCheck };
    if (presence >= 40) return { status: 'average', color: 'text-yellow-600', icon: AlertCircle };
    return { status: 'low', color: 'text-red-600', icon: AlertCircle };
  };

  return (
    <div className="space-y-6">
      {/* KPIs da Rede */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Membros</p>
                <p className="text-2xl font-bold text-primary">{data.totalMembers}</p>
              </div>
              <Users className="w-8 h-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Frequentadores</p>
                <p className="text-2xl font-bold text-orange-600">{data.totalFrequentadores}</p>
              </div>
              <Calendar className="w-8 h-8 text-orange-600/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Líderes</p>
                <p className="text-2xl font-bold text-green-600">{data.totalLeaders}</p>
              </div>
              <Target className="w-8 h-8 text-green-600/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Presença Média</p>
                <p className="text-2xl font-bold text-blue-600">{data.averagePresence}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos da Rede */}
      <Tabs defaultValue="discipuladores" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="discipuladores">Discipuladores</TabsTrigger>
          <TabsTrigger value="lideres">Líderes</TabsTrigger>
          <TabsTrigger value="distribution">Distribuição</TabsTrigger>
        </TabsList>

        <TabsContent value="discipuladores">
          <Card>
            <CardHeader>
              <CardTitle>Performance por Discipulador</CardTitle>
              <CardDescription>
                Número de membros e frequentadores por discipulador
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={discipuladorChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [value, name === 'members' ? 'Membros' : name === 'frequentadores' ? 'Frequentadores' : 'Total']}
                      labelFormatter={(label, payload) => {
                        const data = payload?.[0]?.payload;
                        return data?.fullName || label;
                      }}
                    />
                    <Legend />
                    <Bar dataKey="members" name="Membros" fill={COLORS.members} />
                    <Bar dataKey="frequentadores" name="Frequentadores" fill={COLORS.frequentadores} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lideres">
          <Card>
            <CardHeader>
              <CardTitle>Performance por Líder</CardTitle>
              <CardDescription>
                Detalhamento de cada líder e sua célula
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.discipuladores.map((discipulador) => (
                  <div key={discipulador.id} className="space-y-3">
                    <h4 className="font-semibold text-lg text-primary">{discipulador.name}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {discipulador.leaders.map((leader) => {
                        const presenceStatus = getPresenceStatus(leader.averagePresence);
                        const StatusIcon = presenceStatus.icon;
                        
                        return (
                          <Card key={leader.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <h5 className="font-medium">{leader.name}</h5>
                                  <StatusIcon className={`w-4 h-4 ${presenceStatus.color}`} />
                                </div>
                                
                                <div className="text-sm text-muted-foreground">
                                  Célula: {leader.celula}
                                </div>
                                
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span>Membros:</span>
                                    <span className="font-medium">{leader.members}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span>Frequentadores:</span>
                                    <span className="font-medium">{leader.frequentadores}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span>Total:</span>
                                    <span className="font-medium">{leader.members + leader.frequentadores}</span>
                                  </div>
                                </div>
                                
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span>Presença:</span>
                                    <span className={`font-medium ${presenceStatus.color}`}>
                                      {leader.averagePresence}%
                                    </span>
                                  </div>
                                  <Progress value={leader.averagePresence} className="h-2" />
                                </div>
                                
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">
                                    {leader.hasRecentReport ? 'Relatório recente' : 'Sem relatório recente'}
                                  </span>
                                  <Badge 
                                    variant={leader.hasRecentReport ? 'default' : 'secondary'}
                                    className="text-xs"
                                  >
                                    {leader.hasRecentReport ? 'Atualizado' : 'Pendente'}
                                  </Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição Geral</CardTitle>
                <CardDescription>
                  Proporção entre membros e frequentadores na rede
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Presença por Discipulador</CardTitle>
                <CardDescription>
                  Média de presença de cada discipulador
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.discipuladores.map((discipulador) => {
                    const presenceStatus = getPresenceStatus(discipulador.averagePresence);
                    const StatusIcon = presenceStatus.icon;
                    
                    return (
                      <div key={discipulador.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{discipulador.name}</span>
                          <div className="flex items-center gap-2">
                            <StatusIcon className={`w-4 h-4 ${presenceStatus.color}`} />
                            <span className={`text-sm font-medium ${presenceStatus.color}`}>
                              {discipulador.averagePresence}%
                            </span>
                          </div>
                        </div>
                        <Progress value={discipulador.averagePresence} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{discipulador.leaders.length} líderes</span>
                          <span>{discipulador.totalMembers + discipulador.totalFrequentadores} pessoas</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
