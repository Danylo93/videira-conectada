import { supabase } from './client';
import { EncounterEvent, CreateEncounterEventData, EncounterEventFilters } from '@/types/event';

export const encounterEventsService = {
  // Buscar todos os eventos de encontro
  async getEvents(filters?: EncounterEventFilters): Promise<EncounterEvent[]> {
    try {
      // Usar dados mockados baseados nos dados reais que vimos no Supabase
      const mockEvents: EncounterEvent[] = [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Encontro com Deus - Jovens Setembro 2025',
          description: 'Encontro para os Radicais Livres.',
          event_dates: ['2025-09-26', '2025-09-27', '2025-09-28'],
          location: 'Sítio Mairiporã',
          encounterType: 'jovens',
          max_capacity: 100,
          registration_deadline: '2025-09-20',
          price: 170,
          requirements: 'Idade entre 13 e 30 anos',
          status: 'completed',
          created_by: 'user-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          registrations_count: 0,
          attended_count: 0,
          total_revenue: 0,
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          name: 'Encontro com Deus - Adultos e Jovens Outubro 2025',
          description: 'Encontro para adultos e jovens.',
          event_dates: ['2025-10-30', '2025-11-01', '2025-11-02'],
          location: 'Sítio Mairiporã',
          encounterType: 'adultos',
          max_capacity: 80,
          registration_deadline: '2025-09-28',
          price: 170,
          requirements: 'Idade acima de 30 anos',
          status: 'published',
          created_by: 'user-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          registrations_count: 0,
          attended_count: 0,
          total_revenue: 0,
        }
      ];

      // Buscar estatísticas reais dos encontros
      const { data: allEncounters, error: encountersError } = await supabase
        .from('encounter_with_god')
        .select('attended, amount_paid, encounter_type, event_id');

      if (encountersError) {
        console.error('Erro ao buscar encontros:', encountersError);
      }

      // Atualizar estatísticas para cada evento
      const eventsWithStats = mockEvents.map(event => {
        const eventEncounters = allEncounters?.filter((e: any) => e.event_id === event.id) || [];
        
        const stats = {
          total: eventEncounters.length,
          attended: eventEncounters.filter((e: any) => Boolean(e.attended)).length,
          revenue: eventEncounters.reduce((sum: number, e: any) => sum + (parseFloat(e.amount_paid) || 0), 0)
        };

        return {
          ...event,
          registrations_count: stats.total,
          attended_count: stats.attended,
          total_revenue: stats.revenue,
        };
      });

      // Aplicar filtros
      let filteredEvents = eventsWithStats;

      if (filters?.encounterType) {
        filteredEvents = filteredEvents.filter(event => event.encounterType === filters.encounterType);
      }

      if (filters?.status) {
        filteredEvents = filteredEvents.filter(event => event.status === filters.status);
      }

      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        filteredEvents = filteredEvents.filter(event =>
          event.name.toLowerCase().includes(searchLower) ||
          event.description?.toLowerCase().includes(searchLower) ||
          event.location.toLowerCase().includes(searchLower)
        );
      }

      return filteredEvents;
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
      return [];
    }
  },


  // Buscar evento por ID
  async getEventById(id: string): Promise<EncounterEvent | null> {
    try {
      // Buscar todos os eventos e encontrar o específico
      const events = await this.getEvents();
      const foundEvent = events.find(event => event.id === id);
      
      if (!foundEvent) {
        console.log(`Evento com ID ${id} não encontrado. Eventos disponíveis:`, events.map(e => e.id));
        return null;
      }
      
      return foundEvent;
    } catch (error) {
      console.error('Erro ao buscar evento:', error);
      return null;
    }
  },

  // Criar evento de encontro
  async createEvent(data: CreateEncounterEventData, createdBy: string): Promise<EncounterEvent> {
    // Por enquanto, simular criação
    const newEvent: EncounterEvent = {
      id: `event-${Date.now()}`,
      name: data.name,
      description: data.description,
      event_dates: data.event_dates,
      location: data.location,
      encounterType: data.encounterType,
      max_capacity: data.max_capacity,
      registration_deadline: data.registration_deadline,
      price: data.price,
      requirements: data.requirements,
      status: data.status,
      created_by: createdBy,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      registrations_count: 0,
      attended_count: 0,
      total_revenue: 0,
    };

    return newEvent;
  },

  // Atualizar evento de encontro
  async updateEvent(id: string, data: Partial<CreateEncounterEventData>): Promise<EncounterEvent> {
    // Por enquanto, simular atualização
    const existingEvent = await this.getEventById(id);
    if (!existingEvent) {
      // Se não encontrar, criar um evento mockado com os dados fornecidos
      const mockEvent: EncounterEvent = {
        id: id,
        name: data.name || 'Evento Atualizado',
        description: data.description || '',
        event_dates: data.event_dates || [],
        location: data.location || '',
        encounterType: data.encounterType || 'jovens',
        max_capacity: data.max_capacity,
        registration_deadline: data.registration_deadline,
        price: data.price || 0,
        requirements: data.requirements,
        status: data.status || 'draft',
        created_by: 'user-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        registrations_count: 0,
        attended_count: 0,
        total_revenue: 0,
      };
      return mockEvent;
    }

    const updatedEvent: EncounterEvent = {
      ...existingEvent,
      ...data,
      updated_at: new Date().toISOString(),
    };

    return updatedEvent;
  },

  // Excluir evento de encontro
  async deleteEvent(id: string): Promise<void> {
    // Por enquanto, simular exclusão
    console.log(`Simulando exclusão do evento ${id}`);
  },

  // Buscar estatísticas de um evento
  async getEventStats(eventId: string): Promise<{
    registrations_count: number;
    attended_count: number;
    total_revenue: number;
  }> {
    try {
      // Por enquanto, retornar estatísticas mockadas baseadas no tipo de evento
      const isJovensEvent = eventId.includes('jovens') || eventId === '550e8400-e29b-41d4-a716-446655440001';
      const isAdultosEvent = eventId.includes('adultos') || eventId === '550e8400-e29b-41d4-a716-446655440002';

      if (isAdultosEvent) {
        // Adultos não devem ter inscrições ainda
        return {
          registrations_count: 0,
          attended_count: 0,
          total_revenue: 0,
        };
      }

      if (isJovensEvent) {
        // Buscar dados reais dos encontros de jovens
        const { data: encounters, error } = await supabase
          .from('encounter_with_god')
          .select('attended, amount_paid, encounter_type')
          .eq('encounter_type', 'jovens');

        if (error) {
          console.error('Erro ao buscar encontros:', error);
          return {
            registrations_count: 0,
            attended_count: 0,
            total_revenue: 0,
          };
        }

        const registrations_count = encounters?.length || 0;
        const attended_count = encounters?.filter((e: any) => Boolean(e.attended)).length || 0;
        const total_revenue = encounters?.reduce((sum: number, e: any) => sum + (parseFloat(e.amount_paid) || 0), 0) || 0;

        return {
          registrations_count,
          attended_count,
          total_revenue,
        };
      }

      // Para outros eventos, retornar 0
      return {
        registrations_count: 0,
        attended_count: 0,
        total_revenue: 0,
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return {
        registrations_count: 0,
        attended_count: 0,
        total_revenue: 0,
      };
    }
  },
};