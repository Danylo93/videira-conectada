// Enhanced Course System - Admin Page
// Comprehensive course management interface for pastors and obreiros

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCourses, useCourseAccess } from '@/hooks/useCourses';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import FancyLoader from '@/components/FancyLoader';
import { CourseCard } from '@/components/courses/CourseCard';
import { CourseForm } from '@/components/courses/CourseForm';
import { 
  Plus, 
  Search, 
  Filter, 
  BookOpen, 
  Users, 
  DollarSign, 
  TrendingUp,
  Calendar,
  Award,
  Settings,
  BarChart3,
  GraduationCap,
  Target,
  Package
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Course, CreateCourseData, UpdateCourseData, CourseFilters } from '@/types/course';

const tips = [
  'Organizando a grade curricular como Neemias com as muralhas…',
  'Separando as apostilas e afinando o violão do louvor…',
  'Abençoando cada líder com café quentinho e Palavra viva…',
  'Preparando certificados como Moisés nas tábuas da lei…',
  'Conferindo presenças como o bom pastor conta suas ovelhas…',
];

export default function CoursesAdmin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { canManageCourses } = useCourseAccess();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const filters = useMemo((): CourseFilters => ({
    search: searchTerm || undefined,
    category: categoryFilter && categoryFilter !== 'all' ? categoryFilter : undefined,
    status: statusFilter && statusFilter !== 'all' ? statusFilter : undefined,
    difficulty_level: difficultyFilter && difficultyFilter !== 'all' ? difficultyFilter : undefined,
  }), [searchTerm, categoryFilter, statusFilter, difficultyFilter]);

  const {
    courses,
    loading,
    error,
    createCourse,
    updateCourse,
    deleteCourse,
  } = useCourses(filters);

  const handleCreateCourse = async (data: CreateCourseData) => {
    try {
      await createCourse(data);
      setShowCreateForm(false);
      toast({
        title: 'Sucesso!',
        description: 'Curso criado com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o curso.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateCourse = async (data: UpdateCourseData) => {
    if (!editingCourse) return;
    
    try {
      await updateCourse(editingCourse.id, data);
      setEditingCourse(null);
      toast({
        title: 'Sucesso!',
        description: 'Curso atualizado com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o curso.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Tem certeza que deseja excluir este curso?')) return;
    
    try {
      await deleteCourse(courseId);
      toast({
        title: 'Sucesso!',
        description: 'Curso excluído com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o curso.',
        variant: 'destructive',
      });
    }
  };

  if (!canManageCourses) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Acesso restrito ao Pastor e Obreiros.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <FancyLoader
        message="Organizando a Escola de Líderes"
        tips={tips}
      />
    );
  }

  const activeCourses = courses.filter(c => c.status === 'active');
  const draftCourses = courses.filter(c => c.status === 'draft');
  const completedCourses = courses.filter(c => c.status === 'completed');

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold">Gestão de Cursos</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Gerencie cursos, módulos, aulas e acompanhe o progresso dos alunos
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Curso
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Novo Curso</DialogTitle>
              </DialogHeader>
              <CourseForm
                onSubmit={handleCreateCourse}
                onCancel={() => setShowCreateForm(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Cursos</p>
                <p className="text-2xl font-bold">{courses.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cursos Ativos</p>
                <p className="text-2xl font-bold text-green-600">{activeCourses.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Em Rascunho</p>
                <p className="text-2xl font-bold text-yellow-600">{draftCourses.length}</p>
              </div>
              <Settings className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Concluídos</p>
                <p className="text-2xl font-bold text-blue-600">{completedCourses.length}</p>
              </div>
              <Award className="h-8 w-8 text-blue-600" />
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
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="paused">Pausado</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Dificuldade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as dificuldades</SelectItem>
                <SelectItem value="beginner">Iniciante</SelectItem>
                <SelectItem value="intermediate">Intermediário</SelectItem>
                <SelectItem value="advanced">Avançado</SelectItem>
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
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="w-4 h-4 mr-2" />
            Configurações
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

          {courses.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum curso encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || categoryFilter || statusFilter || difficultyFilter
                    ? 'Tente ajustar os filtros de busca.'
                    : 'Comece criando seu primeiro curso.'}
                </p>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Curso
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onViewDetails={(courseId) => {
                    // Navigate to course details
                    console.log('View details:', courseId);
                  }}
                  onEdit={(courseId) => {
                    const courseToEdit = courses.find(c => c.id === courseId);
                    if (courseToEdit) {
                      setEditingCourse(courseToEdit);
                    }
                  }}
                  showActions={true}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Cursos por Categoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['spiritual', 'leadership', 'ministry', 'biblical', 'practical'].map((category) => {
                    const count = courses.filter(c => c.category === category).length;
                    const percentage = courses.length > 0 ? (count / courses.length) * 100 : 0;
                    
                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">
                            {category === 'spiritual' ? 'Espiritual' :
                             category === 'leadership' ? 'Liderança' :
                             category === 'ministry' ? 'Ministério' :
                             category === 'biblical' ? 'Bíblico' : 'Prático'}
                          </span>
                          <span className="font-medium">{count}</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Status dos Cursos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { status: 'active', label: 'Ativos', color: 'text-green-600' },
                    { status: 'draft', label: 'Rascunho', color: 'text-yellow-600' },
                    { status: 'completed', label: 'Concluídos', color: 'text-blue-600' },
                    { status: 'paused', label: 'Pausados', color: 'text-orange-600' },
                    { status: 'cancelled', label: 'Cancelados', color: 'text-red-600' },
                  ].map(({ status, label, color }) => {
                    const count = courses.filter(c => c.status === status).length;
                    const percentage = courses.length > 0 ? (count / courses.length) * 100 : 0;
                    
                    return (
                      <div key={status} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{label}</span>
                          <span className={`font-medium ${color}`}>{count}</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Sistema de Cursos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Configurações avançadas do sistema de cursos serão implementadas em breve.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Course Dialog */}
      {editingCourse && (
        <Dialog open={!!editingCourse} onOpenChange={() => setEditingCourse(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Curso</DialogTitle>
            </DialogHeader>
            <CourseForm
              course={editingCourse}
              onSubmit={handleUpdateCourse}
              onCancel={() => setEditingCourse(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
