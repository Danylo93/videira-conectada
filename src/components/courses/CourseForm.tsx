// Enhanced Course System - Course Form Component
// Comprehensive form for creating and editing courses

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Plus, BookOpen, Target, Package, Award } from 'lucide-react';
import type { CreateCourseData, UpdateCourseData, Course } from '@/types/course';

const courseSchema = z.object({
  name: z.string().min(1, 'Nome do curso é obrigatório'),
  description: z.string().optional(),
  short_description: z.string().optional(),
  duration_weeks: z.number().min(1, 'Duração deve ser pelo menos 1 semana'),
  price: z.number().min(0, 'Preço não pode ser negativo'),
  max_students: z.number().min(1).optional(),
  min_students: z.number().min(1).default(1),
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']),
  category: z.enum(['spiritual', 'leadership', 'ministry', 'biblical', 'practical']),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  registration_deadline: z.string().optional(),
  requirements: z.array(z.string()).default([]),
  learning_objectives: z.array(z.string()).default([]),
  materials_included: z.array(z.string()).default([]),
  certification_required: z.boolean().default(false),
  certification_name: z.string().optional(),
});

type CourseFormData = z.infer<typeof courseSchema>;

interface CourseFormProps {
  course?: Course;
  onSubmit: (data: CreateCourseData | UpdateCourseData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function CourseForm({ course, onSubmit, onCancel, loading = false }: CourseFormProps) {
  const [requirements, setRequirements] = useState<string[]>(course?.requirements || []);
  const [learningObjectives, setLearningObjectives] = useState<string[]>(course?.learning_objectives || []);
  const [materialsIncluded, setMaterialsIncluded] = useState<string[]>(course?.materials_included || []);
  const [newRequirement, setNewRequirement] = useState('');
  const [newObjective, setNewObjective] = useState('');
  const [newMaterial, setNewMaterial] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      name: course?.name || '',
      description: course?.description || '',
      short_description: course?.short_description || '',
      duration_weeks: course?.duration_weeks || 8,
      price: course?.price || 0,
      max_students: course?.max_students || undefined,
      min_students: course?.min_students || 1,
      difficulty_level: course?.difficulty_level || 'beginner',
      category: course?.category || 'spiritual',
      start_date: course?.start_date || '',
      end_date: course?.end_date || '',
      registration_deadline: course?.registration_deadline || '',
      requirements: course?.requirements || [],
      learning_objectives: course?.learning_objectives || [],
      materials_included: course?.materials_included || [],
      certification_required: course?.certification_required || false,
      certification_name: course?.certification_name || '',
    },
  });

  const certificationRequired = watch('certification_required');

  const addRequirement = () => {
    if (newRequirement.trim()) {
      const updated = [...requirements, newRequirement.trim()];
      setRequirements(updated);
      setValue('requirements', updated);
      setNewRequirement('');
    }
  };

  const removeRequirement = (index: number) => {
    const updated = requirements.filter((_, i) => i !== index);
    setRequirements(updated);
    setValue('requirements', updated);
  };

  const addObjective = () => {
    if (newObjective.trim()) {
      const updated = [...learningObjectives, newObjective.trim()];
      setLearningObjectives(updated);
      setValue('learning_objectives', updated);
      setNewObjective('');
    }
  };

  const removeObjective = (index: number) => {
    const updated = learningObjectives.filter((_, i) => i !== index);
    setLearningObjectives(updated);
    setValue('learning_objectives', updated);
  };

  const addMaterial = () => {
    if (newMaterial.trim()) {
      const updated = [...materialsIncluded, newMaterial.trim()];
      setMaterialsIncluded(updated);
      setValue('materials_included', updated);
      setNewMaterial('');
    }
  };

  const removeMaterial = (index: number) => {
    const updated = materialsIncluded.filter((_, i) => i !== index);
    setMaterialsIncluded(updated);
    setValue('materials_included', updated);
  };

  const onFormSubmit = async (data: CourseFormData) => {
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Informações Básicas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Curso *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Ex: Maturidade no Espírito"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="short_description">Descrição Curta</Label>
              <Input
                id="short_description"
                {...register('short_description')}
                placeholder="Ex: Desenvolvimento espiritual e crescimento cristão"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição Completa</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Descreva detalhadamente o curso, seus objetivos e benefícios..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration_weeks">Duração (semanas) *</Label>
              <Input
                id="duration_weeks"
                type="number"
                {...register('duration_weeks', { valueAsNumber: true })}
                min="1"
                className={errors.duration_weeks ? 'border-red-500' : ''}
              />
              {errors.duration_weeks && (
                <p className="text-sm text-red-500">{errors.duration_weeks.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Preço (R$) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                {...register('price', { valueAsNumber: true })}
                min="0"
                className={errors.price ? 'border-red-500' : ''}
              />
              {errors.price && (
                <p className="text-sm text-red-500">{errors.price.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="min_students">Mín. de Alunos</Label>
              <Input
                id="min_students"
                type="number"
                {...register('min_students', { valueAsNumber: true })}
                min="1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="difficulty_level">Nível de Dificuldade *</Label>
              <Select
                value={watch('difficulty_level')}
                onValueChange={(value) => setValue('difficulty_level', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o nível" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Iniciante</SelectItem>
                  <SelectItem value="intermediate">Intermediário</SelectItem>
                  <SelectItem value="advanced">Avançado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <Select
                value={watch('category')}
                onValueChange={(value) => setValue('category', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spiritual">Espiritual</SelectItem>
                  <SelectItem value="leadership">Liderança</SelectItem>
                  <SelectItem value="ministry">Ministério</SelectItem>
                  <SelectItem value="biblical">Bíblico</SelectItem>
                  <SelectItem value="practical">Prático</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max_students">Máx. de Alunos (opcional)</Label>
            <Input
              id="max_students"
              type="number"
              {...register('max_students', { valueAsNumber: true })}
              min="1"
              placeholder="Deixe vazio para ilimitado"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Objetivos de Aprendizado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>O que os alunos vão aprender:</Label>
            <div className="space-y-2">
              {learningObjectives.map((objective, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Badge variant="secondary" className="flex-1 justify-start">
                    {objective}
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeObjective(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  value={newObjective}
                  onChange={(e) => setNewObjective(e.target.value)}
                  placeholder="Adicionar objetivo de aprendizado..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addObjective())}
                />
                <Button type="button" onClick={addObjective} disabled={!newObjective.trim()}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Materiais e Requisitos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Materiais Inclusos:</Label>
            <div className="space-y-2">
              {materialsIncluded.map((material, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Badge variant="outline" className="flex-1 justify-start">
                    {material}
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMaterial(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  value={newMaterial}
                  onChange={(e) => setNewMaterial(e.target.value)}
                  placeholder="Ex: Apostila completa, Bíblia de estudo..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMaterial())}
                />
                <Button type="button" onClick={addMaterial} disabled={!newMaterial.trim()}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Requisitos para Participação:</Label>
            <div className="space-y-2">
              {requirements.map((requirement, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Badge variant="secondary" className="flex-1 justify-start">
                    {requirement}
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRequirement(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  value={newRequirement}
                  onChange={(e) => setNewRequirement(e.target.value)}
                  placeholder="Ex: Ser membro ativo da igreja..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                />
                <Button type="button" onClick={addRequirement} disabled={!newRequirement.trim()}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Certificação e Datas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="certification_required"
              checked={certificationRequired}
              onCheckedChange={(checked) => setValue('certification_required', checked as boolean)}
            />
            <Label htmlFor="certification_required">Certificação obrigatória</Label>
          </div>

          {certificationRequired && (
            <div className="space-y-2">
              <Label htmlFor="certification_name">Nome da Certificação</Label>
              <Input
                id="certification_name"
                {...register('certification_name')}
                placeholder="Ex: Certificado de Maturidade Espiritual"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Data de Início</Label>
              <Input
                id="start_date"
                type="date"
                {...register('start_date')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">Data de Término</Label>
              <Input
                id="end_date"
                type="date"
                {...register('end_date')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="registration_deadline">Prazo de Inscrição</Label>
              <Input
                id="registration_deadline"
                type="date"
                {...register('registration_deadline')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : course ? 'Atualizar Curso' : 'Criar Curso'}
        </Button>
      </div>
    </form>
  );
}
