// Enhanced Course System - Supabase Integration
// Comprehensive service layer for course management

import { supabase } from './client';
import type {
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
} from '@/types/course';

// ==================== COURSES ====================

export async function createCourse(data: CreateCourseData): Promise<Course> {
  const { data: course, error } = await supabase
    .from('courses')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return course;
}

export async function getCourses(filters?: CourseFilters): Promise<Course[]> {
  try {
    let query = supabase
      .from('courses')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (filters) {
      if (filters.category) query = query.eq('category', filters.category);
      if (filters.difficulty_level) query = query.eq('difficulty_level', filters.difficulty_level);
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.price_min) query = query.gte('price', filters.price_min);
      if (filters.price_max) query = query.lte('price', filters.price_max);
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching courses:', error);
      throw new Error('Erro ao carregar cursos');
    }

    return data || [];
  } catch (error) {
    console.error('Error in getCourses:', error);
    return [];
  }
}

export async function getCourseById(id: string): Promise<Course | null> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function updateCourse(id: string, data: UpdateCourseData): Promise<Course> {
  const { data: course, error } = await supabase
    .from('courses')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return course;
}

export async function deleteCourse(id: string): Promise<void> {
  const { error } = await supabase
    .from('courses')
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

// ==================== COURSE MODULES ====================

export async function createModule(data: CreateModuleData): Promise<CourseModule> {
  const { data: module, error } = await supabase
    .from('course_modules')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return module;
}

export async function getCourseModules(courseId: string): Promise<CourseModule[]> {
  const { data, error } = await supabase
    .from('course_modules')
    .select('*')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function updateModule(id: string, data: Partial<CreateModuleData>): Promise<CourseModule> {
  const { data: module, error } = await supabase
    .from('course_modules')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return module;
}

export async function deleteModule(id: string): Promise<void> {
  const { error } = await supabase
    .from('course_modules')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ==================== COURSE LESSONS ====================

export async function createLesson(data: CreateLessonData): Promise<CourseLesson> {
  const { data: lesson, error } = await supabase
    .from('course_lessons')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return lesson;
}

export async function getModuleLessons(moduleId: string): Promise<CourseLesson[]> {
  const { data, error } = await supabase
    .from('course_lessons')
    .select('*')
    .eq('module_id', moduleId)
    .order('order_index', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getCourseLessons(courseId: string): Promise<CourseLesson[]> {
  const { data, error } = await supabase
    .from('course_lessons')
    .select(`
      *,
      course_modules!inner(course_id)
    `)
    .eq('course_modules.course_id', courseId)
    .order('scheduled_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function updateLesson(id: string, data: Partial<CreateLessonData>): Promise<CourseLesson> {
  const { data: lesson, error } = await supabase
    .from('course_lessons')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return lesson;
}

export async function deleteLesson(id: string): Promise<void> {
  const { error } = await supabase
    .from('course_lessons')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ==================== COURSE INSTRUCTORS ====================

export async function addInstructor(courseId: string, instructorId: string, role: string = 'instructor'): Promise<CourseInstructor> {
  const { data, error } = await supabase
    .from('course_instructors')
    .insert({
      course_id: courseId,
      instructor_id: instructorId,
      role,
    })
    .select(`
      *,
      instructor:instructor_id(id, name, role)
    `)
    .single();

  if (error) throw error;
  return data;
}

export async function getCourseInstructors(courseId: string): Promise<CourseInstructor[]> {
  const { data, error } = await supabase
    .from('course_instructors')
    .select(`
      *,
      instructor:instructor_id(id, name, role)
    `)
    .eq('course_id', courseId);

  if (error) throw error;
  return data || [];
}

export async function removeInstructor(id: string): Promise<void> {
  const { error } = await supabase
    .from('course_instructors')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ==================== COURSE REGISTRATIONS ====================

export async function createRegistration(data: CreateRegistrationData): Promise<CourseRegistration> {
  const { data: registration, error } = await supabase
    .from('course_registrations')
    .insert(data)
    .select(`
      *,
      student:student_id(id, name, type),
      course:course_id(*),
      leader:leader_id(id, name, role)
    `)
    .single();

  if (error) throw error;
  return registration;
}

export async function getRegistrations(filters?: RegistrationFilters): Promise<CourseRegistration[]> {
  let query = supabase
    .from('course_registrations')
    .select(`
      *,
      student:student_id(id, name, type),
      course:course_id(*),
      leader:leader_id(id, name, role)
    `)
    .order('registration_date', { ascending: false });

  if (filters) {
    if (filters.course_id) query = query.eq('course_id', filters.course_id);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.payment_status) query = query.eq('payment_status', filters.payment_status);
    if (filters.leader_id) query = query.eq('leader_id', filters.leader_id);
    if (filters.student_name) {
      query = query.ilike('student.name', `%${filters.student_name}%`);
    }
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function updateRegistration(id: string, data: Partial<CreateRegistrationData>): Promise<CourseRegistration> {
  const { data: registration, error } = await supabase
    .from('course_registrations')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(`
      *,
      student:student_id(id, name, type),
      course:course_id(*),
      leader:leader_id(id, name, role)
    `)
    .single();

  if (error) throw error;
  return registration;
}

export async function approveRegistration(id: string, approvedBy: string): Promise<CourseRegistration> {
  const { data: registration, error } = await supabase
    .from('course_registrations')
    .update({
      status: 'approved',
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(`
      *,
      student:student_id(id, name, type),
      course:course_id(*),
      leader:leader_id(id, name, role)
    `)
    .single();

  if (error) throw error;
  return registration;
}

// ==================== COURSE ATTENDANCE ====================

export async function markAttendance(lessonId: string, registrationId: string, status: string, notes?: string): Promise<CourseAttendance> {
  // Check if attendance already exists
  const { data: existing } = await supabase
    .from('course_attendance')
    .select('id')
    .eq('lesson_id', lessonId)
    .eq('registration_id', registrationId)
    .single();

  if (existing) {
    // Update existing attendance
    const { data, error } = await supabase
      .from('course_attendance')
      .update({
        status,
        notes,
        marked_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select(`
        *,
        lesson:lesson_id(*),
        student:registration_id(student:student_id(id, name))
      `)
      .single();

    if (error) throw error;
    return data;
  } else {
    // Create new attendance record
    const { data, error } = await supabase
      .from('course_attendance')
      .insert({
        lesson_id: lessonId,
        registration_id: registrationId,
        status,
        notes,
      })
      .select(`
        *,
        lesson:lesson_id(*),
        student:registration_id(student:student_id(id, name))
      `)
      .single();

    if (error) throw error;
    return data;
  }
}

export async function getLessonAttendance(lessonId: string): Promise<CourseAttendance[]> {
  const { data, error } = await supabase
    .from('course_attendance')
    .select(`
      *,
      lesson:lesson_id(*),
      student:registration_id(student:student_id(id, name))
    `)
    .eq('lesson_id', lessonId);

  if (error) throw error;
  return data || [];
}

export async function getStudentAttendance(registrationId: string): Promise<CourseAttendance[]> {
  const { data, error } = await supabase
    .from('course_attendance')
    .select(`
      *,
      lesson:lesson_id(*),
      student:registration_id(student:student_id(id, name))
    `)
    .eq('registration_id', registrationId)
    .order('marked_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

// ==================== COURSE PAYMENTS ====================

export async function createPayment(data: CreatePaymentData): Promise<CoursePayment> {
  const { data: payment, error } = await supabase
    .from('course_payments')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return payment;
}

export async function getRegistrationPayments(registrationId: string): Promise<CoursePayment[]> {
  const { data, error } = await supabase
    .from('course_payments')
    .select('*')
    .eq('registration_id', registrationId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function updatePayment(id: string, data: Partial<CreatePaymentData>): Promise<CoursePayment> {
  const { data: payment, error } = await supabase
    .from('course_payments')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return payment;
}

// ==================== COURSE ASSESSMENTS ====================

export async function createAssessment(data: CreateAssessmentData): Promise<CourseAssessment> {
  const { data: assessment, error } = await supabase
    .from('course_assessments')
    .insert(data)
    .select(`
      *,
      course:course_id(*),
      created_by_profile:created_by(id, name)
    `)
    .single();

  if (error) throw error;
  return assessment;
}

export async function getCourseAssessments(courseId: string): Promise<CourseAssessment[]> {
  const { data, error } = await supabase
    .from('course_assessments')
    .select(`
      *,
      course:course_id(*),
      created_by_profile:created_by(id, name)
    `)
    .eq('course_id', courseId)
    .order('due_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

// ==================== COURSE GRADES ====================

export async function createGrade(data: CreateGradeData): Promise<CourseGrade> {
  const { data: grade, error } = await supabase
    .from('course_grades')
    .insert(data)
    .select(`
      *,
      assessment:assessment_id(*),
      student:registration_id(student:student_id(id, name))
    `)
    .single();

  if (error) throw error;
  return grade;
}

export async function getAssessmentGrades(assessmentId: string): Promise<CourseGrade[]> {
  const { data, error } = await supabase
    .from('course_grades')
    .select(`
      *,
      assessment:assessment_id(*),
      student:registration_id(student:student_id(id, name))
    `)
    .eq('assessment_id', assessmentId);

  if (error) throw error;
  return data || [];
}

export async function getStudentGrades(registrationId: string): Promise<CourseGrade[]> {
  const { data, error } = await supabase
    .from('course_grades')
    .select(`
      *,
      assessment:assessment_id(*),
      student:registration_id(student:student_id(id, name))
    `)
    .eq('registration_id', registrationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

// ==================== STATISTICS & ANALYTICS ====================

export async function getCourseStats(): Promise<CourseStats> {
  const [
    { count: totalCourses },
    { count: activeCourses },
    { count: totalStudents },
    { count: totalRegistrations },
    { data: completionData },
    { data: attendanceData },
    { data: revenueData },
    { data: pendingPaymentsData },
  ] = await Promise.all([
    supabase.from('courses').select('id', { count: 'exact' }).eq('active', true),
    supabase.from('courses').select('id', { count: 'exact' }).eq('active', true).eq('status', 'active'),
    supabase.from('course_registrations').select('student_id', { count: 'exact' }).eq('status', 'enrolled'),
    supabase.from('course_registrations').select('id', { count: 'exact' }),
    supabase.from('course_registrations').select('status').eq('status', 'completed'),
    supabase.from('course_attendance').select('status'),
    supabase.from('course_payments').select('amount').eq('status', 'paid'),
    supabase.from('course_payments').select('amount').eq('status', 'pending'),
  ]);

  const completedRegistrations = completionData?.length || 0;
  const completionRate = totalRegistrations ? (completedRegistrations / totalRegistrations) * 100 : 0;

  const totalAttendance = attendanceData?.length || 0;
  const presentCount = attendanceData?.filter(a => a.status === 'present').length || 0;
  const averageAttendance = totalAttendance ? (presentCount / totalAttendance) * 100 : 0;

  const revenue = revenueData?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
  const pendingPayments = pendingPaymentsData?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

  return {
    total_courses: totalCourses || 0,
    active_courses: activeCourses || 0,
    total_students: totalStudents || 0,
    total_registrations: totalRegistrations || 0,
    completion_rate: completionRate,
    average_attendance: averageAttendance,
    revenue,
    pending_payments: pendingPayments,
  };
}

export async function getCourseAnalytics(): Promise<CourseAnalytics[]> {
  const { data: courses } = await supabase
    .from('courses')
    .select(`
      id,
      name,
      course_registrations(
        id,
        status,
        total_amount,
        paid_amount
      ),
      course_attendance(
        status
      )
    `)
    .eq('active', true);

  if (!courses) return [];

  return courses.map(course => {
    const registrations = course.course_registrations || [];
    const attendance = course.course_attendance || [];
    
    const totalStudents = registrations.length;
    const completedStudents = registrations.filter(r => r.status === 'completed').length;
    const completionRate = totalStudents ? (completedStudents / totalStudents) * 100 : 0;
    
    const totalAttendance = attendance.length;
    const presentCount = attendance.filter(a => a.status === 'present').length;
    const averageAttendance = totalAttendance ? (presentCount / totalAttendance) * 100 : 0;
    
    const revenue = registrations.reduce((sum, r) => sum + (r.paid_amount || 0), 0);

    return {
      course_id: course.id,
      course_name: course.name,
      total_students: totalStudents,
      completion_rate: completionRate,
      average_attendance: averageAttendance,
      revenue,
    };
  });
}

export async function getStudentProgress(courseId?: string): Promise<StudentProgress[]> {
  let query = supabase
    .from('course_registrations')
    .select(`
      id,
      status,
      student:student_id(id, name),
      course:course_id(id, name),
      course_attendance(
        status,
        marked_at
      ),
      course_grades(
        score,
        max_score
      )
    `)
    .eq('status', 'enrolled');

  if (courseId) {
    query = query.eq('course_id', courseId);
  }

  const { data: registrations } = await query;

  if (!registrations) return [];

  return registrations.map(reg => {
    const attendance = reg.course_attendance || [];
    const grades = reg.course_grades || [];
    
    const totalAttendance = attendance.length;
    const presentCount = attendance.filter(a => a.status === 'present').length;
    const attendanceRate = totalAttendance ? (presentCount / totalAttendance) * 100 : 0;
    
    const totalScore = grades.reduce((sum, g) => sum + (g.score || 0), 0);
    const maxScore = grades.reduce((sum, g) => sum + (g.max_score || 0), 0);
    const averageGrade = maxScore ? (totalScore / maxScore) * 100 : 0;
    
    const lastAttendance = attendance
      .filter(a => a.status === 'present')
      .sort((a, b) => new Date(b.marked_at).getTime() - new Date(a.marked_at).getTime())[0];

    return {
      registration_id: reg.id,
      student_name: reg.student?.name || 'Unknown',
      course_name: reg.course?.name || 'Unknown',
      progress_percentage: 0, // This would need to be calculated based on completed modules
      attendance_rate: attendanceRate,
      average_grade: averageGrade,
      completed_modules: 0, // This would need to be calculated
      total_modules: 0, // This would need to be calculated
      status: reg.status,
      last_attendance: lastAttendance?.marked_at,
    };
  });
}

// ==================== DASHBOARD DATA ====================

export async function getCourseDashboardData(): Promise<CourseDashboardData> {
  const [
    recentCourses,
    upcomingLessons,
    pendingRegistrations,
    attendanceSummary,
    financialSummary,
    studentProgress,
  ] = await Promise.all([
    getCourses({ status: 'active' }).then(courses => courses.slice(0, 5)),
    getUpcomingLessons(),
    getRegistrations({ status: 'pending' }).then(regs => regs.slice(0, 10)),
    getAttendanceSummary(),
    getFinancialSummary(),
    getStudentProgress(),
  ]);

  return {
    recent_courses: recentCourses,
    upcoming_lessons: upcomingLessons,
    pending_registrations: pendingRegistrations,
    attendance_summary: attendanceSummary,
    financial_summary: financialSummary,
    student_progress: studentProgress.slice(0, 10),
  };
}

async function getUpcomingLessons(): Promise<CourseLesson[]> {
  const { data, error } = await supabase
    .from('course_lessons')
    .select(`
      *,
      course_modules!inner(course_id, course:course_id(name))
    `)
    .gte('scheduled_date', new Date().toISOString().split('T')[0])
    .order('scheduled_date', { ascending: true })
    .limit(10);

  if (error) throw error;
  return data || [];
}

async function getAttendanceSummary() {
  const { data: attendance } = await supabase
    .from('course_attendance')
    .select('status')
    .gte('marked_at', new Date().toISOString().split('T')[0]);

  const totalStudents = attendance?.length || 0;
  const presentToday = attendance?.filter(a => a.status === 'present').length || 0;
  const absentToday = attendance?.filter(a => a.status === 'absent').length || 0;
  const attendanceRate = totalStudents ? (presentToday / totalStudents) * 100 : 0;

  return {
    total_students: totalStudents,
    present_today: presentToday,
    absent_today: absentToday,
    attendance_rate: attendanceRate,
  };
}

async function getFinancialSummary() {
  const { data: payments } = await supabase
    .from('course_payments')
    .select('amount, status, created_at');

  const totalRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
  const pendingPayments = payments?.filter(p => p.status === 'pending').reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyRevenue = payments?.filter(p => {
    const paymentDate = new Date(p.created_at);
    return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
  }).reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

  return {
    total_revenue: totalRevenue,
    pending_payments: pendingPayments,
    monthly_revenue: monthlyRevenue,
  };
}

