import { useState, useEffect, useMemo } from "react";
import type React from "react";
import { supabase } from "@/integrations/supabase/client";
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
  MessageSquare,
  Copy,
} from "lucide-react";
import { formatDateBR, getWeekStartDate } from "@/lib/dateUtils";
import logoVideira from "@/assets/logo-videira.png";
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

type AreaServico = "midia" | "domingo_kids" | "louvor" | "mesa_som" | "cantina" | "conexao";

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

type FuncaoConexao =
  | "recepcao1"
  | "recepcao2"
  | "estacionamento1"
  | "estacionamento2"
  | "nave_igreja"
  | "porta_kids";

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
  funcao_conexao?: FuncaoConexao | null;
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

export function PublicEscalasEdit() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [escalas, setEscalas] = useState<Escala[]>([]);
  const [servos, setServos] = useState<Servo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState<string>("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [systemProfileId, setSystemProfileId] = useState<string | null>(null);
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

  // Sempre permitir edição na versão pública
  const canEdit = true;

  // Obter profile ID do sistema (primeiro pastor encontrado) para usar como created_by
  useEffect(() => {
    const fetchSystemProfileId = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id")
          .eq("role", "pastor")
          .limit(1)
          .single();
        
        if (!error && data) {
          setSystemProfileId(data.id);
        } else {
          // Se não encontrar pastor, buscar qualquer perfil
          const { data: anyProfile } = await supabase
            .from("profiles")
            .select("id")
            .limit(1)
            .single();
          
          if (anyProfile) {
            setSystemProfileId(anyProfile.id);
          }
        }
      } catch (error) {
        console.error("Error fetching system profile:", error);
      }
    };

    fetchSystemProfileId();
  }, []);

  // Inicializar semana atual (sábado da semana)
  useEffect(() => {
    const today = new Date();
    const monday = getWeekStartDate(today); // Retorna a segunda-feira da semana
    const saturday = new Date(monday);
    saturday.setDate(monday.getDate() + 5); // Segunda + 5 dias = sábado
    setSelectedWeek(saturday.toISOString().split("T")[0]);
  }, []);

  // Carregar dados e validar semana
  useEffect(() => {
    if (selectedWeek) {
      loadData();
    }
  }, [selectedWeek]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Carregar todos os servos (versão pública permite editar tudo)
      const { data: servosData, error: servosError } = await supabase
        .from("servos")
        .select("id, nome, telefone, email, ativo")
        .order("nome");

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
          funcao_louvor,
          funcao_conexao
        `)
        .eq("semana_inicio", selectedWeek)
        .order("area, dia, funcao_louvor, funcao_conexao");

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
        funcao_conexao: e.funcao_conexao || null,
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
      conexao: { sabado: [], domingo: [] },
    };

    escalas.forEach((escala) => {
      organized[escala.area][escala.dia].push(escala);
    });

    // Ordenar escalas de louvor por função (ordem definida em FUNCOES_LOUVOR)
    const ordenarPorFuncaoLouvor = (a: Escala, b: Escala) => {
      const indexA = FUNCOES_LOUVOR.findIndex((f) => f.value === a.funcao_louvor);
      const indexB = FUNCOES_LOUVOR.findIndex((f) => f.value === b.funcao_louvor);
      
      // Se não tiver função, vai para o final
      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      
      return indexA - indexB;
    };

    // Ordenar escalas de conexão por função (ordem definida em FUNCOES_CONEXAO)
    const ordenarPorFuncaoConexao = (a: Escala, b: Escala) => {
      const indexA = FUNCOES_CONEXAO.findIndex((f) => f.value === a.funcao_conexao);
      const indexB = FUNCOES_CONEXAO.findIndex((f) => f.value === b.funcao_conexao);
      
      // Se não tiver função, vai para o final
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

  // Gerar mensagem formatada para WhatsApp
  const generateWhatsAppMessage = () => {
    if (!selectedWeek) {
      toast({
        title: "Erro",
        description: "Selecione uma semana primeiro",
        variant: "destructive",
      });
      return;
    }

    const sabado = new Date(selectedWeek);
    const domingo = new Date(sabado);
    domingo.setDate(sabado.getDate() + 1); // Sábado + 1 dia = domingo

    let message = `*LEMBRETE DE ESCALA DA SEMANA*\n\n`;
    message += `*${formatDateBR(sabado)}* (Sábado) e *${formatDateBR(domingo)}* (Domingo)\n\n`;
    message += `═══════════════════════\n\n`;

    AREAS.forEach((area) => {
      const areaLabel = area.label;
      const escalasSabado = escalasPorArea[area.value].sabado;
      const escalasDomingo = escalasPorArea[area.value].domingo;

      // Pular se não houver escalas e for domingo_kids (só domingo)
      if (area.value === "domingo_kids" && escalasDomingo.length === 0) {
        return;
      }

      // Pular se não houver escalas em nenhum dia
      if (escalasSabado.length === 0 && escalasDomingo.length === 0) {
        return;
      }

      message += `*${areaLabel}*\n`;

      // Sábado (exceto domingo_kids)
      if (area.value !== "domingo_kids" && escalasSabado.length > 0) {
        message += `\n*Sábado (${formatDateBR(sabado)})*\n`;

        if (area.value === "louvor" || area.value === "conexao") {
          // Agrupar por função
          const funcoes = area.value === "louvor" ? FUNCOES_LOUVOR : FUNCOES_CONEXAO;
          funcoes.forEach((funcao) => {
            const escalasFuncao = escalasSabado.filter(
              (e) =>
                area.value === "louvor"
                  ? e.funcao_louvor === funcao.value
                  : e.funcao_conexao === funcao.value
            );
            if (escalasFuncao.length > 0) {
              message += `  - ${funcao.label}: `;
              message += escalasFuncao
                .map((e) => e.servo_name || "Servo removido")
                .join(", ");
              message += `\n`;
            }
          });
        } else {
          // Lista simples
          escalasSabado.forEach((escala) => {
            message += `  - ${escala.servo_name || "Servo removido"}\n`;
          });
        }
      }

      // Domingo
      if (escalasDomingo.length > 0) {
        message += `\n*Domingo (${formatDateBR(domingo)})*\n`;

        if (area.value === "louvor" || area.value === "conexao") {
          // Agrupar por função
          const funcoes = area.value === "louvor" ? FUNCOES_LOUVOR : FUNCOES_CONEXAO;
          funcoes.forEach((funcao) => {
            const escalasFuncao = escalasDomingo.filter(
              (e) =>
                area.value === "louvor"
                  ? e.funcao_louvor === funcao.value
                  : e.funcao_conexao === funcao.value
            );
            if (escalasFuncao.length > 0) {
              message += `  - ${funcao.label}: `;
              message += escalasFuncao
                .map((e) => e.servo_name || "Servo removido")
                .join(", ");
              message += `\n`;
            }
          });
        } else {
          // Lista simples
          escalasDomingo.forEach((escala) => {
            message += `  - ${escala.servo_name || "Servo removido"}\n`;
          });
        }
      }

      message += `\n`;
    });

    message += `═══════════════════════\n`;
    message += `Que Deus abencoe a todos!`;

    return message;
  };

  // Copiar mensagem para área de transferência
  const handleCopyMessage = async () => {
    const message = generateWhatsAppMessage();
    if (!message) return;

    try {
      await navigator.clipboard.writeText(message);
      toast({
        title: "Sucesso",
        description: "Mensagem copiada para a área de transferência!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao copiar mensagem",
        variant: "destructive",
      });
    }
  };

  // Abrir WhatsApp com mensagem pré-formatada (modo manual)
  const handleOpenWhatsApp = () => {
    const message = generateWhatsAppMessage();
    if (!message) return;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
  };

  // Enviar lembretes automáticos para cada servo via WhatsApp
  const handleSendReminders = async () => {
    if (!selectedWeek) {
      toast({
        title: "Erro",
        description: "Selecione uma semana primeiro",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('send-escalas-reminders', {
        body: {
          semana_inicio: selectedWeek,
        },
      });

      if (error) {
        throw new Error(error.message || "Erro ao enviar lembretes");
      }

      if (data?.success) {
        const sentCount = data.sent || 0;
        toast({
          title: "Sucesso!",
          description: `Lembretes enviados para ${sentCount} servo${sentCount !== 1 ? 's' : ''} via WhatsApp`,
          duration: 5000,
        });
      } else {
        throw new Error(data?.error || "Erro desconhecido");
      }
    } catch (error: any) {
      console.error("Erro ao enviar lembretes:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar lembretes",
        variant: "destructive",
      });
    }
  };

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
        // Atualizar servo existente - atualização otimista
        const updatedServo: Servo = {
          ...servoDialog.servo,
          nome: servoFormData.nome.trim(),
          telefone: servoFormData.telefone.trim() || undefined,
          email: servoFormData.email.trim() || undefined,
        };

        // Atualização otimista
        setServos((prevServos) =>
          prevServos.map((s) => (s.id === servoDialog.servo!.id ? updatedServo : s))
        );

        // Atualizar também nas escalas se o nome mudou
        if (servoDialog.servo.nome !== servoFormData.nome.trim()) {
          setEscalas((prevEscalas) =>
            prevEscalas.map((e) =>
              e.servo_id === servoDialog.servo!.id
                ? { ...e, servo_name: servoFormData.nome.trim() }
                : e
            )
          );
        }

        const { error } = await supabase
          .from("servos")
          .update({
            nome: servoFormData.nome.trim(),
            telefone: servoFormData.telefone.trim() || null,
            email: servoFormData.email.trim() || null,
          })
          .eq("id", servoDialog.servo.id);

        if (error) {
          // Reverter em caso de erro
          setServos((prevServos) =>
            prevServos.map((s) => (s.id === servoDialog.servo!.id ? servoDialog.servo! : s))
          );
          throw error;
        }
      } else {
        // Criar novo servo - adicionar otimisticamente
        const tempServoId = `temp-${Date.now()}-${Math.random()}`;
        const newServo: Servo = {
          id: tempServoId,
          nome: servoFormData.nome.trim(),
          telefone: servoFormData.telefone.trim() || undefined,
          email: servoFormData.email.trim() || undefined,
          ativo: true,
        };

        // Atualização otimista
        setServos((prevServos) => [...prevServos, newServo]);

        const { data: insertedData, error } = await supabase
          .from("servos")
          .insert({
            nome: servoFormData.nome.trim(),
            telefone: servoFormData.telefone.trim() || null,
            email: servoFormData.email.trim() || null,
            ativo: true,
          })
          .select()
          .single();

        if (error) {
          // Remover o servo temporário em caso de erro
          setServos((prevServos) =>
            prevServos.filter((s) => s.id !== tempServoId)
          );
          throw error;
        }

        // Substituir o servo temporário pelo real
        if (insertedData) {
          setServos((prevServos) =>
            prevServos.map((s) =>
              s.id === tempServoId
                ? {
                    ...s,
                    id: insertedData.id,
                  }
                : s
            )
          );
        }
      }

      setServoDialog({ open: false, servo: null });
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

      const servoToremove = servos.find((s) => s.id === servoId);
      
      if (escalasComServo && escalasComServo.length > 0) {
        // Desativar ao invés de deletar - atualização otimista
        setServos((prevServos) =>
          prevServos.map((s) =>
            s.id === servoId ? { ...s, ativo: false } : s
          )
        );

        const { error } = await supabase
          .from("servos")
          .update({ ativo: false })
          .eq("id", servoId);

        if (error) {
          // Reverter em caso de erro
          if (servoToremove) {
            setServos((prevServos) =>
              prevServos.map((s) => (s.id === servoId ? servoToremove : s))
            );
          }
          throw error;
        }
      } else {
        // Deletar se não estiver em nenhuma escala - remoção otimista
        setServos((prevServos) =>
          prevServos.filter((s) => s.id !== servoId)
        );

        const { error } = await supabase.from("servos").delete().eq("id", servoId);

        if (error) {
          // Reverter em caso de erro
          if (servoToremove) {
            setServos((prevServos) => [...prevServos, servoToremove]);
          }
          throw error;
        }
      }
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
    const escalaId = event.active.id as string;
    const escala = escalas.find((e) => e.id === escalaId);
    
    // Não permitir iniciar o arrasto se a escala estiver bloqueada
    if (escala && escala.locked) {
      toast({
        title: "Escala bloqueada",
        description: "Não é possível arrastar uma escala bloqueada.",
        variant: "destructive",
      });
      return;
    }
    
    setActiveId(escalaId);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || !canEdit) return;

    const escalaId = active.id as string;
    const escala = escalas.find((e) => e.id === escalaId);
    if (!escala) return;

    // Verificar se a escala está bloqueada - não permitir arrastar escalas bloqueadas
    if (escala.locked) {
      toast({
        title: "Escala bloqueada",
        description: "Não é possível mover uma escala bloqueada. Desbloqueie-a primeiro.",
        variant: "destructive",
      });
      return;
    }

    // Verificar se está tentando mover para uma área/dia diferente
    const overId = over.id as string;
    const parts = overId.split("|");
    const targetArea = parts[0] as AreaServico;
    const targetDia = parts[1] as "sabado" | "domingo";
    const targetFuncaoLouvor = parts[2] as FuncaoLouvor | undefined;
    const targetFuncaoConexao = parts[2] as FuncaoConexao | undefined;

    // Se for louvor, precisa ter função
    if (targetArea === "louvor" && !targetFuncaoLouvor) {
      return; // Não pode mover para louvor sem função
    }

    // Se for conexão, precisa ter função
    if (targetArea === "conexao" && !targetFuncaoConexao) {
      return; // Não pode mover para conexão sem função
    }

    if (
      escala.area === targetArea &&
      escala.dia === targetDia &&
      escala.funcao_louvor === targetFuncaoLouvor &&
      escala.funcao_conexao === targetFuncaoConexao
    ) {
      return; // Mesma posição
    }

    // Verificar se o servo já está escalado no dia de destino em OUTRA escala
    // (permitir mover a mesma escala de setor)
    const alreadyScaled = escalas.some(
      (e) =>
        e.id !== escala.id && // Excluir a própria escala que está sendo movida
        e.servo_id === escala.servo_id &&
        e.dia === targetDia &&
        e.semana_inicio === selectedWeek
    );

    if (alreadyScaled) {
      toast({
        title: "Erro",
        description: "Este servo já está escalado para este dia em outro setor",
        variant: "destructive",
      });
      return;
    }

    // Atualizar escala - atualização otimista
    const updateData: any = {
      area: targetArea,
      dia: targetDia,
    };

    // Se for louvor, atualizar função
    if (targetArea === "louvor" && targetFuncaoLouvor) {
      updateData.funcao_louvor = targetFuncaoLouvor;
      updateData.funcao_conexao = null;
    } else if (targetArea === "conexao" && targetFuncaoConexao) {
      // Se for conexão, atualizar função
      updateData.funcao_conexao = targetFuncaoConexao;
      updateData.funcao_louvor = null;
    } else {
      // Se não for louvor nem conexão, remover funções
      updateData.funcao_louvor = null;
      updateData.funcao_conexao = null;
    }

    // Guardar o estado anterior para possível reversão
    const previousEscala = escala;

    // Atualização otimista - atualiza o estado imediatamente
    setEscalas((prevEscalas) =>
      prevEscalas.map((e) =>
        e.id === escalaId
          ? {
              ...e,
              area: targetArea,
              dia: targetDia,
              funcao_louvor: updateData.funcao_louvor,
              funcao_conexao: updateData.funcao_conexao,
            }
          : e
      )
    );

    try {
      const { error } = await supabase
        .from("escalas")
        .update(updateData)
        .eq("id", escalaId);

      if (error) throw error;

      // Sucesso silencioso - não precisa mostrar toast para cada movimento
    } catch (error: any) {
      console.error("Error updating escala:", error);
      
      // Reverter a atualização otimista em caso de erro
      setEscalas((prevEscalas) =>
        prevEscalas.map((e) =>
          e.id === escalaId ? previousEscala : e
        )
      );
      
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
    funcaoLouvor?: FuncaoLouvor,
    funcaoConexao?: FuncaoConexao
  ) => {
    if (!canEdit || !systemProfileId) {
      toast({
        title: "Aguarde",
        description: "Carregando sistema...",
      });
      return;
    }

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

    // Buscar o nome do servo na lista local
    const servo = servos.find((s) => s.id === servoId);
    const servoName = servo?.nome || "Carregando...";

    // Criar uma escala temporária para adição otimista
    const tempEscalaId = `temp-${Date.now()}-${Math.random()}`;
    const novaEscala: Escala = {
      id: tempEscalaId,
      semana_inicio: selectedWeek,
      area,
      servo_id: servoId,
      servo_name: servoName,
      dia,
      locked: false,
      created_by: systemProfileId,
      funcao_louvor: area === "louvor" ? funcaoLouvor : null,
      funcao_conexao: area === "conexao" ? funcaoConexao : null,
    };

    // Atualização otimista - adiciona imediatamente ao estado
    setEscalas((prevEscalas) => [...prevEscalas, novaEscala]);

    try {
      const insertData: any = {
        semana_inicio: selectedWeek,
        area,
        servo_id: servoId,
        dia,
        locked: false,
        created_by: systemProfileId,
      };

      // Adicionar função do louvor se for área de louvor
      if (area === "louvor" && funcaoLouvor) {
        insertData.funcao_louvor = funcaoLouvor;
        insertData.funcao_conexao = null;
      } else if (area === "conexao" && funcaoConexao) {
        // Adicionar função de conexão se for área de conexão
        insertData.funcao_conexao = funcaoConexao;
        insertData.funcao_louvor = null;
      } else {
        insertData.funcao_louvor = null;
        insertData.funcao_conexao = null;
      }

      const { data: insertedData, error } = await supabase
        .from("escalas")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        // Remover a escala temporária em caso de erro
        setEscalas((prevEscalas) =>
          prevEscalas.filter((e) => e.id !== tempEscalaId)
        );
        
        if (error.code === "23503") {
          toast({
            title: "Erro",
            description: "Servo não encontrado no banco de dados.",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      // Substituir a escala temporária pela real do banco
      if (insertedData) {
        setEscalas((prevEscalas) =>
          prevEscalas.map((e) =>
            e.id === tempEscalaId
              ? {
                  ...e,
                  id: insertedData.id,
                  created_by: insertedData.created_by,
                }
              : e
          )
        );
      }

      // Sucesso silencioso - não precisa mostrar toast
    } catch (error: any) {
      console.error("Error adding servo:", error);
      
      // Remover a escala temporária em caso de erro
      setEscalas((prevEscalas) =>
        prevEscalas.filter((e) => e.id !== tempEscalaId)
      );
      
      toast({
        title: "Erro",
        description: error.message || "Erro ao adicionar servo",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEscala = async (escalaId: string) => {
    if (!canEdit) return;

    // Guardar a escala removida para possível reversão
    const escalaRemovida = escalas.find((e) => e.id === escalaId);
    
    // Atualização otimista - remove imediatamente do estado
    setEscalas((prevEscalas) =>
      prevEscalas.filter((e) => e.id !== escalaId)
    );
    
    setDeleteDialog({ open: false, escalaId: null });

    try {
      const { error } = await supabase
        .from("escalas")
        .delete()
        .eq("id", escalaId);

      if (error) throw error;

      // Sucesso silencioso - não precisa mostrar toast
    } catch (error: any) {
      console.error("Error deleting escala:", error);
      
      // Reverter a remoção otimista em caso de erro
      if (escalaRemovida) {
        setEscalas((prevEscalas) => [...prevEscalas, escalaRemovida]);
      }
      
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover servo",
        variant: "destructive",
      });
    }
  };

  const handleLockEscala = async (escalaId: string, locked: boolean) => {
    if (!canEdit) return;

    // Atualização otimista - atualiza o estado imediatamente
    setEscalas((prevEscalas) =>
      prevEscalas.map((e) =>
        e.id === escalaId ? { ...e, locked } : e
      )
    );

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
    } catch (error: any) {
      console.error("Error locking escala:", error);
      
      // Reverter a atualização otimista em caso de erro
      setEscalas((prevEscalas) =>
        prevEscalas.map((e) =>
          e.id === escalaId ? { ...e, locked: !locked } : e
        )
      );
      
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
    if (!selectedWeek) return "";
    const current = new Date(selectedWeek);
    current.setDate(current.getDate() - 7);
    const currentSaturday = getCurrentWeekSaturday();
    
    // Garantir que não retorne uma semana passada
    current.setHours(0, 0, 0, 0);
    currentSaturday.setHours(0, 0, 0, 0);
    
    if (current < currentSaturday) {
      // Se a semana anterior for passada, retornar a semana atual
      return currentSaturday.toISOString().split("T")[0];
    }
    
    return current.toISOString().split("T")[0];
  };

  // Obter o sábado da semana atual
  const getCurrentWeekSaturday = () => {
    const today = new Date();
    const monday = getWeekStartDate(today);
    const saturday = new Date(monday);
    saturday.setDate(monday.getDate() + 5); // Segunda + 5 dias = sábado
    return saturday;
  };

  // Verificar se a semana selecionada é a semana atual ou futura
  const isWeekCurrentOrFuture = useMemo(() => {
    if (!selectedWeek) return false;
    const selected = new Date(selectedWeek);
    const currentSaturday = getCurrentWeekSaturday();
    
    // Comparar apenas as datas (sem horas)
    selected.setHours(0, 0, 0, 0);
    currentSaturday.setHours(0, 0, 0, 0);
    
    return selected >= currentSaturday;
  }, [selectedWeek]);

  // Verificar se pode ir para semana anterior
  const canGoToPreviousWeek = useMemo(() => {
    if (!selectedWeek) return false;
    const selected = new Date(selectedWeek);
    const currentSaturday = getCurrentWeekSaturday();
    
    selected.setHours(0, 0, 0, 0);
    currentSaturday.setHours(0, 0, 0, 0);
    
    // Se a semana selecionada for maior que a semana atual, pode voltar
    // Se for igual à semana atual, não pode voltar (já está na primeira semana permitida)
    return selected > currentSaturday;
  }, [selectedWeek]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <p className="text-sm text-muted-foreground">Carregando escalas...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 pb-12 sm:pb-8 pt-4 sm:pt-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-2 sm:space-y-6">
        {/* Header Público */}
        <div className="text-center mb-4 sm:mb-6">
          <div className="flex justify-center mb-3 sm:mb-4">
            <img
              src={logoVideira}
              alt="Videira São Miguel"
              className="h-12 sm:h-16 w-auto"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
            Escalas de Serviço
          </h1>
          <p className="text-xs sm:text-sm text-gray-600">
            Gerencie as escalas semanais de serviço
          </p>
        </div>

        {/* Header - Compacto no mobile */}
        <div className="space-y-2 sm:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
            <div className="hidden sm:block">
              <p className="text-xs sm:text-base text-muted-foreground">
                Versão pública editável
              </p>
            </div>
          <div className="flex gap-2">
            {selectedWeek && (
              <>
                <Button
                  onClick={handleSendReminders}
                  variant="outline"
                  className="w-full sm:w-auto h-8 sm:h-auto text-xs sm:text-sm bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                  size={isMobile ? "sm" : "default"}
                >
                  <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  <span className="hidden sm:inline">Enviar Lembretes</span>
                  <span className="sm:hidden">Enviar</span>
                </Button>
                <Button
                  onClick={handleOpenWhatsApp}
                  variant="outline"
                  className="w-full sm:w-auto h-8 sm:h-auto text-xs sm:text-sm"
                  size={isMobile ? "sm" : "default"}
                  title="Copiar mensagem para WhatsApp manual"
                >
                  <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  <span className="hidden sm:inline">Copiar Mensagem</span>
                  <span className="sm:hidden">Copiar</span>
                </Button>
              </>
            )}
            {canEdit && (
              <Button
                onClick={() => handleOpenServoDialog()}
                className="w-full sm:w-auto h-8 sm:h-auto text-xs sm:text-sm"
                size={isMobile ? "sm" : "default"}
              >
                <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                Novo Servo
              </Button>
            )}
          </div>
        </div>

        {/* Navegação de Semana - Compacta no mobile */}
        <div className="flex items-center gap-1.5 sm:gap-4">
          <Button
            variant="outline"
            onClick={() => setSelectedWeek(getPreviousWeek())}
            size="sm"
            className="h-7 sm:h-auto text-xs sm:text-sm px-2 sm:px-4 flex-shrink-0"
            disabled={!canGoToPreviousWeek}
          >
            <span className="hidden sm:inline">Semana Anterior</span>
            <span className="sm:hidden">Ant</span>
          </Button>
          <div className="flex items-center justify-center gap-1.5 sm:gap-3 px-2 sm:px-3 py-1.5 sm:py-2 bg-muted/50 rounded-md sm:rounded-lg flex-1 min-w-0">
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            {selectedWeek ? (() => {
              const sabado = new Date(selectedWeek);
              const domingo = new Date(sabado);
              domingo.setDate(sabado.getDate() + 1); // Sábado + 1 dia = domingo
              return (
                <div className="flex items-center gap-1.5 sm:gap-3 text-[10px] sm:text-sm min-w-0">
                  <div className="flex flex-col items-center sm:items-start min-w-0">
                    <span className="text-[10px] sm:text-xs text-muted-foreground">Sáb</span>
                    <span className="font-medium text-[10px] sm:text-sm truncate">{formatDateBR(sabado)}</span>
                  </div>
                  <span className="text-muted-foreground text-xs">•</span>
                  <div className="flex flex-col items-center sm:items-start min-w-0">
                    <span className="text-[10px] sm:text-xs text-muted-foreground">Dom</span>
                    <span className="font-medium text-[10px] sm:text-sm truncate">{formatDateBR(domingo)}</span>
                  </div>
                </div>
              );
            })() : (
              <span className="text-xs sm:text-sm font-medium">Selecione uma semana</span>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => setSelectedWeek(getNextWeek())}
            size="sm"
            className="h-7 sm:h-auto text-xs sm:text-sm px-2 sm:px-4 flex-shrink-0"
          >
            <span className="hidden sm:inline">Próxima Semana</span>
            <span className="sm:hidden">Próx</span>
          </Button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Grid de áreas - Layout vertical no mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
          {AREAS.map((area) => (
            <Card key={area.value} className="flex flex-col shadow-sm sm:shadow">
                <CardHeader className={`${area.color} text-white p-3 sm:p-6`}>
                  <CardTitle className="text-base sm:text-lg font-semibold sm:font-normal">{area.label}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-3 sm:p-4 space-y-3 sm:space-y-4">
                {/* Sábado - Não mostrar para Domingo Kids */}
                {area.value !== "domingo_kids" && (
                  area.value === "louvor" || area.value === "conexao" ? (
                    // Renderização especial para Louvor com subcategorias
                    <Card className="border-2">
                      <CardHeader className="p-2.5 sm:p-3 pb-2 sm:pb-2">
                        <CardTitle className="text-xs sm:text-sm font-semibold">Sábado</CardTitle>
                      </CardHeader>
                      <CardContent className="p-2.5 sm:p-3 pt-0 space-y-1.5 sm:space-y-3">
                      {(area.value === "louvor" ? FUNCOES_LOUVOR : FUNCOES_CONEXAO).map((funcao) => {
                        const funcaoValue = funcao.value;
                        const escalasFuncao = escalasPorArea[area.value].sabado.filter(
                          (e) => 
                            area.value === "louvor" 
                              ? e.funcao_louvor === funcaoValue
                              : e.funcao_conexao === funcaoValue
                        );
                        return (
                          <div key={funcao.value} className="space-y-0.5 sm:space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="text-xs sm:text-xs font-medium text-muted-foreground">
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
                                        area.value === "louvor" ? funcao.value as FuncaoLouvor : undefined,
                                        area.value === "conexao" ? funcao.value as FuncaoConexao : undefined
                                      );
                                    }
                                  }}
                                >
                                  <SelectTrigger className="h-7 w-7 sm:h-6 sm:w-6 p-0 flex-shrink-0 touch-manipulation">
                                    <Plus className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
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
                                <div className="space-y-1 sm:space-y-1 min-h-[40px] sm:min-h-[80px]">
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
                      </CardContent>
                    </Card>
                  ) : (
                    // Renderização normal para outros setores
                    <Card className="border-2">
                      <CardHeader className="p-2.5 sm:p-3 pb-2 sm:pb-2">
                        <div className="flex items-center justify-between gap-2">
                          <CardTitle className="text-xs sm:text-sm font-semibold">Sábado</CardTitle>
                        {canEdit && (
                          <Select
                            key={`${area.value}-sabado-${servos.length}`}
                            onValueChange={async (value) => {
                              if (value && value.trim() !== "") {
                                await handleAddServo(area.value, "sabado", value);
                              }
                            }}
                          >
                            <SelectTrigger className="h-7 w-7 sm:h-7 sm:w-7 p-0 flex-shrink-0 touch-manipulation">
                              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
                      </CardHeader>
                      <CardContent className="p-2.5 sm:p-3 pt-0">
                        <DroppableArea id={`${area.value}|sabado`}>
                          <SortableContext
                            items={escalasPorArea[area.value].sabado.map(
                              (e) => e.id
                            )}
                            strategy={verticalListSortingStrategy}
                          >
                            <div className="space-y-2 sm:space-y-2 min-h-[60px] sm:min-h-[120px]">
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
                      </CardContent>
                    </Card>
                  )
                )}

                {/* Domingo */}
                {area.value === "louvor" || area.value === "conexao" ? (
                  // Renderização especial para Louvor e Conexão com subcategorias
                  <Card className="border-2">
                    <CardHeader className="p-2.5 sm:p-3 pb-2 sm:pb-2">
                      <CardTitle className="text-xs sm:text-sm font-semibold">Domingo</CardTitle>
                    </CardHeader>
                    <CardContent className="p-2.5 sm:p-3 pt-0 space-y-1.5 sm:space-y-3">
                    {(area.value === "louvor" ? FUNCOES_LOUVOR : FUNCOES_CONEXAO).map((funcao) => {
                      const escalasFuncao = escalasPorArea[area.value].domingo.filter(
                        (e) => 
                          area.value === "louvor" 
                            ? e.funcao_louvor === (funcao as FuncaoLouvor).value
                            : e.funcao_conexao === (funcao as FuncaoConexao).value
                      );
                      return (
                        <div key={funcao.value} className="space-y-0.5 sm:space-y-1">
                          <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                            <h4 className="text-xs sm:text-xs font-medium text-muted-foreground">
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
                                      area.value === "louvor" ? funcao.value as FuncaoLouvor : undefined,
                                      area.value === "conexao" ? funcao.value as FuncaoConexao : undefined
                                    );
                                  }
                                }}
                              >
                                <SelectTrigger className="h-7 w-7 sm:h-6 sm:w-6 p-0 flex-shrink-0 touch-manipulation">
                                  <Plus className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
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
                              <div className="space-y-1 sm:space-y-1 min-h-[40px] sm:min-h-[80px]">
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
                    </CardContent>
                  </Card>
                ) : (
                  // Renderização normal para outros setores
                  <Card className="border-2">
                    <CardHeader className="p-2.5 sm:p-3 pb-2 sm:pb-2">
                      <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                        <CardTitle className="text-xs sm:text-sm font-semibold">Domingo</CardTitle>
                        {canEdit && (
                          <Select
                            key={`${area.value}-domingo-${servos.length}`}
                            onValueChange={async (value) => {
                              if (value && value.trim() !== "") {
                                await handleAddServo(area.value, "domingo", value);
                              }
                            }}
                          >
                            <SelectTrigger className="h-7 w-7 sm:h-7 sm:w-7 p-0 flex-shrink-0 touch-manipulation">
                              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
                    </CardHeader>
                    <CardContent className="p-2.5 sm:p-3 pt-0">
                      <DroppableArea id={`${area.value}|domingo`}>
                        <SortableContext
                          items={escalasPorArea[area.value].domingo.map(
                            (e) => e.id
                          )}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-2 sm:space-y-2 min-h-[60px] sm:min-h-[120px]">
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
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          ))}
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

      {/* Seção de gerenciamento de servos - Ocultar no mobile para economizar espaço */}
      {canEdit && (
        <Card className="hidden sm:block">
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
      className={`${isOver ? "bg-muted/50 rounded-lg border-2 border-dashed border-primary" : ""} transition-colors p-2 min-h-full`}
    >
      {children}
    </div>
  );
}

function EscalaItem({ escala, canEdit, onDelete, onLock }: EscalaItemProps) {
  const isMobile = useIsMobile();
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

  // No mobile: aplicar listeners ao item inteiro; no desktop: apenas ao ícone
  const dragProps = isMobile && canEdit && !escala.locked 
    ? { ...attributes, ...listeners }
    : {};

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...dragProps}
      className={`bg-card border rounded-md sm:rounded-lg p-1.5 sm:p-2 flex items-center justify-between group touch-manipulation ${
        escala.locked ? "opacity-75 cursor-not-allowed" : ""
      } ${canEdit && !escala.locked ? (isMobile ? "cursor-move" : "") : ""}`}
    >
      <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
        {canEdit && !escala.locked ? (
          isMobile ? (
            // No mobile: apenas mostra o ícone visualmente, o drag é no item inteiro
            <div className="flex-shrink-0 pointer-events-none">
              <GripVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            </div>
          ) : (
            // No desktop: aplica listeners apenas no ícone
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing flex-shrink-0"
            >
              <GripVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            </div>
          )
        ) : (
          <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
        )}
        <span className="text-xs sm:text-sm font-medium truncate">
          {escala.servo_name || "Servo removido"}
        </span>
        {!escala.servo_name && (
          <Badge variant="destructive" className="ml-1 text-[10px] sm:text-xs">
            Inválido
          </Badge>
        )}
        {escala.locked && (
          <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
        )}
      </div>
      {canEdit && (
        <div 
          className="flex items-center gap-0.5 sm:gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()} // Prevenir que o clique nos botões inicie o drag
          onTouchStart={(e) => e.stopPropagation()} // Prevenir que o toque nos botões inicie o drag
        >
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 sm:h-6 sm:w-6 p-0 touch-manipulation"
            onClick={(e) => {
              e.stopPropagation();
              onLock();
            }}
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
            className="h-5 w-5 sm:h-6 sm:w-6 p-0 text-destructive touch-manipulation"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Remover"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}

