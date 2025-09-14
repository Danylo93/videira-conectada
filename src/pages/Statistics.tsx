import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { CellReport as CellReportType } from '@/types/church';

interface SimpleUser {
  id: string;
  name: string;
}

function linearRegressionForecast(values: number[]): number | null {
  if (values.length < 2) return null;
  const n = values.length;
  const sumX = values.reduce((acc, _, i) => acc + (i + 1), 0);
  const sumY = values.reduce((acc, y) => acc + y, 0);
  const sumXY = values.reduce((acc, y, i) => acc + (i + 1) * y, 0);
  const sumXX = values.reduce((acc, _, i) => acc + (i + 1) * (i + 1), 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = sumY / n - slope * (sumX / n);
  const nextX = n + 1;
  return Math.round(intercept + slope * nextX);
}

export function Statistics() {
  const { user } = useAuth();
  const [discipuladores, setDiscipuladores] = useState<SimpleUser[]>([]);
  const [leaders, setLeaders] = useState<SimpleUser[]>([]);
  const [filterType, setFilterType] = useState<'geral' | 'discipulador' | 'lider'>('geral');
  const [selectedDiscipulador, setSelectedDiscipulador] = useState('');
  const [selectedLeader, setSelectedLeader] = useState('');
  const [chartMode, setChartMode] = useState<'mensal' | 'semanal'>('mensal');
  const [reports, setReports] = useState<CellReportType[]>([]);
  const [membersCount, setMembersCount] = useState(0);
  const [visitorsCount, setVisitorsCount] = useState(0);
  const [prediction, setPrediction] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && ['pastor', 'obreiro', 'discipulador'].includes(user.role)) {
      loadUsers();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadUsers = async () => {
    if (!user) return;

    if (user.role === 'pastor' || user.role === 'obreiro') {
      const { data: discipulos } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('role', 'discipulador')
        .eq('pastor_uuid', user.id)
        .order('name');
      setDiscipuladores((discipulos || []).map((d) => ({ id: d.id, name: d.name })));
      const { data: lData } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('role', 'lider')
        .eq('pastor_uuid', user.id)
        .order('name');
      setLeaders((lData || []).map((l) => ({ id: l.id, name: l.name })));
    } else if (user.role === 'discipulador') {
      const { data: lData } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('role', 'lider')
        .eq('discipulador_uuid', user.id)
        .order('name');
      setLeaders((lData || []).map((l) => ({ id: l.id, name: l.name })));
    }

    await loadReports();
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      loadReports();
    }
  }, [filterType, selectedDiscipulador, selectedLeader]);

  const loadReports = async () => {
    if (!user) return;
    let leaderIds: string[] = [];

    if (filterType === 'geral') {
      leaderIds = leaders.map((l) => l.id);
    } else if (filterType === 'discipulador' && selectedDiscipulador) {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'lider')
        .eq('discipulador_uuid', selectedDiscipulador);
      leaderIds = (data || []).map((l) => l.id);
    } else if (filterType === 'lider' && selectedLeader) {
      leaderIds = [selectedLeader];
    }

    if (leaderIds.length === 0) {
      setReports([]);
      setMembersCount(0);
      setVisitorsCount(0);
      setPrediction(null);
      return;
    }

    const { data, error } = await supabase
      .from('cell_reports')
      .select('*')
      .in('lider_id', leaderIds)
      .order('week_start', { ascending: true });
    if (error) {
      console.error('Error loading reports:', error);
      return;
    }
    const formatted: CellReportType[] = (data || []).map((r) => ({
      id: r.id,
      liderId: r.lider_id,
      weekStart: new Date(r.week_start),
      members: (r.members_present || []).map((id: string) => ({
        id,
        name: id,
        type: 'member',
        liderId: r.lider_id,
        joinDate: new Date(),
        active: true,
      })),
      frequentadores: (r.visitors_present || []).map((id: string) => ({
        id,
        name: id,
        type: 'frequentador',
        liderId: r.lider_id,
        joinDate: new Date(),
        active: true,
      })),
      phase: r.phase as 'Comunhão' | 'Edificação' | 'Evangelismo' | 'Multiplicação' | undefined,
      multiplicationDate: r.multiplication_date ? new Date(r.multiplication_date) : undefined,
      observations: r.observations || undefined,
      submittedAt: new Date(r.submitted_at),
      status: r.status as 'draft' | 'submitted' | 'approved' | 'needs_correction',
    }));
    setReports(formatted);
    const membersTotal = formatted.reduce((sum, r) => sum + r.members.length, 0);
    const visitorsTotal = formatted.reduce(
      (sum, r) => sum + r.frequentadores.length,
      0
    );
    setMembersCount(membersTotal);
    setVisitorsCount(visitorsTotal);
  };

  const chartData = useMemo(() => {
    if (chartMode === 'mensal') {
      const groups: Record<string, { members: number; frequentadores: number }> = {};
      reports.forEach((r) => {
        const key = `${r.weekStart.getFullYear()}-${r.weekStart.getMonth() + 1}`;
        if (!groups[key]) {
          groups[key] = { members: 0, frequentadores: 0 };
        }
        groups[key].members += r.members.length;
        groups[key].frequentadores += r.frequentadores.length;
      });
      return Object.entries(groups).map(([key, value]) => {
        const [year, month] = key.split('-');
        return { name: `${month}/${year}`, ...value };
      });
    }
    return reports.map((r) => ({
      name: r.weekStart.toLocaleDateString('pt-BR'),
      members: r.members.length,
      frequentadores: r.frequentadores.length,
    }));
  }, [reports, chartMode]);

  useEffect(() => {
    if (chartMode !== 'mensal') {
      setPrediction(null);
      return;
    }
    const totals = chartData.map((d) => d.members + d.frequentadores);
    const pred = linearRegressionForecast(totals);
    setPrediction(pred);
  }, [chartData, chartMode]);

  if (!user || !['pastor', 'obreiro', 'discipulador'].includes(user.role)) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Acesso restrito.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const totalPeople = membersCount + visitorsCount;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold text-foreground">Estatísticas</h1>
        <div className="flex flex-col md:flex-row gap-4">
          <Select
            value={filterType}
            onValueChange={(v: 'geral' | 'discipulador' | 'lider') => setFilterType(v)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="geral">Geral</SelectItem>
              {['pastor', 'obreiro'].includes(user.role) && (
                <SelectItem value="discipulador">Discipulador</SelectItem>
              )}
              <SelectItem value="lider">Líder</SelectItem>
            </SelectContent>
          </Select>
          {filterType === 'discipulador' && (
            <Select value={selectedDiscipulador} onValueChange={setSelectedDiscipulador}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {discipuladores.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {filterType === 'lider' && (
            <Select value={selectedLeader} onValueChange={setSelectedLeader}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {leaders.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select
            value={chartMode}
            onValueChange={(v: 'mensal' | 'semanal') => setChartMode(v)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mensal">Mensal</SelectItem>
              <SelectItem value="semanal">Semanal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="hover:grape-glow transition-smooth">
        <CardHeader>
          <CardTitle>Resumo</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="members" name="Membros" stroke="#8884d8" />
              <Line
                type="monotone"
                dataKey="frequentadores"
                name="Frequentadores"
                stroke="#82ca9d"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:grape-glow transition-smooth">
          <CardHeader>
            <CardTitle>Membros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{membersCount}</div>
          </CardContent>
        </Card>

        <Card className="hover:grape-glow transition-smooth">
          <CardHeader>
            <CardTitle>Frequentadores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{visitorsCount}</div>
          </CardContent>
        </Card>

        <Card className="hover:grape-glow transition-smooth">
          <CardHeader>
            <CardTitle>Total na Igreja</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalPeople}</div>
          </CardContent>
        </Card>
      </div>

      {prediction !== null && (
        <Card className="hover:grape-glow transition-smooth">
          <CardHeader>
            <CardTitle>Previsão Próximo Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{prediction}</div>
            <p className="text-xs text-muted-foreground">Pessoas estimadas</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

