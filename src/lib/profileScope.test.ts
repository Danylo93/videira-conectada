import { describe, it, expect } from "vitest";
import { applyProfileScope, profileScopeFlags } from "./profileScope";

// Query falsa que registra as chamadas .eq()/.or() encadeadas.
function makeQuery() {
  const calls: Array<{ method: string; args: unknown[] }> = [];
  const q = {
    calls,
    eq(column: string, value: unknown) {
      calls.push({ method: "eq", args: [column, value] });
      return q;
    },
    or(filters: string) {
      calls.push({ method: "or", args: [filters] });
      return q;
    },
  };
  return q;
}

describe("applyProfileScope", () => {
  it("filtra por is_kids no modo kids", () => {
    const q = makeQuery();
    applyProfileScope(q, "kids");
    expect(q.calls).toEqual([{ method: "eq", args: ["is_kids", true] }]);
  });

  it("filtra por is_radicais no modo radicais", () => {
    const q = makeQuery();
    applyProfileScope(q, "radicais");
    expect(q.calls).toEqual([{ method: "eq", args: ["is_radicais", true] }]);
  });

  it("exclui kids E radicais no modo normal", () => {
    const q = makeQuery();
    applyProfileScope(q, "normal");
    expect(q.calls).toEqual([
      { method: "or", args: ["is_kids.is.null,is_kids.eq.false"] },
      { method: "or", args: ["is_radicais.is.null,is_radicais.eq.false"] },
    ]);
  });
});

describe("profileScopeFlags", () => {
  it("normal => nenhum flag", () => {
    expect(profileScopeFlags("normal")).toEqual({ is_kids: false, is_radicais: false });
  });
  it("kids => is_kids", () => {
    expect(profileScopeFlags("kids")).toEqual({ is_kids: true, is_radicais: false });
  });
  it("radicais => is_radicais", () => {
    expect(profileScopeFlags("radicais")).toEqual({ is_kids: false, is_radicais: true });
  });
});
