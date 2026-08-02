import { describe, it, expect } from "vitest";
import { monthRange } from "./monthRange";

describe("monthRange", () => {
  it("cobre o mês inteiro, do dia 1º ao último dia", () => {
    expect(monthRange(2026, 8)).toEqual({ start: "2026-08-01", end: "2026-08-31" });
    expect(monthRange(2026, 2)).toEqual({ start: "2026-02-01", end: "2026-02-28" });
    expect(monthRange(2024, 2)).toEqual({ start: "2024-02-01", end: "2024-02-29" }); // bissexto
    expect(monthRange(2026, 4)).toEqual({ start: "2026-04-01", end: "2026-04-30" });
  });

  it("zera à esquerda mês e dia", () => {
    expect(monthRange(2026, 1)).toEqual({ start: "2026-01-01", end: "2026-01-31" });
    expect(monthRange(2026, 9)).toEqual({ start: "2026-09-01", end: "2026-09-30" });
  });

  it("inclui o relatório do próprio dia 1º (bug do fuso que sumia com ele)", () => {
    // Sábado 01/08/2026: com o filtro antigo (toISOString em UTC-3) o início
    // virava 2026-08-01T03:00:00Z e excluía este relatório.
    const { start, end } = monthRange(2026, 8);
    const weekStart = "2026-08-01";
    expect(weekStart >= start).toBe(true);
    expect(weekStart <= end).toBe(true);
  });

  it("inclui o relatório do último dia do mês", () => {
    const { start, end } = monthRange(2026, 10);
    const weekStart = "2026-10-31";
    expect(weekStart >= start && weekStart <= end).toBe(true);
  });

  it("não vaza para meses vizinhos", () => {
    const { start, end } = monthRange(2026, 8);
    expect("2026-07-31" >= start).toBe(false);
    expect("2026-09-01" <= end).toBe(false);
  });
});
