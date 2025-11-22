import { useState, useEffect, useCallback, useMemo } from "react";
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
import { Plus, Edit, Trash2, Calendar, CheckCircle2, Clock, ExternalLink, BarChart3, TrendingUp, Download, Send, Search, Filter, Users, TrendingDown, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Leader } from "@/types/church";
import FancyLoader from "@/components/FancyLoader";
import { formatDateBR } from "@/lib/dateUtils";
import { getCurrentWeekLeadersStatus, getLeadersWeeklyReportStatus, type LeaderWeeklyReportStatus } from "@/integrations/supabase/weekly-reports";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import * as XLSX from "xlsx";

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
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "members" | "frequentadores" | "total">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Filtros de semana
  const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajusta para segunda-feira
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  const getWeekRange = (weekStart: Date) => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    return { start: weekStart, end: weekEnd };
  };

  // Gerar semanas por mês (a partir de novembro de 2025, apenas semanas passadas e atual)
  const generateWeeksByMonth = () => {
    const today = new Date();
    const currentWeekStart = getWeekStart(today);
    const months: Record<string, Array<{ start: Date; end: Date; label: string; key: string; isCurrent: boolean }>> = {};
    
    // Começar de novembro de 2025
    const startDate = new Date(2025, 10, 1); // Novembro 2025 (mês 10, 0-indexed)
    const startWeek = getWeekStart(startDate);
    
    // Gerar semanas até a semana atual (não incluir futuras)
    let weekStart = new Date(startWeek);
    
    while (weekStart <= currentWeekStart) {
      const range = getWeekRange(weekStart);
      const monthKey = `${range.start.getFullYear()}-${String(range.start.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = range.start.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
      
      if (!months[monthKey]) {
        months[monthKey] = [];
      }
      
      const isCurrent = weekStart.getTime() === currentWeekStart.getTime();
      const label = isCurrent 
        ? `${formatDateBR(range.start)} - ${formatDateBR(range.end)} (Atual)`
        : `${formatDateBR(range.start)} - ${formatDateBR(range.end)}`;
      
      months[monthKey].push({
        start: range.start,
        end: range.end,
        label,
        key: range.start.toISOString().split('T')[0],
        isCurrent,
      });
      
      // Próxima semana
      weekStart = new Date(weekStart);
      weekStart.setDate(weekStart.getDate() + 7);
    }
    
    return months;
  };

  const weeksByMonth = generateWeeksByMonth();
  const monthKeys = Object.keys(weeksByMonth).sort().reverse(); // Mais recente primeiro
  
  const currentWeekStart = getWeekStart(new Date());
  const [selectedWeekKey, setSelectedWeekKey] = useState(
    currentWeekStart.toISOString().split('T')[0]
  );
  const [selectedMonthKey, setSelectedMonthKey] = useState(() => {
    const currentMonthKey = `${currentWeekStart.getFullYear()}-${String(currentWeekStart.getMonth() + 1).padStart(2, '0')}`;
    return monthKeys[0] || currentMonthKey;
  });

  const selectedWeek = Object.values(weeksByMonth)
    .flat()
    .find(w => w.key === selectedWeekKey) || 
    weeksByMonth[selectedMonthKey]?.[0] || 
    { start: currentWeekStart, end: getWeekRange(currentWeekStart).end, label: "", key: "" };
  
  const currentMonthWeeks = weeksByMonth[selectedMonthKey] || [];

  // Quando o mês muda, selecionar a primeira semana do mês se a semana atual não estiver no mês
  useEffect(() => {
    const weekInMonth = currentMonthWeeks.find(w => w.key === selectedWeekKey);
    if (!weekInMonth && currentMonthWeeks.length > 0) {
      setSelectedWeekKey(currentMonthWeeks[0].key);
    }
  }, [selectedMonthKey, currentMonthWeeks, selectedWeekKey]);
  
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

  // Recarregar relatórios quando semana selecionada mudar
  useEffect(() => {
    if (user && ((user.role === "lider") || (user.role === "pastor" && selectedLeaderId))) {
      setLoading(true);
      loadReports();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWeekKey, mode]);

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

    // Criar filtro de data baseado na semana selecionada
    const startDate = selectedWeek.start;
    const endDate = selectedWeek.end;

    // Formatar datas para YYYY-MM-DD (formato do banco DATE)
    // Usar métodos locais para evitar problemas de fuso horário
    const startYear = startDate.getFullYear();
    const startMonth = String(startDate.getMonth() + 1).padStart(2, '0');
    const startDay = String(startDate.getDate()).padStart(2, '0');
    const startDateStr = `${startYear}-${startMonth}-${startDay}`;
    
    const endYear = endDate.getFullYear();
    const endMonth = String(endDate.getMonth() + 1).padStart(2, '0');
    const endDay = String(endDate.getDate()).padStart(2, '0');
    const endDateStr = `${endYear}-${endMonth}-${endDay}`;

    try {
      // Validar que as datas estão no formato correto
      if (!startDateStr || !endDateStr || !/^\d{4}-\d{2}-\d{2}$/.test(startDateStr) || !/^\d{4}-\d{2}-\d{2}$/.test(endDateStr)) {
        console.error("Invalid date format:", { startDateStr, endDateStr });
        setReports([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("cell_reports_weekly")
        .select("*")
        .eq("lider_id", liderId)
        .gte("report_date", startDateStr)
        .lte("report_date", endDateStr)
        .order("report_date", { ascending: false });

      if (error) {
        console.error("Error loading reports:", error);
        console.error("Query params:", { liderId, startDateStr, endDateStr });
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

      // Sempre atualizar a lista, mesmo que esteja vazia
      setReports(formattedReports);
    } catch (err) {
      console.error("Unexpected error loading reports:", err);
      setReports([]);
    } finally {
      setLoading(false);
    }
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

    // Atualizar semana selecionada para a semana do relatório criado (se necessário)
    if (reportDate) {
      const reportDateObj = new Date(reportDate + "T00:00:00");
      const weekStart = getWeekStart(reportDateObj);
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (weekKey !== selectedWeekKey) {
        setSelectedWeekKey(weekKey);
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

    // Atualizar semana selecionada para a semana do relatório atualizado (se necessário)
    if (reportDate) {
      const reportDateObj = new Date(reportDate + "T00:00:00");
      const weekStart = getWeekStart(reportDateObj);
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (weekKey !== selectedWeekKey) {
        setSelectedWeekKey(weekKey);
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
    
    const reportIdToDelete = deleteReportId;
    setDeleteReportId(null); // Fechar o diálogo imediatamente
    
    // Remover o relatório da lista localmente imediatamente para feedback visual
    setReports(prevReports => prevReports.filter(r => r.id !== reportIdToDelete));
    
    const { error } = await supabase
      .from("cell_reports_weekly")
      .delete()
      .eq("id", reportIdToDelete);
      
    if (error) {
      // Se houver erro, recarregar a lista para restaurar o estado
      await loadReports();
      toast({
        title: "Erro",
        description: "Não foi possível excluir o relatório.",
        variant: "destructive",
      });
      return;
    }

    // Aguardar um pouco para garantir que o banco processou a exclusão
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Forçar recarregamento completo usando loadReports
    setLoading(true);
    await loadReports();
    
    // Se a view de status estiver aberta, recarregar também
    if (showStatusView) {
      await loadLeadersStatus();
    }
    
    toast({ title: "Sucesso", description: "Relatório excluído com sucesso!" });
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

  // Função para enviar WhatsApp para líderes pendentes
  const handleSendWhatsApp = async () => {
    if (!user || user.role !== "pastor") return;

    setSendingWhatsApp(true);
    try {
      const baseUrl = window.location.origin;

      const { data, error } = await supabase.functions.invoke("send-weekly-reports-whatsapp", {
        body: {
          pastorId: user.id,
          isKids: isKidsMode,
          baseUrl,
        },
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        toast({
          title: "Sucesso",
          description: data.message || `Mensagens enviadas para ${data.sent} líder(es)`,
        });
        // Recarregar status após envio
        await loadLeadersStatus();
      } else {
        throw new Error(data.error || "Erro ao enviar mensagens");
      }
    } catch (error: any) {
      console.error("Error sending WhatsApp:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível enviar as mensagens via WhatsApp",
        variant: "destructive",
      });
    } finally {
      setSendingWhatsApp(false);
    }
  };

  // Função para exportar relatórios para Excel
  const handleExportExcel = () => {
    if (reports.length === 0) {
      toast({
        title: "Aviso",
        description: "Não há relatórios para exportar",
      });
      return;
    }

    const data = reports.map((report) => ({
      Data: formatDateBR(report.reportDate),
      Membros: report.membersCount,
      Frequentadores: report.frequentadoresCount,
      Total: report.membersCount + report.frequentadoresCount,
      Observações: report.observations || "",
      "Data de Criação": formatDateBR(report.createdAt),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Relatórios Semanais");
    
    const weekLabel = selectedWeek.label.replace(/\s*\(Atual\)\s*/g, '').replace(/\s+/g, '-');
    const fileName = `relatorios-semanais-${weekLabel}${selectedLeaderId ? `-${selectedLeader?.name}` : ""}.xlsx`;
    XLSX.writeFile(wb, fileName);

    toast({
      title: "Sucesso",
      description: "Relatórios exportados com sucesso!",
    });
  };

  // Filtrar e ordenar relatórios
  const filteredAndSortedReports = reports
    .filter((report) => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        formatDateBR(report.reportDate).toLowerCase().includes(searchLower) ||
        (report.observations || "").toLowerCase().includes(searchLower) ||
        report.membersCount.toString().includes(searchLower) ||
        report.frequentadoresCount.toString().includes(searchLower)
      );
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "date":
          comparison = a.reportDate.getTime() - b.reportDate.getTime();
          break;
        case "members":
          comparison = a.membersCount - b.membersCount;
          break;
        case "frequentadores":
          comparison = a.frequentadoresCount - b.frequentadoresCount;
          break;
        case "total":
          comparison = (a.membersCount + a.frequentadoresCount) - (b.membersCount + b.frequentadoresCount);
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  // Preparar dados para os gráficos
  const chartData = filteredAndSortedReports
    .slice()
    .sort((a, b) => a.reportDate.getTime() - b.reportDate.getTime())
    .map((report) => ({
      date: formatDateBR(report.reportDate),
      dateShort: report.reportDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      membros: report.membersCount,
      frequentadores: report.frequentadoresCount,
      total: report.membersCount + report.frequentadoresCount,
    }));

  // Calcular estatísticas
  const stats = useMemo(() => {
    if (reports.length === 0) {
      return {
        totalReports: 0,
        avgMembers: 0,
        avgFrequentadores: 0,
        avgTotal: 0,
        maxMembers: 0,
        maxFrequentadores: 0,
        maxTotal: 0,
        minMembers: 0,
        minFrequentadores: 0,
        minTotal: 0,
        totalMembers: 0,
        totalFrequentadores: 0,
        totalParticipants: 0,
        growthRate: 0,
      };
    }

    const members = reports.map((r) => r.membersCount);
    const frequentadores = reports.map((r) => r.frequentadoresCount);
    const totals = reports.map((r) => r.membersCount + r.frequentadoresCount);

    const sortedReports = [...reports].sort((a, b) => a.reportDate.getTime() - b.reportDate.getTime());
    const firstTotal = sortedReports[0].membersCount + sortedReports[0].frequentadoresCount;
    const lastTotal = sortedReports[sortedReports.length - 1].membersCount + sortedReports[sortedReports.length - 1].frequentadoresCount;
    const growthRate = firstTotal > 0 ? ((lastTotal - firstTotal) / firstTotal) * 100 : 0;

    return {
      totalReports: reports.length,
      avgMembers: Math.round(members.reduce((a, b) => a + b, 0) / members.length),
      avgFrequentadores: Math.round(frequentadores.reduce((a, b) => a + b, 0) / frequentadores.length),
      avgTotal: Math.round(totals.reduce((a, b) => a + b, 0) / totals.length),
      maxMembers: Math.max(...members),
      maxFrequentadores: Math.max(...frequentadores),
      maxTotal: Math.max(...totals),
      minMembers: Math.min(...members),
      minFrequentadores: Math.min(...frequentadores),
      minTotal: Math.min(...totals),
      totalMembers: members.reduce((a, b) => a + b, 0),
      totalFrequentadores: frequentadores.reduce((a, b) => a + b, 0),
      totalParticipants: totals.reduce((a, b) => a + b, 0),
      growthRate: Math.round(growthRate * 100) / 100,
    };
  }, [reports]);

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
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle>Status dos Relatórios Semanais</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadLeadersStatus}
                    disabled={statusLoading}
                  >
                    {statusLoading ? "Carregando..." : "Atualizar"}
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSendWhatsApp}
                    disabled={sendingWhatsApp || statusLoading}
                    className="gradient-primary"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {sendingWhatsApp ? "Enviando..." : "Enviar WhatsApp"}
                  </Button>
                </div>
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

        {/* Seleção de Semana por Mês */}
        {selectedLeaderId && !showStatusView && (
          <Card>
            <CardHeader>
              <CardTitle>Selecionar Semana</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Seletor de Mês */}
              <div>
                <Label htmlFor="month-select">Mês</Label>
                <Select value={selectedMonthKey} onValueChange={setSelectedMonthKey}>
                  <SelectTrigger id="month-select" className="w-full sm:w-[300px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthKeys.map((monthKey) => {
                      const firstWeek = weeksByMonth[monthKey]?.[0];
                      if (!firstWeek) return null;
                      const monthLabel = firstWeek.start.toLocaleDateString("pt-BR", { 
                        month: "long", 
                        year: "numeric" 
                      });
                      return (
                        <SelectItem key={monthKey} value={monthKey}>
                          {monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Semanas do Mês Selecionado */}
              {currentMonthWeeks.length > 0 && (
                <div>
                  <Label className="mb-2 block">Semanas disponíveis</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                    {currentMonthWeeks.map((week) => (
                      <Button
                        key={week.key}
                        variant={selectedWeekKey === week.key ? "default" : "outline"}
                        onClick={() => setSelectedWeekKey(week.key)}
                        className={`justify-start text-left h-auto py-2.5 px-3 ${
                          week.isCurrent && selectedWeekKey !== week.key 
                            ? "border-2 border-primary" 
                            : ""
                        }`}
                      >
                        <div className="flex flex-col items-start w-full">
                          <span className={`text-sm ${week.isCurrent ? "font-semibold" : ""}`}>
                            {week.label.replace(" (Atual)", "")}
                          </span>
                          {week.isCurrent && (
                            <span className="text-xs text-primary/80 mt-0.5">Semana Atual</span>
                          )}
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Gráficos e Lista de Relatórios */}
        {selectedLeaderId && !showStatusView && (
          <Tabs defaultValue="graficos" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="graficos" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Gráficos
              </TabsTrigger>
              <TabsTrigger value="tabela" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Tabela
              </TabsTrigger>
            </TabsList>

            <TabsContent value="graficos" className="space-y-6">
              {reports.length === 0 ? (
                <Card>
                  <CardContent className="py-8">
                    <p className="text-center text-muted-foreground">
                      Nenhum relatório encontrado para este período. Crie relatórios para ver os gráficos.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Gráfico de Evolução (Linha) */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Evolução de Membros e Frequentadores
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="dateShort" 
                            tick={{ fontSize: 12 }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: "hsl(var(--background))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "6px"
                            }}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="membros" 
                            stroke="#7c3aed" 
                            strokeWidth={2}
                            name="Membros"
                            dot={{ r: 4 }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="frequentadores" 
                            stroke="#f59e0b" 
                            strokeWidth={2}
                            name="Frequentadores"
                            dot={{ r: 4 }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="total" 
                            stroke="#10b981" 
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            name="Total"
                            dot={{ r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Gráfico de Comparação (Barras) */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Comparação de Membros e Frequentadores
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="dateShort" 
                            tick={{ fontSize: 12 }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: "hsl(var(--background))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "6px"
                            }}
                          />
                          <Legend />
                          <Bar dataKey="membros" fill="#7c3aed" name="Membros" />
                          <Bar dataKey="frequentadores" fill="#f59e0b" name="Frequentadores" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Resumo Estatístico */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Média de Membros
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {reports.length > 0
                            ? Math.round(
                                reports.reduce((sum, r) => sum + r.membersCount, 0) / reports.length
                              )
                            : 0}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Média de Frequentadores
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {reports.length > 0
                            ? Math.round(
                                reports.reduce((sum, r) => sum + r.frequentadoresCount, 0) / reports.length
                              )
                            : 0}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Média Total
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {reports.length > 0
                            ? Math.round(
                                reports.reduce(
                                  (sum, r) => sum + r.membersCount + r.frequentadoresCount,
                                  0
                                ) / reports.length
                              )
                            : 0}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="tabela">
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
                      {filteredAndSortedReports.map((report) => (
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
                                  <AlertDialog
                                    open={deleteReportId === report.id}
                                    onOpenChange={(open) => {
                                      if (!open) {
                                        setDeleteReportId(null);
                                      } else {
                                        setDeleteReportId(report.id);
                                      }
                                    }}
                                  >
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
            </TabsContent>
          </Tabs>
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

      {/* Seleção de Semana por Mês */}
      <Card>
        <CardHeader>
          <CardTitle>Selecionar Semana</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Seletor de Mês */}
          <div>
            <Label htmlFor="month-select">Mês</Label>
            <Select value={selectedMonthKey} onValueChange={setSelectedMonthKey}>
              <SelectTrigger id="month-select" className="w-full sm:w-[300px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthKeys.map((monthKey) => {
                  const firstWeek = weeksByMonth[monthKey]?.[0];
                  if (!firstWeek) return null;
                  const monthLabel = firstWeek.start.toLocaleDateString("pt-BR", { 
                    month: "long", 
                    year: "numeric" 
                  });
                  return (
                    <SelectItem key={monthKey} value={monthKey}>
                      {monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Semanas do Mês Selecionado */}
          {currentMonthWeeks.length > 0 && (
            <div>
              <Label className="mb-2 block">Semanas disponíveis</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                {currentMonthWeeks.map((week) => (
                  <Button
                    key={week.key}
                    variant={selectedWeekKey === week.key ? "default" : "outline"}
                    onClick={() => setSelectedWeekKey(week.key)}
                    className={`justify-start text-left h-auto py-2.5 px-3 ${
                      week.isCurrent && selectedWeekKey !== week.key 
                        ? "border-2 border-primary" 
                        : ""
                    }`}
                  >
                    <div className="flex flex-col items-start w-full">
                      <span className={`text-sm ${week.isCurrent ? "font-semibold" : ""}`}>
                        {week.label.replace(" (Atual)", "")}
                      </span>
                      {week.isCurrent && (
                        <span className="text-xs text-primary/80 mt-0.5">Semana Atual</span>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gráficos e Lista de Relatórios */}
      <Tabs defaultValue="graficos" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="graficos" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Gráficos
          </TabsTrigger>
          <TabsTrigger value="tabela" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Tabela
          </TabsTrigger>
        </TabsList>

        <TabsContent value="graficos" className="space-y-6">
          {reports.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">
                  Nenhum relatório encontrado para este período. Crie relatórios para ver os gráficos.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Gráfico de Evolução (Linha) */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Evolução de Membros e Frequentadores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="dateShort" 
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "6px"
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="membros" 
                        stroke="#7c3aed" 
                        strokeWidth={2}
                        name="Membros"
                        dot={{ r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="frequentadores" 
                        stroke="#f59e0b" 
                        strokeWidth={2}
                        name="Frequentadores"
                        dot={{ r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="total" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="Total"
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Gráfico de Comparação (Barras) */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Comparação de Membros e Frequentadores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="dateShort" 
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "6px"
                        }}
                      />
                      <Legend />
                      <Bar dataKey="membros" fill="#7c3aed" name="Membros" />
                      <Bar dataKey="frequentadores" fill="#f59e0b" name="Frequentadores" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Resumo Estatístico Detalhado */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Média de Membros
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.avgMembers}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Min: {stats.minMembers} | Max: {stats.maxMembers}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Média de Frequentadores
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.avgFrequentadores}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Min: {stats.minFrequentadores} | Max: {stats.maxFrequentadores}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Média Total
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.avgTotal}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Min: {stats.minTotal} | Max: {stats.maxTotal}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      {stats.growthRate >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      )}
                      Crescimento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${stats.growthRate >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {stats.growthRate >= 0 ? "+" : ""}{stats.growthRate}%
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats.totalReports} relatório(s)
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Estatísticas Adicionais */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total de Membros
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalMembers}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total de Frequentadores
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalFrequentadores}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total de Participantes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalParticipants}</div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="tabela">
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
                      {filteredAndSortedReports.map((report) => (
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
                              <AlertDialog
                                open={deleteReportId === report.id}
                                onOpenChange={(open) => {
                                  if (!open) {
                                    setDeleteReportId(null);
                                  } else {
                                    setDeleteReportId(report.id);
                                  }
                                }}
                              >
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
        </TabsContent>
      </Tabs>

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

