import { supabase } from './client';

export interface LeaderWeeklyReportStatus {
  liderId: string;
  liderName: string;
  liderEmail: string;
  liderPhone?: string;
  celula?: string;
  hasReport: boolean;
  reportDate?: string;
  membersCount?: number;
  frequentadoresCount?: number;
  visitantesCount?: number;
  reportLink: string;
  fillLink: string; // Link direto para o líder preencher
  isKids?: boolean;
}

const allowedReportDays = new Set([4, 5, 6]); // quinta, sexta, sábado

const parseDateInput = (value: string): Date | null => {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const formatDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const normalizeReportDate = (value: string) => {
  const date = parseDateInput(value);
  if (!date) return value;
  const day = date.getDay();
  if (allowedReportDays.has(day)) return value;
  const adjusted = new Date(date);
  if (day === 0) {
    adjusted.setDate(date.getDate() - 1); // domingo -> sábado
  } else {
    adjusted.setDate(date.getDate() + (4 - day)); // seg a qua -> quinta
  }
  return formatDateInput(adjusted);
};

const getWeekMonday = (date: Date) => {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
};

const getReportWindow = (baseDate: Date) => {
  const monday = getWeekMonday(baseDate);
  const thursday = new Date(monday);
  thursday.setDate(monday.getDate() + 3);
  const saturday = new Date(monday);
  saturday.setDate(monday.getDate() + 5);
  return { start: thursday, end: saturday };
};

/**
 * Busca todos os líderes com status de relatório semanal para uma data específica
 * @param reportDate Data do relatório no formato YYYY-MM-DD
 * @param pastorId ID do pastor (opcional, filtra apenas líderes deste pastor)
 * @param isKids Se true, retorna apenas líderes do modo Kids
 * @returns Lista de líderes com status de relatório
 */
export async function getLeadersWeeklyReportStatus(
  reportDate: string,
  pastorId?: string,
  isKids?: boolean
): Promise<LeaderWeeklyReportStatus[]> {
  const baseDate = parseDateInput(reportDate) ?? new Date();
  const reportWindow = getReportWindow(baseDate);
  const reportStartDate = formatDateInput(reportWindow.start);
  const reportEndDate = formatDateInput(reportWindow.end);
  const reportDateForLink = normalizeReportDate(reportDate || reportStartDate);

  // Buscar todos os líderes
  let leadersQuery = supabase
    .from('profiles')
    .select('id, name, email, phone, celula, is_kids, pastor_uuid')
    .eq('role', 'lider');

  if (pastorId) {
    leadersQuery = leadersQuery.eq('pastor_uuid', pastorId);
  }

  if (isKids !== undefined) {
    if (isKids) {
      leadersQuery = leadersQuery.eq('is_kids', true);
    } else {
      leadersQuery = leadersQuery.or('is_kids.is.null,is_kids.eq.false');
    }
  }

  const { data: leaders, error: leadersError } = await leadersQuery.order('name');

  if (leadersError) {
    console.error('Error loading leaders:', leadersError);
    throw leadersError;
  }

  if (!leaders || leaders.length === 0) {
    return [];
  }

  // Buscar relatórios da janela (quinta a sábado)
  const liderIds = leaders.map(l => l.id);
  const { data: reports, error: reportsError } = await supabase
    .from('cell_reports_weekly')
    .select('lider_id, report_date, members_count, frequentadores_count, visitantes_count')
    .gte('report_date', reportStartDate)
    .lte('report_date', reportEndDate)
    .in('lider_id', liderIds);

  if (reportsError) {
    console.error('Error loading reports:', reportsError);
    throw reportsError;
  }

  // Criar mapa de relatórios por líder (usar o mais recente da janela)
  const reportsMap = new Map<string, {
    reportDate: string;
    membersCount: number;
    frequentadoresCount: number;
    visitantesCount: number;
  }>();

  (reports || []).forEach((r) => {
    const existing = reportsMap.get(r.lider_id);
    if (!existing) {
      reportsMap.set(r.lider_id, {
        reportDate: r.report_date,
        membersCount: r.members_count,
        frequentadoresCount: r.frequentadores_count,
        visitantesCount: r.visitantes_count || 0,
      });
      return;
    }

    const currentDate = new Date(r.report_date);
    const existingDate = new Date(existing.reportDate);
    if (currentDate > existingDate) {
      reportsMap.set(r.lider_id, {
        reportDate: r.report_date,
        membersCount: r.members_count,
        frequentadoresCount: r.frequentadores_count,
        visitantesCount: r.visitantes_count || 0,
      });
    }
  });

  // Construir URL base (ajustar conforme necessário)
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : 'https://videirasaomiguel.vercel.app';

  // Montar resultado
  return leaders.map(leader => {
    const report = reportsMap.get(leader.id);
    const hasReport = !!report;

    // Link para o pastor ver (com seleção de líder)
    const reportLink = `${baseUrl}/relatorios-semanal?lider=${leader.id}&date=${reportDateForLink}`;
    // Link público para o líder preencher (versão pública, sem autenticação)
    const fillLink = `${baseUrl}/preencher-relatorio?lider=${leader.id}&date=${reportDateForLink}`;

    return {
      liderId: leader.id,
      liderName: leader.name,
      liderEmail: leader.email || '',
      liderPhone: leader.phone || undefined,
      celula: leader.celula || undefined,
      hasReport,
      reportDate: report?.reportDate,
      membersCount: report?.membersCount,
      frequentadoresCount: report?.frequentadoresCount,
      visitantesCount: report?.visitantesCount,
      reportLink,
      fillLink,
      isKids: leader.is_kids || false,
    };
  });
}

/**
 * Busca status de relatórios semanais para a semana atual
 * @param pastorId ID do pastor (opcional)
 * @param isKids Se true, retorna apenas líderes do modo Kids
 * @returns Lista de líderes com status de relatório da semana atual
 */
export async function getCurrentWeekLeadersStatus(
  pastorId?: string,
  isKids?: boolean
): Promise<LeaderWeeklyReportStatus[]> {
  const reportDate = formatDateInput(new Date());
  return getLeadersWeeklyReportStatus(reportDate, pastorId, isKids);
}

