/**
 * Utilitários para formatação de datas
 * Resolve problemas de timezone ao exibir datas do banco de dados
 */

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Formata uma data para exibição no formato brasileiro (dd/mm/yyyy)
 * Usa métodos UTC para evitar problemas de timezone
 */
export function formatDateBR(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  
  // Usa métodos UTC para extrair o dia, mês e ano corretos
  // Isso garante que o dia exibido seja o mesmo que foi salvo no banco
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth(); // 0-11
  const day = date.getUTCDate();
  
  // Formata como dd/mm/yyyy
  return `${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`;
}

/**
 * Formata uma data para exibição no formato brasileiro longo
 * Ex: "segunda-feira, 18 de novembro de 2025"
 */
export function formatDateBRLong(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  
  // Usa métodos UTC para extrair o dia, mês e ano corretos
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth(); // 0-11
  const day = date.getUTCDate();
  
  // Cria uma data local usando os valores UTC (sem conversão de timezone)
  const localDate = new Date(year, month, day);
  
  return localDate.toLocaleDateString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Formata uma data para exibição com formato customizado
 * Usa date-fns mas com tratamento correto de timezone
 */
export function formatDateCustom(
  dateInput: string | Date,
  formatStr: string,
  options?: { locale?: any }
): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  
  // Usa métodos UTC para extrair o dia, mês e ano corretos
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth(); // 0-11
  const day = date.getUTCDate();
  
  // Cria uma data local usando os valores UTC (sem conversão de timezone)
  const localDate = new Date(year, month, day);
  
  return format(localDate, formatStr, {
    locale: options?.locale || ptBR,
    ...options,
  });
}

/**
 * Converte uma data ISO string para formato YYYY-MM-DD (para inputs de data)
 * Usa métodos UTC para garantir o dia correto
 */
export function formatDateForInput(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  
  // Usa métodos UTC para extrair o dia, mês e ano corretos
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth(); // 0-11
  const day = date.getUTCDate();
  
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Formata uma data para exibição curta (ex: "18 nov")
 */
export function formatDateShort(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  
  const localDate = new Date(year, month, day);
  
  return localDate.toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: 'short' 
  });
}

/**
 * Formata uma data para exibição média (ex: "18 de nov de 2025")
 */
export function formatDateMedium(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  
  const localDate = new Date(year, month, day);
  
  return localDate.toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Retorna a segunda-feira da semana para uma data fornecida
 * A semana começa na segunda-feira e termina no domingo
 */
export function getWeekStartDate(dateInput: string | Date): Date {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : new Date(dateInput);
  
  // Obter o dia da semana (0 = domingo, 1 = segunda, ..., 6 = sábado)
  const dayOfWeek = date.getDay();
  
  // Calcular quantos dias subtrair para chegar à segunda-feira
  // Se for segunda (1), subtrai 0
  // Se for terça (2), subtrai 1
  // Se for domingo (0), subtrai 6 (volta para a segunda anterior)
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  
  const monday = new Date(date);
  monday.setDate(date.getDate() - daysToSubtract);
  monday.setHours(0, 0, 0, 0);
  
  return monday;
}

/**
 * Verifica se está no período permitido para envio de lembretes semanais
 * Período permitido: Quinta-feira 22:00 até Domingo 23:59 (horário de Brasília)
 * @returns {object} { isAllowed: boolean, message: string, nextAvailableDate?: Date }
 */
export function isWeeklyRemindersAllowed(): {
  isAllowed: boolean;
  message: string;
  nextAvailableDate?: Date;
} {
  try {
    // Obter data/hora atual no timezone de Brasília (America/Sao_Paulo)
    const now = new Date();
    
    // Criar uma data no timezone de Brasília
    // Usar toLocaleString para obter a string formatada e depois parsear
    const brasiliaDateStr = now.toLocaleString("en-US", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    
    // Parsear a string (formato: MM/DD/YYYY, HH:MM:SS)
    const [datePart, timePart] = brasiliaDateStr.split(", ");
    const [month, day, year] = datePart.split("/").map(Number);
    const [hours, minutes] = timePart.split(":").map(Number);
    
    // Criar uma data local para calcular o dia da semana
    const brasiliaDate = new Date(year, month - 1, day, hours, minutes);
    
    // Obter dia da semana (0 = domingo, 1 = segunda, ..., 6 = sábado)
    const dayOfWeek = brasiliaDate.getDay();
    
    const currentTime = hours * 60 + minutes; // Minutos desde meia-noite
  
  // Período permitido: Quinta (4) 22:00 até Domingo (0) 23:59
  
  if (dayOfWeek === 4) { // Quinta-feira
    if (currentTime >= 22 * 60) { // 22:00 ou depois
      return { isAllowed: true, message: "Período permitido" };
    } else {
      // Ainda não chegou às 22h de quinta
      const nextAvailable = new Date(year, month - 1, day, 22, 0, 0);
      return {
        isAllowed: false,
        message: `Lembretes disponíveis a partir de quinta-feira às 22:00`,
        nextAvailableDate: nextAvailable,
      };
    }
  } else if (dayOfWeek === 5) { // Sexta-feira
    return { isAllowed: true, message: "Período permitido" };
  } else if (dayOfWeek === 6) { // Sábado
    return { isAllowed: true, message: "Período permitido" };
  } else if (dayOfWeek === 0) { // Domingo
    if (currentTime <= 23 * 60 + 59) { // Até 23:59
      return { isAllowed: true, message: "Período permitido" };
    } else {
      // Passou das 23:59 de domingo
      // Próximo período será quinta às 22h
      const nextThursday = new Date(year, month - 1, day);
      const daysUntilThursday = (4 - dayOfWeek + 7) % 7 || 7; // Próxima quinta
      nextThursday.setDate(nextThursday.getDate() + daysUntilThursday);
      nextThursday.setHours(22, 0, 0, 0);
      return {
        isAllowed: false,
        message: `Período encerrado. Próximo período: quinta-feira às 22:00`,
        nextAvailableDate: nextThursday,
      };
    }
  } else {
    // Segunda (1), terça (2) ou quarta (3)
    // Próximo período será quinta às 22h
    const nextThursday = new Date(year, month - 1, day);
    const daysUntilThursday = (4 - dayOfWeek + 7) % 7;
    nextThursday.setDate(nextThursday.getDate() + daysUntilThursday);
    nextThursday.setHours(22, 0, 0, 0);
    return {
      isAllowed: false,
      message: `Lembretes disponíveis apenas de quinta (22h) a domingo (23:59)`,
      nextAvailableDate: nextThursday,
    };
  }
  } catch (error) {
    // Em caso de erro, permitir o envio (fallback seguro)
    console.error("Erro ao verificar período permitido:", error);
    return { isAllowed: true, message: "Período permitido" };
  }
}

