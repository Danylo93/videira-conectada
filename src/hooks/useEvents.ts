import { useState, useEffect } from 'react';
import { eventsService } from '@/integrations/supabase/events';
import type { Event, EventRegistration, CreateEventData, EventRegistrationData } from '@/types/event';
import { toast } from '@/hooks/use-toast';

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await eventsService.getEvents();
      setEvents(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar eventos';
      setError(errorMessage);
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async (eventData: CreateEventData, createdBy: string) => {
    try {
      const newEvent = await eventsService.createEvent(eventData, createdBy);
      setEvents(prev => [...prev, newEvent]);
      toast({
        title: 'Sucesso',
        description: 'Evento criado com sucesso!',
      });
      return newEvent;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar evento';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    }
  };

  const updateEvent = async (id: string, eventData: Partial<CreateEventData>) => {
    try {
      const updatedEvent = await eventsService.updateEvent(id, eventData);
      setEvents(prev => prev.map(event => event.id === id ? updatedEvent : event));
      toast({
        title: 'Sucesso',
        description: 'Evento atualizado com sucesso!',
      });
      return updatedEvent;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar evento';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      await eventsService.deleteEvent(id);
      setEvents(prev => prev.filter(event => event.id !== id));
      toast({
        title: 'Sucesso',
        description: 'Evento removido com sucesso!',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao remover evento';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  return {
    events,
    loading,
    error,
    loadEvents,
    createEvent,
    updateEvent,
    deleteEvent,
  };
}

export function useEventRegistrations(userId?: string) {
  const [registrations, setRegistrations] = useState<(EventRegistration & { event: Event })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRegistrations = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await eventsService.getUserRegistrations(userId);
      setRegistrations(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar inscrições';
      setError(errorMessage);
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const registerForEvent = async (registrationData: EventRegistrationData) => {
    try {
      const newRegistration = await eventsService.registerForEvent(registrationData);
      toast({
        title: 'Sucesso',
        description: 'Inscrição realizada com sucesso!',
      });
      await loadRegistrations(); // Recarregar inscrições
      return newRegistration;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao se inscrever';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    }
  };

  const cancelRegistration = async (registrationId: string) => {
    try {
      await eventsService.cancelRegistration(registrationId);
      setRegistrations(prev => prev.filter(reg => reg.id !== registrationId));
      toast({
        title: 'Sucesso',
        description: 'Inscrição cancelada com sucesso!',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao cancelar inscrição';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    }
  };

  useEffect(() => {
    loadRegistrations();
  }, [userId]);

  return {
    registrations,
    loading,
    error,
    loadRegistrations,
    registerForEvent,
    cancelRegistration,
  };
}
