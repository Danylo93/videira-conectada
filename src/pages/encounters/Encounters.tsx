import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useEncounters, useEncounterStats } from '@/hooks/useEncounters';
import { EncounterWithGod, CreateEncounterWithGodData, EncounterType, EncounterRole, EncounterFilters } from '@/types/encounter';
import { getOfferings } from '@/integrations/supabase/offerings';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import FancyLoader from '@/components/FancyLoader';
import { useSearchParams } from 'react-router-dom';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Search, Filter, Edit, Trash2, Users, DollarSign, CheckCircle, XCircle, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Profile {
  id: string;
  name: string;
  role: string;
}

interface EncounterEvent {
  id: string;
  name: string;
  event_dates: string[];
  encounterType: EncounterType;
}

export default function Encounters() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
  // Capturar o ID do evento da URL
  const eventId = searchParams.get('event');
  
  const [filters, setFilters] = useState<EncounterFilters>({});
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingEncounter, setEditingEncounter] = useState<EncounterWithGod | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isOfferingsDialogOpen, setIsOfferingsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  
  const [leaders, setLeaders] = useState<Profile[]>([]);
  const [discipuladores, setDiscipuladores] = useState<Profile[]>([]);
  const [pastors, setPastors] = useState<Profile[]>([]);
  const [encounterEvents, setEncounterEvents] = useState<EncounterEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [offerings, setOfferings] = useState<{ amount: number; description: string }>({
    amount: 0,
    description: ''
  });
  const [offeringsList, setOfferingsList] = useState<any[]>([]);
  const [offeringsLoading, setOfferingsLoading] = useState(false);

  // Aplicar filtro por evento se especificado na URL
  const encounterFilters = eventId ? { ...filters, eventId } : filters;
  
  const { encounters, loading, error, createEncounter, updateEncounter, deleteEncounter, refetch } = useEncounters(encounterFilters);
  const { stats, loading: statsLoading, refetch: refetchStats } = useEncounterStats(undefined, undefined, eventId);

  // Timeout para evitar travamentos infinitos
  const [forceLoad, setForceLoad] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading || statsLoading) {
        console.warn('Carregamento demorado, forçando exibição...');
        setForceLoad(true);
      }
    }, 10000); // 10 segundos

    return () => clearTimeout(timeout);
  }, [loading, statsLoading]);

  // Marcar como carregado quando os dados estiverem prontos
  useEffect(() => {
    if (!loading && !statsLoading && encounters.length >= 0) {
      setHasLoaded(true);
    }
  }, [loading, statsLoading, encounters.length]);

  // Estado para armazenar informações do evento
  const [eventInfo, setEventInfo] = useState<{ name: string; encounterType: string } | null>(null);

  // Buscar informações do evento
  useEffect(() => {
    const fetchEventInfo = async () => {
      if (!eventId) {
        setEventInfo(null);
        return;
      }

      // Mapear IDs conhecidos para informações do evento
      const eventMap: Record<string, { name: string; encounterType: string }> = {
        '550e8400-e29b-41d4-a716-446655440001': {
          name: 'Encontro com Deus - Jovens Setembro 2025',
          encounterType: 'jovens'
        },
        '550e8400-e29b-41d4-a716-446655440002': {
          name: 'Encontro com Deus - Adultos e Jovens Outubro 2025',
          encounterType: 'adultos'
        }
      };

      // Verificar se é um ID conhecido
      if (eventMap[eventId]) {
        setEventInfo(eventMap[eventId]);
      } else if (eventId.includes('jovens')) {
        setEventInfo({ name: 'Encontro com Deus - Jovens', encounterType: 'jovens' });
      } else if (eventId.includes('adultos')) {
        setEventInfo({ name: 'Encontro com Deus - Adultos', encounterType: 'adultos' });
      } else {
        setEventInfo(null);
      }
    };

    fetchEventInfo();
  }, [eventId]);

  // Determinar o tipo de encontro baseado no eventId
  const getEncounterType = () => {
    if (!eventId) return 'Encontro com Deus';
    
    if (eventInfo) {
      return eventInfo.name;
    }
    
    // Fallback para IDs conhecidos
    if (eventId.includes('jovens') || eventId === '550e8400-e29b-41d4-a716-446655440001') {
      return 'Encontro com Deus - Jovens';
    } else if (eventId.includes('adultos') || eventId === '550e8400-e29b-41d4-a716-446655440002') {
      return 'Encontro com Deus - Adultos';
    }
    
    return 'Encontro com Deus';
  };

  const getEncounterDescription = () => {
    if (!eventId) return 'Gerenciamento de encontros para jovens e adultos';
    
    if (eventInfo) {
      const type = eventInfo.encounterType === 'jovens' ? 'jovens' : 'adultos';
      return `Gerenciamento de encontros para ${type}`;
    }
    
    // Fallback para IDs conhecidos
    if (eventId.includes('jovens') || eventId === '550e8400-e29b-41d4-a716-446655440001') {
      return 'Gerenciamento de encontros para jovens';
    } else if (eventId.includes('adultos') || eventId === '550e8400-e29b-41d4-a716-446655440002') {
      return 'Gerenciamento de encontros para adultos';
    }
    
    return 'Gerenciamento de encontros para jovens e adultos';
  };

  // Pull to refresh
  const handleRefresh = async () => {
    try {
      await Promise.all([
        refetch(),
        refetchStats(),
        // Só carregar ofertas se não estiver carregando
        !offeringsLoading ? loadOfferings() : Promise.resolve()
      ]);
      toast({
        title: 'Sucesso',
        description: 'Dados atualizados!',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar dados',
        variant: 'destructive',
      });
    }
  };

  usePullToRefresh({ onRefresh: handleRefresh });

  const [newEncounter, setNewEncounter] = useState<CreateEncounterWithGodData>({
    name: '',
    phone: '',
    email: '',
    encounterType: 'jovens',
    role: 'encontrista',
    attended: false,
    amountPaid: 170,
    leaderId: '',
    discipuladorId: user?.discipuladorId || '',
    pastorId: user?.pastorId || '',
    notes: '',
    encounterDate: new Date(),
    eventId: '',
  });

  // Update form with user's leadership when user changes
  useEffect(() => {
    if (user) {
      setNewEncounter(prev => ({
        ...prev,
        discipuladorId: user.discipuladorId || '',
        pastorId: user.pastorId || '',
      }));
    }
  }, [user]);

  // Load profiles and encounter events
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        // Load leaders
        const { data: leadersData } = await supabase
          .from('profiles')
          .select('id, name, role')
          .eq('role', 'lider')
          .order('name');

        // Load discipuladores
        const { data: discipuladoresData } = await supabase
          .from('profiles')
          .select('id, name, role')
          .eq('role', 'discipulador')
          .order('name');

        // Load pastors
        const { data: pastorsData } = await supabase
          .from('profiles')
          .select('id, name, role')
          .eq('role', 'pastor')
          .order('name');

        // Load encounter events from Supabase
        const { data: eventsData, error: eventsError } = await supabase
          .from('encounter_events' as any)
          .select('*')
          .order('created_at', { ascending: false });

        if (eventsError) {
          console.error('Error loading encounter events:', eventsError);
          toast({
            title: "Erro",
            description: "Erro ao carregar eventos de encontro",
            variant: "destructive",
          });
        }

        // Transform data to match EncounterEvent interface
        const transformedEvents: EncounterEvent[] = (eventsData || []).map((event: any) => ({
          id: event.id,
          name: event.name,
          event_dates: event.event_dates,
          encounterType: event.encounter_type
        }));

        setLeaders(leadersData || []);
        setDiscipuladores(discipuladoresData || []);
        setPastors(pastorsData || []);
        setEncounterEvents(transformedEvents);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, [user]);

  // Load offerings
  const loadOfferings = useCallback(async () => {
    if (offeringsLoading) return; // Evitar chamadas simultâneas
    
    try {
      setOfferingsLoading(true);
      // Filtrar ofertas por eventId se especificado
      const { data, error } = await getOfferings(eventId);
      if (error) {
        console.error('Error loading offerings:', error);
        // Se houver erro, definir lista vazia para evitar loops
        setOfferingsList([]);
      } else {
        setOfferingsList(data || []);
      }
    } catch (error) {
      console.error('Error loading offerings:', error);
      // Se houver erro, definir lista vazia para evitar loops
      setOfferingsList([]);
    } finally {
      setOfferingsLoading(false);
    }
  }, [eventId]); // Adicionar eventId como dependência

  useEffect(() => {
    // Só carregar ofertas se o usuário estiver autenticado e não estiver carregando
    if (user && !offeringsLoading) {
      loadOfferings();
    }
  }, [user, eventId, loadOfferings]); // Adicionar eventId e loadOfferings como dependências

  // Apply search filter
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFilters(prev => ({
        ...prev,
        search: searchTerm || undefined,
      }));
    }, 500); // Aumentar debounce para 500ms

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Apply date filter
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFilters(prev => ({
        ...prev,
        encounterDate: selectedDate,
      }));
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [selectedDate]);

  if (!user || !['pastor', 'discipulador'].includes(user.role)) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Acesso restrito para pastores e discipuladores.</p>
      </div>
    );
  }

  if ((loading || statsLoading) && !forceLoad && !hasLoaded) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-96 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-10 w-32 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-24 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-32 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg border shadow-sm">
              <div className="space-y-3">
                <div className="h-4 w-24 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse"></div>
                <div className="h-8 w-16 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse"></div>
                <div className="h-3 w-20 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Financial Summary Skeleton */}
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="space-y-4">
            <div className="h-6 w-48 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-32 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse"></div>
                  <div className="h-6 w-24 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filters Skeleton */}
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="space-y-4">
            <div className="h-6 w-24 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>

        {/* Cards por Função Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg border shadow-sm">
              <div className="space-y-4">
                <div className="h-6 w-32 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse"></div>
                <div className="grid grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="space-y-2">
                      <div className="h-4 w-20 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse"></div>
                      <div className="h-6 w-16 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Ofertas Skeleton */}
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="space-y-4">
            <div className="h-6 w-48 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-24 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse"></div>
                  <div className="h-8 w-20 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-6">
            <div className="h-6 w-32 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse mb-4"></div>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-4 w-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-32 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-24 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-20 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-16 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-12 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Erro ao carregar encontros: {error}</p>
      </div>
    );
  }

  const handleCreateEncounter = async () => {
    try {
      await createEncounter(newEncounter);
      setIsAddDialogOpen(false);
      setNewEncounter({
        name: '',
        phone: '',
        email: '',
        encounterType: 'jovens',
        role: 'encontrista',
        attended: false,
        amountPaid: 170,
        leaderId: '',
        discipuladorId: user?.discipuladorId || '',
        pastorId: user?.pastorId || '',
        notes: '',
        encounterDate: new Date(),
        eventId: '',
      });
      toast({
        title: 'Sucesso',
        description: 'Encontro registrado com sucesso!',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao criar encontro',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateEncounter = async () => {
    if (!editingEncounter) return;

    try {
      await updateEncounter(editingEncounter);
      setIsEditDialogOpen(false);
      setEditingEncounter(null);
      toast({
        title: 'Sucesso',
        description: 'Encontro atualizado com sucesso!',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao atualizar encontro',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteEncounter = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este encontro?')) return;

    try {
      await deleteEncounter(id);
      toast({
        title: 'Sucesso',
        description: 'Encontro excluído com sucesso!',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao excluir encontro',
        variant: 'destructive',
      });
    }
  };

  const handleAddOffering = async () => {
    if (!offerings.amount || offerings.amount <= 0) {
      toast({
        title: 'Erro',
        description: 'Por favor, insira um valor válido para a oferta.',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedEventId) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione um evento de encontro.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { createOffering } = await import('@/integrations/supabase/offerings');
      
      const { data, error } = await createOffering({
        encounter_event_id: selectedEventId,
        amount: offerings.amount,
        description: offerings.description,
        offering_date: new Date().toISOString().split('T')[0],
      });

      if (error) throw new Error(error);

      toast({
        title: 'Sucesso',
        description: `Oferta de ${formatCurrency(offerings.amount)} registrada com sucesso!`,
      });
      
      setIsOfferingsDialogOpen(false);
      setOfferings({ amount: 0, description: '' });
      
      // Recarregar ofertas e estatísticas
      const { data: newOfferings } = await getOfferings();
      setOfferingsList(newOfferings || []);
      
      // Recarregar estatísticas para atualizar os valores
      window.location.reload();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao registrar oferta. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (encounter: EncounterWithGod) => {
    setEditingEncounter(encounter);
    setIsEditDialogOpen(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const downloadSpreadsheet = () => {
    // Criar dados da planilha
    const spreadsheetData = encounters.map(encounter => ({
      'Nome': encounter.name,
      'Telefone': encounter.phone || '',
      'Email': encounter.email || '',
      'Tipo': encounter.encounterType === 'jovens' ? 'Jovens' : 'Adultos',
      'Função': encounter.role === 'equipe' ? 'Equipe' : encounter.role === 'cozinha' ? 'Cozinha' : 'Encontrista',
      'Data do Encontro': format(new Date(encounter.encounterDate), 'dd/MM/yyyy', { locale: ptBR }),
      'Compareceu': encounter.attended ? 'Sim' : 'Não',
      'Valor Pago': encounter.amountPaid,
      'Líder': encounter.leader?.name || '',
      'Discipulador': encounter.discipulador?.name || '',
      'Pastor': encounter.pastor?.name || '',
      'Observações': encounter.notes || ''
    }));

    // Criar HTML formatado para Excel
    const createExcelHTML = () => {
      const headers = Object.keys(spreadsheetData[0] || {});
      
      let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <meta name="ExcelCreated" content="true">
          <style>
            table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
            th { background-color: #2563eb; color: white; font-weight: bold; text-align: center; padding: 12px 8px; border: 1px solid #1d4ed8; }
            td { padding: 8px; border: 1px solid #d1d5db; text-align: left; }
            tr:nth-child(even) { background-color: #f9fafb; }
            tr:nth-child(odd) { background-color: white; }
            tr:hover { background-color: #e5e7eb; }
            .number { text-align: right; }
            .center { text-align: center; }
            .status-yes { background-color: #dcfce7; color: #166534; font-weight: bold; }
            .status-no { background-color: #fef2f2; color: #dc2626; font-weight: bold; }
            .role-equipe { background-color: #dbeafe; color: #1e40af; font-weight: bold; }
            .role-encontrista { background-color: #f0f9ff; color: #0c4a6e; font-weight: bold; }
            .role-cozinha { background-color: #f3f4f6; color: #374151; font-weight: bold; }
            .type-jovens { background-color: #fef3c7; color: #92400e; font-weight: bold; }
            .type-adultos { background-color: #e0e7ff; color: #3730a3; font-weight: bold; }
          </style>
        </head>
        <body>
          <table>
            <thead>
              <tr>
                ${headers.map(header => `<th>${header}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${spreadsheetData.map(row => `
                <tr>
                  <td>${row.Nome}</td>
                  <td>${row.Telefone}</td>
                  <td>${row.Email}</td>
                  <td class="center type-${row.Tipo.toLowerCase()}">${row.Tipo}</td>
                  <td class="center role-${row.Função.toLowerCase()}">${row.Função}</td>
                  <td class="center">${row['Data do Encontro']}</td>
                  <td class="center status-${row.Compareceu.toLowerCase()}">${row.Compareceu}</td>
                  <td class="number">R$ ${row['Valor Pago'].toFixed(2).replace('.', ',')}</td>
                  <td>${row.Líder}</td>
                  <td>${row.Discipulador}</td>
                  <td>${row.Pastor}</td>
                  <td>${row.Observações}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;
      
      return html;
    };

    // Criar e baixar arquivo Excel
    const htmlContent = createExcelHTML();
    const blob = new Blob([htmlContent], { 
      type: 'application/vnd.ms-excel;charset=utf-8;' 
    });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `encontristas_${format(new Date(), 'dd-MM-yyyy')}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Sucesso',
      description: 'Planilha Excel formatada baixada com sucesso!',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{getEncounterType()}</h1>
          <p className="text-muted-foreground">
            {getEncounterDescription()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            onClick={downloadSpreadsheet}
            disabled={encounters.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Baixar Planilha
          </Button>
          <Button 
            variant="outline"
            onClick={() => setIsOfferingsDialogOpen(true)}
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Ofertas
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Encontrista
              </Button>
            </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar Novo Encontro</DialogTitle>
              <DialogDescription>
                Preencha os dados do participante do encontro
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>💡 Dica:</strong> Os campos de Discipulador e Pastor são preenchidos automaticamente 
                  baseado no seu perfil. Você pode alterar se necessário.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={newEncounter.name}
                    onChange={(e) => setNewEncounter(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={newEncounter.phone}
                    onChange={(e) => setNewEncounter(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newEncounter.email}
                  onChange={(e) => setNewEncounter(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="encounterType">Tipo de Encontro *</Label>
                  <Select
                    value={newEncounter.encounterType}
                    onValueChange={(value: EncounterType) => setNewEncounter(prev => ({ ...prev, encounterType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jovens">Jovens</SelectItem>
                      <SelectItem value="adultos">Adultos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Função *</Label>
                  <Select
                    value={newEncounter.role}
                    onValueChange={(value: EncounterRole) => {
                      const isCozinha = value === 'cozinha';
                      setNewEncounter(prev => ({ 
                        ...prev, 
                        role: value,
                        amountPaid: isCozinha ? 0 : 170
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equipe">Equipe</SelectItem>
                      <SelectItem value="encontrista">Encontrista</SelectItem>
                      <SelectItem value="cozinha">Cozinha (não paga)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="eventId">Evento de Encontro *</Label>
                  <Select
                    value={newEncounter.eventId}
                    onValueChange={(value) => {
                      const selectedEvent = encounterEvents.find(e => e.id === value);
                      setNewEncounter(prev => ({ 
                        ...prev, 
                        eventId: value,
                        encounterType: selectedEvent?.encounterType || 'jovens',
                        encounterDate: selectedEvent?.event_dates[0] ? new Date(selectedEvent.event_dates[0]) : new Date()
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar evento" />
                    </SelectTrigger>
                    <SelectContent>
                      {encounterEvents.map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.name} - {event.encounterType === 'jovens' ? 'Jovens' : 'Adultos'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="leader">Líder</Label>
                  <Select
                    value={newEncounter.leaderId}
                    onValueChange={(value) => setNewEncounter(prev => ({ ...prev, leaderId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar líder" />
                    </SelectTrigger>
                    <SelectContent>
                      {leaders.map((leader) => (
                        <SelectItem key={leader.id} value={leader.id}>
                          {leader.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discipulador">Discipulador</Label>
                  <Select
                    value={newEncounter.discipuladorId}
                    onValueChange={(value) => setNewEncounter(prev => ({ ...prev, discipuladorId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar discipulador" />
                    </SelectTrigger>
                    <SelectContent>
                      {discipuladores.map((discipulador) => (
                        <SelectItem key={discipulador.id} value={discipulador.id}>
                          {discipulador.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Preenchido automaticamente com seu discipulador
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pastor">Pastor</Label>
                  <Select
                    value={newEncounter.pastorId}
                    onValueChange={(value) => setNewEncounter(prev => ({ ...prev, pastorId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar pastor" />
                    </SelectTrigger>
                    <SelectContent>
                      {pastors.map((pastor) => (
                        <SelectItem key={pastor.id} value={pastor.id}>
                          {pastor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Preenchido automaticamente com seu pastor
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amountPaid">Valor Pago</Label>
                  <Input
                    id="amountPaid"
                    type="number"
                    step="0.01"
                    value={newEncounter.amountPaid}
                    onChange={(e) => setNewEncounter(prev => ({ ...prev, amountPaid: parseFloat(e.target.value) || 0 }))}
                    placeholder="170,00"
                    disabled={newEncounter.role === 'cozinha'}
                    className={newEncounter.role === 'cozinha' ? 'bg-gray-100' : ''}
                  />
                  <p className="text-xs text-muted-foreground">
                    {newEncounter.role === 'cozinha' 
                      ? 'Cozinha não paga - valor automaticamente definido como R$ 0,00'
                      : 'Valor padrão do encontro: R$ 170,00'
                    }
                  </p>
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    id="attended"
                    checked={newEncounter.attended}
                    onCheckedChange={(checked) => setNewEncounter(prev => ({ ...prev, attended: checked }))}
                  />
                  <Label htmlFor="attended">Compareceu</Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={newEncounter.notes}
                  onChange={(e) => setNewEncounter(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Observações adicionais..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateEncounter} disabled={!newEncounter.name || !newEncounter.eventId}>
                Registrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Cards por Função */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card Equipe */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Users className="h-5 w-5" />
              Equipe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-white rounded-lg border">
                  <div className="text-xl font-bold text-green-600">
                    {encounters.filter(e => e.role === 'equipe').length}
                  </div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border">
                  <div className="text-xl font-bold text-green-600">
                    {encounters.filter(e => e.role === 'equipe' && e.attended).length}
                  </div>
                  <div className="text-xs text-muted-foreground">Compareceram</div>
                </div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(encounters.filter(e => e.role === 'equipe' && e.attended).length * 170)}
                </div>
                <div className="text-sm text-muted-foreground">Valor esperado da equipe</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-red-200">
                <div className="text-xl font-bold text-red-600">
                  {formatCurrency((encounters.filter(e => e.role === 'equipe' && e.attended).length * 170) - encounters.filter(e => e.role === 'equipe' && e.attended).reduce((sum, e) => sum + e.amountPaid, 0))}
                </div>
                <div className="text-sm text-muted-foreground">Valor faltante da equipe (sem ofertas)</div>
              </div>
             
              <div className="text-center p-3 bg-white rounded-lg border border-orange-200">
                <div className="text-xl font-bold text-orange-600">
                  {formatCurrency(((encounters.filter(e => e.role === 'equipe' && e.attended).length * 170) - encounters.filter(e => e.role === 'equipe' && e.attended).reduce((sum, e) => sum + e.amountPaid, 0)) - ((offeringsList.reduce((sum, offering) => sum + offering.amount, 0) * encounters.filter(e => e.role === 'equipe' && e.attended).length) / encounters.filter(e => e.attended && e.role !== 'cozinha').length))}
                </div>
                <div className="text-sm text-muted-foreground">Valor faltante final da equipe</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card Encontrista */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Users className="h-5 w-5" />
              Encontrista
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-white rounded-lg border">
                  <div className="text-xl font-bold text-blue-600">
                    {encounters.filter(e => e.role === 'encontrista').length}
                  </div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border">
                  <div className="text-xl font-bold text-blue-600">
                    {encounters.filter(e => e.role === 'encontrista' && e.attended).length}
                  </div>
                  <div className="text-xs text-muted-foreground">Compareceram</div>
                </div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(encounters.filter(e => e.role === 'encontrista' && e.attended).length * 170)}
                </div>
                <div className="text-sm text-muted-foreground">Valor esperado dos encontristas</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-red-200">
                <div className="text-xl font-bold text-red-600">
                  {formatCurrency((encounters.filter(e => e.role === 'encontrista' && e.attended).length * 170) - encounters.filter(e => e.role === 'encontrista' && e.attended).reduce((sum, e) => sum + e.amountPaid, 0))}
                </div>
                <div className="text-sm text-muted-foreground">Valor faltante dos encontristas (sem ofertas)</div>
              </div>
    
              <div className="text-center p-3 bg-white rounded-lg border border-orange-200">
                <div className="text-xl font-bold text-orange-600">
                  {formatCurrency(((encounters.filter(e => e.role === 'encontrista' && e.attended).length * 170) - encounters.filter(e => e.role === 'encontrista' && e.attended).reduce((sum, e) => sum + e.amountPaid, 0)) - ((offeringsList.reduce((sum, offering) => sum + offering.amount, 0) * encounters.filter(e => e.role === 'encontrista' && e.attended).length) / encounters.filter(e => e.attended && e.role !== 'cozinha').length))}
                </div>
                <div className="text-sm text-muted-foreground">Valor faltante final dos encontristas</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumo Geral */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <DollarSign className="h-5 w-5" />
            Resumo Financeiro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 bg-orange-100 rounded-lg border border-orange-200">
            <p className="text-sm text-orange-800">
              <strong>Importante:</strong> O valor de R$ 170,00 será cobrado apenas dos encontristas e equipe que compareceram ao encontro. 
              A cozinha não paga e quem não compareceu também não será cobrado.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency((encounters.filter(e => e.attended && e.role !== 'cozinha').length * 170))}
              </div>
              <div className="text-sm text-muted-foreground">Valor total esperado</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency((stats?.totalAmount || 0) + (offeringsList.reduce((sum, offering) => sum + offering.amount, 0)))}
              </div>
              <div className="text-sm text-muted-foreground">Valor já recebido (inscrições + ofertas)</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency((encounters.filter(e => e.attended && e.role !== 'cozinha').length * 170) - (stats?.totalAmount || 0) - (offeringsList.reduce((sum, offering) => sum + offering.amount, 0)))}
              </div>
              <div className="text-sm text-muted-foreground">Valor restante</div>
            </div>
          </div>
          
          {/* Breakdown dos valores */}
          <div className="mt-4 p-4 bg-orange-100 rounded-lg border border-orange-200">
            <h4 className="font-medium text-orange-800 mb-2">Detalhamento dos Valores:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Inscrições recebidas:</span>
                  <span className="font-medium">{formatCurrency(stats?.totalAmount || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ofertas recebidas:</span>
                  <span className="font-medium">{formatCurrency(offeringsList.reduce((sum, offering) => sum + offering.amount, 0))}</span>
                </div>
                <div className="flex justify-between border-t pt-1">
                  <span className="font-medium text-orange-800">Total recebido:</span>
                  <span className="font-bold text-orange-800">{formatCurrency((stats?.totalAmount || 0) + (offeringsList.reduce((sum, offering) => sum + offering.amount, 0)))}</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Meta de inscrições:</span>
                  <span className="font-medium">{formatCurrency((encounters.filter(e => e.attended && e.role !== 'cozinha').length * 170))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ofertas extras:</span>
                  <span className="font-medium text-green-600">+{formatCurrency(offeringsList.reduce((sum, offering) => sum + offering.amount, 0))}</span>
                </div>
                <div className="flex justify-between border-t pt-1">
                  <span className="font-medium text-orange-800">Valor restante:</span>
                  <span className="font-bold text-red-600">{formatCurrency((encounters.filter(e => e.attended && e.role !== 'cozinha').length * 170) - (stats?.totalAmount || 0) - (offeringsList.reduce((sum, offering) => sum + offering.amount, 0)))}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ofertas Recebidas */}
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-800">
            <DollarSign className="h-5 w-5" />
            Ofertas Recebidas
          </CardTitle>
          <CardDescription>
            Histórico de ofertas registradas para os encontros
          </CardDescription>
        </CardHeader>
        <CardContent>
          {offeringsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Carregando ofertas...</p>
            </div>
          ) : offeringsList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma oferta registrada ainda</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white rounded-lg border">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(offeringsList.reduce((sum, offering) => sum + offering.amount, 0))}
                  </div>
                  <div className="text-sm text-muted-foreground">Total em ofertas</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border">
                  <div className="text-2xl font-bold text-purple-600">
                    {offeringsList.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Ofertas registradas</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(offeringsList.reduce((sum, offering) => sum + offering.amount, 0) / offeringsList.length || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Média por oferta</div>
                </div>
              </div>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {offeringsList.map((offering) => (
                  <div key={offering.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div className="flex-1">
                      <div className="font-medium text-purple-800">
                        {formatCurrency(offering.amount)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {offering.description || 'Sem descrição'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(offering.offering_date).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">
                        {encounterEvents.find(e => e.id === offering.encounter_event_id)?.name || 'Evento não encontrado'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>



      {/* Cards por Rede de Discipuladores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Rede de Discipuladores
          </CardTitle>
          <CardDescription>
            Estatísticas organizadas por discipulador
          </CardDescription>
        </CardHeader>
        <CardContent>
          {discipuladores.filter(discipulador => encounters.some(e => e.discipuladorId === discipulador.id)).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum discipulador com encontros registrados</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {discipuladores
                .filter(discipulador => encounters.some(e => e.discipuladorId === discipulador.id))
                .map((discipulador) => {
              const discipuladorEncounters = encounters.filter(e => e.discipuladorId === discipulador.id);
              const attended = discipuladorEncounters.filter(e => e.attended);
              const equipe = discipuladorEncounters.filter(e => e.role === 'equipe');
              const encontristas = discipuladorEncounters.filter(e => e.role === 'encontrista');
              const cozinha = discipuladorEncounters.filter(e => e.role === 'cozinha');
              
              return (
                <Card key={discipulador.id} className="border-purple-200 bg-purple-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-purple-800">
                      {discipulador.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="text-center p-2 bg-white rounded border">
                        <div className="font-bold text-purple-600">{discipuladorEncounters.length}</div>
                        <div className="text-muted-foreground">Total</div>
                      </div>
                      <div className="text-center p-2 bg-white rounded border">
                        <div className="font-bold text-green-600">{attended.length}</div>
                        <div className="text-muted-foreground">Compareceram</div>
                      </div>
                    </div>
                    
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Equipe:</span>
                        <span className="font-medium">{equipe.length} total ({equipe.filter(e => e.attended).length} compareceram)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Encontristas:</span>
                        <span className="font-medium">{encontristas.length} total ({encontristas.filter(e => e.attended).length} compareceram)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cozinha:</span>
                        <span className="font-medium">{cozinha.length} total ({cozinha.filter(e => e.attended).length} compareceram)</span>
                      </div>
                    </div>
                    
                    <div className="text-center p-2 bg-white rounded border">
                      <div className="font-bold text-purple-600">
                        {formatCurrency(attended.filter(e => e.role !== 'cozinha').length * 170)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Valor esperado ({attended.filter(e => e.role !== 'cozinha').length} pessoas × R$ 170,00)
                      </div>
                    </div>
                    <div className="text-center p-2 bg-white rounded border border-red-200">
                      <div className="font-bold text-red-600">
                        {formatCurrency((attended.filter(e => e.role !== 'cozinha').length * 170) - attended.filter(e => e.role !== 'cozinha').reduce((sum, e) => sum + e.amountPaid, 0))}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Valor faltante (sem ofertas)
                      </div>
                    </div>
                    <div className="text-center p-2 bg-white rounded border border-green-200">
                      <div className="font-bold text-green-600">
                        {formatCurrency(offeringsList.reduce((sum, offering) => sum + offering.amount, 0) / discipuladores.filter(d => encounters.some(e => e.discipuladorId === d.id)).length)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Ofertas divididas igualmente
                      </div>
                    </div>
                    <div className="text-center p-2 bg-white rounded border border-orange-200">
                      <div className="font-bold text-orange-600">
                        {formatCurrency(((attended.filter(e => e.role !== 'cozinha').length * 170) - attended.filter(e => e.role !== 'cozinha').reduce((sum, e) => sum + e.amountPaid, 0)) - (offeringsList.reduce((sum, offering) => sum + offering.amount, 0) / discipuladores.filter(d => encounters.some(e => e.discipuladorId === d.id)).length))}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Valor faltante final
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Incrições de Encontristas e equipe</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.byType.jovens} jovens, {stats.byType.adultos} adultos
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compareceram(Entre equipe e encontristas)</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.attended}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total > 0 ? Math.round((stats.attended / stats.total) * 100) : 0}% do total inscrito
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Não Compareceram</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.notAttended}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total > 0 ? Math.round((stats.notAttended / stats.total) * 100) : 0}% do total inscrito
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inscrições Recebidas</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalAmount)}</div>
              <p className="text-xs text-muted-foreground">
                Apenas inscrições (sem ofertas)
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ofertas Recebidas</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{formatCurrency(offeringsList.reduce((sum, offering) => sum + offering.amount, 0))}</div>
              <p className="text-xs text-muted-foreground">
                Ofertas extras
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Restante</CardTitle>
              <DollarSign className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency((encounters.filter(e => e.attended && e.role !== 'cozinha').length * 170) - (stats?.totalAmount || 0) - (offeringsList.reduce((sum, offering) => sum + offering.amount, 0)))}
              </div>
              <p className="text-xs text-muted-foreground">
                Meta: {formatCurrency(encounters.filter(e => e.attended && e.role !== 'cozinha').length * 170)} | Total: {formatCurrency((stats?.totalAmount || 0) + (offeringsList.reduce((sum, offering) => sum + offering.amount, 0)))}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Nome, telefone ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="min-w-[150px]">
              <Label htmlFor="encounterType">Tipo</Label>
              <Select
                value={filters.encounterType || 'all'}
                onValueChange={(value) => setFilters(prev => ({ ...prev, encounterType: value === 'all' ? undefined : value as EncounterType }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="jovens">Jovens</SelectItem>
                  <SelectItem value="adultos">Adultos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[150px]">
              <Label htmlFor="role">Função</Label>
              <Select
                value={filters.role || 'all'}
                onValueChange={(value) => setFilters(prev => ({ ...prev, role: value === 'all' ? undefined : value as EncounterRole }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as funções" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as funções</SelectItem>
                  <SelectItem value="equipe">Equipe</SelectItem>
                  <SelectItem value="encontrista">Encontrista</SelectItem>
                  <SelectItem value="cozinha">Cozinha</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[150px]">
              <Label htmlFor="attended">Status</Label>
              <Select
                value={filters.attended === undefined ? 'all' : filters.attended.toString()}
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  attended: value === 'all' ? undefined : value === 'true' 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="true">Compareceram</SelectItem>
                  <SelectItem value="false">Não compareceram</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[150px]">
              <Label>Data do Encontro</Label>
              <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: ptBR }) : "Filtrar por data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date);
                      setIsDatePickerOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setFilters({});
                  setSearchTerm('');
                  setSelectedDate(undefined);
                }}
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Encounters Table */}
      <Card>
        <CardHeader>
          <CardTitle>Encontros Registrados</CardTitle>
          <CardDescription>
            {encounters.length} encontro(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Valor Pago</TableHead>
                <TableHead>Cobrança</TableHead>
                <TableHead>Líder</TableHead>
                <TableHead>Discipulador</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {encounters.map((encounter) => (
                <TableRow key={encounter.id}>
                  <TableCell className="font-medium">{encounter.name}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {encounter.phone && <div className="text-sm">{encounter.phone}</div>}
                      {encounter.email && <div className="text-sm text-muted-foreground">{encounter.email}</div>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={encounter.encounterType === 'jovens' ? 'default' : 'secondary'}>
                      {encounter.encounterType === 'jovens' ? 'Jovens' : 'Adultos'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      encounter.role === 'equipe' ? 'default' : 
                      encounter.role === 'cozinha' ? 'secondary' : 
                      'outline'
                    }>
                      {encounter.role === 'equipe' ? 'Equipe' : 
                       encounter.role === 'cozinha' ? 'Cozinha' : 
                       'Encontrista'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(encounter.encounterDate), 'dd/MM/yyyy', { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={encounter.attended ? 'default' : 'destructive'}>
                        {encounter.attended ? 'Compareceu' : 'Não compareceu'}
                      </Badge>
                      {encounter.attended && (
                        <span className="text-xs text-green-600 font-medium">
                          (R$ 170,00)
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatCurrency(encounter.amountPaid)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {encounter.role === 'cozinha' ? (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                          Cozinha não paga
                        </Badge>
                      ) : encounter.attended ? (
                        (() => {
                          const valorRestante = 170 - encounter.amountPaid;
                          if (valorRestante <= 0) {
                            return (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                Pago integralmente
                              </Badge>
                            );
                          } else {
                            return (
                              <Badge variant="default" className="bg-orange-100 text-orange-800">
                                Restante: {formatCurrency(valorRestante)}
                              </Badge>
                            );
                          }
                        })()
                      ) : (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                          Não cobrar
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {encounter.leader?.name || '-'}
                  </TableCell>
                  <TableCell>
                    {encounter.discipulador?.name || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(encounter)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteEncounter(encounter.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {encounters.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum encontro encontrado com os filtros aplicados.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Encontro</DialogTitle>
            <DialogDescription>
              Atualize os dados do participante do encontro
            </DialogDescription>
          </DialogHeader>
          {editingEncounter && (
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nome *</Label>
                  <Input
                    id="edit-name"
                    value={editingEncounter.name}
                    onChange={(e) => setEditingEncounter(prev => prev ? { ...prev, name: e.target.value } : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Telefone</Label>
                  <Input
                    id="edit-phone"
                    value={editingEncounter.phone || ''}
                    onChange={(e) => setEditingEncounter(prev => prev ? { ...prev, phone: e.target.value } : null)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingEncounter.email || ''}
                  onChange={(e) => setEditingEncounter(prev => prev ? { ...prev, email: e.target.value } : null)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-encounterType">Tipo de Encontro *</Label>
                  <Select
                    value={editingEncounter.encounterType}
                    onValueChange={(value: EncounterType) => setEditingEncounter(prev => prev ? { ...prev, encounterType: value } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jovens">Jovens</SelectItem>
                      <SelectItem value="adultos">Adultos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-amountPaid">Valor Pago</Label>
                  <Input
                    id="edit-amountPaid"
                    type="number"
                    step="0.01"
                    value={editingEncounter.amountPaid}
                    onChange={(e) => setEditingEncounter(prev => prev ? { ...prev, amountPaid: parseFloat(e.target.value) || 0 } : null)}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-attended"
                  checked={editingEncounter.attended}
                  onCheckedChange={(checked) => setEditingEncounter(prev => prev ? { ...prev, attended: checked } : null)}
                />
                <Label htmlFor="edit-attended">Compareceu</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-notes">Observações</Label>
                <Textarea
                  id="edit-notes"
                  value={editingEncounter.notes || ''}
                  onChange={(e) => setEditingEncounter(prev => prev ? { ...prev, notes: e.target.value } : null)}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateEncounter} disabled={!editingEncounter?.name}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Ofertas */}
      <Dialog open={isOfferingsDialogOpen} onOpenChange={setIsOfferingsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Oferta</DialogTitle>
            <DialogDescription>
              Adicione uma oferta recebida para o encontro com Deus
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="offering-event">Evento de Encontro</Label>
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um evento" />
                </SelectTrigger>
                <SelectContent>
                  {encounterEvents.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name} - {new Date(event.event_dates[0]).toLocaleDateString('pt-BR')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="offering-amount">Valor da Oferta (R$)</Label>
              <Input
                id="offering-amount"
                type="number"
                step="0.01"
                value={offerings.amount || ''}
                onChange={(e) => setOfferings(prev => ({ 
                  ...prev, 
                  amount: parseFloat(e.target.value) || 0 
                }))}
                placeholder="0,00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="offering-description">Descrição (opcional)</Label>
              <Textarea
                id="offering-description"
                value={offerings.description}
                onChange={(e) => setOfferings(prev => ({ 
                  ...prev, 
                  description: e.target.value 
                }))}
                placeholder="Ex: Oferta especial, doação, etc."
                rows={3}
              />
            </div>
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Total atual:</strong> {formatCurrency(stats?.totalAmount || 0)}<br/>
                <strong>Com esta oferta:</strong> {formatCurrency((stats?.totalAmount || 0) + offerings.amount)}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOfferingsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAddOffering} 
              disabled={!offerings.amount || offerings.amount <= 0 || !selectedEventId}
            >
              Registrar Oferta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
