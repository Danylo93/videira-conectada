import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Event, EventRegistrationData } from '@/types/event';

interface RegistrationFormProps {
  event: Event;
  user: { id: string; name: string; phone?: string };
  onSubmit: (data: EventRegistrationData) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function RegistrationForm({ event, user, onSubmit, onCancel, loading = false }: RegistrationFormProps) {
  const [formData, setFormData] = useState<EventRegistrationData>({
    event_id: event.id,
    participant_name: user.name,
    phone: user.phone || '',
    leader_name: user.name,
    discipulador_name: user.name,
    role: 'discipulador',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const isFormValid = formData.participant_name && formData.phone && formData.role;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="participant_name">Nome Completo</Label>
        <Input
          id="participant_name"
          value={formData.participant_name}
          onChange={(e) => setFormData({ ...formData, participant_name: e.target.value })}
          placeholder="Seu nome completo"
          required
        />
      </div>

      <div>
        <Label htmlFor="phone">Telefone</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="(11) 99999-9999"
          required
        />
      </div>

      <div>
        <Label htmlFor="role">Função</Label>
        <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione sua função" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="discipulador">Discipulador</SelectItem>
            <SelectItem value="lider">Líder</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-muted p-4 rounded-lg">
        <h4 className="font-semibold mb-2">Detalhes do Evento</h4>
        <p className="text-sm text-muted-foreground">
          <strong>Evento:</strong> {event.name}
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>Data:</strong> {new Date(event.event_date).toLocaleDateString('pt-BR')}
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>Local:</strong> {event.location}
        </p>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={!isFormValid || loading}>
          {loading ? 'Inscrevendo...' : 'Confirmar Inscrição'}
        </Button>
      </div>
    </form>
  );
}
