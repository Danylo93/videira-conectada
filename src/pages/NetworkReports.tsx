import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  LabelList,
} from 'recharts';
import { FileText, Calendar, CheckCircle2, XCircle, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Leader, Discipulador, CellReport as CellReportType } from '@/types/church';
import { useToast } from '@/hooks/use-toast';
import FancyLoader from '@/components/FancyLoader';

/* ===================== helpers ===================== */

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 640px)');
    const onChange = (e: MediaQueryListEvent | MediaQueryList) =>
      setIsMobile('matches' in e ? e.matches : (e as MediaQueryList).matches);
    onChange(mql);
    mql.addEventListener('change', onChange as any);
    return () => mql.removeEventListener('change', onChange as any);
  }, []);
  return isMobile;
}

type ChartPoint = {
  name: string;
  membersCount: number;
  frequentadoresCount: number;
  totalCount: number;
};

/* ===================== componente ===================== */

export function NetworkReports() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [selectedLeader, setSelectedLeader] = useState('');
  const [reports, setReports] = useState<CellReportType[]>([]);
  const [networkReports, setNetworkReports] = useState<CellReportType[]>([]);
  const [discipuladores, setDiscipuladores] = useState<Discipulador[]>([]);
  const [selectedDiscipulador, setSelectedDiscipulador] = useState('');
  const [churchReports, setChurchReports] = useState<CellReportType[]>([]);
  const [chartMode, setChartMode] = useState<'mensal' | 'semanal'>('semanal');
  const [loading, setLoading] = useState(true);
  
  // Filtros de mês e ano
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  /* ========== carregamento base ========== */

  const loadReportsForLeaders = useCallback(
    async (leaderIds: string[], setter: React.Dispatch<React.SetStateAction<CellReportType[]>>) => {
      if (leaderIds.length === 0) {
        setter([]);
        return;
      }
      
      // Criar filtro de data baseado no mês e ano selecionados
      const startDate = new Date(selectedYear, selectedMonth - 1, 1);
      const endDate = new Date(selectedYear, selectedMonth, 0); // Último dia do mês
      
      const { data } = await supabase
        .from('cell_reports')
        .select('*')
        .in('lider_id', leaderIds)
        .gte('week_start', startDate.toISOString())
        .lte('week_start', endDate.toISOString())
        .order('week_start', { ascending: true });

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
      setter(formatted);
    },
    [selectedMonth, selectedYear]
  );

  const loadDiscipuladores = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('id, name, email, phone, created_at')
      .eq('pastor_uuid', user.id)
      .eq('role', 'discipulador')
      .order('created_at', { ascending: false });

    const formatted: Discipulador[] = (data || []).map((d) => ({
      id: d.id,
      name: d.name,
      email: d.email,
      phone: d.phone || undefined,
      pastorId: user.id,
      createdAt: new Date(d.created_at),
    }));
    setDiscipuladores(formatted);
  }, [user]);

  const loadLeaders = useCallback(async () => {
    if (!user) return;
    let query = supabase.from('profiles').select('id, name, email, discipulador_uuid').eq('role', 'lider');
    if (user.role === 'discipulador') query = query.eq('discipulador_uuid', user.id);
    else if (user.role === 'pastor') query = query.eq('pastor_uuid', user.id);

    const { data, error } = await query.order('name');
    if (error) {
      setLoading(false);
      return;
    }
    const formatted: Leader[] = (data || []).map((l) => ({
      id: l.id,
      name: l.name,
      email: l.email || '',
      phone: undefined,
      discipuladorId: l.discipulador_uuid || user.id,
      pastorId: user.role === 'pastor' ? user.id : undefined,
      createdAt: new Date(),
    }));
    setLeaders(formatted);

    await loadReportsForLeaders(
      formatted.map((l) => l.id),
      user.role === 'pastor' ? setChurchReports : setNetworkReports
    );
    setLoading(false);
  }, [user, loadReportsForLeaders]);

  useEffect(() => {
    if (user && (user.role === 'discipulador' || user.role === 'pastor')) {
      if (user.role === 'pastor') void loadDiscipuladores();
      void loadLeaders();
    } else {
      setLoading(false);
    }
  }, [user, loadDiscipuladores, loadLeaders]);

  // Recarregar relatórios quando mês ou ano mudarem
  useEffect(() => {
    if (user && leaders.length > 0 && (user.role === 'discipulador' || user.role === 'pastor')) {
      loadReportsForLeaders(
        leaders.map((l) => l.id),
        user.role === 'pastor' ? setChurchReports : setNetworkReports
      );
    }
  }, [selectedMonth, selectedYear, leaders, loadReportsForLeaders, user]);

  const loadReports = useCallback(async () => {
    const { data } = await supabase
      .from('cell_reports')
      .select('*')
      .eq('lider_id', selectedLeader)
      .order('week_start', { ascending: true });

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
  }, [selectedLeader]);

  useEffect(() => {
    if (selectedLeader) void loadReports();
  }, [selectedLeader, loadReports]);

  useEffect(() => {
    if (user?.role === 'pastor' && selectedDiscipulador) {
      const leaderIds = leaders.filter((l) => l.discipuladorId === selectedDiscipulador).map((l) => l.id);
      void loadReportsForLeaders(leaderIds, setNetworkReports);
    }
  }, [selectedDiscipulador, leaders, user, loadReportsForLeaders]);

  /* ========== datasets (apenas QUANTIDADE) ========== */

  // líder: semanal = 1 ponto por relatório; mensal = média semanal do mês
  const makeLeaderChart = useCallback(
    (items: CellReportType[]): ChartPoint[] => {
      if (items.length === 0) return [];

      if (chartMode === 'mensal') {
        const groups: Record<string, { weeks: number; mSum: number; fSum: number }> = {};
        items.forEach((r) => {
          const key = `${r.weekStart.getFullYear()}-${String(r.weekStart.getMonth() + 1).padStart(2, '0')}`;
          if (!groups[key]) groups[key] = { weeks: 0, mSum: 0, fSum: 0 };
          groups[key].weeks += 1;
          groups[key].mSum += r.members.length;
          groups[key].fSum += r.frequentadores.length;
        });

        return Object.entries(groups)
          .sort((a, b) => new Date(`${a[0]}-01`).getTime() - new Date(`${b[0]}-01`).getTime())
          .map(([key, v]) => {
            const [year, month] = key.split('-');
            const mAvg = Math.round(v.mSum / v.weeks);
            const fAvg = Math.round(v.fSum / v.weeks);
            return {
              name: `${month}/${year}`,
              membersCount: mAvg,
              frequentadoresCount: fAvg,
              totalCount: mAvg + fAvg,
            };
          });
      }

      // semanal
      return items
        .map((r) => {
          const m = r.members.length;
          const f = r.frequentadores.length;
          return {
            name: r.weekStart.toLocaleDateString('pt-BR'),
            membersCount: m,
            frequentadoresCount: f,
            totalCount: m + f,
          };
        })
        .sort((a, b) => {
          const [da, ma, ya] = a.name.split('/').map(Number);
          const [db, mb, yb] = b.name.split('/').map(Number);
          return new Date(ya, ma - 1, da).getTime() - new Date(yb, mb - 1, db).getTime();
        });
    },
    [chartMode]
  );

  // *** REDE: SOMA das quantidades de todos os líderes do discipulador ***
  const makeNetworkSumChart = useCallback(
    (items: CellReportType[]): ChartPoint[] => {
      if (chartMode === 'mensal') {
        const groups: Record<string, { m: number; f: number }> = {};
        items.forEach((r) => {
          const key = `${r.weekStart.getFullYear()}-${String(r.weekStart.getMonth() + 1).padStart(2, '0')}`;
          if (!groups[key]) groups[key] = { m: 0, f: 0 };
          groups[key].m += r.members.length;
          groups[key].f += r.frequentadores.length;
        });

        return Object.entries(groups)
          .sort((a, b) => new Date(`${a[0]}-01`).getTime() - new Date(`${b[0]}-01`).getTime())
          .map(([key, v]) => {
            const [year, month] = key.split('-');
            return {
              name: `${month}/${year}`,
              membersCount: v.m,
              frequentadoresCount: v.f,
              totalCount: v.m + v.f,
            };
          });
      }

      // semanal: soma de todos os líderes por semana
      const byWeek: Record<string, { start: Date; m: number; f: number }> = {};
      items.forEach((r) => {
        const k = r.weekStart.toISOString().split('T')[0];
        if (!byWeek[k]) byWeek[k] = { start: r.weekStart, m: 0, f: 0 };
        byWeek[k].m += r.members.length;
        byWeek[k].f += r.frequentadores.length;
      });

      return Object.values(byWeek)
        .sort((a, b) => a.start.getTime() - b.start.getTime())
        .map((w) => ({
          name: w.start.toLocaleDateString('pt-BR'),
          membersCount: w.m,
          frequentadoresCount: w.f,
          totalCount: w.m + w.f,
        }));
    },
    [chartMode]
  );

  // *** IGREJA: SOMA das quantidades de TODAS as células (todas as redes/discipuladores) ***
  const makeChurchSumChart = useCallback(
    (items: CellReportType[]): ChartPoint[] => {
      if (chartMode === 'mensal') {
        const groups: Record<string, { m: number; f: number }> = {};
        items.forEach((r) => {
          const key = `${r.weekStart.getFullYear()}-${String(r.weekStart.getMonth() + 1).padStart(2, '0')}`;
          if (!groups[key]) groups[key] = { m: 0, f: 0 };
          groups[key].m += r.members.length;
          groups[key].f += r.frequentadores.length;
        });

        return Object.entries(groups)
          .sort((a, b) => new Date(`${a[0]}-01`).getTime() - new Date(`${b[0]}-01`).getTime())
          .map(([key, v]) => {
            const [year, month] = key.split('-');
            return {
              name: `${month}/${year}`,
              membersCount: v.m,
              frequentadoresCount: v.f,
              totalCount: v.m + v.f,
            };
          });
      }

      // semanal: soma total por semana (todas as células)
      const byWeek: Record<string, { start: Date; m: number; f: number }> = {};
      items.forEach((r) => {
        const k = r.weekStart.toISOString().split('T')[0];
        if (!byWeek[k]) byWeek[k] = { start: r.weekStart, m: 0, f: 0 };
        byWeek[k].m += r.members.length;
        byWeek[k].f += r.frequentadores.length;
      });

      return Object.values(byWeek)
        .sort((a, b) => a.start.getTime() - b.start.getTime())
        .map((w) => ({
          name: w.start.toLocaleDateString('pt-BR'),
          membersCount: w.m,
          frequentadoresCount: w.f,
          totalCount: w.m + w.f,
        }));
    },
    [chartMode]
  );

  const chartDataLeader = useMemo(() => makeLeaderChart(reports), [reports, makeLeaderChart]);
  const networkChartData = useMemo(() => makeNetworkSumChart(networkReports), [networkReports, makeNetworkSumChart]);
  // ⬇️ Igreja agora usa *soma*:
  const churchChartData = useMemo(() => makeChurchSumChart(churchReports), [churchReports, makeChurchSumChart]);

  /* ========== exportações ========== */

  const handleExportChurch = () => {
    const data = churchReports.map((r) => ({
      Semana: r.weekStart.toLocaleDateString('pt-BR'),
      Lider: leaders.find((l) => l.id === r.liderId)?.name || r.liderId,
      Fase: r.phase,
      Membros: r.members.length,
      Frequentadores: r.frequentadores.length,
      Status: r.status,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Relatorios');
    XLSX.writeFile(wb, 'relatorios-igreja.xlsx');
  };

  const handleExportNetwork = () => {
    const data = networkReports.map((r) => ({
      Semana: r.weekStart.toLocaleDateString('pt-BR'),
      Lider: leaders.find((l) => l.id === r.liderId)?.name || r.liderId,
      Fase: r.phase,
      Membros: r.members.length,
      Frequentadores: r.frequentadores.length,
      Status: r.status,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Relatorios');
    XLSX.writeFile(wb, 'relatorios-rede.xlsx');
  };

  /* ========== ações rápidas ========== */

  const handleApprove = async (id: string) => {
    const { error } = await supabase.from('cell_reports').update({ status: 'approved' }).eq('id', id);
    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível aprovar o relatório.', variant: 'destructive' });
      return;
    }
    setReports((p) => p.map((r) => (r.id === id ? { ...r, status: 'approved' } : r)));
    setNetworkReports((p) => p.map((r) => (r.id === id ? { ...r, status: 'approved' } : r)));
    setChurchReports((p) => p.map((r) => (r.id === id ? { ...r, status: 'approved' } : r)));
    toast({ title: 'Relatório aprovado!' });
  };

  const handleRequestCorrection = async (report: CellReportType) => {
    const { error } = await supabase.from('cell_reports').update({ status: 'needs_correction' }).eq('id', report.id);
    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível enviar para correção.', variant: 'destructive' });
      return;
    }
    setReports((p) => p.map((r) => (r.id === report.id ? { ...r, status: 'needs_correction' } : r)));
    setNetworkReports((p) => p.map((r) => (r.id === report.id ? { ...r, status: 'needs_correction' } : r)));
    setChurchReports((p) => p.map((r) => (r.id === report.id ? { ...r, status: 'needs_correction' } : r)));
    await supabase.from('notifications').insert({
      user_id: report.liderId,
      message: `Seu relatório da semana ${report.weekStart.toLocaleDateString('pt-BR')} precisa de correção.`,
    });
    toast({ title: 'Correção solicitada!' });
  };

  /* ========== guards/loading ========== */

  if (!user || !['discipulador', 'pastor'].includes(user.role)) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Acesso restrito para discipuladores e pastores.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <FancyLoader
        message="Conectando as redes da Videira"
        tips={[
          'Chamando cada líder pelo nome, como Jesus fez com os discípulos…',
          'Organizando rolos e pergaminhos dos relatórios…',
          'Acendendo tochas pra iluminar os dados da sua rede…',
        ]}
      />
    );
  }

  /* ===================== UI (responsivo) ===================== */

  const ChartShell = ({ data }: { data: ChartPoint[] }) => (
    <div className="h-[220px] xs:h-[260px] sm:h-[300px] md:h-[340px] lg:h-[380px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ left: 8, right: 8, top: isMobile ? 8 : 16, bottom: isMobile ? 8 : 24 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            interval={isMobile ? 'preserveStartEnd' : 0}
            angle={isMobile ? 0 : -12}
            tickMargin={8}
            height={isMobile ? 36 : 54}
            minTickGap={10}
          />
          <YAxis allowDecimals={false} />
          <Tooltip
            wrapperStyle={{ zIndex: 30 }}
            formatter={(value: any, name: any) => {
              const map: Record<string, string> = {
                membersCount: 'Membros (qtde)',
                frequentadoresCount: 'Frequentadores (qtde)',
                totalCount: 'Total (qtde)',
              };
              return [value, map[name] || name];
            }}
          />
          <Legend wrapperStyle={{ paddingTop: isMobile ? 4 : 8 }} />
          <Line
            type="monotone"
            dataKey="membersCount"
            name="Membros (qtde)"
            stroke="#7c3aed"
            dot={!isMobile}
            strokeWidth={isMobile ? 2 : 3}
          >
            {!isMobile && <LabelList dataKey="membersCount" position="top" offset={6} />}
          </Line>
          <Line
            type="monotone"
            dataKey="frequentadoresCount"
            name="Frequentadores (qtde)"
            stroke="#16a34a"
            dot={!isMobile}
            strokeWidth={isMobile ? 2 : 3}
          >
            {!isMobile && <LabelList dataKey="frequentadoresCount" position="top" offset={6} />}
          </Line>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  /* -------------------------- PASTOR -------------------------- */
  if (user.role === 'pastor') {
    return (
      <Tabs defaultValue="church" className="space-y-6 sm:space-y-8 animate-fade-in">
        <TabsList className="sticky top-0 z-10 mx-auto w-full sm:w-auto overflow-auto rounded-xl">
          <TabsTrigger value="church">Igreja</TabsTrigger>
          <TabsTrigger value="networks">Redes</TabsTrigger>
        </TabsList>

        {/* ===== IGREJA (responsivo + soma) ===== */}
        <TabsContent value="church">
          <div className="space-y-6 sm:space-y-8">
            <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Relatório da Igreja</h1>
              <div className="flex flex-wrap items-center gap-2">
                {/* <Select value={chartMode} onValueChange={(v) => setChartMode(v as 'mensal' | 'semanal')}>
                  <SelectTrigger className="w-full sm:w-[160px] md:w-[200px]">
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="semanal">Semanal</SelectItem>
                  </SelectContent>
                </Select> */}
                <Button size="sm" className="shrink-0" onClick={handleExportChurch}>
                  <Download className="w-4 h-4" /> Excel
                </Button>
              </div>
            </div>

            {/* Filtro de Mês e Ano */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filtro por Período</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                  <div className="flex-1">
                    <Label htmlFor="month">Mês</Label>
                    <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o mês" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Janeiro</SelectItem>
                        <SelectItem value="2">Fevereiro</SelectItem>
                        <SelectItem value="3">Março</SelectItem>
                        <SelectItem value="4">Abril</SelectItem>
                        <SelectItem value="5">Maio</SelectItem>
                        <SelectItem value="6">Junho</SelectItem>
                        <SelectItem value="7">Julho</SelectItem>
                        <SelectItem value="8">Agosto</SelectItem>
                        <SelectItem value="9">Setembro</SelectItem>
                        <SelectItem value="10">Outubro</SelectItem>
                        <SelectItem value="11">Novembro</SelectItem>
                        <SelectItem value="12">Dezembro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="year">Ano</Label>
                    <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o ano" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 5 }, (_, i) => {
                          const year = currentDate.getFullYear() - 2 + i;
                          return (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:grape-glow transition-smooth">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Resumo (Soma • Quantidade)</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartShell data={churchChartData} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Relatórios
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                {churchReports.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhum relatório encontrado.</p>
                  </div>
                ) : (
                  <Table className="min-w-[880px] sm:min-w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px]">Líder</TableHead>
                        <TableHead className="min-w-[130px]">Semana</TableHead>
                        <TableHead className="min-w-[120px]">Status</TableHead>
                        <TableHead className="min-w-[130px]">Fase</TableHead>
                        <TableHead className="min-w-[200px]">Data de Multiplicação</TableHead>
                        <TableHead className="min-w-[180px]">Data de Envio</TableHead>
                        <TableHead className="min-w-[220px] text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {churchReports.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">
                            {leaders.find((l) => l.id === r.liderId)?.name || r.liderId}
                          </TableCell>
                          <TableCell>{r.weekStart.toLocaleDateString('pt-BR')}</TableCell>
                          <TableCell>
                            <Badge variant={r.status === 'approved' ? 'default' : r.status === 'needs_correction' ? 'destructive' : 'secondary'}>
                              {r.status === 'submitted' ? 'Enviado' : r.status === 'approved' ? 'Aprovado' : r.status === 'needs_correction' ? 'Correção' : 'Rascunho'}
                            </Badge>
                          </TableCell>
                          <TableCell>{r.phase}</TableCell>
                          <TableCell>
                            {r.multiplicationDate ? (
                              <div className="flex items-center gap-1 text-sm">
                                <Calendar className="w-3 h-3" />
                                {r.multiplicationDate.toLocaleDateString('pt-BR')}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="w-3 h-3" />
                              {r.submittedAt.toLocaleDateString('pt-BR')}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {r.status === 'submitted' && (
                              <div className="flex flex-col items-end gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                                <Button size="sm" className="inline-flex items-center gap-1" onClick={() => handleApprove(r.id)}>
                                  <CheckCircle2 className="w-4 h-4" /> Aprovar
                                </Button>
                                <Button size="sm" variant="secondary" className="inline-flex items-center gap-1" onClick={() => handleRequestCorrection(r)}>
                                  <XCircle className="w-4 h-4" /> Correção
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ===== REDES ===== */}
        <TabsContent value="networks">
          <div className="space-y-6 sm:space-y-8">
            <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Relatórios das Redes</h1>
              <div className="flex flex-wrap gap-2">
                <Select value={selectedDiscipulador} onValueChange={setSelectedDiscipulador}>
                  <SelectTrigger className="w-full sm:w-[180px] md:w-[220px]">
                    <SelectValue placeholder="Discipulador" />
                  </SelectTrigger>
                  <SelectContent>
                    {discipuladores.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={chartMode} onValueChange={(v) => setChartMode(v as 'mensal' | 'semanal')}>
                  {/* <SelectTrigger className="w-full sm:w-[140px] md:w-[180px]">
                    <SelectValue placeholder="Período" />
                  </SelectTrigger> */}
                  {/* <SelectContent>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="semanal">Semanal</SelectItem>
                  </SelectContent> */}
                </Select>
                {selectedDiscipulador && (
                  <Button size="sm" className="shrink-0" onClick={handleExportNetwork}>
                    <Download className="w-4 h-4" /> Excel
                  </Button>
                )}
              </div>
            </div>

            {/* Filtro de Mês e Ano */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filtro por Período</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                  <div className="flex-1">
                    <Label htmlFor="month">Mês</Label>
                    <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o mês" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Janeiro</SelectItem>
                        <SelectItem value="2">Fevereiro</SelectItem>
                        <SelectItem value="3">Março</SelectItem>
                        <SelectItem value="4">Abril</SelectItem>
                        <SelectItem value="5">Maio</SelectItem>
                        <SelectItem value="6">Junho</SelectItem>
                        <SelectItem value="7">Julho</SelectItem>
                        <SelectItem value="8">Agosto</SelectItem>
                        <SelectItem value="9">Setembro</SelectItem>
                        <SelectItem value="10">Outubro</SelectItem>
                        <SelectItem value="11">Novembro</SelectItem>
                        <SelectItem value="12">Dezembro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="year">Ano</Label>
                    <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o ano" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 5 }, (_, i) => {
                          const year = currentDate.getFullYear() - 2 + i;
                          return (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {selectedDiscipulador && (
              <Card className="hover:grape-glow transition-smooth">
                <CardHeader><CardTitle>Resumo (Soma • Quantidade)</CardTitle></CardHeader>
                <CardContent><ChartShell data={networkChartData} /></CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    );
  }

  /* -------------------------- DISCIPULADOR -------------------------- */

  return (
    <Tabs defaultValue="leader" className="space-y-6 sm:space-y-8 animate-fade-in">
      <TabsList className="sticky top-0 z-10 mx-auto w-full sm:w-auto overflow-auto rounded-xl">
        <TabsTrigger value="leader">Por Líder</TabsTrigger>
        <TabsTrigger value="network">Rede</TabsTrigger>
      </TabsList>

      <TabsContent value="leader">
        <div className="space-y-6 sm:space-y-8">
          <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Relatórios dos Líderes</h1>
            <div className="flex -mx-1 overflow-x-auto sm:overflow-visible px-1 gap-2 sm:gap-3">
              <Select value={selectedLeader} onValueChange={setSelectedLeader}>
                <SelectTrigger className="w-[180px] sm:w-[220px]">
                  <SelectValue placeholder="Selecione um líder" />
                </SelectTrigger>
                <SelectContent>
                  {leaders.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={chartMode} onValueChange={(v) => setChartMode(v as 'mensal' | 'semanal')}>
                <SelectTrigger className="w-[140px] sm:w-[180px]">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="semanal">Semanal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filtro de Mês e Ano */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filtro por Período</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                <div className="flex-1">
                  <Label htmlFor="month">Mês</Label>
                  <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o mês" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Janeiro</SelectItem>
                      <SelectItem value="2">Fevereiro</SelectItem>
                      <SelectItem value="3">Março</SelectItem>
                      <SelectItem value="4">Abril</SelectItem>
                      <SelectItem value="5">Maio</SelectItem>
                      <SelectItem value="6">Junho</SelectItem>
                      <SelectItem value="7">Julho</SelectItem>
                      <SelectItem value="8">Agosto</SelectItem>
                      <SelectItem value="9">Setembro</SelectItem>
                      <SelectItem value="10">Outubro</SelectItem>
                      <SelectItem value="11">Novembro</SelectItem>
                      <SelectItem value="12">Dezembro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label htmlFor="year">Ano</Label>
                  <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o ano" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 5 }, (_, i) => {
                        const year = currentDate.getFullYear() - 2 + i;
                        return (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {selectedLeader && (
            <>
              <Card className="hover:grape-glow transition-smooth">
                <CardHeader><CardTitle>Resumo (Quantidade)</CardTitle></CardHeader>
                <CardContent><ChartShell data={chartDataLeader} /></CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Relatórios
                  </CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  {reports.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Nenhum relatório encontrado.</p>
                    </div>
                  ) : (
                    <Table className="min-w-[760px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[140px]">Semana</TableHead>
                          <TableHead className="min-w-[120px]">Status</TableHead>
                          <TableHead className="min-w-[130px]">Fase</TableHead>
                          <TableHead className="min-w-[200px]">Data de Multiplicação</TableHead>
                          <TableHead className="min-w-[170px]">Data de Envio</TableHead>
                          <TableHead className="min-w-[200px] text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reports.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell className="font-medium">{r.weekStart.toLocaleDateString('pt-BR')}</TableCell>
                            <TableCell>
                              <Badge variant={r.status === 'approved' ? 'default' : r.status === 'needs_correction' ? 'destructive' : 'secondary'}>
                                {r.status === 'submitted' ? 'Enviado' : r.status === 'approved' ? 'Aprovado' : r.status === 'needs_correction' ? 'Correção' : 'Rascunho'}
                              </Badge>
                            </TableCell>
                            <TableCell>{r.phase}</TableCell>
                            <TableCell>
                              {r.multiplicationDate ? (
                                <div className="flex items-center gap-1 text-sm">
                                  <Calendar className="w-3 h-3" />
                                  {r.multiplicationDate.toLocaleDateString('pt-BR')}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm">
                                <Calendar className="w-3 h-3" />
                                {r.submittedAt.toLocaleDateString('pt-BR')}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {r.status === 'submitted' && (
                                <div className="flex flex-col items-end gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                                  <Button size="sm" className="inline-flex items-center gap-1" onClick={() => handleApprove(r.id)}>
                                    <CheckCircle2 className="w-4 h-4" /> Aprovar
                                  </Button>
                                  <Button size="sm" variant="secondary" className="inline-flex items-center gap-1" onClick={() => handleRequestCorrection(r)}>
                                    <XCircle className="w-4 h-4" /> Correção
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </TabsContent>

      <TabsContent value="network">
        <div className="space-y-6 sm:space-y-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Relatório da Rede</h1>
            <div className="flex -mx-1 overflow-x-auto sm:overflow-visible px-1 gap-2 sm:gap-3">
              <Select value={chartMode} onValueChange={(v) => setChartMode(v as 'semanal' | 'mensal')}>
                <SelectTrigger className="w-[140px] sm:w-[180px]">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="semanal">Semanal</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" className="shrink-0" onClick={handleExportNetwork}>
                <Download className="w-4 h-4" /> Excel
              </Button>
            </div>
          </div>

          <Card className="hover:grape-glow transition-smooth">
            <CardHeader><CardTitle>Resumo (Soma • Quantidade)</CardTitle></CardHeader>
            <CardContent><ChartShell data={networkChartData} /></CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}
