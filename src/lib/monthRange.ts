/**
 * Intervalo de um mês em datas ISO puras (YYYY-MM-DD), para filtrar colunas
 * DATE (ex.: cell_reports.week_start).
 *
 * Por que não usar Date/toISOString: `new Date(2026, 7, 1).toISOString()` no
 * Brasil (UTC-3) vira "2026-08-01T03:00:00Z". Como a coluna DATE é comparada
 * como meia-noite UTC, o relatório do próprio dia 1º (2026-08-01T00:00:00Z)
 * ficava FORA do filtro e sumia para todos — líder, discipulador e pastor.
 * Comparar strings de data resolve isso sem depender do fuso do aparelho.
 */
export function monthRange(year: number, month: number): { start: string; end: string } {
  const pad = (n: number) => String(n).padStart(2, "0");
  // Dia 0 do mês seguinte = último dia do mês atual (só lemos o número do dia,
  // então não há influência de fuso).
  const lastDay = new Date(year, month, 0).getDate();
  return {
    start: `${year}-${pad(month)}-01`,
    end: `${year}-${pad(month)}-${pad(lastDay)}`,
  };
}
