// Enhanced Course System - Course Card Component
// Modern, reusable course card component

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  Users, 
  Clock, 
  DollarSign, 
  Calendar, 
  Star,
  GraduationCap,
  Award,
  ChevronRight,
  MapPin,
  Online
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Course } from '@/types/course';

interface CourseCardProps {
  course: Course;
  onViewDetails?: (courseId: string) => void;
  onEnroll?: (courseId: string) => void;
  onEdit?: (courseId: string) => void;
  showActions?: boolean;
  compact?: boolean;
}

export function CourseCard({ 
  course, 
  onViewDetails, 
  onEnroll, 
  onEdit, 
  showActions = true,
  compact = false 
}: CourseCardProps) {
  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'spiritual': return <Star className="w-4 h-4" />;
      case 'leadership': return <Users className="w-4 h-4" />;
      case 'ministry': return <GraduationCap className="w-4 h-4" />;
      case 'biblical': return <BookOpen className="w-4 h-4" />;
      case 'practical': return <Award className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'A definir';
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  };

  if (compact) {
    return (
      <Card className="hover:shadow-md transition-all duration-200 border-l-4 border-l-primary">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {getCategoryIcon(course.category)}
                <h3 className="font-semibold text-lg">{course.name}</h3>
                <Badge className={getStatusColor(course.status)}>
                  {course.status === 'active' ? 'Ativo' : 
                   course.status === 'draft' ? 'Rascunho' :
                   course.status === 'paused' ? 'Pausado' :
                   course.status === 'completed' ? 'Concluído' : 'Cancelado'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {course.short_description || course.description}
              </p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {course.duration_weeks} semanas
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  {formatPrice(course.price)}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(course.start_date)}
                </div>
              </div>
            </div>
            {showActions && (
              <div className="flex gap-2">
                {onViewDetails && (
                  <Button variant="outline" size="sm" onClick={() => onViewDetails(course.id)}>
                    Ver Detalhes
                  </Button>
                )}
                {onEnroll && (
                  <Button size="sm" onClick={() => onEnroll(course.id)}>
                    Inscrever-se
                  </Button>
                )}
                {onEdit && (
                  <Button variant="ghost" size="sm" onClick={() => onEdit(course.id)}>
                    Editar
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-all duration-300 group border-l-4 border-l-primary hover:border-l-primary/80">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {getCategoryIcon(course.category)}
            <CardTitle className="text-xl group-hover:text-primary transition-colors">
              {course.name}
            </CardTitle>
          </div>
          <div className="flex gap-2">
            <Badge className={getDifficultyColor(course.difficulty_level)}>
              {course.difficulty_level === 'beginner' ? 'Iniciante' :
               course.difficulty_level === 'intermediate' ? 'Intermediário' : 'Avançado'}
            </Badge>
            <Badge className={getStatusColor(course.status)}>
              {course.status === 'active' ? 'Ativo' : 
               course.status === 'draft' ? 'Rascunho' :
               course.status === 'paused' ? 'Pausado' :
               course.status === 'completed' ? 'Concluído' : 'Cancelado'}
            </Badge>
          </div>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {course.description}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Course Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="font-medium">{course.duration_weeks} semanas</p>
              <p className="text-xs text-muted-foreground">Duração</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="font-medium">{formatPrice(course.price)}</p>
              <p className="text-xs text-muted-foreground">Investimento</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="font-medium">
                {course.max_students ? `${course.min_students}-${course.max_students}` : 'Ilimitado'}
              </p>
              <p className="text-xs text-muted-foreground">Vagas</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="font-medium">{formatDate(course.start_date)}</p>
              <p className="text-xs text-muted-foreground">Início</p>
            </div>
          </div>
        </div>

        {/* Learning Objectives */}
        {course.learning_objectives && course.learning_objectives.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-2">O que você vai aprender:</h4>
            <ul className="space-y-1">
              {course.learning_objectives.slice(0, 3).map((objective, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  {objective}
                </li>
              ))}
              {course.learning_objectives.length > 3 && (
                <li className="text-xs text-muted-foreground">
                  +{course.learning_objectives.length - 3} objetivos adicionais
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Materials Included */}
        {course.materials_included && course.materials_included.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-2">Materiais inclusos:</h4>
            <div className="flex flex-wrap gap-2">
              {course.materials_included.slice(0, 3).map((material, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {material}
                </Badge>
              ))}
              {course.materials_included.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{course.materials_included.length - 3} mais
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Certification */}
        {course.certification_required && (
          <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
            <Award className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium text-sm">Certificação Inclusa</p>
              <p className="text-xs text-muted-foreground">
                {course.certification_name || 'Certificado de Conclusão'}
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 pt-2">
            {onViewDetails && (
              <Button variant="outline" className="flex-1" onClick={() => onViewDetails(course.id)}>
                <BookOpen className="w-4 h-4 mr-2" />
                Ver Detalhes
              </Button>
            )}
            {onEnroll && (
              <Button className="flex-1" onClick={() => onEnroll(course.id)}>
                <GraduationCap className="w-4 h-4 mr-2" />
                Inscrever-se
              </Button>
            )}
            {onEdit && (
              <Button variant="ghost" size="sm" onClick={() => onEdit(course.id)}>
                Editar
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
