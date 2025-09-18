export interface Event {
  id: string;
  name: string;
  description: string;
  event_date: string;
  location: string;
  type: string;
  max_capacity: number | null;
  active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  participant_name: string;
  phone: string;
  leader_name: string;
  discipulador_name: string;
  role: string;
  registration_date: string;
  created_at: string;
}

export interface CreateEventData {
  name: string;
  description: string;
  event_date: string;
  location: string;
  type: string;
  max_capacity?: number;
}

export interface EventRegistrationData {
  event_id: string;
  participant_name: string;
  phone: string;
  leader_name: string;
  discipulador_name: string;
  role: string;
}

export type EventType = 'conferencia' | 'retiro' | 'workshop' | 'culto' | 'outro';
export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
