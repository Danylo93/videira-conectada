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
import logoVideira from "@/assets/logo-videira.png";

interface Discipulador {
  id: string;
  name: string;
}

interface Leader {
  id: string;
  name: string;
  discipulador_id?: string | null;
  discipulador_uuid?: string | null;
}

interface ProfileLookup {
  id: string;
  name: string;
  role: string;
}

const ENCOUNTER_DATES = "13, 14 e 15/03";

export function PublicEncounterRegistration() {
  const { toast } = useToast();

  const [discipuladores, setDiscipuladores] = useState<Discipulador[]>([]);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [funcao, setFuncao] = useState<"equipe" | "encontrista" | "discipulador">("encontrista");
  const [discipuladorId, setDiscipuladorId] = useState("");
  const [liderId, setLiderId] = useState("");
  const [pastorChristianId, setPastorChristianId] = useState("");
  const [pastorChristianName, setPastorChristianName] = useState("Pastor Christian");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [useNativeMobileSelects, setUseNativeMobileSelects] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;

    const query = window.matchMedia("(max-width: 768px), (pointer: coarse)");
    const update = () => setUseNativeMobileSelects(query.matches);
    update();

    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", update);
      return () => query.removeEventListener("change", update);
    }

    query.addListener(update);
    return () => query.removeListener(update);
  }, []);

  const filteredLeaders = useMemo(() => {
    if (!discipuladorId) return [];
    return leaders.filter(
      (leader) =>
        leader.discipulador_id === discipuladorId ||
        leader.discipulador_uuid === discipuladorId
    );
  }, [leaders, discipuladorId]);

  const resolveDefaultPastor = async (): Promise<ProfileLookup | null> => {
    const { data: pastorsData, error: pastorsError } = await (supabase as any)
      .from("profiles")
      .select("id, name, role, is_kids")
      .eq("role", "pastor")
      .or("is_kids.is.null,is_kids.eq.false")
      .order("name");

    if (pastorsError) {
      console.error("Error loading pastors:", pastorsError);
      return null;
    }

    const pastors = (pastorsData || []) as ProfileLookup[];
    if (pastors.length === 0) return null;

    const preferred =
      pastors.find((p) => p.name?.toLowerCase().includes("christian")) || pastors[0];

    return preferred;
  };

  const loadData = async () => {
    try {
      setLoading(true);

      const { data: discipuladoresData, error: discipuladoresError } = await supabase
        .from("profiles")
        .select("id, name, is_kids")
        .eq("role", "discipulador")
        .or("is_kids.is.null,is_kids.eq.false")
        .order("name");

      if (discipuladoresError) {
        toast({
          title: "Erro",
          description: "Erro ao carregar discipuladores. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      const { data: leadersData, error: leadersError } = await (supabase as any)
        .from("profiles")
        .select("id, name, discipulador_id, discipulador_uuid, is_kids")
        .eq("role", "lider")
        .or("is_kids.is.null,is_kids.eq.false")
        .order("name");

      if (leadersError) {
        toast({
          title: "Erro",
          description: "Erro ao carregar líderes. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      setDiscipuladores(discipuladoresData || []);
      setLeaders(leadersData || []);

      const defaultPastor = await resolveDefaultPastor();
      if (defaultPastor) {
        setPastorChristianId(defaultPastor.id);
        setPastorChristianName(defaultPastor.name);
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados de cadastro.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nomeCompleto.trim()) {
      toast({
        title: "Erro",
        description: "Preencha o nome completo.",
        variant: "destructive",
      });
      return;
    }

    let selectedDiscipuladorId = discipuladorId;
    let selectedLiderId = liderId;

    if (funcao === "discipulador") {
      let resolvedPastorId = pastorChristianId;
      let resolvedPastorName = pastorChristianName;

      if (!resolvedPastorId) {
        const defaultPastor = await resolveDefaultPastor();
        if (defaultPastor) {
          resolvedPastorId = defaultPastor.id;
          resolvedPastorName = defaultPastor.name;
          setPastorChristianId(defaultPastor.id);
          setPastorChristianName(defaultPastor.name);
        }
      }

      if (!resolvedPastorId) {
        toast({
          title: "Erro",
          description:
            "Não foi possível localizar um pastor cadastrado para usar como padrão. Contate a administração.",
          variant: "destructive",
        });
        return;
      }

      selectedDiscipuladorId = resolvedPastorId;
      selectedLiderId = resolvedPastorId;
      if (resolvedPastorName !== pastorChristianName) {
        setPastorChristianName(resolvedPastorName);
      }
    } else {
      if (!discipuladorId) {
        toast({
          title: "Erro",
          description: "Selecione um discipulador.",
          variant: "destructive",
        });
        return;
      }

      if (!liderId) {
        toast({
          title: "Erro",
          description: "Selecione um líder.",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      setSubmitting(true);

      const { error } = await (supabase as any).from("encounter_registrations").insert({
        nome_completo: nomeCompleto.trim(),
        funcao,
        discipulador_id: selectedDiscipuladorId,
        lider_id: selectedLiderId,
      });

      if (error) {
        toast({
          title: "Erro",
          description: error.message || "Não foi possível concluir a inscrição.",
          variant: "destructive",
        });
        return;
      }

      const { error: syncError } = await supabase.functions.invoke(
        "sync-encontristas-google-sheets",
        {
          method: "POST",
        }
      );

      if (syncError) {
        console.error("Encounter sync warning:", syncError);
      }

      setSubmitted(true);
      toast({
        title: "Sucesso",
        description: "Inscrição realizada com sucesso.",
      });

      setNomeCompleto("");
      setFuncao("encontrista");
      setDiscipuladorId("");
      setLiderId("");
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
              <p className="text-muted-foreground">Carregando...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Inscrição confirmada</h2>
              <p className="text-muted-foreground mb-6">
                Seu nome foi registrado para o encontro.
              </p>
              <Button
                className="w-full"
                onClick={() => {
                  setSubmitted(false);
                  setNomeCompleto("");
                  setFuncao("encontrista");
                  setDiscipuladorId("");
                  setLiderId("");
                }}
              >
                Fazer nova inscrição
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-3 sm:p-4 md:p-6 lg:p-8 safe-area-inset">
      <div className="max-w-3xl xl:max-w-4xl mx-auto">
        <Card className="border-2">
          <CardHeader className="text-center px-4 sm:px-6 pt-4 sm:pt-6">
            <div className="flex justify-center mb-3 sm:mb-4">
              <img src={logoVideira} alt="Videira Conectada" className="h-14 sm:h-16 md:h-20" />
            </div>
            <CardTitle className="text-lg sm:text-xl md:text-2xl lg:text-3xl">
              Inscrição para Encontro com Deus
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm md:text-base mt-2">
              Preencha os dados abaixo para confirmar sua inscrição
            </CardDescription>
            <div className="mt-3 sm:mt-4 bg-gradient-to-r from-blue-100 to-purple-100 p-3 sm:p-4 rounded-lg">
              <p className="font-semibold text-blue-700 text-sm sm:text-base md:text-lg">
                Dias: {ENCOUNTER_DATES} - Sítio Videira Mairiporã
              </p>
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 md:space-y-6">
              <div>
                <Label htmlFor="nomeCompleto" className="text-sm sm:text-base">
                  Nome Completo <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nomeCompleto"
                  type="text"
                  value={nomeCompleto}
                  onChange={(e) => setNomeCompleto(e.target.value)}
                  placeholder="Digite seu nome completo"
                  required
                  className="mt-1 text-sm sm:text-base min-h-[44px] touch-manipulation"
                  autoComplete="name"
                  autoCapitalize="words"
                />
              </div>

              <div>
                <Label htmlFor="funcao" className="text-sm sm:text-base">
                  Função <span className="text-red-500">*</span>
                </Label>
                {useNativeMobileSelects ? (
                  <select
                    id="funcao"
                    value={funcao}
                    onChange={(e) => {
                      const value = e.target.value as "equipe" | "encontrista" | "discipulador";
                      setFuncao(value);
                      if (value === "discipulador") {
                        setDiscipuladorId("");
                        setLiderId("");
                      }
                    }}
                    required
                    className="mt-1 flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm sm:text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring touch-manipulation"
                  >
                    <option value="encontrista">Encontrista</option>
                    <option value="equipe">Equipe</option>
                    <option value="discipulador">Discipulador</option>
                  </select>
                ) : (
                  <Select
                    value={funcao}
                    onValueChange={(value: "equipe" | "encontrista" | "discipulador") => {
                      setFuncao(value);
                      if (value === "discipulador") {
                        setDiscipuladorId("");
                        setLiderId("");
                      }
                    }}
                    required
                  >
                    <SelectTrigger
                      id="funcao"
                      className="mt-1 text-sm sm:text-base min-h-[44px] touch-manipulation"
                    >
                      <SelectValue placeholder="Selecione a função" />
                    </SelectTrigger>
                    <SelectContent
                      position="item-aligned"
                      className="z-[9999] w-[var(--radix-select-trigger-width)] max-h-[42svh] sm:max-h-72 md:max-h-80"
                    >
                      <SelectItem
                        value="encontrista"
                        className="min-h-[44px] touch-manipulation text-sm"
                      >
                        Encontrista
                      </SelectItem>
                      <SelectItem
                        value="equipe"
                        className="min-h-[44px] touch-manipulation text-sm"
                      >
                        Equipe
                      </SelectItem>
                      <SelectItem
                        value="discipulador"
                        className="min-h-[44px] touch-manipulation text-sm"
                      >
                        Discipulador
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              {funcao === "discipulador" ? (
                <div>
                  <Label htmlFor="pastor-bloqueado" className="text-sm sm:text-base">
                    Pastor
                  </Label>
                  <Input
                    id="pastor-bloqueado"
                    value={pastorChristianName}
                    disabled
                    readOnly
                    className="mt-1 text-sm sm:text-base min-h-[44px] touch-manipulation bg-muted"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <Label htmlFor="discipulador" className="text-sm sm:text-base">
                      Discipulador <span className="text-red-500">*</span>
                    </Label>
                    {useNativeMobileSelects ? (
                      <select
                        id="discipulador"
                        value={discipuladorId}
                        onChange={(e) => {
                          setDiscipuladorId(e.target.value);
                          setLiderId("");
                        }}
                        required
                        className="mt-1 flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm sm:text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring touch-manipulation"
                      >
                        <option value="">Selecione seu discipulador</option>
                        {discipuladores.map((discipulador) => (
                          <option key={discipulador.id} value={discipulador.id}>
                            {discipulador.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Select
                        value={discipuladorId}
                        onValueChange={(value) => {
                          setDiscipuladorId(value);
                          setLiderId("");
                        }}
                        required
                      >
                        <SelectTrigger
                          id="discipulador"
                          className="mt-1 text-sm sm:text-base min-h-[44px] touch-manipulation"
                        >
                          <SelectValue placeholder="Selecione seu discipulador" />
                        </SelectTrigger>
                        <SelectContent
                          position="item-aligned"
                          className="z-[9999] w-[var(--radix-select-trigger-width)] max-h-[42svh] sm:max-h-72 md:max-h-80"
                        >
                          {discipuladores.map((discipulador) => (
                            <SelectItem
                              key={discipulador.id}
                              value={discipulador.id}
                              className="min-h-[44px] touch-manipulation text-sm"
                            >
                              {discipulador.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="lider" className="text-sm sm:text-base">
                      Líder <span className="text-red-500">*</span>
                    </Label>
                    {discipuladorId && filteredLeaders.length === 0 ? (
                      <div className="mt-1 p-3 border border-amber-500 rounded-md bg-amber-50">
                        <p className="text-sm text-amber-700">
                          Nenhum líder vinculado ao discipulador selecionado.
                        </p>
                      </div>
                    ) : (
                      <>
                        {useNativeMobileSelects ? (
                          <select
                            id="lider"
                            value={liderId}
                            onChange={(e) => setLiderId(e.target.value)}
                            required
                            disabled={!discipuladorId || filteredLeaders.length === 0}
                            className="mt-1 flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm sm:text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation"
                          >
                            <option value="">
                              {!discipuladorId
                                ? "Selecione primeiro o discipulador"
                                : "Selecione seu líder"}
                            </option>
                            {filteredLeaders.map((leader) => (
                              <option key={leader.id} value={leader.id}>
                                {leader.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <Select value={liderId} onValueChange={setLiderId} required>
                            <SelectTrigger
                              id="lider"
                              className="mt-1 text-sm sm:text-base min-h-[44px] touch-manipulation"
                              disabled={!discipuladorId || filteredLeaders.length === 0}
                            >
                              <SelectValue
                                placeholder={
                                  !discipuladorId
                                    ? "Selecione primeiro o discipulador"
                                    : "Selecione seu líder"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent
                              position="item-aligned"
                              className="z-[9999] w-[var(--radix-select-trigger-width)] max-h-[42svh] sm:max-h-72 md:max-h-80"
                            >
                              {filteredLeaders.map((leader) => (
                                <SelectItem
                                  key={leader.id}
                                  value={leader.id}
                                  className="min-h-[44px] touch-manipulation text-sm"
                                >
                                  {leader.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </>
                    )}
                  </div>
                </>
              )}

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
                    Confirmar Inscrição
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

