import { supabase } from './client';
import { 
  Course, 
  CourseModule, 
  CourseLesson, 
  CourseRegistration, 
  CourseAttendance, 
  CoursePayment,
  CourseFilters,
  AttendanceFilters,
  CourseStats,
  AttendanceStats,
  AttendanceReport,
  LessonAttendance
} from '@/types/course';

// ===== COURSES =====
export const getCourses = async (filters?: CourseFilters): Promise<Course[]> => {
  let query = supabase
    .from('courses')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }

  if (filters?.difficulty_level) {
    query = query.eq('difficulty_level', filters.difficulty_level);
  }

  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching courses:', error);
    throw error;
  }

  return data || [];
};

export const getCourseById = async (id: string): Promise<Course | null> => {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching course:', error);
    return null;
  }

  return data;
};

export const createCourse = async (course: Omit<Course, 'id' | 'created_at' | 'updated_at'>): Promise<Course> => {
  const { data, error } = await supabase
    .from('courses')
    .insert([course])
    .select()
    .single();

  if (error) {
    console.error('Error creating course:', error);
    throw error;
  }

  return data;
};

export const updateCourse = async (id: string, updates: Partial<Course>): Promise<Course> => {
  const { data, error } = await supabase
    .from('courses')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating course:', error);
    throw error;
  }

  return data;
};

export const deleteCourse = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting course:', error);
    throw error;
  }
};

// ===== COURSE MODULES =====
export const getCourseModules = async (courseId: string): Promise<CourseModule[]> => {
  if (!courseId || courseId.trim() === '') {
    return [];
  }

  const { data, error } = await supabase
    .from('course_modules')
    .select('*')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });

  if (error) {
    console.error('Error fetching course modules:', error);
    throw error;
  }

  return data || [];
};

export const createCourseModule = async (module: Omit<CourseModule, 'id' | 'created_at' | 'updated_at'>): Promise<CourseModule> => {
  const { data, error } = await supabase
    .from('course_modules')
    .insert([module])
    .select()
    .single();

  if (error) {
    console.error('Error creating course module:', error);
    throw error;
  }

  return data;
};

export const updateCourseModule = async (id: string, updates: Partial<CourseModule>): Promise<CourseModule> => {
  const { data, error } = await supabase
    .from('course_modules')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating course module:', error);
    throw error;
  }

  return data;
};

export const deleteCourseModule = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('course_modules')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting course module:', error);
    throw error;
  }
};

// ===== COURSE LESSONS =====
export const getCourseLessons = async (moduleId: string): Promise<CourseLesson[]> => {
  if (!moduleId || moduleId.trim() === '') {
    return [];
  }

  const { data, error } = await supabase
    .from('course_lessons')
    .select('*')
    .eq('module_id', moduleId)
    .order('order_index', { ascending: true });

  if (error) {
    console.error('Error fetching course lessons:', error);
    throw error;
  }

  return data || [];
};

export const createCourseLesson = async (lesson: Omit<CourseLesson, 'id' | 'created_at' | 'updated_at'>): Promise<CourseLesson> => {
  const { data, error } = await supabase
    .from('course_lessons')
    .insert([lesson])
    .select()
    .single();

  if (error) {
    console.error('Error creating course lesson:', error);
    throw error;
  }

  return data;
};

export const updateCourseLesson = async (id: string, updates: Partial<CourseLesson>): Promise<CourseLesson> => {
  const { data, error } = await supabase
    .from('course_lessons')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating course lesson:', error);
    throw error;
  }

  return data;
};

export const deleteCourseLesson = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('course_lessons')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting course lesson:', error);
    throw error;
  }
};

// ===== COURSE REGISTRATIONS =====
export const getCourseRegistrations = async (courseId?: string): Promise<CourseRegistration[]> => {
  let query = supabase
    .from('course_registrations')
    .select(`
      *,
      courses:course_id(name, description),
      members:student_id(name, email, phone),
      profiles:leader_id(name, email)
    `);

  if (courseId && courseId.trim() !== '') {
    query = query.eq('course_id', courseId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching course registrations:', error);
    throw error;
  }

  return data || [];
};

export const createCourseRegistration = async (registration: Omit<CourseRegistration, 'id' | 'created_at' | 'updated_at'>): Promise<CourseRegistration> => {
  const { data, error } = await supabase
    .from('course_registrations')
    .insert([registration])
    .select()
    .single();

  if (error) {
    console.error('Error creating course registration:', error);
    throw error;
  }

  return data;
};

export const updateCourseRegistration = async (id: string, updates: Partial<CourseRegistration>): Promise<CourseRegistration> => {
  const { data, error } = await supabase
    .from('course_registrations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating course registration:', error);
    throw error;
  }

  return data;
};

export const deleteCourseRegistration = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('course_registrations')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting course registration:', error);
    throw error;
  }
};

// ===== COURSE ATTENDANCE =====
export const getCourseAttendance = async (filters?: AttendanceFilters): Promise<CourseAttendance[]> => {
  let query = supabase
    .from('course_attendance')
    .select(`
      *,
      course_lessons:lesson_id(title, scheduled_date, start_time, end_time),
      course_registrations:registration_id(
        id,
        members:student_id(name, email),
        courses:course_id(name)
      )
    `);

  if (filters?.lesson_id) {
    query = query.eq('lesson_id', filters.lesson_id);
  }

  if (filters?.registration_id) {
    query = query.eq('registration_id', filters.registration_id);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.date_from) {
    query = query.gte('marked_at', filters.date_from);
  }

  if (filters?.date_to) {
    query = query.lte('marked_at', filters.date_to);
  }

  const { data, error } = await query.order('marked_at', { ascending: false });

  if (error) {
    console.error('Error fetching course attendance:', error);
    throw error;
  }

  return data || [];
};

export const markAttendance = async (attendance: Omit<CourseAttendance, 'id' | 'created_at'>): Promise<CourseAttendance> => {
  const { data, error } = await supabase
    .from('course_attendance')
    .upsert([attendance], { 
      onConflict: 'lesson_id,registration_id',
      ignoreDuplicates: false 
    })
    .select()
    .single();

  if (error) {
    console.error('Error marking attendance:', error);
    throw error;
  }

  return data;
};

export const updateAttendance = async (id: string, updates: Partial<CourseAttendance>): Promise<CourseAttendance> => {
  const { data, error } = await supabase
    .from('course_attendance')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating attendance:', error);
    throw error;
  }

  return data;
};

export const deleteAttendance = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('course_attendance')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting attendance:', error);
    throw error;
  }
};

// ===== COURSE PAYMENTS =====
export const getCoursePayments = async (registrationId?: string): Promise<CoursePayment[]> => {
  let query = supabase
    .from('course_payments')
    .select('*')
    .order('created_at', { ascending: false });

  if (registrationId) {
    query = query.eq('registration_id', registrationId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching course payments:', error);
    throw error;
  }

  return data || [];
};

export const createCoursePayment = async (payment: Omit<CoursePayment, 'id' | 'created_at' | 'updated_at'>): Promise<CoursePayment> => {
  const { data, error } = await supabase
    .from('course_payments')
    .insert([payment])
    .select()
    .single();

  if (error) {
    console.error('Error creating course payment:', error);
    throw error;
  }

  return data;
};

export const updateCoursePayment = async (id: string, updates: Partial<CoursePayment>): Promise<CoursePayment> => {
  const { data, error } = await supabase
    .from('course_payments')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating course payment:', error);
    throw error;
  }

  return data;
};

// ===== STATISTICS =====
export const getCourseStats = async (courseId?: string): Promise<CourseStats> => {
  const { data: courses, error: coursesError } = await supabase
    .from('courses')
    .select('id, status, price')
    .eq('active', true);

  if (coursesError) {
    console.error('Error fetching courses for stats:', coursesError);
    throw coursesError;
  }

  const { data: registrations, error: regError } = await supabase
    .from('course_registrations')
    .select('id, course_id, status, total_amount, paid_amount');

  if (regError) {
    console.error('Error fetching registrations for stats:', regError);
    throw regError;
  }

  const { data: lessons, error: lessonsError } = await supabase
    .from('course_lessons')
    .select('id, module_id, course_modules!inner(course_id)')
    .eq('course_modules.course_id', courseId || '');

  if (lessonsError) {
    console.error('Error fetching lessons for stats:', lessonsError);
    throw lessonsError;
  }

  const { data: attendance, error: attendanceError } = await supabase
    .from('course_attendance')
    .select('status, lesson_id');

  if (attendanceError) {
    console.error('Error fetching attendance for stats:', attendanceError);
    throw attendanceError;
  }

  // Calculate stats
  const totalCourses = courses?.length || 0;
  const activeCourses = courses?.filter(c => c.status === 'active').length || 0;
  const totalStudents = registrations?.length || 0;
  const totalLessons = lessons?.length || 0;
  
  const totalAttendance = attendance?.length || 0;
  const presentAttendance = attendance?.filter(a => a.status === 'present').length || 0;
  const averageAttendance = totalAttendance > 0 ? (presentAttendance / totalAttendance) * 100 : 0;
  
  const completedRegistrations = registrations?.filter(r => r.status === 'completed').length || 0;
  const completionRate = totalStudents > 0 ? (completedRegistrations / totalStudents) * 100 : 0;
  
  const revenue = registrations?.reduce((sum, r) => sum + (r.paid_amount || 0), 0) || 0;

  return {
    totalCourses,
    activeCourses,
    totalStudents,
    totalLessons,
    averageAttendance,
    completionRate,
    revenue
  };
};

export const getAttendanceStats = async (courseId?: string): Promise<AttendanceStats> => {
  // Se não há courseId, retorna stats vazios
  if (!courseId || courseId.trim() === '') {
    return {
      totalLessons: 0,
      totalAttendance: 0,
      attendanceRate: 0,
      presentCount: 0,
      absentCount: 0,
      lateCount: 0,
      excusedCount: 0,
      makeupCount: 0
    };
  }

  let query = supabase
    .from('course_attendance')
    .select('status');

  query = query.eq('course_registrations.course_id', courseId);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching attendance stats:', error);
    throw error;
  }

  const totalAttendance = data?.length || 0;
  const presentCount = data?.filter(a => a.status === 'present').length || 0;
  const absentCount = data?.filter(a => a.status === 'absent').length || 0;
  const lateCount = data?.filter(a => a.status === 'late').length || 0;
  const excusedCount = data?.filter(a => a.status === 'excused').length || 0;
  const makeupCount = data?.filter(a => a.status === 'makeup').length || 0;

  // Get total lessons for the course
  const { data: lessons, error: lessonsError } = await supabase
    .from('course_lessons')
    .select('id, module_id, course_modules!inner(course_id)')
    .eq('course_modules.course_id', courseId);

  if (lessonsError) {
    console.error('Error fetching lessons for stats:', lessonsError);
    throw lessonsError;
  }

  const totalLessons = lessons?.length || 0;
  const attendanceRate = totalLessons > 0 ? (presentCount / totalLessons) * 100 : 0;

  return {
    totalLessons,
    totalAttendance,
    attendanceRate,
    presentCount,
    absentCount,
    lateCount,
    excusedCount,
    makeupCount
  };
};

// ===== REPORTS =====
export const getAttendanceReport = async (courseId?: string): Promise<AttendanceReport[]> => {
  const { data, error } = await supabase
    .from('course_registrations')
    .select(`
      id,
      student_id,
      status,
      members:student_id(name),
      courses:course_id(name),
      course_attendance(status)
    `)
    .eq('course_id', courseId || '');

  if (error) {
    console.error('Error fetching attendance report:', error);
    throw error;
  }

  const reports: AttendanceReport[] = (data || []).map(reg => {
    const attendance = reg.course_attendance || [];
    const totalLessons = attendance.length;
    const attendedLessons = attendance.filter((a: any) => a.status === 'present').length;
    const attendanceRate = totalLessons > 0 ? (attendedLessons / totalLessons) * 100 : 0;

    return {
      studentId: reg.student_id,
      studentName: reg.members?.name || 'N/A',
      courseName: reg.courses?.name || 'N/A',
      totalLessons,
      attendedLessons,
      attendanceRate,
      status: reg.status as 'approved' | 'pending' | 'failed'
    };
  });

  return reports;
};

export const getLessonAttendance = async (courseId?: string): Promise<LessonAttendance[]> => {
  // Se não há courseId, retorna array vazio
  if (!courseId || courseId.trim() === '') {
    return [];
  }

  const { data, error } = await supabase
    .from('course_lessons')
    .select(`
      id,
      title,
      scheduled_date,
      module_id,
      course_modules!inner(course_id),
      course_attendance(status)
    `)
    .eq('course_modules.course_id', courseId)
    .order('scheduled_date', { ascending: true });

  if (error) {
    console.error('Error fetching lesson attendance:', error);
    throw error;
  }

  const lessons: LessonAttendance[] = (data || []).map(lesson => {
    const attendance = lesson.course_attendance || [];
    const present = attendance.filter((a: any) => a.status === 'present').length;
    const absent = attendance.filter((a: any) => a.status === 'absent').length;
    const late = attendance.filter((a: any) => a.status === 'late').length;
    const excused = attendance.filter((a: any) => a.status === 'excused').length;
    const makeup = attendance.filter((a: any) => a.status === 'makeup').length;

    const totalStudents = present + absent + late + excused + makeup;
    const attendanceRate = totalStudents > 0 ? (present / totalStudents) * 100 : 0;

    return {
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      scheduledDate: lesson.scheduled_date || '',
      attendance: {
        present,
        absent,
        late,
        excused,
        makeup
      },
      totalStudents,
      attendanceRate
    };
  });

  return lessons;
};