import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { eventsService } from '@/integrations/supabase/events';
import type { Event } from '@/types/event';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, Eye } from 'lucide-react';
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

export default function EventsLeader() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

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
          Visualize os eventos da igreja
        </p>
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
                    <Badge variant="outline" className="text-xs">
                      <Eye className="w-3 h-3 mr-1" />
                      Apenas visualização
                    </Badge>
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
          <p className="text-muted-foreground">
            Não há eventos cadastrados no momento
          </p>
        </div>
      )}
    </div>
  );
}
