export type AppRole = "pastor" | "obreiro" | "discipulador" | "lider" | "membro";

export function normalizeRole(rawRole?: string | null): AppRole | null {
  if (!rawRole) return null;

  const normalized = rawRole
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");

  if (normalized.includes("pastor")) return "pastor";
  if (normalized.includes("obreiro")) return "obreiro";
  if (normalized.includes("discipulador")) return "discipulador";
  if (normalized.includes("lider") || normalized.includes("lader")) return "lider";
  if (normalized.includes("membro") || normalized.includes("member")) return "membro";

  return null;
}

export function roleLabel(role?: string | null): string {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === "pastor") return "Pastor";
  if (normalizedRole === "obreiro") return "Obreiro";
  if (normalizedRole === "discipulador") return "Discipulador";
  if (normalizedRole === "lider") return "Lider";
  if (normalizedRole === "membro") return "Membro";

  return "Membro";
}
