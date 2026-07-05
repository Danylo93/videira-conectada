import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, PhoneCall, CalendarClock, TrendingDown, TrendingUp, CheckCircle2 } from "lucide-react";
import {
  buildLeaderInsights,
  type LeaderInsight,
  type InsightKind,
} from "@/lib/leaderInsights";

const KIND_STYLE: Record<InsightKind, { icon: typeof Sparkles; tone: string }> = {
  "absent-member": { icon: PhoneCall, tone: "bg-amber-500/10 text-amber-600" },
  "missing-report": { icon: CalendarClock, tone: "bg-blue-500/10 text-blue-600" },
  "trend-down": { icon: TrendingDown, tone: "bg-red-500/10 text-red-600" },
  "trend-up": { icon: TrendingUp, tone: "bg-green-500/10 text-green-600" },
  "all-good": { icon: CheckCircle2, tone: "bg-green-500/10 text-green-600" },
};

/**
 * Assistente da Célula: analisa os últimos relatórios e orienta o líder
 * (irmãos com faltas seguidas, relatório em aberto, tendência de presença).
 */
export function LeaderAssistantCard({ liderId }: { liderId: string }) {
  const navigate = useNavigate();
  const [insights, setInsights] = useState<LeaderInsight[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [{ data: members }, { data: reports }] = await Promise.all([
          supabase
            .from("members")
            .select("id, name, type")
            .eq("lider_id", liderId)
            .eq("active", true),
          supabase
            .from("cell_reports")
            .select("week_start, members_present, visitors_present")
            .eq("lider_id", liderId)
            .order("week_start", { ascending: false })
            .limit(8),
        ]);

        if (cancelled) return;

        setInsights(
          buildLeaderInsights({
            members: (members ?? []).map((m) => ({
              id: m.id,
              name: m.name,
              type: (m.type as "member" | "frequentador") ?? "member",
            })),
            reports: (reports ?? []).map((r) => ({
              weekStart: r.week_start,
              presentIds: [
                ...(Array.isArray(r.members_present) ? r.members_present : []),
                ...(Array.isArray(r.visitors_present) ? r.visitors_present : []),
              ],
            })),
          }),
        );
      } catch (error) {
        console.error("Erro ao montar insights do líder:", error);
        if (!cancelled) setInsights([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [liderId]);

  if (!insights || insights.length === 0) return null;

  const hasOpenReport = insights.some((i) => i.kind === "missing-report");

  return (
    <Card className="border-l-4 border-l-primary animate-fade-up">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Sparkles className="w-5 h-5 text-primary" />
          Assistente da Célula
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight, i) => {
          const { icon: Icon, tone } = KIND_STYLE[insight.kind];
          return (
            <div key={`${insight.kind}-${i}`} className="flex items-start gap-3">
              <span className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${tone}`}>
                <Icon className="h-4 w-4" />
              </span>
              <p className="text-sm leading-relaxed pt-1">{insight.message}</p>
            </div>
          );
        })}
        {hasOpenReport && (
          <Button
            size="sm"
            className="w-full sm:w-auto min-h-[44px] gradient-primary"
            onClick={() => navigate("/relatorios")}
          >
            Preencher relatório da semana
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
