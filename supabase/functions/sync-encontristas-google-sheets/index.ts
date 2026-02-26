import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

async function syncToGoogleSheets(
  supabase: any,
  sheetId: string,
  sheetName: string
) {
  const { data: registrations, error } = await (supabase as any)
    .from("encounter_registrations")
    .select(`
      id,
      nome_completo,
      funcao,
      discipulador_id,
      lider_id,
      created_at,
      discipulador:profiles!encounter_registrations_discipulador_id_fkey(name),
      lider:profiles!encounter_registrations_lider_id_fkey(name)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Error fetching encounter registrations: ${error.message}`);
  }

  const headers = ["Nome Completo", "Funcao", "Discipulador", "Lider", "Data de Cadastro"];
  const rows = (registrations || []).map((item: any) => [
    item.nome_completo || "",
    item.funcao || "encontrista",
    item.discipulador?.name || "Nao informado",
    item.lider?.name || "Nao informado",
    item.created_at ? new Date(item.created_at).toLocaleDateString("pt-BR") : "",
  ]);

  const values = [headers, ...rows];
  const googleSheetsWebhookUrl = Deno.env.get("GOOGLE_SHEETS_WEBHOOK_URL");

  if (!googleSheetsWebhookUrl) {
    return {
      success: true,
      rowCount: rows.length + 1,
      note: "Webhook not configured - data prepared but not sent.",
    };
  }

  const payload = {
    sheet_id: sheetId,
    sheet_name: sheetName,
    range: `${sheetName}!A1:E${rows.length + 1}`,
    values,
    action: "update",
  };

  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  try {
    timeoutId = setTimeout(() => controller.abort(), 8000) as ReturnType<
      typeof setTimeout
    >;

    const response = await fetch(googleSheetsWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`Webhook failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json().catch(() => ({ success: true }));
    return { success: true, rowCount: rows.length + 1, webhookResponse: result };
  } catch (fetchError: any) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    if (fetchError.name === "AbortError" || fetchError.message?.includes("aborted")) {
      throw new Error("Timeout: webhook do Google Sheets nao respondeu em 8 segundos.");
    }

    throw fetchError;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceKey) {
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

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: config, error: configError } = await (supabase as any)
      .from("google_sheets_encounter_config")
      .select("*")
      .eq("enabled", true)
      .maybeSingle();

    if (configError) {
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
      return new Response(
        JSON.stringify({
          success: false,
          message: "Google Sheets sync not configured or disabled for encounter registrations",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const result = await syncToGoogleSheets(supabase, config.sheet_id, config.sheet_name);
    const executionTime = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        success: true,
        message: "Encounter registrations synced to Google Sheets successfully",
        rowCount: result.rowCount,
        executionTime: `${executionTime}ms`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || "Error syncing encounter registrations",
        executionTime: `${executionTime}ms`,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
