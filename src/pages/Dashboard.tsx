import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

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
} from "lucide-react";

type EventItem = { id: string; title: string; date: string };

const roleGreetings = {
  pastor: "Pastor",
  obreiro: "Obreiro",
  discipulador: "Discipulador",
  lider: "Líder",
} as const;

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}
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

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [membersCount, setMembersCount] = useState<number>(0);
  const [totalCells, setTotalCells] = useState<number>(0);
  const [pendingReports, setPendingReports] = useState<number>(0);
  const [events, setEvents] = useState<EventItem[]>([]);

  // crescimento e média do ano com base nos relatórios (attendance)
  const [growthPct, setGrowthPct] = useState<number | null>(null);
  const [currentMonthTotal, setCurrentMonthTotal] = useState<number>(0);
  const [prevMonthTotal, setPrevMonthTotal] = useState<number>(0);
  const [annualAvg, setAnnualAvg] = useState<number>(0);

  const isLeader = user?.role === "lider";

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);

      // 1) Membros (líder) / Total de Células (demais perfis)
      if (isLeader) {
        const { count } = await supabase
          .from("members")
          .select("id", { count: "exact", head: true })
          .eq("lider_id", user.id)
          .eq("active", true);
        setMembersCount(count ?? 0);
      } else {
        const { count } = await supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("role", "lider");
        setTotalCells(count ?? 0);
      }

      // 2) Relatórios pendentes no mês atual
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      const { count: sentCount } = await supabase
        .from("cell_reports")
        .select("id", { count: "exact", head: true })
        .eq("lider_id", user.id)
        .gte("week_start", monthStart.toISOString())
        .lte("week_start", monthEnd.toISOString())
        .in("status", ["submitted", "approved"]);

      const daysInMonth = monthEnd.getDate();
      const expectedWeeks = daysInMonth >= 29 ? 5 : 4;
      setPendingReports(Math.max(0, expectedWeeks - (sentCount ?? 0)));

      // 3) Próximos eventos (reais)
      const { data: ev } = await supabase
        .from("events")
        .select("*")
        .gte("date", new Date().toISOString())
        .order("date", { ascending: true })
        .limit(2);
      setEvents(
        (ev ?? []).map((e) => ({
          id: String(e.id),
          title: e.title ?? "Evento",
          date: e.date,
        }))
      );

      // 4) Crescimento e Média do Ano (YTD) com UMA query do ano todo
      const year = now.getFullYear();
      const yearStart = new Date(year, 0, 1);
      const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);

      let yearQuery = supabase
        .from("cell_reports")
        .select("members_present, visitors_present, week_start, lider_id")
        .gte("week_start", yearStart.toISOString())
        .lte("week_start", yearEnd.toISOString());

      if (isLeader) {
        yearQuery = yearQuery.eq("lider_id", user.id);
      }
      const { data: yearReports } = await yearQuery;

      // Agrupa por mês (YYYY-MM) somando membros + frequentadores por relatório
      const monthlyTotals = new Map<string, number>();
      for (const r of yearReports ?? []) {
        const d = new Date(r.week_start);
        const key = monthKeyOf(d);
        const lenMembers = Array.isArray(r.members_present)
          ? r.members_present.length
          : 0;
        const lenVisitors = Array.isArray(r.visitors_present)
          ? r.visitors_present.length
          : 0;
        const add = lenMembers + lenVisitors;
        monthlyTotals.set(key, (monthlyTotals.get(key) ?? 0) + add);
      }

      // Totais do mês atual e anterior
      const curKey = monthKeyOf(now);
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevKey = monthKeyOf(prev);

      const curTotal = monthlyTotals.get(curKey) ?? 0;
      const prevTotal = monthlyTotals.get(prevKey) ?? 0;

      setCurrentMonthTotal(curTotal);
      setPrevMonthTotal(prevTotal);
      setGrowthPct(prevTotal > 0 ? ((curTotal - prevTotal) / prevTotal) * 100 : null);

      // Média do ano (YTD) — considera de janeiro até o mês atual, meses sem relatório contam como 0
      const monthsSoFar = now.getMonth() + 1; // jan = 0
      let sumYTD = 0;
      for (let m = 0; m < monthsSoFar; m++) {
        const key = `${year}-${String(m + 1).padStart(2, "0")}`;
        sumYTD += monthlyTotals.get(key) ?? 0;
      }
      setAnnualAvg(monthsSoFar > 0 ? sumYTD / monthsSoFar : 0);

      setLoading(false);
    })();
  }, [user, isLeader]);

  if (!user) return null;

  const greeting = roleGreetings[user.role];
  const statsPrimaryValue = isLeader ? membersCount : totalCells;
  const yearNow = new Date().getFullYear();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <div className="gradient-primary rounded-xl p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center grape-bounce">
              <Grape className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">
                Bem-vindo, {greeting} {user.name.split(" ")[0]}!
              </h1>
              <p className="text-white/80">{formatBRLong(new Date())}</p>
            </div>
          </div>
        </div>
        <div className="absolute top-4 right-4 opacity-20">
          <Church className="w-24 h-24" />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:grape-glow transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isLeader ? "Membros da Célula" : "Total de Células"}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {loading ? "…" : statsPrimaryValue}
            </div>
            {isLeader && (
              <p className="text-xs text-muted-foreground">
                Contagem real da sua célula
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="hover:grape-glow transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Relatórios Pendentes
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {loading ? "…" : pendingReports}
            </div>
            <p className="text-xs text-muted-foreground">Para este mês</p>
          </CardContent>
        </Card>

        <Card className="hover:grape-glow transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Próximos Eventos
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {loading ? "…" : events.length}
            </div>
            <p className="text-xs text-muted-foreground">Neste mês</p>
          </CardContent>
        </Card>

        <Card className="hover:grape-glow transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crescimento</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                growthPct === null
                  ? "text-muted-foreground"
                  : growthPct >= 0
                  ? "text-success"
                  : "text-destructive"
              }`}
            >
              {loading
                ? "…"
                : growthPct === null
                ? "—"
                : `${growthPct >= 0 ? "+" : ""}${Math.round(growthPct)}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              {growthPct === null
                ? "Sem dados do mês anterior"
                : "Variação do mês atual vs. anterior"}
            </p>

            {/* Média do ano (YTD) */}
        
            {/* (opcional) Totais brutos para debug */}
            <p className="text-[11px] text-muted-foreground mt-1">
              {loading
                ? ""
                : `Mês: ${currentMonthTotal}${
                    growthPct === null ? "" : ` · Mês ant.: ${prevMonthTotal}`
                  }`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas + Eventos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLeader && (
              <>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() =>
                    navigate("/relatorios", { state: { openCreate: true } })
                  }
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Relatório de Célula
                </Button>

                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() =>
                    navigate("/celula", { state: { openCreateMember: true } })
                  }
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
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => navigate("/relatorios")}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Ver Relatórios
                </Button>
              </>
            )}

            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => navigate("/cursos")}
            >
              <GraduationCap className="w-4 h-4 mr-2" />
              Inscrições em Cursos
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Próximos Eventos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {events.length === 0 && (
              <p className="text-muted-foreground">Sem eventos futuros.</p>
            )}

            {events.map((e, idx) => (
              <div key={e.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <div
                  className={`w-2 h-8 rounded-full ${
                    idx % 2 === 0 ? "bg-primary" : "bg-accent"
                  }`}
                />
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
