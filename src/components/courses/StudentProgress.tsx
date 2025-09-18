// Enhanced Course System - Student Progress Component
// Display student progress and achievements

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  User, 
  BookOpen, 
  TrendingUp, 
  Award, 
  Calendar,
  CheckCircle,
  Clock,
  Target,
  Star
} from 'lucide-react';
import type { StudentProgress } from '@/types/course';

interface StudentProgressProps {
  students: StudentProgress[];
  loading?: boolean;
  onViewDetails?: (registrationId: string) => void;
}

export function StudentProgressComponent({ 
  students, 
  loading = false, 
  onViewDetails 
}: StudentProgressProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-2 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return 'text-green-600';
    if (progress >= 70) return 'text-blue-600';
    if (progress >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressVariant = (progress: number) => {
    if (progress >= 90) return 'default';
    if (progress >= 70) return 'secondary';
    return 'outline';
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <Award className="h-4 w-4 text-green-600" />;
      case 'enrolled':
        return <BookOpen className="h-4 w-4 text-blue-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <User className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'Concluído';
      case 'enrolled':
        return 'Em Curso';
      case 'pending':
        return 'Pendente';
      case 'dropped':
        return 'Desistente';
      case 'suspended':
        return 'Suspenso';
      default:
        return status;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-4">
      {students.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum aluno encontrado</h3>
            <p className="text-muted-foreground">
              Não há alunos inscritos nos cursos no momento.
            </p>
          </CardContent>
        </Card>
      ) : (
        students.map((student) => (
          <Card key={student.registration_id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    {getStatusIcon(student.status)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{student.student_name}</h3>
                    <p className="text-sm text-muted-foreground">{student.course_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getProgressVariant(student.progress_percentage)}>
                    {student.progress_percentage.toFixed(1)}%
                  </Badge>
                  <Badge variant="outline">
                    {getStatusLabel(student.status)}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Target className="h-4 w-4" />
                    <span>Progresso</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={student.progress_percentage} className="flex-1 h-2" />
                    <span className={`text-sm font-medium ${getProgressColor(student.progress_percentage)}`}>
                      {student.progress_percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    <span>Presença</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={student.attendance_rate} className="flex-1 h-2" />
                    <span className="text-sm font-medium text-blue-600">
                      {student.attendance_rate.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Star className="h-4 w-4" />
                    <span>Nota Média</span>
                  </div>
                  <p className="text-sm font-medium">
                    {student.average_grade.toFixed(1)}/10
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Última Presença</span>
                  </div>
                  <p className="text-sm font-medium">
                    {formatDate(student.last_attendance)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>
                    {student.completed_modules} de {student.total_modules} módulos
                  </span>
                  <span>•</span>
                  <span>
                    {student.attendance_rate >= 80 ? 'Excelente presença' : 
                     student.attendance_rate >= 60 ? 'Boa presença' : 'Presença baixa'}
                  </span>
                </div>
                
                {onViewDetails && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onViewDetails(student.registration_id)}
                  >
                    Ver Detalhes
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
