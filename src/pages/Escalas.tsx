import { useState, useEffect, useMemo } from "react";
import type React from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Calendar,
  Users,
  Lock,
  Unlock,
  Plus,
  GripVertical,
  X,
  UserPlus,
  Edit,
  Trash2,
} from "lucide-react";
import { formatDateBR, getWeekStartDate } from "@/lib/dateUtils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type AreaServico = "midia" | "domingo_kids" | "louvor" | "mesa_som" | "cantina";

interface Servo {
  id: string;
  nome: string;
  telefone?: string;
  email?: string;
  ativo: boolean;
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

interface Escala {
  id: string;
  semana_inicio: string;
  area: AreaServico;
  servo_id: string;
  servo_name: string | null;
  dia: "sabado" | "domingo";
  locked: boolean;
  created_by: string;
  funcao_louvor?: FuncaoLouvor | null;
}

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

const AREAS: { value: AreaServico; label: string; color: string }[] = [
  { value: "midia", label: "Mídia", color: "bg-blue-500" },
  { value: "domingo_kids", label: "Domingo Kids", color: "bg-purple-500" },
  { value: "louvor", label: "Louvor", color: "bg-yellow-500" },
  { value: "mesa_som", label: "Mesa de Som", color: "bg-green-500" },
  { value: "cantina", label: "Cantina", color: "bg-orange-500" },
];

export function Escalas() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [escalas, setEscalas] = useState<Escala[]>([]);
  const [servos, setServos] = useState<Servo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState<string>("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    escalaId: string | null;
  }>({ open: false, escalaId: null });
  const [servoDialog, setServoDialog] = useState<{
    open: boolean;
    servo: Servo | null;
  }>({ open: false, servo: null });
  const [servoFormData, setServoFormData] = useState({
    nome: "",
    telefone: "",
    email: "",
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Verificar se o usuário pode editar
  const canEdit = useMemo(() => {
    return user?.role === "pastor" || user?.role === "discipulador" || user?.role === "lider";
  }, [user]);

  // Inicializar semana atual (sábado da semana)
  useEffect(() => {
    const today = new Date();
    const saturday = getWeekStartDate(today); // Retorna o sábado da semana
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

      // Carregar servos (todos se for autorizado, apenas ativos se não for)
      let servosQuery = supabase
        .from("servos")
        .select("id, nome, telefone, email, ativo")
        .order("nome");
      
      if (!canEdit) {
        servosQuery = servosQuery.eq("ativo", true);
      }
      
      const { data: servosData, error: servosError } = await servosQuery;

      if (servosError) throw servosError;
      setServos(servosData || []);

      // Carregar escalas da semana selecionada
      const { data: escalasData, error: escalasError } = await supabase
        .from("escalas")
        .select(`
          id,
          semana_inicio,
          area,
          servo_id,
          dia,
          locked,
          created_by,
          funcao_louvor
        `)
        .eq("semana_inicio", selectedWeek)
        .order("area, dia, funcao_louvor");

      if (escalasError) throw escalasError;

      // Buscar nomes dos servos separadamente
      const servoIds = [...new Set((escalasData || []).map((e: any) => e.servo_id).filter(Boolean))];
      const servosMap: Record<string, string> = {};
      
      if (servoIds.length > 0) {
        const { data: servosInfo, error: servosInfoError } = await supabase
          .from("servos")
          .select("id, nome")
          .in("id", servoIds);
        
        if (!servosInfoError && servosInfo) {
          servosInfo.forEach((s: any) => {
            servosMap[s.id] = s.nome;
          });
        }
      }

      // Mapear escalas, mantendo todas mesmo se o servo não existir mais
      const formattedEscalas: Escala[] = (escalasData || []).map((e: any) => ({
        id: e.id,
        semana_inicio: e.semana_inicio,
        area: e.area,
        servo_id: e.servo_id,
        servo_name: servosMap[e.servo_id] || null,
        dia: e.dia,
        locked: e.locked,
        created_by: e.created_by,
        funcao_louvor: e.funcao_louvor || null,
      }));

      setEscalas(formattedEscalas);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados das escalas",
        variant: "destructive",
      });
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
    };

    escalas.forEach((escala) => {
      organized[escala.area][escala.dia].push(escala);
    });

    // Ordenar escalas de louvor por função (ordem definida em FUNCOES_LOUVOR)
    const ordenarPorFuncao = (a: Escala, b: Escala) => {
      const indexA = FUNCOES_LOUVOR.findIndex((f) => f.value === a.funcao_louvor);
      const indexB = FUNCOES_LOUVOR.findIndex((f) => f.value === b.funcao_louvor);
      
      // Se não tiver função, vai para o final
      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      
      return indexA - indexB;
    };

    organized.louvor.sabado.sort(ordenarPorFuncao);
    organized.louvor.domingo.sort(ordenarPorFuncao);

    return organized;
  }, [escalas]);

  // Servos disponíveis (não escalados no dia em nenhum setor)
  const getAvailableServos = (area: AreaServico, dia: "sabado" | "domingo") => {
    // Buscar todos os servos escalados neste dia em QUALQUER setor
    const escaladosIds = escalas
      .filter((e) => e.dia === dia && e.semana_inicio === selectedWeek)
      .map((e) => e.servo_id)
      .filter((id) => id && servos.some((s) => s.id === id)); // Apenas IDs de servos que existem
    
    // Retornar apenas servos ativos que não estão escalados neste dia
    return servos.filter(
      (s) => s.ativo && s.id && !escaladosIds.includes(s.id)
    );
  };

  // Funções para gerenciar servos
  const handleOpenServoDialog = (servo?: Servo) => {
    if (servo) {
      setServoFormData({
        nome: servo.nome,
        telefone: servo.telefone || "",
        email: servo.email || "",
      });
      setServoDialog({ open: true, servo });
    } else {
      setServoFormData({ nome: "", telefone: "", email: "" });
      setServoDialog({ open: true, servo: null });
    }
  };

  const handleSaveServo = async () => {
    if (!servoFormData.nome.trim()) {
      toast({
        title: "Erro",
        description: "O nome do servo é obrigatório",
        variant: "destructive",
      });
      return;
    }

    try {
      if (servoDialog.servo) {
        // Atualizar servo existente
        const { error } = await supabase
          .from("servos")
          .update({
            nome: servoFormData.nome.trim(),
            telefone: servoFormData.telefone.trim() || null,
            email: servoFormData.email.trim() || null,
          })
          .eq("id", servoDialog.servo.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Servo atualizado com sucesso",
        });
      } else {
        // Criar novo servo
        const { error } = await supabase.from("servos").insert({
          nome: servoFormData.nome.trim(),
          telefone: servoFormData.telefone.trim() || null,
          email: servoFormData.email.trim() || null,
          ativo: true,
        });

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Servo criado com sucesso",
        });
      }

      setServoDialog({ open: false, servo: null });
      // Aguardar um pouco para garantir que o banco processou
      await new Promise((resolve) => setTimeout(resolve, 500));
      loadData();
    } catch (error: any) {
      console.error("Error saving servo:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar servo",
        variant: "destructive",
      });
    }
  };

  const handleDeleteServo = async (servoId: string) => {
    try {
      // Verificar se o servo está em alguma escala
      const { data: escalasComServo } = await supabase
        .from("escalas")
        .select("id")
        .eq("servo_id", servoId)
        .limit(1);

      if (escalasComServo && escalasComServo.length > 0) {
        // Desativar ao invés de deletar
        const { error } = await supabase
          .from("servos")
          .update({ ativo: false })
          .eq("id", servoId);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Servo desativado (está em escalas existentes)",
        });
      } else {
        // Deletar se não estiver em nenhuma escala
        const { error } = await supabase.from("servos").delete().eq("id", servoId);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Servo removido com sucesso",
        });
      }

      loadData();
    } catch (error: any) {
      console.error("Error deleting servo:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover servo",
        variant: "destructive",
      });
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || !canEdit) return;

    const escalaId = active.id as string;
    const escala = escalas.find((e) => e.id === escalaId);
    if (!escala) return;

    // Verificar se está tentando mover para uma área/dia diferente
    const overId = over.id as string;
    const parts = overId.split("|");
    const targetArea = parts[0] as AreaServico;
    const targetDia = parts[1] as "sabado" | "domingo";
    const targetFuncao = parts[2] as FuncaoLouvor | undefined;

    // Se for louvor, precisa ter função
    if (targetArea === "louvor" && !targetFuncao) {
      return; // Não pode mover para louvor sem função
    }

    if (
      escala.area === targetArea &&
      escala.dia === targetDia &&
      escala.funcao_louvor === targetFuncao
    ) {
      return; // Mesma posição
    }

    // Verificar se o servo já está escalado no dia de destino
    const alreadyScaled = escalas.some(
      (e) =>
        e.servo_id === escala.servo_id &&
        e.dia === targetDia &&
        e.semana_inicio === selectedWeek
    );

    if (alreadyScaled) {
      toast({
        title: "Erro",
        description: "Este servo já está escalado para este dia",
        variant: "destructive",
      });
      return;
    }

    // Atualizar escala
    try {
      const updateData: any = {
        area: targetArea,
        dia: targetDia,
      };

      // Se for louvor, atualizar função
      if (targetArea === "louvor" && targetFuncao) {
        updateData.funcao_louvor = targetFuncao;
      } else {
        // Se não for louvor, remover função
        updateData.funcao_louvor = null;
      }

      const { error } = await supabase
        .from("escalas")
        .update(updateData)
        .eq("id", escalaId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Escala atualizada com sucesso",
      });

      loadData();
    } catch (error: any) {
      console.error("Error updating escala:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar escala",
        variant: "destructive",
      });
    }
  };

  const handleAddServo = async (
    area: AreaServico,
    dia: "sabado" | "domingo",
    servoId: string,
    funcaoLouvor?: FuncaoLouvor
  ) => {
    if (!canEdit || !user?.id) return;

    if (!servoId || servoId.trim() === "") {
      toast({
        title: "Erro",
        description: "ID do servo inválido",
        variant: "destructive",
      });
      return;
    }

    // Verificar se o servo existe e está ativo no banco
    const { data: servosData, error: servosError } = await supabase
      .from("servos")
      .select("id, nome, ativo")
      .eq("id", servoId)
      .eq("ativo", true)
      .single();

    if (servosError || !servosData) {
      toast({
        title: "Erro",
        description: "Servo não encontrado ou inativo. Por favor, selecione outro servo.",
        variant: "destructive",
      });
      // Recarregar lista de servos
      loadData();
      return;
    }

    // Verificar se o servo já está escalado neste dia
    const alreadyScaled = escalas.some(
      (e) => e.servo_id === servoId && e.dia === dia && e.semana_inicio === selectedWeek
    );

    if (alreadyScaled) {
      toast({
        title: "Erro",
        description: "Este servo já está escalado para este dia",
        variant: "destructive",
      });
      return;
    }

    try {
      const insertData: any = {
        semana_inicio: selectedWeek,
        area,
        servo_id: servoId,
        dia,
        locked: false,
        created_by: user.id,
      };

      // Adicionar função do louvor se for área de louvor
      if (area === "louvor" && funcaoLouvor) {
        insertData.funcao_louvor = funcaoLouvor;
      }

      const { error } = await supabase.from("escalas").insert(insertData);

      if (error) {
        if (error.code === "23503") {
          toast({
            title: "Erro",
            description: "Servo não encontrado no banco de dados. Recarregando dados...",
            variant: "destructive",
          });
          loadData();
          return;
        }
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "Servo adicionado à escala",
      });

      loadData();
    } catch (error: any) {
      console.error("Error adding servo:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao adicionar servo",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEscala = async (escalaId: string) => {
    if (!canEdit) return;

    try {
      const { error } = await supabase
        .from("escalas")
        .delete()
        .eq("id", escalaId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Servo removido da escala",
      });

      loadData();
      setDeleteDialog({ open: false, escalaId: null });
    } catch (error: any) {
      console.error("Error deleting escala:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover servo",
        variant: "destructive",
      });
    }
  };

  const handleLockEscala = async (escalaId: string, locked: boolean) => {
    if (!canEdit) return;

    try {
      const { error } = await supabase
        .from("escalas")
        .update({ locked })
        .eq("id", escalaId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: locked ? "Escala bloqueada" : "Escala desbloqueada",
      });

      loadData();
    } catch (error: any) {
      console.error("Error locking escala:", error);
      toast({
        title: "Erro",
        description: "Erro ao alterar status da escala",
        variant: "destructive",
      });
    }
  };

  const getNextWeek = () => {
    const current = new Date(selectedWeek);
    current.setDate(current.getDate() + 7);
    return current.toISOString().split("T")[0];
  };

  const getPreviousWeek = () => {
    const current = new Date(selectedWeek);
    current.setDate(current.getDate() - 7);
    return current.toISOString().split("T")[0];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando escalas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-4">
      {/* Header */}
      <div className="space-y-3 sm:space-y-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Escalas</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Gerencie as escalas semanais de serviço
            </p>
          </div>
          {canEdit && (
            <Button
              onClick={() => handleOpenServoDialog()}
              className="w-full sm:w-auto"
              size={isMobile ? "sm" : "default"}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Novo Servo
            </Button>
          )}
        </div>

        {/* Navegação de Semana */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
          <Button
            variant="outline"
            onClick={() => setSelectedWeek(getPreviousWeek())}
            size={isMobile ? "sm" : "default"}
            className="flex-1 sm:flex-none"
          >
            <span className="hidden sm:inline">Semana Anterior</span>
            <span className="sm:hidden">Anterior</span>
          </Button>
          <div className="flex items-center justify-center gap-2 sm:gap-3 px-3 py-2 bg-muted/50 rounded-lg flex-1 sm:flex-none">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            {selectedWeek ? (() => {
              const sabado = new Date(selectedWeek);
              const domingo = new Date(sabado);
              domingo.setDate(sabado.getDate() + 1);
              return (
                <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                  <div className="flex flex-col items-center sm:items-start">
                    <span className="text-xs text-muted-foreground">Sáb</span>
                    <span className="font-medium">{formatDateBR(sabado)}</span>
                  </div>
                  <span className="text-muted-foreground">•</span>
                  <div className="flex flex-col items-center sm:items-start">
                    <span className="text-xs text-muted-foreground">Dom</span>
                    <span className="font-medium">{formatDateBR(domingo)}</span>
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
            size={isMobile ? "sm" : "default"}
            className="flex-1 sm:flex-none"
          >
            <span className="hidden sm:inline">Próxima Semana</span>
            <span className="sm:hidden">Próxima</span>
          </Button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Grid de áreas - Scroll horizontal em mobile */}
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 pb-4 sm:pb-0">
          <div className="grid grid-cols-[280px] sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 min-w-max sm:min-w-0">
            {AREAS.map((area) => (
              <Card key={area.value} className="flex flex-col min-w-[280px] sm:min-w-0">
                <CardHeader className={`${area.color} text-white p-3 sm:p-6`}>
                  <CardTitle className="text-base sm:text-lg">{area.label}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-3 sm:p-4 space-y-3 sm:space-y-4">
                {/* Sábado - Não mostrar para Domingo Kids */}
                {area.value !== "domingo_kids" && (
                  area.value === "louvor" ? (
                    // Renderização especial para Louvor com subcategorias
                    <div className="space-y-2 sm:space-y-3">
                      <h3 className="font-semibold text-xs sm:text-sm">Sábado</h3>
                      {FUNCOES_LOUVOR.map((funcao) => {
                        const escalasFuncao = escalasPorArea[area.value].sabado.filter(
                          (e) => e.funcao_louvor === funcao.value
                        );
                        return (
                          <div key={funcao.value} className="space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="text-[10px] sm:text-xs font-medium text-muted-foreground truncate">
                                {funcao.label}:
                              </h4>
                              {canEdit && (
                                <Select
                                  key={`${area.value}-sabado-${funcao.value}-${servos.length}`}
                                  onValueChange={async (value) => {
                                    if (value && value.trim() !== "") {
                                      await handleAddServo(
                                        area.value,
                                        "sabado",
                                        value,
                                        funcao.value
                                      );
                                    }
                                  }}
                                >
                                  <SelectTrigger className="h-6 w-6 p-0 flex-shrink-0">
                                    <Plus className="h-3 w-3" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {getAvailableServos(area.value, "sabado").length ===
                                    0 ? (
                                      <div className="p-2 text-sm text-muted-foreground text-center">
                                        Nenhum servo disponível
                                      </div>
                                    ) : (
                                      getAvailableServos(area.value, "sabado")
                                        .filter((s) => s.ativo && s.id)
                                        .map((servo) => (
                                          <SelectItem key={servo.id} value={servo.id}>
                                            {servo.nome}
                                          </SelectItem>
                                        ))
                                    )}
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                            <DroppableArea id={`${area.value}|sabado|${funcao.value}`}>
                              <SortableContext
                                items={escalasFuncao.map((e) => e.id)}
                                strategy={verticalListSortingStrategy}
                              >
                                <div className="space-y-1 min-h-[24px] sm:min-h-[30px]">
                                  {escalasFuncao.map((escala) => (
                                    <EscalaItem
                                      key={escala.id}
                                      escala={escala}
                                      canEdit={canEdit}
                                      onDelete={() =>
                                        setDeleteDialog({
                                          open: true,
                                          escalaId: escala.id,
                                        })
                                      }
                                      onLock={() =>
                                        handleLockEscala(escala.id, !escala.locked)
                                      }
                                    />
                                  ))}
                                </div>
                              </SortableContext>
                            </DroppableArea>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    // Renderização normal para outros setores
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-xs sm:text-sm">Sábado</h3>
                        {canEdit && (
                          <Select
                            key={`${area.value}-sabado-${servos.length}`}
                            onValueChange={async (value) => {
                              if (value && value.trim() !== "") {
                                await handleAddServo(area.value, "sabado", value);
                              }
                            }}
                          >
                            <SelectTrigger className="h-6 w-6 sm:h-7 sm:w-7 p-0 flex-shrink-0">
                              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                            </SelectTrigger>
                            <SelectContent>
                              {getAvailableServos(area.value, "sabado").length === 0 ? (
                                <div className="p-2 text-sm text-muted-foreground text-center">
                                  Nenhum servo disponível
                                </div>
                              ) : (
                                getAvailableServos(area.value, "sabado")
                                  .filter((s) => s.ativo && s.id)
                                  .map((servo) => (
                                    <SelectItem key={servo.id} value={servo.id}>
                                      {servo.nome}
                                    </SelectItem>
                                  ))
                              )}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      <DroppableArea id={`${area.value}|sabado`}>
                        <SortableContext
                          items={escalasPorArea[area.value].sabado.map(
                            (e) => e.id
                          )}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-1.5 sm:space-y-2 min-h-[40px] sm:min-h-[50px]">
                            {escalasPorArea[area.value].sabado.map((escala) => (
                              <EscalaItem
                                key={escala.id}
                                escala={escala}
                                canEdit={canEdit}
                                onDelete={() =>
                                  setDeleteDialog({ open: true, escalaId: escala.id })
                                }
                                onLock={() =>
                                  handleLockEscala(escala.id, !escala.locked)
                                }
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DroppableArea>
                    </div>
                  )
                )}

                {/* Domingo */}
                {area.value === "louvor" ? (
                  // Renderização especial para Louvor com subcategorias
                  <div className="space-y-2 sm:space-y-3">
                    <h3 className="font-semibold text-xs sm:text-sm">Domingo</h3>
                    {FUNCOES_LOUVOR.map((funcao) => {
                      const escalasFuncao = escalasPorArea[area.value].domingo.filter(
                        (e) => e.funcao_louvor === funcao.value
                      );
                      return (
                        <div key={funcao.value} className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-[10px] sm:text-xs font-medium text-muted-foreground truncate">
                              {funcao.label}:
                            </h4>
                            {canEdit && (
                              <Select
                                key={`${area.value}-domingo-${funcao.value}-${servos.length}`}
                                onValueChange={async (value) => {
                                  if (value && value.trim() !== "") {
                                    await handleAddServo(
                                      area.value,
                                      "domingo",
                                      value,
                                      funcao.value
                                    );
                                  }
                                }}
                              >
                                <SelectTrigger className="h-6 w-6 p-0 flex-shrink-0">
                                  <Plus className="h-3 w-3" />
                                </SelectTrigger>
                                <SelectContent>
                                  {getAvailableServos(area.value, "domingo").length ===
                                  0 ? (
                                    <div className="p-2 text-sm text-muted-foreground text-center">
                                      Nenhum servo disponível
                                    </div>
                                  ) : (
                                    getAvailableServos(area.value, "domingo")
                                      .filter((s) => s.ativo && s.id)
                                      .map((servo) => (
                                        <SelectItem key={servo.id} value={servo.id}>
                                          {servo.nome}
                                        </SelectItem>
                                      ))
                                  )}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                          <DroppableArea id={`${area.value}|domingo|${funcao.value}`}>
                            <SortableContext
                              items={escalasFuncao.map((e) => e.id)}
                              strategy={verticalListSortingStrategy}
                            >
                              <div className="space-y-1 min-h-[30px]">
                                {escalasFuncao.map((escala) => (
                                  <EscalaItem
                                    key={escala.id}
                                    escala={escala}
                                    canEdit={canEdit}
                                    onDelete={() =>
                                      setDeleteDialog({
                                        open: true,
                                        escalaId: escala.id,
                                      })
                                    }
                                    onLock={() =>
                                      handleLockEscala(escala.id, !escala.locked)
                                    }
                                  />
                                ))}
                              </div>
                            </SortableContext>
                          </DroppableArea>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  // Renderização normal para outros setores
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm">Domingo</h3>
                      {canEdit && (
                        <Select
                          key={`${area.value}-domingo-${servos.length}`}
                          onValueChange={async (value) => {
                            if (value && value.trim() !== "") {
                              await handleAddServo(area.value, "domingo", value);
                            }
                          }}
                        >
                          <SelectTrigger className="h-7 w-7 p-0">
                            <Plus className="h-4 w-4" />
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailableServos(area.value, "domingo").length === 0 ? (
                              <div className="p-2 text-sm text-muted-foreground text-center">
                                Nenhum servo disponível
                              </div>
                            ) : (
                              getAvailableServos(area.value, "domingo")
                                .filter((s) => s.ativo && s.id)
                                .map((servo) => (
                                  <SelectItem key={servo.id} value={servo.id}>
                                    {servo.nome}
                                  </SelectItem>
                                ))
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <DroppableArea id={`${area.value}|domingo`}>
                      <SortableContext
                        items={escalasPorArea[area.value].domingo.map(
                          (e) => e.id
                        )}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-1.5 sm:space-y-2 min-h-[40px] sm:min-h-[50px]">
                          {escalasPorArea[area.value].domingo.map((escala) => (
                            <EscalaItem
                              key={escala.id}
                              escala={escala}
                              canEdit={canEdit}
                              onDelete={() =>
                                setDeleteDialog({ open: true, escalaId: escala.id })
                              }
                              onLock={() =>
                                handleLockEscala(escala.id, !escala.locked)
                              }
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DroppableArea>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          </div>
        </div>

        <DragOverlay>
          {activeId ? (
            <div className="bg-background border rounded-md sm:rounded-lg p-2 shadow-lg text-sm">
              {escalas.find((e) => e.id === activeId)?.servo_name || "Servo removido"}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog({ open, escalaId: deleteDialog.escalaId })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover da escala?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este servo da escala? Esta ação
              não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteDialog.escalaId &&
                handleDeleteEscala(deleteDialog.escalaId)
              }
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog para criar/editar servos */}
      <Dialog
        open={servoDialog.open}
        onOpenChange={(open) => setServoDialog({ open, servo: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {servoDialog.servo ? "Editar Servo" : "Novo Servo"}
            </DialogTitle>
            <DialogDescription>
              {servoDialog.servo
                ? "Atualize as informações do servo"
                : "Adicione um novo servo para as escalas"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={servoFormData.nome}
                onChange={(e) =>
                  setServoFormData({ ...servoFormData, nome: e.target.value })
                }
                placeholder="Nome completo do servo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={servoFormData.telefone}
                onChange={(e) =>
                  setServoFormData({ ...servoFormData, telefone: e.target.value })
                }
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={servoFormData.email}
                onChange={(e) =>
                  setServoFormData({ ...servoFormData, email: e.target.value })
                }
                placeholder="email@exemplo.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setServoDialog({ open: false, servo: null })}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveServo}>
              {servoDialog.servo ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Seção de gerenciamento de servos */}
      {canEdit && (
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <span className="text-lg sm:text-xl">Gerenciar Servos</span>
              <Button
                variant="outline"
                size={isMobile ? "sm" : "default"}
                onClick={() => handleOpenServoDialog()}
                className="w-full sm:w-auto"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Novo Servo
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {servos.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-muted-foreground">
                <Users className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                <p className="text-sm sm:text-base">Nenhum servo cadastrado</p>
                <p className="text-xs sm:text-sm mt-1">Clique em "Novo Servo" para adicionar</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {servos.map((servo) => (
                  <Card
                    key={servo.id}
                    className={`relative ${!servo.ativo ? "opacity-60" : ""}`}
                  >
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-sm sm:text-base truncate">{servo.nome}</h3>
                            {!servo.ativo && (
                              <Badge variant="secondary" className="text-[10px] sm:text-xs flex-shrink-0">
                                Inativo
                              </Badge>
                            )}
                          </div>
                          {servo.telefone && (
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">
                              {servo.telefone}
                            </p>
                          )}
                          {servo.email && (
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">
                              {servo.email}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleOpenServoDialog(servo)}
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive"
                            onClick={() => handleDeleteServo(servo.id)}
                            title="Remover"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface EscalaItemProps {
  escala: Escala;
  canEdit: boolean;
  onDelete: () => void;
  onLock: () => void;
}

function DroppableArea({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`${isOver ? "bg-muted/50 rounded-lg" : ""} transition-colors`}
    >
      {children}
    </div>
  );
}

function EscalaItem({ escala, canEdit, onDelete, onLock }: EscalaItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: escala.id,
    disabled: !canEdit || escala.locked,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-card border rounded-lg p-2 flex items-center justify-between group ${
        escala.locked ? "opacity-75" : ""
      } ${canEdit && !escala.locked ? "cursor-move" : ""}`}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {canEdit && !escala.locked && (
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
        <span className="text-sm font-medium truncate">
          {escala.servo_name || "Servo removido"}
        </span>
        {!escala.servo_name && (
          <Badge variant="destructive" className="ml-1 text-xs">
            Inválido
          </Badge>
        )}
        {escala.locked && (
          <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
        )}
      </div>
      {canEdit && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onLock}
            title={escala.locked ? "Desbloquear" : "Bloquear"}
          >
            {escala.locked ? (
              <Lock className="h-3 w-3" />
            ) : (
              <Unlock className="h-3 w-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-destructive"
            onClick={onDelete}
            title="Remover"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}

