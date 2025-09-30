import { supabase } from './client';
import { EncounterWithGod, CreateEncounterWithGodData, UpdateEncounterWithGodData, EncounterFilters, EncounterStats } from '@/types/encounter';

export const encountersService = {
  async getEncounters(filters?: EncounterFilters): Promise<EncounterWithGod[]> {
    let query = supabase
      .from('encounter_with_god')
      .select(`
        *,
        leader:profiles!encounter_with_god_leader_id_fkey(id, name),
        discipulador:profiles!encounter_with_god_discipulador_id_fkey(id, name),
        pastor:profiles!encounter_with_god_pastor_id_fkey(id, name),
        event:encounter_events(id, name, event_dates)
      `)
      .order('created_at', { ascending: false });

    if (filters?.encounterType) {
      query = query.eq('encounter_type', filters.encounterType);
    }

    if (filters?.role) {
      query = query.eq('role', filters.role);
    }

    if (filters?.attended !== undefined) {
      query = query.eq('attended', filters.attended);
    }

    if (filters?.encounterDate) {
      const dateStr = filters.encounterDate.toISOString().split('T')[0];
      query = query.eq('encounter_date', dateStr);
    }

    if (filters?.leaderId) {
      query = query.eq('leader_id', filters.leaderId);
    }

    if (filters?.discipuladorId) {
      query = query.eq('discipulador_id', filters.discipuladorId);
    }

    if (filters?.pastorId) {
      query = query.eq('pastor_id', filters.pastorId);
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    if (filters?.eventId) {
      query = query.eq('event_id', filters.eventId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data?.map(encounter => ({
      ...encounter,
      encounterType: encounter.encounter_type,
      role: encounter.role || 'encontrista',
      amountPaid: encounter.amount_paid,
      leaderId: encounter.leader_id,
      discipuladorId: encounter.discipulador_id,
      pastorId: encounter.pastor_id,
      encounterDate: new Date(encounter.encounter_date),
      eventId: encounter.event_id,
      createdBy: encounter.created_by,
      createdAt: new Date(encounter.created_at),
      updatedAt: new Date(encounter.updated_at),
    })) || [];
  },

  async createEncounter(data: CreateEncounterWithGodData, createdBy: string): Promise<EncounterWithGod> {
    const { data: newEncounter, error } = await supabase
      .from('encounter_with_god')
      .insert({
        name: data.name,
        phone: data.phone,
        email: data.email,
        encounter_type: data.encounterType,
        role: data.role,
        attended: data.attended,
        amount_paid: data.role === 'cozinha' ? 0 : data.amountPaid,
        leader_id: data.leaderId,
        discipulador_id: data.discipuladorId,
        pastor_id: data.pastorId,
        notes: data.notes,
        encounter_date: data.encounterDate.toISOString().split('T')[0],
        event_id: data.eventId,
        created_by: createdBy,
      })
      .select(`
        *,
        leader:profiles!encounter_with_god_leader_id_fkey(id, name),
        discipulador:profiles!encounter_with_god_discipulador_id_fkey(id, name),
        pastor:profiles!encounter_with_god_pastor_id_fkey(id, name)
      `)
      .single();

    if (error) throw error;

    return {
      ...newEncounter,
      encounterType: newEncounter.encounter_type,
      role: newEncounter.role || 'encontrista',
      amountPaid: newEncounter.amount_paid,
      leaderId: newEncounter.leader_id,
      discipuladorId: newEncounter.discipulador_id,
      pastorId: newEncounter.pastor_id,
      encounterDate: new Date(newEncounter.encounter_date),
      eventId: newEncounter.event_id,
      createdBy: newEncounter.created_by,
      createdAt: new Date(newEncounter.created_at),
      updatedAt: new Date(newEncounter.updated_at),
    };
  },

  async updateEncounter(id: string, data: UpdateEncounterWithGodData): Promise<EncounterWithGod> {
    const updateData: any = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.encounterType !== undefined) updateData.encounter_type = data.encounterType;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.attended !== undefined) updateData.attended = data.attended;
    if (data.amountPaid !== undefined) {
      updateData.amount_paid = data.role === 'cozinha' ? 0 : data.amountPaid;
    }
    if (data.leaderId !== undefined) updateData.leader_id = data.leaderId;
    if (data.discipuladorId !== undefined) updateData.discipulador_id = data.discipuladorId;
    if (data.pastorId !== undefined) updateData.pastor_id = data.pastorId;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.encounterDate !== undefined) {
      updateData.encounter_date = data.encounterDate.toISOString().split('T')[0];
    }
    if (data.eventId !== undefined) updateData.event_id = data.eventId;

    const { data: updatedEncounter, error } = await supabase
      .from('encounter_with_god')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        leader:profiles!encounter_with_god_leader_id_fkey(id, name),
        discipulador:profiles!encounter_with_god_discipulador_id_fkey(id, name),
        pastor:profiles!encounter_with_god_pastor_id_fkey(id, name)
      `)
      .single();

    if (error) throw error;

    return {
      ...updatedEncounter,
      encounterType: updatedEncounter.encounter_type,
      role: updatedEncounter.role || 'encontrista',
      amountPaid: updatedEncounter.amount_paid,
      leaderId: updatedEncounter.leader_id,
      discipuladorId: updatedEncounter.discipulador_id,
      pastorId: updatedEncounter.pastor_id,
      encounterDate: new Date(updatedEncounter.encounter_date),
      eventId: updatedEncounter.event_id,
      createdBy: updatedEncounter.created_by,
      createdAt: new Date(updatedEncounter.created_at),
      updatedAt: new Date(updatedEncounter.updated_at),
    };
  },

  async deleteEncounter(id: string): Promise<void> {
    const { error } = await supabase
      .from('encounter_with_god')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getEncounterStats(startDate?: Date, endDate?: Date, eventId?: string): Promise<EncounterStats> {
    let query = supabase
      .from('encounter_with_god')
      .select('encounter_type, attended, amount_paid, encounter_date, event_id');

    if (startDate) {
      query = query.gte('encounter_date', startDate.toISOString().split('T')[0]);
    }

    if (endDate) {
      query = query.lte('encounter_date', endDate.toISOString().split('T')[0]);
    }

    if (eventId) {
      query = query.eq('event_id', eventId);
    }

    const { data, error } = await query;

    if (error) throw error;

    const total = data?.length || 0;
    const attended = data?.filter(e => Boolean(e.attended)).length || 0;
    const notAttended = data?.filter(e => !Boolean(e.attended)).length || 0;
    const totalAmount = data?.reduce((sum, e) => sum + (parseFloat(e.amount_paid) || 0), 0) || 0;

    const byType = {
      jovens: data?.filter(e => e.encounter_type === 'jovens').length || 0,
      adultos: data?.filter(e => e.encounter_type === 'adultos').length || 0,
      criancas: data?.filter(e => e.encounter_type === 'criancas').length || 0,
    };

    const byDate = data?.reduce((acc, encounter) => {
      const date = encounter.encounter_date;
      const existing = acc.find(item => item.date === date);
      
      if (existing) {
        existing.count++;
        if (encounter.attended) existing.attended++;
        existing.amount += parseFloat(encounter.amount_paid) || 0;
      } else {
        acc.push({
          date,
          count: 1,
          attended: encounter.attended ? 1 : 0,
          amount: parseFloat(encounter.amount_paid) || 0,
        });
      }
      
      return acc;
    }, [] as Array<{ date: string; count: number; attended: number; amount: number }>) || [];

    return {
      total,
      attended,
      notAttended,
      totalAmount,
      byType,
      byDate,
    };
  },
};
