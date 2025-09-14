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

// Labels para saudação por papel
const roleGreetings = {
  pastor: "Pastor",
  obreiro: "Obreiro",
  discipulador: "Discipulador",
  lider: "Líder",
} as const;

// Funções utilitárias de data
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

  // Estatísticas que variam conforme o papel
  const [membersCount, setMembersCount] = useState(0);
  const [visitorsCount, setVisitorsCount] = useState(0);
  const [leadersCount, setLeadersCount] = useState(0);
  const [pendingReports, setPendingReports] = useState(0);
  const [events, setEvents] = useState<{ id: string; title: string; date: string }[]>([]);
  const [growthPct, setGrowthPct] = useState<number | null>(null);
  const [currentMonthTotal, setCurrentMonthTotal] = useState(0);
  const [prevMonthTotal, setPrevMonthTotal] = useState(0);

  const isLeader = user?.role === "lider";
  const isDiscipulador = user?.role === "discipulador";

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);

      // 1) Número de membros/frequentadores ou líderes
      if (isLeader) {
        // Conta membros ativos (type qualquer) e frequentadores separados
        const { count: totalMembers } = await supabase
          .from("members")
          .select("id", { count: "exact", head: true })
          .eq("lider_id", user.id)
          .eq("active", true);
        setMembersCount(totalMembers ?? 0);

        const { count: totalVisitors } = await supabase
          .from("members")
          .select("id", { count: "exact", head: true })
          .eq("lider_id", user.id)
          .eq("active", true)
          .eq("type", "frequentador");
        setVisitorsCount(totalVisitors ?? 0);
      } else {
        // Discipulador: conta líderes da rede; Pastor/Obreiro: todos os líderes
        let query = supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("role", "lider");
        if (isDiscipulador) {
          query = query.eq("discipulador_uuid", user.id);
        }
        const { count } = await query;
        setLeadersCount(count ?? 0);
      }

      // 2) Relatórios pendentes: correção (líder) ou aprovação (discipulador/pastor/obreiro)
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
          const ids = (leaderIds ?? []).map((l: any) => l.id);
          query = ids.length > 0 ? query.in("lider_id", ids) : query.eq("lider_id", ""); // retorna 0
        }
        const { count } = await query;
        setPendingReports(count ?? 0);
      }

      // 3) Próximos eventos (até dois próximos)
      const { data: ev } = await supabase
        .from("events")
        .select("id,title,date")
        .gte("date", new Date().toISOString())
        .order("date", { ascending: true })
        .limit(2);
      setEvents(
        (ev ?? []).map((e: any) => ({
          id: String(e.id),
          title: e.title ?? "Evento",
          date: e.date,
        }))
      );

      // 4) Crescimento: soma de presenças no mês atual vs anterior (líder, rede ou global)
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
        const ids = (leaderIds ?? []).map((l: any) => l.id);
        reportsQuery = ids.length > 0 ? reportsQuery.in("lider_id", ids) : reportsQuery.eq("lider_id", "");
      }

      const { data: yearReports } = await reportsQuery;
      const monthlyTotals: Record<string, number> = {};
      for (const r of yearReports ?? []) {
        const date = new Date(r.week_start);
        const key = monthKeyOf(date);
        const membersLen = Array.isArray(r.members_present) ? r.members_present.length : 0;
        const visitorsLen = Array.isArray(r.visitors_present) ? r.visitors_present.length : 0;
        monthlyTotals[key] = (monthlyTotals[key] ?? 0) + membersLen + visitorsLen;
      }

      const curKey = monthKeyOf(now);
      const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevKey = monthKeyOf(prevDate);

      const curTotal = monthlyTotals[curKey] ?? 0;
      const prevTotal = monthlyTotals[prevKey] ?? 0;
      setCurrentMonthTotal(curTotal);
      setPrevMonthTotal(prevTotal);
      setGrowthPct(prevTotal > 0 ? ((curTotal - prevTotal) / prevTotal) * 100 : null);

      setLoading(false);
    })();
  }, [user]);

  if (!user) return null;

  const greeting = roleGreetings[user.role as keyof typeof roleGreetings] ?? "Usuário";
  const statsPrimaryValue = isLeader ? `${membersCount}` : `${leadersCount}`;
  const subtitle = isLeader
    ? `Membros: ${membersCount}  Frequentadores: ${visitorsCount}`
    : isDiscipulador
    ? "Contagem de líderes na sua rede"
    : "Contagem de líderes na igreja";

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Saudação */}
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

      {/* Indicadores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:grape-glow transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isLeader ? "Membros da Célula" : isDiscipulador ? "Líderes da Rede" : "Total de Líderes"}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {loading ? "…" : statsPrimaryValue}
            </div>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </CardContent>
        </Card>

        <Card className="hover:grape-glow transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Relatórios Pendentes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {loading ? "…" : pendingReports}
            </div>
            <p className="text-xs text-muted-foreground">
              {isLeader ? "Relatórios a corrigir" : "Relatórios aguardando aprovação"}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:grape-glow transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximos Eventos</CardTitle>
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
              {growthPct === null ? "Sem dados do mês anterior" : "Variação do mês atual vs. anterior"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {loading ? "" : `Mês atual: ${currentMonthTotal}${growthPct === null ? "" : ` · Mês ant.: ${prevMonthTotal}`}`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ações rápidas e eventos */}
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
            <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/cursos")}>
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
