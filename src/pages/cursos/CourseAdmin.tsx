import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import FancyLoader from "@/components/FancyLoader";
import { GraduationCap, BookOpen, Users, Calendar, Check, X, DollarSign, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Course = {
  id: string;
  name: "Maturidade no Espírito" | "CTL";
  description?: string | null;
  duration?: string | null;
  price?: number | null;
  active?: boolean | null;
};

type Profile = { id: string; name: string; role: "lider" | "discipulador" | "pastor" | "obreiro" };

type Member = { id: string; name: string };

type Registration = {
  id: string;
  course_id: string;
  member_id: string;
  lider_id: string | null;
  status: "pending" | "approved" | "completed";
  registration_date: string | null;
  member?: Member;
};

type Subject = {
  id: string;
  course_id: string;
  title: string;
  teacher_id: string;
  teacher?: Profile;
  created_at?: string;
};

type Lesson = {
  id: string;
  subject_id: string;
  class_date: string; // YYYY-MM-DD
};

type AttendanceEntry = {
  id: string;
  lesson_id: string;
  registration_id: string;
  present: boolean;
};

type Payment = {
  id: string;
  registration_id: string;
  amount: number;
  paid_on: string; // date
  status: "paid" | "pending" | "refunded";
  method?: string | null;
};

const tips = [
  'Acertando a planilha dos cursos como Neemias ajustou os muros…',
  'Conferindo o dízimo das apostilas e o pãozinho do intervalo…',
  'Chamando os levitas para tocar enquanto você lança presenças…',
];

export default function CourseAdmin() {
  const { user } = useAuth();
  const { toast } = useToast();

  // loading
  const [loading, setLoading] = useState(true);

  // base
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);

  // UI selections
  const [courseId, setCourseId] = useState<string>("");
  const [subjectId, setSubjectId] = useState<string>("");
  const [lessonDate, setLessonDate] = useState<string>("");

  // subjects/lessons/attendance/payments
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [attendance, setAttendance] = useState<AttendanceEntry[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  // dialogs
  const [openNewSubject, setOpenNewSubject] = useState(false);
  const [newSubjectTitle, setNewSubjectTitle] = useState("");
  const [newSubjectTeacher, setNewSubjectTeacher] = useState("");

  const [openNewLesson, setOpenNewLesson] = useState(false);
  const [newLessonDate, setNewLessonDate] = useState("");

  const [openNewPayment, setOpenNewPayment] = useState<string | null>(null); // registration_id
  const [paymentAmount, setPaymentAmount] = useState<string>("0");
  const [paymentDate, setPaymentDate] = useState<string>("");

  const isPastor = user?.role === "pastor";

  // ---------- LOADERS ----------
  useEffect(() => {
    if (!isPastor) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      // delay só pra você ver a animação
      await new Promise((r) => setTimeout(r, 900));

      const [{ data: crs }, { data: teach }] = await Promise.all([
        supabase.from("courses").select("id,name,description,duration,price,active").eq("active", true),
        supabase.from("profiles").select("id,name,role").in("role", ["lider", "discipulador"]),
      ]);

      setCourses(crs ?? []);
      setTeachers((teach ?? []) as Profile[]);
      setLoading(false);
    })();
  }, [isPastor]);

  // quando escolher curso, carrega subjects, registrations e payments (associados às regs)
  useEffect(() => {
    if (!courseId) { setSubjects([]); setRegistrations([]); setPayments([]); setSubjectId(""); return; }
    (async () => {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 400));

      const [{ data: subs }, { data: regs }] = await Promise.all([
        supabase
          .from("course_subjects")
          .select("id,course_id,title,teacher_id,created_at, teacher:teacher_id(id,name,role)")
          .eq("course_id", courseId)
          .order("created_at", { ascending: true }),
        supabase
          .from("course_registrations")
          .select("id,course_id,member_id,lider_id,status,registration_date, member:members(id,name)")
          .eq("course_id", courseId)
          .order("registration_date", { ascending: false }),
      ]);

      const subjectRows = (subs as Subject[] | null) ?? [];
      const registrationRows = (regs as Registration[] | null) ?? [];
      setSubjects(subjectRows.map((item) => item));
      setRegistrations(registrationRows.map((item) => item));

      // payments de todas regs desse curso
      const regIds = registrationRows.map((r) => r.id);
      if (regIds.length) {
        const { data: pays } = await supabase
          .from("course_payments")
          .select("*")
          .in("registration_id", regIds)
          .order("paid_on", { ascending: false });
        setPayments(pays ?? []);
      } else {
        setPayments([]);
      }

      setLoading(false);
    })();
  }, [courseId]);

  // quando escolher matéria, carrega aulas e presença
  useEffect(() => {
    if (!subjectId) { setLessons([]); setAttendance([]); return; }
    (async () => {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 300));

      const { data: les } = await supabase
        .from("course_lessons")
        .select("id,subject_id,class_date")
        .eq("subject_id", subjectId)
        .order("class_date", { ascending: true });

      setLessons(les ?? []);

      const lessonIds = (les ?? []).map((l) => l.id);
      if (lessonIds.length) {
        const { data: att } = await supabase
          .from("course_attendance_entries")
          .select("id,lesson_id,registration_id,present")
          .in("lesson_id", lessonIds);

        setAttendance(att ?? []);
      } else {
        setAttendance([]);
      }
      setLoading(false);
    })();
  }, [subjectId]);

  // ---------- ACTIONS ----------
  const createSubject = async () => {
    if (!courseId || !newSubjectTitle || !newSubjectTeacher) return;
    const { error } = await supabase
      .from("course_subjects")
      .insert({ course_id: courseId, title: newSubjectTitle, teacher_id: newSubjectTeacher });
    if (error) {
      toast({ title: "Erro", description: "Não foi possível criar a matéria.", variant: "destructive" });
      return;
    }
    setOpenNewSubject(false);
    setNewSubjectTitle(""); setNewSubjectTeacher("");
    // reload
    const { data: subs } = await supabase
      .from("course_subjects")
      .select("id,course_id,title,teacher_id,created_at, teacher:teacher_id(id,name,role)")
      .eq("course_id", courseId)
      .order("created_at", { ascending: true });
    setSubjects(subs ?? []);
    toast({ title: "Matéria criada!" });
  };

  const createLesson = async () => {
    if (!subjectId || !newLessonDate) return;
    const { error } = await supabase
      .from("course_lessons")
      .insert({ subject_id: subjectId, class_date: newLessonDate });
    if (error) {
      toast({ title: "Erro", description: "Não foi possível criar a aula.", variant: "destructive" });
      return;
    }
    setOpenNewLesson(false);
    setNewLessonDate("");
    const { data: les } = await supabase
      .from("course_lessons")
      .select("id,subject_id,class_date")
      .eq("subject_id", subjectId)
      .order("class_date");
    setLessons(les ?? []);
    toast({ title: "Aula criada!" });
  };

  const togglePresence = async (lesson_id: string, registration_id: string, present: boolean) => {
    // upsert
    const existing = attendance.find((a) => a.lesson_id === lesson_id && a.registration_id === registration_id);
    let error;
    if (existing) {
      ({ error } = await supabase
        .from("course_attendance_entries")
        .update({ present })
        .eq("id", existing.id));
    } else {
      const { error: err2, data } = await supabase
        .from("course_attendance_entries")
        .insert({ lesson_id, registration_id, present })
        .select()
        .single();
      error = err2;
      if (!err2 && data) setAttendance((prev) => [...prev, data]);
    }
    if (error) {
      toast({ title: "Erro", description: "Não foi possível atualizar presença.", variant: "destructive" });
      return;
    }
    // otimista
    setAttendance((prev) =>
      prev.map((a) =>
        a.lesson_id === lesson_id && a.registration_id === registration_id ? { ...a, present } : a
      )
    );
  };

  const addPayment = async () => {
    if (!openNewPayment) return;
    const amount = Number(paymentAmount || "0");
    if (Number.isNaN(amount) || amount <= 0 || !paymentDate) return;

    const { error } = await supabase
      .from("course_payments")
      .insert({ registration_id: openNewPayment, amount, paid_on: paymentDate, status: "paid" });

    if (error) {
      toast({ title: "Erro", description: "Não foi possível registrar pagamento.", variant: "destructive" });
      return;
    }
    const { data: pays } = await supabase
      .from("course_payments")
      .select("*")
      .in("registration_id", registrations.map((r) => r.id));
    setPayments(pays ?? []);
    setOpenNewPayment(null);
    setPaymentAmount("0");
    setPaymentDate("");
    toast({ title: "Pagamento registrado!" });
  };

  // ---------- DERIVED ----------
  const lessonsById = useMemo(() => {
    const map = new Map<string, Lesson>();
    lessons.forEach((l) => map.set(l.id, l));
    return map;
  }, [lessons]);

  const attendanceMatrix = useMemo(() => {
    // { registration_id : { lesson_id : present } }
    const map = new Map<string, Record<string, boolean>>();
    registrations.forEach((r) => map.set(r.id, {}));
    attendance.forEach((a) => {
      if (!map.has(a.registration_id)) map.set(a.registration_id, {});
      map.get(a.registration_id)![a.lesson_id] = a.present;
    });
    return map;
  }, [registrations, attendance]);

  const absencesCountByRegistration = useMemo(() => {
    const counts = new Map<string, number>();
    registrations.forEach((r) => counts.set(r.id, 0));
    lessons.forEach((l) => {
      registrations.forEach((r) => {
        const present = attendanceMatrix.get(r.id)?.[l.id] ?? false;
        if (!present) counts.set(r.id, (counts.get(r.id) ?? 0) + 1);
      });
    });
    return counts;
  }, [registrations, lessons, attendanceMatrix]);

  const failed = useMemo(() => {
    return registrations
      .filter((r) => (absencesCountByRegistration.get(r.id) ?? 0) >= 4)
      .map((r) => ({
        member: r.member?.name ?? r.member_id,
        absences: absencesCountByRegistration.get(r.id) ?? 0,
      }));
  }, [registrations, absencesCountByRegistration]);

  // ---------- GUARD ----------
  if (!isPastor) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Acesso restrito ao Pastor.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <FancyLoader
        message="Organizando o QG dos cursos"
        tips={tips}
      />
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold">Trilho do Vencedor — Administração</h1>
          <p className="text-sm md:text-base text-muted-foreground">Gerencie matérias, chamadas e pagamentos</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
          <Select value={courseId} onValueChange={(v) => { setCourseId(v); setSubjectId(""); }}>
            <SelectTrigger className="w-full sm:w-[260px]">
              <SelectValue placeholder="Selecione o curso (CTL ou Maturidade)" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {courseId && (
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger className="w-full sm:w-[260px]">
                <SelectValue placeholder="Matéria" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.title} — {s.teacher?.name ?? "Professor"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <Tabs defaultValue="subjects" className="space-y-6">
        <TabsList>
          <TabsTrigger value="subjects"><BookOpen className="w-4 h-4 mr-1" /> Matérias</TabsTrigger>
          <TabsTrigger value="attendance" disabled={!subjectId}><Users className="w-4 h-4 mr-1" /> Chamada</TabsTrigger>
          <TabsTrigger value="payments" disabled={!courseId}><DollarSign className="w-4 h-4 mr-1" /> Pagamentos</TabsTrigger>
        </TabsList>

        {/* --- MATÉRIAS --- */}
        <TabsContent value="subjects">
          <Card className="hover:grape-glow transition-smooth">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                Matérias do Curso
              </CardTitle>

              <Dialog open={openNewSubject} onOpenChange={setOpenNewSubject}>
                <DialogTrigger asChild>
                  <Button disabled={!courseId}><Plus className="w-4 h-4 mr-1" /> Nova Matéria</Button>
                </DialogTrigger>
                <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
                  <DialogHeader><DialogTitle>Adicionar Matéria</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <Label>Título</Label>
                      <Input value={newSubjectTitle} onChange={(e) => setNewSubjectTitle(e.target.value)} />
                    </div>
                    <div>
                      <Label>Professor (Líder/Discipulador)</Label>
                      <Select value={newSubjectTeacher} onValueChange={setNewSubjectTeacher}>
                        <SelectTrigger><SelectValue placeholder="Selecione o professor" /></SelectTrigger>
                        <SelectContent>
                          {teachers.map((t) => (
                            <SelectItem key={t.id} value={t.id}>{t.name} — {t.role}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="w-full" onClick={createSubject} disabled={!newSubjectTitle || !newSubjectTeacher}>
                      Salvar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>

            <CardContent>
              {!courseId ? (
                <p className="text-muted-foreground">Selecione um curso para ver/editar as matérias.</p>
              ) : subjects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Nenhuma matéria cadastrada.</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="min-w-[620px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Título</TableHead>
                        <TableHead>Professor</TableHead>
                        <TableHead>Desde</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subjects.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell>{s.title}</TableCell>
                          <TableCell>{s.teacher?.name ?? "—"}</TableCell>
                          <TableCell>{s.created_at ? new Date(s.created_at).toLocaleDateString("pt-BR") : "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- CHAMADA --- */}
        <TabsContent value="attendance">
          <Card className="hover:grape-glow transition-smooth">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" /> Chamada
              </CardTitle>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <Input
                    type="date"
                    value={lessonDate}
                    onChange={(e) => setLessonDate(e.target.value)}
                  />
                </div>

                <Dialog open={openNewLesson} onOpenChange={setOpenNewLesson}>
                  <DialogTrigger asChild>
                    <Button><Plus className="w-4 h-4 mr-1" /> Nova Aula</Button>
                  </DialogTrigger>
                <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
                    <DialogHeader><DialogTitle>Nova Aula</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <Label>Data da Aula</Label>
                      <Input type="date" value={newLessonDate} onChange={(e) => setNewLessonDate(e.target.value)} />
                      <Button className="w-full" onClick={createLesson} disabled={!newLessonDate}>Criar</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>

            <CardContent>
              {lessons.length === 0 ? (
                <p className="text-muted-foreground">Cadastre ao menos uma aula para lançar presença.</p>
              ) : (
                <>
                  {/* cabeçalho com todas as datas/aulas */}
                  <div className="overflow-x-auto">
                    <Table className="min-w-[780px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Aluno</TableHead>
                          {lessons.map((l) => (
                            <TableHead key={l.id}>
                              {new Date(l.class_date).toLocaleDateString("pt-BR")}
                            </TableHead>
                          ))}
                          <TableHead>Faltas</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {registrations.map((r) => {
                          const faltas = absencesCountByRegistration.get(r.id) ?? 0;
                          const reprovado = faltas >= 4;
                          return (
                            <TableRow key={r.id}>
                              <TableCell className="font-medium">{r.member?.name ?? r.member_id}</TableCell>
                              {lessons.map((l) => {
                                const present = attendanceMatrix.get(r.id)?.[l.id] ?? false;
                                const selectedLesson = lessonDate
                                  ? lessons.find((ls) => ls.class_date === lessonDate)?.id === l.id
                                  : true;

                                return (
                                  <TableCell key={l.id}>
                                    <Button
                                      size="icon"
                                      variant={present ? "default" : "secondary"}
                                      className={`h-8 w-8 ${selectedLesson ? "" : "opacity-50 pointer-events-none"}`}
                                      onClick={() => togglePresence(l.id, r.id, !present)}
                                      title="Alternar presença"
                                    >
                                      {present ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                    </Button>
                                  </TableCell>
                                );
                              })}
                              <TableCell>{faltas}</TableCell>
                              <TableCell>
                                <Badge variant={reprovado ? "destructive" : "secondary"}>
                                  {reprovado ? "Reprovado" : "Em Curso"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* lista rápida de reprovados */}
                  <div className="mt-4">
                    <h3 className="font-semibold mb-2">Reprovados (≥ 4 faltas)</h3>
                    {failed.length === 0 ? (
                      <p className="text-muted-foreground text-sm">Nenhum aluno reprovado.</p>
                    ) : (
                      <ul className="text-sm list-disc pl-5">
                        {failed.map((f, i) => (
                          <li key={i}>{f.member} — {f.absences} faltas</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- PAGAMENTOS --- */}
        <TabsContent value="payments">
          <Card className="hover:grape-glow transition-smooth">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" /> Pagamentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!courseId ? (
                <p className="text-muted-foreground">Selecione um curso para visualizar os pagamentos.</p>
              ) : registrations.length === 0 ? (
                <p className="text-muted-foreground">Nenhuma matrícula encontrada neste curso.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="min-w-[640px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Aluno</TableHead>
                        <TableHead>Último Pagamento</TableHead>
                        <TableHead>Total Pago</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {registrations.map((r) => {
                        const myPays = payments.filter((p) => p.registration_id === r.id);
                        const total = myPays.reduce((s, p) => s + Number(p.amount || 0), 0);
                        const last = myPays[0]?.paid_on;
                        return (
                          <TableRow key={r.id}>
                            <TableCell className="font-medium">{r.member?.name ?? r.member_id}</TableCell>
                            <TableCell>{last ? new Date(last).toLocaleDateString("pt-BR") : "—"}</TableCell>
                            <TableCell>R$ {total.toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                              <Dialog open={openNewPayment === r.id} onOpenChange={(o) => setOpenNewPayment(o ? r.id : null)}>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="outline"><DollarSign className="w-4 h-4 mr-1" /> Registrar</Button>
                                </DialogTrigger>
                                <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-md">
                                  <DialogHeader><DialogTitle>Novo Pagamento — {r.member?.name}</DialogTitle></DialogHeader>
                                  <div className="space-y-3">
                                    <div>
                                      <Label>Valor (R$)</Label>
                                      <Input value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
                                    </div>
                                    <div>
                                      <Label>Data</Label>
                                      <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
                                    </div>
                                    <Button className="w-full" onClick={addPayment} disabled={!paymentDate || !Number(paymentAmount)}>
                                      Salvar Pagamento
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
