// Enhanced Course System Types
// Comprehensive type definitions for the course management system

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
  requirements: string[];
  learning_objectives: string[];
  materials_included: string[];
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
  prerequisites: string[];
  learning_outcomes: string[];
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
  materials: string[];
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
  assigned_modules: string[];
  hourly_rate?: number;
  created_at: string;
  instructor?: {
    id: string;
    name: string;
    role: string;
  };
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
  student?: {
    id: string;
    name: string;
    type: 'member' | 'frequentador';
  };
  course?: Course;
  leader?: {
    id: string;
    name: string;
    role: string;
  };
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
  lesson?: CourseLesson;
  student?: {
    id: string;
    name: string;
  };
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

export interface CourseAssessment {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  assessment_type: 'quiz' | 'exam' | 'project' | 'presentation' | 'practical' | 'participation';
  weight_percentage: number;
  max_score: number;
  passing_score: number;
  due_date?: string;
  instructions?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  course?: Course;
  created_by_profile?: {
    id: string;
    name: string;
  };
}

export interface CourseGrade {
  id: string;
  assessment_id: string;
  registration_id: string;
  score?: number;
  max_score: number;
  grade_letter?: string;
  feedback?: string;
  graded_by?: string;
  graded_at?: string;
  created_at: string;
  updated_at: string;
  assessment?: CourseAssessment;
  student?: {
    id: string;
    name: string;
  };
}

export interface CourseCertificate {
  id: string;
  registration_id: string;
  certificate_number: string;
  issued_date: string;
  valid_until?: string;
  digital_signature?: string;
  issued_by: string;
  status: 'active' | 'revoked' | 'expired';
  created_at: string;
  student?: {
    id: string;
    name: string;
  };
  course?: Course;
}

// Form data types
export interface CreateCourseData {
  name: string;
  description?: string;
  short_description?: string;
  duration_weeks: number;
  price: number;
  max_students?: number;
  min_students?: number;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  category: 'spiritual' | 'leadership' | 'ministry' | 'biblical' | 'practical';
  start_date?: string;
  end_date?: string;
  registration_deadline?: string;
  requirements: string[];
  learning_objectives: string[];
  materials_included: string[];
  certification_required: boolean;
  certification_name?: string;
}

export interface UpdateCourseData extends Partial<CreateCourseData> {
  status?: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
}

export interface CreateModuleData {
  course_id: string;
  title: string;
  description?: string;
  order_index?: number;
  duration_hours?: number;
  is_required?: boolean;
  prerequisites?: string[];
  learning_outcomes?: string[];
}

export interface CreateLessonData {
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
  order_index?: number;
  is_mandatory?: boolean;
  max_attendance?: number;
}

export interface CreateRegistrationData {
  course_id: string;
  student_id: string;
  payment_plan?: 'full' | 'installments' | 'scholarship';
  installment_count?: number;
  notes?: string;
  emergency_contact?: string;
  medical_info?: string;
  special_needs?: string;
}

export interface CreatePaymentData {
  registration_id: string;
  amount: number;
  payment_method: 'cash' | 'pix' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'check' | 'scholarship';
  payment_reference?: string;
  installment_number?: number;
  due_date?: string;
  paid_date?: string;
  notes?: string;
}

export interface CreateAssessmentData {
  course_id: string;
  title: string;
  description?: string;
  assessment_type: 'quiz' | 'exam' | 'project' | 'presentation' | 'practical' | 'participation';
  weight_percentage: number;
  max_score: number;
  passing_score: number;
  due_date?: string;
  instructions?: string;
}

export interface CreateGradeData {
  assessment_id: string;
  registration_id: string;
  score?: number;
  max_score?: number;
  grade_letter?: string;
  feedback?: string;
}

// Statistics and analytics types
export interface CourseStats {
  total_courses: number;
  active_courses: number;
  total_students: number;
  total_registrations: number;
  completion_rate: number;
  average_attendance: number;
  revenue: number;
  pending_payments: number;
}

export interface CourseAnalytics {
  course_id: string;
  course_name: string;
  total_students: number;
  completion_rate: number;
  average_attendance: number;
  revenue: number;
  student_satisfaction?: number;
  instructor_rating?: number;
}

export interface StudentProgress {
  registration_id: string;
  student_name: string;
  course_name: string;
  progress_percentage: number;
  attendance_rate: number;
  average_grade: number;
  completed_modules: number;
  total_modules: number;
  status: string;
  last_attendance?: string;
}

// Filter and search types
export interface CourseFilters {
  category?: string;
  difficulty_level?: string;
  status?: string;
  instructor_id?: string;
  start_date_from?: string;
  start_date_to?: string;
  price_min?: number;
  price_max?: number;
  search?: string;
}

export interface RegistrationFilters {
  course_id?: string;
  status?: string;
  payment_status?: string;
  leader_id?: string;
  student_name?: string;
}

// Dashboard data types
export interface CourseDashboardData {
  recent_courses: Course[];
  upcoming_lessons: CourseLesson[];
  pending_registrations: CourseRegistration[];
  attendance_summary: {
    total_students: number;
    present_today: number;
    absent_today: number;
    attendance_rate: number;
  };
  financial_summary: {
    total_revenue: number;
    pending_payments: number;
    monthly_revenue: number;
  };
  student_progress: StudentProgress[];
}

// Export all types
export type {
  Course,
  CourseModule,
  CourseLesson,
  CourseInstructor,
  CourseRegistration,
  CourseAttendance,
  CoursePayment,
  CourseAssessment,
  CourseGrade,
  CourseCertificate,
  CreateCourseData,
  UpdateCourseData,
  CreateModuleData,
  CreateLessonData,
  CreateRegistrationData,
  CreatePaymentData,
  CreateAssessmentData,
  CreateGradeData,
  CourseStats,
  CourseAnalytics,
  StudentProgress,
  CourseFilters,
  RegistrationFilters,
  CourseDashboardData,
};
