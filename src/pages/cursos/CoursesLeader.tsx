// Enhanced Course System - Leader Page
// Course enrollment and progress interface for leaders

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCourses, useCourseAccess } from '@/hooks/useCourses';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import FancyLoader from '@/components/FancyLoader';
import { CourseCard } from '@/components/courses/CourseCard';
import { 
  Search, 
  BookOpen, 
  Users, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Award,
  GraduationCap,
  Target,
  Plus,
  DollarSign,
  UserPlus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Course, CourseFilters } from '@/types/course';

const tips = [
  'Escolhendo os melhores cursos para seus membros...',
  'Acompanhando o crescimento espiritual da célula...',
  'Motivando cada membro a se desenvolver...',
  'Preparando relatórios de progresso...',
  'Abençoando cada aluno com dedicação...',
];

export default function CoursesLeader() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { canViewCourses, canEnrollStudents } = useCourseAccess();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [showEnrollmentDialog, setShowEnrollmentDialog] = useState(false);
  const [enrollmentData, setEnrollmentData] = useState({
    memberId: '',
    courseId: '',
    paymentMethod: 'pix',
    amount: '',
  });

  const filters = useMemo((): CourseFilters => ({
    search: searchTerm || undefined,
    category: categoryFilter && categoryFilter !== 'all' ? categoryFilter : undefined,
    status: statusFilter && statusFilter !== 'all' ? statusFilter : undefined,
  }), [searchTerm, categoryFilter, statusFilter]);

  const {
    courses,
    loading,
    error,
  } = useCourses(filters);

  const handleEnrollment = async () => {
    if (!enrollmentData.memberId || !enrollmentData.courseId) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Here you would call the enrollment API
      console.log('Enrolling member:', enrollmentData);
      
      toast({
        title: 'Sucesso!',
        description: 'Membro inscrito no curso com sucesso.',
      });
      
      setShowEnrollmentDialog(false);
      setEnrollmentData({
        memberId: '',
        courseId: '',
        paymentMethod: 'pix',
        amount: '',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível inscrever o membro.',
        variant: 'destructive',
      });
    }
  };

  if (!canViewCourses) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Acesso restrito.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <FancyLoader
        message="Preparando os cursos para sua célula"
        tips={tips}
      />
    );
  }

  const activeCourses = courses.filter(c => c.status === 'active');
  const enrolledMembers = [
    { id: '1', name: 'João Silva', course: 'Maturidade no Espírito', progress: 75, status: 'Em Curso' },
    { id: '2', name: 'Maria Santos', course: 'CTL', progress: 60, status: 'Em Curso' },
    { id: '3', name: 'Pedro Costa', course: 'Maturidade no Espírito', progress: 90, status: 'Em Curso' },
    { id: '4', name: 'Ana Oliveira', course: 'CTL', progress: 45, status: 'Em Curso' },
  ];

  const availableMembers = [
    { id: '5', name: 'Carlos Lima', type: 'member' },
    { id: '6', name: 'Sofia Pereira', type: 'frequentador' },
    { id: '7', name: 'Rafael Souza', type: 'member' },
    { id: '8', name: 'Julia Costa', type: 'frequentador' },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold">Cursos - Líder</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Inscreva membros da sua célula e acompanhe o progresso
          </p>
        </div>

        {canEnrollStudents && (
          <Dialog open={showEnrollmentDialog} onOpenChange={setShowEnrollmentDialog}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Inscrever Membro
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Inscrever Membro no Curso</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Membro</label>
                  <Select 
                    value={enrollmentData.memberId} 
                    onValueChange={(value) => setEnrollmentData(prev => ({ ...prev, memberId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o membro" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name} - {member.type === 'member' ? 'Membro' : 'Frequentador'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Curso</label>
                  <Select 
                    value={enrollmentData.courseId} 
                    onValueChange={(value) => setEnrollmentData(prev => ({ ...prev, courseId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o curso" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeCourses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Forma de Pagamento</label>
                  <Select 
                    value={enrollmentData.paymentMethod} 
                    onValueChange={(value) => setEnrollmentData(prev => ({ ...prev, paymentMethod: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="cash">Dinheiro</SelectItem>
                      <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                      <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Valor (R$)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={enrollmentData.amount}
                    onChange={(e) => setEnrollmentData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0,00"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setShowEnrollmentDialog(false)}>
                    Cancelar
                  </Button>
                  <Button className="flex-1" onClick={handleEnrollment}>
                    Inscrever
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cursos Disponíveis</p>
                <p className="text-2xl font-bold">{activeCourses.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Membros Inscritos</p>
                <p className="text-2xl font-bold text-green-600">{enrolledMembers.length}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Progresso Médio</p>
                <p className="text-2xl font-bold text-blue-600">68%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Certificados</p>
                <p className="text-2xl font-bold text-purple-600">2</p>
              </div>
              <Award className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar cursos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                <SelectItem value="spiritual">Espiritual</SelectItem>
                <SelectItem value="leadership">Liderança</SelectItem>
                <SelectItem value="ministry">Ministério</SelectItem>
                <SelectItem value="biblical">Bíblico</SelectItem>
                <SelectItem value="practical">Prático</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="completed">Concluídos</SelectItem>
                <SelectItem value="paused">Pausados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="courses" className="space-y-6">
        <TabsList>
          <TabsTrigger value="courses">
            <BookOpen className="w-4 h-4 mr-2" />
            Cursos
          </TabsTrigger>
          <TabsTrigger value="enrolled">
            <Users className="w-4 h-4 mr-2" />
            Inscritos
          </TabsTrigger>
          <TabsTrigger value="progress">
            <TrendingUp className="w-4 h-4 mr-2" />
            Progresso
          </TabsTrigger>
        </TabsList>

        {/* Courses Tab */}
        <TabsContent value="courses">
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <p className="text-red-600">{error}</p>
              </CardContent>
            </Card>
          )}

          {activeCourses.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum curso ativo encontrado</h3>
                <p className="text-muted-foreground">
                  Não há cursos disponíveis no momento.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {activeCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onViewDetails={(courseId) => {
                    setSelectedCourse(courseId);
                  }}
                  showActions={false}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Enrolled Members Tab */}
        <TabsContent value="enrolled">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Membros Inscritos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Membro</TableHead>
                      <TableHead>Curso</TableHead>
                      <TableHead>Progresso</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrolledMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell>{member.course}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={member.progress} className="flex-1 h-2" />
                            <span className="text-sm text-muted-foreground">{member.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={member.progress >= 90 ? 'default' : 'secondary'}>
                            {member.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            Ver Detalhes
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Progresso por Curso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeCourses.slice(0, 3).map((course) => {
                    const courseMembers = enrolledMembers.filter(m => m.course === course.name);
                    const avgProgress = courseMembers.length > 0 
                      ? courseMembers.reduce((sum, m) => sum + m.progress, 0) / courseMembers.length 
                      : 0;
                    
                    return (
                      <div key={course.id} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{course.name}</span>
                          <span className="text-muted-foreground">{Math.round(avgProgress)}%</span>
                        </div>
                        <Progress value={avgProgress} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{courseMembers.length} membros inscritos</span>
                          <span>{course.duration_weeks} semanas</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Membros em Destaque
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {enrolledMembers
                    .sort((a, b) => b.progress - a.progress)
                    .slice(0, 4)
                    .map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{member.name}</p>
                          <p className="text-xs text-muted-foreground">{member.course}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{member.progress}%</p>
                          <Badge 
                            variant={member.progress >= 90 ? 'default' : member.progress >= 70 ? 'secondary' : 'outline'}
                            className="text-xs"
                          >
                            {member.progress >= 90 ? 'Excelente' : 
                             member.progress >= 70 ? 'Bom' : 'Em Progresso'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}