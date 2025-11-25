// Supabase Edge Function para exportar dados para Google Sheets
// Endpoint: https://seu-projeto.supabase.co/functions/v1/export-to-google-sheets

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

interface ExportRequest {
  type: "batizantes" | "dizimistas";
  filters?: {
    search?: string;
    leaderId?: string;
    discipuladorId?: string;
  };
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const googleSheetsWebhookUrl = Deno.env.get("GOOGLE_SHEETS_WEBHOOK_URL") ?? "";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obter dados do request
    const body: ExportRequest = await req.json();
    const { type, filters } = body;

    let data: any[] = [];

    if (type === "batizantes") {
      // Buscar batizantes
      let query = supabase
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

      if (filters?.leaderId && filters.leaderId !== "all") {
        query = query.eq("lider_id", filters.leaderId);
      }

      const { data: batizantesData, error } = await query;

      if (error) throw error;

      data = (batizantesData || []).map((b: any) => ({
        "Nome Completo": b.nome_completo,
        "Líder": b.profiles?.name || "Não informado",
        "Tamanho Camiseta": b.tamanho_camiseta,
        "Data de Cadastro": new Date(b.created_at).toLocaleDateString("pt-BR"),
      }));
    } else if (type === "dizimistas") {
      // Buscar dizimistas
      let query = supabase
        .from("dizimistas")
        .select(`
          id,
          nome_completo,
          conjugue,
          discipulador_id,
          telefone,
          casado,
          created_at,
          profiles!dizimistas_discipulador_id_fkey(name)
        `)
        .order("created_at", { ascending: false });

      if (filters?.discipuladorId && filters.discipuladorId !== "all") {
        query = query.eq("discipulador_id", filters.discipuladorId);
      }

      const { data: dizimistasData, error } = await query;

      if (error) throw error;

      data = (dizimistasData || []).map((d: any) => ({
        "Nome Completo": d.nome_completo,
        "Cônjuge": d.conjugue || "",
        "Discipulador": d.profiles?.name || "Não informado",
        "Telefone": d.telefone,
        "Estado Civil": d.casado ? "Casado" : "Solteiro",
        "Data de Cadastro": new Date(d.created_at).toLocaleDateString("pt-BR"),
      }));
    }

    // Se tiver webhook do Google Sheets configurado, enviar via webhook
    if (googleSheetsWebhookUrl) {
      const webhookResponse = await fetch(googleSheetsWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          data,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!webhookResponse.ok) {
        throw new Error("Failed to send to Google Sheets webhook");
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Dados enviados para Google Sheets com sucesso!",
          count: data.length,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Retornar dados como CSV
    const headers = Object.keys(data[0] || {});
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const cell = String(row[header] || "");
            return `"${cell.replace(/"/g, '""')}"`;
          })
          .join(",")
      ),
    ].join("\n");

    return new Response(csvContent, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/csv;charset=utf-8",
        "Content-Disposition": `attachment; filename="${type}_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Erro ao exportar dados",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

