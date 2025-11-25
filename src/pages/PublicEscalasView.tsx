import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, Lock, ChevronRight, ChevronLeft } from "lucide-react";
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
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  // Detectar se há scroll horizontal disponível
  useEffect(() => {
    const checkScroll = () => {
      if (scrollContainerRef.current) {
        const { scrollWidth, clientWidth, scrollLeft } = scrollContainerRef.current;
        const hasScrollRight = scrollWidth > clientWidth && scrollLeft < scrollWidth - clientWidth - 10;
        const hasScrollLeft = scrollLeft > 10;
        setCanScrollRight(hasScrollRight);
        setCanScrollLeft(hasScrollLeft);
      }
    };

    // Verificar imediatamente
    checkScroll();
    
    // Aguardar renderização e verificar novamente
    const timeoutId1 = setTimeout(() => {
      checkScroll();
    }, 100);
    
    const timeoutId2 = setTimeout(() => {
      checkScroll();
    }, 500);
    
    const scrollElement = scrollContainerRef.current;
    if (scrollElement) {
      scrollElement.addEventListener("scroll", checkScroll, { passive: true });
      window.addEventListener("resize", checkScroll);
      
      return () => {
        clearTimeout(timeoutId1);
        clearTimeout(timeoutId2);
        scrollElement.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }
    
    return () => {
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);
    };
  }, [escalas, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            <p className="text-sm text-muted-foreground">Carregando escalas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex flex-col overflow-hidden">
      {/* Header Fixo */}
      <header className="fixed top-0 left-0 right-0 bg-white shadow-md z-50 border-b">
        <div className="max-w-[1920px] mx-auto px-3 sm:px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-4 py-2 sm:py-4">
            {/* Logo e Título */}
            <div className="flex items-center gap-1.5 sm:gap-4 w-full sm:w-auto">
              <img
                src={logoVideira}
                alt="Videira São Miguel"
                className="h-6 sm:h-10 w-auto flex-shrink-0"
              />
              <div className="min-w-0 flex-1 sm:flex-initial">
                <h1 className="text-sm sm:text-xl font-bold text-gray-900 truncate leading-tight">
                Escalas Videira São Miguel
                </h1>
                <p className="hidden sm:block text-xs text-gray-600">
                  Visualização pública
                </p>
              </div>
            </div>

            {/* Navegação de Semana */}
            <div className="flex items-center gap-1.5 sm:gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => setSelectedWeek(getPreviousWeek())}
                size="sm"
                disabled={!canGoToPreviousWeek}
                className="h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3 flex-shrink-0"
              >
                <span className="hidden sm:inline">Semana Anterior</span>
                <span className="sm:hidden">Ant</span>
              </Button>
              <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-muted/50 rounded-md flex-1 min-w-0 max-w-[180px] sm:max-w-[220px]">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                {selectedWeek ? (() => {
                  const sabado = new Date(selectedWeek);
                  const domingo = new Date(sabado);
                  domingo.setDate(sabado.getDate() + 1);
                  return (
                    <>
                      <div className="flex flex-col items-center sm:items-start min-w-0">
                        <span className="text-[9px] sm:text-[10px] text-muted-foreground">Sáb</span>
                        <span className="font-medium text-[10px] sm:text-xs truncate">{formatDateBR(sabado)}</span>
                      </div>
                      <span className="text-muted-foreground text-[10px]">•</span>
                      <div className="flex flex-col items-center sm:items-start min-w-0">
                        <span className="text-[9px] sm:text-[10px] text-muted-foreground">Dom</span>
                        <span className="font-medium text-[10px] sm:text-xs truncate">{formatDateBR(domingo)}</span>
                      </div>
                    </>
                  );
                })() : (
                  <span className="text-xs sm:text-sm font-medium">Selecione uma semana</span>
                )}
              </div>
              <Button
                variant="outline"
                onClick={() => setSelectedWeek(getNextWeek())}
                size="sm"
                className="h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3 flex-shrink-0"
              >
                <span className="hidden sm:inline">Próxima Semana</span>
                <span className="sm:hidden">Próx</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal com Scroll Horizontal */}
      <main ref={scrollContainerRef} className="flex-1 overflow-x-auto pt-[70px] sm:pt-[92px] scrollbar-hide relative">
        <div className="inline-flex gap-0 sm:gap-4 px-0 sm:px-4 py-0 sm:py-4 items-start h-full w-full sm:w-auto">
            {AREAS.map((area) => {
              // Calcular responsável para Domingo Kids e Conexão
              let responsibleName: string | null = null;
              if (area.value === "domingo_kids") {
                const domingoKidsEscalas = escalasPorArea[area.value].domingo;
                if (domingoKidsEscalas.length > 0) {
                  responsibleName = domingoKidsEscalas[0].servo_name;
                }
              } else if (area.value === "conexao") {
                const conexaoSabadoEscalas = escalasPorArea[area.value].sabado;
                const conexaoDomingoEscalas = escalasPorArea[area.value].domingo;
                if (conexaoSabadoEscalas.length > 0) {
                  responsibleName = conexaoSabadoEscalas[0].servo_name;
                } else if (conexaoDomingoEscalas.length > 0) {
                  responsibleName = conexaoDomingoEscalas[0].servo_name;
                }
              }

              return (
              <Card key={area.value} className="flex flex-col shadow-lg sm:shadow-md w-screen sm:w-[320px] md:w-[350px] flex-shrink-0 h-[calc(100vh-70px)] sm:h-[calc(100vh-92px)] rounded-none sm:rounded-lg border-0 sm:border">
                <CardHeader className={`${area.color} text-white p-4 sm:p-4 flex-shrink-0 min-h-[56px] sm:min-h-0`}>
                  <CardTitle className="text-lg sm:text-lg font-bold leading-tight">
                    {area.value === "domingo_kids" && responsibleName
                      ? `Domingo Kids da ${responsibleName}`
                      : area.value === "conexao" && responsibleName
                      ? `Conexão`
                      : area.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-4 sm:p-4 space-y-3 sm:space-y-4 overflow-y-auto min-h-0 bg-white scrollbar-hide">
                  {/* Sábado - Não mostrar para Domingo Kids */}
                  {area.value !== "domingo_kids" && (
                    (() => {
                      // Renderização especial para Conexão com responsável separado
                      if (area.value === "conexao") {
                        const escalasSabado = escalasPorArea[area.value].sabado;
                        const responsavel = escalasSabado[0]; // Primeiro servo é o responsável
                        const outrosServos = escalasSabado.slice(1); // Demais servos
                        
                        return (
                        <Card className="border shadow-sm">
                          <CardHeader className="p-3 sm:p-3 pb-2 sm:pb-2 bg-muted/30">
                            <CardTitle className="text-sm sm:text-sm font-semibold">Sábado</CardTitle>
                          </CardHeader>
                          <CardContent className="p-3 sm:p-3 pt-3 sm:pt-3 space-y-3 sm:space-y-4">
                            {/* Seção Responsável */}
                            <div className="space-y-1.5 sm:space-y-2">
                              <h4 className="text-sm sm:text-sm font-semibold text-foreground">
                                Responsável:
                              </h4>
                              {responsavel ? (
                                <div className="bg-muted/50 border border-muted-foreground/20 rounded-lg p-2.5 sm:p-3 flex items-center gap-2 shadow-sm">
                                  <span className="text-sm sm:text-base font-semibold text-foreground flex-1">
                                    {responsavel.servo_name || "Servo removido"}
                                  </span>
                                  {responsavel.locked && (
                                    <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                  )}
                                </div>
                                ) : (
                                  <p className="text-xs sm:text-sm text-muted-foreground text-center py-2">
                                    Nenhum responsável definido
                                  </p>
                                )}
                              </div>

                              {/* Seção Servos */}
                              <div className="space-y-1.5 sm:space-y-2">
                                <h4 className="text-sm sm:text-sm font-semibold text-foreground">
                                  Servos:
                                </h4>
                                {outrosServos.length > 0 ? (
                                  <div className="space-y-1.5 sm:space-y-2">
                                    {outrosServos.map((escala) => (
                                      <div
                                        key={escala.id}
                                        className="bg-background border border-muted-foreground/20 rounded-lg p-2.5 sm:p-3 flex items-center gap-2 shadow-sm hover:bg-muted/30 transition-colors"
                                      >
                                        <span className="text-sm sm:text-base font-medium text-foreground flex-1">
                                          {escala.servo_name || "Servo removido"}
                                        </span>
                                        {escala.locked && (
                                          <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs sm:text-sm text-muted-foreground text-center py-3">
                                    Nenhum servo cadastrado
                                  </p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      }
                      
                      // Renderização para Louvor com subcategorias
                      if (area.value === "louvor") {
                      return (
                        <Card className="border shadow-sm">
                          <CardHeader className="p-3 sm:p-3 pb-2 sm:pb-2 bg-muted/30">
                            <CardTitle className="text-sm sm:text-sm font-semibold">Sábado</CardTitle>
                          </CardHeader>
                          <CardContent className="p-2.5 sm:p-3 pt-3 sm:pt-3 space-y-1.5 sm:space-y-3">
                              {FUNCOES_LOUVOR.map((funcao) => {
                                const escalasFuncao = escalasPorArea[area.value].sabado.filter(
                                  (e) => e.funcao_louvor === funcao.value
                                );
                                if (escalasFuncao.length === 0) return null;
                                return (
                                  <div key={funcao.value} className="space-y-0.5 sm:space-y-1">
                                    <h4 className="text-xs sm:text-xs font-semibold text-foreground">
                                      {funcao.label}:
                                    </h4>
                                    <div className="space-y-1.5 sm:space-y-2">
                                      {escalasFuncao.map((escala) => (
                                        <div
                                          key={escala.id}
                                          className="bg-background border border-muted-foreground/20 rounded-lg p-2.5 sm:p-3 flex items-center gap-2 shadow-sm hover:bg-muted/30 transition-colors"
                                        >
                                          <span className="text-sm sm:text-base font-medium text-foreground flex-1">
                                            {escala.servo_name || "Servo removido"}
                                          </span>
                                          {escala.locked && (
                                            <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                              {escalasPorArea[area.value].sabado.length === 0 && (
                                <p className="text-xs sm:text-sm text-muted-foreground text-center py-4">
                                  Nenhuma escala cadastrada
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        );
                      }
                      
                      // Renderização padrão para outros setores
                      return (
                        <Card className="border shadow-sm">
                          <CardHeader className="p-3 sm:p-3 pb-2 sm:pb-2 bg-muted/30">
                            <CardTitle className="text-sm sm:text-sm font-semibold">Sábado</CardTitle>
                          </CardHeader>
                          <CardContent className="p-2.5 sm:p-3 pt-3 sm:pt-3">
                            <div className="space-y-2">
                              {escalasPorArea[area.value].sabado.map((escala) => (
                                <div
                                  key={escala.id}
                                  className="bg-background border border-muted-foreground/20 rounded-lg p-2.5 sm:p-3 flex items-center gap-2 shadow-sm hover:bg-muted/30 transition-colors"
                                >
                                  <span className="text-sm sm:text-base font-medium text-foreground flex-1">
                                    {escala.servo_name || "Servo removido"}
                                  </span>
                                  {escala.locked && (
                                    <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                  )}
                                </div>
                              ))}
                              {escalasPorArea[area.value].sabado.length === 0 && (
                                <p className="text-xs sm:text-sm text-muted-foreground text-center py-4">
                                  Nenhuma escala
                                </p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })()
                  )}

                  {/* Domingo */}
                  {(() => {
                    // Renderização especial para Domingo Kids e Conexão com responsável separado
                    if (area.value === "domingo_kids" || area.value === "conexao") {
                      const escalasDomingo = escalasPorArea[area.value].domingo;
                      const responsavel = escalasDomingo[0]; // Primeiro servo é o responsável
                      const outrosServos = escalasDomingo.slice(1); // Demais servos
                      
                      return (
                        <Card className="border shadow-sm">
                          <CardHeader className="p-3 sm:p-3 pb-2 sm:pb-2 bg-muted/30">
                            <CardTitle className="text-sm sm:text-sm font-semibold">Domingo</CardTitle>
                          </CardHeader>
                          <CardContent className="p-3 sm:p-3 pt-3 sm:pt-3 space-y-3 sm:space-y-4">
                            {/* Seção Responsável */}
                            <div className="space-y-1.5 sm:space-y-2">
                              <h4 className="text-sm sm:text-sm font-semibold text-foreground">
                                Responsável:
                              </h4>
                              {responsavel ? (
                                <div className="bg-muted/50 border border-muted-foreground/20 rounded-lg p-2.5 sm:p-3 flex items-center gap-2 shadow-sm">
                                  <span className="text-sm sm:text-base font-semibold text-foreground flex-1">
                                    {responsavel.servo_name || "Servo removido"}
                                  </span>
                                  {responsavel.locked && (
                                    <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                  )}
                                </div>
                              ) : (
                                <p className="text-xs sm:text-sm text-muted-foreground text-center py-3">
                                  Nenhum responsável definido
                                </p>
                              )}
                            </div>

                            {/* Seção Servas/Servos */}
                            <div className="space-y-1.5 sm:space-y-2">
                              <h4 className="text-sm sm:text-sm font-semibold text-foreground">
                                {area.value === "domingo_kids" ? "Servas:" : "Servos:"}
                              </h4>
                              {outrosServos.length > 0 ? (
                                <div className="space-y-1.5 sm:space-y-2">
                                  {outrosServos.map((escala) => (
                                    <div
                                      key={escala.id}
                                      className="bg-background border border-muted-foreground/20 rounded-lg p-2.5 sm:p-3 flex items-center gap-2 shadow-sm hover:bg-muted/30 transition-colors"
                                    >
                                      <span className="text-sm sm:text-base font-medium text-foreground flex-1">
                                        {escala.servo_name || "Servo removido"}
                                      </span>
                                      {escala.locked && (
                                        <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs sm:text-sm text-muted-foreground text-center py-3">
                                  Nenhum servo cadastrado
                                </p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    }
                    
                    // Renderização para Louvor com subcategorias
                    if (area.value === "louvor") {
                      return (
                        <Card className="border shadow-sm">
                          <CardHeader className="p-3 sm:p-3 pb-2 sm:pb-2 bg-muted/30">
                            <CardTitle className="text-sm sm:text-sm font-semibold">Domingo</CardTitle>
                          </CardHeader>
                          <CardContent className="p-2.5 sm:p-3 pt-3 sm:pt-3 space-y-1.5 sm:space-y-3">
                            {FUNCOES_LOUVOR.map((funcao) => {
                              const escalasFuncao = escalasPorArea[area.value].domingo.filter(
                                (e) => e.funcao_louvor === funcao.value
                              );
                              if (escalasFuncao.length === 0) return null;
                              return (
                                <div key={funcao.value} className="space-y-1 sm:space-y-1.5">
                                  <h4 className="text-xs sm:text-xs font-semibold text-foreground">
                                    {funcao.label}:
                                  </h4>
                                  <div className="space-y-1.5 sm:space-y-2">
                                    {escalasFuncao.map((escala) => (
                                      <div
                                        key={escala.id}
                                        className="bg-background border border-muted-foreground/20 rounded-lg p-2.5 sm:p-3 flex items-center gap-2 shadow-sm hover:bg-muted/30 transition-colors"
                                      >
                                        <span className="text-sm sm:text-base font-medium text-foreground flex-1">
                                          {escala.servo_name || "Servo removido"}
                                        </span>
                                        {escala.locked && (
                                          <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                            {escalasPorArea[area.value].domingo.length === 0 && (
                              <p className="text-xs sm:text-sm text-muted-foreground text-center py-4">
                                Nenhuma escala cadastrada
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      );
                    }
                    
                    // Renderização padrão para outros setores
                      return (
                        <Card className="border shadow-sm">
                          <CardHeader className="p-3 sm:p-3 pb-2 sm:pb-2 bg-muted/30">
                            <CardTitle className="text-sm sm:text-sm font-semibold">Domingo</CardTitle>
                          </CardHeader>
                          <CardContent className="p-2.5 sm:p-3 pt-3 sm:pt-3">
                          <div className="space-y-2">
                              {escalasPorArea[area.value].domingo.map((escala) => (
                                <div
                                  key={escala.id}
                                  className="bg-background border border-muted-foreground/20 rounded-lg p-2.5 sm:p-3 flex items-center gap-2 shadow-sm hover:bg-muted/30 transition-colors"
                                >
                                  <span className="text-sm sm:text-base font-medium text-foreground flex-1">
                                    {escala.servo_name || "Servo removido"}
                                  </span>
                                  {escala.locked && (
                                    <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                  )}
                                </div>
                              ))}
                            {escalasPorArea[area.value].domingo.length === 0 && (
                              <p className="text-xs sm:text-sm text-muted-foreground text-center py-4">
                                Nenhuma escala
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })()}
                </CardContent>
              </Card>
              );
            })}
          </div>
        </main>
        
        {/* Seta indicativa de scroll horizontal - esquerda */}
        {canScrollLeft && (
          <button
            onClick={() => {
              if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollBy({
                  left: -400,
                  behavior: 'smooth'
                });
              }
            }}
            className="flex fixed left-2 sm:left-4 top-1/2 -translate-y-1/2 z-50 cursor-pointer hover:scale-110 active:scale-95 transition-transform touch-manipulation"
            aria-label="Rolar para a esquerda"
          >
            <div className="bg-white/90 backdrop-blur-sm rounded-full p-1.5 sm:p-2 shadow-lg border border-gray-200 hover:bg-white hover:shadow-xl transition-all">
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600 animate-pulse" />
            </div>
          </button>
        )}
        
        {/* Seta indicativa de scroll horizontal - direita */}
        {canScrollRight && (
          <button
            onClick={() => {
              if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollBy({
                  left: 400,
                  behavior: 'smooth'
                });
              }
            }}
            className="flex fixed right-2 sm:right-4 top-1/2 -translate-y-1/2 z-50 cursor-pointer hover:scale-110 active:scale-95 transition-transform touch-manipulation"
            aria-label="Rolar para a direita"
          >
            <div className="bg-white/90 backdrop-blur-sm rounded-full p-1.5 sm:p-2 shadow-lg border border-gray-200 hover:bg-white hover:shadow-xl transition-all">
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600 animate-pulse" />
            </div>
          </button>
        )}
      </div>
    );
  }

