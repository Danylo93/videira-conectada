import { supabase } from './client';

export interface EncounterOffering {
  id: string;
  encounter_event_id: string;
  amount: number;
  description?: string;
  offering_date: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateOfferingData {
  encounter_event_id: string;
  amount: number;
  description?: string;
  offering_date?: string;
}

export interface UpdateOfferingData {
  amount?: number;
  description?: string;
  offering_date?: string;
}

export const getOfferings = async (encounterEventId?: string) => {
  try {
    let query = supabase
      .from('encounter_offerings')
      .select('*')
      .order('offering_date', { ascending: false });

    if (encounterEventId) {
      query = query.eq('encounter_event_id', encounterEventId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return {
      data: data as EncounterOffering[],
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Erro ao buscar ofertas',
    };
  }
};

export const createOffering = async (data: CreateOfferingData) => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) throw new Error('Perfil do usuário não encontrado');

    const { data: result, error } = await supabase
      .from('encounter_offerings')
      .insert({
        encounter_event_id: data.encounter_event_id,
        amount: data.amount,
        description: data.description,
        offering_date: data.offering_date || new Date().toISOString().split('T')[0],
        created_by: profile.id,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      data: result as EncounterOffering,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Erro ao criar oferta',
    };
  }
};

export const updateOffering = async (id: string, data: UpdateOfferingData) => {
  try {
    const { data: result, error } = await supabase
      .from('encounter_offerings')
      .update({
        amount: data.amount,
        description: data.description,
        offering_date: data.offering_date,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      data: result as EncounterOffering,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Erro ao atualizar oferta',
    };
  }
};

export const deleteOffering = async (id: string) => {
  try {
    const { error } = await supabase
      .from('encounter_offerings')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return {
      data: true,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Erro ao excluir oferta',
    };
  }
};

export const getTotalOfferings = async (encounterEventId?: string) => {
  try {
    let query = supabase
      .from('encounter_offerings')
      .select('amount');

    if (encounterEventId) {
      query = query.eq('encounter_event_id', encounterEventId);
    }

    const { data, error } = await query;

    if (error) throw error;

    const total = data?.reduce((sum, offering) => sum + offering.amount, 0) || 0;

    return {
      data: total,
      error: null,
    };
  } catch (error) {
    return {
      data: 0,
      error: error instanceof Error ? error.message : 'Erro ao calcular total de ofertas',
    };
  }
};
