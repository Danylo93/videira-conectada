import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Users, Calendar, Clock, Droplets } from "lucide-react";
import logoVideira from "@/assets/logo-videira.png";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateBR } from "@/lib/dateUtils";

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

const BAPTISM_DATE = new Date("2025-11-29T18:00:00");
const BAPTISM_DATE_FORMATTED = BAPTISM_DATE.toLocaleDateString("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const BAPTISM_TIME = "18:00h";

export function PublicBatizantesView() {
  const [batizantes, setBatizantes] = useState<Batizante[]>([]);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLeader, setSelectedLeader] = useState<string>("all");

  useEffect(() => {
    loadData();
  }, []);

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
      const { data: batizantesData, error: batizantesError } = await (supabase as any)
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
        return;
      }

      // Buscar nomes dos líderes
      const leaderIds = [...new Set((batizantesData || []).map((b: any) => b.lider_id))] as string[];
      
      let leadersMap = new Map<string, string>();
      if (leaderIds.length > 0) {
        const { data: leadersDataForMap } = await supabase
          .from("profiles")
          .select("id, name")
          .in("id", leaderIds);

        leadersMap = new Map(
          (leadersDataForMap || []).map((l) => [l.id, l.name])
        );
      }

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            <p className="text-sm text-muted-foreground">Carregando batizantes...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 pb-12 sm:pb-8 pt-4 sm:pt-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-4">
            <img
              src={logoVideira}
              alt="Videira São Miguel"
              className="h-16 sm:h-20 w-auto"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Acompanhamento dos Batizantes
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Visualize os irmãos que se inscreveram para o batismo
          </p>
        </div>

        {/* Informações do Batismo */}
        <Card className="mb-6 sm:mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-center">
              <div className="flex items-center gap-2 text-purple-700">
                <Calendar className="h-5 w-5" />
                <span className="font-semibold">Data: {BAPTISM_DATE_FORMATTED}</span>
              </div>
              <div className="flex items-center gap-2 text-purple-700">
                <Clock className="h-5 w-5" />
                <span className="font-semibold">Horário: {BAPTISM_TIME}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sm:mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.total}</p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Filtrados</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.filtered}</p>
                </div>
                <Droplets className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="sm:col-span-2 lg:col-span-1">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground mb-2">Por Tamanho</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stats.bySize).map(([size, count]) => (
                  <Badge key={size} variant="secondary" className="text-sm">
                    {size}: {count}
                  </Badge>
                ))}
                {Object.keys(stats.bySize).length === 0 && (
                  <span className="text-sm text-muted-foreground">Nenhum</span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="sm:col-span-2 lg:col-span-1">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground mb-1">Data do Batismo</p>
                <p className="text-lg font-bold text-purple-600">{BAPTISM_DATE_FORMATTED}</p>
                <p className="text-sm text-muted-foreground">{BAPTISM_TIME}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="mb-6 sm:mb-8">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="search" className="text-sm font-medium">
                  Buscar
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    type="text"
                    placeholder="Nome, líder ou tamanho..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 min-h-[44px] touch-manipulation text-sm sm:text-base"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="leader" className="text-sm font-medium">
                  Líder
                </label>
                <Select value={selectedLeader} onValueChange={setSelectedLeader}>
                  <SelectTrigger
                    id="leader"
                    className="min-h-[44px] touch-manipulation text-sm sm:text-base"
                  >
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent position="item-aligned" className="z-[9999]">
                    <SelectItem value="all" className="min-h-[44px] touch-manipulation">
                      Todos
                    </SelectItem>
                    {leaders.map((leader) => (
                      <SelectItem
                        key={leader.id}
                        value={leader.id}
                        className="min-h-[44px] touch-manipulation"
                      >
                        {leader.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Batizantes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">
              Lista de Batizantes ({filteredBatizantes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredBatizantes.length === 0 ? (
              <div className="text-center py-12">
                <Droplets className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {batizantes.length === 0
                    ? "Nenhum batizante cadastrado ainda."
                    : "Nenhum batizante encontrado com os filtros selecionados."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Nome Completo</TableHead>
                      <TableHead className="min-w-[150px]">Líder</TableHead>
                      <TableHead className="min-w-[120px]">Tamanho</TableHead>
                      <TableHead className="min-w-[120px]">Data de Cadastro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBatizantes.map((batizante) => (
                      <TableRow key={batizante.id}>
                        <TableCell className="font-medium">
                          {batizante.nome_completo}
                        </TableCell>
                        <TableCell>{batizante.lider_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{batizante.tamanho_camiseta}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDateBR(new Date(batizante.created_at))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Link para cadastro */}
        <div className="mt-6 sm:mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Quer se inscrever para o batismo?
          </p>
          <a
            href="/cadastro-batismo"
            className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors min-h-[48px] touch-manipulation text-sm sm:text-base"
          >
            Fazer Inscrição
          </a>
        </div>
      </div>
    </div>
  );
}

