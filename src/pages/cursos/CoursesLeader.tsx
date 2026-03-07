// Enhanced Course System - Leader Page
// Course enrollment and progress interface for leaders

import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCourses, useCourseRegistrations } from '@/hooks/useCourses';
import { supabase } from '@/integrations/supabase/client';
import * as coursesService from '@/integrations/supabase/courses';
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
  TrendingUp,
  Award,
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
  // Verificação de acesso baseada no role do usuário
  const canViewCourses = user?.role === 'lider' || user?.role === 'discipulador' || user?.role === 'pastor' || user?.role === 'obreiro';
  const canEnrollStudents = user?.role === 'lider' || user?.role === 'discipulador' || user?.role === 'pastor' || user?.role === 'obreiro';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [showEnrollmentDialog, setShowEnrollmentDialog] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [availableMembers, setAvailableMembers] = useState<Array<{ id: string; name: string; type: string }>>([]);
  const [enrollmentData, setEnrollmentData] = useState({
    memberId: '',
    trilho: '',
    turmaDia: '',
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
  const {
    registrations,
    refetch: refetchRegistrations,
  } = useCourseRegistrations();

  const trilhoOptions = useMemo(() => {
    const values = new Set(
      courses
        .map((course) => course.trilho_nome)
        .filter((value): value is 'ceifeiros' | 'ctl' => value === 'ceifeiros' || value === 'ctl')
    );
    return Array.from(values);
  }, [courses]);

  const filteredEnrollmentCourses = useMemo(() => {
    return courses
      .filter((course) => course.status === 'active')
      .filter((course) => !enrollmentData.trilho || course.trilho_nome === enrollmentData.trilho)
      .filter((course) => !enrollmentData.turmaDia || course.turma_dia === enrollmentData.turmaDia);
  }, [courses, enrollmentData.trilho, enrollmentData.turmaDia]);

  useEffect(() => {
    const fetchMembers = async () => {
      if (!user || !canEnrollStudents) return;
      setMembersLoading(true);

      let query = supabase
        .from('members')
        .select('id, name, type, lider_id, active')
        .eq('active', true)
        .order('name', { ascending: true });

      if (user.role === 'lider') {
        query = query.eq('lider_id', user.id);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Erro ao carregar membros para matrícula:', error);
        setAvailableMembers([]);
      } else {
        setAvailableMembers((data || []).map((member) => ({
          id: member.id,
          name: member.name,
          type: member.type,
        })));
      }

      setMembersLoading(false);
    };

    fetchMembers();
  }, [user, canEnrollStudents]);

  const handleEnrollment = async () => {
    if (!enrollmentData.memberId || !enrollmentData.courseId) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    if (enrollmentData.trilho && !enrollmentData.turmaDia) {
      toast({
        title: 'Erro',
        description: 'Selecione o dia da turma (domingo ou terça).',
        variant: 'destructive',
      });
      return;
    }

    try {
      const selectedCourseData = courses.find((course) => course.id === enrollmentData.courseId);
      if (!selectedCourseData || !user) {
        toast({
          title: 'Erro',
          description: 'Não foi possível localizar o curso para matrícula.',
          variant: 'destructive',
        });
        return;
      }

      const totalAmount = Number(enrollmentData.amount || 0);
      await coursesService.createCourseRegistration({
        course_id: enrollmentData.courseId,
        student_id: enrollmentData.memberId,
        leader_id: user.id,
        registration_date: new Date().toISOString().slice(0, 10),
        status: 'enrolled',
        payment_status: totalAmount > 0 ? 'pending' : 'paid',
        total_amount: totalAmount,
        paid_amount: 0,
        scholarship_amount: 0,
        payment_plan: 'full',
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
        title: 'Sucesso!',
        description: 'Membro inscrito no curso com sucesso.',
      });
      
      setShowEnrollmentDialog(false);
      setEnrollmentData({
        memberId: '',
        trilho: '',
        turmaDia: '',
        courseId: '',
        paymentMethod: 'pix',
        amount: '',
      });
      refetchRegistrations();
    } catch (error: any) {
      const isTurmaConflict =
        String(error?.message || '').includes('uq_course_registrations_student_semester_trilho');
      toast({
        title: 'Erro',
        description: isTurmaConflict
          ? 'Este aluno já está matriculado neste trilho no semestre atual. Escolha apenas domingo ou terça.'
          : 'Não foi possível inscrever o membro.',
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
  const enrolledMembers = registrations.map((registration) => ({
    id: registration.id,
    name: registration.members?.name || 'Sem nome',
    course: registration.courses?.name || 'Curso não informado',
    registrationDate: registration.registration_date || registration.created_at,
    status: registration.status,
    paymentStatus: registration.payment_status,
  }));
  const completedCount = enrolledMembers.filter((member) => member.status === 'completed').length;
  const completionRate = enrolledMembers.length > 0
    ? Math.round((completedCount / enrolledMembers.length) * 100)
    : 0;
  const courseEnrollmentStats = activeCourses.map((course) => {
    const courseMembers = enrolledMembers.filter((member) => member.course === course.name);
    const courseCompleted = courseMembers.filter((member) => member.status === 'completed').length;
    const courseCompletionRate = courseMembers.length > 0
      ? Math.round((courseCompleted / courseMembers.length) * 100)
      : 0;
    return {
      courseId: course.id,
      courseName: course.name,
      total: courseMembers.length,
      completed: courseCompleted,
      completionRate: courseCompletionRate,
    };
  });
  const recentRegistrations = [...enrolledMembers]
    .sort((a, b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime())
    .slice(0, 6);

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
                          {member.name} - {member.type === 'member' ? 'Membro' : 'Frequentador'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Trilho</label>
                  <Select
                    value={enrollmentData.trilho || 'all'}
                    onValueChange={(value) =>
                      setEnrollmentData((prev) => ({
                        ...prev,
                        trilho: value === 'all' ? '' : value,
                        courseId: '',
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o trilho" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {trilhoOptions.includes('ceifeiros') ? (
                        <SelectItem value="ceifeiros">Ceifeiros</SelectItem>
                      ) : null}
                      {trilhoOptions.includes('ctl') ? (
                        <SelectItem value="ctl">CTL</SelectItem>
                      ) : null}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Dia da turma</label>
                  <Select
                    value={enrollmentData.turmaDia || 'all'}
                    onValueChange={(value) =>
                      setEnrollmentData((prev) => ({
                        ...prev,
                        turmaDia: value === 'all' ? '' : value,
                        courseId: '',
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
                  <label className="text-sm font-medium">Curso</label>
                  <Select 
                    value={enrollmentData.courseId} 
                    onValueChange={(value) => setEnrollmentData(prev => ({ ...prev, courseId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o curso" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredEnrollmentCourses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.name}
                          {course.turma_dia === 'domingo' ? ' (Domingo)' : ''}
                          {course.turma_dia === 'terca' ? ' (Terça)' : ''}
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
                <p className="text-sm font-medium text-muted-foreground">Taxa de Conclusão</p>
                <p className="text-2xl font-bold text-blue-600">{completionRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Concluídos</p>
                <p className="text-2xl font-bold text-purple-600">{completedCount}</p>
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
                      <TableHead>Data da Matrícula</TableHead>
                      <TableHead>Situação</TableHead>
                      <TableHead>Pagamento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrolledMembers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          Nenhuma matrícula encontrada.
                        </TableCell>
                      </TableRow>
                    ) : (
                      enrolledMembers.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell className="font-medium">{member.name}</TableCell>
                          <TableCell>{member.course}</TableCell>
                          <TableCell>
                            {member.registrationDate
                              ? new Date(member.registrationDate).toLocaleDateString('pt-BR')
                              : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={member.status === 'completed' ? 'default' : 'secondary'}>
                              {member.status === 'completed' ? 'Concluído' : 'Em curso'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={member.paymentStatus === 'paid' ? 'default' : 'outline'}>
                              {member.paymentStatus === 'paid' ? 'Pago' : 'Pendente'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
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
                  Matrículas por Curso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {courseEnrollmentStats.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sem matrículas para exibir.</p>
                  ) : (
                    courseEnrollmentStats.map((courseStat) => (
                      <div key={courseStat.courseId} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{courseStat.courseName}</span>
                          <span className="text-muted-foreground">{courseStat.completionRate}%</span>
                        </div>
                        <Progress value={courseStat.completionRate} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{courseStat.total} inscritos</span>
                          <span>{courseStat.completed} concluídos</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Últimas Matrículas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentRegistrations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sem matrículas recentes.</p>
                  ) : (
                    recentRegistrations.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{member.name}</p>
                          <p className="text-xs text-muted-foreground">{member.course}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            {member.registrationDate
                              ? new Date(member.registrationDate).toLocaleDateString('pt-BR')
                              : '-'}
                          </p>
                          <Badge variant={member.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                            {member.status === 'completed' ? 'Concluído' : 'Em curso'}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}


