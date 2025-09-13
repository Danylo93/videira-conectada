import { useState, useEffect, useMemo } from "react";
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
import { Member, CellReport as CellReportType } from "@/types/church";
import * as XLSX from "xlsx";

export function CellReports() {
  const { user } = useAuth();
  const { toast } = useToast();

  // ---- state ---------------------------------------------------------------
  const [reports, setReports] = useState<CellReportType[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
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
  const [chartMode, setChartMode] = useState<"mensal" | "semanal">("mensal");

  const memberOptions = allMembers.filter((m) => m.type === "member");
  const visitorOptions = allMembers.filter((m) => m.type === "frequentador");

  // ---- data load -----------------------------------------------------------
  useEffect(() => {
    if (user && user.role === "lider") {
      loadMembers().then(loadReports);
    } else {
      // caso não tenha user ainda, mantenha a tela em loading curto
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadMembers = async (): Promise<Member[]> => {
    if (!user) return [];

    const { data, error } = await supabase
      .from("members")
      .select("*")
      .eq("lider_id", user.id)
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

    // garante consistência entre lista de membros e reports
    const membersList = allMembers.length === 0 ? await loadMembers() : allMembers;

    const { data, error } = await supabase
      .from("cell_reports")
      .select("*")
      .eq("lider_id", user.id)
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
      status: report.status as "draft" | "submitted" | "approved",
      submittedAt: new Date(report.submitted_at),
    }));

    setReports(formattedReports);
    setLoading(false);
  };

  // ---- DERIVED DATA (hooks SEMPRE antes de qualquer return condicional) ----
  // agrega por mês (YYYY-MM) somando presenças das semanas do mês
  const monthlyChartData = useMemo(() => {
    const map = reports.reduce((acc, r) => {
      const d = r.weekStart;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      if (!acc[key]) {
        acc[key] = { monthKey: key, members: 0, frequentadores: 0, weeks: 0 };
      }
      acc[key].members += r.members.length;
      acc[key].frequentadores += r.frequentadores.length;
      acc[key].weeks += 1;
      return acc;
    }, {} as Record<string, { monthKey: string; members: number; frequentadores: number; weeks: number }>);

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
        members: m.members, // ou média: Math.round(m.members / m.weeks)
        frequentadores: m.frequentadores, // ou média: Math.round(m.frequentadores / m.weeks)
      }));
  }, [reports]);

  // "10/agosto/25"
  const fmtPtWeekPart = (d: Date) => {
    const dia = String(d.getDate()).padStart(2, "0");
    const mes = d.toLocaleDateString("pt-BR", { month: "long" });
    const ano2 = String(d.getFullYear()).slice(-2);
    return `${dia}/${mes}/${ano2}`;
  };

  const weekLabel = (start: Date) => {
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${fmtPtWeekPart(start)} - ${fmtPtWeekPart(end)}`;
  };

  // dados semanais (um ponto por relatório)
  const weeklyChartData = useMemo(() => {
    return reports
      .slice()
      .sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime())
      .map((r) => ({
        weekLabel: weekLabel(r.weekStart),
        members: r.members.length,
        frequentadores: r.frequentadores.length,
      }));
  }, [reports]);

  const chartData = chartMode === "mensal" ? monthlyChartData : weeklyChartData;
  const xKey = chartMode === "mensal" ? "monthLabel" : "weekLabel";

  // ---- returns condicionais (depois dos hooks) -----------------------------
  if (!user || user.role !== "lider") {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Acesso restrito para líderes de célula.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // ---- actions -------------------------------------------------------------
  const handleCreateReport = async () => {
    if (!user || !selectedWeek) return;

    const { error } = await supabase.from("cell_reports").insert([
      {
        lider_id: user.id,
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
    setMultiplicationDate("");
    setObservations("");
    setPhase("");
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
        Membros: report.members.map((m) => m.name).join(", "),
        Frequentadores: report.frequentadores.map((f) => f.name).join(", "),
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
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Relatórios de Célula
          </h1>
          <p className="text-muted-foreground">{user.celula}</p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Novo Relatório
            </Button>
          </DialogTrigger>
          <DialogContent>
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
  <DialogContent>
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            Presença {chartMode === "mensal" ? "Mensal" : "Semanal"}
          </CardTitle>

          <Select value={chartMode} onValueChange={(v) => setChartMode(v as 'mensal' | 'semanal')}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Mensal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mensal">Mensal</SelectItem>
              <SelectItem value="semanal">Semanal</SelectItem>
            </SelectContent>
          </Select>
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
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="members"
                  name="Membros"
                  stroke="#8884d8"
                  isAnimationActive
                />
                <Line
                  type="monotone"
                  dataKey="frequentadores"
                  name="Frequentadores"
                  stroke="#82ca9d"
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
        <CardContent>
          {reports.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum relatório criado ainda.</p>
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
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">
                      {report.weekStart.toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          report.status === "approved" ? "default" : "secondary"
                        }
                      >
                        {report.status === "draft"
                          ? "Rascunho"
                          : report.status === "submitted"
                          ? "Enviado"
                          : "Aprovado"}
                      </Badge>
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
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEditReport(report)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteReport(report.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleExportReport(report)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleShareReport(report)}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
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
