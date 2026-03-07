import { supabase } from './client';
import { EncounterEvent, CreateEncounterEventData, EncounterEventFilters } from '@/types/event';

const isUnknownColumnError = (error: unknown): boolean => {
  const message = String((error as any)?.message || '').toLowerCase();
  return message.includes('column') && message.includes('does not exist');
};

const inferStatusFromDates = (eventDates: string[]): EncounterEvent['status'] => {
  if (!eventDates.length) return 'draft';
  const lastDate = [...eventDates].sort().at(-1);
  if (!lastDate) return 'draft';
  const today = new Date().toISOString().slice(0, 10);
  return lastDate < today ? 'completed' : 'published';
};

const mapRowToEncounterEvent = (
  row: any,
  stats: { registrations_count: number; attended_count: number; total_revenue: number }
): EncounterEvent => {
  const eventDates = Array.isArray(row?.event_dates)
    ? row.event_dates.map((date: string | Date) =>
        typeof date === 'string' ? date : new Date(date).toISOString().slice(0, 10)
      )
    : [];

  const status = (row?.status as EncounterEvent['status'] | undefined) || inferStatusFromDates(eventDates);

  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    event_dates: eventDates,
    location: row.location || '',
    encounterType: (row.encounter_type || row.encounterType || 'jovens') as EncounterEvent['encounterType'],
    max_capacity: row.max_capacity ?? undefined,
    registration_deadline: row.registration_deadline ?? undefined,
    price: row.price ?? undefined,
    requirements: row.requirements ?? undefined,
    status,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    registrations_count: stats.registrations_count,
    attended_count: stats.attended_count,
    total_revenue: stats.total_revenue,
  };
};

const applyEventFilters = (
  events: EncounterEvent[],
  filters?: EncounterEventFilters
): EncounterEvent[] => {
  if (!filters) return events;

  return events.filter((event) => {
    if (filters.encounterType && event.encounterType !== filters.encounterType) return false;
    if (filters.status && event.status !== filters.status) return false;

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        event.name.toLowerCase().includes(searchLower) ||
        event.description.toLowerCase().includes(searchLower) ||
        event.location.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    return true;
  });
};

const getEncounterStatsMap = async (): Promise<Map<string, { registrations_count: number; attended_count: number; total_revenue: number }>> => {
  const { data, error } = await supabase
    .from('encounter_with_god')
    .select('event_id, attended, amount_paid')
    .not('event_id', 'is', null);

  if (error) {
    throw error;
  }

  const statsMap = new Map<string, { registrations_count: number; attended_count: number; total_revenue: number }>();

  for (const row of data || []) {
    const eventId = row.event_id as string;
    const current = statsMap.get(eventId) || {
      registrations_count: 0,
      attended_count: 0,
      total_revenue: 0,
    };

    current.registrations_count += 1;
    current.attended_count += row.attended ? 1 : 0;
    current.total_revenue += Number(row.amount_paid || 0);

    statsMap.set(eventId, current);
  }

  return statsMap;
};

export const encounterEventsService = {
  async getEvents(filters?: EncounterEventFilters): Promise<EncounterEvent[]> {
    try {
      const [eventsResult, statsMap] = await Promise.all([
        (supabase as any).from('encounter_events').select('*').order('created_at', { ascending: false }),
        getEncounterStatsMap(),
      ]);

      const { data, error } = eventsResult;
      if (error) throw error;

      const mappedEvents = (data || []).map((row: any) =>
        mapRowToEncounterEvent(
          row,
          statsMap.get(row.id) || {
            registrations_count: 0,
            attended_count: 0,
            total_revenue: 0,
          }
        )
      );

      return applyEventFilters(mappedEvents, filters);
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
      return [];
    }
  },

  async getEventById(id: string): Promise<EncounterEvent | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('encounter_events')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      const stats = await this.getEventStats(id);
      return mapRowToEncounterEvent(data, stats);
    } catch (error) {
      console.error('Erro ao buscar evento:', error);
      return null;
    }
  },

  async createEvent(data: CreateEncounterEventData, createdBy: string): Promise<EncounterEvent> {
    const fullPayload = {
      name: data.name,
      description: data.description,
      event_dates: data.event_dates,
      location: data.location,
      encounter_type: data.encounterType,
      max_capacity: data.max_capacity ?? null,
      registration_deadline: data.registration_deadline ?? null,
      price: data.price ?? null,
      requirements: data.requirements ?? null,
      status: data.status,
      created_by: createdBy,
    };

    const basePayload = {
      name: data.name,
      description: data.description,
      event_dates: data.event_dates,
      location: data.location,
      encounter_type: data.encounterType,
      max_capacity: data.max_capacity ?? null,
      created_by: createdBy,
    };

    let insertResult = await (supabase as any)
      .from('encounter_events')
      .insert(fullPayload)
      .select('*')
      .single();

    if (insertResult.error && isUnknownColumnError(insertResult.error)) {
      insertResult = await (supabase as any)
        .from('encounter_events')
        .insert(basePayload)
        .select('*')
        .single();
    }

    if (insertResult.error) {
      throw insertResult.error;
    }

    return mapRowToEncounterEvent(insertResult.data, {
      registrations_count: 0,
      attended_count: 0,
      total_revenue: 0,
    });
  },

  async updateEvent(id: string, data: Partial<CreateEncounterEventData>): Promise<EncounterEvent> {
    const fullPayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (data.name !== undefined) fullPayload.name = data.name;
    if (data.description !== undefined) fullPayload.description = data.description;
    if (data.event_dates !== undefined) fullPayload.event_dates = data.event_dates;
    if (data.location !== undefined) fullPayload.location = data.location;
    if (data.encounterType !== undefined) fullPayload.encounter_type = data.encounterType;
    if (data.max_capacity !== undefined) fullPayload.max_capacity = data.max_capacity;
    if (data.registration_deadline !== undefined) fullPayload.registration_deadline = data.registration_deadline;
    if (data.price !== undefined) fullPayload.price = data.price;
    if (data.requirements !== undefined) fullPayload.requirements = data.requirements;
    if (data.status !== undefined) fullPayload.status = data.status;

    const basePayload: Record<string, any> = {
      updated_at: fullPayload.updated_at,
    };

    for (const key of ['name', 'description', 'event_dates', 'location', 'encounter_type', 'max_capacity']) {
      if (fullPayload[key] !== undefined) {
        basePayload[key] = fullPayload[key];
      }
    }

    let updateResult = await (supabase as any)
      .from('encounter_events')
      .update(fullPayload)
      .eq('id', id)
      .select('*')
      .single();

    if (updateResult.error && isUnknownColumnError(updateResult.error)) {
      updateResult = await (supabase as any)
        .from('encounter_events')
        .update(basePayload)
        .eq('id', id)
        .select('*')
        .single();
    }

    if (updateResult.error) {
      throw updateResult.error;
    }

    const stats = await this.getEventStats(id);
    return mapRowToEncounterEvent(updateResult.data, stats);
  },

  async deleteEvent(id: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('encounter_events')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  },

  async getEventStats(eventId: string): Promise<{
    registrations_count: number;
    attended_count: number;
    total_revenue: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('encounter_with_god')
        .select('attended, amount_paid')
        .eq('event_id', eventId);

      if (error) throw error;

      const registrations_count = data?.length || 0;
      const attended_count = data?.filter((row) => Boolean(row.attended)).length || 0;
      const total_revenue = data?.reduce((sum, row) => sum + Number(row.amount_paid || 0), 0) || 0;

      return {
        registrations_count,
        attended_count,
        total_revenue,
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
