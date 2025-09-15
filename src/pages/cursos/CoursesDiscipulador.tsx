import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import FancyLoader from "@/components/FancyLoader";
import { useToast } from "@/hooks/use-toast";
import { Users, BookOpen, Calendar, Check, X } from "lucide-react";

type Course = { id: string; name: "Maturidade no Espírito" | "CTL" };
type Registration = { id: string; member_id: string; course_id: string; lider_id: string; member?: { id: string; name: string } };
type Subject = { id: string; course_id: string; title: string; teacher_id: string };
type Lesson = { id: string; subject_id: string; class_date: string };
type Attendance = { id: string; lesson_id: string; registration_id: string; present: boolean };

const tips = [
  "“O obreiro é digno do seu salário.” (Lc 10:7)",
  "“Tudo com decência e ordem.” (1Co 14:40)",
];

export default function CoursesDiscipulador() {
  const { user } = useAuth();
  const { toast } = useToast();
  if (!user) return null;

  const [loading, setLoading] = useState(true);

  const [courses, setCourses] = useState<Course[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);

  const [courseId, setCourseId] = useState<string>("");
  const [subjectId, setSubjectId] = useState<string>("");
  const [newLessonDate, setNewLessonDate] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 800));
      const { data: crs } = await supabase.from("courses").select("id,name").eq("active", true);
      if (!mounted) return;
      setCourses(crs ?? []);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!courseId) {
        setRegistrations([]); setSubjects([]); setLessons([]); setAttendance([]);
        return;
      }
      setLoading(true);

      // líderes da sua rede
      const { data: leaders } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "lider")
        .eq("discipulador_uuid", user.id);

      const leaderIds = (leaders ?? []).map((l) => l.id);
      const [{ data: regs }, { data: subs }] = await Promise.all([
        leaderIds.length
          ? supabase
              .from("course_registrations")
              .select("id,course_id,member_id,lider_id, member:members(id,name)")
              .eq("course_id", courseId)
              .in("lider_id", leaderIds)
          : Promise.resolve({ data: [] }),
        supabase.from("course_subjects").select("id,course_id,title,teacher_id").eq("course_id", courseId),
      ]);

      if (!mounted) return;
      setRegistrations((regs ?? []) as any);
      setSubjects((subs ?? []) as any);
      setSubjectId("");
      setLessons([]); setAttendance([]);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [courseId, user.id]);

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

  const togglePresence = async (lesson_id: string, registration_id: string, present: boolean) => {
    // Discipulador pode marcar presença
    const existing = attendance.find((a) => a.lesson_id === lesson_id && a.registration_id === registration_id);
    if (existing) {
      const { error } = await supabase.from("course_attendance_entries").update({ present }).eq("id", existing.id);
      if (error) return toast({ title: "Erro", description: "Falha ao atualizar presença.", variant: "destructive" });
      setAttendance((prev) => prev.map((a) => (a.id === existing.id ? { ...a, present } : a)));
    } else {
      const { error, data } = await supabase
        .from("course_attendance_entries")
        .insert({ lesson_id, registration_id, present })
        .select()
        .single();
      if (error) return toast({ title: "Erro", description: "Falha ao lançar presença.", variant: "destructive" });
      setAttendance((prev) => [...prev, data as any]);
    }
  };

  const createLesson = async () => {
    if (!subjectId || !newLessonDate) return;
    const { error } = await supabase.from("course_lessons").insert({ subject_id: subjectId, class_date: newLessonDate });
    if (error) return toast({ title: "Erro", description: "Não foi possível criar a aula.", variant: "destructive" });
    setNewLessonDate("");
    const { data: les } = await supabase
      .from("course_lessons")
      .select("id,subject_id,class_date")
      .eq("subject_id", subjectId)
      .order("class_date", { ascending: true });
    setLessons(les ?? []);
  };

  if (loading) return <FancyLoader message="Carregando cursos da sua rede…" tips={tips} />;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Cursos — Discipulador</h1>
          <p className="text-muted-foreground">Acompanhe e marque presenças da sua rede</p>
        </div>

        <div className="flex gap-3">
          <Select value={courseId} onValueChange={(v) => setCourseId(v)}>
            <SelectTrigger className="w-[260px]"><SelectValue placeholder="Selecione o curso" /></SelectTrigger>
            <SelectContent>
              {courses.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
            </SelectContent>
          </Select>

          {courseId && (
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger className="w-[260px]"><SelectValue placeholder="Matéria" /></SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (<SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <Tabs defaultValue="frequencia" className="space-y-6">
        <TabsList>
          <TabsTrigger value="frequencia"><BookOpen className="w-4 h-4 mr-1" /> Frequência</TabsTrigger>
          <TabsTrigger value="aula" disabled={!subjectId}><Users className="w-4 h-4 mr-1" /> Aula (marcar presença)</TabsTrigger>
        </TabsList>

        {/* Frequência agregada */}
        <TabsContent value="frequencia">
          <Card className="hover:grape-glow transition-smooth">
            <CardHeader><CardTitle>Frequência por Aluno</CardTitle></CardHeader>
            <CardContent>
              {!courseId ? (
                <p className="text-muted-foreground">Selecione um curso.</p>
              ) : registrations.length === 0 ? (
                <p className="text-muted-foreground">Nenhuma matrícula na sua rede.</p>
              ) : !subjectId || lessons.length === 0 ? (
                <p className="text-muted-foreground">Escolha uma matéria para ver as aulas e faltas.</p>
              ) : (
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
                                <TableCell key={l.id}>{present ? <Check className="w-4 h-4" /> : <X className="w-4 h-4 opacity-60" />}</TableCell>
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aula: marcar presença */}
        <TabsContent value="aula">
          <Card className="hover:grape-glow transition-smooth">
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Marcar presença na aula</CardTitle>
              <div className="flex items-center gap-2">
                <Input type="date" value={newLessonDate} onChange={(e) => setNewLessonDate(e.target.value)} />
                <Button onClick={createLesson} disabled={!newLessonDate}>Criar Aula</Button>
              </div>
            </CardHeader>
            <CardContent>
              {lessons.length === 0 ? (
                <p className="text-muted-foreground">Nenhuma aula cadastrada para esta matéria.</p>
              ) : (
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Aluno</TableHead>
                        {lessons.map((l) => (
                          <TableHead key={l.id}>{new Date(l.class_date).toLocaleDateString("pt-BR")}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {registrations.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.member?.name ?? r.member_id}</TableCell>
                          {lessons.map((l) => {
                            const present = attendanceMatrix.get(r.id)?.[l.id] ?? false;
                            return (
                              <TableCell key={l.id}>
                                <Button
                                  size="icon"
                                  variant={present ? "default" : "secondary"}
                                  className="h-8 w-8"
                                  onClick={() => togglePresence(l.id, r.id, !present)}
                                >
                                  {present ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                </Button>
                              </TableCell>
                            );
                          })}
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
    </div>
  );
}
