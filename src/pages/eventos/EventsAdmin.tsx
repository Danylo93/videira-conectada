import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { eventsService } from '@/integrations/supabase/events';
import type { Event, CreateEventData } from '@/types/event';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, MapPin, Users, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const EVENT_TYPES = [
  { value: 'conferencia', label: 'Conferência' },
  { value: 'retiro', label: 'Retiro' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'culto', label: 'Culto' },
  { value: 'outro', label: 'Outro' },
];

export default function EventsAdmin() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState<CreateEventData>({
    name: '',
    description: '',
    event_date: '',
    location: '',
    type: '',
    max_capacity: undefined,
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await eventsService.getEvents();
      setEvents(data);
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os eventos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    try {
      if (!user) return;

      await eventsService.createEvent(formData, user.id);
      toast({
        title: 'Sucesso',
        description: 'Evento criado com sucesso!',
      });
      setIsCreateDialogOpen(false);
      setFormData({
        name: '',
        description: '',
        event_date: '',
        location: '',
        type: '',
        max_capacity: undefined,
      });
      loadEvents();
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o evento.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateEvent = async () => {
    try {
      if (!selectedEvent) return;

      await eventsService.updateEvent(selectedEvent.id, formData);
      toast({
        title: 'Sucesso',
        description: 'Evento atualizado com sucesso!',
      });
      setIsEditDialogOpen(false);
      setSelectedEvent(null);
      loadEvents();
    } catch (error) {
      console.error('Erro ao atualizar evento:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o evento.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await eventsService.deleteEvent(eventId);
      toast({
        title: 'Sucesso',
        description: 'Evento removido com sucesso!',
      });
      loadEvents();
    } catch (error) {
      console.error('Erro ao remover evento:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o evento.',
        variant: 'destructive',
      });
    }
  };

  // Helper para converter Date para string no formato YYYY-MM-DD (timezone local)
  // Quando o Supabase retorna a data, ela vem como ISO string (UTC)
  // A data foi salva como 03:00 UTC do dia selecionado (representa meia-noite no Brasil UTC-3)
  // Então usamos métodos UTC para extrair o dia, mês e ano corretos
  const formatDateForInput = (dateString: string): string => {
    const date = new Date(dateString);
    // Usa métodos UTC porque a data foi salva como 03:00 UTC do dia selecionado
    // Então precisamos ler como UTC para obter o dia correto
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper para formatar data para exibição (usando UTC para evitar problemas de timezone)
  // A data vem do Supabase como ISO string (ex: "2025-11-29T03:00:00.000Z")
  // Precisamos extrair o dia, mês e ano diretamente da string UTC, sem conversão de timezone
  const formatDateForDisplay = (dateString: string): string => {
    const date = new Date(dateString);
    // Usa métodos UTC para extrair o dia, mês e ano corretos
    // Isso garante que o dia exibido seja o mesmo que foi salvo no banco
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth(); // 0-11
    const day = date.getUTCDate();
    
    // Cria uma data local usando os valores UTC (sem conversão de timezone)
    // Isso garante que o format do date-fns use o dia correto
    const localDate = new Date(year, month, day);
    return format(localDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const openEditDialog = (event: Event) => {
    setSelectedEvent(event);
    setFormData({
      name: event.name,
      description: event.description,
      event_date: formatDateForInput(event.event_date),
      location: event.location,
      type: event.type,
      max_capacity: event.max_capacity || undefined,
    });
    setIsEditDialogOpen(true);
  };

  const getEventTypeLabel = (type: string) => {
    return EVENT_TYPES.find(t => t.value === type)?.label || type;
  };

  const getEventStatus = (eventDate: string) => {
    const now = new Date();
    const event = new Date(eventDate);
    
    // Compara usando UTC para evitar problemas de timezone
    const nowUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const eventUTC = new Date(Date.UTC(event.getUTCFullYear(), event.getUTCMonth(), event.getUTCDate()));
    
    if (eventUTC < nowUTC) return 'completed';
    if (eventUTC.getTime() === nowUTC.getTime()) return 'ongoing';
    return 'upcoming';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Badge variant="secondary">Próximo</Badge>;
      case 'ongoing':
        return <Badge variant="default">Hoje</Badge>;
      case 'completed':
        return <Badge variant="outline">Finalizado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Eventos</h1>
          <p className="text-muted-foreground">
            Crie e gerencie eventos da igreja
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Evento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Evento</DialogTitle>
              <DialogDescription>
                Preencha as informações do evento
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome do Evento</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Conferência de Avivamento"
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
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateEvent}>
                  Criar Evento
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => {
          const status = getEventStatus(event.event_date);
          return (
            <Card key={event.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{event.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Calendar className="w-4 h-4" />
                      {formatDateForDisplay(event.event_date)}
                    </CardDescription>
                  </div>
                  {getStatusBadge(status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {event.location}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    {event.max_capacity ? `Capacidade: ${event.max_capacity}` : 'Sem limite de capacidade'}
                  </div>
                  <div className="text-sm">
                    <Badge variant="outline">{getEventTypeLabel(event.type)}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {event.description}
                  </p>
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(event)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteEvent(event.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {events.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum evento encontrado</h3>
          <p className="text-muted-foreground mb-4">
            Crie seu primeiro evento para começar
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Criar Primeiro Evento
          </Button>
        </div>
      )}

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Evento</DialogTitle>
            <DialogDescription>
              Atualize as informações do evento
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Nome do Evento</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Conferência de Avivamento"
                />
              </div>
              <div>
                <Label htmlFor="edit-type">Tipo</Label>
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
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o evento..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-event_date">Data do Evento</Label>
                <Input
                  id="edit-event_date"
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-max_capacity">Capacidade Máxima (opcional)</Label>
                <Input
                  id="edit-max_capacity"
                  type="number"
                  value={formData.max_capacity || ''}
                  onChange={(e) => setFormData({ ...formData, max_capacity: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="Ex: 100"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-location">Local</Label>
              <Input
                id="edit-location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Ex: Igreja Videira São Miguel"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateEvent}>
                Atualizar Evento
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
