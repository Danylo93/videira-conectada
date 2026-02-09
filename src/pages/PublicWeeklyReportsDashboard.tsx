import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Users, TrendingUp, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import logoVideira from "@/assets/logo-videira.png";
import { formatDateBR } from "@/lib/dateUtils";

interface LeaderStatus {
  liderId: string;
  liderName: string;
  celula?: string;
  hasReport: boolean;
  membersCount?: number;
  frequentadoresCount?: number;
  visitantesCount?: number;
  reportDate?: string;
}

const COLORS = {
  preenchido: "#10b981",
  pendente: "#f59e0b",
};

export function PublicWeeklyReportsDashboard() {
  const { pastorId, mode } = useParams<{ pastorId: string; mode?: string }>();
  const [leadersStatus, setLeadersStatus] = useState<LeaderStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weekStartDate, setWeekStartDate] = useState<string>("");
  const [weekEndDate, setWeekEndDate] = useState<string>("");

  const isKids = mode === "kids";

  // Funções para gerenciar semanas
  const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajusta para segunda-feira
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  const getWeekRange = (weekStart: Date) => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    return { start: weekStart, end: weekEnd };
  };

  const getReportWindow = (weekStart: Date) => {
    const thursday = new Date(weekStart);
    thursday.setDate(weekStart.getDate() + 3);
    const saturday = new Date(weekStart);
    saturday.setDate(weekStart.getDate() + 5);
    return { start: thursday, end: saturday };
  };

  // Gerar semanas por mês (a partir da primeira semana de novembro de 2025, apenas semanas passadas e atual)
  const generateWeeksByMonth = () => {
    const today = new Date();
    const currentWeekStart = getWeekStart(today);
    const months: Record<string, Array<{ start: Date; end: Date; label: string; key: string; isCurrent: boolean }>> = {};
    
    // Começar da primeira semana de novembro de 2025
    const startDate = new Date(2025, 10, 1); // Novembro 2025 (mês 10, 0-indexed)
    const startWeek = getWeekStart(startDate);
    
    // Gerar semanas da primeira semana de novembro até a semana atual (não incluir futuras)
    let weekStart = new Date(startWeek);
    
    while (weekStart <= currentWeekStart) {
      const range = getWeekRange(weekStart);
      const monthKey = `${range.start.getFullYear()}-${String(range.start.getMonth() + 1).padStart(2, '0')}`;
      
      if (!months[monthKey]) {
        months[monthKey] = [];
      }
      
      const isCurrent = weekStart.getTime() === currentWeekStart.getTime();
      const label = isCurrent 
        ? `${formatDateBR(range.start)} - ${formatDateBR(range.end)} (Atual)`
        : `${formatDateBR(range.start)} - ${formatDateBR(range.end)}`;
      
      months[monthKey].push({
        start: range.start,
        end: range.end,
        label,
        key: range.start.toISOString().split('T')[0],
        isCurrent,
      });
      
      // Próxima semana
      weekStart = new Date(weekStart);
      weekStart.setDate(weekStart.getDate() + 7);
    }
    
    return months;
  };

  const weeksByMonth = useMemo(() => generateWeeksByMonth(), []);
  const monthKeys = Object.keys(weeksByMonth).sort().reverse(); // Mais recente primeiro
  
  const currentWeekStart = getWeekStart(new Date());
  const [selectedWeekKey, setSelectedWeekKey] = useState(
    currentWeekStart.toISOString().split('T')[0]
  );
  const [selectedMonthKey, setSelectedMonthKey] = useState(() => {
    const currentMonthKey = `${currentWeekStart.getFullYear()}-${String(currentWeekStart.getMonth() + 1).padStart(2, '0')}`;
    return monthKeys[0] || currentMonthKey;
  });

  const currentMonthWeeks = weeksByMonth[selectedMonthKey] || [];

  // Quando o mês muda, selecionar a primeira semana do mês se a semana atual não estiver no mês
  useEffect(() => {
    const weekInMonth = currentMonthWeeks.find(w => w.key === selectedWeekKey);
    if (!weekInMonth && currentMonthWeeks.length > 0) {
      setSelectedWeekKey(currentMonthWeeks[0].key);
    }
  }, [selectedMonthKey, currentMonthWeeks, selectedWeekKey]);

  useEffect(() => {
    if (!pastorId) {
      setError("Parâmetro pastor_id é obrigatório");
      setLoading(false);
      return;
    }

    loadStatus();
  }, [pastorId, isKids, selectedWeekKey]);

  const loadStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      // Usar a semana selecionada
      const selectedWeek = Object.values(weeksByMonth)
        .flat()
        .find(w => w.key === selectedWeekKey);
      
      if (!selectedWeek) {
        throw new Error("Semana selecionada não encontrada");
      }

      const reportWindow = getReportWindow(selectedWeek.start);
      const weekStart = reportWindow.start.toISOString().split("T")[0];
      const weekEnd = reportWindow.end.toISOString().split("T")[0];

      setWeekStartDate(weekStart);
      setWeekEndDate(weekEnd);

      // Chamar Edge Function para buscar status
      // A Edge Function espera parâmetros via query string
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://wkdfeizgfdkkkyatevpc.supabase.co";
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrZGZlaXpnZmRra2t5YXRldnBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3MDIwNDAsImV4cCI6MjA3MzI3ODA0MH0.RQZS8sWrcoipiO_v7vIyn4XP1rTenoj6EeT_YLK7T-M";
      
      const url = new URL(`${supabaseUrl}/functions/v1/weekly-reports-status`);
      url.searchParams.set("date", weekStart);
      url.searchParams.set("pastor_id", pastorId);
      url.searchParams.set("is_kids", String(isKids));
      url.searchParams.set("base_url", window.location.origin);

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "apikey": anonKey,
          "Authorization": `Bearer ${anonKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        let errorMessage = `Erro ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          const errorText = await response.text();
          if (errorText) {
            errorMessage = errorText;
          }
        }
        console.error("Error response:", errorMessage);
        
        if (response.status === 404) {
          throw new Error("Edge Function não encontrada. Verifique se ela foi deployada no Supabase.");
        } else if (response.status === 500) {
          throw new Error("Erro interno do servidor. Verifique os logs do Supabase.");
        } else {
          throw new Error(`Erro ao buscar status: ${errorMessage}`);
        }
      }

      const data: LeaderStatus[] = await response.json();
      setLeadersStatus(data);
    } catch (err: any) {
      console.error("Error loading status:", err);
      setError(err.message || "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  // Dados para gráfico de membros e frequentadores
  const membersFrequentadoresData = leadersStatus
    .filter((leader) => leader.hasReport)
    .map((leader) => ({
      name: leader.liderName.split(" ")[0],
      membros: leader.membersCount || 0,
      frequentadores: leader.frequentadoresCount || 0,
      visitantes: leader.visitantesCount || 0,
      total: (leader.membersCount || 0) + (leader.frequentadoresCount || 0) + (leader.visitantesCount || 0),
    }))
    .sort((a, b) => b.total - a.total); // Ordenar por total decrescente

  // Totais gerais
  const totalMembers = leadersStatus
    .filter((l) => l.hasReport)
    .reduce((sum, l) => sum + (l.membersCount || 0), 0);
  
  const totalFrequentadores = leadersStatus
    .filter((l) => l.hasReport)
    .reduce((sum, l) => sum + (l.frequentadoresCount || 0), 0);

  const totalVisitantes = leadersStatus
    .filter((l) => l.hasReport)
    .reduce((sum, l) => sum + (l.visitantesCount || 0), 0);
  
  const totalParticipants = totalMembers + totalFrequentadores + totalVisitantes;

  const totalLeaders = leadersStatus.length;
  const filledCount = leadersStatus.filter((l) => l.hasReport).length;
  const pendingCount = leadersStatus.filter((l) => !l.hasReport).length;
  const fillPercentage = totalLeaders > 0 ? Math.round((filledCount / totalLeaders) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Carregando dados...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Erro</h2>
              <p className="text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <div className="flex justify-center sm:justify-start mb-4">
                  <img src={logoVideira} alt="Videira Conectada" className="h-16" />
                </div>
                <CardTitle className="text-xl sm:text-2xl md:text-3xl">
                  Dashboard de Relatórios Semanais
                </CardTitle>
                <CardDescription className="text-sm md:text-base mt-2">
                  Semana de {weekStartDate ? formatDateBR(new Date(weekStartDate)) : "..."} a {weekEndDate ? formatDateBR(new Date(weekEndDate)) : "..."}
                </CardDescription>
              </div>
              <Button
                onClick={loadStatus}
                disabled={loading}
                variant="outline"
                className="w-full sm:w-auto text-sm"
                size="sm"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                {loading ? "Atualizando..." : "Atualizar"}
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Seleção de Semana */}
        <Card>
          <CardHeader>
            <CardTitle>Selecionar Semana</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Seletor de Mês */}
            <div>
              <Label htmlFor="month-select">Mês</Label>
              <Select value={selectedMonthKey} onValueChange={setSelectedMonthKey}>
                <SelectTrigger id="month-select" className="w-full sm:w-[300px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthKeys.map((monthKey) => {
                    const firstWeek = weeksByMonth[monthKey]?.[0];
                    if (!firstWeek) return null;
                    const monthLabel = firstWeek.start.toLocaleDateString("pt-BR", { 
                      month: "long", 
                      year: "numeric" 
                    });
                    return (
                      <SelectItem key={monthKey} value={monthKey}>
                        {monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Semanas do Mês Selecionado */}
            {currentMonthWeeks.length > 0 && (
              <div>
                <Label className="mb-2 block text-sm">Semanas disponíveis</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                  {currentMonthWeeks.map((week) => (
                    <Button
                      key={week.key}
                      variant={selectedWeekKey === week.key ? "default" : "outline"}
                      onClick={() => setSelectedWeekKey(week.key)}
                      className={`justify-start text-left h-auto py-2 md:py-2.5 px-2 md:px-3 text-xs md:text-sm ${
                        week.isCurrent && selectedWeekKey !== week.key 
                          ? "border-2 border-primary" 
                          : ""
                      }`}
                    >
                      <div className="flex flex-col items-start w-full">
                        <span className={`${week.isCurrent ? "font-semibold" : ""} break-words`}>
                          {week.label.replace(" (Atual)", "")}
                        </span>
                        {week.isCurrent && (
                          <span className="text-xs text-primary/80 mt-0.5">Semana Atual</span>
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Estatísticas Gerais */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Card>
            <CardHeader className="pb-2 px-3 md:px-6 pt-3 md:pt-6">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-1 md:gap-2">
                <Users className="w-3 h-3 md:w-4 md:h-4" />
                <span className="truncate">Total de Líderes</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
              <div className="text-2xl md:text-3xl font-bold">{totalLeaders}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 px-3 md:px-6 pt-3 md:pt-6">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-1 md:gap-2">
                <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-green-500" />
                <span className="truncate">Preenchidos</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
              <div className="text-2xl md:text-3xl font-bold text-green-600">{filledCount}</div>
              <p className="text-xs text-muted-foreground mt-1">{fillPercentage}% completo</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 px-3 md:px-6 pt-3 md:pt-6">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-1 md:gap-2">
                <Clock className="w-3 h-3 md:w-4 md:h-4 text-yellow-500" />
                <span className="truncate">Pendentes</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
              <div className="text-2xl md:text-3xl font-bold text-yellow-600">{pendingCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalLeaders > 0 ? Math.round((pendingCount / totalLeaders) * 100) : 0}% pendente
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 px-3 md:px-6 pt-3 md:pt-6">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-1 md:gap-2">
                <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-blue-500" />
                <span className="truncate">Taxa de Preenchimento</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
              <div className="text-2xl md:text-3xl font-bold text-blue-600">{fillPercentage}%</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${fillPercentage}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de Membros, Frequentadores e Visitantes */}
        {membersFrequentadoresData.length > 0 && (
          <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Users className="w-4 h-4 md:w-5 md:h-5" />
              Membros, Frequentadores e Visitantes por Líder
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Distribuição de participantes baseada nos relatórios preenchidos
            </CardDescription>
          </CardHeader>
            <CardContent>
              <div className="mb-4 grid grid-cols-1 sm:grid-cols-4 gap-3 md:gap-4">
                <div className="text-center p-3 md:p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-xs md:text-sm text-muted-foreground mb-1">Total de Membros</p>
                  <p className="text-xl md:text-2xl font-bold text-purple-700">{totalMembers}</p>
                </div>
                <div className="text-center p-3 md:p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-xs md:text-sm text-muted-foreground mb-1">Total de Frequentadores</p>
                  <p className="text-xl md:text-2xl font-bold text-orange-700">{totalFrequentadores}</p>
                </div>
                <div className="text-center p-3 md:p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-xs md:text-sm text-muted-foreground mb-1">Total de Visitantes</p>
                  <p className="text-xl md:text-2xl font-bold text-red-700">{totalVisitantes}</p>
                </div>
                <div className="text-center p-3 md:p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-xs md:text-sm text-muted-foreground mb-1">Total de Participantes</p>
                  <p className="text-xl md:text-2xl font-bold text-green-700">{totalParticipants}</p>
                </div>
              </div>
              <div className="w-full overflow-x-auto">
                <ResponsiveContainer width="100%" height={300} minHeight={250}>
                  <BarChart data={membersFrequentadoresData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={0}
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                        fontSize: "12px"
                      }}
                      formatter={(value: number) => [value, ""]}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                    <Bar dataKey="membros" fill="#7c3aed" name="Membros" />
                    <Bar dataKey="frequentadores" fill="#f59e0b" name="Frequentadores" />
                    <Bar dataKey="visitantes" fill="#ef4444" name="Visitantes" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de Líderes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Detalhamento por Líder</CardTitle>
            <CardDescription className="text-xs md:text-sm">Lista completa com status e informações</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leadersStatus.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum líder encontrado.
                </p>
              ) : (
                leadersStatus.map((leader) => (
                  <div
                    key={leader.liderId}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 md:p-4 border rounded-lg hover:bg-gray-50 transition-colors gap-3"
                  >
                    <div className="flex items-center gap-3 md:gap-4 flex-1 w-full sm:w-auto">
                      <div className="flex-shrink-0">
                        {leader.hasReport ? (
                          <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-green-500" />
                        ) : (
                          <Clock className="w-5 h-5 md:w-6 md:h-6 text-yellow-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm md:text-base truncate">{leader.liderName}</h3>
                        {leader.celula && (
                          <p className="text-xs md:text-sm text-muted-foreground truncate">{leader.celula}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4 w-full sm:w-auto justify-between sm:justify-end">
                      {leader.hasReport ? (
                        <>
                          <div className="text-center sm:text-right">
                            <p className="text-xs md:text-sm text-muted-foreground">Membros</p>
                            <p className="font-semibold text-sm md:text-base">{leader.membersCount || 0}</p>
                          </div>
                        <div className="text-center sm:text-right">
                          <p className="text-xs md:text-sm text-muted-foreground">Frequentadores</p>
                          <p className="font-semibold text-sm md:text-base">{leader.frequentadoresCount || 0}</p>
                        </div>
                        <div className="text-center sm:text-right">
                          <p className="text-xs md:text-sm text-muted-foreground">Visitantes</p>
                          <p className="font-semibold text-sm md:text-base">{leader.visitantesCount || 0}</p>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs whitespace-nowrap">
                          Preenchido
                        </Badge>
                        </>
                      ) : (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs whitespace-nowrap ml-auto sm:ml-0">
                          Pendente
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <Card className="border-0 bg-transparent">
          <CardContent className="pt-6">
            <p className="text-center text-sm text-muted-foreground">
              Atualize a página para ver os dados mais recentes
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

