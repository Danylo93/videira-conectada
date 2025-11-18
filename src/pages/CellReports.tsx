import { useState, useEffect, useMemo, useCallback } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Plus,
  Calendar,
  Edit,
  Trash2,
  Download,
  Eye,
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
import { Member, CellReport as CellReportType, Leader } from "@/types/church";
import * as XLSX from "xlsx";
import FancyLoader from "@/components/FancyLoader";

export function CellReports() {
  const { user } = useAuth();
  const { mode } = useProfileMode();
  const { toast } = useToast();
  const isKidsMode = mode === 'kids';

  // ---- state ---------------------------------------------------------------
  const [reports, setReports] = useState<CellReportType[]>([]);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [selectedLeaderId, setSelectedLeaderId] = useState<string>("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingReport, setViewingReport] = useState<CellReportType | null>(null);
  const [deleteReportId, setDeleteReportId] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState("");
  const [multiplicationDate, setMultiplicationDate] = useState("");
  const [observations, setObservations] = useState("");
  const [phase, setPhase] = useState("");
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [selectedVisitorIds, setSelectedVisitorIds] = useState<string[]>([]);
  const [lostMembers, setLostMembers] = useState<Array<{id: string; reason: 'critico' | 'regular' | 'amarelo'}>>([]);
  const [editingReport, setEditingReport] = useState<CellReportType | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [chartMode, setChartMode] = useState<"semanal">("semanal");
  
  // Filtros de mês e ano
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const memberOptions = allMembers.filter((m) => m.type === "member");
  const visitorOptions = allMembers.filter((m) => m.type === "frequentador");

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

  // Recarregar membros quando líder selecionado mudar (para pastor)
  useEffect(() => {
    if (user && user.role === "pastor" && selectedLeaderId) {
      setLoading(true);
      loadMembers().then(() => {
        loadReports();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLeaderId, mode]);

  // Recarregar relatórios quando mês ou ano mudarem
  useEffect(() => {
    if (user && ((user.role === "lider" && allMembers.length > 0) || (user.role === "pastor" && selectedLeaderId && allMembers.length > 0))) {
      setLoading(true);
      loadReports();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear, mode]);

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

    const liderId = user.role === "pastor" ? selectedLeaderId : user.id;
    
    if (user.role === "pastor" && !selectedLeaderId) {
      setReports([]);
      setLoading(false);
      return;
    }

    const membersList = allMembers.length === 0 ? await loadMembers() : allMembers;

    // Criar filtro de data baseado no mês e ano selecionados
    const startDate = new Date(selectedYear, selectedMonth - 1, 1);
    const endDate = new Date(selectedYear, selectedMonth, 0); // Último dia do mês

    const { data, error } = await supabase
      .from("cell_reports")
      .select("*")
      .eq("lider_id", liderId)
      .gte("week_start", startDate.toISOString())
      .lte("week_start", endDate.toISOString())
      .order("week_start", { ascending: false });

    if (error) {
      console.error("Error loading reports:", error);
      // Se não houver relatórios ou erro de permissão, apenas retorna array vazio
      setReports([]);
      setLoading(false);
      return;
    }

    const formattedReports: CellReportType[] = (data || []).map((report) => {
      // Parse lost_members from JSONB
      let lostMembers: Array<{id: string; reason: 'critico' | 'regular' | 'amarelo'}> = [];
      if (report.lost_members) {
        try {
          lostMembers = Array.isArray(report.lost_members) 
            ? report.lost_members 
            : JSON.parse(report.lost_members as string);
        } catch (e) {
          console.error("Error parsing lost_members:", e);
        }
      }
      
      return {
        id: report.id,
        liderId: report.lider_id,
        weekStart: new Date(report.week_start),
        members: membersList.filter((m) => report.members_present?.includes(m.id)),
        frequentadores: membersList.filter((m) =>
          report.visitors_present?.includes(m.id)
        ),
        lostMembers: lostMembers,
        phase:
          (report.phase as
            | "Comunhão"
            | "Edificação"
            | "Evangelismo"
            | "Multiplicação") || "Comunhão",
        multiplicationDate: report.multiplication_date
          ? new Date(report.multiplication_date)
          : undefined,
        observations: report.observations,
        status: report.status as
          | "draft"
          | "submitted"
          | "approved"
          | "needs_correction",
        submittedAt: new Date(report.submitted_at),
      };
    });

    setReports(formattedReports);
    setLoading(false);
  };

  // ---- DERIVED DATA (apenas QUANTIDADE) ------------------------------------

  const monthlyChartData = useMemo(() => {
    const map = reports.reduce((acc, r) => {
      const d = r.weekStart;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!acc[key]) {
        acc[key] = {
          monthKey: key,
          mSum: 0,
          fSum: 0,
          weeks: 0,
        };
      }
      // Filtrar perdidos: não incluir membros/frequentadores que estão na lista de perdidos
      const lostIds = (r.lostMembers || []).map(l => l.id);
      const membersCount = r.members.filter(m => !lostIds.includes(m.id)).length;
      const frequentadoresCount = r.frequentadores.filter(f => !lostIds.includes(f.id)).length;
      
      acc[key].mSum += membersCount;
      acc[key].fSum += frequentadoresCount;
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
        monthLabel: new Date(`${m.monthKey}-01`).toLocaleDateString("pt-BR", {
          month: "short",
          year: "numeric",
        }),
        members: m.weeks > 0 ? Math.round(m.mSum / m.weeks) : 0,
        frequentadores: m.weeks > 0 ? Math.round(m.fSum / m.weeks) : 0,
      }));
  }, [reports]);

  const fmtPtWeekPart = useCallback((d: Date) => {
    const dia = String(d.getDate()).padStart(2, "0");
    const mes = d.toLocaleDateString("pt-BR", { month: "long" });
    const ano2 = String(d.getFullYear()).slice(-2);
    return `${dia}/${mes}/${ano2}`;
  }, []);

  const weekLabel = useCallback(
    (start: Date) => {
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return `${fmtPtWeekPart(start)} - ${fmtPtWeekPart(end)}`;
    },
    [fmtPtWeekPart],
  );

  const weeklyChartData = useMemo(() => {
    const map = reports.reduce((acc, r) => {
      const key = r.weekStart.toISOString().split("T")[0];
      if (!acc[key]) {
        acc[key] = {
          start: r.weekStart,
          mSum: 0,
          fSum: 0,
          count: 0,
        };
      }
      // Filtrar perdidos: não incluir membros/frequentadores que estão na lista de perdidos
      const lostIds = (r.lostMembers || []).map(l => l.id);
      const membersCount = r.members.filter(m => !lostIds.includes(m.id)).length;
      const frequentadoresCount = r.frequentadores.filter(f => !lostIds.includes(f.id)).length;
      
      acc[key].mSum += membersCount;
      acc[key].fSum += frequentadoresCount;
      acc[key].count += 1;
      return acc;
    }, {} as Record<string, { start: Date; mSum: number; fSum: number; count: number }>);

    return Object.values(map)
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .map((w) => ({
        weekLabel: weekLabel(w.start),
        members: w.count > 0 ? Math.round(w.mSum / w.count) : 0,
        frequentadores: w.count > 0 ? Math.round(w.fSum / w.count) : 0,
      }));
  }, [reports, weekLabel]);

  const chartData = chartMode === "mensal" ? monthlyChartData : weeklyChartData;
  const xKey = chartMode === "mensal" ? "monthLabel" : "weekLabel";

  // ---- helpers visualização ------------------------------------------------
  const openViewReport = (report: CellReportType) => {
    setViewingReport(report);
    setIsViewDialogOpen(true);
  };


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
        message="Folheando os diários da sua célula"
        tips={[
          "Contando quantos peixinhos chegaram na última reunião…",
          "Separando pãozinho fresco pros visitantes…",
          "Polindo a armadura da célula pro próximo encontro…",
        ]}
      />
    );
  }

  // ---- actions -------------------------------------------------------------
  const handleCreateReport = async () => {
    if (!user || !selectedWeek) return;

    const liderId = user.role === "pastor" ? selectedLeaderId : user.id;
    
    if (user.role === "pastor" && !selectedLeaderId) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um líder.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("cell_reports").insert([
      {
        lider_id: liderId,
        week_start: selectedWeek,
        multiplication_date: multiplicationDate || null,
        observations: observations || null,
        members_present: selectedMemberIds,
        visitors_present: selectedVisitorIds,
        phase: phase || null,
        lost_members: lostMembers.length > 0 ? lostMembers : null,
      },
    ]);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar o relatório.",
        variant: "destructive",
      });
      return;
    }

    await loadReports();
    setIsCreateDialogOpen(false);
    setSelectedWeek("");
    setMultiplicationDate("");
    setObservations("");
    setPhase("");
    setSelectedMemberIds([]);
    setSelectedVisitorIds([]);
    setLostMembers([]);

    toast({ title: "Sucesso", description: "Relatório criado com sucesso!" });
  };

  const openEditReport = (report: CellReportType) => {
    setEditingReport(report);
    setSelectedWeek(report.weekStart.toISOString().split("T")[0]);
    setMultiplicationDate(
      report.multiplicationDate
        ? report.multiplicationDate.toISOString().split("T")[0]
        : ""
    );
    setObservations(report.observations || "");
    setPhase(report.phase);
    setSelectedMemberIds(report.members.map((m) => m.id));
    setSelectedVisitorIds(report.frequentadores.map((f) => f.id));
    setLostMembers(report.lostMembers || []);
    setIsEditDialogOpen(true);
  };

  const handleUpdateReport = async () => {
    if (!user || !editingReport) return;

    const { error } = await supabase
      .from("cell_reports")
      .update({
        week_start: selectedWeek,
        multiplication_date: multiplicationDate || null,
        observations: observations || null,
        members_present: selectedMemberIds,
        visitors_present: selectedVisitorIds,
        phase: phase || null,
        lost_members: lostMembers.length > 0 ? lostMembers : null,
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

    await loadReports();
    setIsEditDialogOpen(false);
    setEditingReport(null);
    setSelectedWeek("");
    let _ = "";
    setMultiplicationDate(_);
    setObservations(_);
    setPhase(_);
    setSelectedMemberIds([]);
    setSelectedVisitorIds([]);
    setLostMembers([]);

    toast({ title: "Sucesso", description: "Relatório atualizado com sucesso!" });
  };

  const handleDeleteReport = async () => {
    if (!deleteReportId) return;
    
    const { error } = await supabase.from("cell_reports").delete().eq("id", deleteReportId);
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
    toast({ title: "Sucesso", description: "Relatório excluído com sucesso!" });
    setDeleteReportId(null);
  };

  const handleExportReport = (report: CellReportType) => {
    const data = [
      {
        Semana: report.weekStart.toLocaleDateString("pt-BR"),
        Fase: report.phase,
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
      `relatorio-${report.weekStart.toISOString().split("T")[0]}.xlsx`
    );
  };

  const handleShareReport = (report: CellReportType) => {
    const message = `Relatório ${report.weekStart.toLocaleDateString("pt-BR")}
Fase: ${report.phase}
Membros: ${report.members.map((m) => m.name).join(", ")}
Frequentadores: ${report.frequentadores.map((f) => f.name).join(", ")}
Observações: ${report.observations || ""}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(
      message
    )}`;
    window.open(url, "_blank");
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
      <Tabs defaultValue="create" className="space-y-6 sm:space-y-8 animate-fade-in pb-16">
        <TabsList className="sticky top-0 z-10 mx-auto w-full sm:w-auto overflow-auto rounded-xl">
          <TabsTrigger value="create">Criar Relatório</TabsTrigger>
          <TabsTrigger value="view">Ver Relatórios</TabsTrigger>
        </TabsList>

        {/* Aba de Criar Relatório */}
        <TabsContent value="create" className="space-y-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Criar Relatório de Célula
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
              <DialogTitle>Criar Novo Relatório</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="week">Semana</Label>
                <Input
                  id="week"
                  type="date"
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="multiplication">
                  Data de Multiplicação (opcional)
                </Label>
                <Input
                  id="multiplication"
                  type="date"
                  value={multiplicationDate}
                  onChange={(e) => setMultiplicationDate(e.target.value)}
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
                <Label>Perdidos</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Selecione membros ou frequentadores que estão perdidos e o motivo
                </p>
                <div className="border rounded p-3 space-y-3">
                  {/* Membros Perdidos */}
                  <div>
                    <p className="text-sm font-medium mb-2">Membros</p>
                    <div className="space-y-2">
                      {memberOptions.map((m) => {
                        const isLost = lostMembers.find(l => l.id === m.id);
                        return (
                          <div key={m.id} className="flex items-center gap-2">
                            <Checkbox
                              id={`lost-member-${m.id}`}
                              checked={!!isLost}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setLostMembers([...lostMembers, { id: m.id, reason: 'amarelo' }]);
                                } else {
                                  setLostMembers(lostMembers.filter(l => l.id !== m.id));
                                }
                              }}
                            />
                            <label htmlFor={`lost-member-${m.id}`} className="text-sm flex-1">
                              {m.name}
                            </label>
                            {isLost && (
                              <Select
                                value={isLost.reason}
                                onValueChange={(value: 'critico' | 'regular' | 'amarelo') => {
                                  setLostMembers(lostMembers.map(l => 
                                    l.id === m.id ? { ...l, reason: value } : l
                                  ));
                                }}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="critico">
                                    <span className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                      Crítico
                                    </span>
                                  </SelectItem>
                                  <SelectItem value="regular">
                                    <span className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                      Regular
                                    </span>
                                  </SelectItem>
                                  <SelectItem value="amarelo">
                                    <span className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                      Amarelo
                                    </span>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Frequentadores Perdidos */}
                  <div>
                    <p className="text-sm font-medium mb-2">Frequentadores</p>
                    <div className="space-y-2">
                      {visitorOptions.map((v) => {
                        const isLost = lostMembers.find(l => l.id === v.id);
                        return (
                          <div key={v.id} className="flex items-center gap-2">
                            <Checkbox
                              id={`lost-visitor-${v.id}`}
                              checked={!!isLost}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setLostMembers([...lostMembers, { id: v.id, reason: 'amarelo' }]);
                                } else {
                                  setLostMembers(lostMembers.filter(l => l.id !== v.id));
                                }
                              }}
                            />
                            <label htmlFor={`lost-visitor-${v.id}`} className="text-sm flex-1">
                              {v.name}
                            </label>
                            {isLost && (
                              <Select
                                value={isLost.reason}
                                onValueChange={(value: 'critico' | 'regular' | 'amarelo') => {
                                  setLostMembers(lostMembers.map(l => 
                                    l.id === v.id ? { ...l, reason: value } : l
                                  ));
                                }}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="critico">
                                    <span className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                      Crítico
                                    </span>
                                  </SelectItem>
                                  <SelectItem value="regular">
                                    <span className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                      Regular
                                    </span>
                                  </SelectItem>
                                  <SelectItem value="amarelo">
                                    <span className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                      Amarelo
                                    </span>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {lostMembers.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs font-medium mb-2">Legenda:</p>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-red-500"></span>
                          <span>Crítico - Sem possibilidade de voltar</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                          <span>Regular - Deu migué (pode voltar)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                          <span>Amarelo - Só parou de vir (ir atrás)</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <Label>Fase da Célula</Label>
                <Select value={phase} onValueChange={setPhase}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a fase" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Comunhão">Comunhão</SelectItem>
                    <SelectItem value="Edificação">Edificação</SelectItem>
                    <SelectItem value="Evangelismo">Evangelismo</SelectItem>
                    <SelectItem value="Multiplicação">Multiplicação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="observations">Observações</Label>
                <Textarea
                  id="observations"
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Observações sobre a semana..."
                  rows={3}
                />
              </div>
              <Button onClick={handleCreateReport} className="w-full gradient-primary">
                Criar Relatório
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ======= Editar Relatório ======= */}
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
                <Label htmlFor="edit-week">Semana</Label>
                <Input
                  id="edit-week"
                  type="date"
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="edit-multiplication">Data de Multiplicação (opcional)</Label>
                <Input
                  id="edit-multiplication"
                  type="date"
                  value={multiplicationDate}
                  onChange={(e) => setMultiplicationDate(e.target.value)}
                />
              </div>
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
              <div>
                <Label>Fase da Célula</Label>
                <Select value={phase} onValueChange={setPhase}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a fase" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Comunhão">Comunhão</SelectItem>
                    <SelectItem value="Edificação">Edificação</SelectItem>
                    <SelectItem value="Evangelismo">Evangelismo</SelectItem>
                    <SelectItem value="Multiplicação">Multiplicação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-observations">Observações</Label>
                <Textarea
                  id="edit-observations"
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Observações sobre a semana..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button className="gradient-primary" onClick={handleUpdateReport}>
                  Salvar alterações
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* ======= Visualizar Relatório ======= */}
        <Dialog
          open={isViewDialogOpen}
          onOpenChange={(open) => {
            setIsViewDialogOpen(open);
            if (!open) setViewingReport(null);
          }}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Resumo do Relatório</DialogTitle>
            </DialogHeader>
            {viewingReport && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Semana</p>
                    <p className="font-medium">{viewingReport.weekStart.toLocaleDateString("pt-BR")}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Fase</p>
                    <p className="font-medium">{viewingReport.phase}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Data de Multiplicação</p>
                    <p className="font-medium">
                      {viewingReport.multiplicationDate
                        ? viewingReport.multiplicationDate.toLocaleDateString("pt-BR")
                        : "-"}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Membros presentes ({viewingReport.members.length})</p>
                  {viewingReport.members.length > 0 ? (
                    <p className="text-sm leading-relaxed">
                      {viewingReport.members.map((m) => m.name).join(", ")}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhum membro presente.</p>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Frequentadores presentes ({viewingReport.frequentadores.length})</p>
                  {viewingReport.frequentadores.length > 0 ? (
                    <p className="text-sm leading-relaxed">
                      {viewingReport.frequentadores.map((f) => f.name).join(", ")}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhum frequentador presente.</p>
                  )}
                </div>
                {viewingReport.lostMembers && viewingReport.lostMembers.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Perdidos ({viewingReport.lostMembers.length})</p>
                    <div className="space-y-2">
                      {viewingReport.lostMembers.map((lost) => {
                        const member = [...viewingReport.members, ...viewingReport.frequentadores].find(m => m.id === lost.id);
                        if (!member) return null;
                        const reasonColors = {
                          critico: 'bg-red-500',
                          regular: 'bg-orange-500',
                          amarelo: 'bg-yellow-500'
                        };
                        const reasonLabels = {
                          critico: 'Crítico - Sem possibilidade de voltar',
                          regular: 'Regular - Deu migué (pode voltar)',
                          amarelo: 'Amarelo - Só parou de vir (ir atrás)'
                        };
                        return (
                          <div key={lost.id} className="flex items-center gap-2 p-2 bg-muted rounded">
                            <span className={`w-3 h-3 rounded-full ${reasonColors[lost.reason]}`}></span>
                            <span className="text-sm font-medium flex-1">{member.name}</span>
                            <span className="text-xs text-muted-foreground">{reasonLabels[lost.reason]}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Observações</p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {viewingReport.observations || "—"}
                  </p>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                    Fechar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        </div>
        </TabsContent>

        {/* Aba de Ver Relatórios */}
        <TabsContent value="view" className="space-y-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Relatórios de Célula
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

          <Card>
            <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <CardTitle className="text-xl">
                Presença na Célula (membros e frequentadores)
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
                <FileText className="w-5 h-5 text-primary" />
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
                      <TableHead className="min-w-[140px]">Semana</TableHead>
                      <TableHead className="min-w-[140px]">Fase</TableHead>
                      <TableHead className="min-w-[200px]">Data de Multiplicação</TableHead>
                      <TableHead className="min-w-[260px] text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">
                          {report.weekStart.toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>{report.phase}</TableCell>
                        <TableCell>
                          {report.multiplicationDate ? (
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="w-3 h-3" />
                              {report.multiplicationDate.toLocaleDateString("pt-BR")}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openViewReport(report)}
                              aria-label="Visualizar relatório"
                              title="Visualizar"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openEditReport(report)}
                              aria-label="Editar relatório"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <AlertDialog open={deleteReportId === report.id} onOpenChange={(open) => !open && setDeleteReportId(null)}>
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
                                    Tem certeza que deseja excluir o relatório da semana de {report.weekStart.toLocaleDateString("pt-BR")}? Esta ação não pode ser desfeita.
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
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Diálogos também disponíveis na aba de Ver Relatórios */}
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
                  <Label htmlFor="edit-week-view">Semana</Label>
                  <Input
                    id="edit-week-view"
                    type="date"
                    value={selectedWeek}
                    onChange={(e) => setSelectedWeek(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-multiplication-view">Data de Multiplicação (opcional)</Label>
                  <Input
                    id="edit-multiplication-view"
                    type="date"
                    value={multiplicationDate}
                    onChange={(e) => setMultiplicationDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Membros Presentes</Label>
                  <div className="border rounded p-2 max-h-40 overflow-y-auto space-y-2">
                    {memberOptions.map((m) => (
                      <div key={m.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-member-view-${m.id}`}
                          checked={selectedMemberIds.includes(m.id)}
                          onCheckedChange={(checked) =>
                            setSelectedMemberIds(
                              checked
                                ? [...selectedMemberIds, m.id]
                                : selectedMemberIds.filter((id) => id !== m.id)
                            )
                          }
                        />
                        <label htmlFor={`edit-member-view-${m.id}`} className="text-sm">
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
                          id={`edit-visitor-view-${v.id}`}
                          checked={selectedVisitorIds.includes(v.id)}
                          onCheckedChange={(checked) =>
                            setSelectedVisitorIds(
                              checked
                                ? [...selectedVisitorIds, v.id]
                                : selectedVisitorIds.filter((id) => id !== v.id)
                            )
                          }
                        />
                        <label htmlFor={`edit-visitor-view-${v.id}`} className="text-sm">
                          {v.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Fase da Célula</Label>
                  <Select value={phase} onValueChange={setPhase}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a fase" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Comunhão">Comunhão</SelectItem>
                      <SelectItem value="Edificação">Edificação</SelectItem>
                      <SelectItem value="Evangelismo">Evangelismo</SelectItem>
                      <SelectItem value="Multiplicação">Multiplicação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-observations-view">Observações</Label>
                  <Textarea
                    id="edit-observations-view"
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    placeholder="Observações sobre a semana..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button className="gradient-primary" onClick={handleUpdateReport}>
                    Salvar alterações
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog
            open={isViewDialogOpen}
            onOpenChange={(open) => {
              setIsViewDialogOpen(open);
              if (!open) setViewingReport(null);
            }}
          >
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Resumo do Relatório</DialogTitle>
              </DialogHeader>
              {viewingReport && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Semana</p>
                      <p className="font-medium">{viewingReport.weekStart.toLocaleDateString("pt-BR")}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Fase</p>
                      <p className="font-medium">{viewingReport.phase}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Data de Multiplicação</p>
                      <p className="font-medium">
                        {viewingReport.multiplicationDate
                          ? viewingReport.multiplicationDate.toLocaleDateString("pt-BR")
                          : "-"}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Membros presentes ({viewingReport.members.length})</p>
                    {viewingReport.members.length > 0 ? (
                      <p className="text-sm leading-relaxed">
                        {viewingReport.members.map((m) => m.name).join(", ")}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhum membro presente.</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Frequentadores presentes ({viewingReport.frequentadores.length})</p>
                    {viewingReport.frequentadores.length > 0 ? (
                      <p className="text-sm leading-relaxed">
                        {viewingReport.frequentadores.map((f) => f.name).join(", ")}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhum frequentador presente.</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Observações</p>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {viewingReport.observations || "—"}
                    </p>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                      Fechar
                    </Button>
                  </div>
                </div>
              )}
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
            Relatórios de Célula
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
              <DialogTitle>Criar Novo Relatório</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="week">Semana</Label>
                <Input
                  id="week"
                  type="date"
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="multiplication">
                  Data de Multiplicação (opcional)
                </Label>
                <Input
                  id="multiplication"
                  type="date"
                  value={multiplicationDate}
                  onChange={(e) => setMultiplicationDate(e.target.value)}
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
                <Label>Fase da Célula</Label>
                <Select value={phase} onValueChange={setPhase}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a fase" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Comunhão">Comunhão</SelectItem>
                    <SelectItem value="Edificação">Edificação</SelectItem>
                    <SelectItem value="Evangelismo">Evangelismo</SelectItem>
                    <SelectItem value="Multiplicação">Multiplicação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="observations">Observações</Label>
                <Textarea
                  id="observations"
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Observações sobre a semana..."
                  rows={3}
                />
              </div>
              <Button onClick={handleCreateReport} className="w-full gradient-primary">
                Criar Relatório
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ======= Editar Relatório ======= */}
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
                <Label htmlFor="edit-week">Semana</Label>
                <Input
                  id="edit-week"
                  type="date"
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="edit-multiplication">Data de Multiplicação (opcional)</Label>
                <Input
                  id="edit-multiplication"
                  type="date"
                  value={multiplicationDate}
                  onChange={(e) => setMultiplicationDate(e.target.value)}
                />
              </div>

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

              <div>
                <Label>Perdidos</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Selecione membros ou frequentadores que estão perdidos e o motivo
                </p>
                <div className="border rounded p-3 space-y-3">
                  {/* Membros Perdidos */}
                  <div>
                    <p className="text-sm font-medium mb-2">Membros</p>
                    <div className="space-y-2">
                      {memberOptions.map((m) => {
                        const isLost = lostMembers.find(l => l.id === m.id);
                        return (
                          <div key={m.id} className="flex items-center gap-2">
                            <Checkbox
                              id={`edit-lost-member-${m.id}`}
                              checked={!!isLost}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setLostMembers([...lostMembers, { id: m.id, reason: 'amarelo' }]);
                                } else {
                                  setLostMembers(lostMembers.filter(l => l.id !== m.id));
                                }
                              }}
                            />
                            <label htmlFor={`edit-lost-member-${m.id}`} className="text-sm flex-1">
                              {m.name}
                            </label>
                            {isLost && (
                              <Select
                                value={isLost.reason}
                                onValueChange={(value: 'critico' | 'regular' | 'amarelo') => {
                                  setLostMembers(lostMembers.map(l => 
                                    l.id === m.id ? { ...l, reason: value } : l
                                  ));
                                }}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="critico">
                                    <span className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                      Crítico
                                    </span>
                                  </SelectItem>
                                  <SelectItem value="regular">
                                    <span className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                      Regular
                                    </span>
                                  </SelectItem>
                                  <SelectItem value="amarelo">
                                    <span className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                      Amarelo
                                    </span>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Frequentadores Perdidos */}
                  <div>
                    <p className="text-sm font-medium mb-2">Frequentadores</p>
                    <div className="space-y-2">
                      {visitorOptions.map((v) => {
                        const isLost = lostMembers.find(l => l.id === v.id);
                        return (
                          <div key={v.id} className="flex items-center gap-2">
                            <Checkbox
                              id={`edit-lost-visitor-${v.id}`}
                              checked={!!isLost}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setLostMembers([...lostMembers, { id: v.id, reason: 'amarelo' }]);
                                } else {
                                  setLostMembers(lostMembers.filter(l => l.id !== v.id));
                                }
                              }}
                            />
                            <label htmlFor={`edit-lost-visitor-${v.id}`} className="text-sm flex-1">
                              {v.name}
                            </label>
                            {isLost && (
                              <Select
                                value={isLost.reason}
                                onValueChange={(value: 'critico' | 'regular' | 'amarelo') => {
                                  setLostMembers(lostMembers.map(l => 
                                    l.id === v.id ? { ...l, reason: value } : l
                                  ));
                                }}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="critico">
                                    <span className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                      Crítico
                                    </span>
                                  </SelectItem>
                                  <SelectItem value="regular">
                                    <span className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                      Regular
                                    </span>
                                  </SelectItem>
                                  <SelectItem value="amarelo">
                                    <span className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                      Amarelo
                                    </span>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {lostMembers.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs font-medium mb-2">Legenda:</p>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-red-500"></span>
                          <span>Crítico - Sem possibilidade de voltar</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                          <span>Regular - Deu migué (pode voltar)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                          <span>Amarelo - Só parou de vir (ir atrás)</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label>Fase da Célula</Label>
                <Select value={phase} onValueChange={setPhase}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a fase" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Comunhão">Comunhão</SelectItem>
                    <SelectItem value="Edificação">Edificação</SelectItem>
                    <SelectItem value="Evangelismo">Evangelismo</SelectItem>
                    <SelectItem value="Multiplicação">Multiplicação</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-observations">Observações</Label>
                <Textarea
                  id="edit-observations"
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Observações sobre a semana..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button className="gradient-primary" onClick={handleUpdateReport}>
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

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <CardTitle className="text-xl">
            Presença na Célula (membros e frequentadores)
          </CardTitle>
{/* 
          <Select value={chartMode} onValueChange={(v) => setChartMode(v as 'mensal' | 'semanal')}>
            <SelectTrigger className="w-full md:w-[160px]">
              <SelectValue placeholder="Mensal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mensal">Mensal</SelectItem>
              <SelectItem value="semanal">Semanal</SelectItem>
            </SelectContent>
          </Select> */}
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
            <FileText className="w-5 h-5 text-primary" />
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
                  <TableHead className="min-w-[140px]">Semana</TableHead>
                  <TableHead className="min-w-[140px]">Fase</TableHead>
                  <TableHead className="min-w-[200px]">Data de Multiplicação</TableHead>
                  <TableHead className="min-w-[260px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">
                      {report.weekStart.toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>{report.phase}</TableCell>
                    <TableCell>
                      {report.multiplicationDate ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="w-3 h-3" />
                          {report.multiplicationDate.toLocaleDateString("pt-BR")}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {/* NOVO: Visualizar */}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openViewReport(report)}
                          aria-label="Visualizar relatório"
                          title="Visualizar"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEditReport(report)}
                          aria-label="Editar relatório"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog open={deleteReportId === report.id} onOpenChange={(open) => !open && setDeleteReportId(null)}>
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
                                Tem certeza que deseja excluir o relatório da semana de {report.weekStart.toLocaleDateString("pt-BR")}? Esta ação não pode ser desfeita.
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
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ======= Visualizar Relatório (NOVO) ======= */}
      <Dialog
        open={isViewDialogOpen}
        onOpenChange={(open) => {
          setIsViewDialogOpen(open);
          if (!open) setViewingReport(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Resumo do Relatório</DialogTitle>
          </DialogHeader>

          {viewingReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Semana</p>
                  <p className="font-medium">{viewingReport.weekStart.toLocaleDateString("pt-BR")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Fase</p>
                  <p className="font-medium">{viewingReport.phase}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Data de Multiplicação</p>
                  <p className="font-medium">
                    {viewingReport.multiplicationDate
                      ? viewingReport.multiplicationDate.toLocaleDateString("pt-BR")
                      : "-"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Membros presentes ({viewingReport.members.length})</p>
                {viewingReport.members.length > 0 ? (
                  <p className="text-sm leading-relaxed">
                    {viewingReport.members.map((m) => m.name).join(", ")}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum membro presente.</p>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Frequentadores presentes ({viewingReport.frequentadores.length})</p>
                {viewingReport.frequentadores.length > 0 ? (
                  <p className="text-sm leading-relaxed">
                    {viewingReport.frequentadores.map((f) => f.name).join(", ")}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum frequentador presente.</p>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Observações</p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {viewingReport.observations || "—"}
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
