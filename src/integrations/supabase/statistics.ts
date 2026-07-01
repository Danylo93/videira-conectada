import { supabase } from './client';
import type { User } from '@/types/auth';
import { getPastorScopeId } from '@/types/auth';
import type { ProfileMode } from '@/contexts/ProfileModeContext';
import { applyProfileScope } from '@/lib/profileScope';

export interface StatisticsData {
  // Dados por papel
  totalMembers: number;
  totalFrequentadores: number;
  totalLeaders: number;
  totalDiscipuladores: number;
  
  // Dados de presença (relatórios)
  totalPresence: number;
  averagePresence: number;
  growthRate: number;
  
  // Dados por período
  monthlyData: MonthlyData[];
  weeklyData: WeeklyData[];
  
  // Dados de rede (para discipuladores e pastores)
  networkData?: NetworkData;
}

export interface MonthlyData {
  month: string;
  year: number;
  members: number;
  frequentadores: number;
  total: number;
  averageMembers: number;
  averageFrequentadores: number;
  averageTotal: number;
  weeks: number;
}

export interface WeeklyData {
  weekStart: string;
  weekEnd: string;
  members: number;
  frequentadores: number;
  total: number;
  leaders: number;
}

export interface NetworkData {
  discipuladores: DiscipuladorData[];
  totalMembers: number;
  totalFrequentadores: number;
  totalLeaders: number;
  averagePresence: number;
}

export interface DiscipuladorData {
  id: string;
  name: string;
  leaders: LeaderData[];
  totalMembers: number;
  totalFrequentadores: number;
  averagePresence: number;
}

export interface LeaderData {
  id: string;
  name: string;
  celula: string;
  members: number;
  frequentadores: number;
  averagePresence: number;
  lastReport?: string;
}

export const statisticsService = {
  // Buscar estatísticas gerais
  async getGeneralStatistics(user: User, mode: ProfileMode = 'normal'): Promise<StatisticsData> {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

    // Dados básicos por papel
    const basicData = await this.getBasicData(user, mode);

    // Dados de presença
    const presenceData = await this.getPresenceData(user, yearStart, yearEnd, mode);

    // Dados mensais
    const monthlyData = await this.getMonthlyData(user, yearStart, yearEnd, mode);

    // Dados semanais
    const weeklyData = await this.getWeeklyData(user, yearStart, yearEnd, mode);

    // Dados de rede (se aplicável)
    const networkData = await this.getNetworkData(user, mode);

    return {
      ...basicData,
      ...presenceData,
      monthlyData,
      weeklyData,
      networkData,
    };
  },

  // Dados básicos por papel do usuário
  async getBasicData(user: User, mode: ProfileMode = 'normal') {
    if (user.role === 'pastor') {
      let discipuladoresQuery = supabase.from('profiles').select('id', { count: 'exact', head: true }).in('role', ['discipulador', 'obreiro', 'pastor']);
      let leadersQuery = supabase.from('profiles').select('id', { count: 'exact', head: true }).in('role', ['lider', 'obreiro', 'pastor']);

      discipuladoresQuery = applyProfileScope(discipuladoresQuery, mode);
      leadersQuery = applyProfileScope(leadersQuery, mode);

      // Buscar IDs dos líderes para filtrar membros
      let leadersDataQuery = supabase.from('profiles').select('id').in('role', ['lider', 'obreiro', 'pastor']);
      leadersDataQuery = applyProfileScope(leadersDataQuery, mode);
      const { data: leadersData } = await leadersDataQuery;
      const leaderIds = (leadersData || []).map(l => l.id);
      
      // Filtrar membros e frequentadores por líderes do modo correto
      let membersQuery = supabase.from('members').select('id', { count: 'exact', head: true }).eq('active', true).eq('type', 'member');
      let frequentadoresQuery = supabase.from('members').select('id', { count: 'exact', head: true }).eq('active', true).eq('type', 'frequentador');
      
      if (leaderIds.length > 0) {
        membersQuery = membersQuery.in('lider_id', leaderIds);
        frequentadoresQuery = frequentadoresQuery.in('lider_id', leaderIds);
      } else {
        membersQuery = membersQuery.eq('lider_id', ''); // Retorna vazio se não houver líderes
        frequentadoresQuery = frequentadoresQuery.eq('lider_id', ''); // Retorna vazio se não houver líderes
      }
      
      const [
        { count: discipuladores },
        { count: leaders },
        { count: members },
        { count: frequentadores }
      ] = await Promise.all([
        discipuladoresQuery,
        leadersQuery,
        membersQuery,
        frequentadoresQuery,
      ]);

      return {
        totalMembers: members ?? 0,
        totalFrequentadores: frequentadores ?? 0,
        totalLeaders: leaders ?? 0,
        totalDiscipuladores: discipuladores ?? 0,
      };
    }

    if (user.role === 'discipulador') {
      let leadersCountQuery = supabase.from('profiles').select('id', { count: 'exact', head: true }).in('role', ['lider', 'obreiro', 'pastor']).eq('discipulador_uuid', user.id);
      let leadersDataQuery = supabase.from('profiles').select('id').in('role', ['lider', 'obreiro', 'pastor']).eq('discipulador_uuid', user.id);

      leadersCountQuery = applyProfileScope(leadersCountQuery, mode);
      leadersDataQuery = applyProfileScope(leadersDataQuery, mode);


      const [
        { count: leaders },
        { data: leaderData }
      ] = await Promise.all([
        leadersCountQuery,
        leadersDataQuery
      ]);

      const leaderIds = (leaderData || []).map(l => l.id);
      
      const [
        { count: members },
        { count: frequentadores }
      ] = await Promise.all([
        leaderIds.length > 0 
          ? supabase.from('members').select('id', { count: 'exact', head: true }).eq('active', true).eq('type', 'member').in('lider_id', leaderIds)
          : { count: 0 },
        leaderIds.length > 0
          ? supabase.from('members').select('id', { count: 'exact', head: true }).eq('active', true).eq('type', 'frequentador').in('lider_id', leaderIds)
          : { count: 0 }
      ]);

      return {
        totalMembers: members ?? 0,
        totalFrequentadores: frequentadores ?? 0,
        totalLeaders: leaders ?? 0,
        totalDiscipuladores: 0,
      };
    }

    if (user.role === 'lider') {
      const [
        { count: members },
        { count: frequentadores }
      ] = await Promise.all([
        supabase.from('members').select('id', { count: 'exact', head: true }).eq('lider_id', user.id).eq('active', true).eq('type', 'member'),
        supabase.from('members').select('id', { count: 'exact', head: true }).eq('lider_id', user.id).eq('active', true).eq('type', 'frequentador'),
      ]);

      return {
        totalMembers: members ?? 0,
        totalFrequentadores: frequentadores ?? 0,
        totalLeaders: 0,
        totalDiscipuladores: 0,
      };
    }

    return {
      totalMembers: 0,
      totalFrequentadores: 0,
      totalLeaders: 0,
      totalDiscipuladores: 0,
    };
  },

  // Dados de presença baseados nos relatórios
  async getPresenceData(user: User, startDate: Date, endDate: Date, mode: ProfileMode = 'normal') {
    const reports = await this.getReportsForUser(user, startDate, endDate, mode);
    
    const totalPresence = reports.reduce((sum, r) => {
      const members = Array.isArray(r.members_present) ? r.members_present.length : 0;
      const visitors = Array.isArray(r.visitors_present) ? r.visitors_present.length : 0;
      return sum + members + visitors;
    }, 0);

    const averagePresence = reports.length > 0 ? totalPresence / reports.length : 0;

    // Calcular crescimento (comparar com período anterior)
    const periodLength = endDate.getTime() - startDate.getTime();
    const prevStartDate = new Date(startDate.getTime() - periodLength);
    const prevEndDate = new Date(startDate.getTime() - 1);
    
    const prevReports = await this.getReportsForUser(user, prevStartDate, prevEndDate, mode);
    const prevTotalPresence = prevReports.reduce((sum, r) => {
      const members = Array.isArray(r.members_present) ? r.members_present.length : 0;
      const visitors = Array.isArray(r.visitors_present) ? r.visitors_present.length : 0;
      return sum + members + visitors;
    }, 0);

    const growthRate = prevTotalPresence > 0 
      ? ((totalPresence - prevTotalPresence) / prevTotalPresence) * 100 
      : 0;

    return {
      totalPresence,
      averagePresence: Math.round(averagePresence * 100) / 100,
      growthRate: Math.round(growthRate * 100) / 100,
    };
  },

  // Dados mensais agregados
  async getMonthlyData(user: User, startDate: Date, endDate: Date, mode: ProfileMode = 'normal'): Promise<MonthlyData[]> {
    const reports = await this.getReportsForUser(user, startDate, endDate, mode);
    
    const monthlyMap = new Map<string, {
      members: number;
      frequentadores: number;
      total: number;
      weeks: number;
    }>();

    reports.forEach(r => {
      const date = new Date(r.week_start);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const members = Array.isArray(r.members_present) ? r.members_present.length : 0;
      const visitors = Array.isArray(r.visitors_present) ? r.visitors_present.length : 0;
      const total = members + visitors;

      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, { members: 0, frequentadores: 0, total: 0, weeks: 0 });
      }

      const current = monthlyMap.get(key)!;
      current.members += members;
      current.frequentadores += visitors;
      current.total += total;
      current.weeks += 1;
    });

    return Array.from(monthlyMap.entries())
      .map(([key, data]) => {
        const [year, month] = key.split('-');
        return {
          month: new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('pt-BR', { month: 'short' }),
          year: Number(year),
          members: data.members,
          frequentadores: data.frequentadores,
          total: data.total,
          averageMembers: Math.round(data.members / data.weeks),
          averageFrequentadores: Math.round(data.frequentadores / data.weeks),
          averageTotal: Math.round(data.total / data.weeks),
          weeks: data.weeks,
        };
      })
      .sort((a, b) => a.year - b.year || new Date(a.year, this.getMonthNumber(a.month), 1).getTime() - new Date(b.year, this.getMonthNumber(b.month), 1).getTime());
  },

  // Dados semanais
  async getWeeklyData(user: User, startDate: Date, endDate: Date, mode: ProfileMode = 'normal'): Promise<WeeklyData[]> {
    const reports = await this.getReportsForUser(user, startDate, endDate, mode);
    
    return reports.map(r => {
      const weekStart = new Date(r.week_start);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const members = Array.isArray(r.members_present) ? r.members_present.length : 0;
      const visitors = Array.isArray(r.visitors_present) ? r.visitors_present.length : 0;
      
      return {
        weekStart: weekStart.toISOString().split('T')[0],
        weekEnd: weekEnd.toISOString().split('T')[0],
        members,
        frequentadores: visitors,
        total: members + visitors,
        leaders: 1, // Cada relatório representa um líder
      };
    }).sort((a, b) => new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime());
  },

  // Dados de rede (para discipuladores e pastores)
  async getNetworkData(user: User, mode: ProfileMode = 'normal'): Promise<NetworkData | undefined> {
    if (user.role === 'lider') return undefined;

    let discipuladores: DiscipuladorData[] = [];

    if (user.role === 'pastor') {
      let discipuladorQuery = supabase
        .from('profiles')
        .select('id, name')
        .in('role', ['discipulador', 'obreiro', 'pastor']);

      discipuladorQuery = applyProfileScope(discipuladorQuery, mode);

      const { data: discipuladorData } = await discipuladorQuery;

      discipuladores = await Promise.all(
        (discipuladorData || []).map(async (d) => {
          const leaders = await this.getLeadersForDiscipulador(d.id, mode);
          const totalMembers = leaders.reduce((sum, l) => sum + l.members + l.frequentadores, 0);
          const averagePresence = leaders.length > 0 
            ? leaders.reduce((sum, l) => sum + l.averagePresence, 0) / leaders.length 
            : 0;

          return {
            id: d.id,
            name: d.name,
            leaders,
            totalMembers,
            totalFrequentadores: leaders.reduce((sum, l) => sum + l.frequentadores, 0),
            averagePresence: Math.round(averagePresence * 100) / 100,
          };
        })
      );
    } else if (user.role === 'discipulador') {
      const leaders = await this.getLeadersForDiscipulador(user.id, mode);
      const totalMembers = leaders.reduce((sum, l) => sum + l.members + l.frequentadores, 0);
      const averagePresence = leaders.length > 0 
        ? leaders.reduce((sum, l) => sum + l.averagePresence, 0) / leaders.length 
        : 0;

      discipuladores = [{
        id: user.id,
        name: user.name,
        leaders,
        totalMembers,
        totalFrequentadores: leaders.reduce((sum, l) => sum + l.frequentadores, 0),
        averagePresence: Math.round(averagePresence * 100) / 100,
      }];
    }

    const totalMembers = discipuladores.reduce((sum, d) => sum + d.totalMembers, 0);
    const totalFrequentadores = discipuladores.reduce((sum, d) => sum + d.totalFrequentadores, 0);
    const totalLeaders = discipuladores.reduce((sum, d) => sum + d.leaders.length, 0);
    const averagePresence = discipuladores.length > 0 
      ? discipuladores.reduce((sum, d) => sum + d.averagePresence, 0) / discipuladores.length 
      : 0;

    return {
      discipuladores,
      totalMembers,
      totalFrequentadores,
      totalLeaders,
      averagePresence: Math.round(averagePresence * 100) / 100,
    };
  },

  // Buscar líderes de um discipulador
  async getLeadersForDiscipulador(discipuladorId: string, mode: ProfileMode = 'normal'): Promise<LeaderData[]> {
    let leadersQuery = supabase
      .from('profiles')
      .select('id, name, celula')
      .in('role', ['lider', 'obreiro', 'pastor'])
      .or(`discipulador_uuid.eq.${discipuladorId},id.eq.${discipuladorId}`);

    leadersQuery = applyProfileScope(leadersQuery, mode);

    const { data: leaders } = await leadersQuery;

    if (!leaders) return [];

    return Promise.all(
      leaders.map(async (leader) => {
        const [
          { count: members },
          { count: frequentadores },
          { data: lastReport }
        ] = await Promise.all([
          supabase.from('members').select('id', { count: 'exact', head: true }).eq('lider_id', leader.id).eq('active', true).eq('type', 'member'),
          supabase.from('members').select('id', { count: 'exact', head: true }).eq('lider_id', leader.id).eq('active', true).eq('type', 'frequentador'),
          supabase.from('cell_reports').select('members_present, visitors_present, week_start').eq('lider_id', leader.id).order('week_start', { ascending: false }).limit(1).single()
        ]);

        const membersCount = members ?? 0;
        const frequentadoresCount = frequentadores ?? 0;
        
        // Calcular presença média baseada no último relatório
        let averagePresence = 0;
        if (lastReport) {
          const lastMembers = Array.isArray(lastReport.members_present) ? lastReport.members_present.length : 0;
          const lastVisitors = Array.isArray(lastReport.visitors_present) ? lastReport.visitors_present.length : 0;
          const totalMembers = membersCount + frequentadoresCount;
          averagePresence = totalMembers > 0 ? ((lastMembers + lastVisitors) / totalMembers) * 100 : 0;
        }

        return {
          id: leader.id,
          name: leader.name,
          celula: leader.celula || 'Sem célula',
          members: membersCount,
          frequentadores: frequentadoresCount,
          averagePresence: Math.round(averagePresence * 100) / 100,
          lastReport: lastReport?.week_start,
        };
      })
    );
  },

  // Buscar relatórios para um usuário
  async getReportsForUser(user: User, startDate: Date, endDate: Date, mode: ProfileMode = 'normal') {
    let query = supabase
      .from('cell_reports')
      .select('*')
      .gte('week_start', startDate.toISOString())
      .lte('week_start', endDate.toISOString());

    if (user.role === 'lider') {
      query = query.eq('lider_id', user.id);
    } else if (user.role === 'discipulador') {
      let leaderQuery = supabase
        .from('profiles')
        .select('id')
        .in('role', ['lider', 'obreiro', 'pastor'])
        .eq('discipulador_uuid', user.id);

      leaderQuery = applyProfileScope(leaderQuery, mode);

      const { data: leaderIds } = await leaderQuery;
      const ids = (leaderIds || []).map(l => l.id);
      query = ids.length > 0 ? query.in('lider_id', ids) : query.eq('lider_id', '');
    } else if (user.role === 'pastor' && mode !== 'normal') {
      // Para pastores em modo Kids/Radicais, filtrar apenas líderes do escopo
      let leaderQuery = supabase
        .from('profiles')
        .select('id')
        .in('role', ['lider', 'obreiro', 'pastor'])
        .eq('pastor_uuid', getPastorScopeId(user));
      leaderQuery = applyProfileScope(leaderQuery, mode);

      const { data: leaderIds } = await leaderQuery;
      const ids = (leaderIds || []).map(l => l.id);
      query = ids.length > 0 ? query.in('lider_id', ids) : query.eq('lider_id', '');
    }
    // Para pastores no modo normal, busca todos os relatórios

    const { data } = await query;
    return data || [];
  },

  // Utilitário para converter nome do mês para número
  getMonthNumber(monthName: string): number {
    const months = {
      'jan': 0, 'fev': 1, 'mar': 2, 'abr': 3, 'mai': 4, 'jun': 5,
      'jul': 6, 'ago': 7, 'set': 8, 'out': 9, 'nov': 10, 'dez': 11
    };
    return months[monthName.toLowerCase() as keyof typeof months] ?? 0;
  },
};
