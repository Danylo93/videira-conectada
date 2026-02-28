import { api } from "./api";

interface MemberData {
  averageMembers: number;
  averageAttendees: number;
  averageVisitors: number;
}


interface ReportObreiroRequest {
    workerId: string;
    month: number;
    year: number;
  }

interface ReportPastorRequest {
  pastorId: string;
  month: number;
  year: number;
}
// Obtém o mês e ano atual
const getCurrentMonthAndYear = () => {
    const now = new Date();
    return {
      month: now.getMonth() + 1, // getMonth() retorna de 0 a 11, então somamos 1
      year: now.getFullYear(),
    };
  };

export const getTotalReportMonthPastor = async (data: ReportPastorRequest): Promise<MemberData> => {
  const response = await api.post(`/api/reports/pastor/monthly`, data);
  return response.data;
};

export const geTotalReportMonthLeader = async (): Promise<MemberData> => {
  const now = new Date();
  const response = await api.get(`/api/reports/leaders/monthly?month=${now.getMonth() + 1}&year=${now.getFullYear()}`);
  return response.data;
};
  
export const geTotalReportMonthDiscipler = async (discipuladorId: string | number): Promise<MemberData> => {
    const { month, year } = getCurrentMonthAndYear(); 
    const response = await api.get(`/api/reports/disciplers/monthly?discipuladorId=${discipuladorId}&month=${month}&year=${year}`);
    return response.data;
  };
  
  export const getTotalReportMonthObreiro = async (data: ReportObreiroRequest): Promise<MemberData> => {
    const response = await api.post(`/api/reports/workers/monthly`, data);
    return response.data;
  };
  

  
