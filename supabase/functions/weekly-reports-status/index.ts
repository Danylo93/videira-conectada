// Supabase Edge Function para retornar status dos relatórios semanais
// Endpoint: https://seu-projeto.supabase.co/functions/v1/weekly-reports-status

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

interface LeaderWeeklyReportStatus {
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
  return new Date(Date.UTC(year, month - 1, day));
};

const formatDateInput = (date: Date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const normalizeReportDate = (value: string) => {
  const date = parseDateInput(value);
  if (!date) return value;
  const day = date.getUTCDay();
  if (allowedReportDays.has(day)) return value;
  const adjusted = new Date(date);
  if (day === 0) {
    adjusted.setUTCDate(date.getUTCDate() - 1); // domingo -> sábado
  } else {
    adjusted.setUTCDate(date.getUTCDate() + (4 - day)); // seg a qua -> quinta
  }
  return formatDateInput(adjusted);
};

const getWeekMondayUTC = (date: Date) => {
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() + diff);
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
};

const getReportWindowUTC = (baseDate: Date) => {
  const monday = getWeekMondayUTC(baseDate);
  const thursday = new Date(monday);
  thursday.setUTCDate(monday.getUTCDate() + 3);
  const saturday = new Date(monday);
  saturday.setUTCDate(monday.getUTCDate() + 5);
  return { start: thursday, end: saturday };
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    // Obter variáveis de ambiente
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // Criar cliente Supabase com service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obter parâmetros da query string ou do body (POST)
    const url = new URL(req.url);
    let requestBody: any = null;
    
    // Tentar ler do body se for POST
    if (req.method === "POST") {
      try {
        requestBody = await req.json();
      } catch {
        // Se não conseguir ler JSON, continuar com query params
      }
    }
    
    const reportDate = requestBody?.date || url.searchParams.get("date");
    const pastorId = requestBody?.pastor_id || url.searchParams.get("pastor_id");
    const isKids = requestBody?.is_kids === true || requestBody?.is_kids === "true" || url.searchParams.get("is_kids") === "true";

    const baseDate = reportDate ? parseDateInput(reportDate) : null;
    if (reportDate && !baseDate) {
      throw new Error(`Data inválida: ${reportDate}`);
    }

    const effectiveBaseDate = baseDate ?? new Date();
    const reportWindow = getReportWindowUTC(effectiveBaseDate);
    const reportStartDate = formatDateInput(reportWindow.start);
    const reportEndDate = formatDateInput(reportWindow.end);
    const reportDateForLink = reportDate
      ? normalizeReportDate(reportDate)
      : normalizeReportDate(formatDateInput(effectiveBaseDate));

    // Buscar todos os líderes
    let leadersQuery = supabase
      .from("profiles")
      .select("id, name, email, phone, celula, is_kids, pastor_uuid")
      .eq("role", "lider");

    if (pastorId) {
      leadersQuery = leadersQuery.eq("pastor_uuid", pastorId);
    }

    if (isKids) {
      leadersQuery = leadersQuery.eq("is_kids", true);
    } else if (isKids === false) {
      leadersQuery = leadersQuery.or("is_kids.is.null,is_kids.eq.false");
    }

    const { data: leaders, error: leadersError } = await leadersQuery.order("name");

    if (leadersError) {
      throw leadersError;
    }

    if (!leaders || leaders.length === 0) {
      return new Response(
        JSON.stringify([]),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Buscar relatórios da janela (quinta a sábado)
    const liderIds = leaders.map((l) => l.id);
    
    const { data: reports, error: reportsError } = await supabase
      .from("cell_reports_weekly")
      .select("lider_id, report_date, members_count, frequentadores_count, visitantes_count")
      .in("lider_id", liderIds)
      .gte("report_date", reportStartDate)
      .lte("report_date", reportEndDate);

    if (reportsError) {
      throw reportsError;
    }

    // Criar mapa de relatórios por líder
    // Se um líder tiver múltiplos relatórios na semana, usar o mais recente
    const reportsMap = new Map<string, {
      reportDate: string;
      membersCount: number;
      frequentadoresCount: number;
      visitantesCount: number;
    }>();
    
    (reports || []).forEach((r: any) => {
      const existing = reportsMap.get(r.lider_id);
      // Se já existe um relatório para este líder, usar o mais recente (comparar datas)
      if (!existing) {
        reportsMap.set(r.lider_id, {
          reportDate: r.report_date,
          membersCount: r.members_count || 0,
          frequentadoresCount: r.frequentadores_count || 0,
          visitantesCount: r.visitantes_count || 0,
        });
      } else {
        // Comparar datas para pegar o mais recente
        const existingDate = new Date(existing.reportDate);
        const currentDate = new Date(r.report_date);
        if (currentDate > existingDate) {
          reportsMap.set(r.lider_id, {
          reportDate: r.report_date,
          membersCount: r.members_count || 0,
          frequentadoresCount: r.frequentadores_count || 0,
          visitantesCount: r.visitantes_count || 0,
        });
        }
      }
    });

    // Obter URL base do frontend (ajustar conforme necessário)
    const baseUrl = requestBody?.base_url || url.searchParams.get("base_url") || "https://videirasaomiguel.vercel.app";

    // Montar resultado
    const result: LeaderWeeklyReportStatus[] = leaders.map((leader) => {
      const report = reportsMap.get(leader.id);
      const hasReport = !!report;

      // Link para o pastor ver (com seleção de líder)
      const reportLink = `${baseUrl}/relatorios-semanal?lider=${leader.id}&date=${reportDateForLink}`;
      // Link público para o líder preencher (versão pública, sem autenticação)
      const fillLink = `${baseUrl}/preencher-relatorio?lider=${leader.id}&date=${reportDateForLink}`;

      return {
        liderId: leader.id,
        liderName: leader.name,
        liderEmail: leader.email || "",
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

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

