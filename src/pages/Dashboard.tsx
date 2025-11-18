import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfileMode } from "@/contexts/ProfileModeContext";
import { supabase } from "@/integrations/supabase/client";
import { eventsService } from "@/integrations/supabase/events";
import FancyLoader from "@/components/FancyLoader";
import { useStatistics } from "@/hooks/useStatistics";
import type { Event } from "@/types/event";

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
} from "lucide-react";
import logoVideira from "@/assets/logo-videira.png";
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

// Componente de Calendário Mensal
const MonthCalendar = ({ events }: { events: Event[] }) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay(); // 0 = Domingo, 1 = Segunda, etc.

  // Criar array de dias do mês
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Mapear eventos por dia
  const eventsByDay = new Map<number, Event[]>();
  events.forEach((event) => {
    const eventDate = new Date(event.event_date);
    if (eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear) {
      const day = eventDate.getDate();
      if (!eventsByDay.has(day)) {
        eventsByDay.set(day, []);
      }
      eventsByDay.get(day)!.push(event);
    }
  });

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="w-full">
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
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
              className={`aspect-square border rounded-lg p-1 flex flex-col items-center justify-start ${
                isToday
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted/50 hover:bg-muted border-border'
              } transition-colors`}
            >
              <span className={`text-xs font-medium ${isToday ? 'text-primary-foreground' : 'text-foreground'}`}>
                {day}
              </span>
              {dayEvents.length > 0 && (
                <div className="flex flex-wrap gap-0.5 mt-0.5 justify-center">
                  {dayEvents.slice(0, 2).map((event, idx) => (
                    <div
                      key={event.id}
                      className={`w-1.5 h-1.5 rounded-full ${
                        isToday ? 'bg-primary-foreground' : 'bg-primary'
                      }`}
                      title={event.name}
                    />
                  ))}
                  {dayEvents.length > 2 && (
                    <span className={`text-[8px] ${isToday ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                      +{dayEvents.length - 2}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {events.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium">Eventos do Mês:</p>
          <div className="space-y-1">
            {events.slice(0, 5).map((event) => {
              const eventDate = new Date(event.event_date);
              return (
                <div key={event.id} className="flex items-center gap-2 text-sm p-2 bg-muted rounded">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="font-medium">{event.name}</span>
                  <span className="text-muted-foreground ml-auto">
                    {eventDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
              );
            })}
            {events.length > 5 && (
              <p className="text-xs text-muted-foreground text-center">
                +{events.length - 5} evento(s) adicional(is)
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

  // gráfico (apenas mensal)
  const [monthlyRows, setMonthlyRows] = useState<
    { name: string; members: number; visitors: number; total: number }[]
  >([]);

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
            const isKidsMode = mode === 'kids';
            let leaderQuery = supabase
              .from("profiles")
              .select("id")
              .eq("role", "lider")
              .eq("discipulador_uuid", user.id);
            
            if (isKidsMode) {
              leaderQuery = leaderQuery.eq('is_kids', true);
            } else {
              leaderQuery = leaderQuery.or('is_kids.is.null,is_kids.eq.false');
            }
            
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

      // Verificar relatórios em atraso
      const today = new Date();
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      if (isLeader) {
        const { data: overdueReports } = await supabase
          .from("cell_reports")
          .select("week_start")
          .eq("lider_id", user.id)
          .lt("week_start", lastWeek.toISOString())
          .order("week_start", { ascending: false })
          .limit(1);

        if (overdueReports && overdueReports.length > 0) {
          newAlerts.push({
            id: "overdue-report",
            type: "warning",
            title: "Relatório em Atraso",
            message: `Você tem relatórios pendentes desde ${new Date(overdueReports[0].week_start).toLocaleDateString('pt-BR')}`,
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
        const attendanceRate = statistics.totalMembers > 0 
          ? Math.round((statistics.averagePresence / statistics.totalMembers) * 100)
          : 0;
        
        // Calcular compliance real baseado em relatórios
        let reportCompliance = 0;
        if (isPastor) {
          const isKidsMode = mode === 'kids';
          // Buscar líderes do modo correto
          let leadersQuery = supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .eq("role", "lider");
          
          if (isKidsMode) {
            leadersQuery = leadersQuery.eq('is_kids', true);
          } else {
            leadersQuery = leadersQuery.or('is_kids.is.null,is_kids.eq.false');
          }
          
          const { count: totalLeaders } = await leadersQuery;
          
          if (totalLeaders && totalLeaders > 0) {
            // Calcular semanas do ano até agora
            const now = new Date();
            const yearStart = new Date(now.getFullYear(), 0, 1);
            const weeksElapsed = Math.ceil((now.getTime() - yearStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
            const expectedReports = totalLeaders * weeksElapsed;
            
            // Contar relatórios enviados/aprovados do modo correto
            const { data: leaderIdsData } = await (isKidsMode 
              ? supabase.from("profiles").select("id").eq("role", "lider").eq('is_kids', true)
              : supabase.from("profiles").select("id").eq("role", "lider").or('is_kids.is.null,is_kids.eq.false'));
            
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
          const isKidsMode = mode === 'kids';
          // Buscar líderes do discipulador do modo correto
          let leaderQuery = supabase
            .from("profiles")
            .select("id")
            .eq("role", "lider")
            .eq("discipulador_uuid", user.id);
          
          if (isKidsMode) {
            leaderQuery = leaderQuery.eq('is_kids', true);
          } else {
            leaderQuery = leaderQuery.or('is_kids.is.null,is_kids.eq.false');
          }
          
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
          reportCompliance,
          growthTarget: isPastor ? 20 : isDiscipulador ? 15 : 10,
          currentGrowth: statistics.growthRate || 0,
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
              title: `Relatório da semana ${new Date(report.week_start).toLocaleDateString('pt-BR')}`,
              date: report.week_start,
              status: report.status === 'approved' ? 'completed' : report.status === 'needs_correction' ? 'overdue' : 'pending'
            });
          });
        }
      }

      setRecentActivity(activity);

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
        const isKidsMode = mode === 'kids';
        let leaderQuery = supabase
          .from("profiles")
          .select("id")
          .eq("role", "lider")
          .eq("discipulador_uuid", user.id);
        
        if (isKidsMode) {
          leaderQuery = leaderQuery.eq('is_kids', true);
        } else {
          leaderQuery = leaderQuery.or('is_kids.is.null,is_kids.eq.false');
        }
        
        const { data: leaderIds } = await leaderQuery;
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

        // Carregar eventos do mês atual
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        
        try {
          const allEvents = await eventsService.getEvents();
          const currentMonthEvents = allEvents.filter((event) => {
            const eventDate = new Date(event.event_date);
            return eventDate >= monthStart && eventDate <= monthEnd;
          });
          setMonthEvents(currentMonthEvents);
        } catch (error) {
          console.error("Erro ao carregar eventos:", error);
        }
      }

      setLoading(false);
    })();
  }, [user, mode, isLeader, isDiscipulador, isPastor, statistics]);

  const isKidsMode = mode === 'kids';
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
    <Card className={`${isKidsMode ? 'hover:shadow-lg hover:shadow-pink-100 border-pink-200' : 'hover:grape-glow'} transition-smooth`}>
      <CardHeader className="pb-1 flex flex-row items-center justify-between">
        <CardTitle className={`text-xs font-medium ${isKidsMode ? 'text-pink-700' : ''}`}>{title}</CardTitle>
        <Icon className={`h-4 w-4 ${isKidsMode ? 'text-pink-500' : `text-${color === 'primary' ? 'primary' : color === 'success' ? 'green-500' : color === 'warning' ? 'yellow-500' : 'red-500'}`}`} />
      </CardHeader>
      <CardContent className="pt-0">
        <div className={`text-xl font-semibold ${loading ? "text-muted-foreground" : isKidsMode ? 'text-pink-600' : `text-${color === 'primary' ? 'primary' : color === 'success' ? 'green-600' : color === 'warning' ? 'yellow-600' : 'red-600'}`}`}>
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
      <div className={`${isKidsMode ? 'bg-gradient-to-br from-pink-400 via-pink-500 to-purple-500' : 'gradient-primary'} rounded-xl p-6 md:p-8 text-white relative overflow-hidden ${isKidsMode ? 'shadow-lg shadow-pink-200' : ''}`}>
        <div className="relative z-10">
          <div className="flex items-center gap-3 md:gap-4 mb-2 md:mb-4">
            <div className={`w-14 h-14 md:w-16 md:h-16 bg-white ${isKidsMode ? 'rounded-full shadow-xl' : 'rounded-full'} flex items-center justify-center ${isKidsMode ? 'shadow-pink-300' : 'shadow-lg'}`}>
              <img src={logoVideira} alt="Videira Logo" className="w-10 h-10 md:w-12 md:h-12" />
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
          {isKidsMode ? (
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
      <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 ${gridColsDesktop} gap-4`}>
        {isPastor ? (
          <>
            <KpiCard 
              title={isKidsMode ? "Discipuladoras" : "Discipuladores"} 
              value={statistics?.totalDiscipuladores || 0} 
              icon={Users} 
              subtitle={isKidsMode ? "Total no ministério kids" : "Total na igreja"}
              trend={statistics?.networkData ? { value: 12, label: "vs mês anterior" } : undefined}
            />
            <KpiCard 
              title={isKidsMode ? "Líderes Kids" : "Líderes"} 
              value={statistics?.totalLeaders || 0} 
              icon={Users} 
              subtitle={isKidsMode ? "Total no ministério kids" : "Total na igreja"}
              trend={statistics?.networkData ? { value: 8, label: "vs mês anterior" } : undefined}
            />
            <KpiCard 
              title="Membros" 
              value={statistics?.totalMembers || 0} 
              icon={Users} 
              subtitle="Ativos cadastrados"
              trend={statistics?.networkData ? { value: 15, label: "vs mês anterior" } : undefined}
            />
            <KpiCard 
              title="Taxa de Presença" 
              value={`${performanceMetrics?.attendanceRate || 0}%`}
              icon={Target}
              subtitle="Média geral"
              color={performanceMetrics && performanceMetrics.attendanceRate >= 80 ? "success" : "warning"}
            />
            <KpiCard 
              title="Compliance" 
              value={`${performanceMetrics?.reportCompliance || 0}%`}
              icon={Award}
              subtitle="Relatórios em dia"
              color={performanceMetrics && performanceMetrics.reportCompliance >= 90 ? "success" : "warning"}
            />
          </>
        ) : isDiscipulador ? (
          <>
            <KpiCard
              title="Líderes da Rede"
              value={statistics?.totalLeaders || 0}
              icon={Users}
              subtitle="Sob sua supervisão"
              trend={statistics?.networkData ? { value: 5, label: "vs mês anterior" } : undefined}
            />
            <KpiCard
              title="Total de Membros"
              value={statistics?.totalMembers || 0}
              icon={Users}
              subtitle="Em toda a rede"
              trend={statistics?.networkData ? { value: 10, label: "vs mês anterior" } : undefined}
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
              subtitle="Média da rede"
              color={performanceMetrics && performanceMetrics.attendanceRate >= 75 ? "success" : "warning"}
            />
          </>
        ) : (
          <>
            <KpiCard
              title="Membros da Célula"
              value={statistics?.totalMembers || 0}
              icon={Users}
              subtitle={`Membros: ${statistics?.totalMembers || 0} · Frequentadores: ${statistics?.totalFrequentadores || 0}`}
              trend={statistics?.growthRate ? { value: Math.round(statistics.growthRate), label: "vs mês anterior" } : undefined}
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
              subtitle="Último relatório"
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
        )}
      </div>

      {/* Métricas de Performance */}
      {performanceMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Taxa de Presença"
            value={performanceMetrics.attendanceRate}
            target={isPastor ? 85 : isDiscipulador ? 80 : 75}
            icon={Target}
            color={performanceMetrics.attendanceRate >= (isPastor ? 85 : isDiscipulador ? 80 : 75) ? "success" : "warning"}
          />
          <MetricCard
            title="Compliance de Relatórios"
            value={performanceMetrics.reportCompliance}
            target={isPastor ? 95 : isDiscipulador ? 90 : 85}
            icon={FileText}
            color={performanceMetrics.reportCompliance >= (isPastor ? 95 : isDiscipulador ? 90 : 85) ? "success" : "warning"}
          />
          <MetricCard
            title="Meta de Crescimento"
            value={Math.abs(performanceMetrics.currentGrowth)}
            target={performanceMetrics.growthTarget}
            icon={TrendingUp}
            color={performanceMetrics.currentGrowth >= performanceMetrics.growthTarget ? "success" : "warning"}
          />
          <MetricCard
            title="Próximos Eventos"
            value={events.length}
            target={isPastor ? 10 : isDiscipulador ? 8 : 5}
            icon={Calendar}
            color="primary"
          />
        </div>
      )}

      {/* Gráficos e Visualizações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Presenças Mensais */}
        <Card className={`${isKidsMode ? 'hover:shadow-lg hover:shadow-pink-100 border-pink-200' : 'hover:grape-glow'} transition-smooth`}>
          <CardHeader className="pb-2">
            <CardTitle className={`flex items-center gap-2 ${isKidsMode ? 'text-pink-700' : ''}`}>
              <TrendingUp className={`w-5 h-5 ${isKidsMode ? 'text-pink-500' : 'text-primary'}`} />
              Presenças Mensais
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {!statistics?.monthlyData || statistics.monthlyData.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-center text-muted-foreground">Sem dados para exibir.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={statistics.monthlyData.map(month => ({
                  name: `${month.month} ${month.year}`,
                  members: month.averageMembers,
                  frequentadores: month.averageFrequentadores,
                  total: month.averageTotal,
                }))}>
                  <defs>
                    <linearGradient id={isKidsMode ? "gradTotalKids" : "gradTotal"} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={isKidsMode ? "#ec4899" : "var(--primary)"} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={isKidsMode ? "#ec4899" : "var(--primary)"} stopOpacity={0.06} />
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
                    fill={`url(#${isKidsMode ? "gradTotalKids" : "gradTotal"})`}
                    stroke={isKidsMode ? "#ec4899" : "var(--primary)"}
                    strokeWidth={2}
                    isAnimationActive
                  />
                  <Line
                    type="monotone"
                    dataKey="members"
                    name="Membros (média)"
                    stroke={isKidsMode ? "#a855f7" : "#7c3aed"}
                    strokeWidth={2}
                    dot
                    isAnimationActive
                  />
                  <Line
                    type="monotone"
                    dataKey="frequentadores"
                    name="Frequentadores (média)"
                    stroke={isKidsMode ? "#f472b6" : "#f59e0b"}
                    strokeWidth={2}
                    dot
                    isAnimationActive
                  />
                </ComposedChart>
              </ResponsiveContainer>
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
      </div>

      {/* Seções Especiais para Modo Normal (Pastor) */}
      {isPastor && !isKidsMode && (
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-primary/5 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total de Cultos</p>
                    <p className="text-2xl font-bold text-primary">{serviceReportsData.total}</p>
                  </div>
                  <div className="p-4 bg-primary/5 rounded-lg">
                    <p className="text-sm text-muted-foreground">Este Mês</p>
                    <p className="text-2xl font-bold text-primary">{serviceReportsData.thisMonth}</p>
                    {serviceReportsData.lastMonth > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {serviceReportsData.thisMonth > serviceReportsData.lastMonth ? '+' : ''}
                        {serviceReportsData.thisMonth - serviceReportsData.lastMonth} vs mês anterior
                      </p>
                    )}
                  </div>
                  <div className="p-4 bg-primary/5 rounded-lg">
                    <p className="text-sm text-muted-foreground">Média de Presença</p>
                    <p className="text-2xl font-bold text-primary">{serviceReportsData.averageAttendance}</p>
                    <p className="text-xs text-muted-foreground mt-1">pessoas por culto</p>
                  </div>
                  <div className="p-4 bg-primary/5 rounded-lg">
                    <p className="text-sm text-muted-foreground">Últimos 5 Cultos</p>
                    <div className="mt-2 space-y-1">
                      {serviceReportsData.recentReports.slice(0, 3).map((report, idx) => (
                        <div key={idx} className="flex justify-between text-xs">
                          <span className="text-muted-foreground">
                            {new Date(report.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
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
                          tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: number) => [`${value} pessoas`, 'Presença']}
                          labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                        />
                        <Bar dataKey="attendance" fill="var(--primary)" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Seção de Relatórios de Célula */}
          {cellReportsData && (
            <Card className="hover:grape-glow transition-smooth">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Relatórios de Célula
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={() => navigate("/relatorios")}>
                    Ver Todos
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-primary/5 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total de Relatórios</p>
                    <p className="text-2xl font-bold text-primary">{cellReportsData.total}</p>
                  </div>
                  <div className="p-4 bg-primary/5 rounded-lg">
                    <p className="text-sm text-muted-foreground">Este Mês</p>
                    <p className="text-2xl font-bold text-primary">{cellReportsData.thisMonth}</p>
                    {cellReportsData.total > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {Math.round((cellReportsData.thisMonth / cellReportsData.total) * 100)}% do total
                      </p>
                    )}
                  </div>
                  <div className="p-4 bg-primary/5 rounded-lg">
                    <p className="text-sm text-muted-foreground">Última Atualização</p>
                    {cellReportsData.recentReports.length > 0 && (
                      <p className="text-sm font-medium">
                        {new Date(cellReportsData.recentReports[0].weekStart).toLocaleDateString('pt-BR', { 
                          day: '2-digit', 
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium mb-2">Últimos Relatórios</p>
                  {cellReportsData.recentReports.slice(0, 5).map((report, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                      <div>
                        <p className="font-medium text-sm">
                          Semana de {new Date(report.weekStart).toLocaleDateString('pt-BR')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(report.weekStart).toLocaleDateString('pt-BR', { weekday: 'long' })}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => navigate("/relatorios")}
                      >
                        Ver Detalhes
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Calendário Mensal com Eventos */}
          <Card className="hover:grape-glow transition-smooth">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Calendário - {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => navigate("/eventos")}>
                  Ver Agenda
                </Button>
              </div>
            </CardHeader>
            <CardContent>
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
                      {new Date(activity.date).toLocaleDateString("pt-BR")}
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
