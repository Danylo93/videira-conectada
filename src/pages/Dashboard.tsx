import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import FancyLoader from "@/components/FancyLoader";
import { useStatistics } from "@/hooks/useStatistics";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  FileText,
  Calendar,
  TrendingUp,
  GraduationCap,
  Church,
  Grape,
  Plus,
  type LucideIcon,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Brush,
} from "recharts";

/* -------- utils -------- */
const roleGreetings = {
  pastor: "Pastor",
  obreiro: "Obreiro",
  discipulador: "Discipulador",
  lider: "Líder",
} as const;

function formatBRLong(d: Date) {
  return d.toLocaleDateString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
function monthKeyOf(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
const labelMonth = (key: string) => {
  const [y, m] = key.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
};
/* ----------------------- */

type EventItem = { id: string; title: string; date: string };

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: statistics, loading: statsLoading } = useStatistics();

  const [loading, setLoading] = useState(true);

  // pendências / eventos
  const [pendingReports, setPendingReports] = useState(0);
  const [events, setEvents] = useState<EventItem[]>([]);

  // gráfico (apenas mensal)
  const [monthlyRows, setMonthlyRows] = useState<
    { name: string; members: number; visitors: number; total: number }[]
  >([]);

  const isLeader = user?.role === "lider";
  const isDiscipulador = user?.role === "discipulador";
  const isPastor = user?.role === "pastor";

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);

      /* ---- PENDÊNCIAS ---- (não para pastor) */
      if (!isPastor) {
        if (isLeader) {
          const { count } = await supabase
            .from("cell_reports")
            .select("id", { count: "exact", head: true })
            .eq("lider_id", user.id)
            .eq("status", "needs_correction");
          setPendingReports(count ?? 0);
        } else {
          let query = supabase
            .from("cell_reports")
            .select("id", { count: "exact", head: true })
            .eq("status", "submitted");
          if (isDiscipulador) {
            const { data: leaderIds } = await supabase
              .from("profiles")
              .select("id")
              .eq("role", "lider")
              .eq("discipulador_uuid", user.id);
            const ids = (leaderIds ?? []).map((l: { id: string }) => l.id);
            query = ids.length ? query.in("lider_id", ids) : query.eq("lider_id", "");
          }
          const { count } = await query;
          setPendingReports(count ?? 0);
        }
      }

      /* ---- EVENTOS ---- */
      const { data: ev } = await supabase
        .from("events")
        .select("id,name,event_date")
        .gte("event_date", new Date().toISOString())
        .eq("active", true)
        .order("event_date", { ascending: true })
        .limit(2);
      type EventRow = { id: string | number; name?: string | null; event_date: string };
      setEvents(
        ((ev as EventRow[] | null) ?? []).map((e) => ({ id: String(e.id), title: e.name ?? "Evento", date: e.event_date }))
      );

      /* ---- CRESCIMENTO + MENSAL ---- */
      const now = new Date();
      const yearStart = new Date(now.getFullYear(), 0, 1);
      const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

      let reportsQuery = supabase
        .from("cell_reports")
        .select("members_present,visitors_present,week_start,lider_id")
        .gte("week_start", yearStart.toISOString())
        .lte("week_start", yearEnd.toISOString());

      if (isLeader) {
        reportsQuery = reportsQuery.eq("lider_id", user.id);
      } else if (isDiscipulador) {
        const { data: leaderIds } = await supabase
          .from("profiles")
          .select("id")
          .eq("role", "lider")
          .eq("discipulador_uuid", user.id);
        const ids = (leaderIds ?? []).map((l: { id: string }) => l.id);
        reportsQuery = ids.length ? reportsQuery.in("lider_id", ids) : reportsQuery.eq("lider_id", "");
      }

      const { data: yearReports } = await reportsQuery;

      const monthly = new Map<string, { members: number; visitors: number; total: number }>();
      type ReportRow = {
        week_start: string;
        members_present: string[] | null;
        visitors_present: string[] | null;
      };

      ((yearReports as ReportRow[] | null) ?? []).forEach((r) => {
        const d = new Date(r.week_start);
        const key = monthKeyOf(d);
        const m = Array.isArray(r.members_present) ? r.members_present.length : 0;
        const v = Array.isArray(r.visitors_present) ? r.visitors_present.length : 0;
        const sum = m + v;
        monthly.set(key, {
          members: (monthly.get(key)?.members ?? 0) + m,
          visitors: (monthly.get(key)?.visitors ?? 0) + v,
          total: (monthly.get(key)?.total ?? 0) + sum,
        });
      });

      // Dados mensais para o gráfico (usando dados das estatísticas)
      // As variáveis de crescimento agora vêm do hook useStatistics

      const rows = Array.from(monthly.entries())
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([key, v]) => ({ name: labelMonth(key), ...v }));
      setMonthlyRows(rows);

      setLoading(false);
    })();
  }, [user, isLeader, isDiscipulador, isPastor]);

  const greeting = roleGreetings[user?.role as keyof typeof roleGreetings] ?? "Usuário";

  // grid: todos os cards na MESMA LINHA no desktop; empilha no mobile
  const gridColsDesktop = isPastor ? "xl:grid-cols-5" : "xl:grid-cols-4";

  // KPI primário (título + valor + subtítulo) compacto
  const KpiCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: LucideIcon;
  }) => (
    <Card className="hover:grape-glow transition-smooth">
      <CardHeader className="pb-1 flex flex-row items-center justify-between">
        <CardTitle className="text-xs font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-xl font-semibold text-primary">{loading ? "…" : value}</div>
        {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
      </CardContent>
    </Card>
  );

  if (!user) return null;

  if (loading) {
    return (
      <FancyLoader
        message="Preparando o panorama da sua rede"
        tips={[
          "Organizando as tábuas dos relatórios como Moisés na montanha…",
          "Contando ovelhas uma a uma pra não fugir nenhuma…",
          "Afiando a espada de Gideão contra os atrasos de dados…",
        ]}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Saudação */}
      <div className="gradient-primary rounded-xl p-6 md:p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 md:gap-4 mb-2 md:mb-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-full flex items-center justify-center grape-bounce">
              <Grape className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                Bem-vindo, {greeting} {user.name.split(" ")[0]}!
              </h1>
              <p className="text-white/80 text-sm md:text-base">{formatBRLong(new Date())}</p>
            </div>
          </div>
        </div>
        <div className="absolute top-3 right-3 md:top-4 md:right-4 opacity-20">
          <Church className="w-16 h-16 md:w-24 md:h-24" />
        </div>
      </div>

      {/* KPIs – compactos, mesma linha no desktop */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 ${gridColsDesktop} gap-4`}>
        {isPastor ? (
          <>
            <KpiCard title="Discipuladores" value={statistics?.totalDiscipuladores || 0} icon={Users} subtitle="Total na igreja" />
            <KpiCard title="Líderes" value={statistics?.totalLeaders || 0} icon={Users} subtitle="Total na igreja" />
            <KpiCard title="Membros" value={statistics?.totalMembers || 0} icon={Users} subtitle="Ativos cadastrados" />
          </>
        ) : (
          <KpiCard
            title={isLeader ? "Quantidade de pessoas da Célula" : isDiscipulador ? "Líderes da Rede" : "Total de Líderes"}
            value={isLeader ? (statistics?.totalMembers || 0) : (statistics?.totalLeaders || 0)}
            icon={Users}
            subtitle={
              isLeader ? `Membros: ${statistics?.totalMembers || 0} · Frequentadores: ${statistics?.totalFrequentadores || 0}` :
              isDiscipulador ? "Na sua rede" : "Na igreja"
            }
          />
        )}

        {!isPastor && (
          <KpiCard
            title="Relatórios Pendentes"
            value={pendingReports}
            icon={FileText}
            subtitle={isLeader ? "A corrigir" : "Para aprovação"}
          />
        )}

        <KpiCard title="Próximos Eventos" value={events.length} icon={Calendar} subtitle="Neste mês" />

        <Card className="hover:grape-glow transition-smooth">
          <CardHeader className="pb-1 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium">Crescimento</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div
              className={`text-xl font-semibold ${
                statistics?.growthRate === null || statistics?.growthRate === undefined
                  ? "text-muted-foreground"
                  : statistics.growthRate >= 0
                  ? "text-success"
                  : "text-destructive"
              }`}
            >
              {loading || statsLoading ? "…" : statistics?.growthRate === null || statistics?.growthRate === undefined ? "—" : `${statistics.growthRate >= 0 ? "+" : ""}${Math.round(statistics.growthRate)}%`}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {statistics?.growthRate === null || statistics?.growthRate === undefined ? "Sem dados do período anterior" : `Presença média: ${statistics?.averagePresence || 0} pessoas`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico mensal apenas */}
      <Card className="hover:grape-glow transition-smooth">
        <CardHeader className="pb-2">
          <CardTitle>Resumo Mensal de Presenças</CardTitle>
        </CardHeader>
        <CardContent className="h-[280px] md:h-[320px]">
          {!statistics?.monthlyData || statistics.monthlyData.length === 0 ? (
            <p className="text-center text-muted-foreground">Sem dados para exibir.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={statistics.monthlyData.map(month => ({
                name: `${month.month} ${month.year}`,
                members: month.averageMembers,
                frequentadores: month.averageFrequentadores,
                total: month.averageTotal,
              }))}>
                <defs>
                  <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.06} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="total"
                  name="Total (média)"
                  fill="url(#gradTotal)"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  isAnimationActive
                />
                <Line
                  type="monotone"
                  dataKey="members"
                  name="Membros (média)"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  dot
                  isAnimationActive
                />
                <Line
                  type="monotone"
                  dataKey="frequentadores"
                  name="Frequentadores (média)"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot
                  isAnimationActive
                />
                <Brush height={20} stroke="var(--primary)" travellerWidth={10} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Ações + Eventos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLeader && (
              <>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => navigate("/relatorios", { state: { openCreate: true } })}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Relatório de Célula
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => navigate("/celula", { state: { openCreateMember: true } })}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Adicionar Membro
                </Button>
              </>
            )}
            {!isLeader && (
              <>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => navigate("/eventos", { state: { openCreate: true } })}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Criar Evento
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/relatorios")}>
                  <FileText className="w-4 h-4 mr-2" />
                  Ver Relatórios
                </Button>
              </>
            )}
            <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/cursos")}>
              <GraduationCap className="w-4 h-4 mr-2" />
              Inscrições em Cursos
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Próximos Eventos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {events.length === 0 && <p className="text-muted-foreground">Sem eventos futuros.</p>}
            {events.map((e, idx) => (
              <div key={e.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <div className={`w-2 h-8 rounded-full ${idx % 2 === 0 ? "bg-primary" : "bg-accent"}`} />
                <div className="flex-1">
                  <h4 className="font-medium">{e.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {new Date(e.date).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full" onClick={() => navigate("/eventos")}>
              Ver Todos os Eventos
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
