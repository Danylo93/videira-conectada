// Supabase Edge Function para enviar lembretes automáticos de escalas semanais
// Envia mensagem individual para cada servo com suas escalas específicas
// Endpoint: https://seu-projeto.supabase.co/functions/v1/send-escalas-reminders

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

interface SendEscalasReminderRequest {
  semana_inicio: string; // Data do sábado da semana (YYYY-MM-DD)
  n8nWebhookUrl?: string;
}

interface ServoEscala {
  servo_id: string;
  servo_name: string;
  servo_phone?: string;
  escalas: Array<{
    area: string;
    area_label: string;
    dia: "sabado" | "domingo";
    funcao_louvor?: string;
    funcao_conexao?: string;
  }>;
}

const AREAS: Record<string, string> = {
  midia: "Mídia",
  domingo_kids: "Domingo Kids",
  louvor: "Louvor",
  mesa_som: "Mesa de Som",
  cantina: "Cantina",
  conexao: "Conexão",
};

const FUNCOES_LOUVOR: Record<string, string> = {
  ministro: "Ministro",
  violao: "Violão",
  voz1: "Voz 1",
  voz2: "Voz 2",
  baixo: "Baixo",
  teclado: "Teclado",
  bateria: "Bateria",
  guitarra: "Guitarra",
};

const FUNCOES_CONEXAO: Record<string, string> = {
  recepcao1: "Recepção 1",
  recepcao2: "Recepção 2",
  estacionamento1: "Estacionamento 1",
  estacionamento2: "Estacionamento 2",
  nave_igreja: "Nave da igreja",
  porta_kids: "Porta dos Kids",
};

function formatDateBR(dateString: string): string {
  const date = new Date(dateString);
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

function generateMessageForServo(servo: ServoEscala, sabadoDate: string, domingoDate: string): string {
  const sabado = formatDateBR(sabadoDate);
  const domingo = formatDateBR(domingoDate);
  
  let message = `*Olá ${servo.servo_name}!*\n\n`;
  message += `*LEMBRETE DE SUA ESCALA*\n\n`;
  message += `*${sabado}* (Sábado) e *${domingo}* (Domingo)\n\n`;
  message += `═══════════════════════\n\n`;
  
  // Agrupar escalas por dia
  const escalasSabado = servo.escalas.filter(e => e.dia === "sabado");
  const escalasDomingo = servo.escalas.filter(e => e.dia === "domingo");
  
  if (escalasSabado.length > 0) {
    message += `*Sábado (${sabado})*\n`;
    escalasSabado.forEach(escala => {
      if (escala.area === "louvor" && escala.funcao_louvor) {
        message += `  - ${AREAS[escala.area]}: ${FUNCOES_LOUVOR[escala.funcao_louvor]}\n`;
      } else if (escala.area === "conexao" && escala.funcao_conexao) {
        message += `  - ${AREAS[escala.area]}: ${FUNCOES_CONEXAO[escala.funcao_conexao]}\n`;
      } else {
        message += `  - ${AREAS[escala.area]}\n`;
      }
    });
    message += `\n`;
  }
  
  if (escalasDomingo.length > 0) {
    message += `*Domingo (${domingo})*\n`;
    escalasDomingo.forEach(escala => {
      if (escala.area === "louvor" && escala.funcao_louvor) {
        message += `  - ${AREAS[escala.area]}: ${FUNCOES_LOUVOR[escala.funcao_louvor]}\n`;
      } else if (escala.area === "conexao" && escala.funcao_conexao) {
        message += `  - ${AREAS[escala.area]}: ${FUNCOES_CONEXAO[escala.funcao_conexao]}\n`;
      } else {
        message += `  - ${AREAS[escala.area]}\n`;
      }
    });
    message += `\n`;
  }
  
  message += `═══════════════════════\n`;
  message += `Que Deus abençoe você! 🙏`;
  
  return message;
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

    // Criar cliente Supabase com service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obter dados do body (se POST) ou query params (se GET)
    let body: SendEscalasReminderRequest = {};
    if (req.method === "POST") {
      body = await req.json();
    } else {
      const url = new URL(req.url);
      body = {
        semana_inicio: url.searchParams.get("semana_inicio") || "",
        n8nWebhookUrl: url.searchParams.get("n8n_webhook_url") || undefined,
      };
    }

    if (!body.semana_inicio) {
      throw new Error("semana_inicio é obrigatório");
    }

    // Calcular datas de sábado e domingo
    const sabadoDate = body.semana_inicio; // Já é o sábado
    const domingoDate = new Date(sabadoDate);
    domingoDate.setDate(domingoDate.getDate() + 1);
    const domingoDateStr = domingoDate.toISOString().split("T")[0];

    // Buscar todas as escalas da semana
    const { data: escalas, error: escalasError } = await supabase
      .from("escalas")
      .select(`
        id,
        semana_inicio,
        area,
        servo_id,
        dia,
        funcao_louvor,
        funcao_conexao
      `)
      .eq("semana_inicio", body.semana_inicio)
      .order("area, dia");

    if (escalasError) {
      throw escalasError;
    }

    if (!escalas || escalas.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          sent: 0,
          message: "Nenhuma escala encontrada para esta semana",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Buscar informações dos servos
    const servoIds = [...new Set(escalas.map((e: any) => e.servo_id).filter(Boolean))];
    
    if (servoIds.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          sent: 0,
          message: "Nenhum servo encontrado nas escalas",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const { data: servos, error: servosError } = await supabase
      .from("servos")
      .select("id, nome, telefone")
      .in("id", servoIds);

    if (servosError) {
      throw servosError;
    }

    // Criar mapa de servos
    const servosMap = new Map<string, { nome: string; telefone?: string }>();
    (servos || []).forEach((s: any) => {
      servosMap.set(s.id, { nome: s.nome, telefone: s.telefone });
    });

    // Agrupar escalas por servo
    const servosEscalas = new Map<string, ServoEscala>();

    escalas.forEach((escala: any) => {
      const servoInfo = servosMap.get(escala.servo_id);
      if (!servoInfo) return; // Pular se o servo não existir

      if (!servosEscalas.has(escala.servo_id)) {
        servosEscalas.set(escala.servo_id, {
          servo_id: escala.servo_id,
          servo_name: servoInfo.nome,
          servo_phone: servoInfo.telefone,
          escalas: [],
        });
      }

      const servoEscala = servosEscalas.get(escala.servo_id)!;
      servoEscala.escalas.push({
        area: escala.area,
        area_label: AREAS[escala.area] || escala.area,
        dia: escala.dia,
        funcao_louvor: escala.funcao_louvor || undefined,
        funcao_conexao: escala.funcao_conexao || undefined,
      });
    });

    // Verificar quais servos já receberam lembrete nesta semana
    const { data: remindersLog, error: logError } = await supabase
      .from("escalas_reminders_log")
      .select("servo_id")
      .eq("semana_inicio", body.semana_inicio);

    if (logError) {
      console.warn("Erro ao buscar log de lembretes:", logError);
    }

    const servosJaEnviados = new Set<string>();
    (remindersLog || []).forEach((log: any) => {
      if (log.servo_id) servosJaEnviados.add(log.servo_id);
    });

    // Gerar mensagens para cada servo (apenas os que ainda não receberam)
    const servosToSend: Array<{ phone: string; message: string; name: string; servo_id: string }> = [];

    servosEscalas.forEach((servo) => {
      // Pular se já foi enviado
      if (servosJaEnviados.has(servo.servo_id)) {
        console.log(`Servo ${servo.servo_name} já recebeu lembrete para esta semana`);
        return;
      }

      if (!servo.servo_phone) {
        console.log(`Servo ${servo.servo_name} não tem telefone cadastrado`);
        return;
      }

      const message = generateMessageForServo(servo, sabadoDate, domingoDateStr);
      
      // Formatar telefone (garantir que comece com 55)
      let phone = servo.servo_phone.replace(/\D/g, ""); // Remove caracteres não numéricos
      if (!phone.startsWith("55")) {
        phone = "55" + phone;
      }

      servosToSend.push({
        phone,
        message,
        name: servo.servo_name,
        servo_id: servo.servo_id,
      });
    });

    if (servosToSend.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          sent: 0,
          message: "Nenhum servo com telefone cadastrado encontrado",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Enviar para N8N
    const webhookUrl = body.n8nWebhookUrl || n8nWebhookUrl;
    
    if (!webhookUrl) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "N8N webhook URL não configurada",
          servos: servosToSend.map(s => ({ name: s.name, phone: s.phone })),
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Enviar para N8N
    const n8nResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        servos: servosToSend,
        semana_inicio: body.semana_inicio,
        servos_ja_enviados: servosJaEnviados.size,
      }),
    });

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      throw new Error(`Erro ao enviar para N8N: ${errorText}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: servosToSend.length,
        servos: servosToSend.map(s => ({ name: s.name, phone: s.phone })),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
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



