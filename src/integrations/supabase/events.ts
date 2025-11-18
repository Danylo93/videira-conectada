import { supabase } from './client';
import type { Event, EventRegistration, CreateEventData, EventRegistrationData } from '@/types/event';

// Helper para converter string de data (YYYY-MM-DD) para Date no timezone local
const parseLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

// Helper para converter Date para ISO string preservando a data local
// O Supabase armazena TIMESTAMP WITH TIME ZONE, então precisamos garantir
// que a data seja interpretada corretamente no timezone do Brasil (UTC-3)
// Solução: salvar como 03:00 UTC do dia selecionado
// Quando o Supabase converter para o Brasil (UTC-3), será meia-noite (00:00) do mesmo dia
const formatDateForDatabase = (dateString: string): string => {
  // Se já é uma data completa com hora, retorna como está
  if (dateString.includes('T')) {
    return dateString;
  }
  
  // Se é apenas YYYY-MM-DD, criamos uma data UTC que representa meia-noite no Brasil
  // No Brasil (UTC-3): meia-noite local = 03:00 UTC do mesmo dia
  // Exemplo: se o usuário selecionou 29/11/2025, salvamos como 2025-11-29T03:00:00.000Z
  // Quando o Supabase converter para o Brasil (UTC-3), será 29/11/2025 00:00 (meia-noite)
  
  const [year, month, day] = dateString.split('-').map(Number);
  
  // Salva como 03:00 UTC do dia selecionado
  // 03:00 UTC = 00:00 (meia-noite) no Brasil (UTC-3)
  // Isso garante que o dia seja mantido corretamente
  const finalDate = new Date(Date.UTC(year, month - 1, day, 3, 0, 0));
  
  return finalDate.toISOString();
};

export const eventsService = {
  // Buscar todos os eventos
  async getEvents(): Promise<Event[]> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('active', true)
      .order('event_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Buscar evento por ID
  async getEventById(id: string): Promise<Event | null> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Criar evento (apenas pastor)
  async createEvent(eventData: CreateEventData, createdBy: string): Promise<Event> {
    // Converter a data para o formato correto preservando o timezone local
    const eventDate = formatDateForDatabase(eventData.event_date);
    
    const { data, error } = await supabase
      .from('events')
      .insert({
        ...eventData,
        event_date: eventDate,
        created_by: createdBy,
        active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Atualizar evento (apenas pastor)
  async updateEvent(id: string, eventData: Partial<CreateEventData>): Promise<Event> {
    // Converter a data se estiver presente
    const updateData: any = { ...eventData };
    if (eventData.event_date) {
      updateData.event_date = formatDateForDatabase(eventData.event_date);
    }
    
    const { data, error } = await supabase
      .from('events')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Desativar evento (apenas pastor)
  async deleteEvent(id: string): Promise<void> {
    const { error } = await supabase
      .from('events')
      .update({ active: false })
      .eq('id', id);

    if (error) throw error;
  },

  // Buscar inscrições de um evento
  async getEventRegistrations(eventId: string): Promise<EventRegistration[]> {
    const { data, error } = await supabase
      .from('event_registrations')
      .select('*')
      .eq('event_id', eventId)
      .order('registration_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Inscrever em evento (discipulador)
  async registerForEvent(registrationData: EventRegistrationData): Promise<EventRegistration> {
    const { data, error } = await supabase
      .from('event_registrations')
      .insert({
        ...registrationData,
        registration_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Cancelar inscrição
  async cancelRegistration(registrationId: string): Promise<void> {
    const { error } = await supabase
      .from('event_registrations')
      .delete()
      .eq('id', registrationId);

    if (error) throw error;
  },

  // Buscar inscrições de um usuário
  async getUserRegistrations(userId: string): Promise<(EventRegistration & { event: Event })[]> {
    const { data, error } = await supabase
      .from('event_registrations')
      .select(`
        *,
        event:events(*)
      `)
      .or(`leader_name.eq.${userId},discipulador_name.eq.${userId}`)
      .order('registration_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Verificar se usuário já está inscrito
  async isUserRegistered(eventId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('event_registrations')
      .select('id')
      .eq('event_id', eventId)
      .or(`leader_name.eq.${userId},discipulador_name.eq.${userId}`)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  },

  // Contar inscrições de um evento
  async getEventRegistrationCount(eventId: string): Promise<number> {
    const { count, error } = await supabase
      .from('event_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId);

    if (error) throw error;
    return count || 0;
  },
};
