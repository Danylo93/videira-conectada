// Enhanced Reports System - Report Form Component
// Reusable form component for creating and editing reports

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

const reportSchema = z.object({
  report_type: z.enum(['cell', 'culto', 'monthly', 'quarterly', 'annual', 'custom']),
  period_start: z.date({
    required_error: 'Data de início é obrigatória',
  }),
  period_end: z.date({
    required_error: 'Data de fim é obrigatória',
  }),
  notes: z.string().optional(),
  data: z.object({
    // Cell report data
    total_meetings: z.number().min(0).optional(),
    total_attendance: z.number().min(0).optional(),
    total_visitors: z.number().min(0).optional(),
    total_conversions: z.number().min(0).optional(),
    average_attendance: z.number().min(0).optional(),
    
    // Culto report data
    culto_name: z.string().optional(),
    culto_type: z.enum(['adultos', 'jovens', 'criancas', 'especial']).optional(),
    total_presence: z.number().min(0).optional(),
    total_visitors_culto: z.number().min(0).optional(),
    total_conversions_culto: z.number().min(0).optional(),
    total_offerings: z.number().min(0).optional(),
    
    // General data
    challenges: z.string().optional(),
    victories: z.string().optional(),
    prayer_requests: z.string().optional(),
    next_goals: z.string().optional(),
  }),
});

type ReportFormData = z.infer<typeof reportSchema>;

interface ReportFormProps {
  onSubmit: (data: ReportFormData) => void;
  onCancel: () => void;
  initialData?: Partial<ReportFormData>;
  loading?: boolean;
}

const ReportForm: React.FC<ReportFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  loading = false
}) => {
  const [startDate, setStartDate] = useState<Date | undefined>(
    initialData?.period_start || new Date()
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    initialData?.period_end || new Date()
  );
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      report_type: initialData?.report_type || 'cell',
      period_start: initialData?.period_start || new Date(),
      period_end: initialData?.period_end || new Date(),
      notes: initialData?.notes || '',
      data: {
        total_meetings: initialData?.data?.total_meetings || 0,
        total_attendance: initialData?.data?.total_attendance || 0,
        total_visitors: initialData?.data?.total_visitors || 0,
        total_conversions: initialData?.data?.total_conversions || 0,
        average_attendance: initialData?.data?.average_attendance || 0,
        culto_name: initialData?.data?.culto_name || '',
        culto_type: initialData?.data?.culto_type || 'adultos',
        total_presence: initialData?.data?.total_presence || 0,
        total_visitors_culto: initialData?.data?.total_visitors_culto || 0,
        total_conversions_culto: initialData?.data?.total_conversions_culto || 0,
        total_offerings: initialData?.data?.total_offerings || 0,
        challenges: initialData?.data?.challenges || '',
        victories: initialData?.data?.victories || '',
        prayer_requests: initialData?.data?.prayer_requests || '',
        next_goals: initialData?.data?.next_goals || '',
      }
    }
  });

  const reportType = watch('report_type');

  const handleFormSubmit = (data: ReportFormData) => {
    onSubmit({
      ...data,
      period_start: startDate!,
      period_end: endDate!
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Novo Relatório</CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Report Type and Period */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="report_type">Tipo de Relatório</Label>
              <Select
                value={reportType}
                onValueChange={(value) => setValue('report_type', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cell">Célula</SelectItem>
                  <SelectItem value="culto">Culto</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="quarterly">Trimestral</SelectItem>
                  <SelectItem value="annual">Anual</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
              {errors.report_type && (
                <p className="text-sm text-red-600">{errors.report_type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Data de Início</Label>
              <Popover open={showStartCalendar} onOpenChange={setShowStartCalendar}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      setStartDate(date);
                      setValue('period_start', date!);
                      setShowStartCalendar(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.period_start && (
                <p className="text-sm text-red-600">{errors.period_start.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Data de Fim</Label>
              <Popover open={showEndCalendar} onOpenChange={setShowEndCalendar}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => {
                      setEndDate(date);
                      setValue('period_end', date!);
                      setShowEndCalendar(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.period_end && (
                <p className="text-sm text-red-600">{errors.period_end.message}</p>
              )}
            </div>
          </div>

          {/* Cell Report Fields */}
          {reportType === 'cell' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Dados da Célula</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="total_meetings">Total de Reuniões</Label>
                  <Input
                    id="total_meetings"
                    type="number"
                    min="0"
                    {...register('data.total_meetings', { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="total_attendance">Total de Presenças</Label>
                  <Input
                    id="total_attendance"
                    type="number"
                    min="0"
                    {...register('data.total_attendance', { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="total_visitors">Total de Visitantes</Label>
                  <Input
                    id="total_visitors"
                    type="number"
                    min="0"
                    {...register('data.total_visitors', { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="total_conversions">Total de Conversões</Label>
                  <Input
                    id="total_conversions"
                    type="number"
                    min="0"
                    {...register('data.total_conversions', { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="average_attendance">Presença Média</Label>
                  <Input
                    id="average_attendance"
                    type="number"
                    min="0"
                    step="0.1"
                    {...register('data.average_attendance', { valueAsNumber: true })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Culto Report Fields */}
          {reportType === 'culto' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Dados do Culto</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="culto_name">Nome do Culto</Label>
                  <Input
                    id="culto_name"
                    {...register('data.culto_name')}
                    placeholder="Ex: Culto de Jovens"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="culto_type">Tipo do Culto</Label>
                  <Select
                    value={watch('data.culto_type')}
                    onValueChange={(value) => setValue('data.culto_type', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="adultos">Adultos</SelectItem>
                      <SelectItem value="jovens">Jovens</SelectItem>
                      <SelectItem value="criancas">Crianças</SelectItem>
                      <SelectItem value="especial">Especial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="total_presence">Total de Presenças</Label>
                  <Input
                    id="total_presence"
                    type="number"
                    min="0"
                    {...register('data.total_presence', { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="total_visitors_culto">Total de Visitantes</Label>
                  <Input
                    id="total_visitors_culto"
                    type="number"
                    min="0"
                    {...register('data.total_visitors_culto', { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="total_conversions_culto">Total de Conversões</Label>
                  <Input
                    id="total_conversions_culto"
                    type="number"
                    min="0"
                    {...register('data.total_conversions_culto', { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="total_offerings">Total de Ofertas (R$)</Label>
                  <Input
                    id="total_offerings"
                    type="number"
                    min="0"
                    step="0.01"
                    {...register('data.total_offerings', { valueAsNumber: true })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* General Fields */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informações Adicionais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="challenges">Desafios Encontrados</Label>
                <Textarea
                  id="challenges"
                  {...register('data.challenges')}
                  placeholder="Descreva os principais desafios enfrentados..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="victories">Vitórias Alcançadas</Label>
                <Textarea
                  id="victories"
                  {...register('data.victories')}
                  placeholder="Compartilhe as vitórias e conquistas..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prayer_requests">Pedidos de Oração</Label>
                <Textarea
                  id="prayer_requests"
                  {...register('data.prayer_requests')}
                  placeholder="Liste os pedidos de oração..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="next_goals">Próximos Objetivos</Label>
                <Textarea
                  id="next_goals"
                  {...register('data.next_goals')}
                  placeholder="Defina os objetivos para o próximo período..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações Gerais</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Adicione observações gerais sobre o relatório..."
              rows={4}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Relatório'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ReportForm;
