import { describe, it, expect } from "vitest";
import { getDefaultModeForUser, getProfileModeConfig, PROFILE_MODE_ORDER } from "./profileModes";

describe("getDefaultModeForUser", () => {
  it("usuário radicais entra em radicais", () => {
    expect(getDefaultModeForUser({ isRadicais: true })).toBe("radicais");
  });
  it("usuário kids entra em kids", () => {
    expect(getDefaultModeForUser({ isKids: true })).toBe("kids");
  });
  it("radicais tem prioridade sobre kids", () => {
    expect(getDefaultModeForUser({ isRadicais: true, isKids: true })).toBe("radicais");
  });
  it("usuário normal entra em normal", () => {
    expect(getDefaultModeForUser({})).toBe("normal");
    expect(getDefaultModeForUser(null)).toBe("normal");
  });
});

describe("getProfileModeConfig", () => {
  it("todos os modos têm config com label e ícone", () => {
    for (const mode of PROFILE_MODE_ORDER) {
      const cfg = getProfileModeConfig(mode);
      expect(cfg.menuLabel).toBeTruthy();
      expect(cfg.icon).toBeTruthy();
    }
  });
});
