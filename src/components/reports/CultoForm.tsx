// Enhanced Reports System - Culto Form Component
// Reusable form component for creating and editing cultos

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
import { CalendarIcon, Clock, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const cultoSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  type: z.enum(['adultos', 'jovens', 'criancas', 'especial']),
  date: z.date({
    required_error: 'Data é obrigatória',
  }),
  start_time: z.string().min(1, 'Horário de início é obrigatório'),
  end_time: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

type CultoFormData = z.infer<typeof cultoSchema>;

interface CultoFormProps {
  onSubmit: (data: CultoFormData) => void;
  onCancel: () => void;
  initialData?: Partial<CultoFormData>;
  loading?: boolean;
}

const CultoForm: React.FC<CultoFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  loading = false
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    initialData?.date || new Date()
  );
  const [showCalendar, setShowCalendar] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<CultoFormData>({
    resolver: zodResolver(cultoSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      type: initialData?.type || 'adultos',
      date: initialData?.date || new Date(),
      start_time: initialData?.start_time || '19:00',
      end_time: initialData?.end_time || '',
      location: initialData?.location || '',
      notes: initialData?.notes || '',
    }
  });

  const handleFormSubmit = (data: CultoFormData) => {
    onSubmit({
      ...data,
      date: selectedDate!
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Novo Culto</CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informações Básicas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Culto</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="Ex: Culto de Jovens - Fogo Jovem"
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipo do Culto</Label>
                <Select
                  value={watch('type')}
                  onValueChange={(value) => setValue('type', value as any)}
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
                {errors.type && (
                  <p className="text-sm text-red-600">{errors.type.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Descreva o culto..."
                rows={3}
              />
            </div>
          </div>

          {/* Date and Time */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Data e Horário</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Data do Culto</Label>
                <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date);
                        setValue('date', date!);
                        setShowCalendar(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.date && (
                  <p className="text-sm text-red-600">{errors.date.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_time">Horário de Início</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="start_time"
                    type="time"
                    className="pl-10"
                    {...register('start_time')}
                  />
                </div>
                {errors.start_time && (
                  <p className="text-sm text-red-600">{errors.start_time.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_time">Horário de Fim (Opcional)</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="end_time"
                    type="time"
                    className="pl-10"
                    {...register('end_time')}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Location and Additional Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Localização e Observações</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="location">Local</Label>
                <Input
                  id="location"
                  {...register('location')}
                  placeholder="Ex: Templo Principal, Salão das Crianças"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  {...register('notes')}
                  placeholder="Adicione observações sobre o culto..."
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Culto'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CultoForm;
