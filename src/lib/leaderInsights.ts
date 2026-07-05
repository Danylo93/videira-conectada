/**
 * Motor de insights do Assistente da Célula.
 *
 * Lógica pura (sem rede, sem React) que analisa os últimos relatórios da
 * célula e gera orientações para o líder — ex.: dar atenção a um irmão que
 * faltou às últimas células, lembrar do relatório da semana, tendência de
 * frequência. Por ser determinística, é totalmente coberta por testes.
 */

export interface InsightMember {
  id: string;
  name: string;
  type: "member" | "frequentador";
}

export interface InsightReport {
  /** Início da semana do relatório (ISO YYYY-MM-DD) */
  weekStart: string;
  /** Ids de todos os presentes (membros + frequentadores) */
  presentIds: string[];
}

export type InsightKind =
  | "absent-member"
  | "missing-report"
  | "trend-down"
  | "trend-up"
  | "all-good";

export interface LeaderInsight {
  kind: InsightKind;
  /** Gravidade para ordenação/estilo: quanto menor, mais importante */
  severity: 1 | 2 | 3;
  message: string;
}

interface BuildParams {
  members: InsightMember[];
  /** Relatórios em qualquer ordem; serão ordenados por weekStart */
  reports: InsightReport[];
  /** Injetável nos testes; padrão = agora */
  now?: Date;
}

const MAX_ABSENT_HIGHLIGHTS = 3;
const MIN_CONSECUTIVE_ABSENCES = 2;
const TREND_WINDOW = 3;

export function buildLeaderInsights({ members, reports, now = new Date() }: BuildParams): LeaderInsight[] {
  const insights: LeaderInsight[] = [];
  const ordered = [...reports].sort(
    (a, b) => new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime(),
  );

  // 1) Irmãos ausentes nas últimas células (faltas consecutivas contadas do fim)
  if (ordered.length >= MIN_CONSECUTIVE_ABSENCES && members.length > 0) {
    const absentStreaks = members
      .map((m) => {
        let streak = 0;
        for (let i = ordered.length - 1; i >= 0; i--) {
          if (ordered[i].presentIds.includes(m.id)) break;
          streak++;
        }
        return { member: m, streak };
      })
      .filter(({ streak }) => streak >= MIN_CONSECUTIVE_ABSENCES)
      .sort((a, b) => b.streak - a.streak)
      .slice(0, MAX_ABSENT_HIGHLIGHTS);

    for (const { member, streak } of absentStreaks) {
      insights.push({
        kind: "absent-member",
        severity: 1,
        message: `Dê atenção a ${member.name}: faltou às últimas ${streak} células. Que tal uma ligação ou visita esta semana?`,
      });
    }
  }

  // 2) Relatório da semana em aberto
  const last = ordered[ordered.length - 1];
  const daysSinceLast = last
    ? Math.floor((now.getTime() - new Date(last.weekStart).getTime()) / 86_400_000)
    : Infinity;
  if (daysSinceLast > 7) {
    insights.push({
      kind: "missing-report",
      severity: 2,
      message: last
        ? "O relatório desta semana ainda não foi preenchido. Registre a célula para manter o acompanhamento em dia."
        : "Sua célula ainda não tem relatórios. Crie o primeiro para começar o acompanhamento!",
    });
  }

  // 3) Tendência de frequência (média das últimas semanas vs. anteriores)
  if (ordered.length >= TREND_WINDOW * 2) {
    const totals = ordered.map((r) => r.presentIds.length);
    const recent = totals.slice(-TREND_WINDOW);
    const previous = totals.slice(-TREND_WINDOW * 2, -TREND_WINDOW);
    const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    const avgRecent = avg(recent);
    const avgPrevious = avg(previous);

    if (avgPrevious > 0) {
      const delta = (avgRecent - avgPrevious) / avgPrevious;
      if (delta <= -0.2) {
        insights.push({
          kind: "trend-down",
          severity: 2,
          message: `A presença média caiu de ${avgPrevious.toFixed(0)} para ${avgRecent.toFixed(0)} nas últimas semanas. Vale conversar com a célula e entender o motivo.`,
        });
      } else if (delta >= 0.1) {
        insights.push({
          kind: "trend-up",
          severity: 3,
          message: `A presença média subiu de ${avgPrevious.toFixed(0)} para ${avgRecent.toFixed(0)} nas últimas semanas. Continue assim! 🎉`,
        });
      }
    }
  }

  if (insights.length === 0) {
    insights.push({
      kind: "all-good",
      severity: 3,
      message: "Tudo em dia por aqui: relatório recente e ninguém com faltas seguidas. Bom trabalho!",
    });
  }

  return insights.sort((a, b) => a.severity - b.severity);
}
