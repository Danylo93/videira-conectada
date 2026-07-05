import { describe, it, expect } from "vitest";
import { buildLeaderInsights, type InsightMember, type InsightReport } from "./leaderInsights";

const member = (id: string, name: string, type: "member" | "frequentador" = "member"): InsightMember => ({
  id,
  name,
  type,
});

// Relatórios em ordem cronológica (mais antigo primeiro); weekStart ISO
const report = (weekStart: string, presentIds: string[]): InsightReport => ({
  weekStart,
  presentIds,
});

const NOW = new Date("2026-07-04T12:00:00");

describe("buildLeaderInsights — ausências consecutivas", () => {
  it("aponta membro que faltou às últimas células (2+ seguidas)", () => {
    const insights = buildLeaderInsights({
      members: [member("a", "Ana"), member("b", "Bruno")],
      reports: [
        report("2026-06-15", ["a", "b"]),
        report("2026-06-22", ["a"]),
        report("2026-06-29", ["a"]),
      ],
      now: NOW,
    });

    const attention = insights.filter((i) => i.kind === "absent-member");
    expect(attention).toHaveLength(1);
    expect(attention[0].message).toContain("Bruno");
    expect(attention[0].message).toContain("2");
  });

  it("não aponta quem esteve presente na última célula", () => {
    const insights = buildLeaderInsights({
      members: [member("a", "Ana")],
      reports: [report("2026-06-22", []), report("2026-06-29", ["a"])],
      now: NOW,
    });
    expect(insights.filter((i) => i.kind === "absent-member")).toHaveLength(0);
  });

  it("uma falta só ainda não gera alerta", () => {
    const insights = buildLeaderInsights({
      members: [member("a", "Ana")],
      reports: [report("2026-06-22", ["a"]), report("2026-06-29", [])],
      now: NOW,
    });
    expect(insights.filter((i) => i.kind === "absent-member")).toHaveLength(0);
  });

  it("limita a lista aos 3 casos mais críticos (mais faltas primeiro)", () => {
    const members = ["a", "b", "c", "d"].map((id) => member(id, id.toUpperCase()));
    const insights = buildLeaderInsights({
      members,
      // 'a' faltou 4, 'b' 3, 'c' 2, 'd' 2
      reports: [
        report("2026-06-08", ["b", "c", "d"]),
        report("2026-06-15", ["c", "d"]),
        report("2026-06-22", []),
        report("2026-06-29", []),
      ],
      now: NOW,
    });
    const attention = insights.filter((i) => i.kind === "absent-member");
    expect(attention).toHaveLength(3);
    expect(attention[0].message).toContain("A");
  });
});

describe("buildLeaderInsights — relatório da semana", () => {
  it("lembra o líder quando o último relatório tem mais de 7 dias", () => {
    const insights = buildLeaderInsights({
      members: [],
      reports: [report("2026-06-15", [])],
      now: NOW,
    });
    expect(insights.some((i) => i.kind === "missing-report")).toBe(true);
  });

  it("não lembra quando há relatório na última semana", () => {
    const insights = buildLeaderInsights({
      members: [],
      reports: [report("2026-06-29", [])],
      now: NOW,
    });
    expect(insights.some((i) => i.kind === "missing-report")).toBe(false);
  });

  it("sem nenhum relatório: convida a criar o primeiro", () => {
    const insights = buildLeaderInsights({ members: [], reports: [], now: NOW });
    expect(insights.some((i) => i.kind === "missing-report")).toBe(true);
  });
});

describe("buildLeaderInsights — tendência de frequência", () => {
  it("avisa quando a presença caiu nas últimas semanas", () => {
    const insights = buildLeaderInsights({
      members: [],
      reports: [
        report("2026-05-18", ["a", "b", "c", "d", "e"]),
        report("2026-05-25", ["a", "b", "c", "d", "e"]),
        report("2026-06-01", ["a", "b", "c", "d", "e"]),
        report("2026-06-08", ["a", "b"]),
        report("2026-06-15", ["a", "b"]),
        report("2026-06-29", ["a", "b"]),
      ],
      now: NOW,
    });
    expect(insights.some((i) => i.kind === "trend-down")).toBe(true);
  });

  it("celebra quando a presença cresceu", () => {
    const insights = buildLeaderInsights({
      members: [],
      reports: [
        report("2026-05-18", ["a"]),
        report("2026-05-25", ["a", "b"]),
        report("2026-06-01", ["a"]),
        report("2026-06-08", ["a", "b", "c", "d"]),
        report("2026-06-15", ["a", "b", "c", "d", "e"]),
        report("2026-06-29", ["a", "b", "c", "d"]),
      ],
      now: NOW,
    });
    expect(insights.some((i) => i.kind === "trend-up")).toBe(true);
  });
});

describe("buildLeaderInsights — tudo em dia", () => {
  it("retorna mensagem positiva quando não há alertas", () => {
    const insights = buildLeaderInsights({
      members: [member("a", "Ana")],
      reports: [report("2026-06-29", ["a"])],
      now: NOW,
    });
    expect(insights).toHaveLength(1);
    expect(insights[0].kind).toBe("all-good");
  });
});
