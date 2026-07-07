import { describe, it, expect } from "vitest";
import { computeMonthOverdueWeeks } from "./overdueReports";

// Julho/2026: dia 5 é domingo (primeiro fim de semana fechado do mês)
const d = (iso: string) => new Date(`${iso}T12:00:00`);

describe("computeMonthOverdueWeeks", () => {
  it("aponta semana do mês cujo fim de semana já passou e não tem relatório", () => {
    // terça 07/07 — a semana 29/06–05/07 fechou no domingo 05/07
    expect(computeMonthOverdueWeeks([], d("2026-07-07"))).toEqual(["2026-06-29"]);
  });

  it("semana coberta por relatório em qualquer dia dela não é atraso", () => {
    expect(computeMonthOverdueWeeks(["2026-07-02"], d("2026-07-07"))).toEqual([]);
  });

  it("não cobra semana cujo fim de semana ainda não chegou", () => {
    // sexta 03/07 — nenhum domingo de julho passou ainda
    expect(computeMonthOverdueWeeks([], d("2026-07-03"))).toEqual([]);
  });

  it("domingo em andamento ainda não conta como fechado", () => {
    expect(computeMonthOverdueWeeks([], d("2026-07-05"))).toEqual([]);
  });

  it("acumula as semanas do mês sem relatório, na ordem", () => {
    // segunda 20/07 — domingos fechados: 05, 12 e 19/07
    // relatório na semana de 06/07 cobre só a do meio
    expect(computeMonthOverdueWeeks(["2026-07-08"], d("2026-07-20"))).toEqual([
      "2026-06-29",
      "2026-07-13",
    ]);
  });

  it("relatório de outro mês não cobre semana deste mês", () => {
    expect(computeMonthOverdueWeeks(["2026-06-10"], d("2026-07-07"))).toEqual(["2026-06-29"]);
  });
});
