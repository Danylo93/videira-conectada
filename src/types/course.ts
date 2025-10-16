// Tipos para o sistema de cursos
export interface Course {
  id: string;
  name: string;
  description?: string;
  short_description?: string;
  duration_weeks: number;
  price: number;
  max_students?: number;
  min_students: number;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  category: 'spiritual' | 'leadership' | 'ministry' | 'biblical' | 'practical';
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  start_date?: string;
  end_date?: string;
  registration_deadline?: string;
  requirements?: string[];
  learning_objectives?: string[];
  materials_included?: string[];
  certification_required: boolean;
  certification_name?: string;
  created_by: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  order_index: number;
  duration_hours: number;
  is_required: boolean;
  prerequisites?: string[];
  learning_outcomes?: string[];
  created_at: string;
  updated_at: string;
}

export interface CourseLesson {
  id: string;
  module_id: string;
  title: string;
  description?: string;
  lesson_type: 'classroom' | 'online' | 'practical' | 'field_work' | 'assessment';
  scheduled_date?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  online_link?: string;
  materials?: string[];
  homework?: string;
  order_index: number;
  is_mandatory: boolean;
  max_attendance?: number;
  created_at: string;
  updated_at: string;
}

export interface CourseInstructor {
  id: string;
  course_id: string;
  instructor_id: string;
  role: 'instructor' | 'assistant' | 'mentor' | 'evaluator';
  is_primary: boolean;
  assigned_modules?: string[];
  hourly_rate?: number;
  created_at: string;
}

export interface CourseRegistration {
  id: string;
  course_id: string;
  student_id: string;
  leader_id: string;
  registration_date: string;
  status: 'pending' | 'approved' | 'rejected' | 'enrolled' | 'completed' | 'dropped' | 'suspended';
  payment_status: 'pending' | 'partial' | 'paid' | 'refunded' | 'cancelled';
  total_amount: number;
  paid_amount: number;
  scholarship_amount: number;
  payment_plan: 'full' | 'installments' | 'scholarship';
  installment_count: number;
  notes?: string;
  emergency_contact?: string;
  medical_info?: string;
  special_needs?: string;
  approved_by?: string;
  approved_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CourseAttendance {
  id: string;
  lesson_id: string;
  registration_id: string;
  status: 'present' | 'absent' | 'late' | 'excused' | 'makeup';
  check_in_time?: string;
  check_out_time?: string;
  notes?: string;
  marked_by?: string;
  marked_at: string;
  created_at: string;
}

export interface CoursePayment {
  id: string;
  registration_id: string;
  amount: number;
  payment_method: 'cash' | 'pix' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'check' | 'scholarship';
  payment_reference?: string;
  installment_number: number;
  due_date?: string;
  paid_date?: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
  notes?: string;
  processed_by?: string;
  created_at: string;
  updated_at: string;
}

// Tipos para formulários e filtros
export interface CourseFilters {
  status?: string;
  category?: string;
  difficulty_level?: string;
  search?: string;
}

export interface AttendanceFilters {
  lesson_id?: string;
  registration_id?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
}

// Tipos para estatísticas
export interface CourseStats {
  totalCourses: number;
  activeCourses: number;
  totalStudents: number;
  totalLessons: number;
  averageAttendance: number;
  completionRate: number;
  revenue: number;
}

export interface AttendanceStats {
  totalLessons: number;
  totalAttendance: number;
  attendanceRate: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  makeupCount: number;
}

// Tipos para relatórios
export interface AttendanceReport {
  studentId: string;
  studentName: string;
  courseName: string;
  totalLessons: number;
  attendedLessons: number;
  attendanceRate: number;
  status: 'approved' | 'pending' | 'failed';
}

export interface LessonAttendance {
  lessonId: string;
  lessonTitle: string;
  scheduledDate: string;
  attendance: {
    present: number;
    absent: number;
    late: number;
    excused: number;
    makeup: number;
  };
  totalStudents: number;
  attendanceRate: number;
}