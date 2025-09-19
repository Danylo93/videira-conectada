// Enhanced Reports System - Lost Member Form Component
// Reusable form component for creating and editing lost members

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const lostMemberSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  last_attendance_date: z.date().optional(),
  last_cell_meeting_date: z.date().optional(),
  last_culto_date: z.date().optional(),
  reason: z.enum(['moved', 'work', 'family', 'health', 'other', 'unknown']).optional(),
  reason_details: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  assigned_to: z.string().optional(),
});

type LostMemberFormData = z.infer<typeof lostMemberSchema>;

interface LostMemberFormProps {
  onSubmit: (data: LostMemberFormData) => void;
  onCancel: () => void;
  initialData?: Partial<LostMemberFormData>;
  loading?: boolean;
}

const LostMemberForm: React.FC<LostMemberFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  loading = false
}) => {
  const [lastAttendanceDate, setLastAttendanceDate] = useState<Date | undefined>(
    initialData?.last_attendance_date
  );
  const [lastCellMeetingDate, setLastCellMeetingDate] = useState<Date | undefined>(
    initialData?.last_cell_meeting_date
  );
  const [lastCultoDate, setLastCultoDate] = useState<Date | undefined>(
    initialData?.last_culto_date
  );
  const [showLastAttendanceCalendar, setShowLastAttendanceCalendar] = useState(false);
  const [showLastCellMeetingCalendar, setShowLastCellMeetingCalendar] = useState(false);
  const [showLastCultoCalendar, setShowLastCultoCalendar] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<LostMemberFormData>({
    resolver: zodResolver(lostMemberSchema),
    defaultValues: {
      name: initialData?.name || '',
      phone: initialData?.phone || '',
      email: initialData?.email || '',
      last_attendance_date: initialData?.last_attendance_date,
      last_cell_meeting_date: initialData?.last_cell_meeting_date,
      last_culto_date: initialData?.last_culto_date,
      reason: initialData?.reason || 'unknown',
      reason_details: initialData?.reason_details || '',
      priority: initialData?.priority || 'medium',
      assigned_to: initialData?.assigned_to || '',
    }
  });

  const handleFormSubmit = (data: LostMemberFormData) => {
    onSubmit({
      ...data,
      last_attendance_date: lastAttendanceDate,
      last_cell_meeting_date: lastCellMeetingDate,
      last_culto_date: lastCultoDate,
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Novo Membro Perdido</CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informações Pessoais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="Nome completo do membro"
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  {...register('phone')}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="email@exemplo.com"
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
          </div>

          {/* Last Attendance Dates */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Últimas Presenças</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Última Presença Geral</Label>
                <Popover open={showLastAttendanceCalendar} onOpenChange={setShowLastAttendanceCalendar}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !lastAttendanceDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {lastAttendanceDate ? format(lastAttendanceDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={lastAttendanceDate}
                      onSelect={(date) => {
                        setLastAttendanceDate(date);
                        setValue('last_attendance_date', date!);
                        setShowLastAttendanceCalendar(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Última Reunião de Célula</Label>
                <Popover open={showLastCellMeetingCalendar} onOpenChange={setShowLastCellMeetingCalendar}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !lastCellMeetingDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {lastCellMeetingDate ? format(lastCellMeetingDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={lastCellMeetingDate}
                      onSelect={(date) => {
                        setLastCellMeetingDate(date);
                        setValue('last_cell_meeting_date', date!);
                        setShowLastCellMeetingCalendar(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Último Culto</Label>
                <Popover open={showLastCultoCalendar} onOpenChange={setShowLastCultoCalendar}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !lastCultoDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {lastCultoDate ? format(lastCultoDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={lastCultoDate}
                      onSelect={(date) => {
                        setLastCultoDate(date);
                        setValue('last_culto_date', date!);
                        setShowLastCultoCalendar(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Reason and Priority */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Motivo e Prioridade</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reason">Motivo da Ausência</Label>
                <Select
                  value={watch('reason')}
                  onValueChange={(value) => setValue('reason', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="moved">Mudou de endereço</SelectItem>
                    <SelectItem value="work">Trabalho</SelectItem>
                    <SelectItem value="family">Problemas familiares</SelectItem>
                    <SelectItem value="health">Problemas de saúde</SelectItem>
                    <SelectItem value="other">Outros</SelectItem>
                    <SelectItem value="unknown">Não especificado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Select
                  value={watch('priority')}
                  onValueChange={(value) => setValue('priority', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason_details">Detalhes do Motivo</Label>
              <Textarea
                id="reason_details"
                {...register('reason_details')}
                placeholder="Descreva mais detalhes sobre o motivo da ausência..."
                rows={3}
              />
            </div>
          </div>

          {/* Assignment */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Atribuição</h3>
            <div className="space-y-2">
              <Label htmlFor="assigned_to">Responsável pelo Acompanhamento</Label>
              <Input
                id="assigned_to"
                {...register('assigned_to')}
                placeholder="Nome do responsável pelo acompanhamento"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Membro Perdido'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default LostMemberForm;
