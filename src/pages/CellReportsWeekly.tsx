import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfileMode } from "@/contexts/ProfileModeContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Trash2, Calendar, CheckCircle2, Clock, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Leader } from "@/types/church";
import FancyLoader from "@/components/FancyLoader";
import { formatDateBR } from "@/lib/dateUtils";
import { getCurrentWeekLeadersStatus, getLeadersWeeklyReportStatus, type LeaderWeeklyReportStatus } from "@/integrations/supabase/weekly-reports";
import { useSearchParams } from "react-router-dom";

interface WeeklyReport {
  id: string;
  liderId: string;
  reportDate: Date;
  membersCount: number;
  frequentadoresCount: number;
  observations?: string;
  createdAt: Date;
}

export function CellReportsWeekly() {
  const { user } = useAuth();
  const { mode } = useProfileMode();
  const { toast } = useToast();
  const isKidsMode = mode === 'kids';

  // ---- state ---------------------------------------------------------------
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [selectedLeaderId, setSelectedLeaderId] = useState<string>("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteReportId, setDeleteReportId] = useState<string | null>(null);
  const [reportDate, setReportDate] = useState("");
  const [membersCount, setMembersCount] = useState<number>(0);
  const [frequentadoresCount, setFrequentadoresCount] = useState<number>(0);
  const [observations, setObservations] = useState("");
  const [editingReport, setEditingReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [leadersStatus, setLeadersStatus] = useState<LeaderWeeklyReportStatus[]>([]);
  const [showStatusView, setShowStatusView] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // Filtros de mês e ano
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  
  // Verificar se há parâmetros de URL para selecionar líder e data
  useEffect(() => {
    const liderParam = searchParams.get('lider');
    const dateParam = searchParams.get('date');
    
    if (dateParam) {
      setReportDate(dateParam);
      
      // Se for pastor e tiver parâmetro de líder, selecionar o líder
      if (liderParam && user?.role === 'pastor') {
        setSelectedLeaderId(liderParam);
      }
      
      // Se for líder e tiver data, abrir o dialog de criação automaticamente
      if (user?.role === 'lider' && !isCreateDialogOpen) {
        setIsCreateDialogOpen(true);
      }
    } else if (liderParam && user?.role === 'pastor') {
      setSelectedLeaderId(liderParam);
    }
  }, [searchParams, user, isCreateDialogOpen]);

  // Load leaders for pastor
  const loadLeaders = useCallback(async () => {
    if (!user || user.role !== "pastor") return;

    let query = supabase
      .from("profiles")
      .select("id, name, email, celula, is_kids")
      .eq("role", "lider")
      .eq("pastor_uuid", user.id);
    
    // No modo Kids, mostrar apenas os do modo Kids. No modo normal, mostrar apenas os do modo normal
    if (isKidsMode) {
      query = query.eq('is_kids', true);
    } else {
      query = query.or('is_kids.is.null,is_kids.eq.false');
    }
    
    const { data, error } = await query.order("name");

    if (error) {
      console.error("Error loading leaders:", error);
      return;
    }

    const formatted: Leader[] = (data || []).map((l) => ({
      id: l.id,
      name: l.name,
      email: l.email || "",
      discipuladorId: "",
      createdAt: new Date(),
    }));
    setLeaders(formatted);
  }, [user, isKidsMode]);

  // ---- data load -----------------------------------------------------------
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    if (user.role === "pastor") {
      void loadLeaders();
      setLoading(false);
    } else {
      loadReports();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, mode]);

  // Recarregar relatórios quando líder selecionado mudar (para pastor)
  useEffect(() => {
    if (user && user.role === "pastor" && selectedLeaderId) {
      setLoading(true);
      loadReports();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLeaderId, mode]);

  // Recarregar relatórios quando mês ou ano mudarem
  useEffect(() => {
    if (user && ((user.role === "lider") || (user.role === "pastor" && selectedLeaderId))) {
      setLoading(true);
      loadReports();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear, mode]);

  const loadReports = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const liderId = user.role === "pastor" ? selectedLeaderId : user.id;
    
    if (user.role === "pastor" && !selectedLeaderId) {
      setReports([]);
      setLoading(false);
      return;
    }

    // Criar filtro de data baseado no mês e ano selecionados
    const startDate = new Date(selectedYear, selectedMonth - 1, 1);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(selectedYear, selectedMonth, 0); // Último dia do mês
    endDate.setHours(23, 59, 59, 999);

    // Formatar datas para YYYY-MM-DD (formato do banco)
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from("cell_reports_weekly")
      .select("*")
      .eq("lider_id", liderId)
      .gte("report_date", startDateStr)
      .lte("report_date", endDateStr)
      .order("report_date", { ascending: false });

    if (error) {
      console.error("Error loading reports:", error);
      // Se não houver relatórios ou erro de permissão, apenas retorna array vazio
      setReports([]);
      setLoading(false);
      return;
    }

    const formattedReports: WeeklyReport[] = (data || []).map((report) => ({
      id: report.id,
      liderId: report.lider_id,
      reportDate: new Date(report.report_date),
      membersCount: report.members_count || 0,
      frequentadoresCount: report.frequentadores_count || 0,
      observations: report.observations || undefined,
      createdAt: new Date(report.created_at),
    }));

    setReports(formattedReports);
    setLoading(false);
  };

  // ---- actions -------------------------------------------------------------
  const handleCreateReport = async () => {
    if (!user || !reportDate) return;

    const liderId = user.role === "pastor" ? selectedLeaderId : user.id;
    
    if (user.role === "pastor" && !selectedLeaderId) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um líder.",
        variant: "destructive",
      });
      return;
    }

    if (membersCount < 0 || frequentadoresCount < 0) {
      toast({
        title: "Erro",
        description: "As quantidades não podem ser negativas.",
        variant: "destructive",
      });
      return;
    }

    // Verificar se já existe um relatório para esta data e líder
    const { data: existingReport } = await supabase
      .from("cell_reports_weekly")
      .select("id")
      .eq("lider_id", liderId)
      .eq("report_date", reportDate)
      .single();

    if (existingReport) {
      // Abrir o relatório existente para edição automaticamente
      const { data: fullReport } = await supabase
        .from("cell_reports_weekly")
        .select("*")
        .eq("id", existingReport.id)
        .single();

      if (fullReport) {
        setEditingReport({
          id: fullReport.id,
          liderId: fullReport.lider_id,
          reportDate: new Date(fullReport.report_date),
          membersCount: fullReport.members_count || 0,
          frequentadoresCount: fullReport.frequentadores_count || 0,
          observations: fullReport.observations || undefined,
          createdAt: new Date(fullReport.created_at),
        });
        setReportDate(fullReport.report_date);
        setMembersCount(fullReport.members_count || 0);
        setFrequentadoresCount(fullReport.frequentadores_count || 0);
        setObservations(fullReport.observations || "");
        setIsCreateDialogOpen(false);
        setIsEditDialogOpen(true);
        
        toast({
          title: "Relatório já existe",
          description: "O relatório para esta data já existe. Abrindo para edição...",
        });
      } else {
        toast({
          title: "Erro",
          description: "Já existe um relatório para esta data, mas não foi possível carregá-lo.",
          variant: "destructive",
        });
      }
      return;
    }

    const { error } = await supabase.from("cell_reports_weekly").insert([
      {
        lider_id: liderId,
        report_date: reportDate,
        members_count: membersCount,
        frequentadores_count: frequentadoresCount,
        observations: observations || null,
      },
    ]);

    if (error) {
      // Verificar se é erro de constraint única
      if (error.code === '23505' || error.message?.includes('unique constraint')) {
        toast({
          title: "Relatório já existe",
          description: "Já existe um relatório para esta data. Por favor, edite o relatório existente.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: error.message || "Não foi possível criar o relatório.",
          variant: "destructive",
        });
      }
      return;
    }

    // Atualizar mês/ano selecionados para o mês do relatório criado (se necessário)
    if (reportDate) {
      const reportDateObj = new Date(reportDate);
      const reportMonth = reportDateObj.getMonth() + 1;
      const reportYear = reportDateObj.getFullYear();
      
      if (reportMonth !== selectedMonth || reportYear !== selectedYear) {
        setSelectedMonth(reportMonth);
        setSelectedYear(reportYear);
      }
    }

    // Aguardar um pouco para garantir que o banco processou
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await loadReports();
    
    // Se a view de status estiver aberta, recarregar também
    if (showStatusView) {
      await loadLeadersStatus();
    }
    
    setIsCreateDialogOpen(false);
    setReportDate("");
    setMembersCount(0);
    setFrequentadoresCount(0);
    setObservations("");

    toast({ title: "Sucesso", description: "Relatório criado com sucesso!" });
  };

  const openEditReport = (report: WeeklyReport) => {
    setEditingReport(report);
    setReportDate(report.reportDate.toISOString().split("T")[0]);
    setMembersCount(report.membersCount);
    setFrequentadoresCount(report.frequentadoresCount);
    setObservations(report.observations || "");
    setIsEditDialogOpen(true);
  };

  const handleUpdateReport = async () => {
    if (!user || !editingReport) return;

    if (membersCount < 0 || frequentadoresCount < 0) {
      toast({
        title: "Erro",
        description: "As quantidades não podem ser negativas.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("cell_reports_weekly")
      .update({
        report_date: reportDate,
        members_count: membersCount,
        frequentadores_count: frequentadoresCount,
        observations: observations || null,
      })
      .eq("id", editingReport.id);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o relatório.",
        variant: "destructive",
      });
      return;
    }

    // Atualizar mês/ano selecionados para o mês do relatório atualizado (se necessário)
    if (reportDate) {
      const reportDateObj = new Date(reportDate);
      const reportMonth = reportDateObj.getMonth() + 1;
      const reportYear = reportDateObj.getFullYear();
      
      if (reportMonth !== selectedMonth || reportYear !== selectedYear) {
        setSelectedMonth(reportMonth);
        setSelectedYear(reportYear);
      }
    }

    // Aguardar um pouco para garantir que o banco processou
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await loadReports();
    
    // Se a view de status estiver aberta, recarregar também
    if (showStatusView) {
      await loadLeadersStatus();
    }
    
    setIsEditDialogOpen(false);
    setEditingReport(null);
    setReportDate("");
    setMembersCount(0);
    setFrequentadoresCount(0);
    setObservations("");

    toast({ title: "Sucesso", description: "Relatório atualizado com sucesso!" });
  };

  const handleDeleteReport = async () => {
    if (!deleteReportId) return;
    
    const { error } = await supabase.from("cell_reports_weekly").delete().eq("id", deleteReportId);
    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o relatório.",
        variant: "destructive",
      });
      setDeleteReportId(null);
      return;
    }

    await loadReports();
    
    // Se a view de status estiver aberta, recarregar também
    if (showStatusView) {
      await loadLeadersStatus();
    }
    
    toast({ title: "Sucesso", description: "Relatório excluído com sucesso!" });
    setDeleteReportId(null);
  };

  // Carregar status dos líderes para a semana atual
  const loadLeadersStatus = async () => {
    if (!user || user.role !== "pastor") return;
    
    setStatusLoading(true);
    try {
      // Calcular início da semana (segunda-feira)
      const today = new Date();
      const dayOfWeek = today.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      
      const monday = new Date(today);
      monday.setDate(today.getDate() - daysToMonday);
      monday.setHours(0, 0, 0, 0);
      const weekStartDate = monday.toISOString().split('T')[0];

      // Buscar relatórios de toda a semana (segunda a domingo)
      // Vamos buscar todos os líderes e verificar se têm relatório em qualquer dia da semana
      const { data: leadersData } = await supabase
        .from('profiles')
        .select('id, name, email, phone, celula, is_kids')
        .eq('role', 'lider')
        .eq('pastor_uuid', user.id);
      
      if (isKidsMode) {
        // Filtrar no código se necessário
      } else {
        // Filtrar no código se necessário
      }

      const leaders = (leadersData || []).filter(l => {
        if (isKidsMode) return l.is_kids === true;
        return !l.is_kids || l.is_kids === false;
      });

      if (leaders.length === 0) {
        setLeadersStatus([]);
        setStatusLoading(false);
        return;
      }

      // Buscar todos os relatórios da semana (segunda a domingo)
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const weekEndDate = sunday.toISOString().split('T')[0];

      const liderIds = leaders.map(l => l.id);
      const { data: reports } = await supabase
        .from('cell_reports_weekly')
        .select('lider_id, report_date, members_count, frequentadores_count')
        .in('lider_id', liderIds)
        .gte('report_date', weekStartDate)
        .lte('report_date', weekEndDate);

      // Criar mapa de relatórios por líder (qualquer dia da semana conta)
      const reportsMap = new Map(
        (reports || []).map(r => [
          r.lider_id,
          {
            reportDate: r.report_date,
            membersCount: r.members_count,
            frequentadoresCount: r.frequentadores_count,
          }
        ])
      );

      const baseUrl = window.location.origin;
      const status: LeaderWeeklyReportStatus[] = leaders.map(leader => {
        const report = reportsMap.get(leader.id);
        const hasReport = !!report;
        const reportDateForLink = report?.reportDate || weekStartDate;

        return {
          liderId: leader.id,
          liderName: leader.name,
          liderEmail: leader.email || '',
          liderPhone: leader.phone || undefined,
          celula: leader.celula || undefined,
          hasReport,
          reportDate: report?.reportDate,
          membersCount: report?.membersCount,
          frequentadoresCount: report?.frequentadoresCount,
          reportLink: `${baseUrl}/relatorios-semanal?lider=${leader.id}&date=${reportDateForLink}`,
          fillLink: `${baseUrl}/relatorios-semanal?date=${reportDateForLink}`,
          isKids: leader.is_kids || false,
        };
      });

      setLeadersStatus(status);
    } catch (error) {
      console.error("Error loading leaders status:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o status dos líderes.",
        variant: "destructive",
      });
    } finally {
      setStatusLoading(false);
    }
  };

  // ---- UI ------------------------------------------------------------------
  const selectedLeader = user?.role === "pastor" ? leaders.find((l) => l.id === selectedLeaderId) : null;
  const cellName = user?.role === "pastor"
    ? selectedLeader
      ? `Célula de ${selectedLeader.name}`
      : "Selecione um líder"
    : user?.celula;

  if (loading) {
    return (
      <FancyLoader
        message="Carregando relatórios semanais"
        tips={[
          "Organizando os dados da semana...",
          "Preparando os relatórios...",
        ]}
      />
    );
  }

  // Se for pastor, mostrar seleção de líder
  if (user?.role === "pastor") {
    return (
      <div className="space-y-6 sm:space-y-8 animate-fade-in pb-16">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Relatório de Célula Semanal
            </h1>
            <div className="mt-2 flex gap-2">
              <Select value={selectedLeaderId} onValueChange={setSelectedLeaderId}>
                <SelectTrigger className="w-full sm:w-[300px]">
                  <SelectValue placeholder="Selecione um líder" />
                </SelectTrigger>
                <SelectContent>
                  {leaders.map((leader) => (
                    <SelectItem key={leader.id} value={leader.id}>
                      {leader.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => {
                  setShowStatusView(!showStatusView);
                  if (!showStatusView) {
                    loadLeadersStatus();
                  }
                }}
              >
                {showStatusView ? "Ver Relatórios" : "Ver Status dos Líderes"}
              </Button>
            </div>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary" disabled={!selectedLeaderId}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Relatório
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Novo Relatório Semanal</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="date">Data</Label>
                  <Input
                    id="date"
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="members">Quantidade de Membros</Label>
                  <Input
                    id="members"
                    type="number"
                    min="0"
                    value={membersCount}
                    onChange={(e) => setMembersCount(parseInt(e.target.value) || 0)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="frequentadores">Quantidade de Frequentadores</Label>
                  <Input
                    id="frequentadores"
                    type="number"
                    min="0"
                    value={frequentadoresCount}
                    onChange={(e) => setFrequentadoresCount(parseInt(e.target.value) || 0)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="observations">Observações</Label>
                  <Textarea
                    id="observations"
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    placeholder="Observações sobre a reunião..."
                    rows={3}
                  />
                </div>
                <Button onClick={handleCreateReport} className="w-full gradient-primary">
                  Criar Relatório
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Vista de Status dos Líderes */}
        {showStatusView && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Status dos Relatórios Semanais</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadLeadersStatus}
                  disabled={statusLoading}
                >
                  {statusLoading ? "Carregando..." : "Atualizar"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {statusLoading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Carregando status...</p>
                </div>
              ) : leadersStatus.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum líder encontrado.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Líder</TableHead>
                        <TableHead>Célula</TableHead>
                        <TableHead>Membros</TableHead>
                        <TableHead>Frequentadores</TableHead>
                        <TableHead>Link</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leadersStatus.map((status) => (
                        <TableRow key={status.liderId}>
                          <TableCell>
                            {status.hasReport ? (
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
                            ) : (
                              <Clock className="w-5 h-5 text-yellow-500" />
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            {status.liderName}
                          </TableCell>
                          <TableCell>{status.celula || "-"}</TableCell>
                          <TableCell>
                            {status.hasReport ? status.membersCount : "-"}
                          </TableCell>
                          <TableCell>
                            {status.hasReport ? status.frequentadoresCount : "-"}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedLeaderId(status.liderId);
                                setShowStatusView(false);
                                if (status.reportDate) {
                                  setReportDate(status.reportDate);
                                }
                              }}
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Abrir
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Filtros de mês e ano */}
        {selectedLeaderId && !showStatusView && (
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="month">Mês</Label>
                  <Select
                    value={selectedMonth.toString()}
                    onValueChange={(value) => setSelectedMonth(parseInt(value))}
                  >
                    <SelectTrigger id="month">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                        <SelectItem key={month} value={month.toString()}>
                          {new Date(2000, month - 1, 1).toLocaleDateString("pt-BR", {
                            month: "long",
                          })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label htmlFor="year">Ano</Label>
                  <Select
                    value={selectedYear.toString()}
                    onValueChange={(value) => setSelectedYear(parseInt(value))}
                  >
                    <SelectTrigger id="year">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i).map(
                        (year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de Relatórios */}
        {selectedLeaderId && !showStatusView && (
          <Card>
            <CardHeader>
              <CardTitle>Relatórios de {cellName}</CardTitle>
            </CardHeader>
            <CardContent>
              {reports.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum relatório encontrado para este período.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Membros</TableHead>
                        <TableHead>Frequentadores</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Observações</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell>{formatDateBR(report.reportDate)}</TableCell>
                          <TableCell>{report.membersCount}</TableCell>
                          <TableCell>{report.frequentadoresCount}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {report.membersCount + report.frequentadoresCount}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {report.observations || "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditReport(report)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDeleteReportId(report.id)}
                                  >
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir este relatório? Esta ação não
                                      pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setDeleteReportId(null)}>
                                      Cancelar
                                    </AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeleteReport}>
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Dialog de Edição */}
        <Dialog
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) setEditingReport(null);
          }}
        >
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Relatório Semanal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-date">Data</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-members">Quantidade de Membros</Label>
                <Input
                  id="edit-members"
                  type="number"
                  min="0"
                  value={membersCount}
                  onChange={(e) => setMembersCount(parseInt(e.target.value) || 0)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-frequentadores">Quantidade de Frequentadores</Label>
                <Input
                  id="edit-frequentadores"
                  type="number"
                  min="0"
                  value={frequentadoresCount}
                  onChange={(e) => setFrequentadoresCount(parseInt(e.target.value) || 0)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-observations">Observações</Label>
                <Textarea
                  id="edit-observations"
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Observações sobre a reunião..."
                  rows={3}
                />
              </div>
              <Button onClick={handleUpdateReport} className="w-full gradient-primary">
                Atualizar Relatório
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Se for líder, mostrar interface simplificada
  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-16">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Relatório de Célula Semanal
          </h1>
          <p className="text-muted-foreground mt-1">{cellName}</p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Novo Relatório
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Relatório Semanal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="date">Data</Label>
                <Input
                  id="date"
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="members">Quantidade de Membros</Label>
                <Input
                  id="members"
                  type="number"
                  min="0"
                  value={membersCount}
                  onChange={(e) => setMembersCount(parseInt(e.target.value) || 0)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="frequentadores">Quantidade de Frequentadores</Label>
                <Input
                  id="frequentadores"
                  type="number"
                  min="0"
                  value={frequentadoresCount}
                  onChange={(e) => setFrequentadoresCount(parseInt(e.target.value) || 0)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="observations">Observações</Label>
                <Textarea
                  id="observations"
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Observações sobre a reunião..."
                  rows={3}
                />
              </div>
              <Button onClick={handleCreateReport} className="w-full gradient-primary">
                Criar Relatório
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros de mês e ano */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="month">Mês</Label>
              <Select
                value={selectedMonth.toString()}
                onValueChange={(value) => setSelectedMonth(parseInt(value))}
              >
                <SelectTrigger id="month">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <SelectItem key={month} value={month.toString()}>
                      {new Date(2000, month - 1, 1).toLocaleDateString("pt-BR", {
                        month: "long",
                      })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label htmlFor="year">Ano</Label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger id="year">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i).map(
                    (year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Relatórios */}
      <Card>
        <CardHeader>
          <CardTitle>Meus Relatórios</CardTitle>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum relatório encontrado para este período.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Membros</TableHead>
                    <TableHead>Frequentadores</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Observações</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>{formatDateBR(report.reportDate)}</TableCell>
                      <TableCell>{report.membersCount}</TableCell>
                      <TableCell>{report.frequentadoresCount}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {report.membersCount + report.frequentadoresCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {report.observations || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditReport(report)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteReportId(report.id)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir este relatório? Esta ação não pode
                                  ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setDeleteReportId(null)}>
                                  Cancelar
                                </AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteReport}>
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Edição */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) setEditingReport(null);
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Relatório Semanal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-date">Data</Label>
              <Input
                id="edit-date"
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-members">Quantidade de Membros</Label>
              <Input
                id="edit-members"
                type="number"
                min="0"
                value={membersCount}
                onChange={(e) => setMembersCount(parseInt(e.target.value) || 0)}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-frequentadores">Quantidade de Frequentadores</Label>
              <Input
                id="edit-frequentadores"
                type="number"
                min="0"
                value={frequentadoresCount}
                onChange={(e) => setFrequentadoresCount(parseInt(e.target.value) || 0)}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-observations">Observações</Label>
              <Textarea
                id="edit-observations"
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Observações sobre a reunião..."
                rows={3}
              />
            </div>
            <Button onClick={handleUpdateReport} className="w-full gradient-primary">
              Atualizar Relatório
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CellReportsWeekly;

