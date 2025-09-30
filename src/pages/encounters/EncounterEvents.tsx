import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import FancyLoader from '@/components/FancyLoader';
import { EncounterEvent, CreateEncounterEventData, EncounterEventFilters } from '@/types/event';
import { encounterEventsService } from '@/integrations/supabase/encounter-events';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CalendarIcon, 
  Plus, 
  MapPin, 
  Users, 
  Edit, 
  Trash2, 
  UserPlus, 
  Eye, 
  EyeOff, 
  DollarSign,
  AlertCircle,
  CheckCircle,
  XCircle,
  Filter,
  Search,
  Download} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { EncounterType } from '@/types/encounter';

// Função para converter data para formato brasileiro (YYYY-MM-DD)
const formatDateToBrazilian = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Função para formatar data para exibição considerando fuso horário brasileiro
const formatDateForDisplay = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${day}/${month}/${year}`;
};

export default function EncounterEvents() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [events, setEvents] = useState<EncounterEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EncounterEvent | null>(null);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [filters, setFilters] = useState<EncounterEventFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const [formData, setFormData] = useState<CreateEncounterEventData>({
    name: '',
    description: '',
    event_dates: [],
    location: '',
    encounterType: 'jovens',
    max_capacity: undefined,
    registration_deadline: '',
    price: 0,
    requirements: '',
    status: 'draft',
  });

  // Pull to refresh
  const handleRefresh = async () => {
    try {
      await loadEvents();
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

  useEffect(() => {
    loadEvents();
  }, []);

  // Aplicar filtros de busca
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFilters(prev => ({
        ...prev,
        search: searchTerm || undefined,
      }));
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Filtrar eventos baseado nos filtros
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Filtro por status
      if (activeTab !== 'all' && event.status !== activeTab) return false;
      
      // Filtro por tipo
      if (filters.encounterType && event.encounterType !== filters.encounterType) return false;
      
      // Filtro por busca
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return (
          event.name.toLowerCase().includes(searchLower) ||
          event.description.toLowerCase().includes(searchLower) ||
          event.location.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });
  }, [events, filters, activeTab]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const events = await encounterEventsService.getEvents(filters);
      
      // Buscar estatísticas para cada evento
      const eventsWithStats = await Promise.all(
        events.map(async (event) => {
          try {
            const stats = await encounterEventsService.getEventStats(event.id);
            return {
              ...event,
              registrations_count: stats.registrations_count,
              attended_count: stats.attended_count,
              total_revenue: stats.total_revenue,
            };
          } catch (error) {
            console.error(`Erro ao buscar estatísticas do evento ${event.id}:`, error);
            return {
              ...event,
              registrations_count: 0,
              attended_count: 0,
              total_revenue: 0,
            };
          }
        })
      );
      
      setEvents(eventsWithStats);
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os eventos de encontro.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    try {
      if (!user) return;

      const newEvent = await encounterEventsService.createEvent(
        {
          ...formData,
          event_dates: selectedDates.map(date => formatDateToBrazilian(date)),
        },
        user.id
      );

      // Adicionar estatísticas iniciais
      const eventWithStats = {
        ...newEvent,
        registrations_count: 0,
        attended_count: 0,
        total_revenue: 0,
      };

      setEvents(prev => [eventWithStats, ...prev]);
      
      toast({
        title: 'Sucesso',
        description: 'Evento de encontro criado com sucesso!',
      });
      
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o evento de encontro.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Tem certeza que deseja excluir este evento de encontro?')) return;

    try {
      await encounterEventsService.deleteEvent(eventId);
      setEvents(prev => prev.filter(event => event.id !== eventId));
      
      toast({
        title: 'Sucesso',
        description: 'Evento de encontro excluído com sucesso!',
      });
    } catch (error) {
      console.error('Erro ao excluir evento:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o evento de encontro.',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (event: EncounterEvent) => {
    setSelectedEvent(event);
    setFormData({
      name: event.name,
      description: event.description,
      event_dates: event.event_dates,
      location: event.location,
      encounterType: event.encounterType,
      max_capacity: event.max_capacity,
      registration_deadline: event.registration_deadline,
      price: event.price,
      requirements: event.requirements,
      status: event.status,
    });
    setSelectedDates(event.event_dates.map(date => {
      // Converter string de data para Date considerando fuso horário brasileiro
      const [year, month, day] = date.split('-').map(Number);
      return new Date(year, month - 1, day);
    }));
    setIsEditDialogOpen(true);
  };

  const handleUpdateEvent = async () => {
    if (!selectedEvent) return;

    try {
      const updatedEvent = await encounterEventsService.updateEvent(selectedEvent.id, {
        name: formData.name,
        description: formData.description,
        event_dates: selectedDates.map(date => formatDateToBrazilian(date)),
        location: formData.location,
        encounterType: formData.encounterType,
        max_capacity: formData.max_capacity,
        registration_deadline: formData.registration_deadline,
        price: formData.price,
        requirements: formData.requirements,
        status: formData.status,
      });

      // Manter as estatísticas existentes
      const eventWithStats = {
        ...updatedEvent,
        registrations_count: selectedEvent.registrations_count,
        attended_count: selectedEvent.attended_count,
        total_revenue: selectedEvent.total_revenue,
      };

      setEvents(prev => prev.map(event => 
        event.id === selectedEvent.id ? eventWithStats : event
      ));
      
      toast({
        title: 'Sucesso',
        description: 'Evento de encontro atualizado com sucesso!',
      });
      
      setIsEditDialogOpen(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Erro ao atualizar evento:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o evento de encontro.',
        variant: 'destructive',
      });
    }
  };

  // Funções auxiliares
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Rascunho</Badge>;
      case 'published':
        return <Badge variant="default">Publicado</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelado</Badge>;
      case 'completed':
        return <Badge variant="outline">Concluído</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Edit className="w-4 h-4" />;
      case 'published':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const downloadEventsSpreadsheet = () => {
    if (filteredEvents.length === 0) {
      toast({
        title: 'Aviso',
        description: 'Nenhum evento para exportar.',
        variant: 'destructive',
      });
      return;
    }

    // Criar dados da planilha
    const spreadsheetData = filteredEvents.map(event => ({
      'Nome do Evento': event.name,
      'Tipo': event.encounterType === 'jovens' ? 'Jovens' : 'Adultos',
      'Local': event.location,
      'Datas': event.event_dates.join(', '),
      'Status': event.status === 'draft' ? 'Rascunho' : 
                event.status === 'published' ? 'Publicado' :
                event.status === 'cancelled' ? 'Cancelado' : 'Concluído',
      'Capacidade Máxima': event.max_capacity || 'Sem limite',
      'Inscrições': event.registrations_count,
      'Compareceram': event.attended_count,
      'Receita Total': formatCurrency(event.total_revenue),
      'Preço': event.price ? formatCurrency(event.price) : 'Gratuito',
      'Prazo de Inscrição': event.registration_deadline || 'Não definido',
      'Requisitos': event.requirements || 'Nenhum',
      'Criado em': format(new Date(event.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
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
            th { background-color: #2563eb; color: white; font-weight: bold; padding: 12px; text-align: center; border: 1px solid #1d4ed8; }
            td { padding: 8px; border: 1px solid #d1d5db; text-align: left; }
            tr:nth-child(even) { background-color: #f9fafb; }
            tr:hover { background-color: #f3f4f6; }
            .status-draft { background-color: #fef3c7; color: #92400e; }
            .status-published { background-color: #d1fae5; color: #065f46; }
            .status-cancelled { background-color: #fee2e2; color: #991b1b; }
            .status-completed { background-color: #dbeafe; color: #1e40af; }
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
                  ${Object.values(row).map(value => `<td>${value}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;
      
      return html;
    };

    // Criar e baixar arquivo
    const htmlContent = createExcelHTML();
    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `eventos-encontro-${format(new Date(), 'dd-MM-yyyy')}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Sucesso',
      description: 'Planilha de eventos exportada com sucesso!',
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      event_dates: [],
      location: '',
      encounterType: 'jovens',
      max_capacity: undefined,
      registration_deadline: '',
      price: 0,
      requirements: '',
      status: 'draft',
    });
    setSelectedDates([]);
  };

  if (!user || !['pastor', 'discipulador'].includes(user.role)) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Acesso restrito para pastores e discipuladores.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <FancyLoader
        message="Preparando os eventos de encontro"
        tips={[
          'Carregando eventos de encontro...',
          'Organizando as datas...',
          'Verificando inscrições...',
        ]}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Eventos de Encontro</h1>
          <p className="text-muted-foreground">
            Gerencie eventos de encontro com Deus de forma completa e profissional
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={downloadEventsSpreadsheet}
            disabled={filteredEvents.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros e Busca
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
                  placeholder="Nome, descrição ou local..."
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
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  encounterType: value === 'all' ? undefined : value as 'jovens' | 'adultos' 
                }))}
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
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setFilters({});
                  setSearchTerm('');
                }}
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de Status */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">Todos ({events.length})</TabsTrigger>
          <TabsTrigger value="draft">Rascunhos ({events.filter(e => e.status === 'draft').length})</TabsTrigger>
          <TabsTrigger value="published">Publicados ({events.filter(e => e.status === 'published').length})</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelados ({events.filter(e => e.status === 'cancelled').length})</TabsTrigger>
          <TabsTrigger value="completed">Concluídos ({events.filter(e => e.status === 'completed').length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              {activeTab === 'all' && 'Todos os Eventos'}
              {activeTab === 'draft' && 'Rascunhos'}
              {activeTab === 'published' && 'Eventos Publicados'}
              {activeTab === 'cancelled' && 'Eventos Cancelados'}
              {activeTab === 'completed' && 'Eventos Concluídos'}
            </h2>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Evento de Encontro
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Criar Evento de Encontro</DialogTitle>
                  <DialogDescription>
                    Crie um novo evento de encontro com Deus com todas as informações necessárias
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4 max-h-[60vh] overflow-y-auto">
                  {/* Informações Básicas */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Informações Básicas</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome do Evento *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Ex: Encontro com Deus - Jovens"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="encounterType">Tipo de Encontro *</Label>
                        <Select
                          value={formData.encounterType}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, encounterType: value as "jovens" | "adultos" }))}
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
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Descrição</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Descreva o evento de encontro..."
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Datas e Local */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Datas e Local</h3>
                    <div className="space-y-2">
                      <Label>Datas do Encontro *</Label>
                      <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedDates.length > 0 
                              ? `${selectedDates.length} data(s) selecionada(s)`
                              : "Selecionar datas"
                            }
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="multiple"
                            selected={selectedDates}
                            onSelect={(dates) => {
                              if (dates) {
                                setSelectedDates(dates);
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      {selectedDates.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedDates.map((date, index) => (
                            <Badge key={index} variant="secondary">
                              {formatDateForDisplay(date)}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="location">Local *</Label>
                        <Input
                          id="location"
                          value={formData.location}
                          onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                          placeholder="Ex: Igreja Videira São Miguel"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="max_capacity">Capacidade Máxima</Label>
                        <Input
                          id="max_capacity"
                          type="number"
                          value={formData.max_capacity || ''}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            max_capacity: e.target.value ? parseInt(e.target.value) : undefined 
                          }))}
                          placeholder="Ex: 100"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Configurações Avançadas */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Configurações Avançadas</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="price">Preço (R$)</Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          value={formData.price || ''}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            price: e.target.value ? parseFloat(e.target.value) : 0 
                          }))}
                          placeholder="0,00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="registration_deadline">Prazo de Inscrição</Label>
                        <Input
                          id="registration_deadline"
                          type="date"
                          value={formData.registration_deadline || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, registration_deadline: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="requirements">Requisitos para Participação</Label>
                      <Textarea
                        id="requirements"
                        value={formData.requirements || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, requirements: e.target.value }))}
                        placeholder="Ex: Idade mínima, documentos necessários..."
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status do Evento</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value: 'draft' | 'published' | 'cancelled' | 'completed') => 
                          setFormData(prev => ({ ...prev, status: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Rascunho</SelectItem>
                          <SelectItem value="published">Publicado</SelectItem>
                          <SelectItem value="cancelled">Cancelado</SelectItem>
                          <SelectItem value="completed">Concluído</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleCreateEvent} 
                    disabled={!formData.name || selectedDates.length === 0 || !formData.location}
                  >
                    Criar Evento
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Events Grid/List */}
          <div className={cn(
            "grid gap-4",
            viewMode === 'grid' ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
          )}>
            {filteredEvents.map((event) => (
              <Card key={event.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{event.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <CalendarIcon className="w-4 h-4" />
                        {event.event_dates.length} dia(s)
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(event.status)}
                      {getStatusBadge(event.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      {event.location}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      {event.registrations_count} inscrito(s)
                      {event.max_capacity && ` / ${event.max_capacity}`}
                    </div>
                    {event.price && event.price > 0 && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <DollarSign className="w-4 h-4" />
                        {formatCurrency(event.price)}
                      </div>
                    )}
                    <div className="text-sm">
                      <p className="text-muted-foreground line-clamp-2">
                        {event.description}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {event.event_dates.slice(0, 3).map((date, index) => {
                        // Converter string de data para Date considerando fuso horário brasileiro
                        const [year, month, day] = date.split('-').map(Number);
                        const eventDate = new Date(year, month - 1, day);
                        return (
                          <Badge key={index} variant="outline" className="text-xs">
                            {formatDateForDisplay(eventDate).substring(0, 5)}
                          </Badge>
                        );
                      })}
                      {event.event_dates.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{event.event_dates.length - 3} mais
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(event)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`/encounters?event=${event.id}`, '_blank')}
                        title="Gerenciar Encontristas"
                      >
                        <UserPlus className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteEvent(event.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredEvents.length === 0 && (
            <div className="text-center py-12">
              <CalendarIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum evento encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {activeTab === 'all' 
                  ? 'Crie seu primeiro evento de encontro para começar'
                  : `Nenhum evento com status "${activeTab}" encontrado`
                }
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Evento
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Evento de Encontro</DialogTitle>
            <DialogDescription>
              Edite as informações do evento de encontro
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4 max-h-[60vh] overflow-y-auto">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informações Básicas</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nome do Evento *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Encontro com Deus - Jovens"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-encounterType">Tipo de Encontro *</Label>
                  <Select
                    value={formData.encounterType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, encounterType: value as "jovens" | "adultos" }))}
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
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Descrição</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva o evento de encontro..."
                  rows={3}
                />
              </div>
            </div>

            {/* Datas e Local */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Datas e Local</h3>
              <div className="space-y-2">
                <Label>Datas do Encontro *</Label>
                <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDates.length > 0 
                        ? `${selectedDates.length} data(s) selecionada(s)`
                        : "Selecionar datas"
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="multiple"
                      selected={selectedDates}
                      onSelect={(dates) => {
                        if (dates) {
                          setSelectedDates(dates);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {selectedDates.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedDates.map((date, index) => (
                      <Badge key={index} variant="secondary">
                        {formatDateForDisplay(date)}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-location">Local *</Label>
                  <Input
                    id="edit-location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Ex: Igreja Videira São Miguel"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-max_capacity">Capacidade Máxima</Label>
                  <Input
                    id="edit-max_capacity"
                    type="number"
                    value={formData.max_capacity || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      max_capacity: e.target.value ? parseInt(e.target.value) : undefined 
                    }))}
                    placeholder="Ex: 100"
                  />
                </div>
              </div>
            </div>

            {/* Configurações Avançadas */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Configurações Avançadas</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-price">Preço (R$)</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    step="0.01"
                    value={formData.price || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      price: e.target.value ? parseFloat(e.target.value) : 0 
                    }))}
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-registration_deadline">Prazo de Inscrição</Label>
                  <Input
                    id="edit-registration_deadline"
                    type="date"
                    value={formData.registration_deadline || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, registration_deadline: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-requirements">Requisitos para Participação</Label>
                <Textarea
                  id="edit-requirements"
                  value={formData.requirements || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, requirements: e.target.value }))}
                  placeholder="Ex: Idade mínima, documentos necessários..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status do Evento</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'draft' | 'published' | 'cancelled' | 'completed') => 
                    setFormData(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="published">Publicado</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdateEvent} 
              disabled={!formData.name || selectedDates.length === 0 || !formData.location}
            >
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}