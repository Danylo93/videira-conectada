import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import FancyLoader from "@/components/FancyLoader";
import { 
  GraduationCap, 
  BookOpen, 
  Users, 
  Calendar as CalendarIcon, 
  Check, 
  X, 
  Clock, 
  MapPin,
  UserCheck,
  UserX,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  Download,
  Filter,
  Search,
  TrendingUp,
  BarChart3,
  FileText,
  Settings
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { 
  useCourses, 
  useCourse, 
  useCourseModules, 
  useCourseLessons, 
  useCourseRegistrations, 
  useCourseAttendance, 
  useAttendanceStats,
  useLessonAttendance
} from "@/hooks/useCourses";
import { Course, CourseModule, CourseLesson, CourseRegistration, CourseAttendance } from "@/types/course";

const tips = [
  'Organizando os cursos como Moisés organizou o povo no deserto...',
  'Marcando presenças com a precisão de um cronômetro suíço...',
  'Preparando líderes como Davi preparou seus valentes...',
];

export default function CourseAdminNew() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Estados principais
  const [selectedCourseId, setSelectedCourseId] = useState<string>("all");
  const [selectedModuleId, setSelectedModuleId] = useState<string>("");
  const [selectedLessonId, setSelectedLessonId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Estados para diálogos
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);
  const [isRegistrationDialogOpen, setIsRegistrationDialogOpen] = useState(false);

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

  const [attendanceForm, setAttendanceForm] = useState<Record<string, string>>({});

  // Verificar se é pastor ou obreiro
  const isAuthorized = user?.role === "pastor" || user?.role === "obreiro";

  // Hooks para dados
  const { courses, loading: coursesLoading } = useCourses();
  const { course, loading: courseLoading } = useCourse(selectedCourseId && selectedCourseId !== "all" ? selectedCourseId : "");
  const { modules, loading: modulesLoading, refetch: refetchModules } = useCourseModules(selectedCourseId && selectedCourseId !== "all" ? selectedCourseId : "");
  const { lessons, loading: lessonsLoading, refetch: refetchLessons } = useCourseLessons(selectedModuleId && selectedModuleId.trim() !== "" ? selectedModuleId : "");
  const { registrations, loading: registrationsLoading, refetch: refetchRegistrations } = useCourseRegistrations(selectedCourseId && selectedCourseId !== "all" ? selectedCourseId : undefined);
  const { attendance, loading: attendanceLoading, markAttendance, refetch: refetchAttendance } = useCourseAttendance(
    selectedLessonId && selectedLessonId.trim() !== "" ? { lesson_id: selectedLessonId } : undefined
  );
  const { stats: attendanceStats, loading: statsLoading } = useAttendanceStats(selectedCourseId && selectedCourseId !== "all" ? selectedCourseId : undefined);
  const { lessons: lessonAttendance, loading: lessonAttendanceLoading } = useLessonAttendance(selectedCourseId && selectedCourseId !== "all" ? selectedCourseId : undefined);

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
                Apenas pastores e obreiros podem acessar a administração de cursos.
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
      // Implementar criação do módulo
      toast({
        title: "Sucesso",
        description: "Módulo criado com sucesso!"
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
      // Implementar criação da lição
      toast({
        title: "Sucesso",
        description: "Lição criada com sucesso!"
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
      for (const [registrationId, status] of Object.entries(attendanceForm)) {
        if (status) {
          await markAttendance({
            lesson_id: selectedLessonId,
            registration_id: registrationId,
            status: status as any,
            marked_by: user?.id,
            marked_at: new Date().toISOString()
          });
        }
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
            Sistema completo de gestão de cursos CTL e Maturidade no Espírito
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Exportar
          </Button>
          <Button className="gradient-primary gap-2">
            <Plus className="w-4 h-4" />
            Novo Curso
          </Button>
        </div>
      </div>

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

            <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
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
        </CardContent>
      </Card>

      {/* Conteúdo principal */}
      <Tabs defaultValue="courses" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="courses">Cursos</TabsTrigger>
          <TabsTrigger value="modules">Módulos</TabsTrigger>
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
                  <Card key={course.id} className="hover:shadow-lg transition-shadow cursor-pointer">
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
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setSelectedCourseId(course.id)}
                        >
                          Gerenciar
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4" />
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
                  <Button size="sm" className="gap-2">
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
                            <Button size="sm" variant="outline">
                              <Edit className="w-4 h-4" />
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
                  <Button size="sm" className="gap-2">
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
                            <Button size="sm" variant="outline">
                              <Edit className="w-4 h-4" />
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
                            <TableHead>Status</TableHead>
                            <TableHead className="text-center">Presença</TableHead>
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
                              <TableCell className="text-center">
                                <Select
                                  value={attendanceForm[registration.id] || ''}
                                  onValueChange={(value) => setAttendanceForm({
                                    ...attendanceForm,
                                    [registration.id]: value
                                  })}
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue placeholder="Status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="present">
                                      <div className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-green-600" />
                                        Presente
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="absent">
                                      <div className="flex items-center gap-2">
                                        <X className="w-4 h-4 text-red-600" />
                                        Ausente
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="late">
                                      <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-orange-600" />
                                        Atrasado
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="excused">
                                      <div className="flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-blue-600" />
                                        Justificado
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="makeup">
                                      <div className="flex items-center gap-2">
                                        <CalendarIcon className="w-4 h-4 text-purple-600" />
                                        Reposição
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
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
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Matrículas dos Cursos
              </CardTitle>
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
                      <TableHead>Status</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead>Data de Matrícula</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
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
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="outline">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Trash2 className="w-4 h-4" />
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
  );
}
