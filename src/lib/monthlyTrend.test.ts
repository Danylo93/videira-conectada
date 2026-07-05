import { describe, it, expect } from "vitest";
import { computeMonthlyTrend } from "./monthlyTrend";

const month = (averageTotal: number) => ({ averageTotal });

describe("computeMonthlyTrend", () => {
  it("calcula a variação % do último mês vs o anterior", () => {
    expect(computeMonthlyTrend([month(10), month(12)])).toBe(20);
    expect(computeMonthlyTrend([month(20), month(15)])).toBe(-25);
  });

  it("usa apenas os dois últimos meses da série", () => {
    expect(computeMonthlyTrend([month(100), month(10), month(11)])).toBe(10);
  });

  it("retorna null sem histórico suficiente", () => {
    expect(computeMonthlyTrend([])).toBeNull();
    expect(computeMonthlyTrend([month(10)])).toBeNull();
  });

  it("retorna null quando o mês anterior é zero (evita divisão por zero)", () => {
    expect(computeMonthlyTrend([month(0), month(5)])).toBeNull();
  });

  it("arredonda para inteiro", () => {
    expect(computeMonthlyTrend([month(3), month(4)])).toBe(33);
  });
});
