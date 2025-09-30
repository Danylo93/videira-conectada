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

export interface CreateEncounterEventData {
  name: string;
  description: string;
  event_dates: string[]; // Múltiplas datas para o encontro
  location: string;
  encounterType: 'jovens' | 'adultos';
  max_capacity?: number;
  registration_deadline?: string; // Data limite para inscrições
  price?: number; // Preço do encontro
  requirements?: string; // Requisitos para participação
  status: 'draft' | 'published' | 'cancelled' | 'completed';
}

export interface EncounterEvent {
  id: string;
  name: string;
  description: string;
  event_dates: string[];
  location: string;
  encounterType: 'jovens' | 'adultos';
  max_capacity?: number;
  registration_deadline?: string;
  price?: number;
  requirements?: string;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  created_by: string;
  created_at: string;
  updated_at: string;
  registrations_count: number;
  attended_count: number;
  total_revenue: number;
}

export interface EncounterEventFilters {
  status?: 'draft' | 'published' | 'cancelled' | 'completed';
  encounterType?: 'jovens' | 'adultos';
  dateRange?: {
    start: string;
    end: string;
  };
  search?: string;
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
