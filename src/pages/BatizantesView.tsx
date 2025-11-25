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
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, Users, Calendar, AlertCircle, Download } from "lucide-react";
import { formatDateBR } from "@/lib/dateUtils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import FancyLoader from "@/components/FancyLoader";
import * as XLSX from "xlsx";

interface Batizante {
  id: string;
  nome_completo: string;
  lider_id: string;
  lider_name: string;
  tamanho_camiseta: string;
  created_at: string;
}

interface Leader {
  id: string;
  name: string;
}

export function BatizantesView() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [batizantes, setBatizantes] = useState<Batizante[]>([]);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLeader, setSelectedLeader] = useState<string>("all");

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Carregar líderes (excluindo kids)
      const { data: leadersData, error: leadersError } = await supabase
        .from("profiles")
        .select("id, name")
        .eq("role", "lider")
        .or("is_kids.is.null,is_kids.eq.false")
        .order("name");

      if (leadersError) {
        console.error("Error loading leaders:", leadersError);
      } else {
        setLeaders(leadersData || []);
      }

      // Carregar batizantes
      const { data: batizantesData, error: batizantesError } = await supabase
        .from("batismo_registrations")
        .select(`
          id,
          nome_completo,
          lider_id,
          tamanho_camiseta,
          created_at
        `)
        .order("created_at", { ascending: false });

      if (batizantesError) {
        console.error("Error loading batizantes:", batizantesError);
        toast({
          title: "Erro",
          description: batizantesError.message || "Erro ao carregar batizantes. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      // Buscar nomes dos líderes
      const leaderIds = [...new Set((batizantesData || []).map((b: any) => b.lider_id))];
      const { data: leadersDataForMap } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", leaderIds);

      const leadersMap = new Map(
        (leadersDataForMap || []).map((l) => [l.id, l.name])
      );

      const formatted: Batizante[] = (batizantesData || []).map((b: any) => ({
        id: b.id,
        nome_completo: b.nome_completo,
        lider_id: b.lider_id,
        lider_name: leadersMap.get(b.lider_id) || "Não informado",
        tamanho_camiseta: b.tamanho_camiseta,
        created_at: b.created_at,
      }));

      setBatizantes(formatted);
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

  // Filtrar batizantes
  const filteredBatizantes = useMemo(() => {
    return batizantes.filter((b) => {
      // Filtro de busca
      const matchesSearch =
        searchTerm === "" ||
        b.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.lider_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.tamanho_camiseta.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro de líder
      const matchesLeader =
        selectedLeader === "all" || b.lider_id === selectedLeader;

      return matchesSearch && matchesLeader;
    });
  }, [batizantes, searchTerm, selectedLeader]);

  // Estatísticas
  const stats = useMemo(() => {
    const total = batizantes.length;
    const bySize = filteredBatizantes.reduce((acc, b) => {
      acc[b.tamanho_camiseta] = (acc[b.tamanho_camiseta] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { total, filtered: filteredBatizantes.length, bySize };
  }, [batizantes, filteredBatizantes]);

  // Exportar para Excel
  const handleExportExcel = () => {
    const data = filteredBatizantes.map((b) => ({
      "Nome Completo": b.nome_completo,
      "Líder": b.lider_name,
      "Tamanho Camiseta": b.tamanho_camiseta,
      "Data de Cadastro": formatDateBR(new Date(b.created_at)),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Batizantes");
    
    // Ajustar largura das colunas
    const colWidths = [
      { wch: 30 }, // Nome Completo
      { wch: 25 }, // Líder
      { wch: 18 }, // Tamanho Camiseta
      { wch: 18 }, // Data de Cadastro
    ];
    ws["!cols"] = colWidths;

    XLSX.writeFile(wb, `Batizantes_${new Date().toISOString().split("T")[0]}.xlsx`);
    
    toast({
      title: "Sucesso",
      description: "Arquivo Excel gerado com sucesso!",
    });
  };

  // Verificar permissão de acesso
  const hasAccess = user && (user.role === "pastor" || user.role === "obreiro" || user.role === "discipulador" || user.role === "lider");

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Acesso Restrito</h2>
              <p className="text-muted-foreground">
                Esta página é restrita para pastores, obreiros, discipuladores e líderes.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <FancyLoader
        message="Carregando batizantes"
        tips={[
          "Reunindo os novos discípulos...",
          "Organizando as informações dos batizantes...",
          "Preparando os dados para visualização...",
        ]}
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6 safe-area-inset">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl sm:text-2xl">Acompanhamento Batismo</CardTitle>
              <CardDescription className="text-sm sm:text-base mt-1">
                Visualize e acompanhe os cadastros para o batismo
              </CardDescription>
            </div>
            <Button onClick={handleExportExcel} variant="outline" className="w-full sm:w-auto">
              <Download className="w-4 h-4 mr-2" />
              Exportar Excel
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total de Batizantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Filtrados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.filtered}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Por Tamanho
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {Object.entries(stats.bySize).map(([size, count]) => (
                <div key={size} className="flex items-center justify-between">
                  <span className="text-sm">{size}:</span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Data do Batismo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold">29/11/2025</div>
            <div className="text-xs text-muted-foreground">18:00h</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Busca */}
            <div>
              <Label htmlFor="search" className="text-sm">Buscar</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="search"
                  type="text"
                  placeholder="Nome, líder ou tamanho..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 min-h-[44px] touch-manipulation"
                  autoComplete="off"
                  autoCapitalize="none"
                />
              </div>
            </div>

            {/* Filtro por Líder */}
            <div>
              <Label htmlFor="leader" className="text-sm">Líder</Label>
              <Select value={selectedLeader} onValueChange={setSelectedLeader}>
                <SelectTrigger id="leader" className="mt-1 min-h-[44px] touch-manipulation">
                  <SelectValue placeholder="Todos os líderes" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4} className="z-[9999] max-h-[300px]">
                  <SelectItem value="all" className="min-h-[44px] touch-manipulation">Todos</SelectItem>
                  {leaders.length > 0 ? (
                    leaders.map((leader) => (
                      <SelectItem 
                        key={leader.id} 
                        value={leader.id} 
                        className="min-h-[44px] touch-manipulation"
                      >
                        {leader.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="empty" disabled>
                      Carregando líderes...
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Batizantes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">
            Lista de Batismo ({filteredBatizantes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredBatizantes.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || selectedLeader !== "all"
                  ? "Nenhum batizante encontrado com os filtros aplicados."
                  : "Nenhum batizante cadastrado ainda."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm">Nome Completo</TableHead>
                    <TableHead className="text-xs sm:text-sm">Líder</TableHead>
                    <TableHead className="text-xs sm:text-sm">Tamanho Camiseta</TableHead>
                    <TableHead className="text-xs sm:text-sm">Data de Cadastro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBatizantes.map((batizante) => (
                    <TableRow key={batizante.id}>
                      <TableCell className="font-medium text-xs sm:text-sm">
                        {batizante.nome_completo}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        {batizante.lider_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {batizante.tamanho_camiseta}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          {formatDateBR(new Date(batizante.created_at))}
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
    </div>
  );
}

