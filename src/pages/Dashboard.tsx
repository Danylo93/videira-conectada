import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfileMode, type ProfileMode } from "@/contexts/ProfileModeContext";
import { applyProfileScope } from "@/lib/profileScope";
import { supabase } from "@/integrations/supabase/client";
import { eventsService } from "@/integrations/supabase/events";
import FancyLoader from "@/components/FancyLoader";
import { LeaderAssistantCard } from "@/components/dashboard/LeaderAssistantCard";
import { CellsEvolutionChart } from "@/components/dashboard/CellsEvolutionChart";
import { profilesService } from "@/integrations/supabase/profiles";
import type { SeriesLeader } from "@/lib/cellSeries";
import { computeMonthlyTrend, latestMonthAttendanceRate } from "@/lib/monthlyTrend";
import { computeMonthOverdueWeeks } from "@/lib/overdueReports";
import { useStatistics } from "@/hooks/useStatistics";
import type { Event } from "@/types/event";
import { formatDateBR, formatDateBRLong, formatDateShort, formatDateMedium } from "@/lib/dateUtils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  FileText,
  Calendar,
  TrendingUp,
  GraduationCap,
  Church,
  Plus,
  AlertTriangle,
  Target,
  Clock,
  Award,
  Activity,
  CheckCircle,
  XCircle,
  type LucideIcon,
  Grape,
  Flame,
} from "lucide-react";
import logoVideira from "@/assets/logo-videira.png";
import logoRl from "@/assets/logo-rl.jpg";
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
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

/* -------- utils -------- */
const roleGreetings = {
  pastor: "Pastor",
  obreiro: "Obreiro",
  discipulador: "Discipulador",
  lider: "Líder",
} as const;

function formatBRLong(d: Date | string) {
  return formatDateBRLong(d);
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

// Componente de Calendário Mensal
const MonthCalendar = ({ events }: { events: Event[] }) => {
  const now = new Date();
  // Usar métodos locais para o mês atual (não UTC, pois queremos o mês local)
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay(); // 0 = Domingo, 1 = Segunda, etc.

  // Criar array de dias do mês
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Mapear eventos por dia (usar UTC para consistência com formatDateShort)
  const eventsByDay = new Map<number, Event[]>();
  events.forEach((event) => {
    const eventDate = new Date(event.event_date);
    // Usar métodos UTC para extrair dia, mês e ano (mesma lógica de formatDateShort)
    const eventYear = eventDate.getUTCFullYear();
    const eventMonth = eventDate.getUTCMonth();
    const eventDay = eventDate.getUTCDate();
    
    // Comparar com o mês atual (usar UTC também para consistência)
    const currentYearUTC = now.getUTCFullYear();
    const currentMonthUTC = now.getUTCMonth();
    
    if (eventMonth === currentMonthUTC && eventYear === currentYearUTC) {
      if (!eventsByDay.has(eventDay)) {
        eventsByDay.set(eventDay, []);
      }
      eventsByDay.get(eventDay)!.push(event);
    }
  });

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="w-full">
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {/* Espaços vazios antes do primeiro dia */}
        {Array.from({ length: startingDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}
        {/* Dias do mês */}
        {days.map((day) => {
          const dayEvents = eventsByDay.get(day) || [];
          const isToday = day === now.getDate() && currentMonth === now.getMonth() && currentYear === now.getFullYear();
          
          return (
            <div
              key={day}
              className={`aspect-square border rounded-md p-0.5 flex flex-col items-center justify-start ${
                isToday
                  ? 'bg-primary text-primary-foreground border-primary'
                  : dayEvents.length > 0
                  ? 'bg-primary/10 border-primary/30 hover:bg-primary/20'
                  : 'bg-muted/30 hover:bg-muted/50 border-border'
              } transition-colors`}
            >
              <span className={`text-[10px] font-medium ${isToday ? 'text-primary-foreground' : 'text-foreground'}`}>
                {day}
              </span>
              {dayEvents.length > 0 && (
                <div className="flex flex-wrap gap-0.5 mt-0.5 justify-center w-full">
                  {dayEvents.slice(0, 3).map((event, idx) => (
                    <div
                      key={event.id}
                      className={`w-1.5 h-1.5 rounded-full ${
                        isToday ? 'bg-primary-foreground' : 'bg-primary'
                      }`}
                      title={event.name}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <span className={`text-[7px] ${isToday ? 'text-primary-foreground' : 'text-primary'}`}>
                      +{dayEvents.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {events.length > 0 && (
        <div className="mt-3 space-y-1.5">
          <p className="text-xs font-semibold text-foreground">Eventos do Mês:</p>
          <div className="space-y-1 max-h-[120px] overflow-y-auto">
            {events.slice(0, 4).map((event) => {
              const eventDate = new Date(event.event_date);
              return (
                <div key={event.id} className="flex items-center gap-2 text-xs p-1.5 bg-primary/5 rounded border border-primary/20 hover:bg-primary/10 transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                  <span className="font-medium text-foreground truncate">{event.name}</span>
                  <span className="text-muted-foreground ml-auto text-[10px] flex-shrink-0">
                    {formatDateShort(event.event_date)}
                  </span>
                </div>
              );
            })}
            {events.length > 4 && (
              <p className="text-[10px] text-muted-foreground text-center pt-1">
                +{events.length - 4} evento(s) adicional(is)
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};


export function Dashboard() {
  const { user } = useAuth();
  const { mode } = useProfileMode();
  const navigate = useNavigate();
  const { data: statistics, loading: statsLoading } = useStatistics();

  const [loading, setLoading] = useState(true);

  // Período do gráfico de frequência das células
  const [chartPeriod, setChartPeriod] = useState<"semanal" | "mensal">("semanal");

  // Variação real da presença média: último mês vs mês anterior
  const monthlyTrend = useMemo(
    () => computeMonthlyTrend(statistics?.monthlyData ?? []),
    [statistics],
  );

  // Células para os gráficos por líder:
  // discipulador → seus líderes; pastor/obreiro → todas, agrupadas por discipulador
  const [networkLeaders, setNetworkLeaders] = useState<SeriesLeader[]>([]);
  const [cellGroups, setCellGroups] = useState<
    Array<{ id: string; name: string; leaders: SeriesLeader[] }>
  >([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      try {
        if (user.role === "discipulador") {
          const leaders = await profilesService.getLeaders(user, mode);
          if (!cancelled) {
            setNetworkLeaders(leaders.map((l) => ({ id: l.id, name: l.name })));
          }
        } else if (user.role === "pastor") {
          const [discipuladores, allLeaders] = await Promise.all([
            profilesService.getDiscipuladores(user, mode),
            profilesService.getLeaders(user, mode),
          ]);
          if (cancelled) return;
          const groups = discipuladores
            .map((d) => ({
              id: d.id,
              name: d.name,
              leaders: allLeaders
                .filter((l) => l.discipulador_uuid === d.id)
                .map((l) => ({ id: l.id, name: l.name })),
            }))
            .filter((g) => g.leaders.length > 0);
          setCellGroups(groups);
        }
      } catch (error) {
        console.error("Erro ao carregar células para os gráficos:", error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, mode]);

  // Linhas do gráfico: semanal agrega os relatórios por semana; mensal usa as médias
  const chartRows = useMemo(() => {
    if (chartPeriod === "mensal") {
      return (statistics?.monthlyData ?? []).map((month) => ({
        name: `${month.month} ${month.year}`,
        members: month.averageMembers,
        frequentadores: month.averageFrequentadores,
        total: month.averageTotal,
      }));
    }
    const byWeek = new Map<string, { members: number; frequentadores: number; total: number }>();
    for (const w of statistics?.weeklyData ?? []) {
      const cur = byWeek.get(w.weekStart) ?? { members: 0, frequentadores: 0, total: 0 };
      byWeek.set(w.weekStart, {
        members: cur.members + w.members,
        frequentadores: cur.frequentadores + w.frequentadores,
        total: cur.total + w.total,
      });
    }
    return Array.from(byWeek.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .slice(-12)
      .map(([weekStart, v]) => ({ name: formatDateShort(weekStart), ...v }));
  }, [chartPeriod, statistics]);

  // pendências / eventos
  const [pendingReports, setPendingReports] = useState(0);
  const [events, setEvents] = useState<EventItem[]>([]);
  
  // Novos dados para dashboard melhorado (modo normal)
  const [serviceReportsData, setServiceReportsData] = useState<{
    total: number;
    thisMonth: number;
    lastMonth: number;
    averageAttendance: number;
    recentReports: Array<{ date: string; attendance: number }>;
  } | null>(null);
  
  const [cellReportsData, setCellReportsData] = useState<{
    total: number;
    thisMonth: number;
    submitted: number;
    pending: number;
    recentReports: Array<{ weekStart: string; status: string }>;
  } | null>(null);
  
  const [monthEvents, setMonthEvents] = useState<Event[]>([]);

  // Novos dados para métricas avançadas
  const [alerts, setAlerts] = useState<Array<{
    id: string;
    type: 'warning' | 'error' | 'info' | 'success';
    title: string;
    message: string;
    action?: string;
  }>>([]);
  
  const [performanceMetrics, setPerformanceMetrics] = useState<{
    attendanceRate: number;
    attendanceWeeks: number;
    reportCompliance: number;
    growthTarget: number;
    currentGrowth: number;
  } | null>(null);

  const [recentActivity, setRecentActivity] = useState<Array<{
    id: string;
    type: 'report' | 'member' | 'event' | 'course';
    title: string;
    date: string;
    status: 'completed' | 'pending' | 'overdue';
  }>>([]);

  const isLeader = user?.role === "lider";
  const isDiscipulador = user?.role === "discipulador";
  const isPastor = user?.role === "pastor";
  const isKidsMode = mode === 'kids';
  const isRadicaisMode = mode === 'radicais';

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
            let leaderQuery = supabase
              .from("profiles")
              .select("id")
              .eq("role", "lider")
              .eq("discipulador_uuid", user.id);

            leaderQuery = applyProfileScope(leaderQuery, mode);

            const { data: leaderIds } = await leaderQuery;
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

      /* ---- ALERTAS E NOTIFICAÇÕES ---- */
      const newAlerts: Array<{
        id: string;
        type: 'warning' | 'error' | 'info' | 'success';
        title: string;
        message: string;
        action?: string;
      }> = [];

      // Relatório em atraso: semanas do mês já fechadas (domingo passou) sem relatório
      const today = new Date();

      if (isLeader) {
        // Busca os relatórios desde a semana que abre o mês (segunda que contém o dia 1º)
        const monthWindowStart = new Date(today.getFullYear(), today.getMonth(), 1);
        monthWindowStart.setDate(monthWindowStart.getDate() - 7);

        const { data: monthReports } = await supabase
          .from("cell_reports")
          .select("week_start")
          .eq("lider_id", user.id)
          .gte("week_start", monthWindowStart.toISOString());

        const missingWeeks = computeMonthOverdueWeeks(
          (monthReports ?? []).map((r) => r.week_start),
          today,
        );

        if (missingWeeks.length > 0) {
          newAlerts.push({
            id: "overdue-report",
            type: "warning",
            title: "Relatório em Atraso",
            message:
              missingWeeks.length === 1
                ? `A semana de ${formatDateBR(missingWeeks[0])} está sem relatório.`
                : `${missingWeeks.length} semanas deste mês estão sem relatório (desde ${formatDateBR(missingWeeks[0])}).`,
            action: "Ver Relatórios"
          });
        }
      }

      // Verificar novos membros sem presença
      if (isLeader) {
        const { data: inactiveMembers } = await supabase
          .from("members")
          .select("id, name, last_presence")
          .eq("lider_id", user.id)
          .eq("active", true)
          .is("last_presence", null)
          .limit(3);

        if (inactiveMembers && inactiveMembers.length > 0) {
          newAlerts.push({
            id: "inactive-members",
            type: "info",
            title: "Membros Sem Presença",
            message: `${inactiveMembers.length} membro(s) ainda não tiveram presença registrada`,
            action: "Gerenciar Célula"
          });
        }
      }

      setAlerts(newAlerts);

      /* ---- MÉTRICAS DE PERFORMANCE ---- */
      if (statistics) {
        // Taxa de presença MENSAL: presentes ÷ base cadastrada (membros +
        // frequentadores), limitada a 100% — modelo presentes/esperados.
        const rosterSize = (statistics.totalMembers ?? 0) + (statistics.totalFrequentadores ?? 0);
        const attendanceRate = latestMonthAttendanceRate(statistics.monthlyData ?? [], rosterSize);
        const lastMonthData = (statistics.monthlyData ?? [])[(statistics.monthlyData ?? []).length - 1];
        const attendanceWeeks = lastMonthData?.weeks ?? 0;
        
        // Calcular compliance real baseado em relatórios
        let reportCompliance = 0;
        if (isPastor) {
          // Buscar líderes do modo correto
          let leadersQuery = supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .eq("role", "lider");

          leadersQuery = applyProfileScope(leadersQuery, mode);

          const { count: totalLeaders } = await leadersQuery;
          
          if (totalLeaders && totalLeaders > 0) {
            // Calcular semanas do ano até agora
            const now = new Date();
            const yearStart = new Date(now.getFullYear(), 0, 1);
            const weeksElapsed = Math.ceil((now.getTime() - yearStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
            const expectedReports = totalLeaders * weeksElapsed;
            
            // Contar relatórios enviados/aprovados do modo correto
            const { data: leaderIdsData } = await applyProfileScope(
              supabase.from("profiles").select("id").eq("role", "lider"),
              mode,
            );
            
            const leaderIds = (leaderIdsData ?? []).map((l: { id: string }) => l.id);
            
            const { count: submittedReports } = await (leaderIds.length > 0
              ? supabase
                  .from("cell_reports")
                  .select("id", { count: "exact", head: true })
                  .in("lider_id", leaderIds)
                  .gte("week_start", yearStart.toISOString())
                  .in("status", ["submitted", "approved"])
              : { count: 0 });
            
            reportCompliance = expectedReports > 0 
              ? Math.round(((submittedReports ?? 0) / expectedReports) * 100)
              : 100;
          } else {
            reportCompliance = 100; // Sem líderes = 100% de compliance
          }
        } else if (isDiscipulador) {
          // Buscar líderes do discipulador do modo correto
          let leaderQuery = supabase
            .from("profiles")
            .select("id")
            .eq("role", "lider")
            .eq("discipulador_uuid", user.id);

          leaderQuery = applyProfileScope(leaderQuery, mode);

          const { data: leaderIdsData } = await leaderQuery;
          const leaderIds = (leaderIdsData ?? []).map((l: { id: string }) => l.id);
          
          if (leaderIds.length > 0) {
            const now = new Date();
            const yearStart = new Date(now.getFullYear(), 0, 1);
            const weeksElapsed = Math.ceil((now.getTime() - yearStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
            const expectedReports = leaderIds.length * weeksElapsed;
            
            const { count: submittedReports } = await supabase
              .from("cell_reports")
              .select("id", { count: "exact", head: true })
              .in("lider_id", leaderIds)
              .gte("week_start", yearStart.toISOString())
              .in("status", ["submitted", "approved"]);
            
            reportCompliance = expectedReports > 0 
              ? Math.round(((submittedReports ?? 0) / expectedReports) * 100)
              : 100;
          } else {
            reportCompliance = 100;
          }
        } else if (isLeader) {
          const now = new Date();
          const yearStart = new Date(now.getFullYear(), 0, 1);
          const weeksElapsed = Math.ceil((now.getTime() - yearStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
          const expectedReports = weeksElapsed;
          
          const { count: submittedReports } = await supabase
            .from("cell_reports")
            .select("id", { count: "exact", head: true })
            .eq("lider_id", user.id)
            .gte("week_start", yearStart.toISOString())
            .in("status", ["submitted", "approved"]);
          
          reportCompliance = expectedReports > 0 
            ? Math.round(((submittedReports ?? 0) / expectedReports) * 100)
            : 100;
        } else {
          reportCompliance = 100;
        }
        
        // Limitar entre 0 e 100
        reportCompliance = Math.max(0, Math.min(100, reportCompliance));
        
        setPerformanceMetrics({
          attendanceRate,
          attendanceWeeks,
          reportCompliance,
          growthTarget: isPastor ? 20 : isDiscipulador ? 15 : 10,
          // Crescimento do mês: presença média do mês atual vs mês anterior
          currentGrowth: computeMonthlyTrend(statistics.monthlyData ?? []) ?? 0,
        });
      }

      /* ---- ATIVIDADE RECENTE ---- */
      const activity: Array<{
        id: string;
        type: 'report' | 'member' | 'event' | 'course';
        title: string;
        date: string;
        status: 'completed' | 'pending' | 'overdue';
      }> = [];

      // Últimos relatórios
      if (isLeader) {
        const { data: recentReports } = await supabase
          .from("cell_reports")
          .select("week_start, status")
          .eq("lider_id", user.id)
          .order("week_start", { ascending: false })
          .limit(3);

        if (recentReports) {
          recentReports.forEach((report, index) => {
            activity.push({
              id: `report-${report.week_start}`,
              type: 'report',
              title: `Relatório da semana ${formatDateBR(report.week_start)}`,
              date: report.week_start,
              status: report.status === 'approved' ? 'completed' : report.status === 'needs_correction' ? 'overdue' : 'pending'
            });
          });
        }
      }

      setRecentActivity(activity);

      /* ---- DADOS PARA DASHBOARD MELHORADO (MODO NORMAL - PASTOR) ---- */
      if (isPastor && !isKidsMode) {
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

        // Carregar dados de Service Reports (Cultos)
        const { data: allServiceReports } = await (supabase as any)
          .from("service_attendance_reports")
          .select("service_date, total_attendance, members_present, visitors_present")
          .order("service_date", { ascending: false });

        if (allServiceReports) {
          const total = allServiceReports.length;
          const thisMonth = allServiceReports.filter((r: any) => {
            const date = new Date(r.service_date);
            return date >= currentMonthStart && date <= currentMonthEnd;
          }).length;
          const lastMonth = allServiceReports.filter((r: any) => {
            const date = new Date(r.service_date);
            return date >= lastMonthStart && date <= lastMonthEnd;
          }).length;

          // Calcular média de presença
          const attendances = allServiceReports.map((r: any) => {
            if (r.total_attendance) return r.total_attendance;
            const members = Array.isArray(r.members_present) ? r.members_present.length : 0;
            const visitors = Array.isArray(r.visitors_present) ? r.visitors_present.length : 0;
            return members + visitors;
          });
          const averageAttendance = attendances.length > 0
            ? Math.round(attendances.reduce((a: number, b: number) => a + b, 0) / attendances.length)
            : 0;

          // Últimos 5 relatórios
          const recentReports = allServiceReports.slice(0, 5).map((r: any) => {
            const attendance = r.total_attendance || 
              ((Array.isArray(r.members_present) ? r.members_present.length : 0) +
               (Array.isArray(r.visitors_present) ? r.visitors_present.length : 0));
            return {
              date: r.service_date,
              attendance
            };
          });

          setServiceReportsData({
            total,
            thisMonth,
            lastMonth,
            averageAttendance,
            recentReports
          });
        }

        // Carregar dados de Cell Reports (sem status, apenas contagem)
        const { data: allCellReports } = await supabase
          .from("cell_reports")
          .select("week_start")
          .order("week_start", { ascending: false });

        if (allCellReports) {
          const total = allCellReports.length;
          const thisMonth = allCellReports.filter((r: any) => {
            const date = new Date(r.week_start);
            return date >= currentMonthStart && date <= currentMonthEnd;
          }).length;

          const recentReports = allCellReports.slice(0, 5).map((r: any) => ({
            weekStart: r.week_start,
            status: 'completed' // Status genérico, não usamos mais draft/submitted
          }));

          setCellReportsData({
            total,
            thisMonth,
            submitted: total, // Todos os relatórios são considerados enviados
            pending: 0, // Não há mais pendentes
            recentReports
          });
        }

        // Carregar eventos do mês atual (usar UTC para consistência)
        try {
          const allEvents = await eventsService.getEvents();
          const currentMonthEvents = allEvents.filter((event) => {
            const eventDate = new Date(event.event_date);
            // Usar métodos UTC para comparar (mesma lógica de formatDateShort)
            const eventYear = eventDate.getUTCFullYear();
            const eventMonth = eventDate.getUTCMonth();
            const currentYearUTC = now.getUTCFullYear();
            const currentMonthUTC = now.getUTCMonth();
            return eventYear === currentYearUTC && eventMonth === currentMonthUTC;
          });
          setMonthEvents(currentMonthEvents);
        } catch (error) {
          console.error("Erro ao carregar eventos:", error);
        }
      }

      setLoading(false);
    })();
  }, [user, mode, isLeader, isDiscipulador, isPastor, statistics]);

  // (isKidsMode e isRadicaisMode já declarados acima do useEffect)
  const greeting = isKidsMode && user?.role === 'pastor' 
    ? 'Pastora' 
    : (roleGreetings[user?.role as keyof typeof roleGreetings] ?? "Usuário");
  const displayName = isKidsMode && user?.role === 'pastor' 
    ? 'Tainá' 
    : (user?.name.split(" ")[0] ?? "");

  // grid: todos os cards na MESMA LINHA no desktop; empilha no mobile
  const gridColsDesktop = isPastor ? "xl:grid-cols-5" : "xl:grid-cols-4";

  // KPI primário (título + valor + subtítulo) compacto
  const KpiCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    color = "primary",
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: LucideIcon;
    trend?: { value: number; label: string };
    color?: "primary" | "success" | "warning" | "destructive";
  }) => (
    <Card className={`interactive stagger-item overflow-hidden ${isKidsMode ? 'border-pink-200' : ''}`}>
      <CardHeader className="pb-1 flex flex-row items-center justify-between">
        <CardTitle className={`text-xs font-medium tracking-wide uppercase ${isKidsMode ? 'text-pink-700' : 'text-muted-foreground'}`}>{title}</CardTitle>
        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-xl ${isKidsMode ? 'bg-pink-100 text-pink-500' : color === 'success' ? 'bg-green-500/10 text-green-600' : color === 'warning' ? 'bg-yellow-500/10 text-yellow-600' : color === 'destructive' ? 'bg-red-500/10 text-red-600' : 'bg-primary/10 text-primary'}`}>
          <Icon className="h-4 w-4" />
        </span>
      </CardHeader>
      <CardContent className="pt-0">
        <div className={`text-2xl font-display font-bold tracking-tight ${loading ? "text-muted-foreground" : isKidsMode ? 'text-pink-600' : `text-${color === 'primary' ? 'primary' : color === 'success' ? 'green-600' : color === 'warning' ? 'yellow-600' : 'red-600'}`}`}>
          {loading ? "…" : value}
        </div>
        {subtitle && <p className={`text-[11px] ${isKidsMode ? 'text-pink-600/70' : 'text-muted-foreground'} mt-0.5`}>{subtitle}</p>}
        {trend && (
          <div className="flex items-center gap-1 mt-1">
            <TrendingUp className={`h-3 w-3 ${trend.value >= 0 ? (isKidsMode ? 'text-pink-500' : 'text-green-500') : 'text-red-500'}`} />
            <span className={`text-[10px] ${trend.value >= 0 ? (isKidsMode ? 'text-pink-600' : 'text-green-600') : 'text-red-600'}`}>
              {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Card de métrica com progresso
  const MetricCard = ({
    title,
    value,
    target,
    icon: Icon,
    color = "primary",
  }: {
    title: string;
    value: number;
    target: number;
    icon: LucideIcon;
    color?: "primary" | "success" | "warning" | "destructive";
  }) => {
    const percentage = target > 0 ? Math.min((value / target) * 100, 100) : 0;
    
    return (
      <Card className={`${isKidsMode ? 'hover:shadow-lg hover:shadow-pink-100 border-pink-200' : 'hover:grape-glow'} transition-smooth`}>
        <CardHeader className="pb-2">
          <CardTitle className={`text-sm font-medium flex items-center gap-2 ${isKidsMode ? 'text-pink-700' : ''}`}>
            <Icon className={`h-4 w-4 ${isKidsMode ? 'text-pink-500' : 'text-primary'}`} />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-2xl font-bold ${isKidsMode ? 'text-pink-600' : 'text-primary'}`}>{value}</span>
            <span className={`text-sm ${isKidsMode ? 'text-pink-600/70' : 'text-muted-foreground'}`}>/ {target}</span>
          </div>
          <Progress value={percentage} className={`h-2 ${isKidsMode ? '[&>div]:bg-gradient-to-r [&>div]:from-pink-400 [&>div]:to-pink-600' : ''}`} />
          <p className={`text-xs ${isKidsMode ? 'text-pink-600/70' : 'text-muted-foreground'} mt-1`}>
            {percentage.toFixed(0)}% da meta 
          </p>
        </CardContent>
      </Card>
    );
  };

  if (!user) return null;

  if (loading || statsLoading) {
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
      <div className={`animate-scale-in ${isRadicaisMode ? 'bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600' : isKidsMode ? 'bg-gradient-to-br from-pink-400 via-pink-500 to-purple-500' : 'gradient-primary'} rounded-2xl p-4 sm:p-6 md:p-8 text-white relative overflow-hidden shadow-strong ${isKidsMode ? 'shadow-pink-200' : isRadicaisMode ? 'shadow-orange-200' : ''}`}>
        <div className="relative z-10">
          <div className="flex items-center gap-3 md:gap-4 mb-2 md:mb-4">
            <div className={`w-14 h-14 md:w-16 md:h-16 bg-white ${isKidsMode ? 'rounded-full shadow-xl' : 'rounded-full'} flex items-center justify-center ${isKidsMode ? 'shadow-pink-300' : 'shadow-lg'}`}>
              <img src={isRadicaisMode ? logoRl : logoVideira} alt={isRadicaisMode ? "Radicais Livres" : "Videira Logo"} className={`w-10 h-10 md:w-12 md:h-12 ${isRadicaisMode ? 'rounded-full object-cover' : ''}`} />
            </div>
            <div>
              <h1 className={`text-2xl md:text-3xl font-bold ${isKidsMode ? 'drop-shadow-md' : ''}`}>
                Bem-vindo, {greeting} {displayName}!
              </h1>
              <p className="text-white/80 text-sm md:text-base">{formatBRLong(new Date())}</p>
            </div>
          </div>
        </div>
        <div className={`absolute top-3 right-3 md:top-4 md:right-4 ${isKidsMode ? 'opacity-30' : 'opacity-20'}`}>
          {isRadicaisMode ? (
            <Flame className="w-16 h-16 md:w-24 md:h-24 text-white" />
          ) : isKidsMode ? (
            <Grape className="w-16 h-16 md:w-24 md:h-24 text-white" />
          ) : (
            <Church className="w-16 h-16 md:w-24 md:h-24" />
          )}
        </div>
      </div>

      {/* Alertas e Notificações */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <Card key={alert.id} className={`border-l-4 ${
              alert.type === 'warning' ? 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' :
              alert.type === 'error' ? 'border-l-red-500 bg-red-50 dark:bg-red-900/20' :
              alert.type === 'success' ? 'border-l-green-500 bg-green-50 dark:bg-green-900/20' :
              'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20'
            }`}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  {alert.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-600" />}
                  {alert.type === 'error' && <XCircle className="h-5 w-5 text-red-600" />}
                  {alert.type === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
                  {alert.type === 'info' && <Activity className="h-5 w-5 text-blue-600" />}
                  <div className="flex-1">
                    <h4 className="font-medium">{alert.title}</h4>
                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                  </div>
                  {alert.action && (
                    <Button size="sm" variant="outline">
                      {alert.action}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* KPIs Principais */}
      <div className={`stagger grid grid-cols-2 md:grid-cols-3 ${gridColsDesktop} gap-3 sm:gap-4`}>
        {isPastor ? (
          isRadicaisMode ? (
            /* Modo Radicais Livres — dados reais das células dos líderes radicais */
            <>
              <KpiCard 
                title="Discipuladores" 
                value={statistics?.totalDiscipuladores || 0} 
                icon={Users} 
                subtitle="Cadastrados no Radicais Livres"
              />
              <KpiCard 
                title="Células" 
                value={statistics?.totalLeaders || 0} 
                icon={Users} 
                subtitle="Cadastradas no Radicais Livres"
              />
              <KpiCard 
                title="Membros" 
                value={statistics?.totalMembers || 0} 
                icon={Users} 
                subtitle="Ativos nas células"
              />
              <KpiCard 
                title="Frequentadores" 
                value={statistics?.totalFrequentadores || 0} 
                icon={Users} 
                subtitle="Ativos nas células"
              />
              <KpiCard 
                title="Total" 
                value={(statistics?.totalMembers || 0) + (statistics?.totalFrequentadores || 0)}
                icon={Users}
                subtitle="Membros + Frequentadores"
                color="primary"
              />
            </>
          ) : (
          <>
            <KpiCard
              title={isKidsMode ? "Discipuladoras" : "Discipuladores"}
              value={statistics?.totalDiscipuladores || 0}
              icon={Users}
              subtitle={isKidsMode ? "Total no ministério kids" : "Total na igreja"}
            />
            <KpiCard
              title={isKidsMode ? "Células Kids" : "Células"}
              value={statistics?.totalLeaders || 0}
              icon={Users}
              subtitle={isKidsMode ? "Total no ministério kids" : "Total na igreja"}
            />
            <KpiCard
              title="Membros"
              value={statistics?.totalMembers || 0}
              icon={Users}
              subtitle="Ativos cadastrados"
            />
            <KpiCard
              title="Frequentadores"
              value={statistics?.totalFrequentadores || 0}
              icon={Users}
              subtitle="Ativos cadastrados"
            />
            
            <KpiCard 
              title={isKidsMode ? "Total Geral" : "Total"} 
              value={(statistics?.totalMembers || 0) + (statistics?.totalFrequentadores || 0)}
              icon={Users}
              subtitle="Membros + Frequentadores"
              color="primary"
            />
          </>
          )
        ) : isDiscipulador ? (
          isRadicaisMode ? (
            /* Discipulador no modo Radicais Livres — dados reais */
            <>
              <KpiCard
                title="Líderes da Rede"
                value={statistics?.totalLeaders || 0}
                icon={Users}
                subtitle="Sob sua supervisão no Radicais Livres"
              />
              <KpiCard
                title="Total de Membros"
                value={statistics?.totalMembers || 0}
                icon={Users}
                subtitle="Na rede do Radicais Livres"
              />
              <KpiCard
                title="Frequentadores"
                value={statistics?.totalFrequentadores || 0}
                icon={Users}
                subtitle="Na rede do Radicais Livres"
              />
              <KpiCard
                title="Relatórios Pendentes"
                value={pendingReports}
                icon={FileText}
                subtitle="Para aprovação"
                color={pendingReports > 5 ? "warning" : "primary"}
              />
            </>
          ) : (
          <>
            <KpiCard
              title="Líderes da Rede"
              value={statistics?.totalLeaders || 0}
              icon={Users}
              subtitle="Sob sua supervisão"
            />
            <KpiCard
              title="Total de Membros"
              value={statistics?.totalMembers || 0}
              icon={Users}
              subtitle="Em toda a rede"
            />
            <KpiCard
              title="Relatórios Pendentes"
              value={pendingReports}
              icon={FileText}
              subtitle="Para aprovação"
              color={pendingReports > 5 ? "warning" : "primary"}
            />
            <KpiCard
              title="Taxa de Presença"
              value={`${performanceMetrics?.attendanceRate || 0}%`}
              icon={Target}
              subtitle={performanceMetrics && performanceMetrics.attendanceWeeks > 0
                ? `Presentes ÷ cadastrados · ${performanceMetrics.attendanceWeeks} semana(s) no mês`
                : "Sem relatórios no mês"}
              color={performanceMetrics && performanceMetrics.attendanceRate >= 75 ? "success" : "warning"}
            />
          </>
          )
        ) : (
          isRadicaisMode ? (
            /* Líder no modo Radicais Livres — dados reais da célula */
            <>
              <KpiCard
                title="Membros da Célula"
                value={(statistics?.totalMembers || 0) + (statistics?.totalFrequentadores || 0)}
                icon={Users}
                subtitle={`Membros: ${statistics?.totalMembers || 0} · Frequentadores: ${statistics?.totalFrequentadores || 0}`}
                trend={monthlyTrend !== null ? { value: monthlyTrend, label: "presença vs mês anterior" } : undefined}
              />
              <KpiCard
                title="Relatórios Pendentes"
                value={pendingReports}
                icon={FileText}
                subtitle="A corrigir"
                color={pendingReports > 0 ? "warning" : "success"}
              />
              <KpiCard
                title="Taxa de Presença"
                value={`${performanceMetrics?.attendanceRate || 0}%`}
                icon={Target}
                subtitle={performanceMetrics && performanceMetrics.attendanceWeeks > 0
                  ? `Presentes ÷ cadastrados · ${performanceMetrics.attendanceWeeks} semana(s) no mês`
                  : "Sem relatórios no mês"}
                color={performanceMetrics && performanceMetrics.attendanceRate >= 70 ? "success" : "warning"}
              />
              <KpiCard
                title="Meta de Crescimento"
                value={`${performanceMetrics?.currentGrowth >= 0 ? '+' : ''}${Math.round(performanceMetrics?.currentGrowth || 0)}%`}
                icon={TrendingUp}
                subtitle={`Meta: ${performanceMetrics?.growthTarget || 0}%`}
                color={performanceMetrics && performanceMetrics.currentGrowth >= performanceMetrics.growthTarget ? "success" : "warning"}
              />
            </>
          ) : (
          <>
            <KpiCard
              title="Membros da Célula"
              value={statistics?.totalMembers || 0}
              icon={Users}
              subtitle={`Membros: ${statistics?.totalMembers || 0} · Frequentadores: ${statistics?.totalFrequentadores || 0}`}
              trend={monthlyTrend !== null ? { value: monthlyTrend, label: "presença vs mês anterior" } : undefined}
            />
            <KpiCard
              title="Relatórios Pendentes"
              value={pendingReports}
              icon={FileText}
              subtitle="A corrigir"
              color={pendingReports > 0 ? "warning" : "success"}
            />
            <KpiCard
              title="Taxa de Presença"
              value={`${performanceMetrics?.attendanceRate || 0}%`}
              icon={Target}
              subtitle={performanceMetrics && performanceMetrics.attendanceWeeks > 0
                ? `Presentes ÷ cadastrados · ${performanceMetrics.attendanceWeeks} semana(s) no mês`
                : "Sem relatórios no mês"}
              color={performanceMetrics && performanceMetrics.attendanceRate >= 70 ? "success" : "warning"}
            />
            <KpiCard
              title="Meta de Crescimento"
              value={`${performanceMetrics?.currentGrowth >= 0 ? '+' : ''}${Math.round(performanceMetrics?.currentGrowth || 0)}%`}
              icon={TrendingUp}
              subtitle={`Meta: ${performanceMetrics?.growthTarget || 0}%`}
              color={performanceMetrics && performanceMetrics.currentGrowth >= performanceMetrics.growthTarget ? "success" : "warning"}
            />
          </>
          )
        )}
      </div>

      {/* Assistente da Célula (orientações inteligentes para o líder) */}
      {isLeader && user && <LeaderAssistantCard liderId={user.id} />}

      {/* Gráficos e Visualizações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isRadicaisMode ? (
          /* ===== GRÁFICOS ESPECÍFICOS DO MODO RADICAIS LIVRES ===== */
          <>
            {/* Gráfico: Membros e Frequentadores por Célula (Líder) */}
            <Card className="hover:grape-glow transition-smooth lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-orange-500" />
                  Membros e Frequentadores por Célula
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[350px]">
                {(() => {
                  // Pastor/discipulador: todas as células da rede.
                  // Líder: networkData não existe — usa a própria célula
                  // (totalMembers/totalFrequentadores já são os dele).
                  const allLeaders = isLeader
                    ? [
                        {
                          name: user?.celula || "Minha célula",
                          membros: statistics?.totalMembers || 0,
                          frequentadores: statistics?.totalFrequentadores || 0,
                          total:
                            (statistics?.totalMembers || 0) +
                            (statistics?.totalFrequentadores || 0),
                        },
                      ].filter((c) => c.total > 0)
                    : (statistics?.networkData?.discipuladores ?? [])
                        .flatMap(d => d.leaders)
                        .map(l => ({
                          name: l.celula && l.celula !== 'Sem célula' ? l.celula : l.name,
                          membros: l.members,
                          frequentadores: l.frequentadores,
                          total: l.members + l.frequentadores,
                        }))
                        .sort((a, b) => b.total - a.total);

                  if (allLeaders.length === 0) {
                    return (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-center text-muted-foreground">
                          {isLeader
                            ? "Nenhum membro cadastrado na sua célula ainda."
                            : "Nenhum líder com membros cadastrados ainda."}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={allLeaders} layout="vertical" margin={{ left: 10, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis
                          dataKey="name"
                          type="category"
                          tick={{ fontSize: 12 }}
                          width={120}
                        />
                        <Tooltip
                          formatter={(value: number, name: string) => [value, name]}
                        />
                        <Legend />
                        <Bar dataKey="membros" name="Membros" fill="#f97316" radius={[0, 4, 4, 0]} stackId="a" />
                        <Bar dataKey="frequentadores" name="Frequentadores" fill="#fbbf24" radius={[0, 4, 4, 0]} stackId="a" />
                      </BarChart>
                    </ResponsiveContainer>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Gráfico: Rede por Discipulador */}
            {(statistics?.networkData?.discipuladores ?? []).length > 0 && (
              <Card className="hover:grape-glow transition-smooth">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-orange-500" />
                    Rede por Discipulador
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={(statistics?.networkData?.discipuladores ?? []).map(d => ({
                      name: d.name.split(' ')[0], // Primeiro nome
                      membros: d.totalMembers,
                      frequentadores: d.totalFrequentadores,
                      lideres: d.leaders.length,
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="membros" name="Membros" fill="#f97316" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="frequentadores" name="Frequentadores" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Distribuição Membros vs Frequentadores (Pizza) */}
            <Card className="hover:grape-glow transition-smooth">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-orange-500" />
                  Distribuição Geral
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                {!statistics ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-center text-muted-foreground">Carregando dados...</p>
                  </div>
                ) : (statistics.totalMembers + statistics.totalFrequentadores) === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-center text-muted-foreground">Sem dados para exibir.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Membros', value: statistics.totalMembers, color: '#f97316' },
                          { name: 'Frequentadores', value: statistics.totalFrequentadores, color: '#fbbf24' },
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {[
                          { color: '#f97316' },
                          { color: '#fbbf24' },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          /* ===== GRÁFICOS DO MODO NORMAL / KIDS ===== */
          <>
        {/* Evolução da frequência das células (semanal/mensal) */}
        <Card className={`${isKidsMode ? 'hover:shadow-lg hover:shadow-pink-100 border-pink-200' : 'hover:grape-glow'} transition-smooth`}>
          <CardHeader className="pb-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className={`flex items-center gap-2 ${isKidsMode ? 'text-pink-700' : ''}`}>
                <TrendingUp className={`w-5 h-5 ${isKidsMode ? 'text-pink-500' : 'text-primary'}`} />
                Frequência das Células
              </CardTitle>
              <div className="flex rounded-lg bg-muted p-1 self-start">
                {(["semanal", "mensal"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setChartPeriod(p)}
                    className={`min-h-[36px] rounded-md px-3 text-xs font-medium capitalize transition-colors ${
                      chartPeriod === p
                        ? "bg-background shadow-soft text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[260px] sm:h-[300px]">
            {(
              chartRows.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-center text-muted-foreground">Sem dados para exibir.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartRows}>
                    <defs>
                      <linearGradient id={isKidsMode ? "gradTotalKids" : "gradTotal"} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={isKidsMode ? "#ec4899" : "var(--primary)"} stopOpacity={0.4} />
                        <stop offset="100%" stopColor={isKidsMode ? "#ec4899" : "var(--primary)"} stopOpacity={0.06} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={52} interval="preserveStartEnd" />
                    <YAxis width={30} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Area
                      type="monotone"
                      dataKey="total"
                      name="Total"
                      fill={`url(#${isKidsMode ? "gradTotalKids" : "gradTotal"})`}
                      stroke={isKidsMode ? "#ec4899" : "var(--primary)"}
                      strokeWidth={2}
                      isAnimationActive
                    />
                    <Line
                      type="monotone"
                      dataKey="members"
                      name="Membros"
                      stroke={isKidsMode ? "#a855f7" : "#7c3aed"}
                      strokeWidth={2}
                      dot
                      isAnimationActive
                    />
                    <Line
                      type="monotone"
                      dataKey="frequentadores"
                      name="Frequentadores"
                      stroke={isKidsMode ? "#f472b6" : "#f59e0b"}
                      strokeWidth={2}
                      dot
                      isAnimationActive
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Distribuição */}
        <Card className={`${isKidsMode ? 'hover:shadow-lg hover:shadow-pink-100 border-pink-200' : 'hover:grape-glow'} transition-smooth`}>
          <CardHeader className="pb-2">
            <CardTitle className={`flex items-center gap-2 ${isKidsMode ? 'text-pink-700' : ''}`}>
              <Users className={`w-5 h-5 ${isKidsMode ? 'text-pink-500' : 'text-primary'}`} />
              Distribuição por Tipo
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {!statistics ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-center text-muted-foreground">Carregando dados...</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Membros', value: statistics.totalMembers, color: isKidsMode ? '#a855f7' : '#7c3aed' },
                      { name: 'Frequentadores', value: statistics.totalFrequentadores, color: isKidsMode ? '#f472b6' : '#f59e0b' },
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {[{ name: 'Membros', value: statistics.totalMembers, color: isKidsMode ? '#a855f7' : '#7c3aed' },
                      { name: 'Frequentadores', value: statistics.totalFrequentadores, color: isKidsMode ? '#f472b6' : '#f59e0b' }].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
          </>
        )}
      </div>

      {/* Evolução por célula — gráfico dos relatórios de cada líder */}
      {isLeader && user && (
        <CellsEvolutionChart
          title="Evolução da minha célula"
          subtitle="Presença semanal registrada nos seus relatórios"
          leaders={[{ id: user.id, name: user.celula || "Minha célula" }]}
        />
      )}
      {isDiscipulador && networkLeaders.length > 0 && (
        <CellsEvolutionChart
          title="Células da sua rede"
          subtitle="Uma linha por célula — presença semanal dos relatórios"
          leaders={networkLeaders}
        />
      )}
      {isPastor && cellGroups.length > 0 && (
        <div className="space-y-4 sm:space-y-6">
          <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight">
            Células por discipulador
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {cellGroups.map((g) => (
              <CellsEvolutionChart
                key={g.id}
                title={`Rede de ${g.name}`}
                subtitle={`${g.leaders.length} célula${g.leaders.length !== 1 ? "s" : ""}`}
                leaders={g.leaders}
              />
            ))}
          </div>
        </div>
      )}

      {/* Seções Especiais para Modo Normal (Pastor) */}
      {isPastor && !isKidsMode && !isRadicaisMode && (
        <div className="space-y-6">
          {/* Seção de Cultos */}
          {serviceReportsData && (
            <Card className="hover:grape-glow transition-smooth">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Church className="w-5 h-5 text-primary" />
                    Relatórios de Culto
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={() => navigate("/relatorios-culto")}>
                    Ver Todos
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-primary/5 rounded-lg">
                    <p className="text-sm text-muted-foreground">Média de Presença</p>
                    <p className="text-2xl font-bold text-primary">{serviceReportsData.averageAttendance}</p>
                    <p className="text-xs text-muted-foreground mt-1">pessoas por culto</p>
                  </div>
                  <div className="p-4 bg-primary/5 rounded-lg">
                    <p className="text-sm text-muted-foreground">Últimos 3 Cultos</p>
                    <div className="mt-2 space-y-1">
                      {serviceReportsData.recentReports.slice(0, 3).map((report, idx) => (
                        <div key={idx} className="flex justify-between text-xs">
                          <span className="text-muted-foreground">
                            {formatDateShort(report.date)}
                          </span>
                          <span className="font-medium">{report.attendance} pessoas</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {serviceReportsData.recentReports.length > 0 && (
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={serviceReportsData.recentReports.slice(0, 10).reverse()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(value) => formatDateShort(value)}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: number) => [`${value} pessoas`, 'Presença']}
                          labelFormatter={(value) => formatDateBR(value)}
                        />
                        <Bar dataKey="attendance" fill="var(--primary)" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Calendário Mensal com Eventos */}
          <Card className="hover:grape-glow transition-smooth">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="w-5 h-5 text-primary" />
                  Calendário - {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => navigate("/eventos")}>
                  Ver Agenda
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <MonthCalendar events={monthEvents} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Atividade Recente e Ações */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Atividade Recente */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhuma atividade recente.</p>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.status === 'completed' ? 'bg-green-500' :
                    activity.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateBR(activity.date)}
                    </p>
                  </div>
                  <Badge variant={activity.status === 'completed' ? 'default' : activity.status === 'pending' ? 'secondary' : 'destructive'}>
                    {activity.status === 'completed' ? 'Concluído' : activity.status === 'pending' ? 'Pendente' : 'Atrasado'}
                  </Badge>
                </div>
              ))
            )}
            <Button variant="outline" size="sm" className="w-full" onClick={() => navigate("/relatorios")}>
              Ver Toda a Atividade
            </Button>
          </CardContent>
        </Card>

        {/* Ações Rápidas */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
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
            {isDiscipulador && (
              <>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => navigate("/lideres")}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Gerenciar Líderes
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/relatorios")}>
                  <FileText className="w-4 h-4 mr-2" />
                  Aprovar Relatórios
                </Button>
              </>
            )}
            {isPastor && (
              <>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => navigate("/discipuladores")}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Gerenciar Discipuladores
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => navigate("/gerenciar")}
                >
                  <Church className="w-4 h-4 mr-2" />
                  Configurações da Igreja
                </Button>
              </>
            )}
            <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/cursos")}>
              <GraduationCap className="w-4 h-4 mr-2" />
              Ver Cursos
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => navigate("/eventos", { state: { openCreate: true } })}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Criar Evento
            </Button>
          </CardContent>
        </Card>

        {/* Próximos Eventos */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Próximos Eventos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {events.length === 0 && <p className="text-muted-foreground text-sm">Sem eventos futuros.</p>}
            {events.map((e, idx) => (
              <div key={e.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <div className={`w-2 h-8 rounded-full ${idx % 2 === 0 ? "bg-primary" : "bg-accent"}`} />
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{e.title}</h4>
                  <p className="text-xs text-muted-foreground">
                    {formatDateMedium(e.date)}
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
