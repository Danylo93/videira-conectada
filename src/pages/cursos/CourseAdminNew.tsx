import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import * as coursesService from "@/integrations/supabase/courses";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import FancyLoader from "@/components/FancyLoader";
import { 
  GraduationCap, 
  BookOpen, 
  Users, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin,
  UserCheck,
  UserX,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  Filter,
  Search,
  TrendingUp,
  BarChart3,
  FileText
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { 
  useCourses, 
  useCourseModules, 
  useCourseLessons, 
  useCourseRegistrations, 
  useCourseAttendance, 
  useAttendanceStats,
  useLessonAttendance,
  useAttendanceReport
} from "@/hooks/useCourses";

interface CourseInstructorItem {
  id: string;
  course_id: string;
  instructor_id: string;
  role: "instructor" | "assistant" | "mentor" | "evaluator";
  is_primary: boolean;
  instructor_name: string;
  instructor_role: string;
}

const tips = [
  'Organizando os cursos como Moisés organizou o povo no deserto...',
  'Marcando presenças com a precisão de um cronômetro suíço...',
  'Preparando líderes como Davi preparou seus valentes...',
];

export default function CourseAdminNew() {
  const { user } = useAuth();
  const { toast } = useToast();
  const tabsContainerRef = useRef<HTMLDivElement | null>(null);

  // Estados principais
  const [selectedCourseId, setSelectedCourseId] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("courses");
  const [selectedModuleId, setSelectedModuleId] = useState<string>("");
  const [selectedLessonId, setSelectedLessonId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Estados para diálogos
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);
  const [isInstructorDialogOpen, setIsInstructorDialogOpen] = useState(false);
  const [isEditCourseDialogOpen, setIsEditCourseDialogOpen] = useState(false);
  const [isRegistrationDialogOpen, setIsRegistrationDialogOpen] = useState(false);
  const [isSavingCourse, setIsSavingCourse] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);

  // Estados para formulários
  const [moduleForm, setModuleForm] = useState({
    title: "",
    description: "",
    duration_hours: 1,
    is_required: true,
    prerequisites: [] as string[],
    learning_outcomes: [] as string[]
  });

  const [lessonForm, setLessonForm] = useState({
    title: "",
    description: "",
    lesson_type: "classroom" as const,
    scheduled_date: "",
    start_time: "",
    end_time: "",
    location: "",
    materials: [] as string[],
    homework: "",
    is_mandatory: true
  });

  const [attendanceForm, setAttendanceForm] = useState<Record<string, boolean>>({});
  const [instructors, setInstructors] = useState<CourseInstructorItem[]>([]);
  const [availableInstructors, setAvailableInstructors] = useState<Array<{ id: string; name: string; role: string }>>([]);
  const [selectedInstructorId, setSelectedInstructorId] = useState("");
  const [selectedInstructorRole, setSelectedInstructorRole] = useState<"instructor" | "assistant" | "mentor" | "evaluator">("instructor");
  const [membersLoading, setMembersLoading] = useState(false);
  const [availableMembers, setAvailableMembers] = useState<Array<{ id: string; name: string; type: string }>>([]);
  const [registrationForm, setRegistrationForm] = useState({
    memberId: "",
    trilho: "",
    turmaDia: "",
    courseId: "",
    amount: "",
  });
  const [editCourseForm, setEditCourseForm] = useState({
    name: "",
    description: "",
    duration_weeks: "24",
    max_students: "",
    status: "active",
    category: "spiritual",
    semester_label: "",
    trilho_nome: "",
    turma_dia: "",
  });

  // Verificar se é pastor, obreiro ou coordenador do Trilho do Vencedor
  const isAuthorized =
    user?.role === "pastor" || user?.role === "obreiro" || user?.isCursoCoordenador === true;

  // Hooks para dados
  const { courses, loading: coursesLoading, refetch: refetchCourses } = useCourses();
  const { modules, loading: modulesLoading, refetch: refetchModules } = useCourseModules(selectedCourseId && selectedCourseId !== "all" ? selectedCourseId : "");
  const { lessons, loading: lessonsLoading, refetch: refetchLessons } = useCourseLessons(selectedModuleId && selectedModuleId.trim() !== "" ? selectedModuleId : "");
  const { registrations, loading: registrationsLoading, refetch: refetchRegistrations } = useCourseRegistrations(selectedCourseId && selectedCourseId !== "all" ? selectedCourseId : undefined);
  const { attendance, loading: attendanceLoading, markAttendance, refetch: refetchAttendance } = useCourseAttendance(
    selectedLessonId && selectedLessonId.trim() !== "" ? { lesson_id: selectedLessonId } : undefined
  );
  const { stats: attendanceStats } = useAttendanceStats(selectedCourseId && selectedCourseId !== "all" ? selectedCourseId : undefined);
  const { lessons: lessonAttendance, loading: lessonAttendanceLoading } = useLessonAttendance(selectedCourseId && selectedCourseId !== "all" ? selectedCourseId : undefined);
  const { report: attendanceReport } = useAttendanceReport(selectedCourseId && selectedCourseId !== "all" ? selectedCourseId : undefined);
  const hasSelectedCourse = selectedCourseId !== "all";
  const hasSelectedModule = selectedModuleId.trim() !== "";
  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId) ?? null,
    [courses, selectedCourseId]
  );
  const trilhoOptions = useMemo(() => {
    const values = new Set(
      courses
        .map((course) => course.trilho_nome)
        .filter((value): value is "ceifeiros" | "ctl" => value === "ceifeiros" || value === "ctl")
    );
    return Array.from(values);
  }, [courses]);
  const filteredRegistrationCourses = useMemo(() => {
    return courses
      .filter((course) => course.status === "active")
      .filter((course) => !registrationForm.trilho || course.trilho_nome === registrationForm.trilho)
      .filter((course) => !registrationForm.turmaDia || course.turma_dia === registrationForm.turmaDia);
  }, [courses, registrationForm.trilho, registrationForm.turmaDia]);

  // Filtrar cursos
  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           course.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || course.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [courses, searchTerm, statusFilter]);

  // Filtrar matrículas
  const filteredRegistrations = useMemo(() => {
    if (!registrations) return [];
    return registrations.filter(reg => {
      const matchesSearch = reg.members?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           reg.courses?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || reg.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [registrations, searchTerm, statusFilter]);

  const currentAttendanceByRegistration = useMemo(() => {
    const map = new Map<string, boolean>();
    attendance.forEach((entry) => {
      map.set(entry.registration_id, entry.status === "present");
    });
    return map;
  }, [attendance]);

  const absencesByStudentId = useMemo(() => {
    const map = new Map<string, number>();
    attendanceReport.forEach((item) => {
      map.set(item.studentId, Math.max(item.totalLessons - item.attendedLessons, 0));
    });
    return map;
  }, [attendanceReport]);

  const fetchAvailableInstructors = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, role")
      .in("role", ["pastor", "obreiro", "discipulador", "lider"])
      .order("name");

    if (error) {
      console.error("Erro ao carregar professores:", error);
      return;
    }

    setAvailableInstructors((data || []) as Array<{ id: string; name: string; role: string }>);
  };

  const fetchCourseInstructors = async (courseId: string) => {
    if (!courseId || courseId === "all") {
      setInstructors([]);
      return;
    }

    const { data, error } = await (supabase as any)
      .from("course_instructors")
      .select(`
        id,
        course_id,
        instructor_id,
        role,
        is_primary,
        instructor:profiles!course_instructors_instructor_id_fkey(name, role)
      `)
      .eq("course_id", courseId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar professores do curso:", error);
      return;
    }

    const formatted: CourseInstructorItem[] = (data || []).map((item: any) => ({
      id: item.id,
      course_id: item.course_id,
      instructor_id: item.instructor_id,
      role: item.role,
      is_primary: !!item.is_primary,
      instructor_name: item.instructor?.name || "N/A",
      instructor_role: item.instructor?.role || "N/A",
    }));

    setInstructors(formatted);
  };

  useEffect(() => {
    fetchAvailableInstructors();
  }, []);

  useEffect(() => {
    if (selectedCourseId && selectedCourseId !== "all") {
      fetchCourseInstructors(selectedCourseId);
    } else {
      setInstructors([]);
    }
  }, [selectedCourseId]);

  useEffect(() => {
    const fetchMembers = async () => {
      setMembersLoading(true);
      const { data, error } = await supabase
        .from("members")
        .select("id, name, type, active")
        .eq("active", true)
        .order("name", { ascending: true });

      if (error) {
        console.error("Erro ao carregar membros para matrícula:", error);
        setAvailableMembers([]);
      } else {
        setAvailableMembers(
          (data || []).map((member) => ({
            id: member.id,
            name: member.name,
            type: member.type,
          }))
        );
      }
      setMembersLoading(false);
    };

    fetchMembers();
  }, []);

  // Verificações de acesso e loading
  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Acesso Restrito</h3>
              <p className="text-muted-foreground">
                Apenas pastores, obreiros e coordenadores do Trilho do Vencedor podem acessar a administração de cursos.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (coursesLoading) {
    return <FancyLoader message="Organizando os cursos da Videira" tips={tips} />;
  }

  const getSharedContentCourseIds = async (courseId: string): Promise<string[]> => {
    const { data: baseCourse, error: baseCourseError } = await (supabase as any)
      .from("courses")
      .select("id, trilho_nome, semester_label")
      .eq("id", courseId)
      .single();

    if (baseCourseError || !baseCourse) {
      return [courseId];
    }

    if (!baseCourse.trilho_nome || !baseCourse.semester_label) {
      return [courseId];
    }

    const { data: siblingCourses } = await (supabase as any)
      .from("courses")
      .select("id")
      .eq("trilho_nome", baseCourse.trilho_nome)
      .eq("semester_label", baseCourse.semester_label);

    const ids = (siblingCourses || []).map((course: any) => course.id);
    if (!ids.includes(courseId)) {
      ids.push(courseId);
    }

    return Array.from(new Set(ids));
  };

  // Funções para criar módulos
  const handleCreateModule = async () => {
    if (!selectedCourseId || selectedCourseId === "all" || !moduleForm.title.trim()) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      const courseIds = await getSharedContentCourseIds(selectedCourseId);

      const { data: existingModules, error: existingModulesError } = await (supabase as any)
        .from("course_modules")
        .select("order_index")
        .in("course_id", courseIds);

      if (existingModulesError) {
        toast({
          title: "Erro",
          description: "Erro ao carregar módulos existentes.",
          variant: "destructive"
        });
        return;
      }

      const nextOrderIndex =
        (existingModules || []).length > 0
          ? Math.max(...(existingModules || []).map((module: any) => module.order_index || 0)) + 1
          : 1;

      const payload = courseIds.map((courseId) => ({
        course_id: courseId,
        title: moduleForm.title.trim(),
        description: moduleForm.description?.trim() || null,
        order_index: nextOrderIndex,
        duration_hours: moduleForm.duration_hours,
        is_required: moduleForm.is_required,
        prerequisites: moduleForm.prerequisites.length ? moduleForm.prerequisites : null,
        learning_outcomes: moduleForm.learning_outcomes.length ? moduleForm.learning_outcomes : null,
      }));

      const { error } = await (supabase as any).from("course_modules").insert(payload);

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao criar módulo",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Sucesso",
        description:
          courseIds.length > 1
            ? "Módulo criado e sincronizado entre as turmas."
            : "Módulo criado com sucesso!"
      });
      setIsModuleDialogOpen(false);
      setModuleForm({
        title: "",
        description: "",
        duration_hours: 1,
        is_required: true,
        prerequisites: [],
        learning_outcomes: []
      });
      refetchModules();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar módulo",
        variant: "destructive"
      });
    }
  };

  // Funções para criar lições
  const handleCreateLesson = async () => {
    if (!selectedModuleId || !lessonForm.title.trim()) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: selectedModule, error: selectedModuleError } = await (supabase as any)
        .from("course_modules")
        .select(`
          id,
          course_id,
          title,
          description,
          order_index,
          duration_hours,
          is_required,
          prerequisites,
          learning_outcomes
        `)
        .eq("id", selectedModuleId)
        .single();

      if (selectedModuleError || !selectedModule) {
        toast({
          title: "Erro",
          description: "Não foi possível localizar o módulo selecionado.",
          variant: "destructive"
        });
        return;
      }

      const courseIds = await getSharedContentCourseIds(selectedModule.course_id);

      let { data: siblingModules, error: siblingModulesError } = await (supabase as any)
        .from("course_modules")
        .select("id, course_id")
        .in("course_id", courseIds)
        .eq("order_index", selectedModule.order_index);

      if (siblingModulesError) {
        toast({
          title: "Erro",
          description: "Erro ao carregar módulos das turmas.",
          variant: "destructive"
        });
        return;
      }

      const existingCourseIds = new Set((siblingModules || []).map((module: any) => module.course_id));
      const missingCourseIds = courseIds.filter((courseId) => !existingCourseIds.has(courseId));

      if (missingCourseIds.length > 0) {
        const missingPayload = missingCourseIds.map((courseId) => ({
          course_id: courseId,
          title: selectedModule.title,
          description: selectedModule.description,
          order_index: selectedModule.order_index,
          duration_hours: selectedModule.duration_hours,
          is_required: selectedModule.is_required,
          prerequisites: selectedModule.prerequisites,
          learning_outcomes: selectedModule.learning_outcomes,
        }));

        const { error: createMissingModulesError } = await (supabase as any)
          .from("course_modules")
          .insert(missingPayload);

        if (createMissingModulesError) {
          toast({
            title: "Erro",
            description: "Não foi possível sincronizar os módulos das turmas.",
            variant: "destructive"
          });
          return;
        }

        const refreshModulesResult = await (supabase as any)
          .from("course_modules")
          .select("id, course_id")
          .in("course_id", courseIds)
          .eq("order_index", selectedModule.order_index);

        siblingModules = refreshModulesResult.data || [];
        siblingModulesError = refreshModulesResult.error;
      }

      if (siblingModulesError) {
        toast({
          title: "Erro",
          description: "Erro ao sincronizar os módulos.",
          variant: "destructive"
        });
        return;
      }

      const moduleIds = (siblingModules || []).map((module: any) => module.id);

      const { data: existingLessons, error: existingLessonsError } = await (supabase as any)
        .from("course_lessons")
        .select("order_index")
        .in("module_id", moduleIds);

      if (existingLessonsError) {
        toast({
          title: "Erro",
          description: "Erro ao carregar lições existentes.",
          variant: "destructive"
        });
        return;
      }

      const nextOrderIndex =
        (existingLessons || []).length > 0
          ? Math.max(...(existingLessons || []).map((lesson: any) => lesson.order_index || 0)) + 1
          : 1;

      const payload = moduleIds.map((moduleId) => ({
        module_id: moduleId,
        title: lessonForm.title.trim(),
        description: lessonForm.description?.trim() || null,
        lesson_type: lessonForm.lesson_type,
        scheduled_date: lessonForm.scheduled_date || null,
        start_time: lessonForm.start_time || null,
        end_time: lessonForm.end_time || null,
        location: lessonForm.location?.trim() || null,
        materials: lessonForm.materials.length ? lessonForm.materials : null,
        homework: lessonForm.homework?.trim() || null,
        is_mandatory: lessonForm.is_mandatory,
        order_index: nextOrderIndex,
      }));

      const { error } = await (supabase as any).from("course_lessons").insert(payload);

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao criar lição",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Sucesso",
        description:
          moduleIds.length > 1
            ? "Lição criada e sincronizada entre as turmas."
            : "Lição criada com sucesso!"
      });
      setIsLessonDialogOpen(false);
      setLessonForm({
        title: "",
        description: "",
        lesson_type: "classroom",
        scheduled_date: "",
        start_time: "",
        end_time: "",
        location: "",
        materials: [],
        homework: "",
        is_mandatory: true
      });
      refetchLessons();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar lição",
        variant: "destructive"
      });
    }
  };

  const handleAddInstructor = async () => {
    if (!selectedCourseId || selectedCourseId === "all" || !selectedInstructorId) {
      toast({
        title: "Erro",
        description: "Selecione o curso e o professor.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await (supabase as any).from("course_instructors").insert({
      course_id: selectedCourseId,
      instructor_id: selectedInstructorId,
      role: selectedInstructorRole,
      is_primary: false,
    });

    if (error) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível adicionar o professor.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Sucesso",
      description: "Professor adicionado ao curso.",
    });
    setSelectedInstructorId("");
    setSelectedInstructorRole("instructor");
    setIsInstructorDialogOpen(false);
    fetchCourseInstructors(selectedCourseId);
  };

  const handleManageCourse = (courseId: string) => {
    setSelectedCourseId(courseId);
    setSelectedModuleId("");
    setSelectedLessonId("");
    setActiveTab("modules");
    setTimeout(() => {
      tabsContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  const handleOpenEditCourse = (course: any) => {
    setEditingCourseId(course.id);
    setEditCourseForm({
      name: course.name || "",
      description: course.description || "",
      duration_weeks: String(course.duration_weeks || 24),
      max_students: course.max_students != null ? String(course.max_students) : "",
      status: course.status || "active",
      category: course.category || "spiritual",
      semester_label: course.semester_label || "",
      trilho_nome: course.trilho_nome || "",
      turma_dia: course.turma_dia || "",
    });
    setIsEditCourseDialogOpen(true);
  };

  const handleUpdateCourse = async () => {
    if (!editingCourseId) return;
    if (!editCourseForm.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome do curso é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingCourse(true);
    try {
      await coursesService.updateCourse(editingCourseId, {
        name: editCourseForm.name.trim(),
        description: editCourseForm.description.trim() || null,
        duration_weeks: Math.max(1, Number(editCourseForm.duration_weeks) || 1),
        max_students: editCourseForm.max_students.trim() === "" ? null : Number(editCourseForm.max_students),
        status: editCourseForm.status as any,
        category: editCourseForm.category as any,
        semester_label: editCourseForm.semester_label.trim() || null,
        trilho_nome: editCourseForm.trilho_nome.trim() === "" ? null : (editCourseForm.trilho_nome as any),
        turma_dia: editCourseForm.turma_dia.trim() === "" ? null : (editCourseForm.turma_dia as any),
      });

      toast({
        title: "Sucesso",
        description: "Curso atualizado com sucesso.",
      });

      setIsEditCourseDialogOpen(false);
      setEditingCourseId(null);
      refetchCourses();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível atualizar o curso.",
        variant: "destructive",
      });
    } finally {
      setIsSavingCourse(false);
    }
  };

  const handleDeleteCourse = async (courseId: string, courseName: string) => {
    const confirmed = window.confirm(`Deseja excluir o curso \"${courseName}\"?`);
    if (!confirmed) return;

    try {
      await coursesService.deleteCourse(courseId);

      toast({
        title: "Sucesso",
        description: "Curso excluído com sucesso.",
      });

      if (selectedCourseId === courseId) {
        setSelectedCourseId("all");
        setSelectedModuleId("");
        setSelectedLessonId("");
      }

      refetchCourses();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível excluir o curso.",
        variant: "destructive",
      });
    }
  };

  const handleCourseChange = (courseId: string) => {
    setSelectedCourseId(courseId);
    setSelectedModuleId("");
    setSelectedLessonId("");
  };

  const handleCreateRegistration = async () => {
    if (!registrationForm.memberId || !registrationForm.courseId) {
      toast({
        title: "Erro",
        description: "Selecione membro e curso para concluir a matrícula.",
        variant: "destructive",
      });
      return;
    }

    if (registrationForm.trilho && !registrationForm.turmaDia) {
      toast({
        title: "Erro",
        description: "Selecione o dia da turma (domingo ou terça).",
        variant: "destructive",
      });
      return;
    }

    const selectedCourseData = courses.find((course) => course.id === registrationForm.courseId);
    if (!selectedCourseData || !user) {
      toast({
        title: "Erro",
        description: "Não foi possível localizar o curso selecionado.",
        variant: "destructive",
      });
      return;
    }

    try {
      const totalAmount = Number(registrationForm.amount || 0);
      await coursesService.createCourseRegistration({
        course_id: registrationForm.courseId,
        student_id: registrationForm.memberId,
        leader_id: user.id,
        registration_date: new Date().toISOString().slice(0, 10),
        status: "enrolled",
        payment_status: totalAmount > 0 ? "pending" : "paid",
        total_amount: totalAmount,
        paid_amount: 0,
        scholarship_amount: 0,
        payment_plan: "full",
        installment_count: 1,
        notes: null,
        emergency_contact: null,
        medical_info: null,
        special_needs: null,
        approved_by: null,
        approved_at: null,
        completed_at: null,
        semester_label: selectedCourseData.semester_label || null,
        trilho_nome: selectedCourseData.trilho_nome || null,
        turma_dia: selectedCourseData.turma_dia || null,
      });

      toast({
        title: "Sucesso",
        description: "Matrícula realizada com sucesso.",
      });

      setIsRegistrationDialogOpen(false);
      setRegistrationForm({
        memberId: "",
        trilho: "",
        turmaDia: "",
        courseId: "",
        amount: "",
      });
      refetchRegistrations();
    } catch (error: any) {
      const isTurmaConflict =
        String(error?.message || "").includes("uq_course_registrations_student_semester_trilho");

      toast({
        title: "Erro",
        description: isTurmaConflict
          ? "Este aluno já está matriculado neste trilho no semestre atual. Escolha apenas domingo ou terça."
          : error?.message || "Não foi possível concluir a matrícula.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveInstructor = async (instructorEntryId: string) => {
    const confirmed = window.confirm("Deseja remover este professor do curso?");
    if (!confirmed) return;

    const { error } = await (supabase as any)
      .from("course_instructors")
      .delete()
      .eq("id", instructorEntryId);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível remover o professor.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Sucesso",
      description: "Professor removido do curso.",
    });
    if (selectedCourseId && selectedCourseId !== "all") {
      fetchCourseInstructors(selectedCourseId);
    }
  };

  // Função para marcar presença
  const handleMarkAttendance = async () => {
    if (!selectedLessonId) {
      toast({
        title: "Erro",
        description: "Selecione uma lição",
        variant: "destructive"
      });
      return;
    }

    try {
      for (const [registrationId, checked] of Object.entries(attendanceForm)) {
        await markAttendance({
          lesson_id: selectedLessonId,
          registration_id: registrationId,
          status: checked ? "present" : "absent",
          marked_by: user?.id,
          marked_at: new Date().toISOString()
        });
      }

      toast({
        title: "Sucesso",
        description: "Presenças marcadas com sucesso!"
      });
      setIsAttendanceDialogOpen(false);
      setAttendanceForm({});
      refetchAttendance();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao marcar presenças",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Administração de Cursos
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Trilho do Vencedor (semestral): Ceifeiros e CTL, turmas de domingo e terça
          </p>
        </div>

      </div>

      <Dialog open={isEditCourseDialogOpen} onOpenChange={setIsEditCourseDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Curso</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-course-name">Nome do curso</Label>
              <Input
                id="edit-course-name"
                value={editCourseForm.name}
                onChange={(e) => setEditCourseForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Nome do curso"
              />
            </div>

            <div>
              <Label htmlFor="edit-course-description">Descrição</Label>
              <Textarea
                id="edit-course-description"
                value={editCourseForm.description}
                onChange={(e) => setEditCourseForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição do curso"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-course-duration">Duração (semanas)</Label>
                <Input
                  id="edit-course-duration"
                  type="number"
                  min={1}
                  value={editCourseForm.duration_weeks}
                  onChange={(e) => setEditCourseForm((prev) => ({ ...prev, duration_weeks: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-course-max-students">Máximo de alunos</Label>
                <Input
                  id="edit-course-max-students"
                  type="number"
                  min={1}
                  value={editCourseForm.max_students}
                  onChange={(e) => setEditCourseForm((prev) => ({ ...prev, max_students: e.target.value }))}
                  placeholder="Deixe vazio para ilimitado"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Select
                  value={editCourseForm.status}
                  onValueChange={(value) => setEditCourseForm((prev) => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="paused">Pausado</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Categoria</Label>
                <Select
                  value={editCourseForm.category}
                  onValueChange={(value) => setEditCourseForm((prev) => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spiritual">Spiritual</SelectItem>
                    <SelectItem value="leadership">Leadership</SelectItem>
                    <SelectItem value="ministry">Ministry</SelectItem>
                    <SelectItem value="biblical">Biblical</SelectItem>
                    <SelectItem value="practical">Practical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-course-semester">Semestre</Label>
                <Input
                  id="edit-course-semester"
                  value={editCourseForm.semester_label}
                  onChange={(e) => setEditCourseForm((prev) => ({ ...prev, semester_label: e.target.value }))}
                  placeholder="Ex: 2026-1"
                />
              </div>
              <div>
                <Label>Trilho</Label>
                <Select
                  value={editCourseForm.trilho_nome || "none"}
                  onValueChange={(value) =>
                    setEditCourseForm((prev) => ({ ...prev, trilho_nome: value === "none" ? "" : value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    <SelectItem value="ceifeiros">Ceifeiros</SelectItem>
                    <SelectItem value="ctl">CTL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Turma</Label>
                <Select
                  value={editCourseForm.turma_dia || "none"}
                  onValueChange={(value) =>
                    setEditCourseForm((prev) => ({ ...prev, turma_dia: value === "none" ? "" : value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    <SelectItem value="domingo">Domingo</SelectItem>
                    <SelectItem value="terca">Terça</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleUpdateCourse} disabled={isSavingCourse} className="flex-1">
                {isSavingCourse ? "Salvando..." : "Salvar alterações"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditCourseDialogOpen(false);
                  setEditingCourseId(null);
                }}
                disabled={isSavingCourse}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Estatísticas */}
      {attendanceStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-600">Total de Lições</CardTitle>
              <div className="p-2 bg-blue-100 rounded-full">
                <BookOpen className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-700">
                {attendanceStats.totalLessons}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Lições programadas
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-600">Taxa de Presença</CardTitle>
              <div className="p-2 bg-green-100 rounded-full">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700">
                {attendanceStats.attendanceRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Média de presença
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-600">Presentes</CardTitle>
              <div className="p-2 bg-purple-100 rounded-full">
                <UserCheck className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-700">
                {attendanceStats.presentCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total de presenças
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-600">Faltas</CardTitle>
              <div className="p-2 bg-orange-100 rounded-full">
                <UserX className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-700">
                {attendanceStats.absentCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total de faltas
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar cursos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status do curso" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedCourseId} onValueChange={handleCourseChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar curso" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os cursos</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {!hasSelectedCourse ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Selecione um curso para liberar módulos, professores, lições, presença e matrículas.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {hasSelectedCourse && selectedCourse ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Curso selecionado</p>
                <h3 className="text-lg font-semibold">{selectedCourse.name}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="gap-1" onClick={() => handleOpenEditCourse(selectedCourse)}>
                  <Edit className="w-3.5 h-3.5" />
                  Editar curso
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-red-600 hover:text-red-700"
                  onClick={() => handleDeleteCourse(selectedCourse.id, selectedCourse.name)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Excluir curso
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Conteúdo principal */}
      <div ref={tabsContainerRef}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="courses">Cursos</TabsTrigger>
          <TabsTrigger value="modules">Módulos</TabsTrigger>
          <TabsTrigger value="instructors">Professores</TabsTrigger>
          <TabsTrigger value="lessons">Lições</TabsTrigger>
          <TabsTrigger value="attendance">Presença</TabsTrigger>
          <TabsTrigger value="registrations">Matrículas</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        {/* Aba de Cursos */}
        <TabsContent value="courses">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Cursos Disponíveis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCourses.map((course) => (
                  <Card key={course.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{course.name}</CardTitle>
                        <Badge 
                          variant={course.status === 'active' ? 'default' : 'secondary'}
                          className={cn(
                            course.status === 'active' && 'bg-green-100 text-green-800',
                            course.status === 'draft' && 'bg-yellow-100 text-yellow-800',
                            course.status === 'completed' && 'bg-blue-100 text-blue-800'
                          )}
                        >
                          {course.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        {course.description}
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4" />
                          <span>{course.duration_weeks} semanas</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4" />
                          <span>Até {course.max_students || '∞'} alunos</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <GraduationCap className="w-4 h-4" />
                          <span>{course.category}</span>
                        </div>
                        {course.trilho_nome && course.turma_dia && (
                          <div className="flex items-center gap-2 text-sm">
                            <Badge variant="outline" className="text-xs">
                              {course.trilho_nome.toUpperCase()} - {course.turma_dia === "domingo" ? "Domingo" : "Terça"}
                            </Badge>
                            {course.semester_label ? (
                              <Badge variant="secondary" className="text-xs">
                                Semestre {course.semester_label}
                              </Badge>
                            ) : null}
                          </div>
                        )}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleManageCourse(course.id)}
                        >
                          Gerenciar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => handleOpenEditCourse(course)}
                        >
                          <Edit className="w-3.5 h-3.5" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteCourse(course.id, course.name)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Excluir
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Módulos */}
        <TabsContent value="modules">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Módulos do Curso
              </CardTitle>
              <Dialog open={isModuleDialogOpen} onOpenChange={setIsModuleDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2" disabled={!hasSelectedCourse}>
                    <Plus className="w-4 h-4" />
                    Novo Módulo
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Criar Novo Módulo</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="moduleTitle">Título do Módulo</Label>
                      <Input
                        id="moduleTitle"
                        value={moduleForm.title}
                        onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                        placeholder="Ex: Fundamentos da Fé"
                      />
                    </div>
                    <div>
                      <Label htmlFor="moduleDescription">Descrição</Label>
                      <Textarea
                        id="moduleDescription"
                        value={moduleForm.description}
                        onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                        placeholder="Descreva o conteúdo do módulo..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="moduleDuration">Duração (horas)</Label>
                        <Input
                          id="moduleDuration"
                          type="number"
                          value={moduleForm.duration_hours}
                          onChange={(e) => setModuleForm({ ...moduleForm, duration_hours: Number(e.target.value) })}
                        />
                      </div>
                      <div className="flex items-center space-x-2 pt-6">
                        <Switch
                          id="moduleRequired"
                          checked={moduleForm.is_required}
                          onCheckedChange={(checked) => setModuleForm({ ...moduleForm, is_required: checked })}
                        />
                        <Label htmlFor="moduleRequired">Módulo obrigatório</Label>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleCreateModule} className="flex-1">
                        Criar Módulo
                      </Button>
                      <Button variant="outline" onClick={() => setIsModuleDialogOpen(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {modulesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Carregando módulos...</p>
                </div>
              ) : modules.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum módulo encontrado</p>
                  <p className="text-sm text-muted-foreground">Selecione um curso para ver os módulos</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {modules.map((module) => (
                    <Card key={module.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold">{module.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {module.description}
                            </p>
                            <div className="flex items-center gap-4 mt-2">
                              <Badge variant="outline" className="text-xs">
                                <Clock className="w-3 h-3 mr-1" />
                                {module.duration_hours}h
                              </Badge>
                              {module.is_required && (
                                <Badge variant="default" className="text-xs">
                                  Obrigatório
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setSelectedModuleId(module.id)}
                            >
                              Ver Lições
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Professores */}
        <TabsContent value="instructors">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Professores do Curso
              </CardTitle>
              <Dialog open={isInstructorDialogOpen} onOpenChange={setIsInstructorDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2" disabled={!selectedCourseId || selectedCourseId === "all"}>
                    <Plus className="w-4 h-4" />
                    Adicionar Professor
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Adicionar Professor</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Professor</Label>
                      <Select value={selectedInstructorId} onValueChange={setSelectedInstructorId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o professor" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableInstructors.map((instructor) => (
                            <SelectItem key={instructor.id} value={instructor.id}>
                              {instructor.name} ({instructor.role})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Função</Label>
                      <Select
                        value={selectedInstructorRole}
                        onValueChange={(value: "instructor" | "assistant" | "mentor" | "evaluator") =>
                          setSelectedInstructorRole(value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="instructor">Professor</SelectItem>
                          <SelectItem value="assistant">Assistente</SelectItem>
                          <SelectItem value="mentor">Mentor</SelectItem>
                          <SelectItem value="evaluator">Avaliador</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleAddInstructor} className="flex-1">
                        Salvar Professor
                      </Button>
                      <Button variant="outline" onClick={() => setIsInstructorDialogOpen(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {!selectedCourseId || selectedCourseId === "all" ? (
                <p className="text-muted-foreground">Selecione um curso para gerenciar os professores.</p>
              ) : instructors.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum professor vinculado.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Papel no Sistema</TableHead>
                      <TableHead>Função no Curso</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {instructors.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.instructor_name}</TableCell>
                        <TableCell>{item.instructor_role}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {item.role === "instructor" && "Professor"}
                            {item.role === "assistant" && "Assistente"}
                            {item.role === "mentor" && "Mentor"}
                            {item.role === "evaluator" && "Avaliador"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRemoveInstructor(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Lições */}
        <TabsContent value="lessons">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Lições do Módulo
              </CardTitle>
              <Dialog open={isLessonDialogOpen} onOpenChange={setIsLessonDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2" disabled={!hasSelectedModule}>
                    <Plus className="w-4 h-4" />
                    Nova Lição
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Criar Nova Lição</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="lessonTitle">Título da Lição</Label>
                      <Input
                        id="lessonTitle"
                        value={lessonForm.title}
                        onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                        placeholder="Ex: A Trindade"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lessonDescription">Descrição</Label>
                      <Textarea
                        id="lessonDescription"
                        value={lessonForm.description}
                        onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                        placeholder="Descreva o conteúdo da lição..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="lessonType">Tipo de Lição</Label>
                        <Select value={lessonForm.lesson_type} onValueChange={(value: any) => setLessonForm({ ...lessonForm, lesson_type: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="classroom">Presencial</SelectItem>
                            <SelectItem value="online">Online</SelectItem>
                            <SelectItem value="practical">Prática</SelectItem>
                            <SelectItem value="field_work">Campo</SelectItem>
                            <SelectItem value="assessment">Avaliação</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="lessonLocation">Local</Label>
                        <Input
                          id="lessonLocation"
                          value={lessonForm.location}
                          onChange={(e) => setLessonForm({ ...lessonForm, location: e.target.value })}
                          placeholder="Ex: Sala 1, Igreja"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="lessonDate">Data</Label>
                        <Input
                          id="lessonDate"
                          type="date"
                          value={lessonForm.scheduled_date}
                          onChange={(e) => setLessonForm({ ...lessonForm, scheduled_date: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="lessonStartTime">Início</Label>
                          <Input
                            id="lessonStartTime"
                            type="time"
                            value={lessonForm.start_time}
                            onChange={(e) => setLessonForm({ ...lessonForm, start_time: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="lessonEndTime">Fim</Label>
                          <Input
                            id="lessonEndTime"
                            type="time"
                            value={lessonForm.end_time}
                            onChange={(e) => setLessonForm({ ...lessonForm, end_time: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="lessonMandatory"
                        checked={lessonForm.is_mandatory}
                        onCheckedChange={(checked) => setLessonForm({ ...lessonForm, is_mandatory: checked })}
                      />
                      <Label htmlFor="lessonMandatory">Lição obrigatória</Label>
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleCreateLesson} className="flex-1">
                        Criar Lição
                      </Button>
                      <Button variant="outline" onClick={() => setIsLessonDialogOpen(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {lessonsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Carregando lições...</p>
                </div>
              ) : lessons.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhuma lição encontrada</p>
                  <p className="text-sm text-muted-foreground">Selecione um módulo para ver as lições</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {lessons.map((lesson) => (
                    <Card key={lesson.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold">{lesson.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {lesson.description}
                            </p>
                            <div className="flex items-center gap-4 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {lesson.lesson_type === 'classroom' && 'Presencial'}
                                {lesson.lesson_type === 'online' && 'Online'}
                                {lesson.lesson_type === 'practical' && 'Prática'}
                                {lesson.lesson_type === 'field_work' && 'Campo'}
                                {lesson.lesson_type === 'assessment' && 'Avaliação'}
                              </Badge>
                              {lesson.scheduled_date && (
                                <Badge variant="outline" className="text-xs">
                                  <CalendarIcon className="w-3 h-3 mr-1" />
                                  {format(parseISO(lesson.scheduled_date), 'dd/MM/yyyy', { locale: ptBR })}
                                </Badge>
                              )}
                              {lesson.start_time && lesson.end_time && (
                                <Badge variant="outline" className="text-xs">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {lesson.start_time} - {lesson.end_time}
                                </Badge>
                              )}
                              {lesson.location && (
                                <Badge variant="outline" className="text-xs">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  {lesson.location}
                                </Badge>
                              )}
                              {lesson.is_mandatory && (
                                <Badge variant="default" className="text-xs">
                                  Obrigatória
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedLessonId(lesson.id);
                                setIsAttendanceDialogOpen(true);
                              }}
                            >
                              Marcar Presença
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Presença */}
        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                Lista de Presença
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Dialog open={isAttendanceDialogOpen} onOpenChange={setIsAttendanceDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Marcar Presença</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {registrations.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Nenhuma matrícula encontrada</p>
                        <p className="text-sm text-muted-foreground">Selecione um curso para ver as matrículas</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Aluno</TableHead>
                            <TableHead>Curso</TableHead>
                            <TableHead>Faltas</TableHead>
                            <TableHead>Situação</TableHead>
                            <TableHead className="text-center">Presente</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {registrations.map((registration) => (
                            <TableRow key={registration.id}>
                              <TableCell className="font-medium">
                                {registration.members?.name || 'N/A'}
                              </TableCell>
                              <TableCell>
                                {registration.courses?.name || 'N/A'}
                              </TableCell>
                              <TableCell>
                                {absencesByStudentId.get(registration.student_id) || 0}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={(absencesByStudentId.get(registration.student_id) || 0) >= 4 ? "destructive" : "secondary"}
                                >
                                  {(absencesByStudentId.get(registration.student_id) || 0) >= 4 ? "Reprovado" : "Em curso"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Checkbox
                                  checked={
                                    attendanceForm[registration.id] ??
                                    (currentAttendanceByRegistration.get(registration.id) || false)
                                  }
                                  onCheckedChange={(checked) =>
                                    setAttendanceForm((prev) => ({
                                      ...prev,
                                      [registration.id]: checked === true,
                                    }))
                                  }
                                  aria-label={`Presença de ${registration.members?.name || "aluno"}`}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleMarkAttendance} className="flex-1">
                        Salvar Presenças
                      </Button>
                      <Button variant="outline" onClick={() => setIsAttendanceDialogOpen(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Lista de presença atual */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Presenças Registradas</h3>
                {attendanceLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-muted-foreground mt-2">Carregando presenças...</p>
                  </div>
                ) : attendance.length === 0 ? (
                  <div className="text-center py-8">
                    <UserCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhuma presença registrada</p>
                    <p className="text-sm text-muted-foreground">Selecione uma lição para ver as presenças</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {attendance.map((entry) => (
                      <Card key={entry.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-3 h-3 rounded-full",
                              entry.status === 'present' && "bg-green-500",
                              entry.status === 'absent' && "bg-red-500",
                              entry.status === 'late' && "bg-orange-500",
                              entry.status === 'excused' && "bg-blue-500",
                              entry.status === 'makeup' && "bg-purple-500"
                            )} />
                            <div>
                              <p className="font-medium">
                                {entry.course_registrations?.members?.name || 'N/A'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {entry.course_lessons?.title || 'N/A'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline"
                              className={cn(
                                entry.status === 'present' && "border-green-500 text-green-700",
                                entry.status === 'absent' && "border-red-500 text-red-700",
                                entry.status === 'late' && "border-orange-500 text-orange-700",
                                entry.status === 'excused' && "border-blue-500 text-blue-700",
                                entry.status === 'makeup' && "border-purple-500 text-purple-700"
                              )}
                            >
                              {entry.status === 'present' && 'Presente'}
                              {entry.status === 'absent' && 'Ausente'}
                              {entry.status === 'late' && 'Atrasado'}
                              {entry.status === 'excused' && 'Justificado'}
                              {entry.status === 'makeup' && 'Reposição'}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {format(parseISO(entry.marked_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </span>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Matrículas */}
        <TabsContent value="registrations">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Matrículas dos Cursos
              </CardTitle>
              <Dialog open={isRegistrationDialogOpen} onOpenChange={setIsRegistrationDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Nova Matrícula
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Nova Matrícula</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Membro</Label>
                      <Select
                        value={registrationForm.memberId}
                        onValueChange={(value) => setRegistrationForm((prev) => ({ ...prev, memberId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={membersLoading ? "Carregando membros..." : "Selecione o membro"} />
                        </SelectTrigger>
                        <SelectContent>
                          {!membersLoading && availableMembers.length === 0 ? (
                            <SelectItem value="no-members" disabled>
                              Nenhum membro disponível
                            </SelectItem>
                          ) : null}
                          {availableMembers.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.name} - {member.type === "member" ? "Membro" : "Frequentador"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Trilho</Label>
                      <Select
                        value={registrationForm.trilho || "all"}
                        onValueChange={(value) =>
                          setRegistrationForm((prev) => ({
                            ...prev,
                            trilho: value === "all" ? "" : value,
                            courseId: "",
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o trilho" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          {trilhoOptions.includes("ceifeiros") ? (
                            <SelectItem value="ceifeiros">Ceifeiros</SelectItem>
                          ) : null}
                          {trilhoOptions.includes("ctl") ? (
                            <SelectItem value="ctl">CTL</SelectItem>
                          ) : null}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Dia da turma</Label>
                      <Select
                        value={registrationForm.turmaDia || "all"}
                        onValueChange={(value) =>
                          setRegistrationForm((prev) => ({
                            ...prev,
                            turmaDia: value === "all" ? "" : value,
                            courseId: "",
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Escolha domingo ou terça" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="domingo">Domingo</SelectItem>
                          <SelectItem value="terca">Terça</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Curso</Label>
                      <Select
                        value={registrationForm.courseId}
                        onValueChange={(value) => setRegistrationForm((prev) => ({ ...prev, courseId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o curso" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredRegistrationCourses.map((course) => (
                            <SelectItem key={course.id} value={course.id}>
                              {course.name}
                              {course.turma_dia === "domingo" ? " (Domingo)" : ""}
                              {course.turma_dia === "terca" ? " (Terça)" : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="registrationAmount">Valor (R$)</Label>
                      <Input
                        id="registrationAmount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={registrationForm.amount}
                        onChange={(e) => setRegistrationForm((prev) => ({ ...prev, amount: e.target.value }))}
                        placeholder="0,00"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" className="flex-1" onClick={() => setIsRegistrationDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button className="flex-1" onClick={handleCreateRegistration}>
                        Matricular
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {registrationsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Carregando matrículas...</p>
                </div>
              ) : filteredRegistrations.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhuma matrícula encontrada</p>
                  <p className="text-sm text-muted-foreground">Selecione um curso para ver as matrículas</p>
                </div>
              ) : (
                <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Aluno</TableHead>
                        <TableHead>Curso</TableHead>
                        <TableHead>Líder</TableHead>
                        <TableHead>Faltas</TableHead>
                        <TableHead>Situação</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Pagamento</TableHead>
                        <TableHead>Data de Matrícula</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRegistrations.map((registration) => (
                      <TableRow key={registration.id}>
                        <TableCell className="font-medium">
                          {registration.members?.name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {registration.courses?.name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {registration.profiles?.name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {absencesByStudentId.get(registration.student_id) || 0}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={(absencesByStudentId.get(registration.student_id) || 0) >= 4 ? "destructive" : "secondary"}
                          >
                            {(absencesByStudentId.get(registration.student_id) || 0) >= 4 ? "Reprovado" : "Em curso"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              registration.status === 'enrolled' ? 'default' :
                              registration.status === 'pending' ? 'secondary' :
                              registration.status === 'completed' ? 'outline' : 'destructive'
                            }
                          >
                            {registration.status === 'enrolled' && 'Matriculado'}
                            {registration.status === 'pending' && 'Pendente'}
                            {registration.status === 'completed' && 'Concluído'}
                            {registration.status === 'dropped' && 'Desistente'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              registration.payment_status === 'paid' ? 'default' :
                              registration.payment_status === 'partial' ? 'secondary' : 'destructive'
                            }
                          >
                            {registration.payment_status === 'paid' && 'Pago'}
                            {registration.payment_status === 'partial' && 'Parcial'}
                            {registration.payment_status === 'pending' && 'Pendente'}
                            {registration.payment_status === 'refunded' && 'Reembolsado'}
                            {registration.payment_status === 'cancelled' && 'Cancelado'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(parseISO(registration.registration_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Relatórios */}
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Relatórios de Presença
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lessonAttendanceLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Carregando relatórios...</p>
                </div>
              ) : lessonAttendance.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum relatório disponível</p>
                  <p className="text-sm text-muted-foreground">Selecione um curso para ver os relatórios</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {lessonAttendance.map((lesson) => (
                    <Card key={lesson.lessonId} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold">{lesson.lessonTitle}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {lesson.scheduledDate && format(parseISO(lesson.scheduledDate), 'dd/MM/yyyy', { locale: ptBR })}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">{lesson.attendance.present}</div>
                              <div className="text-xs text-muted-foreground">Presentes</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-red-600">{lesson.attendance.absent}</div>
                              <div className="text-xs text-muted-foreground">Faltas</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-orange-600">{lesson.attendance.late}</div>
                              <div className="text-xs text-muted-foreground">Atrasos</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600">{lesson.attendanceRate.toFixed(1)}%</div>
                              <div className="text-xs text-muted-foreground">Presença</div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}



