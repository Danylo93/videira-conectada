import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { eventsService } from '@/integrations/supabase/events';
import type { Event, EventRegistration, EventRegistrationData } from '@/types/event';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MapPin, Users, UserPlus, Eye, CheckCircle } from 'lucide-react';
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

export default function EventsDiscipulador() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<(EventRegistration & { event: Event })[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRegistrationDialogOpen, setIsRegistrationDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [registrationData, setRegistrationData] = useState<EventRegistrationData>({
    event_id: '',
    participant_name: '',
    phone: '',
    leader_name: '',
    discipulador_name: '',
    role: 'discipulador',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [eventsData, registrationsData] = await Promise.all([
        eventsService.getEvents(),
        user ? eventsService.getUserRegistrations(user.id) : Promise.resolve([])
      ]);
      setEvents(eventsData);
      setMyRegistrations(registrationsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    try {
      if (!user || !selectedEvent) return;

      // Verificar se já está inscrito
      const isRegistered = await eventsService.isUserRegistered(selectedEvent.id, user.id);
      if (isRegistered) {
        toast({
          title: 'Aviso',
          description: 'Você já está inscrito neste evento.',
          variant: 'destructive',
        });
        return;
      }

      // Verificar capacidade
      const registrationCount = await eventsService.getEventRegistrationCount(selectedEvent.id);
      if (selectedEvent.max_capacity && registrationCount >= selectedEvent.max_capacity) {
        toast({
          title: 'Aviso',
          description: 'Este evento atingiu a capacidade máxima.',
          variant: 'destructive',
        });
        return;
      }

      await eventsService.registerForEvent({
        ...registrationData,
        event_id: selectedEvent.id,
        discipulador_name: user.name,
        leader_name: user.name, // Discipulador se registra como líder também
      });

      toast({
        title: 'Sucesso',
        description: 'Inscrição realizada com sucesso!',
      });
      setIsRegistrationDialogOpen(false);
      setSelectedEvent(null);
      loadData();
    } catch (error) {
      console.error('Erro ao se inscrever:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível realizar a inscrição.',
        variant: 'destructive',
      });
    }
  };

  const handleCancelRegistration = async (registrationId: string) => {
    try {
      await eventsService.cancelRegistration(registrationId);
      toast({
        title: 'Sucesso',
        description: 'Inscrição cancelada com sucesso!',
      });
      loadData();
    } catch (error) {
      console.error('Erro ao cancelar inscrição:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível cancelar a inscrição.',
        variant: 'destructive',
      });
    }
  };

  const openRegistrationDialog = (event: Event) => {
    setSelectedEvent(event);
    setRegistrationData({
      event_id: event.id,
      participant_name: user?.name || '',
      phone: user?.phone || '',
      leader_name: user?.name || '',
      discipulador_name: user?.name || '',
      role: 'discipulador',
    });
    setIsRegistrationDialogOpen(true);
  };

  const getEventTypeLabel = (type: string) => {
    return EVENT_TYPES.find(t => t.value === type)?.label || type;
  };

  const getEventStatus = (eventDate: string) => {
    const now = new Date();
    const event = new Date(eventDate);
    
    if (event < now) return 'completed';
    if (event.toDateString() === now.toDateString()) return 'ongoing';
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

  const isEventRegistered = (eventId: string) => {
    return myRegistrations.some(reg => reg.event_id === eventId);
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
      <div>
        <h1 className="text-3xl font-bold">Eventos</h1>
        <p className="text-muted-foreground">
          Visualize e participe dos eventos da igreja
        </p>
      </div>

      <Tabs defaultValue="available" className="space-y-4">
        <TabsList>
          <TabsTrigger value="available">Eventos Disponíveis</TabsTrigger>
          <TabsTrigger value="my-registrations">Minhas Inscrições</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => {
              const status = getEventStatus(event.event_date);
              const isRegistered = isEventRegistered(event.id);
              
              return (
                <Card key={event.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{event.name}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(event.event_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
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
                        {isRegistered ? (
                          <Button size="sm" variant="outline" disabled>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Inscrito
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => openRegistrationDialog(event)}
                            disabled={status === 'completed'}
                          >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Inscrever-se
                          </Button>
                        )}
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4" />
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
              <h3 className="text-lg font-semibold mb-2">Nenhum evento disponível</h3>
              <p className="text-muted-foreground">
                Não há eventos cadastrados no momento
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-registrations" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {myRegistrations.map((registration) => {
              const event = registration.event;
              const status = getEventStatus(event.event_date);
              
              return (
                <Card key={registration.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{event.name}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(event.event_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
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
                      <div className="text-sm">
                        <Badge variant="outline">{getEventTypeLabel(event.type)}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {event.description}
                      </p>
                      <div className="text-sm text-muted-foreground">
                        <p>Inscrito em: {format(new Date(registration.registration_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleCancelRegistration(registration.id)}
                          disabled={status === 'completed'}
                        >
                          Cancelar Inscrição
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {myRegistrations.length === 0 && (
            <div className="text-center py-12">
              <UserPlus className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma inscrição encontrada</h3>
              <p className="text-muted-foreground">
                Você ainda não se inscreveu em nenhum evento
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog de Inscrição */}
      <Dialog open={isRegistrationDialogOpen} onOpenChange={setIsRegistrationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inscrever-se no Evento</DialogTitle>
            <DialogDescription>
              Confirme seus dados para se inscrever no evento
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="participant_name">Nome Completo</Label>
              <Input
                id="participant_name"
                value={registrationData.participant_name}
                onChange={(e) => setRegistrationData({ ...registrationData, participant_name: e.target.value })}
                placeholder="Seu nome completo"
              />
            </div>
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={registrationData.phone}
                onChange={(e) => setRegistrationData({ ...registrationData, phone: e.target.value })}
                placeholder="(11) 99999-9999"
              />
            </div>
            <div>
              <Label htmlFor="role">Função</Label>
              <Select value={registrationData.role} onValueChange={(value) => setRegistrationData({ ...registrationData, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione sua função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="discipulador">Discipulador</SelectItem>
                  <SelectItem value="lider">Líder</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsRegistrationDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleRegister}>
                Confirmar Inscrição
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
