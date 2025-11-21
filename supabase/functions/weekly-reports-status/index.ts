// Supabase Edge Function para retornar status dos relatórios semanais
// Endpoint: https://seu-projeto.supabase.co/functions/v1/weekly-reports-status

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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
  reportLink: string;
  fillLink: string; // Link direto para o líder preencher
  isKids?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Obter variáveis de ambiente
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // Criar cliente Supabase com service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obter parâmetros da query string
    const url = new URL(req.url);
    const reportDate = url.searchParams.get("date");
    const pastorId = url.searchParams.get("pastor_id");
    const isKids = url.searchParams.get("is_kids") === "true";

    // Se não houver data, usar início da semana atual (segunda-feira)
    let targetDate = reportDate;
    if (!targetDate) {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      
      const monday = new Date(today);
      monday.setDate(today.getDate() - daysToMonday);
      monday.setHours(0, 0, 0, 0);
      targetDate = monday.toISOString().split("T")[0];
    }

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

    // Buscar relatórios da data específica
    const liderIds = leaders.map((l) => l.id);
    const { data: reports, error: reportsError } = await supabase
      .from("cell_reports_weekly")
      .select("lider_id, report_date, members_count, frequentadores_count")
      .eq("report_date", targetDate)
      .in("lider_id", liderIds);

    if (reportsError) {
      throw reportsError;
    }

    // Criar mapa de relatórios por líder
    const reportsMap = new Map<string, {
      reportDate: string;
      membersCount: number;
      frequentadoresCount: number;
    }>();
    
    (reports || []).forEach((r: any) => {
      reportsMap.set(r.lider_id, {
        reportDate: r.report_date,
        membersCount: r.members_count || 0,
        frequentadoresCount: r.frequentadores_count || 0,
      });
    });

    // Obter URL base do frontend (ajustar conforme necessário)
    const baseUrl = url.searchParams.get("base_url") || "https://seu-dominio.com";

    // Montar resultado
    const result: LeaderWeeklyReportStatus[] = leaders.map((leader) => {
      const report = reportsMap.get(leader.id);
      const hasReport = !!report;

      // Link para o pastor ver (com seleção de líder)
      const reportLink = `${baseUrl}/relatorios-semanal?lider=${leader.id}&date=${targetDate}`;
      // Link público para o líder preencher (versão pública, sem autenticação)
      const fillLink = `${baseUrl}/preencher-relatorio?lider=${leader.id}&date=${targetDate}`;

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

