// Enhanced Reports System Types
// Comprehensive type definitions for the reporting system

export interface Culto {
  id: string;
  name: string;
  description?: string;
  type: 'adultos' | 'jovens' | 'criancas' | 'especial';
  date: string;
  start_time: string;
  end_time?: string;
  location?: string;
  pastor_id?: string;
  obreiro_id?: string;
  total_attendance: number;
  total_visitors: number;
  total_conversions: number;
  total_offerings: number;
  notes?: string;
  status: 'active' | 'cancelled' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface CultoAttendance {
  id: string;
  culto_id: string;
  member_id?: string;
  visitor_name?: string;
  visitor_phone?: string;
  visitor_email?: string;
  is_member: boolean;
  is_visitor: boolean;
  is_conversion: boolean;
  attendance_type: 'present' | 'absent' | 'late';
  notes?: string;
  registered_by?: string;
  created_at: string;
}

export interface LostMember {
  id: string;
  member_id: string;
  name: string;
  phone?: string;
  email?: string;
  last_attendance_date?: string;
  last_cell_meeting_date?: string;
  last_culto_date?: string;
  reason?: 'moved' | 'work' | 'family' | 'health' | 'other' | 'unknown';
  reason_details?: string;
  status: 'lost' | 'contacted' | 'returned' | 'transferred';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string;
  contact_attempts: number;
  last_contact_date?: string;
  last_contact_method?: string;
  last_contact_notes?: string;
  return_date?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ContactAttempt {
  id: string;
  lost_member_id: string;
  contact_method: 'phone' | 'whatsapp' | 'email' | 'visit' | 'letter' | 'other';
  contact_date: string;
  contact_time?: string;
  success: boolean;
  response?: 'answered' | 'no_answer' | 'busy' | 'refused' | 'wrong_number';
  notes?: string;
  next_contact_date?: string;
  created_by?: string;
  created_at: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  type: 'cell' | 'culto' | 'monthly' | 'quarterly' | 'annual' | 'custom';
  template_data: Record<string, any>;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: string;
  template_id?: string;
  report_type: 'cell' | 'culto' | 'monthly' | 'quarterly' | 'annual' | 'custom';
  period_start: string;
  period_end: string;
  data: Record<string, any>;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submitted_by?: string;
  submitted_at?: string;
  approved_by?: string;
  approved_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ReportSubmission {
  id: string;
  report_id: string;
  submitted_by: string;
  submitted_to: string;
  submission_date: string;
  status: 'pending' | 'approved' | 'rejected' | 'needs_revision';
  feedback?: string;
  created_at: string;
}

// ==================== DTOs (Data Transfer Objects) ====================

export interface CreateCultoData {
  name: string;
  description?: string;
  type: 'adultos' | 'jovens' | 'criancas' | 'especial';
  date: string;
  start_time: string;
  end_time?: string;
  location?: string;
  pastor_id?: string;
  obreiro_id?: string;
  notes?: string;
}

export interface UpdateCultoData extends Partial<CreateCultoData> {
  total_attendance?: number;
  total_visitors?: number;
  total_conversions?: number;
  total_offerings?: number;
  status?: 'active' | 'cancelled' | 'completed';
}

export interface CreateCultoAttendanceData {
  culto_id: string;
  member_id?: string;
  visitor_name?: string;
  visitor_phone?: string;
  visitor_email?: string;
  is_member?: boolean;
  is_visitor?: boolean;
  is_conversion?: boolean;
  attendance_type?: 'present' | 'absent' | 'late';
  notes?: string;
  registered_by?: string;
}

export interface CreateLostMemberData {
  member_id: string;
  name: string;
  phone?: string;
  email?: string;
  last_attendance_date?: string;
  last_cell_meeting_date?: string;
  last_culto_date?: string;
  reason?: 'moved' | 'work' | 'family' | 'health' | 'other' | 'unknown';
  reason_details?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string;
  created_by?: string;
}

export interface UpdateLostMemberData extends Partial<CreateLostMemberData> {
  status?: 'lost' | 'contacted' | 'returned' | 'transferred';
  contact_attempts?: number;
  last_contact_date?: string;
  last_contact_method?: string;
  last_contact_notes?: string;
  return_date?: string;
}

export interface CreateContactAttemptData {
  lost_member_id: string;
  contact_method: 'phone' | 'whatsapp' | 'email' | 'visit' | 'letter' | 'other';
  contact_date: string;
  contact_time?: string;
  success?: boolean;
  response?: 'answered' | 'no_answer' | 'busy' | 'refused' | 'wrong_number';
  notes?: string;
  next_contact_date?: string;
  created_by?: string;
}

export interface CreateReportData {
  template_id?: string;
  report_type: 'cell' | 'culto' | 'monthly' | 'quarterly' | 'annual' | 'custom';
  period_start: string;
  period_end: string;
  data: Record<string, any>;
  notes?: string;
}

export interface UpdateReportData extends Partial<CreateReportData> {
  status?: 'draft' | 'submitted' | 'approved' | 'rejected';
  submitted_by?: string;
  submitted_at?: string;
  approved_by?: string;
  approved_at?: string;
}

// ==================== FILTERS ====================

export interface CultoFilters {
  search?: string;
  type?: 'adultos' | 'jovens' | 'criancas' | 'especial';
  status?: 'active' | 'cancelled' | 'completed';
  date_from?: string;
  date_to?: string;
  pastor_id?: string;
  obreiro_id?: string;
}

export interface LostMemberFilters {
  search?: string;
  status?: 'lost' | 'contacted' | 'returned' | 'transferred';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  reason?: 'moved' | 'work' | 'family' | 'health' | 'other' | 'unknown';
  assigned_to?: string;
  last_contact_from?: string;
  last_contact_to?: string;
}

export interface ReportFilters {
  search?: string;
  report_type?: 'cell' | 'culto' | 'monthly' | 'quarterly' | 'annual' | 'custom';
  status?: 'draft' | 'submitted' | 'approved' | 'rejected';
  period_from?: string;
  period_to?: string;
  submitted_by?: string;
  approved_by?: string;
}

// ==================== DASHBOARD DATA ====================

export interface CultoStats {
  total_cultos: number;
  total_attendance: number;
  total_visitors: number;
  total_conversions: number;
  total_offerings: number;
  average_attendance: number;
  conversion_rate: number;
  cultos_by_type: Record<string, number>;
  attendance_trend: Array<{
    date: string;
    attendance: number;
    visitors: number;
    conversions: number;
  }>;
}

export interface LostMembersStats {
  total_lost: number;
  total_contacted: number;
  total_returned: number;
  total_transferred: number;
  by_priority: Record<string, number>;
  by_reason: Record<string, number>;
  by_status: Record<string, number>;
  contact_attempts_avg: number;
  return_rate: number;
}

export interface ReportsStats {
  total_reports: number;
  draft_reports: number;
  submitted_reports: number;
  approved_reports: number;
  rejected_reports: number;
  by_type: Record<string, number>;
  by_status: Record<string, number>;
  submission_trend: Array<{
    date: string;
    submitted: number;
    approved: number;
  }>;
}

export interface ReportsDashboardData {
  culto_stats: CultoStats;
  lost_members_stats: LostMembersStats;
  reports_stats: ReportsStats;
  recent_cultos: Culto[];
  recent_lost_members: LostMember[];
  recent_reports: Report[];
  pending_approvals: Report[];
}

// ==================== HIERARCHICAL REPORTS ====================

export interface HierarchicalReportData {
  level: 'pastor' | 'discipulador' | 'lider';
  user_id: string;
  user_name: string;
  period_start: string;
  period_end: string;
  data: {
    cell_reports: {
      total_meetings: number;
      total_attendance: number;
      total_visitors: number;
      total_conversions: number;
      average_attendance: number;
    };
    culto_attendance: {
      total_attendance: number;
      total_visitors: number;
      total_conversions: number;
      cultos_attended: number;
    };
    lost_members: {
      total_lost: number;
      total_contacted: number;
      total_returned: number;
      contact_attempts: number;
    };
    courses: {
      total_enrolled: number;
      total_completed: number;
      total_attendance: number;
      completion_rate: number;
    };
  };
  subordinates?: HierarchicalReportData[];
}

export interface ReportSubmissionData {
  report_id: string;
  submitted_by: string;
  submitted_to: string;
  submission_date: string;
  status: 'pending' | 'approved' | 'rejected' | 'needs_revision';
  feedback?: string;
  report_data: HierarchicalReportData;
}
