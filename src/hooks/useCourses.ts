// Enhanced Course System - Custom Hooks
// Comprehensive hooks for course management

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  createModule,
  getCourseModules,
  updateModule,
  deleteModule,
  createLesson,
  getModuleLessons,
  getCourseLessons,
  updateLesson,
  deleteLesson,
  addInstructor,
  getCourseInstructors,
  removeInstructor,
  createRegistration,
  getRegistrations,
  updateRegistration,
  approveRegistration,
  markAttendance,
  getLessonAttendance,
  getStudentAttendance,
  createPayment,
  getRegistrationPayments,
  updatePayment,
  createAssessment,
  getCourseAssessments,
  createGrade,
  getAssessmentGrades,
  getStudentGrades,
  getCourseStats,
  getCourseAnalytics,
  getStudentProgress,
  getCourseDashboardData,
} from '@/integrations/supabase/courses';
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
  CreateCourseData,
  UpdateCourseData,
  CreateModuleData,
  CreateLessonData,
  CreateRegistrationData,
  CreatePaymentData,
  CreateAssessmentData,
  CreateGradeData,
  CourseFilters,
  RegistrationFilters,
  CourseStats,
  CourseAnalytics,
  StudentProgress,
  CourseDashboardData,
} from '@/types/course';

// ==================== COURSES HOOK ====================

export function useCourses(filters?: CourseFilters) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCourses(filters);
      setCourses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar cursos');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const createNewCourse = useCallback(async (data: CreateCourseData) => {
    try {
      setError(null);
      const newCourse = await createCourse(data);
      setCourses(prev => [newCourse, ...prev]);
      return newCourse;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar curso');
      throw err;
    }
  }, []);

  const updateExistingCourse = useCallback(async (id: string, data: UpdateCourseData) => {
    try {
      setError(null);
      const updatedCourse = await updateCourse(id, data);
      setCourses(prev => prev.map(course => course.id === id ? updatedCourse : course));
      return updatedCourse;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar curso');
      throw err;
    }
  }, []);

  const removeCourse = useCallback(async (id: string) => {
    try {
      setError(null);
      await deleteCourse(id);
      setCourses(prev => prev.filter(course => course.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover curso');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  return {
    courses,
    loading,
    error,
    refetch: fetchCourses,
    createCourse: createNewCourse,
    updateCourse: updateExistingCourse,
    deleteCourse: removeCourse,
  };
}

// ==================== COURSE DETAILS HOOK ====================

export function useCourseDetails(courseId: string) {
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [instructors, setInstructors] = useState<CourseInstructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourseDetails = useCallback(async () => {
    if (!courseId) return;

    try {
      setLoading(true);
      setError(null);
      
      const [courseData, modulesData, instructorsData] = await Promise.all([
        getCourseById(courseId),
        getCourseModules(courseId),
        getCourseInstructors(courseId),
      ]);

      setCourse(courseData);
      setModules(modulesData);
      setInstructors(instructorsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar detalhes do curso');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  const addNewModule = useCallback(async (data: CreateModuleData) => {
    try {
      setError(null);
      const newModule = await createModule(data);
      setModules(prev => [...prev, newModule]);
      return newModule;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar módulo');
      throw err;
    }
  }, []);

  const updateExistingModule = useCallback(async (id: string, data: Partial<CreateModuleData>) => {
    try {
      setError(null);
      const updatedModule = await updateModule(id, data);
      setModules(prev => prev.map(module => module.id === id ? updatedModule : module));
      return updatedModule;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar módulo');
      throw err;
    }
  }, []);

  const removeModule = useCallback(async (id: string) => {
    try {
      setError(null);
      await deleteModule(id);
      setModules(prev => prev.filter(module => module.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover módulo');
      throw err;
    }
  }, []);

  const addNewInstructor = useCallback(async (instructorId: string, role: string = 'instructor') => {
    if (!courseId) return;

    try {
      setError(null);
      const newInstructor = await addInstructor(courseId, instructorId, role);
      setInstructors(prev => [...prev, newInstructor]);
      return newInstructor;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar instrutor');
      throw err;
    }
  }, [courseId]);

  const removeExistingInstructor = useCallback(async (id: string) => {
    try {
      setError(null);
      await removeInstructor(id);
      setInstructors(prev => prev.filter(instructor => instructor.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover instrutor');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchCourseDetails();
  }, [fetchCourseDetails]);

  return {
    course,
    modules,
    instructors,
    loading,
    error,
    refetch: fetchCourseDetails,
    createModule: addNewModule,
    updateModule: updateExistingModule,
    deleteModule: removeModule,
    addInstructor: addNewInstructor,
    removeInstructor: removeExistingInstructor,
  };
}

// ==================== COURSE LESSONS HOOK ====================

export function useCourseLessons(moduleId: string) {
  const [lessons, setLessons] = useState<CourseLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLessons = useCallback(async () => {
    if (!moduleId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getModuleLessons(moduleId);
      setLessons(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar aulas');
    } finally {
      setLoading(false);
    }
  }, [moduleId]);

  const createNewLesson = useCallback(async (data: CreateLessonData) => {
    try {
      setError(null);
      const newLesson = await createLesson(data);
      setLessons(prev => [...prev, newLesson]);
      return newLesson;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar aula');
      throw err;
    }
  }, []);

  const updateExistingLesson = useCallback(async (id: string, data: Partial<CreateLessonData>) => {
    try {
      setError(null);
      const updatedLesson = await updateLesson(id, data);
      setLessons(prev => prev.map(lesson => lesson.id === id ? updatedLesson : lesson));
      return updatedLesson;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar aula');
      throw err;
    }
  }, []);

  const removeLesson = useCallback(async (id: string) => {
    try {
      setError(null);
      await deleteLesson(id);
      setLessons(prev => prev.filter(lesson => lesson.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover aula');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  return {
    lessons,
    loading,
    error,
    refetch: fetchLessons,
    createLesson: createNewLesson,
    updateLesson: updateExistingLesson,
    deleteLesson: removeLesson,
  };
}

// ==================== COURSE REGISTRATIONS HOOK ====================

export function useCourseRegistrations(filters?: RegistrationFilters) {
  const [registrations, setRegistrations] = useState<CourseRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRegistrations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getRegistrations(filters);
      setRegistrations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar inscrições');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const createNewRegistration = useCallback(async (data: CreateRegistrationData) => {
    try {
      setError(null);
      const newRegistration = await createRegistration(data);
      setRegistrations(prev => [newRegistration, ...prev]);
      return newRegistration;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar inscrição');
      throw err;
    }
  }, []);

  const updateExistingRegistration = useCallback(async (id: string, data: Partial<CreateRegistrationData>) => {
    try {
      setError(null);
      const updatedRegistration = await updateRegistration(id, data);
      setRegistrations(prev => prev.map(reg => reg.id === id ? updatedRegistration : reg));
      return updatedRegistration;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar inscrição');
      throw err;
    }
  }, []);

  const approveExistingRegistration = useCallback(async (id: string, approvedBy: string) => {
    try {
      setError(null);
      const approvedRegistration = await approveRegistration(id, approvedBy);
      setRegistrations(prev => prev.map(reg => reg.id === id ? approvedRegistration : reg));
      return approvedRegistration;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao aprovar inscrição');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  return {
    registrations,
    loading,
    error,
    refetch: fetchRegistrations,
    createRegistration: createNewRegistration,
    updateRegistration: updateExistingRegistration,
    approveRegistration: approveExistingRegistration,
  };
}

// ==================== COURSE ATTENDANCE HOOK ====================

export function useCourseAttendance(lessonId: string) {
  const [attendance, setAttendance] = useState<CourseAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAttendance = useCallback(async () => {
    if (!lessonId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getLessonAttendance(lessonId);
      setAttendance(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar presenças');
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  const markStudentAttendance = useCallback(async (registrationId: string, status: string, notes?: string) => {
    try {
      setError(null);
      const newAttendance = await markAttendance(lessonId, registrationId, status, notes);
      
      // Update local state
      setAttendance(prev => {
        const existing = prev.find(a => a.registration_id === registrationId);
        if (existing) {
          return prev.map(a => a.registration_id === registrationId ? newAttendance : a);
        } else {
          return [...prev, newAttendance];
        }
      });
      
      return newAttendance;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao marcar presença');
      throw err;
    }
  }, [lessonId]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  return {
    attendance,
    loading,
    error,
    refetch: fetchAttendance,
    markAttendance: markStudentAttendance,
  };
}

// ==================== COURSE PAYMENTS HOOK ====================

export function useCoursePayments(registrationId: string) {
  const [payments, setPayments] = useState<CoursePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    if (!registrationId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getRegistrationPayments(registrationId);
      setPayments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar pagamentos');
    } finally {
      setLoading(false);
    }
  }, [registrationId]);

  const createNewPayment = useCallback(async (data: CreatePaymentData) => {
    try {
      setError(null);
      const newPayment = await createPayment(data);
      setPayments(prev => [newPayment, ...prev]);
      return newPayment;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar pagamento');
      throw err;
    }
  }, []);

  const updateExistingPayment = useCallback(async (id: string, data: Partial<CreatePaymentData>) => {
    try {
      setError(null);
      const updatedPayment = await updatePayment(id, data);
      setPayments(prev => prev.map(payment => payment.id === id ? updatedPayment : payment));
      return updatedPayment;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar pagamento');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return {
    payments,
    loading,
    error,
    refetch: fetchPayments,
    createPayment: createNewPayment,
    updatePayment: updateExistingPayment,
  };
}

// ==================== COURSE STATISTICS HOOK ====================

export function useCourseStats() {
  const [stats, setStats] = useState<CourseStats | null>(null);
  const [analytics, setAnalytics] = useState<CourseAnalytics[]>([]);
  const [studentProgress, setStudentProgress] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [statsData, analyticsData, progressData] = await Promise.all([
        getCourseStats(),
        getCourseAnalytics(),
        getStudentProgress(),
      ]);

      setStats(statsData);
      setAnalytics(analyticsData);
      setStudentProgress(progressData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    analytics,
    studentProgress,
    loading,
    error,
    refetch: fetchStats,
  };
}

// ==================== COURSE DASHBOARD HOOK ====================

export function useCourseDashboard() {
  const [dashboardData, setDashboardData] = useState<CourseDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCourseDashboardData();
      setDashboardData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    dashboardData,
    loading,
    error,
    refetch: fetchDashboardData,
  };
}

// ==================== ROLE-BASED COURSE ACCESS HOOK ====================

export function useCourseAccess() {
  const { user } = useAuth();

  const canManageCourses = user?.role === 'pastor' || user?.role === 'obreiro';
  const canViewCourses = true; // All authenticated users can view courses
  const canEnrollStudents = user?.role === 'lider' || user?.role === 'discipulador';
  const canMarkAttendance = user?.role === 'discipulador' || user?.role === 'pastor' || user?.role === 'obreiro';
  const canViewAnalytics = user?.role === 'pastor' || user?.role === 'obreiro' || user?.role === 'discipulador';

  return {
    canManageCourses,
    canViewCourses,
    canEnrollStudents,
    canMarkAttendance,
    canViewAnalytics,
    userRole: user?.role,
  };
}
