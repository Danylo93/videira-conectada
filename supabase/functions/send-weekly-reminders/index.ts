// Supabase Edge Function para enviar lembretes automáticos de relatórios semanais
// Pode ser chamada manualmente ou via cron job
// Endpoint: https://seu-projeto.supabase.co/functions/v1/send-weekly-reminders

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

interface SendReminderRequest {
  pastorId?: string;
  isKids?: boolean;
  n8nWebhookUrl?: string;
  baseUrl?: string;
  sendViaWhatsApp?: boolean;
  sendViaEmail?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Obter variáveis de ambiente
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const n8nWebhookUrl = Deno.env.get("N8N_WEBHOOK_URL") ?? "";
    const frontendUrl = Deno.env.get("FRONTEND_URL") ?? "";

    // Criar cliente Supabase com service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obter dados do body (se POST) ou query params (se GET)
    let body: SendReminderRequest = {};
    if (req.method === "POST") {
      body = await req.json();
    } else {
      const url = new URL(req.url);
      body = {
        pastorId: url.searchParams.get("pastor_id") || undefined,
        isKids: url.searchParams.get("is_kids") === "true",
        n8nWebhookUrl: url.searchParams.get("n8n_webhook_url") || undefined,
        baseUrl: url.searchParams.get("base_url") || undefined,
        sendViaWhatsApp: url.searchParams.get("send_via_whatsapp") !== "false",
        sendViaEmail: url.searchParams.get("send_via_email") === "true",
      };
    }

    const {
      pastorId,
      isKids = false,
      n8nWebhookUrl: customWebhookUrl,
      baseUrl,
      sendViaWhatsApp = true,
      sendViaEmail = false,
    } = body;

    // Calcular início e fim da semana atual (segunda a domingo)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const monday = new Date(today);
    monday.setDate(today.getDate() - daysToMonday);
    monday.setHours(0, 0, 0, 0);
    const weekStartDate = monday.toISOString().split("T")[0];

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    const weekEndDate = sunday.toISOString().split("T")[0];

    // Buscar líderes
    let leadersQuery = supabase
      .from("profiles")
      .select("id, name, email, phone, celula, is_kids, pastor_uuid")
      .eq("role", "lider");

    if (pastorId) {
      leadersQuery = leadersQuery.eq("pastor_uuid", pastorId);
    }

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
          pending: 0,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Buscar relatórios da semana atual
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

    // Filtrar apenas líderes pendentes
    const pendingLeaders = leaders.filter(
      (leader) => !reportedLeaderIds.has(leader.id)
    );

    if (pendingLeaders.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Todos os líderes já preencheram o relatório desta semana",
          sent: 0,
          pending: 0,
          total: leaders.length,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const frontendBaseUrl = baseUrl || frontendUrl || "https://videirasaomiguel.vercel.app";

    // Preparar mensagens
    const messages = pendingLeaders.map((leader) => {
      const fillLink = `${frontendBaseUrl}/preencher-relatorio?lider=${leader.id}`; //&date=${weekStartDate}
      
      // Formatar data para exibição
      const mondayDate = new Date(weekStartDate);
      const sundayDate = new Date(weekEndDate);
      const formatDateBR = (date: Date) => {
        return date.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      };

      const weekRange = `${formatDateBR(mondayDate)} a ${formatDateBR(sundayDate)}`;

      return {
        liderId: leader.id,
        liderName: leader.name,
        liderEmail: leader.email || undefined,
        liderPhone: leader.phone || undefined,
        celula: leader.celula || undefined,
        fillLink,
        weekRange,
        weekStartDate,
      };
    });

    const results = {
      whatsapp: { sent: 0, failed: 0 },
      email: { sent: 0, failed: 0 },
    };

    // Enviar via WhatsApp (se configurado)
    if (sendViaWhatsApp) {
      const webhookUrl = customWebhookUrl || n8nWebhookUrl;
      
      if (webhookUrl) {
        try {
          // Filtrar apenas líderes com telefone
          const leadersWithPhone = messages.filter((m) => m.liderPhone);
          
          if (leadersWithPhone.length > 0) {
            const n8nResponse = await fetch(webhookUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                type: "weekly_report_reminder",
                leaders: leadersWithPhone.map((m) => ({
                  name: m.liderName,
                  phone: m.liderPhone,
                  celula: m.celula,
                  fillLink: m.fillLink,
                  weekRange: m.weekRange,
                })),
                weekStartDate,
                weekEndDate,
                pastorId,
                isKids,
              }),
            });

            if (n8nResponse.ok) {
              results.whatsapp.sent = leadersWithPhone.length;
            } else {
              results.whatsapp.failed = leadersWithPhone.length;
              const errorText = await n8nResponse.text();
              console.error("Erro ao enviar para N8N:", errorText);
            }
          }
        } catch (error) {
          console.error("Erro ao enviar WhatsApp:", error);
          results.whatsapp.failed = messages.filter((m) => m.liderPhone).length;
        }
      }
    }

    // Enviar via Email (se configurado)
    if (sendViaEmail) {
      // TODO: Implementar envio de email
      // Por enquanto, apenas contabilizar
      results.email.sent = 0;
      results.email.failed = 0;
    }

    // Registrar histórico de lembretes enviados (opcional)
    try {
      await supabase.from("weekly_reminders_log").insert(
        messages.map((m) => ({
          lider_id: m.liderId,
          week_start_date: weekStartDate,
          sent_at: new Date().toISOString(),
          sent_via_whatsapp: sendViaWhatsApp && !!m.liderPhone,
          sent_via_email: sendViaEmail && !!m.liderEmail,
        }))
      );
    } catch (error) {
      // Ignorar erro se a tabela não existir
      console.log("Tabela de log não encontrada, pulando registro");
    }

    const totalSent = results.whatsapp.sent + results.email.sent;
    const totalFailed = results.whatsapp.failed + results.email.failed;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Lembretes processados: ${totalSent} enviados, ${totalFailed} falharam`,
        sent: totalSent,
        failed: totalFailed,
        pending: pendingLeaders.length,
        total: leaders.length,
        details: {
          whatsapp: results.whatsapp,
          email: results.email,
        },
        leaders: pendingLeaders.map((l) => ({
          id: l.id,
          name: l.name,
          phone: l.phone || null,
          email: l.email || null,
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
        error: error.message || "Erro desconhecido",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

