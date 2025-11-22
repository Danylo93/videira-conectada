import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, Users, Phone, Calendar, AlertCircle, Printer } from "lucide-react";
import logoVideira from "@/assets/logo-videira.png";
import { formatDateBR } from "@/lib/dateUtils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Dizimista {
  id: string;
  nome_completo: string;
  conjugue: string | null;
  discipulador_id: string;
  discipulador_name: string;
  telefone: string;
  casado: boolean;
  created_at: string;
}

interface Discipulador {
  id: string;
  name: string;
}

export function PublicDizimistasView() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [dizimistas, setDizimistas] = useState<Dizimista[]>([]);
  const [discipuladores, setDiscipuladores] = useState<Discipulador[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDiscipulador, setSelectedDiscipulador] = useState<string>("all");
  const [filterCasado, setFilterCasado] = useState<string>("all");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [labelNames, setLabelNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user && (user.role === 'pastor' || user.role === 'obreiro')) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Carregar discipuladores
      const { data: discipData, error: discipError } = await supabase
        .from("profiles")
        .select("id, name")
        .eq("role", "discipulador")
        .order("name");

      if (discipError) {
        console.error("Error loading discipuladores:", discipError);
      } else {
        setDiscipuladores(discipData || []);
      }

      // Carregar dizimistas
      const { data: dizimistasData, error: dizimistasError } = await supabase
        .from("dizimistas")
        .select(`
          id,
          nome_completo,
          conjugue,
          discipulador_id,
          telefone,
          casado,
          created_at
        `)
        .order("created_at", { ascending: false });

      if (dizimistasError) {
        console.error("Error loading dizimistas:", dizimistasError);
        toast({
          title: "Erro",
          description: "Erro ao carregar dizimistas. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      // Buscar nomes dos discipuladores
      const discipuladorIds = [...new Set((dizimistasData || []).map((d: any) => d.discipulador_id))];
      const { data: discipuladoresData } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", discipuladorIds);

      const discipuladoresMap = new Map(
        (discipuladoresData || []).map((d) => [d.id, d.name])
      );

      const formatted: Dizimista[] = (dizimistasData || []).map((d: any) => ({
        id: d.id,
        nome_completo: d.nome_completo,
        conjugue: d.conjugue,
        discipulador_id: d.discipulador_id,
        discipulador_name: discipuladoresMap.get(d.discipulador_id) || "Não informado",
        telefone: d.telefone,
        casado: d.casado,
        created_at: d.created_at,
      }));

      setDizimistas(formatted);
    } catch (err: any) {
      console.error("Error:", err);
      toast({
        title: "Erro",
        description: err.message || "Erro ao carregar dados. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPhone = (phone: string) => {
    const numbers = phone.replace(/\D/g, "");
    if (numbers.length === 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    } else if (numbers.length === 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }
    return phone;
  };

  // Filtrar dizimistas
  const filteredDizimistas = useMemo(() => {
    return dizimistas.filter((d) => {
      // Filtro de busca
      const matchesSearch =
        searchTerm === "" ||
        d.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.conjugue && d.conjugue.toLowerCase().includes(searchTerm.toLowerCase())) ||
        d.discipulador_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.telefone.includes(searchTerm);

      // Filtro de discipulador
      const matchesDiscipulador =
        selectedDiscipulador === "all" || d.discipulador_id === selectedDiscipulador;

      // Filtro de estado civil
      const matchesCasado =
        filterCasado === "all" ||
        (filterCasado === "casado" && d.casado) ||
        (filterCasado === "solteiro" && !d.casado);

      return matchesSearch && matchesDiscipulador && matchesCasado;
    });
  }, [dizimistas, searchTerm, selectedDiscipulador, filterCasado]);

  // Estatísticas
  const stats = useMemo(() => {
    const total = dizimistas.length;
    return { total };
  }, [dizimistas]);

  // Função para formatar nome para etiqueta
  const formatLabelName = (dizimista: Dizimista): string => {
    if (dizimista.casado && dizimista.conjugue) {
      // Extrair partes do nome do marido
      const nomeMarido = dizimista.nome_completo.trim();
      const partesMarido = nomeMarido.split(/\s+/);
      
      // Primeiro nome do marido
      const primeiroNomeMarido = partesMarido[0];
      
      // Último nome do marido (última parte)
      const ultimoNomeMarido = partesMarido[partesMarido.length - 1];
      
      // Primeiro nome da esposa
      const primeiroNomeEsposa = dizimista.conjugue.trim().split(/\s+/)[0];
      
      // Formato: "Danylo e Patricia Oliveira"
      return `${primeiroNomeMarido} e ${primeiroNomeEsposa} ${ultimoNomeMarido}`;
    }
    return dizimista.nome_completo;
  };

  // Abrir dialog de confirmação
  const handlePrintLabels = () => {
    if (filteredDizimistas.length === 0) {
      toast({
        title: "Aviso",
        description: "Não há dizimistas para gerar etiquetas.",
        variant: "destructive",
      });
      return;
    }

    // Gerar nomes formatados iniciais
    const initialNames: Record<string, string> = {};
    filteredDizimistas.forEach((dizimista) => {
      initialNames[dizimista.id] = formatLabelName(dizimista);
    });
    setLabelNames(initialNames);
    setShowConfirmDialog(true);
  };

  // Confirmar e gerar impressão
  const handleConfirmPrint = async () => {
    if (Object.keys(labelNames).length === 0) {
      return;
    }

    // Converter logo para base64 para impressão
    let logoBase64 = '';
    try {
      const response = await fetch(logoVideira);
      const blob = await response.blob();
      const reader = new FileReader();
      logoBase64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve('');
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error loading logo:', error);
      logoBase64 = '';
    }

    // Criar conteúdo HTML para impressão
    const printContent = filteredDizimistas.map((dizimista) => {
      const nome = labelNames[dizimista.id] || formatLabelName(dizimista);
      
      return `
        <div style="
          width: 10cm;
          height: 4cm;
          border: 1px solid #000;
          padding: 0.4cm;
          margin: 0.2cm;
          display: inline-block;
          page-break-inside: avoid;
          font-family: Arial, sans-serif;
          box-sizing: border-box;
          position: relative;
        ">
          ${logoBase64 ? `
            <div style="display: flex; align-items: center; gap: 0.3cm; margin-bottom: 0.2cm;">
              <img src="${logoBase64}" alt="Logo" style="width: 1.2cm; height: 1.2cm; object-fit: contain;" />
              <div style="font-size: 10pt; font-weight: bold; color: #333;">
                Videira São Miguel
              </div>
            </div>
          ` : `
            <div style="font-size: 10pt; font-weight: bold; color: #333; margin-bottom: 0.2cm;">
              Videira São Miguel
            </div>
          `}
          <div style="font-size: 13pt; font-weight: bold; margin-bottom: 0.25cm; line-height: 1.2;">
            ${nome}
          </div>
          <div style="font-size: 10pt; margin-bottom: 0.15cm; color: #555;">
            Discipulador: ${dizimista.discipulador_name}
          </div>
          <div style="font-size: 9pt; color: #666;">
            ${formatPhone(dizimista.telefone)}
          </div>
        </div>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Etiquetas de Dízimo</title>
          <style>
            @media print {
              @page {
                size: A4;
                margin: 1cm;
              }
              body {
                margin: 0;
                padding: 0;
              }
            }
            body {
              font-family: Arial, sans-serif;
              padding: 1cm;
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `;

    // Abrir janela de impressão
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }

    setShowConfirmDialog(false);
  };

  if (!user || (user.role !== 'pastor' && user.role !== 'obreiro')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Acesso Restrito</h2>
              <p className="text-muted-foreground">
                Esta página é restrita para pastores e obreiros.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
              <p className="text-muted-foreground">Carregando dados...</p>
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
                  <img src={logoVideira} alt="Videira Conectada" className="h-16 sm:h-20" />
                </div>
                <CardTitle className="text-xl sm:text-2xl md:text-3xl">
                  Cadastro de Dizimistas
                </CardTitle>
                <CardDescription className="text-sm sm:text-base mt-2">
                  Visualize e gerencie os dizimistas cadastrados
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2 px-3 md:px-6 pt-3 md:pt-6">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-1 md:gap-2">
                <Users className="w-3 h-3 md:w-4 md:h-4" />
                Total de Dizimistas
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
              <div className="text-2xl md:text-3xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 px-3 md:px-6 pt-3 md:pt-6">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-1 md:gap-2">
                <Users className="w-3 h-3 md:w-4 md:h-4" />
                Filtrados
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
              <div className="text-2xl md:text-3xl font-bold text-purple-600">{filteredDizimistas.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros e Ações */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="text-base md:text-lg">Filtros</CardTitle>
              <Button
                onClick={handlePrintLabels}
                disabled={filteredDizimistas.length === 0}
                className="w-full sm:w-auto"
              >
                <Printer className="w-4 h-4 mr-2" />
                Gerar Etiquetas para Impressão
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Busca */}
              <div>
                <Label htmlFor="search" className="text-sm">Buscar</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="search"
                    type="text"
                    placeholder="Nome, cônjuge, discipulador ou telefone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 text-sm sm:text-base"
                  />
                </div>
              </div>

              {/* Filtro por Discipulador */}
              <div>
                <Label htmlFor="discipulador" className="text-sm">Discipulador</Label>
                <Select value={selectedDiscipulador} onValueChange={setSelectedDiscipulador}>
                  <SelectTrigger id="discipulador" className="mt-1 text-sm sm:text-base">
                    <SelectValue placeholder="Todos os discipuladores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {discipuladores.map((discipulador) => (
                      <SelectItem key={discipulador.id} value={discipulador.id}>
                        {discipulador.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por Estado Civil */}
              <div>
                <Label htmlFor="casado" className="text-sm">Estado Civil</Label>
                <Select value={filterCasado} onValueChange={setFilterCasado}>
                  <SelectTrigger id="casado" className="mt-1 text-sm sm:text-base">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="casado">Casados</SelectItem>
                    <SelectItem value="solteiro">Solteiros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Dizimistas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">
              Lista de Dizimistas ({filteredDizimistas.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredDizimistas.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm || selectedDiscipulador !== "all" || filterCasado !== "all"
                    ? "Nenhum dizimista encontrado com os filtros aplicados."
                    : "Nenhum dizimista cadastrado ainda."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">Nome Completo</TableHead>
                      <TableHead className="text-xs sm:text-sm">Cônjuge</TableHead>
                      <TableHead className="text-xs sm:text-sm">Discipulador</TableHead>
                      <TableHead className="text-xs sm:text-sm">Telefone</TableHead>
                      <TableHead className="text-xs sm:text-sm">Estado Civil</TableHead>
                      <TableHead className="text-xs sm:text-sm">Data de Cadastro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDizimistas.map((dizimista) => (
                      <TableRow key={dizimista.id}>
                        <TableCell className="font-medium text-xs sm:text-sm">
                          {dizimista.nome_completo}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          {dizimista.conjugue || "-"}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          {dizimista.discipulador_name}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-muted-foreground" />
                            {formatPhone(dizimista.telefone)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={dizimista.casado ? "default" : "outline"}
                            className="text-xs"
                          >
                            {dizimista.casado ? "Casado" : "Solteiro"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            {formatDateBR(new Date(dizimista.created_at))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog de Confirmação de Nomes */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Confirmar Nomes para Etiquetas</DialogTitle>
              <DialogDescription>
                Revise e edite os nomes que serão impressos nas etiquetas. Para casados, o formato é: Primeiro Nome do Marido + Primeiro Nome da Esposa + Último Nome do Marido
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
              {filteredDizimistas.map((dizimista) => (
                <div key={dizimista.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <Label className="text-xs text-muted-foreground mb-1 block">
                      {dizimista.casado ? "Casado" : "Solteiro"} - {dizimista.discipulador_name}
                    </Label>
                    <Input
                      value={labelNames[dizimista.id] || formatLabelName(dizimista)}
                      onChange={(e) => {
                        setLabelNames((prev) => ({
                          ...prev,
                          [dizimista.id]: e.target.value,
                        }));
                      }}
                      className="text-sm sm:text-base"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Original: {dizimista.nome_completo}
                      {dizimista.conjugue && ` e ${dizimista.conjugue}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleConfirmPrint}>
                <Printer className="w-4 h-4 mr-2" />
                Confirmar e Imprimir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

