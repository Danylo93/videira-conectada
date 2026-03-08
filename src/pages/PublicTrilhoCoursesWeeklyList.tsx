import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatDateBR } from "@/lib/dateUtils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  Loader2,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

type TrilhoNome = "ceifeiros" | "ctl";
type TurmaDia = "domingo" | "terca";

interface PublicCourseStudent {
  id: string;
  trilho_nome: TrilhoNome;
  turma_dia: TurmaDia;
  nome_completo: string;
  created_at: string;
}

interface PublicCourseWeeklyList {
  id: string;
  trilho_nome: TrilhoNome;
  turma_dia: TurmaDia;
  list_date: string;
  created_at: string;
}

const TRILHO_OPTIONS: Array<{ value: TrilhoNome; label: string }> = [
  { value: "ceifeiros", label: "Ceifeiros" },
  { value: "ctl", label: "CTL" },
];

const TURMA_OPTIONS: Array<{ value: TurmaDia; label: string }> = [
  { value: "domingo", label: "Domingo" },
  { value: "terca", label: "Terça" },
];

const getTrilhoLabel = (trilho: TrilhoNome) =>
  TRILHO_OPTIONS.find((item) => item.value === trilho)?.label || trilho;

const getTurmaLabel = (turma: TurmaDia) =>
  TURMA_OPTIONS.find((item) => item.value === turma)?.label || turma;

const formatDateForInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getCurrentClassDate = (turma: TurmaDia) => {
  const targetDay = turma === "domingo" ? 0 : 2;
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + (targetDay - date.getDay()));
  return formatDateForInput(date);
};

const getSupabaseErrorMessage = (
  error: any,
  fallbackMessage: string,
  duplicateMessage?: string
) => {
  const code = String(error?.code || "");
  const message = String(error?.message || "");

  if (code === "42P01" || message.toLowerCase().includes("does not exist")) {
    return "As tabelas públicas desta página ainda não existem no banco. Aplique a migration mais recente do Supabase.";
  }

  if (code === "42501" || message.toLowerCase().includes("row-level security")) {
    return "O banco bloqueou a operação. As policies públicas da nova funcionalidade ainda não foram aplicadas.";
  }

  if (code === "23505" && duplicateMessage) {
    return duplicateMessage;
  }

  return message || fallbackMessage;
};

export function PublicTrilhoCoursesWeeklyList() {
  const { toast } = useToast();
  const [selectedTrilho, setSelectedTrilho] = useState<TrilhoNome>("ceifeiros");
  const [selectedTurma, setSelectedTurma] = useState<TurmaDia>("domingo");
  const [selectedDate, setSelectedDate] = useState<string>(() => getCurrentClassDate("domingo"));
  const [students, setStudents] = useState<PublicCourseStudent[]>([]);
  const [recentLists, setRecentLists] = useState<PublicCourseWeeklyList[]>([]);
  const [currentList, setCurrentList] = useState<PublicCourseWeeklyList | null>(null);
  const [attendanceByStudent, setAttendanceByStudent] = useState<Record<string, boolean>>({});
  const [attendanceForm, setAttendanceForm] = useState<Record<string, boolean>>({});
  const [newStudentName, setNewStudentName] = useState("");
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [savingStudent, setSavingStudent] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [creatingList, setCreatingList] = useState(false);
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);

  const attendanceStats = useMemo(() => {
    const total = students.length;
    const present = students.filter((student) => attendanceForm[student.id]).length;
    return {
      total,
      present,
      absent: Math.max(total - present, 0),
    };
  }, [students, attendanceForm]);

  const selectedDateLabel = useMemo(() => {
    try {
      return format(parseISO(selectedDate), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  const syncAttendanceForm = (
    nextStudents: PublicCourseStudent[],
    nextAttendanceByStudent: Record<string, boolean>
  ) => {
    const nextForm: Record<string, boolean> = {};
    nextStudents.forEach((student) => {
      nextForm[student.id] = nextAttendanceByStudent[student.id] ?? false;
    });
    setAttendanceForm(nextForm);
  };

  const loadStudentsAndLists = async () => {
    try {
      setLoading(true);

      const [{ data: studentsData, error: studentsError }, { data: listsData, error: listsError }] =
        await Promise.all([
          (supabase as any)
            .from("public_course_students")
            .select("*")
            .eq("trilho_nome", selectedTrilho)
            .eq("turma_dia", selectedTurma)
            .order("nome_completo"),
          (supabase as any)
            .from("public_course_weekly_lists")
            .select("*")
            .eq("trilho_nome", selectedTrilho)
            .eq("turma_dia", selectedTurma)
            .order("list_date", { ascending: false })
            .limit(8),
        ]);

      if (studentsError) throw studentsError;
      if (listsError) throw listsError;

      const nextStudents = (studentsData || []) as PublicCourseStudent[];
      setStudents(nextStudents);
      setRecentLists((listsData || []) as PublicCourseWeeklyList[]);
      syncAttendanceForm(nextStudents, attendanceByStudent);
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro",
        description: getSupabaseErrorMessage(
          error,
          "Não foi possível carregar os alunos e listas semanais."
        ),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSelectedList = async () => {
    try {
      setListLoading(true);

      const { data: listData, error: listError } = await (supabase as any)
        .from("public_course_weekly_lists")
        .select("*")
        .eq("trilho_nome", selectedTrilho)
        .eq("turma_dia", selectedTurma)
        .eq("list_date", selectedDate)
        .maybeSingle();

      if (listError) throw listError;

      const nextList = (listData as PublicCourseWeeklyList | null) || null;
      setCurrentList(nextList);

      if (!nextList) {
        setAttendanceByStudent({});
        syncAttendanceForm(students, {});
        return;
      }

      const { data: attendanceData, error: attendanceError } = await (supabase as any)
        .from("public_course_attendance")
        .select("student_id, presente")
        .eq("weekly_list_id", nextList.id);

      if (attendanceError) throw attendanceError;

      const nextAttendanceByStudent = (attendanceData || []).reduce(
        (acc: Record<string, boolean>, entry: any) => {
          acc[entry.student_id] = !!entry.presente;
          return acc;
        },
        {}
      );

      setAttendanceByStudent(nextAttendanceByStudent);
      syncAttendanceForm(students, nextAttendanceByStudent);
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro",
        description: getSupabaseErrorMessage(
          error,
          "Não foi possível carregar a lista da semana selecionada."
        ),
        variant: "destructive",
      });
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    loadStudentsAndLists();
  }, [selectedTrilho, selectedTurma]);

  useEffect(() => {
    loadSelectedList();
  }, [selectedTrilho, selectedTurma, selectedDate]);

  useEffect(() => {
    syncAttendanceForm(students, attendanceByStudent);
  }, [students, attendanceByStudent]);

  const createOrLoadWeeklyList = async () => {
    try {
      setCreatingList(true);

      const { data: existingList, error: existingError } = await (supabase as any)
        .from("public_course_weekly_lists")
        .select("*")
        .eq("trilho_nome", selectedTrilho)
        .eq("turma_dia", selectedTurma)
        .eq("list_date", selectedDate)
        .maybeSingle();

      if (existingError) throw existingError;

      if (existingList) {
        setCurrentList(existingList as PublicCourseWeeklyList);
        await loadSelectedList();
        return existingList as PublicCourseWeeklyList;
      }

      const { data: createdList, error: createError } = await (supabase as any)
        .from("public_course_weekly_lists")
        .insert([
          {
            trilho_nome: selectedTrilho,
            turma_dia: selectedTurma,
            list_date: selectedDate,
          },
        ])
        .select("*")
        .single();

      if (createError) throw createError;

      setCurrentList(createdList as PublicCourseWeeklyList);
      await loadStudentsAndLists();
      await loadSelectedList();

      toast({
        title: "Sucesso",
        description: "Lista semanal criada com sucesso.",
      });

      return createdList as PublicCourseWeeklyList;
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro",
        description: getSupabaseErrorMessage(
          error,
          "Não foi possível criar a lista semanal."
        ),
        variant: "destructive",
      });
      return null;
    } finally {
      setCreatingList(false);
    }
  };

  const handleAddStudent = async () => {
    const nome = newStudentName.trim();
    if (!nome) {
      toast({
        title: "Aviso",
        description: "Informe o nome do aluno antes de adicionar.",
      });
      return;
    }

    try {
      setSavingStudent(true);

      const { error } = await (supabase as any).from("public_course_students").insert([
        {
          trilho_nome: selectedTrilho,
          turma_dia: selectedTurma,
          nome_completo: nome,
        },
      ]);

      if (error) throw error;

      setNewStudentName("");
      await loadStudentsAndLists();

      toast({
        title: "Sucesso",
        description: "Aluno adicionado à turma com sucesso.",
      });
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Erro",
        description: getSupabaseErrorMessage(
          error,
          "Não foi possível adicionar o aluno.",
          "Este aluno já está cadastrado nesta turma."
        ),
        variant: "destructive",
      });
    } finally {
      setSavingStudent(false);
    }
  };

  const handleDeleteStudent = async (student: PublicCourseStudent) => {
    const confirmed = window.confirm(
      `Deseja remover "${student.nome_completo}" da turma ${getTurmaLabel(student.turma_dia)}?`
    );
    if (!confirmed) return;

    try {
      setDeletingStudentId(student.id);

      const { error } = await (supabase as any)
        .from("public_course_students")
        .delete()
        .eq("id", student.id);

      if (error) throw error;

      await loadStudentsAndLists();
      await loadSelectedList();

      toast({
        title: "Sucesso",
        description: "Aluno removido com sucesso.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro",
        description: getSupabaseErrorMessage(error, "Não foi possível remover o aluno."),
        variant: "destructive",
      });
    } finally {
      setDeletingStudentId(null);
    }
  };

  const handleSaveAttendance = async () => {
    if (students.length === 0) {
      toast({
        title: "Aviso",
        description: "Cadastre pelo menos um aluno antes de salvar a presença.",
      });
      return;
    }

    try {
      setSavingAttendance(true);

      const weeklyList = currentList || (await createOrLoadWeeklyList());
      if (!weeklyList) return;

      const payload = students.map((student) => ({
        weekly_list_id: weeklyList.id,
        student_id: student.id,
        presente: !!attendanceForm[student.id],
        marked_at: new Date().toISOString(),
      }));

      const { error } = await (supabase as any)
        .from("public_course_attendance")
        .upsert(payload, {
          onConflict: "weekly_list_id,student_id",
          ignoreDuplicates: false,
        });

      if (error) throw error;

      await loadSelectedList();

      toast({
        title: "Sucesso",
        description: "Presença da semana salva com sucesso.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro",
        description: getSupabaseErrorMessage(
          error,
          "Não foi possível salvar a presença da semana."
        ),
        variant: "destructive",
      });
    } finally {
      setSavingAttendance(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-emerald-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            <p className="text-sm text-muted-foreground">Carregando listas públicas dos cursos...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-emerald-50 pb-12 pt-4 sm:pt-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg">
              <BookOpenCheck className="h-8 w-8" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Lista Pública dos Cursos
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              Ceifeiros e CTL com controle semanal por turma de domingo ou terça
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Curso</p>
                  <p className="text-2xl font-bold text-emerald-700">{getTrilhoLabel(selectedTrilho)}</p>
                </div>
                <BookOpenCheck className="h-8 w-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Turma</p>
                  <p className="text-2xl font-bold text-amber-700">{getTurmaLabel(selectedTurma)}</p>
                </div>
                <CalendarDays className="h-8 w-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Presentes na semana</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {attendanceStats.present}/{attendanceStats.total}
                  </p>
                </div>
                <Users className="h-8 w-8 text-slate-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-emerald-200 bg-emerald-50/70">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                  Como funciona
                </p>
                <p className="mt-1 text-sm text-emerald-900">
                  Os alunos são cadastrados uma única vez por curso e turma. A cada nova semana,
                  você só abre a lista da data desejada e marca quem esteve presente ou ausente.
                </p>
              </div>
              <Badge variant="secondary" className="w-fit bg-white text-emerald-700">
                Cadastro fixo por turma
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Filtros da Lista</CardTitle>
            <CardDescription>
              Escolha o curso, o dia da turma e a semana que deseja marcar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label htmlFor="trilho" className="text-sm font-medium">
                  Curso
                </label>
                <Select
                  value={selectedTrilho}
                  onValueChange={(value) => setSelectedTrilho(value as TrilhoNome)}
                >
                  <SelectTrigger id="trilho" className="min-h-[44px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRILHO_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="turma" className="text-sm font-medium">
                  Turma
                </label>
                <Select
                  value={selectedTurma}
                  onValueChange={(value) => {
                    const turma = value as TurmaDia;
                    setSelectedTurma(turma);
                    setSelectedDate(getCurrentClassDate(turma));
                  }}
                >
                  <SelectTrigger id="turma" className="min-h-[44px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TURMA_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="list-date" className="text-sm font-medium">
                  Data da Lista
                </label>
                <Input
                  id="list-date"
                  type="date"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  className="min-h-[44px]"
                />
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium">Ação da Semana</span>
                <Button
                  type="button"
                  className="w-full min-h-[44px]"
                  onClick={createOrLoadWeeklyList}
                  disabled={creatingList || listLoading}
                >
                  {creatingList || listLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CalendarDays className="mr-2 h-4 w-4" />
                  )}
                  {currentList ? "Abrir Lista da Semana" : "Criar Lista da Semana"}
                </Button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                {getTrilhoLabel(selectedTrilho)} · {getTurmaLabel(selectedTurma)}
              </Badge>
              <Badge variant={currentList ? "default" : "outline"}>
                {currentList ? "Lista ativa" : "Lista ainda não criada"}
              </Badge>
              <span className="text-sm text-muted-foreground capitalize">{selectedDateLabel}</span>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-6">
          <div className="space-y-6">
            <Card>
            <CardHeader>
                <CardTitle>Alunos da Turma</CardTitle>
                <CardDescription>
                  Cadastre o nome uma vez. Nas próximas semanas ele continuará aparecendo na lista.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newStudentName}
                    onChange={(event) => setNewStudentName(event.target.value)}
                    placeholder="Nome completo do aluno"
                    className="min-h-[44px]"
                  />
                  <Button
                    type="button"
                    onClick={handleAddStudent}
                    disabled={savingStudent}
                    className="min-w-[120px]"
                  >
                    {savingStudent ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" />
                    )}
                    Adicionar
                  </Button>
                </div>

                <div className="space-y-2">
                  {students.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                      Nenhum aluno cadastrado nesta turma ainda.
                    </div>
                  ) : (
                    students.map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center justify-between rounded-lg border bg-white px-3 py-3"
                      >
                        <div className="min-w-0">
                          <p className="font-medium leading-tight">{student.nome_completo}</p>
                          <p className="text-xs text-muted-foreground">
                            Cadastrado em {formatDateBR(new Date(student.created_at))}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteStudent(student)}
                          disabled={deletingStudentId === student.id}
                        >
                          {deletingStudentId === student.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-red-600" />
                          )}
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
            <CardHeader>
              <CardTitle>Listas Recentes</CardTitle>
              <CardDescription>
                  Cada semana gera uma lista própria, mas usa sempre os mesmos alunos da turma
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentLists.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                    Ainda não existe nenhuma lista salva para esta turma.
                  </div>
                ) : (
                  recentLists.map((list) => (
                    <Button
                      key={list.id}
                      type="button"
                      variant={list.list_date === selectedDate ? "default" : "outline"}
                      className="w-full justify-between"
                      onClick={() => setSelectedDate(list.list_date)}
                    >
                      <span>{formatDateBR(list.list_date)}</span>
                      {list.list_date === selectedDate ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : null}
                    </Button>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle>Presença da Semana</CardTitle>
                  <CardDescription>
                    Marque apenas o check de presença para esta semana em {getTrilhoLabel(selectedTrilho)} ·{" "}
                    {getTurmaLabel(selectedTurma)} · {formatDateBR(selectedDate)}
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  onClick={handleSaveAttendance}
                  disabled={savingAttendance || listLoading}
                  className="w-full sm:w-auto"
                >
                  {savingAttendance ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  Salvar Presença
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!currentList ? (
                <div className="rounded-xl border border-dashed bg-slate-50 p-6 text-center">
                  <CalendarDays className="mx-auto mb-3 h-10 w-10 text-slate-400" />
                  <p className="font-medium text-slate-800">
                    Nenhuma lista criada para {formatDateBR(selectedDate)}.
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Os alunos já cadastrados continuarão sendo usados. Basta criar a lista desta
                    semana e marcar os checks de presença.
                  </p>
                </div>
              ) : students.length === 0 ? (
                <div className="rounded-xl border border-dashed bg-slate-50 p-6 text-center">
                  <Users className="mx-auto mb-3 h-10 w-10 text-slate-400" />
                  <p className="font-medium text-slate-800">
                    Nenhum aluno cadastrado para esta turma.
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Adicione os nomes no painel ao lado para começar a lista semanal.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-lg border bg-emerald-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-wide text-emerald-700">Presentes</p>
                      <p className="text-2xl font-bold text-emerald-800">{attendanceStats.present}</p>
                    </div>
                    <div className="rounded-lg border bg-amber-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-wide text-amber-700">Ausentes</p>
                      <p className="text-2xl font-bold text-amber-800">{attendanceStats.absent}</p>
                    </div>
                    <div className="rounded-lg border bg-slate-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-wide text-slate-600">Total</p>
                      <p className="text-2xl font-bold text-slate-900">{attendanceStats.total}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:hidden">
                    {students.map((student) => (
                      <div key={student.id} className="rounded-lg border bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium leading-tight">{student.nome_completo}</p>
                            <p className="text-xs text-muted-foreground">
                              {attendanceForm[student.id] ? "Presente" : "Ausente"}
                            </p>
                          </div>
                          <Switch
                            checked={attendanceForm[student.id] || false}
                            onCheckedChange={(checked) =>
                              setAttendanceForm((prev) => ({
                                ...prev,
                                [student.id]: checked,
                              }))
                            }
                            aria-label={`Marcar presença de ${student.nome_completo}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Aluno</TableHead>
                          <TableHead>Curso</TableHead>
                          <TableHead>Turma</TableHead>
                          <TableHead className="text-right">Presença</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.map((student) => (
                          <TableRow key={student.id}>
                            <TableCell className="font-medium">{student.nome_completo}</TableCell>
                            <TableCell>{getTrilhoLabel(selectedTrilho)}</TableCell>
                            <TableCell>{getTurmaLabel(selectedTurma)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-3">
                                <span className="text-sm text-muted-foreground">
                                  {attendanceForm[student.id] ? "Presente" : "Ausente"}
                                </span>
                                <Switch
                                  checked={attendanceForm[student.id] || false}
                                  onCheckedChange={(checked) =>
                                    setAttendanceForm((prev) => ({
                                      ...prev,
                                      [student.id]: checked,
                                    }))
                                  }
                                  aria-label={`Marcar presença de ${student.nome_completo}`}
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
