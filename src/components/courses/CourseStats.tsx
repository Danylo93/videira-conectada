// Enhanced Course System - Course Statistics Component
// Statistics and analytics display for courses

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Users, 
  TrendingUp, 
  Award, 
  DollarSign,
  Calendar,
  Target,
  BarChart3
} from 'lucide-react';
import type { CourseStats, CourseAnalytics } from '@/types/course';

interface CourseStatsProps {
  stats: CourseStats;
  analytics: CourseAnalytics[];
  loading?: boolean;
}

export function CourseStats({ stats, analytics, loading = false }: CourseStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Cursos</p>
                <p className="text-2xl font-bold">{stats.total_courses}</p>
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
                <p className="text-2xl font-bold text-green-600">{stats.active_courses}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Alunos</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total_students}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taxa de Conclusão</p>
                <p className="text-2xl font-bold text-purple-600">{stats.completion_rate.toFixed(1)}%</p>
              </div>
              <Award className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Presença Média</h3>
              <Target className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Taxa de Presença</span>
                <span className="font-medium">{stats.average_attendance.toFixed(1)}%</span>
              </div>
              <Progress value={stats.average_attendance} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Receita</h3>
              <DollarSign className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Arrecadado</span>
                <span className="font-medium">
                  R$ {stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Pendente</span>
                <span>R$ {stats.pending_payments.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Inscrições</h3>
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total de Inscrições</span>
                <span className="font-medium">{stats.total_registrations}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Taxa de Conversão</span>
                <span>
                  {stats.total_courses > 0 
                    ? ((stats.total_registrations / stats.total_courses) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course Analytics */}
      {analytics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Análise por Curso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.slice(0, 5).map((course) => (
                <div key={course.course_id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">{course.course_name}</h4>
                    <div className="flex gap-2">
                      <Badge variant="outline">{course.total_students} alunos</Badge>
                      <Badge variant="secondary">{course.completion_rate.toFixed(1)}% conclusão</Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Presença:</span>
                      <span className="ml-2 font-medium">{course.average_attendance.toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Receita:</span>
                      <span className="ml-2 font-medium">
                        R$ {course.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Satisfação:</span>
                      <span className="ml-2 font-medium">
                        {course.student_satisfaction ? `${course.student_satisfaction.toFixed(1)}/5` : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <Progress value={course.completion_rate} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
