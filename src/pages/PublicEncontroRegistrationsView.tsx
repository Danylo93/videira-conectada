import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Loader2, Search, Users } from "lucide-react";
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

interface EncounterRegistration {
  id: string;
  nome_completo: string;
  discipulador_id: string;
  lider_id: string;
  discipulador_name: string;
  lider_name: string;
  created_at: string;
}

export function PublicEncontroRegistrationsView() {
  const [registrations, setRegistrations] = useState<EncounterRegistration[]>([]);
  const [discipuladores, setDiscipuladores] = useState<Discipulador[]>([]);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDiscipulador, setSelectedDiscipulador] = useState("all");
  const [selectedLeader, setSelectedLeader] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  const filteredLeaderOptions = useMemo(() => {
    if (selectedDiscipulador === "all") return leaders;
    return leaders.filter(
      (leader) =>
        leader.discipulador_id === selectedDiscipulador ||
        leader.discipulador_uuid === selectedDiscipulador
    );
  }, [leaders, selectedDiscipulador]);

  const filteredRegistrations = useMemo(() => {
    return registrations.filter((item) => {
      const matchesSearch =
        searchTerm === "" ||
        item.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.discipulador_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.lider_name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDiscipulador =
        selectedDiscipulador === "all" || item.discipulador_id === selectedDiscipulador;

      const matchesLeader = selectedLeader === "all" || item.lider_id === selectedLeader;

      return matchesSearch && matchesDiscipulador && matchesLeader;
    });
  }, [registrations, searchTerm, selectedDiscipulador, selectedLeader]);

  const stats = useMemo(() => {
    return {
      total: registrations.length,
      filtered: filteredRegistrations.length,
    };
  }, [registrations.length, filteredRegistrations.length]);

  const loadData = async () => {
    try {
      setLoading(true);

      const { data: discipuladoresData } = await supabase
        .from("profiles")
        .select("id, name")
        .eq("role", "discipulador")
        .or("is_kids.is.null,is_kids.eq.false")
        .order("name");

      const { data: leadersData } = await (supabase as any)
        .from("profiles")
        .select("id, name, discipulador_id, discipulador_uuid")
        .eq("role", "lider")
        .or("is_kids.is.null,is_kids.eq.false")
        .order("name");

      const { data: registrationsData, error: registrationsError } = await (supabase as any)
        .from("encounter_registrations")
        .select(`
          id,
          nome_completo,
          discipulador_id,
          lider_id,
          created_at,
          discipulador:profiles!encounter_registrations_discipulador_id_fkey(name),
          lider:profiles!encounter_registrations_lider_id_fkey(name)
        `)
        .order("created_at", { ascending: false });

      if (registrationsError) {
        console.error(registrationsError);
        return;
      }

      const formatted: EncounterRegistration[] = (registrationsData || []).map((item: any) => ({
        id: item.id,
        nome_completo: item.nome_completo,
        discipulador_id: item.discipulador_id,
        lider_id: item.lider_id,
        discipulador_name: item.discipulador?.name || "Nao informado",
        lider_name: item.lider?.name || "Nao informado",
        created_at: item.created_at,
      }));

      setDiscipuladores(discipuladoresData || []);
      setLeaders(leadersData || []);
      setRegistrations(formatted);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            <p className="text-sm text-muted-foreground">Carregando encontristas...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 pb-12 sm:pb-8 pt-4 sm:pt-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-4">
            <img src={logoVideira} alt="Videira Sao Miguel" className="h-16 sm:h-20 w-auto" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Acompanhamento dos Encontristas
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Visualize as inscricoes confirmadas para o encontro
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 sm:mb-8">
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
                <Badge variant="secondary" className="text-sm">
                  Lista
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6 sm:mb-8">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label htmlFor="search" className="text-sm font-medium">
                  Buscar
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    type="text"
                    placeholder="Nome, discipulador ou lider..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 min-h-[44px] touch-manipulation text-sm sm:text-base"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="discipulador" className="text-sm font-medium">
                  Discipulador
                </label>
                <Select
                  value={selectedDiscipulador}
                  onValueChange={(value) => {
                    setSelectedDiscipulador(value);
                    setSelectedLeader("all");
                  }}
                >
                  <SelectTrigger
                    id="discipulador"
                    className="min-h-[44px] touch-manipulation text-sm sm:text-base"
                  >
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent position="item-aligned" className="z-[9999]">
                    <SelectItem value="all" className="min-h-[44px] touch-manipulation">
                      Todos
                    </SelectItem>
                    {discipuladores.map((discipulador) => (
                      <SelectItem
                        key={discipulador.id}
                        value={discipulador.id}
                        className="min-h-[44px] touch-manipulation"
                      >
                        {discipulador.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="lider" className="text-sm font-medium">
                  Lider
                </label>
                <Select value={selectedLeader} onValueChange={setSelectedLeader}>
                  <SelectTrigger
                    id="lider"
                    className="min-h-[44px] touch-manipulation text-sm sm:text-base"
                  >
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent position="item-aligned" className="z-[9999]">
                    <SelectItem value="all" className="min-h-[44px] touch-manipulation">
                      Todos
                    </SelectItem>
                    {filteredLeaderOptions.map((leader) => (
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

        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">
              Lista de Encontristas ({filteredRegistrations.length})
            </CardTitle>
            <CardDescription>
              Atualizada em tempo real a partir das inscricoes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredRegistrations.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {registrations.length === 0
                    ? "Nenhum encontrista cadastrado ainda."
                    : "Nenhum encontrista encontrado com os filtros selecionados."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[220px]">Nome Completo</TableHead>
                      <TableHead className="min-w-[180px]">Discipulador</TableHead>
                      <TableHead className="min-w-[180px]">Lider</TableHead>
                      <TableHead className="min-w-[150px]">Data de Cadastro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRegistrations.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.nome_completo}</TableCell>
                        <TableCell>{item.discipulador_name}</TableCell>
                        <TableCell>{item.lider_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDateBR(new Date(item.created_at))}
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

        <div className="mt-6 sm:mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Ainda nao fez sua inscricao para o encontro?
          </p>
          <a
            href="/cadastro-encontro"
            className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors min-h-[48px] touch-manipulation text-sm sm:text-base"
          >
            Fazer Inscricao
          </a>
        </div>
      </div>
    </div>
  );
}
