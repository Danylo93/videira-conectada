import { useAuth } from '@/contexts/AuthContext';
import EventsAdmin from './EventsAdmin';
import EventsDiscipulador from './EventsDiscipulador';
import EventsLeader from './EventsLeader';

export default function Events() {
  const { user } = useAuth();

  if (!user) return null;

  // Roteamento baseado no papel do usuário
  switch (user.role) {
    case 'pastor':
    case 'obreiro':
      return <EventsAdmin />;
    case 'discipulador':
      return <EventsDiscipulador />;
    case 'lider':
      return <EventsLeader />;
    default:
      return <EventsLeader />;
  }
}
