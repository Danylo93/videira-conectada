/**
 * Variação percentual da presença média entre os dois últimos meses.
 *
 * Recebe a série mensal (ordem cronológica, como statistics.monthlyData) e
 * devolve a variação % inteira do último mês em relação ao anterior, ou null
 * quando não há base de comparação (menos de 2 meses ou mês anterior zerado).
 */
/**
 * Presença média do mês mais recente da série (0 quando não há dados).
 * Usada na Taxa de Presença do Dashboard, que é mensal.
 */
export function latestMonthAverage(
  monthlyData: Array<{ averageTotal: number }>,
): number {
  return monthlyData.length > 0 ? monthlyData[monthlyData.length - 1].averageTotal : 0;
}

/**
 * Taxa de presença do mês mais recente: presença média semanal dividida pela
 * base cadastrada (membros + frequentadores ativos), em % inteiro.
 *
 * Segue o modelo usado em gestão de pessoas (presentes ÷ esperados) e por isso
 * é limitada a 0–100: presença acima do cadastro (ex.: visitantes avulsos que
 * ainda não constavam na base) conta como casa cheia, nunca como mais de 100%.
 */
export function latestMonthAttendanceRate(
  monthlyData: Array<{ averageTotal: number }>,
  totalRoster: number,
): number {
  if (totalRoster <= 0) return 0;
  const average = latestMonthAverage(monthlyData);
  return Math.min(100, Math.max(0, Math.round((average / totalRoster) * 100)));
}

export function computeMonthlyTrend(
  monthlyData: Array<{ averageTotal: number }>,
): number | null {
  if (monthlyData.length < 2) return null;

  const previous = monthlyData[monthlyData.length - 2].averageTotal;
  const current = monthlyData[monthlyData.length - 1].averageTotal;
  if (previous <= 0) return null;

  return Math.round(((current - previous) / previous) * 100);
}
