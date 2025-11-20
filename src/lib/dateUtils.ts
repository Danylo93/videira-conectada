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

