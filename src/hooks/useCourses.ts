import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
import * as coursesService from '@/integrations/supabase/courses';

// Hook para gerenciar cursos
export function useCourses(filters?: CourseFilters) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await coursesService.getCourses(filters);
      setCourses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar cursos');
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const refetch = useCallback(() => {
    fetchCourses();
  }, [fetchCourses]);

  return {
    courses,
    loading,
    error,
    refetch
  };
}

// Hook para um curso específico
export function useCourse(courseId: string) {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourse = useCallback(async () => {
    if (!courseId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await coursesService.getCourseById(courseId);
      setCourse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar curso');
      console.error('Error fetching course:', err);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  const refetch = useCallback(() => {
    fetchCourse();
  }, [fetchCourse]);

  return {
    course,
    loading,
    error,
    refetch
  };
}

// Hook para módulos do curso
export function useCourseModules(courseId: string) {
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchModules = useCallback(async () => {
    if (!courseId || courseId.trim() === '') {
      setModules([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await coursesService.getCourseModules(courseId);
      setModules(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar módulos');
      console.error('Error fetching modules:', err);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  const refetch = useCallback(() => {
    fetchModules();
  }, [fetchModules]);

  return {
    modules,
    loading,
    error,
    refetch
  };
}

// Hook para lições do módulo
export function useCourseLessons(moduleId: string) {
  const [lessons, setLessons] = useState<CourseLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLessons = useCallback(async () => {
    if (!moduleId || moduleId.trim() === '') {
      setLessons([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await coursesService.getCourseLessons(moduleId);
      setLessons(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar lições');
      console.error('Error fetching lessons:', err);
    } finally {
      setLoading(false);
    }
  }, [moduleId]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  const refetch = useCallback(() => {
    fetchLessons();
  }, [fetchLessons]);

  return {
    lessons,
    loading,
    error,
    refetch
  };
}

// Hook para matrículas do curso
export function useCourseRegistrations(courseId?: string) {
  const [registrations, setRegistrations] = useState<CourseRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRegistrations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await coursesService.getCourseRegistrations(courseId);
      setRegistrations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar matrículas');
      console.error('Error fetching registrations:', err);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  const refetch = useCallback(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  return {
    registrations,
    loading,
    error,
    refetch
  };
}

// Hook para presença
export function useCourseAttendance(filters?: AttendanceFilters) {
  const [attendance, setAttendance] = useState<CourseAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAttendance = useCallback(async () => {
    // Se não há filtros ou lesson_id está vazio, não faz a consulta
    if (!filters || (filters.lesson_id && filters.lesson_id.trim() === '')) {
      setAttendance([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await coursesService.getCourseAttendance(filters);
      setAttendance(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar presença');
      console.error('Error fetching attendance:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const refetch = useCallback(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const markAttendance = useCallback(async (attendanceData: Omit<CourseAttendance, 'id' | 'created_at'>) => {
    try {
      const data = await coursesService.markAttendance(attendanceData);
      setAttendance(prev => {
        const existing = prev.find(a => a.lesson_id === attendanceData.lesson_id && a.registration_id === attendanceData.registration_id);
        if (existing) {
          return prev.map(a => 
            a.id === existing.id ? data : a
          );
        }
        return [...prev, data];
      });
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao marcar presença');
      throw err;
    }
  }, []);

  const updateAttendance = useCallback(async (id: string, updates: Partial<CourseAttendance>) => {
    try {
      const data = await coursesService.updateAttendance(id, updates);
      setAttendance(prev => 
        prev.map(a => a.id === id ? data : a)
      );
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar presença');
      throw err;
    }
  }, []);

  return {
    attendance,
    loading,
    error,
    refetch,
    markAttendance,
    updateAttendance
  };
}

// Hook para pagamentos
export function useCoursePayments(registrationId?: string) {
  const [payments, setPayments] = useState<CoursePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    if (!registrationId || registrationId.trim() === '') {
      setPayments([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await coursesService.getCoursePayments(registrationId);
      setPayments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar pagamentos');
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  }, [registrationId]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const refetch = useCallback(() => {
    fetchPayments();
  }, [fetchPayments]);

  return {
    payments,
    loading,
    error,
    refetch
  };
}

// Hook para estatísticas do curso
export function useCourseStats(courseId?: string) {
  const [stats, setStats] = useState<CourseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await coursesService.getCourseStats(courseId);
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas');
      console.error('Error fetching course stats:', err);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const refetch = useCallback(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch
  };
}

// Hook para estatísticas de presença
export function useAttendanceStats(courseId?: string) {
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await coursesService.getAttendanceStats(courseId);
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas de presença');
      console.error('Error fetching attendance stats:', err);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    // Só executa se courseId não estiver vazio
    if (courseId && courseId.trim() !== '') {
      fetchStats();
    } else {
      setStats({
        totalLessons: 0,
        totalAttendance: 0,
        attendanceRate: 0,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        excusedCount: 0,
        makeupCount: 0
      });
      setLoading(false);
    }
  }, [courseId, fetchStats]);

  const refetch = useCallback(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch
  };
}

// Hook para relatório de presença
export function useAttendanceReport(courseId?: string) {
  const [report, setReport] = useState<AttendanceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await coursesService.getAttendanceReport(courseId);
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar relatório de presença');
      console.error('Error fetching attendance report:', err);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const refetch = useCallback(() => {
    fetchReport();
  }, [fetchReport]);

  return {
    report,
    loading,
    error,
    refetch
  };
}

// Hook para presença por lição
export function useLessonAttendance(courseId?: string) {
  const [lessons, setLessons] = useState<LessonAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLessons = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await coursesService.getLessonAttendance(courseId);
      setLessons(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar presença por lição');
      console.error('Error fetching lesson attendance:', err);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    // Só executa se courseId não estiver vazio
    if (courseId && courseId.trim() !== '') {
      fetchLessons();
    } else {
      setLessons([]);
      setLoading(false);
    }
  }, [courseId, fetchLessons]);

  const refetch = useCallback(() => {
    fetchLessons();
  }, [fetchLessons]);

  return {
    lessons,
    loading,
    error,
    refetch
  };
}