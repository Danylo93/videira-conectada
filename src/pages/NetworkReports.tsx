import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FileText, Calendar, CheckCircle2, XCircle, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Leader, CellReport as CellReportType } from '@/types/church';
import { useToast } from '@/hooks/use-toast';

export function NetworkReports() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [selectedLeader, setSelectedLeader] = useState('');
  const [reports, setReports] = useState<CellReportType[]>([]);
  const [networkReports, setNetworkReports] = useState<CellReportType[]>([]);
  const [chartMode, setChartMode] = useState<'mensal' | 'semanal'>('mensal');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role === 'discipulador') {
      loadLeaders();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadLeaders = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email')
      .eq('discipulador_uuid', user.id)
      .eq('role', 'lider')
      .order('name');
    if (error) {
      console.error('Error loading leaders:', error);
      setLoading(false);
      return;
    }
    const formatted: Leader[] = (data || []).map((l) => ({
      id: l.id,
      name: l.name,
      email: l.email || '',
      phone: undefined,
      discipuladorId: user.id,
      pastorId: undefined,
      createdAt: new Date(),
    }));
    setLeaders(formatted);
    await loadNetworkReports(formatted.map((l) => l.id));
    setLoading(false);
  };

  useEffect(() => {
    if (selectedLeader) {
      loadReports();
    }
  }, [selectedLeader]);

  const loadReports = async () => {
    const { data, error } = await supabase
      .from('cell_reports')
      .select('*')
      .eq('lider_id', selectedLeader)
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
  };

  const loadNetworkReports = async (leaderIds: string[]) => {
    if (leaderIds.length === 0) return;
    const { data, error } = await supabase
      .from('cell_reports')
      .select('*')
      .in('lider_id', leaderIds)
      .order('week_start', { ascending: true });
    if (error) {
      console.error('Error loading network reports:', error);
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
    setNetworkReports(formatted);
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

  const networkChartData = useMemo(() => {
    if (chartMode === 'mensal') {
      const groups: Record<string, { members: number; frequentadores: number }> = {};
      networkReports.forEach((r) => {
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
    return networkReports.map((r) => ({
      name: r.weekStart.toLocaleDateString('pt-BR'),
      members: r.members.length,
      frequentadores: r.frequentadores.length,
    }));
  }, [networkReports, chartMode]);

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

  const handleApprove = async (id: string) => {
    const { error } = await supabase
      .from('cell_reports')
      .update({ status: 'approved' })
      .eq('id', id);
    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível aprovar o relatório.',
        variant: 'destructive',
      });
      return;
    }
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'approved' } : r)));
    setNetworkReports((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'approved' } : r)));
    toast({ title: 'Relatório aprovado!' });
  };

  const handleRequestCorrection = async (report: CellReportType) => {
    const { error } = await supabase
      .from('cell_reports')
      .update({ status: 'needs_correction' })
      .eq('id', report.id);
    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar para correção.',
        variant: 'destructive',
      });
      return;
    }
    setReports((prev) =>
      prev.map((r) => (r.id === report.id ? { ...r, status: 'needs_correction' } : r))
    );
    setNetworkReports((prev) =>
      prev.map((r) => (r.id === report.id ? { ...r, status: 'needs_correction' } : r))
    );
    await supabase.from('notifications').insert({
      user_id: report.liderId,
      message: `Seu relatório da semana ${report.weekStart.toLocaleDateString('pt-BR')} precisa de correção.`,
    });
    toast({ title: 'Correção solicitada!' });
  };

  if (!user || user.role !== 'discipulador') {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Acesso restrito para discipuladores.</p>
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

  return (
    <Tabs defaultValue="leader" className="space-y-8 animate-fade-in">
      <TabsList>
        <TabsTrigger value="leader">Por Líder</TabsTrigger>
        <TabsTrigger value="network">Rede</TabsTrigger>
      </TabsList>

      <TabsContent value="leader">
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-3xl font-bold text-foreground">Relatórios dos Líderes</h1>
            <div className="flex gap-4">
              <Select value={selectedLeader} onValueChange={setSelectedLeader}>
                <SelectTrigger className="w-[200px]">
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

          {selectedLeader && (
            <>
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

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Relatórios
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {reports.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Nenhum relatório encontrado.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Semana</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Fase</TableHead>
                          <TableHead>Data de Multiplicação</TableHead>
                          <TableHead>Data de Envio</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reports.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell className="font-medium">
                              {r.weekStart.toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell>
                              <Badge variant={r.status === 'approved' ? 'default' : r.status === 'needs_correction' ? 'destructive' : 'secondary'}>
                                {r.status === 'submitted'
                                  ? 'Enviado'
                                  : r.status === 'approved'
                                  ? 'Aprovado'
                                  : r.status === 'needs_correction'
                                  ? 'Correção'
                                  : 'Rascunho'}
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
                            <TableCell className="text-right space-x-2">
                              {r.status === 'submitted' && (
                                <>
                                  <Button size="sm" className="inline-flex items-center gap-1" onClick={() => handleApprove(r.id)}>
                                    <CheckCircle2 className="w-4 h-4" /> Aprovar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="inline-flex items-center gap-1"
                                    onClick={() => handleRequestCorrection(r)}
                                  >
                                    <XCircle className="w-4 h-4" /> Correção
                                  </Button>
                                </>
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
  <div className="space-y-8">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <h1 className="text-3xl font-bold text-foreground">Relatório da Rede</h1>
      <div className="flex gap-4">
        <Select value={chartMode} onValueChange={(v) => setChartMode(v as 'mensal' | 'semanal')}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mensal">Mensal</SelectItem>
            <SelectItem value="semanal">Semanal</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" className="flex items-center gap-1" onClick={handleExportNetwork}>
          <Download className="w-4 h-4" /> Excel
        </Button>
      </div>
    </div>

    {/* Resumo (gráfico) da Rede */}
    <Card className="hover:grape-glow transition-smooth">
      <CardHeader>
        <CardTitle>Resumo</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={networkChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="members" name="Membros" stroke="#8884d8" />
            <Line type="monotone" dataKey="frequentadores" name="Frequentadores" stroke="#82ca9d" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>

    {/* 🔕 Removido: Card com a tabela de Relatórios na visão "Rede" */}
  </div>
</TabsContent>

    </Tabs>
  );
}
