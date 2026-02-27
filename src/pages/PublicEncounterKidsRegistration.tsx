import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Loader2, Users } from "lucide-react";
import logoKids from "@/assets/logo-kids.jpg";

interface Discipuladora {
  id: string;
  name: string;
}

interface Leader {
  id: string;
  name: string;
  discipulador_id?: string | null;
  discipulador_uuid?: string | null;
}

const KIDS_DATE = "07/03";
const KIDS_TIME = "08:30 as 14:30hs";

const normalizeText = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export function PublicEncounterKidsRegistration() {
  const { toast } = useToast();

  const [discipuladoras, setDiscipuladoras] = useState<Discipuladora[]>([]);
  const [leaders, setLeaders] = useState<Leader[]>([]);

  const [nomeCompleto, setNomeCompleto] = useState("");
  const [idade, setIdade] = useState("");
  const [nomeResponsavel, setNomeResponsavel] = useState("");
  const [discipuladoraId, setDiscipuladoraId] = useState("");
  const [liderNome, setLiderNome] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const filteredLeaders = useMemo(() => {
    if (!discipuladoraId) return [];
    return leaders.filter(
      (leader) =>
        leader.discipulador_id === discipuladoraId ||
        leader.discipulador_uuid === discipuladoraId
    );
  }, [leaders, discipuladoraId]);

  const loadData = async () => {
    try {
      setLoading(true);

      const { data: discipuladorasData, error: discipuladorasError } = await supabase
        .from("profiles")
        .select("id, name")
        .eq("role", "discipulador")
        .eq("is_kids", true)
        .order("name");

      if (discipuladorasError) {
        toast({
          title: "Erro",
          description: "Erro ao carregar discipuladoras.",
          variant: "destructive",
        });
        return;
      }

      const { data: leadersData, error: leadersError } = await (supabase as any)
        .from("profiles")
        .select("id, name, discipulador_id, discipulador_uuid")
        .eq("role", "lider")
        .eq("is_kids", true)
        .order("name");

      if (leadersError) {
        toast({
          title: "Erro",
          description: "Erro ao carregar líderes.",
          variant: "destructive",
        });
        return;
      }

      setDiscipuladoras(discipuladorasData || []);
      setLeaders(leadersData || []);
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro",
        description: "Erro ao carregar os dados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nomeCompleto.trim() || !idade.trim() || !nomeResponsavel.trim() || !discipuladoraId || !liderNome.trim()) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const idadeValue = Number.parseInt(idade, 10);
    if (Number.isNaN(idadeValue) || idadeValue < 0 || idadeValue > 17) {
      toast({
        title: "Erro",
        description: "Informe uma idade válida entre 0 e 17 anos.",
        variant: "destructive",
      });
      return;
    }

    const selectedLeader = filteredLeaders.find(
      (leader) => normalizeText(leader.name) === normalizeText(liderNome)
    );

    if (!selectedLeader) {
      toast({
        title: "Erro",
        description: "Líder não encontrado para a discipuladora selecionada.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await (supabase as any).from("encounter_kids_registrations").insert({
        nome_completo: nomeCompleto.trim(),
        idade: idadeValue,
        nome_responsavel: nomeResponsavel.trim(),
        discipuladora_id: discipuladoraId,
        lider_id: selectedLeader.id,
      });

      if (error) {
        toast({
          title: "Erro",
          description: error.message || "Não foi possível concluir a inscrição.",
          variant: "destructive",
        });
        return;
      }

      setSubmitted(true);
      toast({
        title: "Sucesso",
        description: "Inscrição Kids realizada com sucesso.",
      });

      setNomeCompleto("");
      setIdade("");
      setNomeResponsavel("");
      setDiscipuladoraId("");
      setLiderNome("");
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível concluir a inscrição.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-cyan-600 mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Inscrição confirmada</h2>
            <p className="text-muted-foreground mb-6">
              Cadastro do Encontro Kids realizado com sucesso.
            </p>
            <Button
              className="w-full"
              onClick={() => {
                setSubmitted(false);
                setNomeCompleto("");
                setIdade("");
                setNomeResponsavel("");
                setDiscipuladoraId("");
                setLiderNome("");
              }}
            >
              Fazer nova inscrição
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 p-3 sm:p-4 md:p-6 lg:p-8 safe-area-inset">
      <div className="max-w-3xl xl:max-w-4xl mx-auto">
        <Card className="border-2">
          <CardHeader className="text-center px-4 sm:px-6 pt-4 sm:pt-6">
            <div className="flex justify-center mb-3 sm:mb-4">
              <img src={logoKids} alt="Videira Kids" className="h-14 sm:h-16 md:h-20 rounded-md" />
            </div>
            <CardTitle className="text-lg sm:text-xl md:text-2xl lg:text-3xl">
              Inscrição Encontro Kids
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm md:text-base mt-2">
              Preencha os dados abaixo para confirmar a inscrição
            </CardDescription>
            <div className="mt-3 sm:mt-4 bg-gradient-to-r from-cyan-100 to-blue-100 p-3 sm:p-4 rounded-lg">
              <p className="font-semibold text-cyan-700 text-sm sm:text-base md:text-lg">
                Dia: {KIDS_DATE} - Horário: {KIDS_TIME}
              </p>
            </div>
          </CardHeader>

          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 md:space-y-6">
              <div>
                <Label htmlFor="nomeCompleto" className="text-sm sm:text-base">
                  Nome completo <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nomeCompleto"
                  type="text"
                  value={nomeCompleto}
                  onChange={(e) => setNomeCompleto(e.target.value)}
                  placeholder="Digite o nome completo"
                  required
                  className="mt-1 text-sm sm:text-base min-h-[44px] touch-manipulation"
                />
              </div>

              <div>
                <Label htmlFor="idade" className="text-sm sm:text-base">
                  Idade <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="idade"
                  type="number"
                  min={0}
                  max={17}
                  inputMode="numeric"
                  value={idade}
                  onChange={(e) => setIdade(e.target.value)}
                  placeholder="Digite a idade"
                  required
                  className="mt-1 text-sm sm:text-base min-h-[44px] touch-manipulation"
                />
              </div>

              <div>
                <Label htmlFor="nomeResponsavel" className="text-sm sm:text-base">
                  Nome do responsável <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nomeResponsavel"
                  type="text"
                  value={nomeResponsavel}
                  onChange={(e) => setNomeResponsavel(e.target.value)}
                  placeholder="Digite o nome do responsável"
                  required
                  className="mt-1 text-sm sm:text-base min-h-[44px] touch-manipulation"
                />
              </div>

              <div>
                <Label htmlFor="discipuladora" className="text-sm sm:text-base">
                  Discipuladora <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={discipuladoraId}
                  onValueChange={(value) => {
                    setDiscipuladoraId(value);
                    setLiderNome("");
                  }}
                  required
                >
                  <SelectTrigger
                    id="discipuladora"
                    className="mt-1 text-sm sm:text-base min-h-[44px] touch-manipulation"
                  >
                    <SelectValue placeholder="Selecione a discipuladora" />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    sideOffset={4}
                    collisionPadding={8}
                    className="z-[9999] w-[var(--radix-select-trigger-width)] max-h-[42svh] sm:max-h-72 md:max-h-80"
                  >
                    {discipuladoras.map((discipuladora) => (
                      <SelectItem
                        key={discipuladora.id}
                        value={discipuladora.id}
                        className="min-h-[44px] touch-manipulation text-sm"
                      >
                        {discipuladora.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="lider" className="text-sm sm:text-base">
                  Líder <span className="text-red-500">*</span>
                </Label>
                {discipuladoraId && filteredLeaders.length === 0 ? (
                  <div className="mt-1 p-3 border border-amber-500 rounded-md bg-amber-50">
                    <p className="text-sm text-amber-700">
                      Nenhum líder vinculado à discipuladora selecionada.
                    </p>
                  </div>
                ) : (
                  <>
                    <Input
                      id="lider"
                      value={liderNome}
                      onChange={(e) => setLiderNome(e.target.value)}
                      list="kids-leaders-options"
                      placeholder={
                        !discipuladoraId
                          ? "Selecione primeiro a discipuladora"
                          : "Digite o nome do líder"
                      }
                      disabled={!discipuladoraId}
                      required
                      className="mt-1 text-sm sm:text-base min-h-[44px] touch-manipulation"
                    />
                    <datalist id="kids-leaders-options">
                      {filteredLeaders.map((leader) => (
                        <option key={leader.id} value={leader.name} />
                      ))}
                    </datalist>
                  </>
                )}
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full text-sm sm:text-base py-3 sm:py-4 min-h-[48px] touch-manipulation"
                size="lg"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Users className="mr-2 h-4 w-4" />
                    Confirmar inscrição
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
