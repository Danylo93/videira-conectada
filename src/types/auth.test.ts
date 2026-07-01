import { describe, it, expect } from "vitest";
import { getPastorScopeId, hasFinancialAccess, type User } from "./auth";

const baseUser: User = {
  id: "u-self",
  name: "Fulano",
  email: "f@x.com",
  role: "pastor",
  createdAt: new Date(),
};

describe("getPastorScopeId", () => {
  it("pastor de verdade usa o próprio id", () => {
    expect(getPastorScopeId({ ...baseUser, role: "pastor" })).toBe("u-self");
  });

  it("obreiro usa o id do pastor acima (pastorId)", () => {
    expect(
      getPastorScopeId({ ...baseUser, role: "pastor", isObreiro: true, pastorId: "u-pastor" }),
    ).toBe("u-pastor");
  });

  it("obreiro sem pastorId cai no próprio id", () => {
    expect(getPastorScopeId({ ...baseUser, isObreiro: true })).toBe("u-self");
  });
});

describe("hasFinancialAccess", () => {
  it("pastor e obreiro têm acesso; tesoureiro também", () => {
    expect(hasFinancialAccess({ ...baseUser, role: "pastor" })).toBe(true);
    expect(hasFinancialAccess({ ...baseUser, role: "obreiro" })).toBe(true);
    expect(hasFinancialAccess({ ...baseUser, role: "lider", isTesoureiro: true })).toBe(true);
    expect(hasFinancialAccess({ ...baseUser, role: "lider" })).toBe(false);
    expect(hasFinancialAccess(null)).toBe(false);
  });
});
