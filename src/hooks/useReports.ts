// Enhanced Reports System - Custom Hooks
// Comprehensive hooks for managing reports, cultos, and lost members

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getCultos,
  getCultoById,
  createCulto,
  updateCulto,
  deleteCulto,
  getCultoAttendance,
  createCultoAttendance,
  updateCultoAttendance,
  deleteCultoAttendance,
  getLostMembers,
  getLostMemberById,
  createLostMember,
  updateLostMember,
  deleteLostMember,
  getContactAttempts,
  createContactAttempt,
  updateContactAttempt,
  deleteContactAttempt,
  getReportTemplates,
  getReportTemplateById,
  createReportTemplate,
  updateReportTemplate,
  deleteReportTemplate,
  getReports,
  getReportById,
  createReport,
  updateReport,
  deleteReport,
  getReportSubmissions,
  createReportSubmission,
  updateReportSubmission,
  getCultoStats,
  getLostMembersStats,
  getReportsStats,
  getReportsDashboardData
} from '@/integrations/supabase/reports';
import {
  Culto,
  CultoAttendance,
  LostMember,
  ContactAttempt,
  ReportTemplate,
  Report,
  ReportSubmission,
  CreateCultoData,
  UpdateCultoData,
  CreateCultoAttendanceData,
  CreateLostMemberData,
  UpdateLostMemberData,
  CreateContactAttemptData,
  CreateReportData,
  UpdateReportData,
  CultoFilters,
  LostMemberFilters,
  ReportFilters,
  CultoStats,
  LostMembersStats,
  ReportsStats,
  ReportsDashboardData,
  HierarchicalReportData,
  ReportSubmissionData
} from '@/types/reports';

// ==================== CULTOS HOOK ====================

export function useCultos(filters?: CultoFilters) {
  const [cultos, setCultos] = useState<Culto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCultos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCultos(filters);
      setCultos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar cultos');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const createNewCulto = useCallback(async (data: CreateCultoData) => {
    try {
      setError(null);
      const newCulto = await createCulto(data);
      setCultos(prev => [newCulto, ...prev]);
      return newCulto;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar culto');
      throw err;
    }
  }, []);

  const updateExistingCulto = useCallback(async (id: string, data: UpdateCultoData) => {
    try {
      setError(null);
      const updatedCulto = await updateCulto(id, data);
      setCultos(prev => prev.map(culto => culto.id === id ? updatedCulto : culto));
      return updatedCulto;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar culto');
      throw err;
    }
  }, []);

  const removeCulto = useCallback(async (id: string) => {
    try {
      setError(null);
      await deleteCulto(id);
      setCultos(prev => prev.filter(culto => culto.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir culto');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchCultos();
  }, [fetchCultos]);

  return {
    cultos,
    loading,
    error,
    fetchCultos,
    createCulto: createNewCulto,
    updateCulto: updateExistingCulto,
    deleteCulto: removeCulto
  };
}

// ==================== CULTO ATTENDANCE HOOK ====================

export function useCultoAttendance(cultoId: string) {
  const [attendance, setAttendance] = useState<CultoAttendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAttendance = useCallback(async () => {
    if (!cultoId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await getCultoAttendance(cultoId);
      setAttendance(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar presenças');
    } finally {
      setLoading(false);
    }
  }, [cultoId]);

  const addAttendance = useCallback(async (data: CreateCultoAttendanceData) => {
    try {
      setError(null);
      const newAttendance = await createCultoAttendance(data);
      setAttendance(prev => [newAttendance, ...prev]);
      return newAttendance;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar presença');
      throw err;
    }
  }, []);

  const updateExistingAttendance = useCallback(async (id: string, data: Partial<CreateCultoAttendanceData>) => {
    try {
      setError(null);
      const updatedAttendance = await updateCultoAttendance(id, data);
      setAttendance(prev => prev.map(att => att.id === id ? updatedAttendance : att));
      return updatedAttendance;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar presença');
      throw err;
    }
  }, []);

  const removeAttendance = useCallback(async (id: string) => {
    try {
      setError(null);
      await deleteCultoAttendance(id);
      setAttendance(prev => prev.filter(att => att.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir presença');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  return {
    attendance,
    loading,
    error,
    fetchAttendance,
    addAttendance,
    updateAttendance: updateExistingAttendance,
    removeAttendance
  };
}

// ==================== LOST MEMBERS HOOK ====================

export function useLostMembers(filters?: LostMemberFilters) {
  const [lostMembers, setLostMembers] = useState<LostMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLostMembers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getLostMembers(filters);
      setLostMembers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar membros perdidos');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const addLostMember = useCallback(async (data: CreateLostMemberData) => {
    try {
      setError(null);
      const newLostMember = await createLostMember(data);
      setLostMembers(prev => [newLostMember, ...prev]);
      return newLostMember;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar membro perdido');
      throw err;
    }
  }, []);

  const updateExistingLostMember = useCallback(async (id: string, data: UpdateLostMemberData) => {
    try {
      setError(null);
      const updatedLostMember = await updateLostMember(id, data);
      setLostMembers(prev => prev.map(member => member.id === id ? updatedLostMember : member));
      return updatedLostMember;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar membro perdido');
      throw err;
    }
  }, []);

  const removeLostMember = useCallback(async (id: string) => {
    try {
      setError(null);
      await deleteLostMember(id);
      setLostMembers(prev => prev.filter(member => member.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir membro perdido');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchLostMembers();
  }, [fetchLostMembers]);

  return {
    lostMembers,
    loading,
    error,
    fetchLostMembers,
    addLostMember,
    updateLostMember: updateExistingLostMember,
    removeLostMember
  };
}

// ==================== CONTACT ATTEMPTS HOOK ====================

export function useContactAttempts(lostMemberId: string) {
  const [attempts, setAttempts] = useState<ContactAttempt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAttempts = useCallback(async () => {
    if (!lostMemberId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await getContactAttempts(lostMemberId);
      setAttempts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar tentativas de contato');
    } finally {
      setLoading(false);
    }
  }, [lostMemberId]);

  const addAttempt = useCallback(async (data: CreateContactAttemptData) => {
    try {
      setError(null);
      const newAttempt = await createContactAttempt(data);
      setAttempts(prev => [newAttempt, ...prev]);
      return newAttempt;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar tentativa de contato');
      throw err;
    }
  }, []);

  const updateExistingAttempt = useCallback(async (id: string, data: Partial<CreateContactAttemptData>) => {
    try {
      setError(null);
      const updatedAttempt = await updateContactAttempt(id, data);
      setAttempts(prev => prev.map(att => att.id === id ? updatedAttempt : att));
      return updatedAttempt;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar tentativa de contato');
      throw err;
    }
  }, []);

  const removeAttempt = useCallback(async (id: string) => {
    try {
      setError(null);
      await deleteContactAttempt(id);
      setAttempts(prev => prev.filter(att => att.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir tentativa de contato');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchAttempts();
  }, [fetchAttempts]);

  return {
    attempts,
    loading,
    error,
    fetchAttempts,
    addAttempt,
    updateAttempt: updateExistingAttempt,
    removeAttempt
  };
}

// ==================== REPORTS HOOK ====================

export function useReports(filters?: ReportFilters) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getReports(filters);
      setReports(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar relatórios');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const createNewReport = useCallback(async (data: CreateReportData) => {
    try {
      setError(null);
      const newReport = await createReport(data);
      setReports(prev => [newReport, ...prev]);
      return newReport;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar relatório');
      throw err;
    }
  }, []);

  const updateExistingReport = useCallback(async (id: string, data: UpdateReportData) => {
    try {
      setError(null);
      const updatedReport = await updateReport(id, data);
      setReports(prev => prev.map(report => report.id === id ? updatedReport : report));
      return updatedReport;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar relatório');
      throw err;
    }
  }, []);

  const removeReport = useCallback(async (id: string) => {
    try {
      setError(null);
      await deleteReport(id);
      setReports(prev => prev.filter(report => report.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir relatório');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return {
    reports,
    loading,
    error,
    fetchReports,
    createReport: createNewReport,
    updateReport: updateExistingReport,
    deleteReport: removeReport
  };
}

// ==================== REPORT TEMPLATES HOOK ====================

export function useReportTemplates() {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getReportTemplates();
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar templates');
    } finally {
      setLoading(false);
    }
  }, []);

  const createNewTemplate = useCallback(async (data: Omit<ReportTemplate, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setError(null);
      const newTemplate = await createReportTemplate(data);
      setTemplates(prev => [newTemplate, ...prev]);
      return newTemplate;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar template');
      throw err;
    }
  }, []);

  const updateExistingTemplate = useCallback(async (id: string, data: Partial<Omit<ReportTemplate, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      setError(null);
      const updatedTemplate = await updateReportTemplate(id, data);
      setTemplates(prev => prev.map(template => template.id === id ? updatedTemplate : template));
      return updatedTemplate;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar template');
      throw err;
    }
  }, []);

  const removeTemplate = useCallback(async (id: string) => {
    try {
      setError(null);
      await deleteReportTemplate(id);
      setTemplates(prev => prev.filter(template => template.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir template');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return {
    templates,
    loading,
    error,
    fetchTemplates,
    createTemplate: createNewTemplate,
    updateTemplate: updateExistingTemplate,
    deleteTemplate: removeTemplate
  };
}

// ==================== STATISTICS HOOKS ====================

export function useCultoStats(periodStart?: string, periodEnd?: string) {
  const [stats, setStats] = useState<CultoStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCultoStats(periodStart, periodEnd);
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas de cultos');
    } finally {
      setLoading(false);
    }
  }, [periodStart, periodEnd]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    fetchStats
  };
}

export function useLostMembersStats() {
  const [stats, setStats] = useState<LostMembersStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getLostMembersStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas de membros perdidos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    fetchStats
  };
}

export function useReportsStats() {
  const [stats, setStats] = useState<ReportsStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getReportsStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas de relatórios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    fetchStats
  };
}

// ==================== DASHBOARD HOOK ====================

export function useReportsDashboard() {
  const [dashboardData, setDashboardData] = useState<ReportsDashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getReportsDashboardData();
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
    fetchDashboardData
  };
}

// ==================== HIERARCHICAL REPORTS HOOK ====================

export function useHierarchicalReports() {
  const { user } = useAuth();
  const [hierarchicalData, setHierarchicalData] = useState<HierarchicalReportData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHierarchicalData = useCallback(async (periodStart: string, periodEnd: string) => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch real hierarchical data based on user role
      const hierarchicalData = await getHierarchicalReportData(user.id, periodStart, periodEnd);
      setHierarchicalData(hierarchicalData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados hierárquicos');
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    hierarchicalData,
    loading,
    error,
    fetchHierarchicalData
  };
}
