import { supabase } from './client';
import type { Event, EventRegistration, CreateEventData, EventRegistrationData } from '@/types/event';

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
    const { data, error } = await supabase
      .from('events')
      .insert({
        ...eventData,
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
    const { data, error } = await supabase
      .from('events')
      .update({
        ...eventData,
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
