// Enhanced Course System - Discipulador Page
// Course management interface for discipuladores

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
import FancyLoader from '@/components/FancyLoader';
import { CourseCard } from '@/components/courses/CourseCard';
import { 
  Search, 
  Filter, 
  BookOpen, 
  Users, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Award,
  GraduationCap,
  Target
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Course, CourseFilters } from '@/types/course';

const tips = [
  'Acompanhando o progresso dos líderes como o bom pastor...',
  'Conferindo presenças e abençoando cada aluno...',
  'Preparando relatórios de crescimento espiritual...',
  'Organizando materiais e apostilas dos cursos...',
  'Motivando os líderes a crescerem na Palavra...',
];

export default function CoursesDiscipulador() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { canViewCourses, canMarkAttendance } = useCourseAccess();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [selectedCourse, setSelectedCourse] = useState<string>('');

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
        message="Preparando os cursos da sua rede"
        tips={tips}
      />
    );
  }

  const activeCourses = courses.filter(c => c.status === 'active');
  const enrolledCourses = courses.filter(c => c.status === 'active'); // This would be filtered by actual enrollments

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold">Cursos - Discipulador</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Acompanhe o progresso dos líderes da sua rede nos cursos
          </p>
        </div>
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
                <p className="text-sm font-medium text-muted-foreground">Líderes Inscritos</p>
                <p className="text-2xl font-bold text-green-600">12</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taxa de Presença</p>
                <p className="text-2xl font-bold text-blue-600">85%</p>
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
                <p className="text-2xl font-bold text-purple-600">8</p>
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
          <TabsTrigger value="attendance">
            <Users className="w-4 h-4 mr-2" />
            Presenças
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

        {/* Attendance Tab */}
        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Controle de Presenças
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                    <SelectTrigger className="w-[300px]">
                      <SelectValue placeholder="Selecione um curso" />
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

                {selectedCourse ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span className="text-sm font-medium">Presentes</span>
                          </div>
                          <p className="text-2xl font-bold text-green-600">15</p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-5 w-5 text-red-600" />
                            <span className="text-sm font-medium">Ausentes</span>
                          </div>
                          <p className="text-2xl font-bold text-red-600">3</p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-blue-600" />
                            <span className="text-sm font-medium">Taxa de Presença</span>
                          </div>
                          <p className="text-2xl font-bold text-blue-600">83%</p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Líder</TableHead>
                            <TableHead>Última Aula</TableHead>
                            <TableHead>Presença</TableHead>
                            <TableHead>Faltas</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[
                            { name: 'João Silva', lastClass: '2024-01-15', present: true, absences: 1, status: 'Em Curso' },
                            { name: 'Maria Santos', lastClass: '2024-01-15', present: true, absences: 0, status: 'Em Curso' },
                            { name: 'Pedro Costa', lastClass: '2024-01-15', present: false, absences: 2, status: 'Em Curso' },
                            { name: 'Ana Oliveira', lastClass: '2024-01-15', present: true, absences: 1, status: 'Em Curso' },
                          ].map((student, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{student.name}</TableCell>
                              <TableCell>{student.lastClass}</TableCell>
                              <TableCell>
                                {student.present ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-600" />
                                )}
                              </TableCell>
                              <TableCell>{student.absences}</TableCell>
                              <TableCell>
                                <Badge variant={student.absences >= 4 ? 'destructive' : 'secondary'}>
                                  {student.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Selecione um curso para ver as presenças</p>
                  </div>
                )}
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
                  {activeCourses.slice(0, 3).map((course) => (
                    <div key={course.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{course.name}</span>
                        <span className="text-muted-foreground">75%</span>
                      </div>
                      <Progress value={75} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>12 de 16 aulas</span>
                        <span>8 líderes inscritos</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Líderes em Destaque
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'João Silva', course: 'Maturidade no Espírito', progress: 90, status: 'Excelente' },
                    { name: 'Maria Santos', course: 'CTL', progress: 85, status: 'Muito Bom' },
                    { name: 'Pedro Costa', course: 'Maturidade no Espírito', progress: 78, status: 'Bom' },
                    { name: 'Ana Oliveira', course: 'CTL', progress: 95, status: 'Excelente' },
                  ].map((leader, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{leader.name}</p>
                        <p className="text-xs text-muted-foreground">{leader.course}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{leader.progress}%</p>
                        <Badge variant="secondary" className="text-xs">
                          {leader.status}
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