import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Loader2, Search, Trash2, Users } from "lucide-react";
import logoKids from "@/assets/logo-kids.jpg";
import { formatDateBR } from "@/lib/dateUtils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface KidsRegistration {
  id: string;
  nome_completo: string;
  idade: number | null;
  nome_responsavel: string;
  discipuladora_id: string;
  lider_id: string;
  discipuladora_name: string;
  lider_name: string;
  participacao_confirmada: boolean;
  created_at: string;
}

const KIDS_DATE = "07/03";
const KIDS_TIME = "08:30 as 14:30hs";

export function PublicEncounterKidsRegistrationsView() {
  const { toast } = useToast();
  const [registrations, setRegistrations] = useState<KidsRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDiscipuladora, setSelectedDiscipuladora] = useState("all");
  const [selectedLeader, setSelectedLeader] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  const discipuladoraOptions = useMemo(() => {
    const map = new Map<string, string>();
    registrations.forEach((item) => {
      if (item.discipuladora_id && item.discipuladora_name) {
        map.set(item.discipuladora_id, item.discipuladora_name);
      }
    });
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [registrations]);

  const filteredLeaderOptions = useMemo(() => {
    const scoped =
      selectedDiscipuladora === "all"
        ? registrations
        : registrations.filter((item) => item.discipuladora_id === selectedDiscipuladora);

    const map = new Map<string, string>();
    scoped.forEach((item) => {
      if (item.lider_id && item.lider_name) {
        map.set(item.lider_id, item.lider_name);
      }
    });

    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [registrations, selectedDiscipuladora]);

  useEffect(() => {
    if (
      selectedLeader !== "all" &&
      !filteredLeaderOptions.some((leader) => leader.id === selectedLeader)
    ) {
      setSelectedLeader("all");
    }
  }, [filteredLeaderOptions, selectedLeader]);

  const filteredRegistrations = useMemo(() => {
    return registrations.filter((item) => {
      const matchesSearch =
        searchTerm === "" ||
        item.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nome_responsavel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.discipuladora_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.lider_name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDiscipuladora =
        selectedDiscipuladora === "all" || item.discipuladora_id === selectedDiscipuladora;

      const matchesLeader = selectedLeader === "all" || item.lider_id === selectedLeader;

      return matchesSearch && matchesDiscipuladora && matchesLeader;
    });
  }, [registrations, searchTerm, selectedDiscipuladora, selectedLeader]);

  const stats = useMemo(() => {
    return {
      total: registrations.length,
      filtered: filteredRegistrations.length,
    };
  }, [registrations.length, filteredRegistrations.length]);

  const loadData = async () => {
    try {
      setLoading(true);

      const { data: registrationsData, error: registrationsError } = await (supabase as any)
        .from("encounter_kids_registrations")
        .select(`
          id,
          nome_completo,
          idade,
          nome_responsavel,
          discipuladora_id,
          lider_id,
          participacao_confirmada,
          created_at,
          discipuladora:profiles!encounter_kids_registrations_discipuladora_id_fkey(name),
          lider:profiles!encounter_kids_registrations_lider_id_fkey(name)
        `)
        .order("created_at", { ascending: false });

      if (registrationsError) {
        console.error(registrationsError);
        return;
      }

      const formatted: KidsRegistration[] = (registrationsData || []).map((item: any) => ({
        id: item.id,
        nome_completo: item.nome_completo,
        idade: item.idade,
        nome_responsavel: item.nome_responsavel,
        discipuladora_id: item.discipuladora_id,
        lider_id: item.lider_id,
        discipuladora_name: item.discipuladora?.name || "Não informado",
        lider_name: item.lider?.name || "Não informado",
        participacao_confirmada: !!item.participacao_confirmada,
        created_at: item.created_at,
      }));

      setRegistrations(formatted);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateParticipation = async (registrationId: string, confirmed: boolean) => {
    setUpdatingIds((prev) => {
      const next = new Set(prev);
      next.add(registrationId);
      return next;
    });

    try {
      const { error } = await (supabase as any)
        .from("encounter_kids_registrations")
        .update({ participacao_confirmada: confirmed })
        .eq("id", registrationId);

      if (error) {
        toast({
          title: "Erro",
          description: "Não foi possível atualizar a confirmação.",
          variant: "destructive",
        });
        return;
      }

      setRegistrations((prev) =>
        prev.map((item) =>
          item.id === registrationId
            ? { ...item, participacao_confirmada: confirmed }
            : item
        )
      );
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a confirmação.",
        variant: "destructive",
      });
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(registrationId);
        return next;
      });
    }
  };

  const deleteRegistration = async (registrationId: string, nomeCompleto: string) => {
    const confirmed = window.confirm(
      `Deseja realmente excluir o registro de "${nomeCompleto}"?\n\nEssa acao nao pode ser desfeita.`
    );
    if (!confirmed) return;

    setDeletingIds((prev) => {
      const next = new Set(prev);
      next.add(registrationId);
      return next;
    });

    try {
      const { error } = await (supabase as any)
        .from("encounter_kids_registrations")
        .delete()
        .eq("id", registrationId);

      if (error) {
        toast({
          title: "Erro",
          description: "Nao foi possivel excluir o registro.",
          variant: "destructive",
        });
        return;
      }

      setRegistrations((prev) => prev.filter((item) => item.id !== registrationId));
      toast({
        title: "Sucesso",
        description: "Registro excluido com sucesso.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro",
        description: "Nao foi possivel excluir o registro.",
        variant: "destructive",
      });
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(registrationId);
        return next;
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
            <p className="text-sm text-muted-foreground">Carregando inscrições Kids...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 pb-12 sm:pb-8 pt-4 sm:pt-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-4">
            <img src={logoKids} alt="Videira Kids" className="h-16 sm:h-20 w-auto rounded-md" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Acompanhamento Encontro Kids
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Lista de inscritos para o Encontro Kids
          </p>
        </div>

        <Card className="mb-6 sm:mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-center">
              <div className="flex items-center gap-2 text-cyan-700">
                <Calendar className="h-5 w-5" />
                <span className="font-semibold">
                  Data: {KIDS_DATE} | Horário: {KIDS_TIME}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 sm:mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold text-cyan-600">{stats.total}</p>
                </div>
                <Users className="h-8 w-8 text-cyan-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Filtrados</p>
                  <p className="text-2xl font-bold text-cyan-600">{stats.filtered}</p>
                </div>
                <Search className="h-8 w-8 text-cyan-600" />
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
                    placeholder="Nome, responsável, discipuladora ou líder..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 min-h-[44px] touch-manipulation text-sm sm:text-base"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="discipuladora" className="text-sm font-medium">
                  Discipuladora
                </label>
                <Select
                  value={selectedDiscipuladora}
                  onValueChange={(value) => {
                    setSelectedDiscipuladora(value);
                    setSelectedLeader("all");
                  }}
                >
                  <SelectTrigger
                    id="discipuladora"
                    className="min-h-[44px] touch-manipulation text-sm sm:text-base"
                  >
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent position="item-aligned" className="z-[9999]">
                    <SelectItem value="all" className="min-h-[44px] touch-manipulation">
                      Todas
                    </SelectItem>
                    {discipuladoraOptions.map((discipuladora) => (
                      <SelectItem
                        key={discipuladora.id}
                        value={discipuladora.id}
                        className="min-h-[44px] touch-manipulation"
                      >
                        {discipuladora.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="lider" className="text-sm font-medium">
                  Líder
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
              Lista de Inscritos Kids ({filteredRegistrations.length})
            </CardTitle>
            <CardDescription>Acompanhamento público das inscrições</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredRegistrations.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {registrations.length === 0
                    ? "Nenhum inscrito Kids cadastrado ainda."
                    : "Nenhum inscrito encontrado com os filtros selecionados."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:hidden">
                  {filteredRegistrations.map((item) => (
                    <div key={item.id} className="rounded-lg border bg-card p-4 shadow-sm">
                      <p className="text-base font-semibold leading-tight">{item.nome_completo}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Cadastro: {formatDateBR(new Date(item.created_at))}
                      </p>
                      <div className="mt-3 grid grid-cols-1 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Idade: </span>
                          <span>{item.idade ?? "-"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Responsavel: </span>
                          <span>{item.nome_responsavel}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Discipuladora: </span>
                          <span>{item.discipuladora_name}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Lider: </span>
                          <span>{item.lider_name}</span>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between rounded-md bg-muted/40 p-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium">Participacao</p>
                          <p className="text-xs text-muted-foreground">
                            {item.participacao_confirmada ? "Confirmada" : "Pendente"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {updatingIds.has(item.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          ) : null}
                          <Switch
                            checked={item.participacao_confirmada}
                            onCheckedChange={(checked) => updateParticipation(item.id, checked)}
                            disabled={updatingIds.has(item.id)}
                            aria-label={`Atualizar participacao de ${item.nome_completo}`}
                          />
                        </div>
                      </div>
                      <div className="mt-3">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="w-full"
                          onClick={() => deleteRegistration(item.id, item.nome_completo)}
                          disabled={deletingIds.has(item.id)}
                        >
                          {deletingIds.has(item.id) ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="mr-2 h-4 w-4" />
                          )}
                          Excluir
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden overflow-x-auto -mx-4 sm:mx-0 sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[210px]">Nome Completo</TableHead>
                      <TableHead className="min-w-[90px]">Idade</TableHead>
                      <TableHead className="min-w-[210px]">Nome do Responsável</TableHead>
                      <TableHead className="min-w-[170px]">Discipuladora</TableHead>
                      <TableHead className="min-w-[170px]">Líder</TableHead>
                      <TableHead className="min-w-[180px]">Participação</TableHead>
                      <TableHead className="min-w-[150px]">Data de Cadastro</TableHead>
                      <TableHead className="min-w-[110px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRegistrations.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.nome_completo}</TableCell>
                        <TableCell>{item.idade ?? "-"}</TableCell>
                        <TableCell>{item.nome_responsavel}</TableCell>
                        <TableCell>{item.discipuladora_name}</TableCell>
                        <TableCell>{item.lider_name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={item.participacao_confirmada}
                              onCheckedChange={(checked) => updateParticipation(item.id, checked)}
                              disabled={updatingIds.has(item.id)}
                              aria-label={`Atualizar participação de ${item.nome_completo}`}
                            />
                            <span className="text-sm">
                              {item.participacao_confirmada ? "Confirmada" : "Pendente"}
                            </span>
                            {updatingIds.has(item.id) ? (
                              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDateBR(new Date(item.created_at))}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteRegistration(item.id, item.nome_completo)}
                            disabled={deletingIds.has(item.id)}
                          >
                            {deletingIds.has(item.id) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 sm:mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">Quer fazer uma nova inscrição Kids?</p>
          <a
            href="/cadastro-encontro-kids"
            className="inline-block px-6 py-3 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 transition-colors min-h-[48px] touch-manipulation text-sm sm:text-base"
          >
            Fazer inscrição Kids
          </a>
        </div>
      </div>
    </div>
  );
}
