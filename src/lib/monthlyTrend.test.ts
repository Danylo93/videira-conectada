import { describe, it, expect } from "vitest";
import { computeMonthlyTrend, latestMonthAverage, latestMonthAttendanceRate } from "./monthlyTrend";

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

describe("latestMonthAverage", () => {
  it("retorna a presença média do mês mais recente da série", () => {
    expect(latestMonthAverage([month(10), month(14)])).toBe(14);
  });

  it("retorna 0 sem dados", () => {
    expect(latestMonthAverage([])).toBe(0);
  });
});

describe("latestMonthAttendanceRate", () => {
  it("divide a presença média do mês pela base cadastrada", () => {
    // 9 presentes em média numa célula com 11 cadastrados → 82%
    expect(latestMonthAttendanceRate([month(9)], 11)).toBe(82);
  });

  it("nunca passa de 100% mesmo com presença acima do cadastro", () => {
    // cenário do bug: 9 presentes com base errada de 6 dava 150%
    expect(latestMonthAttendanceRate([month(9)], 6)).toBe(100);
  });

  it("retorna 0 sem base cadastrada ou sem relatórios", () => {
    expect(latestMonthAttendanceRate([month(9)], 0)).toBe(0);
    expect(latestMonthAttendanceRate([], 11)).toBe(0);
  });
});
