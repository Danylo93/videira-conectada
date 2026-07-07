/**
 * A célula acontece aos sábados: a data do relatório semanal deve ser sempre
 * um sábado. Estes helpers alimentam o seletor de semanas (apenas sábados)
 * e a validação no envio.
 */

const localKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Últimos `count` sábados (inclui hoje se for sábado), mais recente primeiro. */
export function recentSaturdays(count: number, now: Date = new Date()): string[] {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  // Recuar até o sábado mais próximo (0=dom … 6=sáb)
  d.setDate(d.getDate() - ((d.getDay() + 1) % 7));

  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(localKey(d));
    d.setDate(d.getDate() - 7);
  }
  return result;
}

/** Verifica se a data ISO (YYYY-MM-DD) cai num sábado. */
export function isSaturdayISO(iso: string): boolean {
  const [y, m, day] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, day).getDay() === 6;
}
