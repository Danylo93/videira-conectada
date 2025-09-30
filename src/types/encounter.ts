export type EncounterType = 'jovens' | 'adultos' | 'criancas';
export type EncounterRole = 'equipe' | 'encontrista' | 'cozinha';

export interface EncounterWithGod {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  encounterType: EncounterType;
  role: EncounterRole;
  attended: boolean;
  amountPaid: number;
  leaderId?: string;
  discipuladorId?: string;
  pastorId?: string;
  notes?: string;
  encounterDate: Date;
  eventId?: string; // Referência ao evento de encontro
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  // Relacionamentos
  leader?: {
    id: string;
    name: string;
  };
  discipulador?: {
    id: string;
    name: string;
  };
  pastor?: {
    id: string;
    name: string;
  };
  event?: {
    id: string;
    name: string;
    event_dates: string[];
  };
}

export interface CreateEncounterWithGodData {
  name: string;
  phone?: string;
  email?: string;
  encounterType: EncounterType;
  role: EncounterRole;
  attended: boolean;
  amountPaid: number;
  leaderId?: string;
  discipuladorId?: string;
  pastorId?: string;
  notes?: string;
  encounterDate: Date;
  eventId?: string; // Referência ao evento de encontro
}

export interface UpdateEncounterWithGodData extends Partial<CreateEncounterWithGodData> {
  id: string;
}

export interface EncounterFilters {
  encounterType?: EncounterType;
  role?: EncounterRole;
  attended?: boolean;
  encounterDate?: Date;
  leaderId?: string;
  discipuladorId?: string;
  pastorId?: string;
  search?: string;
  eventId?: string;
}

export interface EncounterStats {
  total: number;
  attended: number;
  notAttended: number;
  totalAmount: number;
  totalOfferings?: number;
  byType: {
    jovens: number;
    adultos: number;
    criancas: number;
  };
  byDate: Array<{
    date: string;
    count: number;
    attended: number;
    amount: number;
  }>;
}

