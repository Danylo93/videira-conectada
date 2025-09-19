// Enhanced Reports System - Supabase Integration
// Comprehensive service for managing reports, cultos, and lost members

import { supabase } from './client';
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

// ==================== CULTOS (SERVICES) ====================

export async function getCultos(filters?: CultoFilters): Promise<Culto[]> {
  try {
    let query = supabase
      .from('cultos')
      .select('*')
      .order('date', { ascending: false });

    if (filters) {
      if (filters.type) query = query.eq('type', filters.type);
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.date_from) query = query.gte('date', filters.date_from);
      if (filters.date_to) query = query.lte('date', filters.date_to);
      if (filters.pastor_id) query = query.eq('pastor_id', filters.pastor_id);
      if (filters.obreiro_id) query = query.eq('obreiro_id', filters.obreiro_id);
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching cultos:', error);
    return [];
  }
}

export async function getCultoById(id: string): Promise<Culto | null> {
  const { data, error } = await supabase
    .from('cultos')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createCulto(data: CreateCultoData): Promise<Culto> {
  const { data: culto, error } = await supabase
    .from('cultos')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return culto;
}

export async function updateCulto(id: string, data: UpdateCultoData): Promise<Culto> {
  const { data: culto, error } = await supabase
    .from('cultos')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return culto;
}

export async function deleteCulto(id: string): Promise<void> {
  const { error } = await supabase
    .from('cultos')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ==================== CULTO ATTENDANCE ====================

export async function getCultoAttendance(cultoId: string): Promise<CultoAttendance[]> {
  const { data, error } = await supabase
    .from('culto_attendance')
    .select('*')
    .eq('culto_id', cultoId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createCultoAttendance(data: CreateCultoAttendanceData): Promise<CultoAttendance> {
  const { data: attendance, error } = await supabase
    .from('culto_attendance')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return attendance;
}

export async function updateCultoAttendance(id: string, data: Partial<CreateCultoAttendanceData>): Promise<CultoAttendance> {
  const { data: attendance, error } = await supabase
    .from('culto_attendance')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return attendance;
}

export async function deleteCultoAttendance(id: string): Promise<void> {
  const { error } = await supabase
    .from('culto_attendance')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ==================== LOST MEMBERS ====================

export async function getLostMembers(filters?: LostMemberFilters): Promise<LostMember[]> {
  try {
    let query = supabase
      .from('lost_members')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters) {
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.priority) query = query.eq('priority', filters.priority);
      if (filters.reason) query = query.eq('reason', filters.reason);
      if (filters.assigned_to) query = query.eq('assigned_to', filters.assigned_to);
      if (filters.last_contact_from) query = query.gte('last_contact_date', filters.last_contact_from);
      if (filters.last_contact_to) query = query.lte('last_contact_date', filters.last_contact_to);
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching lost members:', error);
    return [];
  }
}

export async function getLostMemberById(id: string): Promise<LostMember | null> {
  const { data, error } = await supabase
    .from('lost_members')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createLostMember(data: CreateLostMemberData): Promise<LostMember> {
  const { data: lostMember, error } = await supabase
    .from('lost_members')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return lostMember;
}

export async function updateLostMember(id: string, data: UpdateLostMemberData): Promise<LostMember> {
  const { data: lostMember, error } = await supabase
    .from('lost_members')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return lostMember;
}

export async function deleteLostMember(id: string): Promise<void> {
  const { error } = await supabase
    .from('lost_members')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ==================== CONTACT ATTEMPTS ====================

export async function getContactAttempts(lostMemberId: string): Promise<ContactAttempt[]> {
  const { data, error } = await supabase
    .from('contact_attempts')
    .select('*')
    .eq('lost_member_id', lostMemberId)
    .order('contact_date', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createContactAttempt(data: CreateContactAttemptData): Promise<ContactAttempt> {
  const { data: attempt, error } = await supabase
    .from('contact_attempts')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return attempt;
}

export async function updateContactAttempt(id: string, data: Partial<CreateContactAttemptData>): Promise<ContactAttempt> {
  const { data: attempt, error } = await supabase
    .from('contact_attempts')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return attempt;
}

export async function deleteContactAttempt(id: string): Promise<void> {
  const { error } = await supabase
    .from('contact_attempts')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ==================== REPORT TEMPLATES ====================

export async function getReportTemplates(): Promise<ReportTemplate[]> {
  const { data, error } = await supabase
    .from('report_templates')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getReportTemplateById(id: string): Promise<ReportTemplate | null> {
  const { data, error } = await supabase
    .from('report_templates')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createReportTemplate(data: Omit<ReportTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<ReportTemplate> {
  const { data: template, error } = await supabase
    .from('report_templates')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return template;
}

export async function updateReportTemplate(id: string, data: Partial<Omit<ReportTemplate, 'id' | 'created_at' | 'updated_at'>>): Promise<ReportTemplate> {
  const { data: template, error } = await supabase
    .from('report_templates')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return template;
}

export async function deleteReportTemplate(id: string): Promise<void> {
  const { error } = await supabase
    .from('report_templates')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ==================== REPORTS ====================

export async function getReports(filters?: ReportFilters): Promise<Report[]> {
  try {
    let query = supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters) {
      if (filters.report_type) query = query.eq('report_type', filters.report_type);
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.period_from) query = query.gte('period_start', filters.period_from);
      if (filters.period_to) query = query.lte('period_end', filters.period_to);
      if (filters.submitted_by) query = query.eq('submitted_by', filters.submitted_by);
      if (filters.approved_by) query = query.eq('approved_by', filters.approved_by);
      if (filters.search) {
        query = query.or(`notes.ilike.%${filters.search}%`);
      }
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching reports:', error);
    return [];
  }
}

export async function getReportById(id: string): Promise<Report | null> {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createReport(data: CreateReportData): Promise<Report> {
  const { data: report, error } = await supabase
    .from('reports')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return report;
}

export async function updateReport(id: string, data: UpdateReportData): Promise<Report> {
  const { data: report, error } = await supabase
    .from('reports')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return report;
}

export async function deleteReport(id: string): Promise<void> {
  const { error } = await supabase
    .from('reports')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ==================== REPORT SUBMISSIONS ====================

export async function getReportSubmissions(reportId: string): Promise<ReportSubmission[]> {
  const { data, error } = await supabase
    .from('report_submissions')
    .select('*')
    .eq('report_id', reportId)
    .order('submission_date', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createReportSubmission(data: Omit<ReportSubmission, 'id' | 'submission_date' | 'created_at'>): Promise<ReportSubmission> {
  const { data: submission, error } = await supabase
    .from('report_submissions')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return submission;
}

export async function updateReportSubmission(id: string, data: Partial<Omit<ReportSubmission, 'id' | 'submission_date' | 'created_at'>>): Promise<ReportSubmission> {
  const { data: submission, error } = await supabase
    .from('report_submissions')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return submission;
}

// ==================== STATISTICS ====================

export async function getCultoStats(periodStart?: string, periodEnd?: string): Promise<CultoStats> {
  try {
    let query = supabase
      .from('cultos')
      .select('*');

    if (periodStart) query = query.gte('date', periodStart);
    if (periodEnd) query = query.lte('date', periodEnd);

    const { data: cultos, error } = await query;
    if (error) throw error;

    const cultosData = cultos || [];
    
    const totalCultos = cultosData.length;
    const totalAttendance = cultosData.reduce((sum, culto) => sum + (culto.total_attendance || 0), 0);
    const totalVisitors = cultosData.reduce((sum, culto) => sum + (culto.total_visitors || 0), 0);
    const totalConversions = cultosData.reduce((sum, culto) => sum + (culto.total_conversions || 0), 0);
    const totalOfferings = cultosData.reduce((sum, culto) => sum + (culto.total_offerings || 0), 0);
    const averageAttendance = totalCultos > 0 ? totalAttendance / totalCultos : 0;
    const conversionRate = totalAttendance > 0 ? (totalConversions / totalAttendance) * 100 : 0;

    // Group by type
    const cultosByType = cultosData.reduce((acc, culto) => {
      acc[culto.type] = (acc[culto.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Attendance trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const attendanceTrend = cultosData
      .filter(culto => new Date(culto.date) >= thirtyDaysAgo)
      .map(culto => ({
        date: culto.date,
        attendance: culto.total_attendance || 0,
        visitors: culto.total_visitors || 0,
        conversions: culto.total_conversions || 0
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      total_cultos: totalCultos,
      total_attendance: totalAttendance,
      total_visitors: totalVisitors,
      total_conversions: totalConversions,
      total_offerings: totalOfferings,
      average_attendance: averageAttendance,
      conversion_rate: conversionRate,
      cultos_by_type: cultosByType,
      attendance_trend: attendanceTrend
    };
  } catch (error) {
    console.error('Error fetching culto stats:', error);
    return {
      total_cultos: 0,
      total_attendance: 0,
      total_visitors: 0,
      total_conversions: 0,
      total_offerings: 0,
      average_attendance: 0,
      conversion_rate: 0,
      cultos_by_type: {},
      attendance_trend: []
    };
  }
}

export async function getLostMembersStats(): Promise<LostMembersStats> {
  try {
    const { data: lostMembers, error } = await supabase
      .from('lost_members')
      .select('*');

    if (error) throw error;

    const membersData = lostMembers || [];
    
    const totalLost = membersData.length;
    const totalContacted = membersData.filter(m => m.status === 'contacted').length;
    const totalReturned = membersData.filter(m => m.status === 'returned').length;
    const totalTransferred = membersData.filter(m => m.status === 'transferred').length;
    const contactAttemptsAvg = membersData.reduce((sum, m) => sum + m.contact_attempts, 0) / totalLost;
    const returnRate = totalLost > 0 ? (totalReturned / totalLost) * 100 : 0;

    // Group by priority
    const byPriority = membersData.reduce((acc, member) => {
      acc[member.priority] = (acc[member.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group by reason
    const byReason = membersData.reduce((acc, member) => {
      const reason = member.reason || 'unknown';
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group by status
    const byStatus = membersData.reduce((acc, member) => {
      acc[member.status] = (acc[member.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total_lost: totalLost,
      total_contacted: totalContacted,
      total_returned: totalReturned,
      total_transferred: totalTransferred,
      by_priority: byPriority,
      by_reason: byReason,
      by_status: byStatus,
      contact_attempts_avg: contactAttemptsAvg,
      return_rate: returnRate
    };
  } catch (error) {
    console.error('Error fetching lost members stats:', error);
    return {
      total_lost: 0,
      total_contacted: 0,
      total_returned: 0,
      total_transferred: 0,
      by_priority: {},
      by_reason: {},
      by_status: {},
      contact_attempts_avg: 0,
      return_rate: 0
    };
  }
}

export async function getReportsStats(): Promise<ReportsStats> {
  try {
    const { data: reports, error } = await supabase
      .from('reports')
      .select('*');

    if (error) throw error;

    const reportsData = reports || [];
    
    const totalReports = reportsData.length;
    const draftReports = reportsData.filter(r => r.status === 'draft').length;
    const submittedReports = reportsData.filter(r => r.status === 'submitted').length;
    const approvedReports = reportsData.filter(r => r.status === 'approved').length;
    const rejectedReports = reportsData.filter(r => r.status === 'rejected').length;

    // Group by type
    const byType = reportsData.reduce((acc, report) => {
      acc[report.report_type] = (acc[report.report_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group by status
    const byStatus = reportsData.reduce((acc, report) => {
      acc[report.status] = (acc[report.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Submission trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const submissionTrend = reportsData
      .filter(report => new Date(report.created_at) >= thirtyDaysAgo)
      .map(report => ({
        date: report.created_at.split('T')[0],
        submitted: report.status === 'submitted' ? 1 : 0,
        approved: report.status === 'approved' ? 1 : 0
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      total_reports: totalReports,
      draft_reports: draftReports,
      submitted_reports: submittedReports,
      approved_reports: approvedReports,
      rejected_reports: rejectedReports,
      by_type: byType,
      by_status: byStatus,
      submission_trend: submissionTrend
    };
  } catch (error) {
    console.error('Error fetching reports stats:', error);
    return {
      total_reports: 0,
      draft_reports: 0,
      submitted_reports: 0,
      approved_reports: 0,
      rejected_reports: 0,
      by_type: {},
      by_status: {},
      submission_trend: []
    };
  }
}

export async function getReportsDashboardData(): Promise<ReportsDashboardData> {
  try {
    const [cultoStats, lostMembersStats, reportsStats, recentCultos, recentLostMembers, recentReports, pendingApprovals] = await Promise.all([
      getCultoStats(),
      getLostMembersStats(),
      getReportsStats(),
      getCultos({ status: 'completed' }),
      getLostMembers({ status: 'lost' }),
      getReports({ status: 'submitted' }),
      getReports({ status: 'submitted' })
    ]);

    return {
      culto_stats: cultoStats,
      lost_members_stats: lostMembersStats,
      reports_stats: reportsStats,
      recent_cultos: recentCultos.slice(0, 5),
      recent_lost_members: recentLostMembers.slice(0, 5),
      recent_reports: recentReports.slice(0, 5),
      pending_approvals: pendingApprovals.slice(0, 10)
    };
  } catch (error) {
    console.error('Error fetching reports dashboard data:', error);
    throw error;
  }
}
