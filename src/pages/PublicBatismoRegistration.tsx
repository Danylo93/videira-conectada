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
import { CheckCircle2, AlertCircle, Loader2, Calendar, Clock } from "lucide-react";
import logoVideira from "@/assets/logo-videira.png";

interface Leader {
  id: string;
  name: string;
}

export function PublicBatismoRegistration() {
  const { toast } = useToast();
  
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [liderId, setLiderId] = useState("");
  const [tamanhoCamiseta, setTamanhoCamiseta] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    loadLeaders();
  }, []);

  const loadLeaders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, is_kids")
        .eq("role", "lider")
        .or("is_kids.is.null,is_kids.eq.false")
        .order("name");

      if (error) {
        console.error("Error loading leaders:", error);
        toast({
          title: "Erro",
          description: "Erro ao carregar líderes. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      setLeaders(data || []);
    } catch (err) {
      console.error("Error:", err);
      toast({
        title: "Erro",
        description: "Erro ao carregar líderes. Tente novamente.",
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
        description: "Por favor, preencha o nome completo.",
        variant: "destructive",
      });
      return;
    }

    if (!liderId) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um líder.",
        variant: "destructive",
      });
      return;
    }

    if (!tamanhoCamiseta) {
      toast({
        title: "Erro",
        description: "Por favor, selecione o tamanho da camiseta.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase
        .from("batismo_registrations")
        .insert({
          nome_completo: nomeCompleto.trim(),
          lider_id: liderId,
          tamanho_camiseta: tamanhoCamiseta,
        });

      if (error) {
        console.error("Error submitting:", error);
        toast({
          title: "Erro",
          description: error.message || "Erro ao realizar cadastro. Tente novamente.",
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
      setLiderId("");
      setTamanhoCamiseta("");
    } catch (err: any) {
      console.error("Error:", err);
      toast({
        title: "Erro",
        description: err.message || "Erro ao realizar cadastro. Tente novamente.",
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
              <h2 className="text-2xl font-bold mb-2">Cadastro Realizado!</h2>
              <p className="text-muted-foreground mb-4">
                Seu cadastro para o batismo foi realizado com sucesso.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <div className="flex items-center justify-center gap-2 text-blue-700 mb-2">
                  <Calendar className="h-5 w-5" />
                  <p className="font-semibold">29 de Novembro de 2025</p>
                </div>
                <div className="flex items-center justify-center gap-2 text-blue-700">
                  <Clock className="h-5 w-5" />
                  <p className="font-semibold">18:00h</p>
                </div>
              </div>
              <Button
                onClick={() => {
                  setSubmitted(false);
                  setNomeCompleto("");
                  setLiderId("");
                  setTamanhoCamiseta("");
                }}
                className="w-full"
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
              Cadastro para Batismo
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm md:text-base mt-2">
              Preencha os dados abaixo para realizar seu cadastro
            </CardDescription>
            
            {/* Informações do Batismo */}
            <div className="mt-3 sm:mt-4 bg-gradient-to-r from-blue-100 to-purple-100 p-3 sm:p-4 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-blue-700 mb-2">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <p className="font-semibold text-sm sm:text-base md:text-lg">29 de Novembro de 2025</p>
              </div>
              <div className="flex items-center justify-center gap-2 text-blue-700">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <p className="font-semibold text-sm sm:text-base md:text-lg">18:00h</p>
              </div>
            </div>
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

              {/* Líder */}
              <div>
                <Label htmlFor="lider" className="text-sm sm:text-base">
                  Líder <span className="text-red-500">*</span>
                </Label>
                <Select value={liderId} onValueChange={setLiderId} required>
                  <SelectTrigger id="lider" className="mt-1 text-sm sm:text-base min-h-[44px] touch-manipulation">
                    <SelectValue placeholder="Selecione seu líder" />
                  </SelectTrigger>
                  <SelectContent position="item-aligned" className="z-[9999]">
                    {leaders.map((leader) => (
                      <SelectItem key={leader.id} value={leader.id} className="min-h-[44px] touch-manipulation">
                        {leader.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tamanho da Camiseta */}
              <div>
                <Label htmlFor="tamanhoCamiseta" className="text-sm sm:text-base">
                  Tamanho da Camiseta <span className="text-red-500">*</span>
                </Label>
                <Select value={tamanhoCamiseta} onValueChange={setTamanhoCamiseta} required>
                  <SelectTrigger id="tamanhoCamiseta" className="mt-1 text-sm sm:text-base min-h-[44px] touch-manipulation">
                    <SelectValue placeholder="Selecione o tamanho" />
                  </SelectTrigger>
                  <SelectContent position="item-aligned" className="z-[9999]">
                    <SelectItem value="P" className="min-h-[44px] touch-manipulation">P</SelectItem>
                    <SelectItem value="M" className="min-h-[44px] touch-manipulation">M</SelectItem>
                    <SelectItem value="G" className="min-h-[44px] touch-manipulation">G</SelectItem>
                    <SelectItem value="GG" className="min-h-[44px] touch-manipulation">GG</SelectItem>
                  </SelectContent>
                </Select>
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
                  "Confirmar Cadastro"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

