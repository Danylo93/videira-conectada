import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Event, CreateEventData } from '@/types/event';

const EVENT_TYPES = [
  { value: 'conferencia', label: 'Conferência' },
  { value: 'retiro', label: 'Retiro' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'culto', label: 'Culto' },
  { value: 'outro', label: 'Outro' },
];

interface EventFormProps {
  event?: Event;
  onSubmit: (data: CreateEventData) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function EventForm({ event, onSubmit, onCancel, loading = false }: EventFormProps) {
  const [formData, setFormData] = useState<CreateEventData>({
    name: '',
    description: '',
    event_date: '',
    location: '',
    type: '',
    max_capacity: undefined,
  });

  useEffect(() => {
    if (event) {
      setFormData({
        name: event.name,
        description: event.description,
        event_date: event.event_date.split('T')[0],
        location: event.location,
        type: event.type,
        max_capacity: event.max_capacity || undefined,
      });
    }
  }, [event]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const isFormValid = formData.name && formData.description && formData.event_date && formData.location && formData.type;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nome do Evento</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Conferência de Avivamento"
            required
          />
        </div>
        <div>
          <Label htmlFor="type">Tipo</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              {EVENT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descreva o evento..."
          rows={3}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="event_date">Data do Evento</Label>
          <Input
            id="event_date"
            type="date"
            value={formData.event_date}
            onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="max_capacity">Capacidade Máxima (opcional)</Label>
          <Input
            id="max_capacity"
            type="number"
            value={formData.max_capacity || ''}
            onChange={(e) => setFormData({ ...formData, max_capacity: e.target.value ? parseInt(e.target.value) : undefined })}
            placeholder="Ex: 100"
            min="1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="location">Local</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          placeholder="Ex: Igreja Videira São Miguel"
          required
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={!isFormValid || loading}>
          {loading ? 'Salvando...' : event ? 'Atualizar Evento' : 'Criar Evento'}
        </Button>
      </div>
    </form>
  );
}
