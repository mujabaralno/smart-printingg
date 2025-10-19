// lib/materials/materials-pricing.ts

/**
 * Minimal types that match what's used in Step4.
 * Adjust/extend if your real material objects have stricter shapes.
 */
export type PaperLike = {
  pricePerSheet?: number | string | null;
  pricePerPacket?: number | string | null;
  sheetsPerPacket?: number | string | null;
};

export type Material = {
  name?: string | null;
  gsm?: number | string | null;
  // Optional: price fields if you also store per-material pricing
  pricePerSheet?: number | string | null;
  pricePerPacket?: number | string | null;
  sheetsPerPacket?: number | string | null;
};

function toNumber(n: unknown): number | null {
  if (typeof n === "number") return Number.isFinite(n) ? n : null;
  if (typeof n === "string") {
    const trimmed = n.trim();
    if (!trimmed) return null;
    // Remove common thousands separators and normalize decimal point
    const normalized = trimmed.replace(/,/g, "");
    const v = Number(normalized);
    return Number.isFinite(v) ? v : null;
  }
  return null;
}

/**
 * Exact normalization logic used in Step4 (DO NOT change the order):
 * 1) If pricePerSheet is defined → use it.
 * 2) Else if pricePerPacket and sheetsPerPacket are defined and > 0 → pricePerPacket / sheetsPerPacket.
 * 3) Else → null.
 */
export function resolvePricePerSheet(paper: PaperLike | null | undefined): number | null {
  if (!paper) return null;

  const pps = toNumber(paper.pricePerSheet);
  if (pps != null) return pps;

  const ppp = toNumber(paper.pricePerPacket);
  const spp = toNumber(paper.sheetsPerPacket);

  if (ppp != null && spp != null && spp > 0) {
    return ppp / spp;
  }

  return null;
}

/**
 * Finds a material by (case-insensitive) name and exact gsm match, then
 * resolves its per-sheet price using the same rule as resolvePricePerSheet.
 *
 * Returns undefined if no material is found; returns null if found but
 * the price cannot be resolved.
 */
export function getPaperPriceFromMaterials(
  materials: Material[] | null | undefined,
  name: string | null | undefined,
  gsm: number | string | null | undefined
): number | null | undefined {
  if (!materials || !Array.isArray(materials)) return undefined;

  const targetName = (name ?? "").trim().toLowerCase();
  const targetGsm = toNumber(gsm);

  const match = materials.find((m) => {
    const nm = (m?.name ?? "").trim().toLowerCase();
    const g  = toNumber(m?.gsm);
    if (!nm || g == null) return false;
    if (!targetName || targetGsm == null) return false;
    return nm === targetName && g === targetGsm;
  });

  if (!match) return undefined;

  // Use the exact same rule as in Step4 (do not change order/priority)
  return resolvePricePerSheet(match);
}
