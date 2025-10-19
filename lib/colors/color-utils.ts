// lib/colors/color-utils.ts

/**
 * Normalizes various color inputs into numeric counts for front/back.
 * Accepts: numbers (1|2|4), strings ("1", "2", "4", "1c", "2c", "4c",
 * "BW", "Mono", "CMYK", "4+1", "4/1", "4+4", "4/0", etc.)
 */

export type ParsedColors = { front: number; back?: number; sides: 1 | 2 };

const LABELS: Record<string, number> = {
  // common labels → channels
  bw: 1,
  mono: 1,
  black: 1,
  "1c": 1,
  "2c": 2,
  "4c": 4,
  cmyk: 4,
  full: 4,
  fullcolor: 4,
};

/** Turns unknown inputs into a safe number (null if not a valid number). */
function toNumberSafe(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** Parses tokens like "4c", "BW", "Mono", "CMYK" into channel count. */
export function getColorFromInput(input: unknown): number | null {
  if (input == null) return null;

  // numeric first (e.g., 1, 2, 4)
  const numeric = toNumberSafe(input);
  if (numeric != null) return numeric;

  // label-based
  if (typeof input === "string") {
    const key = input.trim().toLowerCase();
    if (key in LABELS) return LABELS[key];

    // handle "4c", "2C", etc.
    const m = key.match(/^([124])\s*c$/i);
    if (m) return Number(m[1]);
  }

  return null;
}

/**
 * Parses combined notations like:
 * - "4+4", "4/4", "4-4"
 * - "4+1", "4/0", "4c+1c", "CMYK+BW"
 * - number only (e.g., 4) → interpreted as 1-side
 * Returns { front, back?, sides } with sides=1|2
 */
export function parseColors(value: unknown): ParsedColors {
  if (value == null) return { front: 4, sides: 1 };

  if (typeof value === "string") {
    const raw = value.trim().toLowerCase();

    // split on common separators
    const parts = raw.split(/[+\/-]/).map((p) => p.trim()).filter(Boolean);

    if (parts.length >= 2) {
      const f = getColorFromInput(parts[0]) ?? 4;
      const b = getColorFromInput(parts[1]) ?? 0;
      return { front: f, back: b > 0 ? b : undefined, sides: b > 0 ? 2 : 1 };
    }

    // single token string (e.g., "CMYK" | "BW" | "4c")
    const single = getColorFromInput(raw) ?? 4;
    return { front: single, sides: 1 };
  }

  // number-only
  const n = getColorFromInput(value) ?? 4;
  return { front: n, sides: 1 };
}
