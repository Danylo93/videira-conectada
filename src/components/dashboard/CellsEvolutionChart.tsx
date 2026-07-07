import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { pivotReportsByWeek, type SeriesLeader } from "@/lib/cellSeries";

const SERIES_COLORS = [
  "#7c3aed",
  "#f59e0b",
  "#0ea5e9",
  "#ef4444",
  "#10b981",
  "#ec4899",
  "#8b5cf6",
  "#f97316",
];

const WEEKS_BACK = 12;

interface Props {
  title: string;
  subtitle?: string;
  /** Células exibidas (uma linha por líder) */
  leaders: SeriesLeader[];
}

/**
 * Evolução semanal da presença de cada célula (uma linha por líder),
 * calculada dos relatórios reais (`cell_reports`) das últimas semanas.
 */
export function CellsEvolutionChart({ title, subtitle, leaders }: Props) {
  const [rows, setRows] = useState<Array<Record<string, string | number>>>([]);
  const [seriesNames, setSeriesNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const ids = leaders.map((l) => l.id);
    if (ids.length === 0) {
      setRows([]);
      setSeriesNames([]);
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const since = new Date();
        since.setDate(since.getDate() - WEEKS_BACK * 7);

        const { data } = await supabase
          .from("cell_reports")
          .select("lider_id, week_start, members_present, visitors_present")
          .in("lider_id", ids)
          .gte("week_start", since.toISOString())
          .order("week_start", { ascending: true });

        if (cancelled) return;

        const points = (data ?? []).map((r) => ({
          liderId: r.lider_id,
          weekStart: r.week_start,
          total:
            (Array.isArray(r.members_present) ? r.members_present.length : 0) +
            (Array.isArray(r.visitors_present) ? r.visitors_present.length : 0),
        }));

        const pivot = pivotReportsByWeek(points, leaders);
        setRows(pivot.rows);
        setSeriesNames(pivot.seriesNames);
      } catch (error) {
        console.error("Erro ao carregar evolução das células:", error);
        if (!cancelled) {
          setRows([]);
          setSeriesNames([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(leaders.map((l) => l.id))]);

  return (
    <Card className="animate-fade-up">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <TrendingUp className="w-5 h-5 text-primary" />
          {title}
        </CardTitle>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </CardHeader>
      <CardContent className="h-[260px] sm:h-[300px]">
        {loading ? (
          <div className="h-full w-full animate-pulse rounded-lg bg-muted" />
        ) : rows.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-center text-sm text-muted-foreground">
              Sem relatórios nas últimas {WEEKS_BACK} semanas.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis width={28} tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {seriesNames.map((name, i) => (
                <Line
                  key={name}
                  type="monotone"
                  dataKey={name}
                  stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls
                  isAnimationActive
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
