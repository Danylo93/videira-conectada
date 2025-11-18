export interface Leader {
  id: string;
  name: string;
  email: string;
  phone?: string;
  discipuladorId: string;
  pastorId?: string;
  createdAt: Date;
}

export interface Discipulador {
  id: string;
  name: string;
  email: string;
  phone?: string;
  pastorId: string;
  createdAt: Date;
}

export interface Member {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  type: 'member' | 'frequentador'; // member or visitor
  liderId: string;
  joinDate: Date;
  lastPresence?: Date;
  active: boolean;
}

export type LostReason = 'critico' | 'regular' | 'amarelo';

export interface LostMember {
  id: string;
  reason: LostReason;
}

export interface CellReport {
  id: string;
  liderId: string;
  weekStart: Date;
  members: Member[];
  frequentadores: Member[];
  lostMembers?: LostMember[];
  phase: 'Comunhão' | 'Edificação' | 'Evangelismo' | 'Multiplicação';
  multiplicationDate?: Date;
  observations?: string;
  submittedAt: Date;
  status: 'draft' | 'submitted' | 'approved' | 'needs_correction';
}

export interface ServiceAttendanceReport {
  id: string;
  liderId: string;
  serviceDate: Date;
  members: Member[];
  frequentadores: Member[];
  observations?: string;
  submittedAt: Date;
  status: 'draft' | 'submitted' | 'approved' | 'needs_correction';
  totalAttendance?: number;
}

export interface Course {
  id: string;
  name: 'Maturidade no Espírito' | 'CTL';
  description: string;
  duration: string;
  price?: number;
}

export interface CourseRegistration {
  id: string;
  courseId: string;
  memberId: string;
  liderId: string;
  registrationDate: Date;
  status: 'pending' | 'approved' | 'completed';
  paymentStatus?: 'pending' | 'paid';
}

export interface Event {
  id: string;
  name: string;
  type: 'Encontro' | 'Conferência' | 'Imersão';
  description: string;
  date: Date;
  location: string;
  createdBy: string; // Pastor/Obreiro/Discipulador ID
  registrations: EventRegistration[];
  maxCapacity?: number;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  participantName: string;
  leaderName: string;
  phone: string;
  role: string;
  discipuladorName: string;
  registrationDate: Date;
}

export interface TitheOffering {
  id: string;
  personId: string;
  personName: string;
  personType: 'member' | 'frequentador' | 'lider' | 'discipulador' | 'pastor';
  type: 'tithe' | 'offering' | 'special_offering';
  amount: number;
  month: number;
  year: number;
  description?: string;
  paymentMethod: 'cash' | 'pix' | 'card' | 'bank_transfer';
  receivedBy: string; // ID do pastor/obreiro que recebeu
  receivedByName: string;
  receivedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TitheOfferingFilters {
  personType?: 'member' | 'frequentador' | 'lider' | 'discipulador' | 'pastor';
  type?: 'tithe' | 'offering' | 'special_offering';
  month?: number;
  year?: number;
  search?: string;
  receivedBy?: string;
}

export interface TitheOfferingStats {
  totalTithes: number;
  totalOfferings: number;
  totalSpecialOfferings: number;
  totalAmount: number;
  monthlyBreakdown: Array<{
    month: number;
    year: number;
    tithes: number;
    offerings: number;
    specialOfferings: number;
    total: number;
  }>;
  byPersonType: Array<{
    personType: string;
    count: number;
    totalAmount: number;
  }>;
  byPaymentMethod: Array<{
    paymentMethod: string;
    count: number;
    totalAmount: number;
  }>;
}