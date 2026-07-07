/**
 * Pivô dos relatórios de célula para gráfico multi-linha:
 * uma linha por célula/líder, um ponto por semana.
 */

export interface CellReportPoint {
  liderId: string;
  /** ISO YYYY-MM-DD (week_start do relatório) */
  weekStart: string;
  /** Presença total (membros + frequentadores) */
  total: number;
}

export interface SeriesLeader {
  id: string;
  name: string;
}

export interface PivotResult {
  /** Linhas prontas para o Recharts: { name: 'dd/mm', 'Célula A': 10, ... } */
  rows: Array<Record<string, string | number>>;
  /** Nomes das séries (apenas células com pelo menos um relatório), na ordem dos líderes */
  seriesNames: string[];
}

const labelOf = (isoWeek: string) => {
  const [, month, day] = isoWeek.slice(0, 10).split("-");
  return `${day}/${month}`;
};

export function pivotReportsByWeek(
  reports: CellReportPoint[],
  leaders: SeriesLeader[],
): PivotResult {
  const nameById = new Map(leaders.map((l) => [l.id, l.name]));
  const usedIds = new Set<string>();

  // weekKey -> (leaderName -> total)
  const weeks = new Map<string, Map<string, number>>();
  for (const r of reports) {
    const name = nameById.get(r.liderId);
    if (!name) continue;
    usedIds.add(r.liderId);

    const weekKey = r.weekStart.slice(0, 10);
    const row = weeks.get(weekKey) ?? new Map<string, number>();
    row.set(name, (row.get(name) ?? 0) + r.total);
    weeks.set(weekKey, row);
  }

  const rows = Array.from(weeks.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([weekKey, values]) => ({
      name: labelOf(weekKey),
      ...Object.fromEntries(values),
    }));

  const seriesNames = leaders.filter((l) => usedIds.has(l.id)).map((l) => l.name);

  return { rows, seriesNames };
}
