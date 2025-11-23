// Supabase Edge Function para acionar envio de WhatsApp para líderes pendentes
// Endpoint: https://seu-projeto.supabase.co/functions/v1/send-weekly-reports-whatsapp

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendWhatsAppRequest {
  pastorId: string;
  isKids?: boolean;
  n8nWebhookUrl?: string;
  baseUrl?: string;
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
    const n8nWebhookUrl = Deno.env.get("N8N_WEBHOOK_URL") ?? "";

    // Criar cliente Supabase com service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obter dados do body
    const body: SendWhatsAppRequest = await req.json();
    const { pastorId, isKids = false, n8nWebhookUrl: customWebhookUrl, baseUrl } = body;

    if (!pastorId) {
      throw new Error("pastorId é obrigatório");
    }

    // Calcular início da semana (segunda-feira)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysToMonday);
    monday.setHours(0, 0, 0, 0);
    const weekStartDate = monday.toISOString().split("T")[0];

    // Buscar líderes do pastor
    let leadersQuery = supabase
      .from("profiles")
      .select("id, name, email, phone, celula, is_kids")
      .eq("role", "lider")
      .eq("pastor_uuid", pastorId);

    if (isKids) {
      leadersQuery = leadersQuery.eq("is_kids", true);
    } else {
      leadersQuery = leadersQuery.or("is_kids.is.null,is_kids.eq.false");
    }

    const { data: leaders, error: leadersError } = await leadersQuery.order("name");

    if (leadersError) {
      throw leadersError;
    }

    if (!leaders || leaders.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Nenhum líder encontrado",
          sent: 0,
          pending: 0
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Buscar relatórios da semana (segunda a domingo)
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const weekEndDate = sunday.toISOString().split("T")[0];

    const liderIds = leaders.map((l) => l.id);
    const { data: reports, error: reportsError } = await supabase
      .from("cell_reports_weekly")
      .select("lider_id")
      .in("lider_id", liderIds)
      .gte("report_date", weekStartDate)
      .lte("report_date", weekEndDate);

    if (reportsError) {
      throw reportsError;
    }

    // Criar mapa de líderes que já preencheram
    const reportedLeaderIds = new Set((reports || []).map((r) => r.lider_id));

    // Filtrar apenas líderes pendentes com telefone
    const pendingLeaders = leaders.filter(
      (leader) => !reportedLeaderIds.has(leader.id) && leader.phone
    );

    if (pendingLeaders.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Todos os líderes já preencheram o relatório ou não possuem telefone cadastrado",
          sent: 0,
          pending: 0,
          total: leaders.length
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Preparar dados para enviar ao N8N
    const webhookUrl = customWebhookUrl || n8nWebhookUrl;
    
    if (!webhookUrl) {
      throw new Error("N8N webhook URL não configurada");
    }

    const frontendUrl = baseUrl || Deno.env.get("FRONTEND_URL") || "https://videirasaomiguel.vercel.app";

    // Preparar mensagens para cada líder pendente
    const messages = pendingLeaders.map((leader) => {
      const fillLink = `${frontendUrl}/preencher-relatorio?lider=${leader.id}`; //&date=${weekStartDate}
      
      return {
        liderId: leader.id,
        liderName: leader.name,
        liderPhone: leader.phone,
        fillLink,
        weekStartDate,
      };
    });

    // Enviar para o N8N via webhook
    const n8nResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        leaders: messages,
        weekStartDate,
        weekEndDate,
        pastorId,
        isKids,
      }),
    });

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      throw new Error(`Erro ao enviar para N8N: ${errorText}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Mensagens enviadas para ${pendingLeaders.length} líder(es) pendente(s)`,
        sent: pendingLeaders.length,
        pending: pendingLeaders.length,
        total: leaders.length,
        leaders: pendingLeaders.map((l) => ({
          id: l.id,
          name: l.name,
          phone: l.phone,
        })),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Erro desconhecido" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

