import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfileMode } from "@/contexts/ProfileModeContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Plus,
  Send,
  Calendar,
  Edit,
  Trash2,
  Download,
  Church,
  Users,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useToast } from "@/hooks/use-toast";
import { Member, ServiceAttendanceReport as ServiceReportType, Leader } from "@/types/church";
import * as XLSX from "xlsx";
import FancyLoader from "@/components/FancyLoader";
import { formatDateBR, formatDateBRLong } from "@/lib/dateUtils";

export function ServiceReports() {
  const { user } = useAuth();
  const { mode } = useProfileMode();
  const { toast } = useToast();
  const isKidsMode = mode === 'kids';

  // ---- state ---------------------------------------------------------------
  const [reports, setReports] = useState<ServiceReportType[]>([]);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [selectedLeaderId, setSelectedLeaderId] = useState<string>("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteReportId, setDeleteReportId] = useState<string | null>(null);
  const [serviceDate, setServiceDate] = useState("");
  const [observations, setObservations] = useState("");
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [selectedVisitorIds, setSelectedVisitorIds] = useState<string[]>([]);
  const [editingReport, setEditingReport] = useState<ServiceReportType | null>(null);
  const [loading, setLoading] = useState(true);
  // Para modo normal: apenas quantidade
  const [totalAttendance, setTotalAttendance] = useState<number>(0);
  
  // Filtros de mês e ano
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const memberOptions = allMembers.filter((m) => m.type === "member");
  const visitorOptions = allMembers.filter((m) => m.type === "frequentador");

  // Helper para converter string de data (YYYY-MM-DD) para Date no timezone local
  const parseLocalDate = (dateString: string): Date => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Helper para converter Date para string no formato YYYY-MM-DD (timezone local)
  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

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
    } else if (user.role === "lider") {
      loadMembers().then(() => {
        loadReports();
      });
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, mode]);

  // Recarregar membros quando líder selecionado mudar (para pastor no modo Kids)
  useEffect(() => {
    if (user && user.role === "pastor" && isKidsMode && selectedLeaderId) {
      setLoading(true);
      loadMembers().then(() => {
        loadReports();
      });
    } else if (user && user.role === "pastor" && !isKidsMode) {
      // No modo normal, carregar relatórios do próprio pastor
      setLoading(true);
      loadReports();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLeaderId, isKidsMode]);

  // Recarregar relatórios quando mês ou ano mudarem
  useEffect(() => {
    if (user && (
      (user.role === "lider" && allMembers.length > 0) || 
      (user.role === "pastor" && isKidsMode && selectedLeaderId && allMembers.length > 0) ||
      (user.role === "pastor" && !isKidsMode)
    )) {
      setLoading(true);
      loadReports();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear, isKidsMode]);

  const loadMembers = async (): Promise<Member[]> => {
    if (!user) return [];

    const liderId = user.role === "pastor" ? selectedLeaderId : user.id;
    
    if (user.role === "pastor" && !selectedLeaderId) {
      setAllMembers([]);
      return [];
    }

    const { data, error } = await supabase
      .from("members")
      .select("*")
      .eq("lider_id", liderId)
      .eq("active", true);

    if (error) {
      console.error("Error loading members:", error);
      return [];
    }

    const formatted: Member[] = (data || []).map((member) => ({
      id: member.id,
      name: member.name,
      phone: member.phone,
      email: member.email,
      type: member.type as "member" | "frequentador",
      liderId: member.lider_id,
      joinDate: new Date(member.join_date),
      lastPresence: member.last_presence
        ? new Date(member.last_presence)
        : undefined,
      active: member.active,
    }));

    setAllMembers(formatted);
    return formatted;
  };

  const loadReports = async () => {
    if (!user) return;

    let liderId: string;
    if (user.role === "pastor") {
      if (isKidsMode) {
        // Modo Kids: precisa selecionar líder
        if (!selectedLeaderId) {
          setReports([]);
          setLoading(false);
          return;
        }
        liderId = selectedLeaderId;
      } else {
        // Modo Normal: usar o próprio pastor
        liderId = user.id;
      }
    } else {
      liderId = user.id;
    }

    // No modo normal (pastor), não precisa carregar membros
    let membersList: Member[] = [];
    if (isKidsMode || user.role === "lider") {
      membersList = allMembers.length === 0 ? await loadMembers() : allMembers;
    }

    // Criar filtro de data baseado no mês e ano selecionados
    const startDate = new Date(selectedYear, selectedMonth - 1, 1);
    const endDate = new Date(selectedYear, selectedMonth, 0); // Último dia do mês

    const { data, error } = await (supabase as any)
      .from("service_attendance_reports")
      .select("*")
      .eq("lider_id", liderId)
      .gte("service_date", startDate.toISOString().split("T")[0])
      .lte("service_date", endDate.toISOString().split("T")[0])
      .order("service_date", { ascending: false });

    if (error) {
      console.error("Error loading reports:", error);
      // Se a tabela não existir ainda ou erro de permissão, apenas retorna array vazio
      if (error.code === "42P01" || error.message.includes("does not exist") || error.code === "PGRST116") {
        setReports([]);
        setLoading(false);
        return;
      }
      setReports([]);
      setLoading(false);
      return;
    }

    const formattedReports: ServiceReportType[] = (data || []).map((report) => {
      // No modo normal (pastor), usar total_attendance se disponível
      if (!isKidsMode && user.role === "pastor" && report.total_attendance) {
        const total = report.total_attendance;
        return {
          id: report.id,
          liderId: report.lider_id,
          serviceDate: parseLocalDate(report.service_date),
          members: Array(total).fill(null).map((_, i) => ({
            id: `total_${i}`,
            name: '',
            phone: '',
            email: '',
            type: 'member' as const,
            liderId: report.lider_id,
            joinDate: new Date(),
            active: true,
          })),
          frequentadores: [],
          observations: report.observations,
          status: report.status as
            | "draft"
            | "submitted"
            | "approved"
            | "needs_correction",
          submittedAt: new Date(report.submitted_at),
          totalAttendance: total,
        };
      }
      
      // Modo Kids ou Líder: usar membros reais
      return {
        id: report.id,
        liderId: report.lider_id,
        serviceDate: parseLocalDate(report.service_date),
        members: membersList.filter((m) => report.members_present?.includes(m.id)),
        frequentadores: membersList.filter((m) =>
          report.visitors_present?.includes(m.id)
        ),
        observations: report.observations,
        status: report.status as
          | "draft"
          | "submitted"
          | "approved"
          | "needs_correction",
        submittedAt: new Date(report.submitted_at),
        totalAttendance: report.total_attendance || undefined,
      };
    });

    setReports(formattedReports);
    setLoading(false);
  };

  // ---- DERIVED DATA (apenas QUANTIDADE) ------------------------------------

  const monthlyChartData = useMemo(() => {
    if (!isKidsMode && user?.role === "pastor") {
      // Modo Normal: mostrar dados por data individual (não agrupar por mês)
      return reports
        .sort((a, b) => a.serviceDate.getTime() - b.serviceDate.getTime())
        .map((r) => {
          const total = r.members.length + r.frequentadores.length;
          return {
            monthLabel: formatDateBR(r.serviceDate),
            members: 0,
            frequentadores: 0,
            total: total,
          };
        });
    }

    // Modo Kids: agrupar por mês e calcular média
    const map = reports.reduce((acc, r) => {
      const d = r.serviceDate;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!acc[key]) {
        acc[key] = {
          monthKey: key,
          mSum: 0,
          fSum: 0,
          weeks: 0,
        };
      }
      acc[key].mSum += r.members.length;
      acc[key].fSum += r.frequentadores.length;
      acc[key].weeks += 1;
      return acc;
    }, {} as Record<string, { monthKey: string; mSum: number; fSum: number; weeks: number }>);

    return Object.values(map)
      .sort(
        (a, b) =>
          new Date(`${a.monthKey}-01`).getTime() -
          new Date(`${b.monthKey}-01`).getTime()
      )
      .map((m) => ({
        monthLabel: formatDateBRLong(new Date(`${m.monthKey}-01`)).split(" ")[2] + " " + formatDateBRLong(new Date(`${m.monthKey}-01`)).split(" ")[4],
        members: m.weeks > 0 ? Math.round(m.mSum / m.weeks) : 0,
        frequentadores: m.weeks > 0 ? Math.round(m.fSum / m.weeks) : 0,
        total: m.weeks > 0 ? Math.round((m.mSum + m.fSum) / m.weeks) : 0,
      }));
  }, [reports, isKidsMode, user?.role]);

  const chartData = monthlyChartData;
  const xKey = "monthLabel";



  // ---- returns condicionais ------------------------------------------------
  if (!user || (user.role !== "lider" && user.role !== "pastor")) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Acesso restrito para líderes de célula e pastores.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <FancyLoader
        message="Organizando a presença no culto"
        tips={[
          "Contando quantos irmãos vieram adorar…",
          "Separando os membros dos visitantes…",
          "Preparando o relatório de presença…",
        ]}
      />
    );
  }

  // ---- actions -------------------------------------------------------------
  const handleCreateReport = async () => {
    if (!user || !serviceDate) return;

    // No modo normal (pastor), usar o próprio pastor como lider_id e apenas quantidade
    let liderId: string;
    let membersPresent: string[] = [];
    let visitorsPresent: string[] = [];
    
    if (user.role === "pastor") {
      if (isKidsMode) {
        // Modo Kids: precisa selecionar líder
        if (!selectedLeaderId) {
          toast({
            title: "Erro",
            description: "Por favor, selecione um líder.",
            variant: "destructive",
          });
          return;
        }
        liderId = selectedLeaderId;
        membersPresent = selectedMemberIds;
        visitorsPresent = selectedVisitorIds;
      } else {
        // Modo Normal: usar o próprio pastor e quantidade total
        liderId = user.id;
        // No modo normal, deixar arrays vazios e usar total_attendance
        membersPresent = [];
        visitorsPresent = [];
      }
    } else {
      // Líder: usar o próprio ID
      liderId = user.id;
      membersPresent = selectedMemberIds;
      visitorsPresent = selectedVisitorIds;
    }

    const insertData: any = {
      lider_id: liderId,
      service_date: serviceDate,
      observations: observations || null,
      status: "draft",
      members_present: membersPresent,
      visitors_present: visitorsPresent,
    };

    // No modo normal (pastor), adicionar total_attendance
    if (user.role === "pastor" && !isKidsMode) {
      insertData.total_attendance = totalAttendance;
    }

    const { error } = await (supabase as any).from("service_attendance_reports").insert([insertData]);

    if (error) {
      console.error("Error creating service report:", error);
      toast({
        title: "Erro",
        description: error.message.includes("does not exist") 
          ? "A tabela de relatórios de culto ainda não foi criada. Execute a migração do banco de dados."
          : "Não foi possível criar o relatório.",
        variant: "destructive",
      });
      return;
    }

    await loadReports();
    setIsCreateDialogOpen(false);
    setServiceDate("");
    setObservations("");
    setSelectedMemberIds([]);
    setSelectedVisitorIds([]);
    setTotalAttendance(0);

    toast({ title: "Sucesso", description: "Relatório criado com sucesso!" });
  };

  const openEditReport = (report: ServiceReportType) => {
    setEditingReport(report);
    setServiceDate(formatDateForInput(report.serviceDate));
    setObservations(report.observations || "");
    
    // No modo normal (pastor), calcular quantidade total
    if (!isKidsMode && user?.role === "pastor") {
      // Se o relatório tem total_attendance, usar ele; senão, calcular
      const total = report.totalAttendance || (report.members.length + report.frequentadores.length);
      setTotalAttendance(total);
      setSelectedMemberIds([]);
      setSelectedVisitorIds([]);
    } else {
      // Modo Kids ou Líder: usar membros reais
      setSelectedMemberIds(report.members.map((m) => m.id));
      setSelectedVisitorIds(report.frequentadores.map((f) => f.id));
      setTotalAttendance(0);
    }
    
    setIsEditDialogOpen(true);
  };

  const handleUpdateReport = async () => {
    if (!user || !editingReport) {
      console.error("handleUpdateReport: user ou editingReport não definido", { user, editingReport });
      return;
    }

    console.log("handleUpdateReport iniciado", {
      serviceDate,
      totalAttendance,
      isKidsMode,
      userRole: user.role,
      editingReportId: editingReport.id,
    });

    // Validação: data é obrigatória
    if (!serviceDate) {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma data.",
        variant: "destructive",
      });
      return;
    }

    // Validação: no modo normal (pastor), quantidade deve ser maior que 0
    if (!isKidsMode && user.role === "pastor" && (!totalAttendance || totalAttendance === 0)) {
      toast({
        title: "Erro",
        description: "Por favor, informe a quantidade de pessoas.",
        variant: "destructive",
      });
      return;
    }

    let membersPresent: string[] = selectedMemberIds;
    let visitorsPresent: string[] = selectedVisitorIds;
    
    const updateData: any = {
      service_date: serviceDate,
      observations: observations || null,
      members_present: membersPresent,
      visitors_present: visitorsPresent,
    };

    // No modo normal (pastor), usar quantidade total
    if (!isKidsMode && user.role === "pastor") {
      updateData.members_present = [];
      updateData.visitors_present = [];
      updateData.total_attendance = totalAttendance;
    }

    console.log("Dados para atualização:", updateData);

    // Usar uma query mais explícita para evitar problemas de tipo
    const { error, data } = await (supabase as any)
      .from("service_attendance_reports")
      .update(updateData)
      .eq("id", editingReport.id)
      .select();

    if (error) {
      console.error("Erro ao atualizar relatório:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o relatório.",
        variant: "destructive",
      });
      return;
    }

    console.log("Relatório atualizado com sucesso:", data);

    await loadReports();
    setIsEditDialogOpen(false);
    setEditingReport(null);
    setServiceDate("");
    setObservations("");
    setSelectedMemberIds([]);
    setSelectedVisitorIds([]);
    setTotalAttendance(0);

    toast({ title: "Sucesso", description: "Relatório atualizado com sucesso!" });
  };

  const handleDeleteReport = async () => {
    if (!deleteReportId) return;

    const { error } = await (supabase as any).from("service_attendance_reports").delete().eq("id", deleteReportId);
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
    setDeleteReportId(null);
    toast({ title: "Sucesso", description: "Relatório excluído com sucesso!" });
  };

  const handleExportReport = (report: ServiceReportType) => {
    const data = [
      {
        [isKidsMode ? "Data do Domingo Kids" : "Data do Culto"]: formatDateBR(report.serviceDate),
        "Membros (qtde)": report.members.map((m) => m.name).join(", "),
        "Frequentadores (qtde)": report.frequentadores.map((f) => f.name).join(", "),
        Observacoes: report.observations || "",
      },
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Relatório");
    XLSX.writeFile(
      wb,
      `relatorio-culto-${report.serviceDate.toISOString().split("T")[0]}.xlsx`
    );
  };

  const handleShareReport = (report: ServiceReportType) => {
    const message = `${isKidsMode ? 'Relatório de Domingo Kids' : 'Relatório de Presença no Culto'} ${formatDateBR(report.serviceDate)}
Membros: ${report.members.map((m) => m.name).join(", ")}
Frequentadores: ${report.frequentadores.map((f) => f.name).join(", ")}
Observações: ${report.observations || ""}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
    if (report.status === "draft") {
      (supabase as any)
        .from("service_attendance_reports")
        .update({ status: "submitted" })
        .eq("id", report.id)
        .then(() => {
          setReports((prev) =>
            prev.map((r) =>
              r.id === report.id ? { ...r, status: "submitted" } : r
            )
          );
        });
    }
  };

  // ---- UI ------------------------------------------------------------------
  const selectedLeader = user.role === "pastor" ? leaders.find((l) => l.id === selectedLeaderId) : null;
  const cellName = user.role === "pastor"
    ? selectedLeader
      ? `Célula de ${selectedLeader.name}`
      : "Selecione um líder"
    : user.celula;

  // Se for pastor, usar abas
  if (user.role === "pastor") {
    return (
      <Tabs defaultValue="view" className="space-y-6 sm:space-y-8 animate-fade-in pb-16">
        <TabsList className="sticky top-0 z-10 mx-auto w-full sm:w-auto overflow-auto rounded-xl">
          <TabsTrigger value="view">
            {isKidsMode ? 'Ver Relatórios Domingo Kids' : 'Ver Relatórios'}
          </TabsTrigger>
          <TabsTrigger value="create">
            {isKidsMode ? 'Criar Relatório Domingo Kids' : 'Criar Relatório'}
          </TabsTrigger>
        </TabsList>

        {/* Aba de Ver Relatórios */}
        <TabsContent value="view" className="space-y-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                {isKidsMode ? 'Relatórios de Domingo Kids' : 'Relatórios de Presença no Culto'}
              </h1>
              {isKidsMode && (
                <div className="mt-2">
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
                </div>
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
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => {
                        // Não permitir mês futuro se o ano for o atual
                        const isCurrentYear = selectedYear === currentDate.getFullYear();
                        const isFutureMonth = isCurrentYear && month > currentDate.getMonth() + 1;
                        return (
                          <SelectItem 
                            key={month} 
                            value={month.toString()}
                            disabled={isFutureMonth}
                          >
                            {month === 1 && 'Janeiro'}
                            {month === 2 && 'Fevereiro'}
                            {month === 3 && 'Março'}
                            {month === 4 && 'Abril'}
                            {month === 5 && 'Maio'}
                            {month === 6 && 'Junho'}
                            {month === 7 && 'Julho'}
                            {month === 8 && 'Agosto'}
                            {month === 9 && 'Setembro'}
                            {month === 10 && 'Outubro'}
                            {month === 11 && 'Novembro'}
                            {month === 12 && 'Dezembro'}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label htmlFor="year">Ano</Label>
                  <Select value={selectedYear.toString()} onValueChange={(value) => {
                    const newYear = parseInt(value);
                    setSelectedYear(newYear);
                    // Se selecionar o ano atual, ajustar o mês se necessário
                    if (newYear === currentDate.getFullYear() && selectedMonth > currentDate.getMonth() + 1) {
                      setSelectedMonth(currentDate.getMonth() + 1);
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o ano" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 5 }, (_, i) => {
                        const year = currentDate.getFullYear() - 2 + i;
                        const isFutureYear = year > currentDate.getFullYear();
                        return (
                          <SelectItem 
                            key={year} 
                            value={year.toString()}
                            disabled={isFutureYear}
                          >
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

          <Card className={isKidsMode ? '' : 'border-2 hover:shadow-lg transition-smooth'}>
            <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <CardTitle className={`text-xl flex items-center gap-2 ${isKidsMode ? '' : 'text-2xl'}`}>
                {isKidsMode ? (
                  'Presença no Culto (membros e frequentadores)'
                ) : (
                  <>
                    <BarChart3 className="w-6 h-6 text-primary" />
                    Presença Mensal no Culto
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <div className="text-center py-12">
                  <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground text-lg">
                    Nenhum dado disponível para o período selecionado.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={isKidsMode ? 300 : 400}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey={xKey}
                      interval={0}
                      height={60}
                      angle={-15}
                      tick={{ fontSize: 12 }}
                      stroke="#6b7280"
                    />
                    <YAxis allowDecimals={false} stroke="#6b7280" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }} 
                    />
                    <Legend />
                    {isKidsMode ? (
                      <>
                        <Line
                          type="monotone"
                          dataKey="members"
                          name="Membros (qtde)"
                          stroke="#7c3aed"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          isAnimationActive
                        />
                        <Line
                          type="monotone"
                          dataKey="frequentadores"
                          name="Frequentadores (qtde)"
                          stroke="#16a34a"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          isAnimationActive
                        />
                      </>
                    ) : (
                      <Line
                        type="monotone"
                        dataKey="total"
                        name="Quantidade Total"
                        stroke="#7c3aed"
                        strokeWidth={4}
                        dot={{ r: 8, fill: '#7c3aed' }}
                        activeDot={{ r: 10 }}
                        isAnimationActive
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className={isKidsMode ? '' : 'border-2'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Church className="w-6 h-6 text-primary" />
                {isKidsMode ? 'Histórico de Relatórios' : 'Relatórios Registrados'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reports.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground text-lg">
                    Nenhum relatório criado ainda.
                  </p>
                </div>
              ) : isKidsMode ? (
                <div className="overflow-x-auto">
                  <Table className="min-w-[820px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[140px]">Data do Domingo Kids</TableHead>
                        <TableHead className="min-w-[170px]">Data de Envio</TableHead>
                        <TableHead className="min-w-[260px] text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell className="font-medium">
                            {formatDateBR(report.serviceDate)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="w-3 h-3" />
                              {formatDateBR(report.submittedAt)}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => openEditReport(report)}
                                aria-label="Editar relatório"
                                title="Editar"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => setDeleteReportId(report.id)}
                                    aria-label="Excluir relatório"
                                    title="Excluir"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir o relatório de {report.serviceDate.toLocaleDateString("pt-BR")}? Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setDeleteReportId(null)}>
                                      Cancelar
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={handleDeleteReport}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleExportReport(report)}
                                aria-label="Exportar relatório"
                                title="Exportar"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleShareReport(report)}
                                aria-label="Compartilhar relatório"
                                title="Compartilhar"
                              >
                                <Send className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reports.map((report) => {
                    const totalPeople = report.members.length + report.frequentadores.length;
                    return (
                      <Card key={report.id} className="hover:shadow-lg transition-smooth border-2">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-5 h-5 text-primary" />
                              <CardTitle className="text-lg">
                                {formatDateBR(report.serviceDate)}
                              </CardTitle>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg">
                            <div className="text-center">
                              <div className="flex items-center gap-2 mb-1">
                                <Users className="w-6 h-6 text-primary" />
                                <span className="text-3xl font-bold text-primary">
                                  {totalPeople}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">pessoas presentes</p>
                            </div>
                          </div>
                          {report.observations && (
                            <div className="text-sm text-muted-foreground line-clamp-2">
                              {report.observations}
                            </div>
                          )}
                          <div className="flex items-center justify-between pt-2 border-t">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              {formatDateBR(report.submittedAt)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => openEditReport(report)}
                                title="Editar"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() => setDeleteReportId(report.id)}
                                    title="Excluir"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir o relatório de {report.serviceDate.toLocaleDateString("pt-BR")}? Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setDeleteReportId(null)}>
                                      Cancelar
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={handleDeleteReport}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Criar Relatório */}
        <TabsContent value="create" className="space-y-10">
          {isKidsMode ? (
            // Modo Kids: interface original
            <>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                    Criar Relatório de Domingo Kids
                  </h1>
                  <div className="mt-2">
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
                      <DialogTitle>Criar Novo Relatório de Domingo Kids</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="service-date">Data do Domingo Kids</Label>
                        <Input
                          id="service-date"
                          type="date"
                          value={serviceDate}
                          onChange={(e) => setServiceDate(e.target.value)}
                          max={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div>
                        <Label>Membros Presentes</Label>
                        <div className="border rounded p-2 max-h-40 overflow-y-auto space-y-2">
                          {memberOptions.map((m) => (
                            <div key={m.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`member-${m.id}`}
                                checked={selectedMemberIds.includes(m.id)}
                                onCheckedChange={(checked) =>
                                  setSelectedMemberIds(
                                    checked
                                      ? [...selectedMemberIds, m.id]
                                      : selectedMemberIds.filter((id) => id !== m.id)
                                  )
                                }
                              />
                              <label htmlFor={`member-${m.id}`} className="text-sm">
                                {m.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label>Frequentadores Presentes</Label>
                        <div className="border rounded p-2 max-h-40 overflow-y-auto space-y-2">
                          {visitorOptions.map((v) => (
                            <div key={v.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`visitor-${v.id}`}
                                checked={selectedVisitorIds.includes(v.id)}
                                onCheckedChange={(checked) =>
                                  setSelectedVisitorIds(
                                    checked
                                      ? [...selectedVisitorIds, v.id]
                                      : selectedVisitorIds.filter((id) => id !== v.id)
                                  )
                                }
                              />
                              <label htmlFor={`visitor-${v.id}`} className="text-sm">
                                {v.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="observations">Observações</Label>
                        <Textarea
                          id="observations"
                          value={observations}
                          onChange={(e) => setObservations(e.target.value)}
                          placeholder="Observações sobre o domingo kids..."
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
            </>
          ) : (
            // Modo Normal: interface moderna e simplificada
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  Relatório de Presença no Culto
                </h1>
                <p className="text-muted-foreground">
                  Registre a quantidade de pessoas presentes em cada culto
                </p>
              </div>

              <Card className="border-2 hover:shadow-lg transition-smooth">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Church className="w-6 h-6 text-primary" />
                    Novo Relatório
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="service-date" className="text-base font-semibold">
                        Data do Culto
                      </Label>
                      <Input
                        id="service-date"
                        type="date"
                        value={serviceDate}
                        onChange={(e) => setServiceDate(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        className="h-12 text-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="total-attendance" className="text-base font-semibold">
                        Quantidade de Pessoas
                      </Label>
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="total-attendance"
                          type="number"
                          min="0"
                          value={totalAttendance || ''}
                          onChange={(e) => setTotalAttendance(parseInt(e.target.value) || 0)}
                          placeholder="Digite a quantidade"
                          className="h-12 text-lg pl-10"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="observations" className="text-base font-semibold">
                      Observações (opcional)
                    </Label>
                    <Textarea
                      id="observations"
                      value={observations}
                      onChange={(e) => setObservations(e.target.value)}
                      placeholder="Adicione observações sobre o culto..."
                      rows={3}
                      className="text-base"
                    />
                  </div>
                  <Button 
                    onClick={handleCreateReport} 
                    className="w-full gradient-primary h-12 text-lg font-semibold"
                    disabled={!serviceDate || totalAttendance === 0}
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Criar Relatório
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Diálogos de Editar e Visualizar */}
          <Dialog
              open={isEditDialogOpen}
              onOpenChange={(open) => {
                setIsEditDialogOpen(open);
                if (!open) setEditingReport(null);
              }}
            >
              <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Editar Relatório</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-service-date">
                      {isKidsMode ? 'Data do Domingo Kids' : 'Data do Culto'}
                    </Label>
                    <Input
                      id="edit-service-date"
                      type="date"
                      value={serviceDate}
                      onChange={(e) => setServiceDate(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  {isKidsMode ? (
                    <>
                      <div>
                        <Label>Membros Presentes</Label>
                        <div className="border rounded p-2 max-h-40 overflow-y-auto space-y-2">
                          {memberOptions.map((m) => (
                            <div key={m.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`edit-member-${m.id}`}
                                checked={selectedMemberIds.includes(m.id)}
                                onCheckedChange={(checked) =>
                                  setSelectedMemberIds(
                                    checked
                                      ? [...selectedMemberIds, m.id]
                                      : selectedMemberIds.filter((id) => id !== m.id)
                                  )
                                }
                              />
                              <label htmlFor={`edit-member-${m.id}`} className="text-sm">
                                {m.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label>Frequentadores Presentes</Label>
                        <div className="border rounded p-2 max-h-40 overflow-y-auto space-y-2">
                          {visitorOptions.map((v) => (
                            <div key={v.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`edit-visitor-${v.id}`}
                                checked={selectedVisitorIds.includes(v.id)}
                                onCheckedChange={(checked) =>
                                  setSelectedVisitorIds(
                                    checked
                                      ? [...selectedVisitorIds, v.id]
                                      : selectedVisitorIds.filter((id) => id !== v.id)
                                  )
                                }
                              />
                              <label htmlFor={`edit-visitor-${v.id}`} className="text-sm">
                                {v.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div>
                      <Label htmlFor="edit-total-attendance" className="text-base font-semibold">
                        Quantidade de Pessoas
                      </Label>
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="edit-total-attendance"
                          type="number"
                          min="0"
                          value={totalAttendance || ''}
                          onChange={(e) => setTotalAttendance(parseInt(e.target.value) || 0)}
                          placeholder="Digite a quantidade total de pessoas"
                          className="h-12 text-lg pl-10"
                        />
                      </div>
                    </div>
                  )}
                  <div>
                    <Label htmlFor="edit-observations" className={isKidsMode ? '' : 'text-base font-semibold'}>
                      Observações
                    </Label>
                    <Textarea
                      id="edit-observations"
                      value={observations}
                      onChange={(e) => setObservations(e.target.value)}
                      placeholder={isKidsMode ? "Observações sobre o domingo kids..." : "Observações sobre o culto..."}
                      rows={3}
                      className={isKidsMode ? '' : 'text-base'}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button 
                      className="gradient-primary" 
                      onClick={handleUpdateReport}
                      disabled={!serviceDate || (!isKidsMode && user?.role === "pastor" && (!totalAttendance || totalAttendance === 0))}
                    >
                      Salvar alterações
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

        </TabsContent>
      </Tabs>
    );
  }

  // Código original para líderes
  return (
    <div className="space-y-10 animate-fade-in pb-16">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {isKidsMode ? 'Relatórios de Domingo Kids' : 'Relatórios de Presença no Culto'}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">{cellName}</p>
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
              <DialogTitle>
                {isKidsMode ? 'Criar Novo Relatório de Domingo Kids' : 'Criar Novo Relatório de Presença no Culto'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="service-date">
                  {isKidsMode ? 'Data do Domingo Kids' : 'Data do Culto'}
                </Label>
                <Input
                  id="service-date"
                  type="date"
                  value={serviceDate}
                  onChange={(e) => setServiceDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <Label>Membros Presentes</Label>
                <div className="border rounded p-2 max-h-40 overflow-y-auto space-y-2">
                  {memberOptions.map((m) => (
                    <div key={m.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`member-${m.id}`}
                        checked={selectedMemberIds.includes(m.id)}
                        onCheckedChange={(checked) =>
                          setSelectedMemberIds(
                            checked
                              ? [...selectedMemberIds, m.id]
                              : selectedMemberIds.filter((id) => id !== m.id)
                          )
                        }
                      />
                      <label htmlFor={`member-${m.id}`} className="text-sm">
                        {m.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label>Frequentadores Presentes</Label>
                <div className="border rounded p-2 max-h-40 overflow-y-auto space-y-2">
                  {visitorOptions.map((v) => (
                    <div key={v.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`visitor-${v.id}`}
                        checked={selectedVisitorIds.includes(v.id)}
                        onCheckedChange={(checked) =>
                          setSelectedVisitorIds(
                            checked
                              ? [...selectedVisitorIds, v.id]
                              : selectedVisitorIds.filter((id) => id !== v.id)
                          )
                        }
                      />
                      <label htmlFor={`visitor-${v.id}`} className="text-sm">
                        {v.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="observations">Observações</Label>
                <Textarea
                  id="observations"
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder={isKidsMode ? "Observações sobre o domingo kids..." : "Observações sobre o culto..."}
                  rows={3}
                />
              </div>
              <Button onClick={handleCreateReport} className="w-full gradient-primary">
                Criar Relatório
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Diálogos de Editar e Visualizar */}
        <Dialog
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) setEditingReport(null);
          }}
        >
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Relatório</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-service-date">
                  {isKidsMode ? 'Data do Domingo Kids' : 'Data do Culto'}
                </Label>
                <Input
                  id="edit-service-date"
                  type="date"
                  value={serviceDate}
                  onChange={(e) => setServiceDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              {isKidsMode ? (
                <>
                  <div>
                    <Label>Membros Presentes</Label>
                    <div className="border rounded p-2 max-h-40 overflow-y-auto space-y-2">
                      {memberOptions.map((m) => (
                        <div key={m.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`edit-member-${m.id}`}
                            checked={selectedMemberIds.includes(m.id)}
                            onCheckedChange={(checked) =>
                              setSelectedMemberIds(
                                checked
                                  ? [...selectedMemberIds, m.id]
                                  : selectedMemberIds.filter((id) => id !== m.id)
                              )
                            }
                          />
                          <label htmlFor={`edit-member-${m.id}`} className="text-sm">
                            {m.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Frequentadores Presentes</Label>
                    <div className="border rounded p-2 max-h-40 overflow-y-auto space-y-2">
                      {visitorOptions.map((v) => (
                        <div key={v.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`edit-visitor-${v.id}`}
                            checked={selectedVisitorIds.includes(v.id)}
                            onCheckedChange={(checked) =>
                              setSelectedVisitorIds(
                                checked
                                  ? [...selectedVisitorIds, v.id]
                                  : selectedVisitorIds.filter((id) => id !== v.id)
                              )
                            }
                          />
                          <label htmlFor={`edit-visitor-${v.id}`} className="text-sm">
                            {v.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <Label htmlFor="edit-total-attendance" className="text-base font-semibold">
                    Quantidade de Pessoas
                  </Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="edit-total-attendance"
                      type="number"
                      min="0"
                      value={totalAttendance || ''}
                      onChange={(e) => setTotalAttendance(parseInt(e.target.value) || 0)}
                      placeholder="Digite a quantidade total de pessoas"
                      className="h-12 text-lg pl-10"
                    />
                  </div>
                </div>
              )}
              <div>
                <Label htmlFor="edit-observations" className={isKidsMode ? '' : 'text-base font-semibold'}>
                  Observações
                </Label>
                <Textarea
                  id="edit-observations"
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder={isKidsMode ? "Observações sobre o domingo kids..." : "Observações sobre o culto..."}
                  rows={3}
                  className={isKidsMode ? '' : 'text-base'}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  className="gradient-primary" 
                  onClick={handleUpdateReport}
                  disabled={!serviceDate || (!isKidsMode && user?.role === "pastor" && totalAttendance === 0)}
                >
                  Salvar alterações
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => {
                    // Não permitir mês futuro se o ano for o atual
                    const isCurrentYear = selectedYear === currentDate.getFullYear();
                    const isFutureMonth = isCurrentYear && month > currentDate.getMonth() + 1;
                    return (
                      <SelectItem 
                        key={month} 
                        value={month.toString()}
                        disabled={isFutureMonth}
                      >
                        {month === 1 && 'Janeiro'}
                        {month === 2 && 'Fevereiro'}
                        {month === 3 && 'Março'}
                        {month === 4 && 'Abril'}
                        {month === 5 && 'Maio'}
                        {month === 6 && 'Junho'}
                        {month === 7 && 'Julho'}
                        {month === 8 && 'Agosto'}
                        {month === 9 && 'Setembro'}
                        {month === 10 && 'Outubro'}
                        {month === 11 && 'Novembro'}
                        {month === 12 && 'Dezembro'}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label htmlFor="year">Ano</Label>
              <Select value={selectedYear.toString()} onValueChange={(value) => {
                const newYear = parseInt(value);
                setSelectedYear(newYear);
                // Se selecionar o ano atual, ajustar o mês se necessário
                if (newYear === currentDate.getFullYear() && selectedMonth > currentDate.getMonth() + 1) {
                  setSelectedMonth(currentDate.getMonth() + 1);
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o ano" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = currentDate.getFullYear() - 2 + i;
                    const isFutureYear = year > currentDate.getFullYear();
                    return (
                      <SelectItem 
                        key={year} 
                        value={year.toString()}
                        disabled={isFutureYear}
                      >
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

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <CardTitle className="text-xl">
            Presença no Culto (membros e frequentadores)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="text-center text-muted-foreground">
              Nenhum dado disponível.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey={xKey}
                  interval={0}
                  height={60}
                  angle={-15}
                  tick={{ fontSize: 12 }}
                />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="members"
                  name="Membros (qtde)"
                  stroke="#7c3aed"
                  isAnimationActive
                />
                <Line
                  type="monotone"
                  dataKey="frequentadores"
                  name="Frequentadores (qtde)"
                  stroke="#16a34a"
                  isAnimationActive
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Church className="w-5 h-5 text-primary" />
            Histórico de Relatórios
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {reports.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum relatório criado ainda.</p>
            </div>
          ) : (
            <Table className="min-w-[820px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[140px]">Data do Culto</TableHead>
                  <TableHead className="min-w-[170px]">Data de Envio</TableHead>
                  <TableHead className="min-w-[260px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">
                      {report.serviceDate.toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="w-3 h-3" />
                        {report.submittedAt.toLocaleDateString("pt-BR")}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openEditReport(report)}
                              aria-label="Editar relatório"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setDeleteReportId(report.id)}
                              aria-label="Excluir relatório"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o relatório de {report.serviceDate.toLocaleDateString("pt-BR")}? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setDeleteReportId(null)}>
                                Cancelar
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleDeleteReport}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleExportReport(report)}
                          aria-label="Exportar relatório"
                          title="Exportar"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleShareReport(report)}
                          aria-label="Compartilhar relatório"
                          title="Compartilhar"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

