import { supabase } from './client';
import type { User } from '@/types/auth';

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
  async getGeneralStatistics(user: User): Promise<StatisticsData> {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

    // Dados básicos por papel
    const basicData = await this.getBasicData(user);
    
    // Dados de presença
    const presenceData = await this.getPresenceData(user, yearStart, yearEnd);
    
    // Dados mensais
    const monthlyData = await this.getMonthlyData(user, yearStart, yearEnd);
    
    // Dados semanais
    const weeklyData = await this.getWeeklyData(user, yearStart, yearEnd);
    
    // Dados de rede (se aplicável)
    const networkData = await this.getNetworkData(user);

    return {
      ...basicData,
      ...presenceData,
      monthlyData,
      weeklyData,
      networkData,
    };
  },

  // Dados básicos por papel do usuário
  async getBasicData(user: User) {
    if (user.role === 'pastor') {
      const [
        { count: discipuladores },
        { count: leaders },
        { count: members },
        { count: frequentadores }
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'discipulador'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'lider'),
        supabase.from('members').select('id', { count: 'exact', head: true }).eq('active', true).eq('type', 'member'),
        supabase.from('members').select('id', { count: 'exact', head: true }).eq('active', true).eq('type', 'frequentador'),
      ]);

      return {
        totalMembers: members ?? 0,
        totalFrequentadores: frequentadores ?? 0,
        totalLeaders: leaders ?? 0,
        totalDiscipuladores: discipuladores ?? 0,
      };
    }

    if (user.role === 'discipulador') {
      const [
        { count: leaders },
        { data: leaderData }
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'lider').eq('discipulador_uuid', user.id),
        supabase.from('profiles').select('id').eq('role', 'lider').eq('discipulador_uuid', user.id)
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
  async getPresenceData(user: User, startDate: Date, endDate: Date) {
    const reports = await this.getReportsForUser(user, startDate, endDate);
    
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
    
    const prevReports = await this.getReportsForUser(user, prevStartDate, prevEndDate);
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
  async getMonthlyData(user: User, startDate: Date, endDate: Date): Promise<MonthlyData[]> {
    const reports = await this.getReportsForUser(user, startDate, endDate);
    
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
  async getWeeklyData(user: User, startDate: Date, endDate: Date): Promise<WeeklyData[]> {
    const reports = await this.getReportsForUser(user, startDate, endDate);
    
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
  async getNetworkData(user: User): Promise<NetworkData | undefined> {
    if (user.role === 'lider') return undefined;

    let discipuladores: DiscipuladorData[] = [];

    if (user.role === 'pastor') {
      const { data: discipuladorData } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('role', 'discipulador');

      discipuladores = await Promise.all(
        (discipuladorData || []).map(async (d) => {
          const leaders = await this.getLeadersForDiscipulador(d.id);
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
      const leaders = await this.getLeadersForDiscipulador(user.id);
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
  async getLeadersForDiscipulador(discipuladorId: string): Promise<LeaderData[]> {
    const { data: leaders } = await supabase
      .from('profiles')
      .select('id, name, celula')
      .eq('role', 'lider')
      .eq('discipulador_uuid', discipuladorId);

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
  async getReportsForUser(user: User, startDate: Date, endDate: Date) {
    let query = supabase
      .from('cell_reports')
      .select('*')
      .gte('week_start', startDate.toISOString())
      .lte('week_start', endDate.toISOString());

    if (user.role === 'lider') {
      query = query.eq('lider_id', user.id);
    } else if (user.role === 'discipulador') {
      const { data: leaderIds } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'lider')
        .eq('discipulador_uuid', user.id);
      
      const ids = (leaderIds || []).map(l => l.id);
      query = ids.length > 0 ? query.in('lider_id', ids) : query.eq('lider_id', '');
    }
    // Para pastores, busca todos os relatórios

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
