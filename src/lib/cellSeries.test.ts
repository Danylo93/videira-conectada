import { describe, it, expect } from "vitest";
import { pivotReportsByWeek } from "./cellSeries";

const leaders = [
  { id: "a", name: "Célula Ana" },
  { id: "b", name: "Célula Bruno" },
];

describe("pivotReportsByWeek", () => {
  it("monta uma coluna por célula, linhas por semana em ordem", () => {
    const { rows, seriesNames } = pivotReportsByWeek(
      [
        { liderId: "b", weekStart: "2026-06-08", total: 7 },
        { liderId: "a", weekStart: "2026-06-01", total: 10 },
        { liderId: "a", weekStart: "2026-06-08", total: 12 },
      ],
      leaders,
    );

    expect(seriesNames).toEqual(["Célula Ana", "Célula Bruno"]);
    expect(rows).toEqual([
      { name: "01/06", "Célula Ana": 10 },
      { name: "08/06", "Célula Ana": 12, "Célula Bruno": 7 },
    ]);
  });

  it("soma relatórios duplicados da mesma semana e célula", () => {
    const { rows } = pivotReportsByWeek(
      [
        { liderId: "a", weekStart: "2026-06-01", total: 4 },
        { liderId: "a", weekStart: "2026-06-01", total: 6 },
      ],
      leaders,
    );
    expect(rows).toEqual([{ name: "01/06", "Célula Ana": 10 }]);
  });

  it("ignora relatórios de líderes fora da lista", () => {
    const { rows, seriesNames } = pivotReportsByWeek(
      [{ liderId: "zz", weekStart: "2026-06-01", total: 5 }],
      leaders,
    );
    expect(rows).toEqual([]);
    expect(seriesNames).toEqual([]);
  });

  it("só inclui nas séries células que têm relatório", () => {
    const { seriesNames } = pivotReportsByWeek(
      [{ liderId: "b", weekStart: "2026-06-01", total: 5 }],
      leaders,
    );
    expect(seriesNames).toEqual(["Célula Bruno"]);
  });

  it("retorna vazio sem relatórios", () => {
    const { rows, seriesNames } = pivotReportsByWeek([], leaders);
    expect(rows).toEqual([]);
    expect(seriesNames).toEqual([]);
  });
});
