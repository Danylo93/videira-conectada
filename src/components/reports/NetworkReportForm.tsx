// Network Report Form Component
// Specialized form for discipuladores to generate network reports based on leader reports

import React, { useState, useEffect } from 'react';
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
import { CalendarIcon, X, Users, TrendingUp, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const networkReportSchema = z.object({
  report_type: z.literal('network'),
  period_start: z.date({
    required_error: 'Data de início é obrigatória',
  }),
  period_end: z.date({
    required_error: 'Data de fim é obrigatória',
  }),
  notes: z.string().optional(),
  data: z.object({
    // Network aggregated data
    total_cells: z.number().min(0).optional(),
    total_meetings: z.number().min(0).optional(),
    total_attendance: z.number().min(0).optional(),
    total_visitors: z.number().min(0).optional(),
    total_conversions: z.number().min(0).optional(),
    total_offerings: z.number().min(0).optional(),
    average_attendance_per_cell: z.number().min(0).optional(),
    conversion_rate: z.number().min(0).optional(),
    
    // Network insights
    challenges: z.string().optional(),
    victories: z.string().optional(),
    prayer_requests: z.string().optional(),
    next_goals: z.string().optional(),
  }),
});

type NetworkReportFormData = z.infer<typeof networkReportSchema>;

interface NetworkReportFormProps {
  onSubmit: (data: NetworkReportFormData) => void;
  onCancel: () => void;
  initialData?: Partial<NetworkReportFormData>;
  loading?: boolean;
}

const NetworkReportForm: React.FC<NetworkReportFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  loading = false
}) => {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState<Date | undefined>(
    initialData?.period_start || new Date()
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    initialData?.period_end || new Date()
  );
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const [aggregatedData, setAggregatedData] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<NetworkReportFormData>({
    resolver: zodResolver(networkReportSchema),
    defaultValues: {
      report_type: 'network',
      period_start: initialData?.period_start || new Date(),
      period_end: initialData?.period_end || new Date(),
      notes: initialData?.notes || '',
      data: {
        total_cells: initialData?.data?.total_cells || 0,
        total_meetings: initialData?.data?.total_meetings || 0,
        total_attendance: initialData?.data?.total_attendance || 0,
        total_visitors: initialData?.data?.total_visitors || 0,
        total_conversions: initialData?.data?.total_conversions || 0,
        total_offerings: initialData?.data?.total_offerings || 0,
        average_attendance_per_cell: initialData?.data?.average_attendance_per_cell || 0,
        conversion_rate: initialData?.data?.conversion_rate || 0,
        challenges: initialData?.data?.challenges || '',
        victories: initialData?.data?.victories || '',
        prayer_requests: initialData?.data?.prayer_requests || '',
        next_goals: initialData?.data?.next_goals || '',
      }
    }
  });

  // Function to fetch and aggregate leader reports data
  const fetchAggregatedData = async () => {
    if (!startDate || !endDate) return;
    
    setIsLoadingData(true);
    try {
      // TODO: Implement API call to aggregate leader reports
      // This would call the database function we created
      const mockData = {
        total_cells: 8,
        total_meetings: 32,
        total_attendance: 256,
        total_visitors: 24,
        total_conversions: 8,
        total_offerings: 1200.00,
        average_attendance_per_cell: 32,
        conversion_rate: 33.3
      };
      
      setAggregatedData(mockData);
      
      // Auto-fill form with aggregated data
      setValue('data.total_cells', mockData.total_cells);
      setValue('data.total_meetings', mockData.total_meetings);
      setValue('data.total_attendance', mockData.total_attendance);
      setValue('data.total_visitors', mockData.total_visitors);
      setValue('data.total_conversions', mockData.total_conversions);
      setValue('data.total_offerings', mockData.total_offerings);
      setValue('data.average_attendance_per_cell', mockData.average_attendance_per_cell);
      setValue('data.conversion_rate', mockData.conversion_rate);
      
    } catch (error) {
      console.error('Error fetching aggregated data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Auto-fetch data when dates change
  useEffect(() => {
    if (startDate && endDate) {
      fetchAggregatedData();
    }
  }, [startDate, endDate]);

  const handleFormSubmit = (data: NetworkReportFormData) => {
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
          <CardTitle>Relatório da Rede</CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-gray-600">
          Este relatório será gerado automaticamente com base nos relatórios dos líderes da sua rede
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Period Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* Aggregated Data Display */}
          {isLoadingData && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Agregando dados dos líderes...</p>
              </div>
            </div>
          )}

          {aggregatedData && !isLoadingData && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                Dados Agregados da Rede
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-blue-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-600">Células</p>
                      <p className="text-2xl font-bold text-blue-900">{aggregatedData.total_cells}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-green-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-600">Presenças</p>
                      <p className="text-2xl font-bold text-green-900">{aggregatedData.total_attendance}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-purple-600">Conversões</p>
                      <p className="text-2xl font-bold text-purple-900">{aggregatedData.total_conversions}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-orange-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-orange-600">Taxa Conversão</p>
                      <p className="text-2xl font-bold text-orange-900">{aggregatedData.conversion_rate}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Network Insights */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
              Análise da Rede
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="challenges">Desafios da Rede</Label>
                <Textarea
                  id="challenges"
                  {...register('data.challenges')}
                  placeholder="Descreva os principais desafios enfrentados pela rede..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="victories">Vitórias da Rede</Label>
                <Textarea
                  id="victories"
                  {...register('data.victories')}
                  placeholder="Compartilhe as vitórias e conquistas da rede..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prayer_requests">Pedidos de Oração</Label>
                <Textarea
                  id="prayer_requests"
                  {...register('data.prayer_requests')}
                  placeholder="Liste os pedidos de oração da rede..."
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
              placeholder="Adicione observações gerais sobre o relatório da rede..."
              rows={4}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || isLoadingData}>
              {loading ? 'Salvando...' : 'Gerar Relatório da Rede'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default NetworkReportForm;
