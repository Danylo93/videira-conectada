import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
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
import {
  FileText,
  Plus,
  Send,
  Calendar,
  Edit,
  Trash2,
  Download,
  Eye, // <-- NOVO
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
  const { toast } = useToast();

  // ---- state ---------------------------------------------------------------
  const [reports, setReports] = useState<CellReportType[]>([]);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [selectedLeaderId, setSelectedLeaderId] = useState<string>("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false); // <-- NOVO
  const [viewingReport, setViewingReport] = useState<CellReportType | null>(null); // <-- NOVO
  const [selectedWeek, setSelectedWeek] = useState("");
  const [multiplicationDate, setMultiplicationDate] = useState("");
  const [observations, setObservations] = useState("");
  const [phase, setPhase] = useState("");
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [selectedVisitorIds, setSelectedVisitorIds] = useState<string[]>([]);
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

    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, email, celula")
      .eq("role", "lider")
      .eq("pastor_uuid", user.id)
      .order("name");

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
  }, [user]);

  // ---- data load -----------------------------------------------------------
  useEffect(() => {
    if (user && user.role === "pastor") {
      void loadLeaders();
    } else if (user && user.role === "lider") {
      loadMembers().then(loadReports);
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loadLeaders]);

  // Recarregar membros quando líder selecionado mudar (para pastor)
  useEffect(() => {
    if (user && user.role === "pastor" && selectedLeaderId) {
      loadMembers().then(loadReports);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLeaderId]);

  // Recarregar relatórios quando mês ou ano mudarem
  useEffect(() => {
    if (user && ((user.role === "lider" && allMembers.length > 0) || (user.role === "pastor" && selectedLeaderId && allMembers.length > 0))) {
      loadReports();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear, selectedLeaderId]);

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
      setLoading(false);
      return;
    }

    const formattedReports: CellReportType[] = (data || []).map((report) => ({
      id: report.id,
      liderId: report.lider_id,
      weekStart: new Date(report.week_start),
      members: membersList.filter((m) => report.members_present?.includes(m.id)),
      frequentadores: membersList.filter((m) =>
        report.visitors_present?.includes(m.id)
      ),
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
    }));

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
      acc[key].mSum += r.members.length;
      acc[key].fSum += r.frequentadores.length;
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

  const StatusBadge = ({ status }: { status: CellReportType["status"] }) => (
    <Badge
      variant={
        status === "approved"
          ? "default"
          : status === "needs_correction"
          ? "destructive"
          : "secondary"
      }
    >
      {status === "draft"
        ? "Rascunho"
        : status === "submitted"
        ? "Enviado"
        : status === "needs_correction"
        ? "Correção"
        : "Aprovado"}
    </Badge>
  );

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
        status: "draft",
        members_present: selectedMemberIds,
        visitors_present: selectedVisitorIds,
        phase: phase || null,
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

    toast({ title: "Sucesso", description: "Relatório atualizado com sucesso!" });
  };

  const handleDeleteReport = async (id: string) => {
    const { error } = await supabase.from("cell_reports").delete().eq("id", id);
    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o relatório.",
        variant: "destructive",
      });
      return;
    }

    await loadReports();
    toast({ title: "Sucesso", description: "Relatório excluído com sucesso!" });
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
    if (report.status === "draft") {
      supabase
        .from("cell_reports")
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

  return (
    <div className="space-y-10 animate-fade-in pb-16">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {user.role === "pastor" ? "Criar Relatórios de Célula" : "Relatórios de Célula"}
          </h1>
          {user.role === "pastor" ? (
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
          ) : (
            <p className="text-sm md:text-base text-muted-foreground">{cellName}</p>
          )}
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary" disabled={user.role === "pastor" && !selectedLeaderId}>
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
                  <TableHead className="min-w-[130px]">Status</TableHead>
                  <TableHead className="min-w-[140px]">Fase</TableHead>
                  <TableHead className="min-w-[200px]">Data de Multiplicação</TableHead>
                  <TableHead className="min-w-[170px]">Data de Envio</TableHead>
                  <TableHead className="min-w-[260px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">
                      {report.weekStart.toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={report.status} />
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
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="w-3 h-3" />
                        {report.submittedAt.toLocaleDateString("pt-BR")}
                      </div>
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
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteReport(report.id)}
                          aria-label="Excluir relatório"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
                  <p className="text-xs text-muted-foreground">Status</p>
                  <div className="mt-1"><StatusBadge status={viewingReport.status} /></div>
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
                <div>
                  <p className="text-xs text-muted-foreground">Enviado em</p>
                  <p className="font-medium">
                    {viewingReport.submittedAt.toLocaleDateString("pt-BR")}
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
