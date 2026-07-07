import { describe, it, expect } from "vitest";
import { recentSaturdays, isSaturdayISO } from "./saturdays";

// Julho/2026: dia 4 é sábado
const d = (iso: string) => new Date(`${iso}T12:00:00`);

describe("recentSaturdays", () => {
  it("lista os últimos sábados em ordem decrescente (mais recente primeiro)", () => {
    expect(recentSaturdays(3, d("2026-07-07"))).toEqual([
      "2026-07-04",
      "2026-06-27",
      "2026-06-20",
    ]);
  });

  it("hoje sendo sábado, inclui o próprio dia", () => {
    expect(recentSaturdays(2, d("2026-07-04"))).toEqual(["2026-07-04", "2026-06-27"]);
  });

  it("vira o mês/ano corretamente", () => {
    expect(recentSaturdays(2, d("2026-01-02"))).toEqual(["2025-12-27", "2025-12-20"]);
  });
});

describe("isSaturdayISO", () => {
  it("reconhece sábado", () => {
    expect(isSaturdayISO("2026-07-04")).toBe(true);
  });
  it("rejeita outros dias", () => {
    expect(isSaturdayISO("2026-07-07")).toBe(false);
    expect(isSaturdayISO("2026-07-05")).toBe(false);
  });
});
