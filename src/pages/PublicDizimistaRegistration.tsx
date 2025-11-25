import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import logoVideira from "@/assets/logo-videira.png";

interface Discipulador {
  id: string;
  name: string;
}

export function PublicDizimistaRegistration() {
  const { toast } = useToast();
  
  const [discipuladores, setDiscipuladores] = useState<Discipulador[]>([]);
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [casado, setCasado] = useState(false);
  const [conjugue, setConjugue] = useState("");
  const [discipuladorId, setDiscipuladorId] = useState("");
  const [telefone, setTelefone] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    loadDiscipuladores();
  }, []);

  const loadDiscipuladores = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, is_kids")
        .eq("role", "discipulador")
        .or("is_kids.is.null,is_kids.eq.false")
        .order("name");

      if (error) {
        console.error("Error loading discipuladores:", error);
        toast({
          title: "Erro",
          description: "Erro ao carregar discipuladores. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      setDiscipuladores(data || []);
    } catch (err) {
      console.error("Error:", err);
      toast({
        title: "Erro",
        description: "Erro ao carregar discipuladores. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPhone = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, "");
    
    // Aplica máscara (XX) XXXXX-XXXX
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").trim();
    } else {
      return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").trim();
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setTelefone(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nomeCompleto.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, preencha o nome completo.",
        variant: "destructive",
      });
      return;
    }

    if (casado && !conjugue.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, preencha o nome do cônjuge.",
        variant: "destructive",
      });
      return;
    }

    if (!discipuladorId) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um discipulador.",
        variant: "destructive",
      });
      return;
    }

    if (!telefone.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, preencha o telefone.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase
        .from("dizimistas")
        .insert({
          nome_completo: nomeCompleto.trim(),
          conjugue: casado ? conjugue.trim() : null,
          discipulador_id: discipuladorId,
          telefone: telefone.replace(/\D/g, ""), // Salva apenas números
          casado: casado,
        });

      if (error) {
        console.error("Error submitting:", error);
        toast({
          title: "Erro",
          description: error.message || "Erro ao cadastrar dizimista. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      setSubmitted(true);
      toast({
        title: "Sucesso!",
        description: "Cadastro realizado com sucesso!",
      });

      // Limpar formulário
      setNomeCompleto("");
      setCasado(false);
      setConjugue("");
      setDiscipuladorId("");
      setTelefone("");
    } catch (err: any) {
      console.error("Error:", err);
      toast({
        title: "Erro",
        description: err.message || "Erro ao cadastrar dizimista. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-3 sm:p-4 safe-area-inset">
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-3 sm:p-4 safe-area-inset">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 px-4 sm:px-6">
            <div className="text-center">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl sm:text-2xl font-bold mb-2">Cadastro Realizado!</h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-6">
                Seu cadastro foi realizado com sucesso. Obrigado!
              </p>
              <Button
                onClick={() => {
                  setSubmitted(false);
                  setNomeCompleto("");
                  setCasado(false);
                  setConjugue("");
                  setDiscipuladorId("");
                  setTelefone("");
                }}
                className="w-full min-h-[48px] touch-manipulation"
              >
                Fazer Novo Cadastro
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-3 sm:p-4 md:p-6 lg:p-8 safe-area-inset">
      <div className="max-w-2xl mx-auto">
        <Card className="border-2">
          <CardHeader className="text-center px-4 sm:px-6 pt-4 sm:pt-6">
            <div className="flex justify-center mb-3 sm:mb-4">
              <img src={logoVideira} alt="Videira Conectada" className="h-14 sm:h-16 md:h-20" />
            </div>
            <CardTitle className="text-lg sm:text-xl md:text-2xl lg:text-3xl">
              Cadastro de Dizimista
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm md:text-base mt-2">
              Preencha os dados abaixo para realizar seu cadastro
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 md:space-y-6">
              {/* Nome Completo */}
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

              {/* Casado */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="casado"
                  checked={casado}
                  onChange={(e) => {
                    setCasado(e.target.checked);
                    if (!e.target.checked) {
                      setConjugue("");
                    }
                  }}
                  className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 touch-manipulation"
                />
                <Label htmlFor="casado" className="text-sm sm:text-base cursor-pointer touch-manipulation">
                  Sou casado(a)
                </Label>
              </div>

              {/* Cônjuge (condicional) */}
              {casado && (
                <div>
                  <Label htmlFor="conjugue" className="text-sm sm:text-base">
                    Nome do Cônjuge <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="conjugue"
                    type="text"
                    value={conjugue}
                    onChange={(e) => setConjugue(e.target.value)}
                    placeholder="Digite o nome do cônjuge"
                    required={casado}
                    className="mt-1 text-sm sm:text-base min-h-[44px] touch-manipulation"
                    autoComplete="name"
                    autoCapitalize="words"
                  />
                </div>
              )}

              {/* Discipulador */}
              <div>
                <Label htmlFor="discipulador" className="text-sm sm:text-base">
                  Discipulador <span className="text-red-500">*</span>
                </Label>
                {discipuladores.length === 0 && !loading ? (
                  <div className="mt-1 p-3 border border-destructive rounded-md bg-destructive/10">
                    <p className="text-sm text-destructive">
                      Nenhum discipulador disponível. Por favor, entre em contato com a administração.
                    </p>
                  </div>
                ) : (
                  <Select 
                    value={discipuladorId} 
                    onValueChange={(value) => {
                      if (value && value !== "empty") {
                        setDiscipuladorId(value);
                      }
                    }}
                    required
                  >
                    <SelectTrigger 
                      id="discipulador" 
                      className="mt-1 text-sm sm:text-base min-h-[44px] touch-manipulation"
                      disabled={discipuladores.length === 0}
                    >
                      <SelectValue placeholder={discipuladores.length === 0 ? "Carregando..." : "Selecione seu discipulador"} />
                    </SelectTrigger>
                    <SelectContent 
                      position="popper" 
                      sideOffset={4} 
                      className="z-[9999] max-h-[50vh]"
                    >
                      {discipuladores.length > 0 ? (
                        discipuladores.map((discipulador) => (
                          <SelectItem 
                            key={discipulador.id} 
                            value={discipulador.id} 
                            className="min-h-[44px] touch-manipulation text-sm"
                          >
                            {discipulador.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="empty" disabled>
                          Nenhum discipulador disponível
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Telefone */}
              <div>
                <Label htmlFor="telefone" className="text-sm sm:text-base">
                  Telefone <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="telefone"
                  type="tel"
                  value={telefone}
                  onChange={handlePhoneChange}
                  placeholder="(00) 00000-0000"
                  required
                  className="mt-1 text-sm sm:text-base min-h-[44px] touch-manipulation"
                  maxLength={15}
                  autoComplete="tel"
                  inputMode="tel"
                />
              </div>

              {/* Botão Submit */}
              <Button
                type="submit"
                disabled={submitting}
                className="w-full text-sm sm:text-base py-3 sm:py-4 min-h-[48px] touch-manipulation"
                size="lg"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cadastrando...
                  </>
                ) : (
                  "Cadastrar"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

