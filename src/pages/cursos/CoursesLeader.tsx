import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import FancyLoader from "@/components/FancyLoader";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, Users, Check, X } from "lucide-react";

type Course = { id: string; name: "Maturidade no Espírito" | "CTL"; price?: number | null };
type Member = { id: string; name: string; type: "member" | "frequentador" };
type Registration = {
  id: string; member_id: string; course_id: string; status: "pending" | "approved" | "completed";
  member?: Member;
};
type Subject = { id: string; course_id: string; title: string; teacher_id: string };
type Lesson = { id: string; subject_id: string; class_date: string };
type Attendance = { id: string; lesson_id: string; registration_id: string; present: boolean };

const tips = [
  "“Ensina a criança no caminho…” (Pv 22:6)",
  "“Fazei tudo com decência e ordem.” (1Co 14:40)",
  "“Sede prontos para ouvir.” (Tg 1:19)",
];

export default function CoursesLeader() {
  const { user } = useAuth();
  const { toast } = useToast();

  // guards
  if (!user) return null;

  const [loading, setLoading] = useState(true);

  // selects
  const [courseId, setCourseId] = useState<string>("");
  const [subjectId, setSubjectId] = useState<string>("");

  // data
  const [courses, setCourses] = useState<Course[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);

  // inscrição
  const [memberToEnroll, setMemberToEnroll] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("Pix");
  const [paymentAmount, setPaymentAmount] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      // delay só pra ver a animação
      await new Promise((r) => setTimeout(r, 800));

      // cursos ativos
      const { data: crs } = await supabase.from("courses").select("id,name,price").eq("active", true);
      // membros da célula do líder
      const { data: mem } = await supabase
        .from("members")
        .select("id,name,type")
        .eq("lider_id", user.id)
        .eq("active", true)
        .order("name");

      if (!mounted) return;
      setCourses(crs ?? []);
      setMembers(mem ?? []);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [user.id]);

  // quando escolher curso -> carrega subjects, registrations e presenças
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!courseId) {
        setRegistrations([]); setSubjects([]); setLessons([]); setAttendance([]);
        return;
      }
      setLoading(true);
      await new Promise((r) => setTimeout(r, 300));

      const [{ data: regs }, { data: subs }] = await Promise.all([
        supabase
          .from("course_registrations")
          .select("id,course_id,member_id,status, member:members(id,name,type)")
          .eq("course_id", courseId)
          .eq("lider_id", user.id)
          .order("registration_date", { ascending: true }),
        supabase
          .from("course_subjects")
          .select("id,course_id,title,teacher_id")
          .eq("course_id", courseId)
          .order("created_at", { ascending: true }),
      ]);

      if (!mounted) return;
      setRegistrations((regs ?? []) as any);
      setSubjects((subs ?? []) as any);
      setSubjectId(""); // reset
      setLessons([]); setAttendance([]);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [courseId, user.id]);

  // quando escolher matéria -> aulas e presenças
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!subjectId) { setLessons([]); setAttendance([]); return; }
      setLoading(true);

      const { data: les } = await supabase
        .from("course_lessons")
        .select("id,subject_id,class_date")
        .eq("subject_id", subjectId)
        .order("class_date", { ascending: true });

      const lessonIds = (les ?? []).map((l) => l.id);
      let att: Attendance[] = [];
      if (lessonIds.length) {
        const { data } = await supabase
          .from("course_attendance_entries")
          .select("id,lesson_id,registration_id,present")
          .in("lesson_id", lessonIds);
        att = (data ?? []) as Attendance[];
      }

      if (!mounted) return;
      setLessons(les ?? []);
      setAttendance(att);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [subjectId]);

  // derived
  const attendanceMatrix = useMemo(() => {
    const map = new Map<string, Record<string, boolean>>();
    registrations.forEach((r) => map.set(r.id, {}));
    attendance.forEach((a) => {
      if (!map.has(a.registration_id)) map.set(a.registration_id, {});
      map.get(a.registration_id)![a.lesson_id] = a.present;
    });
    return map;
  }, [registrations, attendance]);

  const absencesByReg = useMemo(() => {
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

  // ações
  const enroll = async () => {
    if (!memberToEnroll || !courseId) return;
    const { error, data } = await supabase
      .from("course_registrations")
      .insert({
        member_id: memberToEnroll,
        course_id: courseId,
        lider_id: user.id,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Erro", description: "Não foi possível inscrever.", variant: "destructive" });
      return;
    }

    // registra pagamento se informado
    const amount = Number(paymentAmount);
    if (!Number.isNaN(amount) && amount > 0) {
      await supabase
        .from("course_payments")
        .insert({ registration_id: data.id, amount, paid_on: new Date().toISOString().slice(0, 10), status: "paid", method: paymentMethod });
    }

    // recarrega inscrições
    const { data: regs } = await supabase
      .from("course_registrations")
      .select("id,course_id,member_id,status, member:members(id,name,type)")
      .eq("course_id", courseId)
      .eq("lider_id", user.id);

    setRegistrations((regs ?? []) as any);
    setMemberToEnroll("");
    setPaymentAmount("");
    toast({ title: "Inscrito com sucesso!" });
  };

  if (loading) {
    return <FancyLoader message="Carregando cursos do líder…" tips={tips} />;
  }

  const selectedCourse = courses.find((c) => c.id === courseId);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Cursos — Líder</h1>
          <p className="text-muted-foreground">Inscreva membros e acompanhe presenças</p>
        </div>

        <div className="flex gap-3">
          <Select value={courseId} onValueChange={(v) => { setCourseId(v); }}>
            <SelectTrigger className="w-[260px]"><SelectValue placeholder="Selecione o curso" /></SelectTrigger>
            <SelectContent>
              {courses.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
            </SelectContent>
          </Select>

          {courseId && (
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger className="w-[260px]"><SelectValue placeholder="Matéria (opcional)" /></SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (<SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <Tabs defaultValue="enroll" className="space-y-6">
        <TabsList>
          <TabsTrigger value="enroll">Inscrição</TabsTrigger>
          <TabsTrigger value="follow" disabled={!courseId}>Acompanhamento</TabsTrigger>
        </TabsList>

        {/* INSCRIÇÃO */}
        <TabsContent value="enroll">
          <Card className="hover:grape-glow transition-smooth">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" /> Inscrever membro no curso
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-4">
              <div className="md:col-span-2">
                <Label>Membro / Frequentador</Label>
                <Select value={memberToEnroll} onValueChange={setMemberToEnroll}>
                  <SelectTrigger><SelectValue placeholder="Selecione o aluno" /></SelectTrigger>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name} — {m.type === "member" ? "Membro" : "Frequentador"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Forma de Pagamento</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pix">Pix</SelectItem>
                    <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="Cartão">Cartão</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Valor (R$)</Label>
                <Input
                  inputMode="numeric"
                  value={paymentAmount}
                  placeholder={selectedCourse?.price ? String(selectedCourse.price) : "Opcional"}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </div>

              <div className="md:col-span-4">
                <Button disabled={!courseId || !memberToEnroll} onClick={enroll} className="w-full">
                  Confirmar Inscrição
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ACOMPANHAMENTO */}
        <TabsContent value="follow">
          <Card className="hover:grape-glow transition-smooth">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" /> Presenças dos seus alunos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {registrations.length === 0 ? (
                <p className="text-muted-foreground">Nenhuma inscrição neste curso.</p>
              ) : subjectId && lessons.length > 0 ? (
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Aluno</TableHead>
                        {lessons.map((l) => (
                          <TableHead key={l.id}>{new Date(l.class_date).toLocaleDateString("pt-BR")}</TableHead>
                        ))}
                        <TableHead>Faltas</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {registrations.map((r) => {
                        const faltas = absencesByReg.get(r.id) ?? 0;
                        const reprovado = faltas >= 4;
                        return (
                          <TableRow key={r.id}>
                            <TableCell className="font-medium">{r.member?.name ?? r.member_id}</TableCell>
                            {lessons.map((l) => {
                              const present = attendanceMatrix.get(r.id)?.[l.id] ?? false;
                              return (
                                <TableCell key={l.id}>
                                  {present ? <Check className="w-4 h-4" /> : <X className="w-4 h-4 opacity-60" />}
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
              ) : (
                <p className="text-muted-foreground">
                  Selecione uma <strong>matéria</strong> para ver a grade de presenças por aula.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
