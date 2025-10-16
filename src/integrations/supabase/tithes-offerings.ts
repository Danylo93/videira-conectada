import { supabase } from './client';
import { TitheOffering, TitheOfferingFilters, TitheOfferingStats } from '@/types/church';

export class TithesOfferingsService {
  async getTithesOfferings(filters?: TitheOfferingFilters): Promise<{ data: TitheOffering[]; error: string | null }> {
    try {
      let query = supabase
        .from('tithes_offerings')
        .select('*')
        .order('received_at', { ascending: false });

      if (filters?.personType) {
        query = query.eq('person_type', filters.personType);
      }

      if (filters?.type) {
        query = query.eq('type', filters.type);
      }

      if (filters?.month) {
        query = query.eq('month', filters.month);
      }

      if (filters?.year) {
        query = query.eq('year', filters.year);
      }

      if (filters?.receivedBy) {
        query = query.eq('received_by', filters.receivedBy);
      }

      if (filters?.search) {
        query = query.or(`person_name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching tithes and offerings:', error);
        return { data: [], error: error.message };
      }

      const formattedData: TitheOffering[] = (data || []).map((item) => ({
        id: item.id,
        personId: item.person_id,
        personName: item.person_name,
        personType: item.person_type,
        type: item.type,
        amount: parseFloat(item.amount),
        month: item.month,
        year: item.year,
        description: item.description,
        paymentMethod: item.payment_method,
        receivedBy: item.received_by,
        receivedByName: item.received_by_name,
        receivedAt: new Date(item.received_at),
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
      }));

      return { data: formattedData, error: null };
    } catch (error) {
      console.error('Error in getTithesOfferings:', error);
      return { data: [], error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  }

  async createTitheOffering(data: Omit<TitheOffering, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ data: TitheOffering | null; error: string | null }> {
    try {
      const { data: result, error } = await supabase
        .from('tithes_offerings')
        .insert([
          {
            person_id: data.personId,
            person_name: data.personName,
            person_type: data.personType,
            type: data.type,
            amount: data.amount,
            month: data.month,
            year: data.year,
            description: data.description,
            payment_method: data.paymentMethod,
            received_by: data.receivedBy,
            received_by_name: data.receivedByName,
            received_at: data.receivedAt.toISOString(),
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating tithe/offering:', error);
        return { data: null, error: error.message };
      }

      const formattedData: TitheOffering = {
        id: result.id,
        personId: result.person_id,
        personName: result.person_name,
        personType: result.person_type,
        type: result.type,
        amount: parseFloat(result.amount),
        month: result.month,
        year: result.year,
        description: result.description,
        paymentMethod: result.payment_method,
        receivedBy: result.received_by,
        receivedByName: result.received_by_name,
        receivedAt: new Date(result.received_at),
        createdAt: new Date(result.created_at),
        updatedAt: new Date(result.updated_at),
      };

      return { data: formattedData, error: null };
    } catch (error) {
      console.error('Error in createTitheOffering:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  }

  async updateTitheOffering(id: string, data: Partial<Omit<TitheOffering, 'id' | 'createdAt' | 'updatedAt'>>): Promise<{ data: TitheOffering | null; error: string | null }> {
    try {
      const updateData: any = {};

      if (data.personId !== undefined) updateData.person_id = data.personId;
      if (data.personName !== undefined) updateData.person_name = data.personName;
      if (data.personType !== undefined) updateData.person_type = data.personType;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.amount !== undefined) updateData.amount = data.amount;
      if (data.month !== undefined) updateData.month = data.month;
      if (data.year !== undefined) updateData.year = data.year;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.paymentMethod !== undefined) updateData.payment_method = data.paymentMethod;
      if (data.receivedBy !== undefined) updateData.received_by = data.receivedBy;
      if (data.receivedByName !== undefined) updateData.received_by_name = data.receivedByName;
      if (data.receivedAt !== undefined) updateData.received_at = data.receivedAt.toISOString();

      const { data: result, error } = await supabase
        .from('tithes_offerings')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating tithe/offering:', error);
        return { data: null, error: error.message };
      }

      const formattedData: TitheOffering = {
        id: result.id,
        personId: result.person_id,
        personName: result.person_name,
        personType: result.person_type,
        type: result.type,
        amount: parseFloat(result.amount),
        month: result.month,
        year: result.year,
        description: result.description,
        paymentMethod: result.payment_method,
        receivedBy: result.received_by,
        receivedByName: result.received_by_name,
        receivedAt: new Date(result.received_at),
        createdAt: new Date(result.created_at),
        updatedAt: new Date(result.updated_at),
      };

      return { data: formattedData, error: null };
    } catch (error) {
      console.error('Error in updateTitheOffering:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  }

  async deleteTitheOffering(id: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('tithes_offerings')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting tithe/offering:', error);
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      console.error('Error in deleteTitheOffering:', error);
      return { error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  }

  async getTithesOfferingsStats(month?: number, year?: number): Promise<{ data: TitheOfferingStats | null; error: string | null }> {
    try {
      let query = supabase.from('tithes_offerings').select('*');

      if (month) {
        query = query.eq('month', month);
      }

      if (year) {
        query = query.eq('year', year);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching tithes/offerings stats:', error);
        return { data: null, error: error.message };
      }

      if (!data) {
        return {
          data: {
            totalTithes: 0,
            totalOfferings: 0,
            totalSpecialOfferings: 0,
            totalAmount: 0,
            monthlyBreakdown: [],
            byPersonType: [],
            byPaymentMethod: [],
          },
          error: null,
        };
      }

      // Calculate stats
      const totalTithes = data
        .filter((item) => item.type === 'tithe')
        .reduce((sum, item) => sum + parseFloat(item.amount), 0);

      const totalOfferings = data
        .filter((item) => item.type === 'offering')
        .reduce((sum, item) => sum + parseFloat(item.amount), 0);

      const totalSpecialOfferings = data
        .filter((item) => item.type === 'special_offering')
        .reduce((sum, item) => sum + parseFloat(item.amount), 0);

      const totalAmount = totalTithes + totalOfferings + totalSpecialOfferings;

      // Monthly breakdown
      const monthlyData = data.reduce((acc: any, item) => {
        const key = `${item.year}-${item.month}`;
        if (!acc[key]) {
          acc[key] = {
            month: item.month,
            year: item.year,
            tithes: 0,
            offerings: 0,
            specialOfferings: 0,
            total: 0,
          };
        }
        
        const amount = parseFloat(item.amount);
        acc[key].total += amount;
        
        switch (item.type) {
          case 'tithe':
            acc[key].tithes += amount;
            break;
          case 'offering':
            acc[key].offerings += amount;
            break;
          case 'special_offering':
            acc[key].specialOfferings += amount;
            break;
        }
        
        return acc;
      }, {});

      const monthlyBreakdown = Object.values(monthlyData);

      // By person type
      const personTypeData = data.reduce((acc: any, item) => {
        if (!acc[item.person_type]) {
          acc[item.person_type] = { count: 0, totalAmount: 0 };
        }
        acc[item.person_type].count += 1;
        acc[item.person_type].totalAmount += parseFloat(item.amount);
        return acc;
      }, {});

      const byPersonType = Object.entries(personTypeData).map(([personType, stats]: [string, any]) => ({
        personType,
        count: stats.count,
        totalAmount: stats.totalAmount,
      }));

      // By payment method
      const paymentMethodData = data.reduce((acc: any, item) => {
        if (!acc[item.payment_method]) {
          acc[item.payment_method] = { count: 0, totalAmount: 0 };
        }
        acc[item.payment_method].count += 1;
        acc[item.payment_method].totalAmount += parseFloat(item.amount);
        return acc;
      }, {});

      const byPaymentMethod = Object.entries(paymentMethodData).map(([paymentMethod, stats]: [string, any]) => ({
        paymentMethod,
        count: stats.count,
        totalAmount: stats.totalAmount,
      }));

      return {
        data: {
          totalTithes,
          totalOfferings,
          totalSpecialOfferings,
          totalAmount,
          monthlyBreakdown,
          byPersonType,
          byPaymentMethod,
        },
        error: null,
      };
    } catch (error) {
      console.error('Error in getTithesOfferingsStats:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  }

  async getAllMembers(): Promise<{ data: Array<{ id: string; name: string; type: string; liderId?: string; discipuladorId?: string; pastorId?: string }>; error: string | null }> {
    try {
      const { data: members, error: membersError } = await supabase
        .from('members')
        .select('id, name, type, lider_id');

      const { data: leaders, error: leadersError } = await supabase
        .from('profiles')
        .select('id, name, role, discipulador_uuid, pastor_uuid')
        .in('role', ['lider', 'discipulador', 'pastor']);

      if (membersError || leadersError) {
        return { data: [], error: 'Erro ao carregar membros' };
      }

      const allMembers = [
        ...(members || []).map(m => ({
          id: m.id,
          name: m.name,
          type: m.type,
          liderId: m.lider_id,
        })),
        ...(leaders || []).map(l => ({
          id: l.id,
          name: l.name,
          type: l.role,
          discipuladorId: l.discipulador_uuid,
          pastorId: l.pastor_uuid,
        })),
      ];

      return { data: allMembers, error: null };
    } catch (error) {
      console.error('Error in getAllMembers:', error);
      return { data: [], error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  }
}

export const tithesOfferingsService = new TithesOfferingsService();
