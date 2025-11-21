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
  reportLink: string;
  fillLink: string; // Link direto para o líder preencher
  isKids?: boolean;
}

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

  // Buscar relatórios da data específica
  const liderIds = leaders.map(l => l.id);
  const { data: reports, error: reportsError } = await supabase
    .from('cell_reports_weekly')
    .select('lider_id, report_date, members_count, frequentadores_count')
    .eq('report_date', reportDate)
    .in('lider_id', liderIds);

  if (reportsError) {
    console.error('Error loading reports:', reportsError);
    throw reportsError;
  }

  // Criar mapa de relatórios por líder
  const reportsMap = new Map(
    (reports || []).map(r => [
      r.lider_id,
      {
        reportDate: r.report_date,
        membersCount: r.members_count,
        frequentadoresCount: r.frequentadores_count,
      }
    ])
  );

  // Construir URL base (ajustar conforme necessário)
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : 'https://seu-dominio.com';

  // Montar resultado
  return leaders.map(leader => {
    const report = reportsMap.get(leader.id);
    const hasReport = !!report;

    // Link para o pastor ver (com seleção de líder)
    const reportLink = `${baseUrl}/relatorios-semanal?lider=${leader.id}&date=${reportDate}`;
    // Link público para o líder preencher (versão pública, sem autenticação)
    const fillLink = `${baseUrl}/preencher-relatorio?lider=${leader.id}&date=${reportDate}`;

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
  // Calcular início da semana (segunda-feira)
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = domingo, 1 = segunda, etc.
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Ajuste para segunda-feira
  
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysToMonday);
  monday.setHours(0, 0, 0, 0);

  const reportDate = monday.toISOString().split('T')[0];

  return getLeadersWeeklyReportStatus(reportDate, pastorId, isKids);
}

