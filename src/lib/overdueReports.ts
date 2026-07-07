/**
 * Regra do "Relatório em Atraso" (célula):
 *
 * Cada semana vai de segunda a domingo e "fecha" no fim de semana. Uma semana
 * conta como atrasada quando o seu domingo já passou (último fim de semana
 * fechado), o domingo cai dentro do mês atual e não existe nenhum relatório
 * com data dentro daquela semana.
 *
 * Retorna as segundas-feiras (ISO YYYY-MM-DD) das semanas em atraso, em ordem.
 */

const localKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Segunda-feira da semana da data informada (semana segunda→domingo). */
const mondayOf = (date: Date) => {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0 = domingo
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return d;
};

export function computeMonthOverdueWeeks(
  reportWeekStarts: string[],
  now: Date = new Date(),
): string[] {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Semanas cobertas: normaliza a data de cada relatório para a segunda da semana
  const covered = new Set(
    reportWeekStarts.map((s) => {
      const [y, m, day] = s.slice(0, 10).split("-").map(Number);
      return localKey(mondayOf(new Date(y, m - 1, day)));
    }),
  );

  // Primeiro domingo do mês atual
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstSunday = new Date(firstOfMonth);
  firstSunday.setDate(firstOfMonth.getDate() + ((7 - firstOfMonth.getDay()) % 7));

  const missing: string[] = [];
  for (
    const sunday = new Date(firstSunday);
    sunday.getMonth() === now.getMonth() && sunday < startOfToday;
    sunday.setDate(sunday.getDate() + 7)
  ) {
    const monday = new Date(sunday);
    monday.setDate(sunday.getDate() - 6);
    const key = localKey(monday);
    if (!covered.has(key)) missing.push(key);
  }

  return missing;
}
