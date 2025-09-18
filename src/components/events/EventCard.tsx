import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, UserPlus, Eye, CheckCircle, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Event } from '@/types/event';

interface EventCardProps {
  event: Event;
  userRole: 'pastor' | 'obreiro' | 'discipulador' | 'lider';
  isRegistered?: boolean;
  onRegister?: (event: Event) => void;
  onEdit?: (event: Event) => void;
  onDelete?: (eventId: string) => void;
  onView?: (event: Event) => void;
  onCancelRegistration?: (eventId: string) => void;
}

const EVENT_TYPES = [
  { value: 'conferencia', label: 'Conferência' },
  { value: 'retiro', label: 'Retiro' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'culto', label: 'Culto' },
  { value: 'outro', label: 'Outro' },
];

export function EventCard({
  event,
  userRole,
  isRegistered = false,
  onRegister,
  onEdit,
  onDelete,
  onView,
  onCancelRegistration,
}: EventCardProps) {
  const getEventTypeLabel = (type: string) => {
    return EVENT_TYPES.find(t => t.value === type)?.label || type;
  };

  const getEventStatus = (eventDate: string) => {
    const now = new Date();
    const eventDateObj = new Date(eventDate);
    
    if (eventDateObj < now) return 'completed';
    if (eventDateObj.toDateString() === now.toDateString()) return 'ongoing';
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

  const status = getEventStatus(event.event_date);
  const canManage = userRole === 'pastor' || userRole === 'obreiro';
  const canRegister = userRole === 'discipulador' && !isRegistered && status !== 'completed';

  return (
    <Card className="hover:shadow-lg transition-shadow">
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
            {canManage && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit?.(event)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDelete?.(event.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
            {canRegister && (
              <Button
                size="sm"
                onClick={() => onRegister?.(event)}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Inscrever-se
              </Button>
            )}
            {isRegistered && (
              <Button size="sm" variant="outline" disabled>
                <CheckCircle className="w-4 h-4 mr-2" />
                Inscrito
              </Button>
            )}
            {userRole === 'lider' && (
              <Badge variant="outline" className="text-xs">
                <Eye className="w-3 h-3 mr-1" />
                Apenas visualização
              </Badge>
            )}
            {onView && (
              <Button size="sm" variant="outline" onClick={() => onView(event)}>
                <Eye className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
