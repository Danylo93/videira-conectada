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

export interface CellReport {
  id: string;
  liderId: string;
  weekStart: Date;
  members: Member[];
  frequentadores: Member[];
  phase: 'Comunhão' | 'Edificação' | 'Evangelismo' | 'Multiplicação';
  multiplicationDate?: Date;
  observations?: string;
  submittedAt: Date;
  status: 'draft' | 'submitted' | 'approved';
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