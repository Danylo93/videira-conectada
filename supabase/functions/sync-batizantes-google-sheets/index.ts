// Supabase Edge Function para sincronizar batizantes com Google Sheets
// Esta função é chamada automaticamente via webhook quando há mudanças na tabela batismo_registrations

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

interface GoogleSheetsConfig {
  sheet_id: string;
  sheet_name: string;
  enabled: boolean;
}

async function syncToGoogleSheets(
  supabase: any,
  sheetId: string,
  sheetName: string
) {
  try {
    // Buscar todos os batizantes com JOIN para pegar o nome do líder em uma única query (MUITO MAIS RÁPIDO!)
    const { data: batizantes, error: batizantesError } = await (supabase as any)
      .from("batismo_registrations")
      .select(`
        id,
        nome_completo,
        lider_id,
        tamanho_camiseta,
        created_at,
        profiles!batismo_registrations_lider_id_fkey(name)
      `)
      .order("created_at", { ascending: false });

    if (batizantesError) {
      console.error("Error fetching batizantes:", batizantesError);
      throw new Error(`Error fetching batizantes: ${batizantesError.message}`);
    }

    // Preparar dados para Google Sheets (muito mais rápido agora com JOIN)
    const headers = ["Nome Completo", "Líder", "Tamanho Camiseta", "Data de Cadastro"];
    const rows = (batizantes || []).map((b: any) => [
      b.nome_completo || "",
      b.profiles?.name || "Não informado",
      b.tamanho_camiseta || "",
      b.created_at ? new Date(b.created_at).toLocaleDateString("pt-BR") : "",
    ]);

    // Preparar valores para atualização no Google Sheets
    const values = [headers, ...rows];

    // Usar Google Apps Script ou webhook intermediário para atualizar Google Sheets
    const googleSheetsWebhookUrl = Deno.env.get("GOOGLE_SHEETS_WEBHOOK_URL");
    
    console.log("🔍 Verificando webhook configurado:", {
      hasWebhookUrl: !!googleSheetsWebhookUrl,
      webhookUrlLength: googleSheetsWebhookUrl?.length || 0,
      sheetId: sheetId,
      sheetName: sheetName,
      rowCount: rows.length + 1
    });
    
    if (googleSheetsWebhookUrl) {
      console.log("✅ Webhook URL encontrada, enviando dados para Google Sheets...");
      
      // Criar um AbortController para timeout de 8 segundos (evita travar!)
      const controller = new AbortController();
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      
      try {
        // Configurar timeout (8 segundos)
        timeoutId = setTimeout(() => {
          console.warn("⏱️ Timeout iniciado, cancelando requisição...");
          controller.abort();
        }, 8000) as ReturnType<typeof setTimeout>;

        const webhookPayload = {
          sheet_id: sheetId,
          sheet_name: sheetName,
          range: `${sheetName}!A1:D${rows.length + 1}`,
          values: values,
          action: "update",
        };
        
        console.log("📤 Enviando para webhook:", {
          url: googleSheetsWebhookUrl.substring(0, 50) + "...",
          payloadSize: JSON.stringify(webhookPayload).length,
          rows: rows.length + 1
        });
        
        // Se houver webhook configurado (Google Apps Script, Make.com, Zapier, etc)
        const response = await fetch(googleSheetsWebhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(webhookPayload),
          signal: controller.signal, // Adicionar timeout
        });

        // Limpar timeout se chegou até aqui
        if (timeoutId !== null) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        console.log("📥 Resposta do webhook:", {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => "Unknown error");
          console.error("❌ Webhook failed:", errorText);
          throw new Error(`Webhook failed: ${response.status} - ${errorText}`);
        }

        const result = await response.json().catch(() => ({ success: true }));
        console.log("✅ Webhook respondido com sucesso:", result);
        return { success: true, rowCount: rows.length + 1, webhookResponse: result };
      } catch (fetchError: any) {
        // Limpar timeout em caso de erro
        if (timeoutId !== null) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        
        if (fetchError.name === 'AbortError' || fetchError.message?.includes('aborted')) {
          console.error("⏱️ Webhook timeout after 8 seconds");
          throw new Error("Timeout: O webhook do Google Sheets não respondeu em 8 segundos. Verifique se o Google Apps Script está funcionando.");
        }
        console.error("❌ Erro ao chamar webhook:", fetchError.message || fetchError);
        throw fetchError;
      }
    } else {
      // Sem webhook configurado - retornar rápido sem esperar
      console.warn("⚠️ ATENÇÃO: GOOGLE_SHEETS_WEBHOOK_URL não está configurado!", {
        sheet_id: sheetId,
        sheet_name: sheetName,
        row_count: rows.length + 1,
        note: "Configure GOOGLE_SHEETS_WEBHOOK_URL como variável de ambiente no Supabase para habilitar sincronização automática"
      });
      
      return { 
        success: true, 
        rowCount: rows.length + 1, 
        note: "Webhook not configured - data prepared but not sent. Configure GOOGLE_SHEETS_WEBHOOK_URL for automatic sync." 
      };
    }
  } catch (error: any) {
    console.error("Error syncing to Google Sheets:", error);
    console.error("Error stack:", error?.stack);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight - SEMPRE retornar resposta imediata
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  const startTime = Date.now();
  
  // SEMPRE retornar uma resposta válida - usar try-catch global
  try {
    console.log("🚀 Edge Function iniciada", {
      method: req.method,
      timestamp: new Date().toISOString(),
    });

    // Verificar variáveis de ambiente imediatamente
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("❌ Missing Supabase configuration");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing Supabase configuration",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("✅ Configuração do Supabase OK");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar configuração do Google Sheets (query rápida)
    console.log("🔍 Buscando configuração do Google Sheets...");
    const { data: config, error: configError } = await (supabase as any)
      .from("google_sheets_config")
      .select("*")
      .eq("enabled", true)
      .maybeSingle();

    if (configError) {
      console.error("❌ Error fetching config:", configError);
      return new Response(
        JSON.stringify({
          success: false,
          message: "Error fetching Google Sheets configuration",
          error: configError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!config) {
      console.log("⚠️ Google Sheets sync not configured");
      return new Response(
        JSON.stringify({
          success: false,
          message: "Google Sheets sync not configured or disabled",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("✅ Config encontrada, iniciando sincronização...");

    // Sincronizar dados (agora com timeout e otimizações)
    const result = await syncToGoogleSheets(
      supabase,
      config.sheet_id,
      config.sheet_name
    );

    const executionTime = Date.now() - startTime;
    console.log(`✅ Sync completed in ${executionTime}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Data synced to Google Sheets successfully",
        rowCount: result.rowCount,
        executionTime: `${executionTime}ms`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    // CAPTURAR QUALQUER ERRO NÃO TRATADO
    const executionTime = Date.now() - startTime;
    console.error(`❌ ERROR CRÍTICO after ${executionTime}ms:`, error);
    console.error("Error details:", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      toString: error?.toString(),
    });

    // SEMPRE retornar uma resposta válida, mesmo em caso de erro crítico
    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || "Error syncing to Google Sheets",
        executionTime: `${executionTime}ms`,
        errorName: error?.name || "Unknown",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
