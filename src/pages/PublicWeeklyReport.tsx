import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, AlertCircle } from "lucide-react";
import logoVideira from "@/assets/logo-videira.png";
import { formatDateBR } from "@/lib/dateUtils";

interface Leader {
  id: string;
  name: string;
  celula?: string;
}

export function PublicWeeklyReport() {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [selectedLeaderId, setSelectedLeaderId] = useState<string>("");
  const [reportDate, setReportDate] = useState("");
  const [membersCount, setMembersCount] = useState<number>(0);
  const [frequentadoresCount, setFrequentadoresCount] = useState<number>(0);
  const [observations, setObservations] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [existingReport, setExistingReport] = useState<any>(null);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);

  // Calcular início e fim da semana atual (segunda a domingo)
  const getCurrentWeekRange = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysToMonday);
    monday.setHours(0, 0, 0, 0);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    
    return {
      start: monday,
      end: sunday,
      startStr: `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`,
      endStr: `${sunday.getFullYear()}-${String(sunday.getMonth() + 1).padStart(2, '0')}-${String(sunday.getDate()).padStart(2, '0')}`,
    };
  };

  const weekRange = getCurrentWeekRange();

  // Verificar se há parâmetros na URL
  useEffect(() => {
    const dateParam = searchParams.get("date");
    const liderParam = searchParams.get("lider");
    
    if (dateParam) {
      // Validar se a data está na semana atual
      const selectedDate = new Date(dateParam + "T00:00:00");
      if (selectedDate >= weekRange.start && selectedDate <= weekRange.end) {
        setReportDate(dateParam);
      } else {
        // Se a data não está na semana atual, usar hoje
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        setReportDate(`${year}-${month}-${day}`);
        toast({
          title: "Aviso",
          description: "Apenas datas da semana atual são permitidas. Data ajustada para hoje.",
        });
      }
    } else {
      // Se não tem data, usar hoje no fuso horário local (Brasil)
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      setReportDate(`${year}-${month}-${day}`);
    }
    
    if (liderParam) {
      setSelectedLeaderId(liderParam);
    }
  }, [searchParams]);

  // Carregar lista de líderes
  useEffect(() => {
    const loadLeaders = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, name, celula, is_kids")
          .eq("role", "lider")
          .order("name");

        if (error) {
          console.error("Error loading leaders:", error);
          toast({
            title: "Erro",
            description: "Não foi possível carregar a lista de líderes.",
            variant: "destructive",
          });
          return;
        }

        // Filtrar líderes do modo Kids (excluir is_kids = true)
        setLeaders((data || [])
          .filter((l: any) => !l.is_kids) // Excluir líderes do modo Kids
          .map((l: any) => ({
            id: l.id,
            name: l.name,
            celula: l.celula || undefined,
          })));
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadLeaders();
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedLeaderId) {
      toast({
        title: "Erro",
        description: "Por favor, selecione seu nome.",
        variant: "destructive",
      });
      return;
    }

    if (!reportDate) {
      toast({
        title: "Erro",
        description: "Por favor, selecione a data.",
        variant: "destructive",
      });
      return;
    }

    if (membersCount < 0 || frequentadoresCount < 0) {
      toast({
        title: "Erro",
        description: "As quantidades não podem ser negativas.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      // A data do input type="date" já vem no formato YYYY-MM-DD (sem fuso horário)
      // Usar diretamente para evitar conversões
      // Garantir que estamos buscando exatamente pela data selecionada
      const dateToCheck = reportDate.trim();
      
      // Verificar se já existe um relatório para a data EXATA selecionada
      const { data: existing, error: checkError } = await (supabase
        .from("cell_reports_weekly" as any)
        .select("id, members_count, frequentadores_count, observations, report_date")
        .eq("lider_id", selectedLeaderId)
        .eq("report_date", dateToCheck)
        .maybeSingle() as any);
      
      // Se houver erro que não seja "não encontrado", logar mas continuar
      if (checkError && checkError.code !== 'PGRST116') {
        console.error("Error checking existing report:", checkError);
      }

      // Verificar se encontrou um relatório E se a data corresponde exatamente
      if (existing) {
        // Normalizar a data retornada do banco para comparar
        let existingDateStr = existing.report_date;
        if (existingDateStr) {
          // Se for uma string ISO, pegar apenas a parte da data
          if (typeof existingDateStr === 'string' && existingDateStr.includes('T')) {
            existingDateStr = existingDateStr.split('T')[0];
          }
          // Se for um objeto Date, converter para string YYYY-MM-DD
          if (existingDateStr instanceof Date) {
            const year = existingDateStr.getFullYear();
            const month = String(existingDateStr.getMonth() + 1).padStart(2, '0');
            const day = String(existingDateStr.getDate()).padStart(2, '0');
            existingDateStr = `${year}-${month}-${day}`;
          }
        }
        
        // Só mostrar o diálogo se a data corresponder exatamente
        if (existingDateStr === dateToCheck) {
          // Mostrar diálogo de confirmação
          setExistingReport(existing);
          setShowUpdateDialog(true);
          setSubmitting(false);
          return;
        }
      }

      // Criar novo relatório
      await createOrUpdateReport(null);
    } catch (error: any) {
      // Se o erro for "no rows", significa que não existe relatório, então criar
      if (error.code === 'PGRST116') {
        await createOrUpdateReport(null);
      } else {
        console.error("Error submitting report:", error);
        toast({
          title: "Erro",
          description: error.message || "Não foi possível enviar o relatório.",
          variant: "destructive",
        });
        setSubmitting(false);
      }
    }
  };

  const createOrUpdateReport = async (existingId: string | null) => {
    try {
      // O input type="date" retorna a data no formato YYYY-MM-DD sem conversão de fuso horário
      // Usar diretamente para garantir que a data seja salva exatamente como selecionada
      
      if (existingId) {
        // Atualizar relatório existente
        const { error: updateError } = await (supabase
          .from("cell_reports_weekly" as any)
          .update({
            members_count: membersCount,
            frequentadores_count: frequentadoresCount,
            observations: observations || null,
          })
          .eq("id", existingId) as any);

        if (updateError) {
          throw updateError;
        }

        toast({
          title: "Sucesso",
          description: "Relatório atualizado com sucesso!",
        });
      } else {
        // Criar novo relatório
        // A data do input type="date" já vem no formato YYYY-MM-DD (sem fuso horário)
        const { error: insertError } = await (supabase
          .from("cell_reports_weekly" as any)
          .insert([
            {
              lider_id: selectedLeaderId,
              report_date: reportDate, // Usar diretamente, já está no formato correto
              members_count: membersCount,
              frequentadores_count: frequentadoresCount,
              observations: observations || null,
            },
          ] as any) as any);

        if (insertError) {
          throw insertError;
        }

        toast({
          title: "Sucesso",
          description: "Relatório enviado com sucesso!",
        });
      }

      setSubmitted(true);
      
      // Limpar formulário após 3 segundos
      setTimeout(() => {
        setSelectedLeaderId("");
        setReportDate(new Date().toISOString().split("T")[0]);
        setMembersCount(0);
        setFrequentadoresCount(0);
        setObservations("");
        setSubmitted(false);
        setExistingReport(null);
      }, 3000);
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível enviar o relatório.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
      setShowUpdateDialog(false);
    }
  };

  const handleConfirmUpdate = async () => {
    if (!existingReport) return;
    setSubmitting(true);
    await createOrUpdateReport(existingReport.id);
  };

  const handleCancelUpdate = () => {
    setShowUpdateDialog(false);
    
    // Preencher formulário com dados existentes para o usuário ver
    if (existingReport) {
      setMembersCount(existingReport.members_count || 0);
      setFrequentadoresCount(existingReport.frequentadores_count || 0);
      setObservations(existingReport.observations || "");
    }
    
    setExistingReport(null);
    setSubmitting(false);
  };

  const selectedLeader = leaders.find(l => l.id === selectedLeaderId);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/20 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground">Carregando...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/20 py-4 sm:py-8 px-3 sm:px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-8">
          <div className="flex justify-center mb-3 sm:mb-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
              <img 
                src={logoVideira} 
                alt="Videira Logo" 
                className="w-12 h-12 sm:w-16 sm:h-16"
              />
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2 px-2">
            Relatório Semanal de Célula
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground px-2">
            Preencha os dados da sua célula para esta semana
          </p>
        </div>

        {/* Form Card */}
        <Card className="shadow-xl">
          <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
            <CardTitle className="text-lg sm:text-xl">Preencher Relatório</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Selecione seu nome e preencha os dados da reunião da sua célula
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            {submitted ? (
              <div className="text-center py-6 sm:py-8 space-y-3 sm:space-y-4">
                <CheckCircle2 className="w-12 h-12 sm:w-16 sm:h-16 text-green-500 mx-auto" />
                <h3 className="text-lg sm:text-xl font-semibold">Relatório enviado com sucesso!</h3>
                <p className="text-sm sm:text-base text-muted-foreground px-2">
                  Obrigado por preencher o relatório da sua célula.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div>
                  <Label htmlFor="leader" className="text-sm sm:text-base">Selecione seu nome *</Label>
                  <Select value={selectedLeaderId} onValueChange={setSelectedLeaderId} required>
                    <SelectTrigger id="leader" className="h-11 sm:h-10 text-sm sm:text-base">
                      <SelectValue placeholder="Selecione seu nome..." />
                    </SelectTrigger>
                    <SelectContent>
                      {leaders.map((leader) => (
                        <SelectItem key={leader.id} value={leader.id} className="text-sm sm:text-base">
                          {leader.name} {leader.celula ? `- ${leader.celula}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedLeader && selectedLeader.celula && (
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      Célula: {selectedLeader.celula}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="date" className="text-sm sm:text-base">Data da Reunião *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={reportDate}
                    onChange={(e) => {
                      const selectedDate = new Date(e.target.value + "T00:00:00");
                      // Validar se a data está na semana atual
                      if (selectedDate >= weekRange.start && selectedDate <= weekRange.end) {
                        setReportDate(e.target.value);
                      } else {
                        toast({
                          title: "Data inválida",
                          description: `Apenas datas da semana atual são permitidas (${formatDateBR(weekRange.start)} a ${formatDateBR(weekRange.end)})`,
                          variant: "destructive",
                        });
                      }
                    }}
                    min={weekRange.startStr}
                    max={weekRange.endStr}
                    required
                    className="h-11 sm:h-10 text-sm sm:text-base"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Semana atual: {formatDateBR(weekRange.start)} a {formatDateBR(weekRange.end)}
                  </p>
                </div>

                <div>
                  <Label htmlFor="members" className="text-sm sm:text-base">Quantidade de Membros *</Label>
                  <Input
                    id="members"
                    type="number"
                    min="0"
                    value={membersCount}
                    onChange={(e) => setMembersCount(parseInt(e.target.value) || 0)}
                    required
                    placeholder="0"
                    className="h-11 sm:h-10 text-sm sm:text-base"
                  />
                </div>

                <div>
                  <Label htmlFor="frequentadores" className="text-sm sm:text-base">Quantidade de Frequentadores *</Label>
                  <Input
                    id="frequentadores"
                    type="number"
                    min="0"
                    value={frequentadoresCount}
                    onChange={(e) => setFrequentadoresCount(parseInt(e.target.value) || 0)}
                    required
                    placeholder="0"
                    className="h-11 sm:h-10 text-sm sm:text-base"
                  />
                </div>

                <div>
                  <Label htmlFor="observations" className="text-sm sm:text-base">Observações</Label>
                  <Textarea
                    id="observations"
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    placeholder="Observações sobre a reunião (opcional)..."
                    rows={4}
                    className="text-sm sm:text-base resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full gradient-primary h-11 sm:h-10 text-sm sm:text-base font-medium"
                  disabled={submitting}
                >
                  {submitting ? "Enviando..." : "Enviar Relatório"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Dialog de Confirmação de Atualização */}
        <AlertDialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
          <AlertDialogContent className="max-w-[95vw] sm:max-w-md mx-4">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base sm:text-lg">Relatório já existe</AlertDialogTitle>
              <AlertDialogDescription className="text-sm sm:text-base">
                Você já preencheu um relatório para esta data ({(() => {
                  // Formatar a data corretamente sem conversão de fuso horário
                  if (existingReport?.report_date) {
                    const dateStr = existingReport.report_date;
                    // Se já está no formato YYYY-MM-DD, converter diretamente
                    if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
                      const [year, month, day] = dateStr.split('T')[0].split('-');
                      return `${day}/${month}/${year}`;
                    }
                    // Se for um objeto Date ou ISO string, usar métodos locais
                    const date = new Date(dateStr);
                    const day = String(date.getDate()).padStart(2, '0');
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const year = date.getFullYear();
                    return `${day}/${month}/${year}`;
                  }
                  return reportDate ? (() => {
                    const [year, month, day] = reportDate.split('-');
                    return `${day}/${month}/${year}`;
                  })() : '';
                })()}).
                <br /><br />
                <strong>Dados do relatório atual:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1 text-left">
                  <li>Membros: {existingReport?.members_count || 0}</li>
                  <li>Frequentadores: {existingReport?.frequentadores_count || 0}</li>
                  {existingReport?.observations && (
                    <li>Observações: {existingReport.observations}</li>
                  )}
                </ul>
                <br />
                Deseja atualizar o relatório com os novos dados?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <AlertDialogCancel onClick={handleCancelUpdate} className="w-full sm:w-auto text-sm sm:text-base">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmUpdate} className="w-full sm:w-auto text-sm sm:text-base">
                Sim, atualizar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Info Card */}
        <Card className="mt-4 sm:mt-6 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="flex gap-2 sm:gap-3">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-xs sm:text-sm font-medium text-blue-900 dark:text-blue-100">
                  Informações importantes
                </p>
                <ul className="text-xs sm:text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                  <li>Preencha o relatório após cada reunião da sua célula</li>
                  <li>Se já preencheu para esta data, o relatório será atualizado</li>
                  <li>Os dados são enviados diretamente para o sistema</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default PublicWeeklyReport;

