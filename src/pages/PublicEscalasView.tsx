import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, Lock } from "lucide-react";
import logoVideira from "@/assets/logo-videira.png";
import { formatDateBR, getWeekStartDate } from "@/lib/dateUtils";

type AreaServico = "midia" | "domingo_kids" | "louvor" | "mesa_som" | "cantina" | "conexao";

interface Escala {
  id: string;
  semana_inicio: string;
  area: AreaServico;
  servo_id: string;
  servo_name: string | null;
  dia: "sabado" | "domingo";
  locked: boolean;
  funcao_louvor?: string | null;
  funcao_conexao?: string | null;
}

type FuncaoLouvor =
  | "ministro"
  | "violao"
  | "voz1"
  | "voz2"
  | "baixo"
  | "teclado"
  | "bateria"
  | "guitarra";

type FuncaoConexao =
  | "recepcao1"
  | "recepcao2"
  | "estacionamento1"
  | "estacionamento2"
  | "nave_igreja"
  | "porta_kids";

const FUNCOES_LOUVOR: { value: FuncaoLouvor; label: string }[] = [
  { value: "ministro", label: "Ministro" },
  { value: "violao", label: "Violão" },
  { value: "voz1", label: "Voz 1" },
  { value: "voz2", label: "Voz 2" },
  { value: "baixo", label: "Baixo" },
  { value: "teclado", label: "Teclado" },
  { value: "bateria", label: "Bateria" },
  { value: "guitarra", label: "Guitarra" },
];

const FUNCOES_CONEXAO: { value: FuncaoConexao; label: string }[] = [
  { value: "recepcao1", label: "Recepção 1" },
  { value: "recepcao2", label: "Recepção 2" },
  { value: "estacionamento1", label: "Estacionamento 1" },
  { value: "estacionamento2", label: "Estacionamento 2" },
  { value: "nave_igreja", label: "Nave da igreja" },
  { value: "porta_kids", label: "Porta dos Kids" },
];

const AREAS: { value: AreaServico; label: string; color: string }[] = [
  { value: "midia", label: "Mídia", color: "bg-blue-500" },
  { value: "domingo_kids", label: "Domingo Kids", color: "bg-purple-500" },
  { value: "louvor", label: "Louvor", color: "bg-yellow-500" },
  { value: "mesa_som", label: "Mesa de Som", color: "bg-green-500" },
  { value: "cantina", label: "Cantina", color: "bg-orange-500" },
  { value: "conexao", label: "Conexão", color: "bg-pink-500" },
];

export function PublicEscalasView() {
  const [escalas, setEscalas] = useState<Escala[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState<string>("");

  // Inicializar semana atual (sábado da semana)
  useEffect(() => {
    const today = new Date();
    const monday = getWeekStartDate(today);
    const saturday = new Date(monday);
    saturday.setDate(monday.getDate() + 5);
    setSelectedWeek(saturday.toISOString().split("T")[0]);
  }, []);

  // Carregar dados
  useEffect(() => {
    if (selectedWeek) {
      loadData();
    }
  }, [selectedWeek]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Carregar escalas da semana selecionada (apenas escalas com servos ativos)
      const { data: escalasData, error: escalasError } = await supabase
        .from("escalas")
        .select(`
          id,
          semana_inicio,
          area,
          servo_id,
          dia,
          locked,
          funcao_louvor,
          funcao_conexao
        `)
        .eq("semana_inicio", selectedWeek)
        .order("area, dia, funcao_louvor, funcao_conexao");

      if (escalasError) throw escalasError;

      // Buscar nomes dos servos
      const servoIds = [...new Set((escalasData || []).map((e: any) => e.servo_id).filter(Boolean))] as string[];
      const servosMap: Record<string, string> = {};
      
      if (servoIds.length > 0) {
        const { data: servosInfo, error: servosInfoError } = await supabase
          .from("servos")
          .select("id, nome")
          .in("id", servoIds)
          .eq("ativo", true); // Apenas servos ativos
        
        if (!servosInfoError && servosInfo) {
          servosInfo.forEach((s: any) => {
            servosMap[s.id] = s.nome;
          });
        }
      }

      // Mapear escalas, filtrando apenas as que têm servos válidos
      const formattedEscalas: Escala[] = (escalasData || [])
        .filter((e: any) => servosMap[e.servo_id]) // Apenas escalas com servos ativos
        .map((e: any) => ({
          id: e.id,
          semana_inicio: e.semana_inicio,
          area: e.area,
          servo_id: e.servo_id,
          servo_name: servosMap[e.servo_id] || null,
          dia: e.dia,
          locked: e.locked,
          funcao_louvor: e.funcao_louvor || null,
          funcao_conexao: e.funcao_conexao || null,
        }));

      setEscalas(formattedEscalas);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Organizar escalas por área e dia
  const escalasPorArea = useMemo(() => {
    const organized: Record<
      AreaServico,
      { sabado: Escala[]; domingo: Escala[] }
    > = {
      midia: { sabado: [], domingo: [] },
      domingo_kids: { sabado: [], domingo: [] },
      louvor: { sabado: [], domingo: [] },
      mesa_som: { sabado: [], domingo: [] },
      cantina: { sabado: [], domingo: [] },
      conexao: { sabado: [], domingo: [] },
    };

    escalas.forEach((escala) => {
      organized[escala.area][escala.dia].push(escala);
    });

    // Ordenar escalas de louvor por função
    const ordenarPorFuncaoLouvor = (a: Escala, b: Escala) => {
      const indexA = FUNCOES_LOUVOR.findIndex((f) => f.value === a.funcao_louvor);
      const indexB = FUNCOES_LOUVOR.findIndex((f) => f.value === b.funcao_louvor);
      
      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      
      return indexA - indexB;
    };

    // Ordenar escalas de conexão por função
    const ordenarPorFuncaoConexao = (a: Escala, b: Escala) => {
      const indexA = FUNCOES_CONEXAO.findIndex((f) => f.value === a.funcao_conexao);
      const indexB = FUNCOES_CONEXAO.findIndex((f) => f.value === b.funcao_conexao);
      
      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      
      return indexA - indexB;
    };

    organized.louvor.sabado.sort(ordenarPorFuncaoLouvor);
    organized.louvor.domingo.sort(ordenarPorFuncaoLouvor);
    organized.conexao.sabado.sort(ordenarPorFuncaoConexao);
    organized.conexao.domingo.sort(ordenarPorFuncaoConexao);

    return organized;
  }, [escalas]);

  const getNextWeek = () => {
    const current = new Date(selectedWeek);
    current.setDate(current.getDate() + 7);
    return current.toISOString().split("T")[0];
  };

  const getPreviousWeek = () => {
    if (!selectedWeek) return "";
    const current = new Date(selectedWeek);
    current.setDate(current.getDate() - 7);
    return current.toISOString().split("T")[0];
  };

  const getCurrentWeekSaturday = () => {
    const today = new Date();
    const monday = getWeekStartDate(today);
    const saturday = new Date(monday);
    saturday.setDate(monday.getDate() + 5);
    return saturday;
  };

  const canGoToPreviousWeek = useMemo(() => {
    if (!selectedWeek) return false;
    const selected = new Date(selectedWeek);
    const currentSaturday = getCurrentWeekSaturday();
    
    selected.setHours(0, 0, 0, 0);
    currentSaturday.setHours(0, 0, 0, 0);
    
    return selected > currentSaturday;
  }, [selectedWeek]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            <p className="text-sm text-muted-foreground">Carregando escalas...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 pb-12 sm:pb-8 pt-4 sm:pt-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-4">
            <img
              src={logoVideira}
              alt="Videira São Miguel"
              className="h-16 sm:h-20 w-auto"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Escalas de Serviço
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Visualize as escalas semanais de serviço da igreja
          </p>
        </div>

        {/* Navegação de Semana */}
        <Card className="mb-6 sm:mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 sm:gap-4 justify-center">
              <Button
                variant="outline"
                onClick={() => setSelectedWeek(getPreviousWeek())}
                size="sm"
                disabled={!canGoToPreviousWeek}
                className="min-h-[44px] touch-manipulation"
              >
                Semana Anterior
              </Button>
              <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 bg-muted/50 rounded-lg flex-1 max-w-md">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                {selectedWeek ? (() => {
                  const sabado = new Date(selectedWeek);
                  const domingo = new Date(sabado);
                  domingo.setDate(sabado.getDate() + 1);
                  return (
                    <div className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base flex-1 justify-center">
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">Sábado</div>
                        <div className="font-medium">{formatDateBR(sabado)}</div>
                      </div>
                      <span className="text-muted-foreground">•</span>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">Domingo</div>
                        <div className="font-medium">{formatDateBR(domingo)}</div>
                      </div>
                    </div>
                  );
                })() : (
                  <span className="text-sm font-medium">Selecione uma semana</span>
                )}
              </div>
              <Button
                variant="outline"
                onClick={() => setSelectedWeek(getNextWeek())}
                size="sm"
                className="min-h-[44px] touch-manipulation"
              >
                Próxima Semana
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Grid de áreas */}
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 pb-2 sm:pb-0">
          <div className="grid grid-cols-[260px] sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 min-w-max sm:min-w-0">
            {AREAS.map((area) => (
              <Card key={area.value} className="flex flex-col min-w-[260px] sm:min-w-0 shadow-sm">
                <CardHeader className={`${area.color} text-white p-4 sm:p-6`}>
                  <CardTitle className="text-sm sm:text-lg">{area.label}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-4 space-y-4">
                  {/* Sábado - Não mostrar para Domingo Kids */}
                  {area.value !== "domingo_kids" && (
                    area.value === "louvor" || area.value === "conexao" ? (
                      <Card className="border-2">
                        <CardHeader className="p-3 pb-2">
                          <CardTitle className="text-sm font-semibold">Sábado</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 pt-0 space-y-3">
                          {(area.value === "louvor" ? FUNCOES_LOUVOR : FUNCOES_CONEXAO).map((funcao) => {
                            const escalasFuncao = escalasPorArea[area.value].sabado.filter(
                              (e) => 
                                area.value === "louvor" 
                                  ? e.funcao_louvor === funcao.value
                                  : e.funcao_conexao === funcao.value
                            );
                            if (escalasFuncao.length === 0) return null;
                            return (
                              <div key={funcao.value} className="space-y-1">
                                <h4 className="text-xs font-medium text-muted-foreground">
                                  {funcao.label}:
                                </h4>
                                <div className="space-y-1">
                                  {escalasFuncao.map((escala) => (
                                    <div
                                      key={escala.id}
                                      className="bg-card border rounded-lg p-2 flex items-center gap-2"
                                    >
                                      <span className="text-sm font-medium flex-1">
                                        {escala.servo_name || "Servo removido"}
                                      </span>
                                      {escala.locked && (
                                        <Lock className="h-3 w-3 text-muted-foreground" />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                          {escalasPorArea[area.value].sabado.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              Nenhuma escala cadastrada
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="border-2">
                        <CardHeader className="p-3 pb-2">
                          <CardTitle className="text-sm font-semibold">Sábado</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                          <div className="space-y-2">
                            {escalasPorArea[area.value].sabado.map((escala) => (
                              <div
                                key={escala.id}
                                className="bg-card border rounded-lg p-2 flex items-center gap-2"
                              >
                                <span className="text-sm font-medium flex-1">
                                  {escala.servo_name || "Servo removido"}
                                </span>
                                {escala.locked && (
                                  <Lock className="h-3 w-3 text-muted-foreground" />
                                )}
                              </div>
                            ))}
                            {escalasPorArea[area.value].sabado.length === 0 && (
                              <p className="text-sm text-muted-foreground text-center py-4">
                                Nenhuma escala
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  )}

                  {/* Domingo */}
                  {area.value === "louvor" || area.value === "conexao" ? (
                    <Card className="border-2">
                      <CardHeader className="p-3 pb-2">
                        <CardTitle className="text-sm font-semibold">Domingo</CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 pt-0 space-y-3">
                        {(area.value === "louvor" ? FUNCOES_LOUVOR : FUNCOES_CONEXAO).map((funcao) => {
                          const escalasFuncao = escalasPorArea[area.value].domingo.filter(
                            (e) => 
                              area.value === "louvor" 
                                ? e.funcao_louvor === funcao.value
                                : e.funcao_conexao === funcao.value
                          );
                          if (escalasFuncao.length === 0) return null;
                          return (
                            <div key={funcao.value} className="space-y-1">
                              <h4 className="text-xs font-medium text-muted-foreground">
                                {funcao.label}:
                              </h4>
                              <div className="space-y-1">
                                {escalasFuncao.map((escala) => (
                                  <div
                                    key={escala.id}
                                    className="bg-card border rounded-lg p-2 flex items-center gap-2"
                                  >
                                    <span className="text-sm font-medium flex-1">
                                      {escala.servo_name || "Servo removido"}
                                    </span>
                                    {escala.locked && (
                                      <Lock className="h-3 w-3 text-muted-foreground" />
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                        {escalasPorArea[area.value].domingo.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Nenhuma escala cadastrada
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="border-2">
                      <CardHeader className="p-3 pb-2">
                        <CardTitle className="text-sm font-semibold">Domingo</CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                        <div className="space-y-2">
                          {escalasPorArea[area.value].domingo.map((escala) => (
                            <div
                              key={escala.id}
                              className="bg-card border rounded-lg p-2 flex items-center gap-2"
                            >
                              <span className="text-sm font-medium flex-1">
                                {escala.servo_name || "Servo removido"}
                              </span>
                              {escala.locked && (
                                <Lock className="h-3 w-3 text-muted-foreground" />
                              )}
                            </div>
                          ))}
                          {escalasPorArea[area.value].domingo.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              Nenhuma escala
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

