/**
 * Variação percentual da presença média entre os dois últimos meses.
 *
 * Recebe a série mensal (ordem cronológica, como statistics.monthlyData) e
 * devolve a variação % inteira do último mês em relação ao anterior, ou null
 * quando não há base de comparação (menos de 2 meses ou mês anterior zerado).
 */
export function computeMonthlyTrend(
  monthlyData: Array<{ averageTotal: number }>,
): number | null {
  if (monthlyData.length < 2) return null;

  const previous = monthlyData[monthlyData.length - 2].averageTotal;
  const current = monthlyData[monthlyData.length - 1].averageTotal;
  if (previous <= 0) return null;

  return Math.round(((current - previous) / previous) * 100);
}
