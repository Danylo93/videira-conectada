import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, TrendingUp, TrendingDown, Users, Calendar } from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
} from 'recharts';
import type { StatisticsData } from '@/integrations/supabase/statistics';

interface StatisticsChartProps {
  data: StatisticsData;
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

export function StatisticsChart({ data, loading = false, title = "Estatísticas", description }: StatisticsChartProps) {
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

  const monthlyChartData = data.monthlyData.map(month => ({
    ...month,
    name: `${month.month} ${month.year}`,
  }));

  const weeklyChartData = data.weeklyData.slice(-12).map(week => ({
    ...week,
    name: new Date(week.weekStart).toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'short' 
    }),
  }));

  const pieData = [
    { name: 'Membros', value: data.totalMembers, color: COLORS.members },
    { name: 'Frequentadores', value: data.totalFrequentadores, color: COLORS.frequentadores },
  ];

  const growthIcon = data.growthRate >= 0 ? TrendingUp : TrendingDown;
  const growthColor = data.growthRate >= 0 ? 'text-green-600' : 'text-red-600';

  return (
    <div className="space-y-6">
      {/* KPIs Principais */}
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
                <p className="text-sm font-medium text-muted-foreground">Presença Média</p>
                <p className="text-2xl font-bold text-green-600">{data.averagePresence}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Crescimento</p>
                <div className="flex items-center gap-2">
                  <p className={`text-2xl font-bold ${growthColor}`}>
                    {data.growthRate >= 0 ? '+' : ''}{data.growthRate.toFixed(1)}%
                  </p>
                  <growthIcon className={`w-5 h-5 ${growthColor}`} />
                </div>
              </div>
              <TrendingUp className="w-8 h-8 text-muted-foreground/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <Tabs defaultValue="monthly" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="monthly">Mensal</TabsTrigger>
          <TabsTrigger value="weekly">Semanal</TabsTrigger>
          <TabsTrigger value="distribution">Distribuição</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle>Presença Mensal</CardTitle>
              <CardDescription>
                Média de presença por mês (membros e frequentadores)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={monthlyChartData}>
                    <defs>
                      <linearGradient id="gradMembers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={COLORS.members} stopOpacity={0.8} />
                        <stop offset="100%" stopColor={COLORS.members} stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="gradFrequentadores" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={COLORS.frequentadores} stopOpacity={0.8} />
                        <stop offset="100%" stopColor={COLORS.frequentadores} stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="averageMembers"
                      name="Membros (média)"
                      fill="url(#gradMembers)"
                      stroke={COLORS.members}
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="averageFrequentadores"
                      name="Frequentadores (média)"
                      fill="url(#gradFrequentadores)"
                      stroke={COLORS.frequentadores}
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="averageTotal"
                      name="Total (média)"
                      stroke={COLORS.total}
                      strokeWidth={3}
                      dot={{ fill: COLORS.total, strokeWidth: 2, r: 4 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weekly">
          <Card>
            <CardHeader>
              <CardTitle>Presença Semanal</CardTitle>
              <CardDescription>
                Presença por semana (últimas 12 semanas)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="members" name="Membros" fill={COLORS.members} />
                    <Bar dataKey="frequentadores" name="Frequentadores" fill={COLORS.frequentadores} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Pessoas</CardTitle>
                <CardDescription>
                  Proporção entre membros e frequentadores
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
                <CardTitle>Resumo por Tipo</CardTitle>
                <CardDescription>
                  Detalhamento dos dados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-purple-600"></div>
                    <span className="font-medium">Membros</span>
                  </div>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {data.totalMembers}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-orange-600"></div>
                    <span className="font-medium">Frequentadores</span>
                  </div>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {data.totalFrequentadores}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-green-600"></div>
                    <span className="font-medium">Total</span>
                  </div>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {data.totalMembers + data.totalFrequentadores}
                  </Badge>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Presença Média</span>
                    <span className="font-semibold">{data.averagePresence} pessoas</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Crescimento</span>
                    <span className={`font-semibold ${growthColor}`}>
                      {data.growthRate >= 0 ? '+' : ''}{data.growthRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
