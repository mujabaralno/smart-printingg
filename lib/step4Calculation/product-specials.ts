/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/step4calculation/product-specials.ts

/**
 * Utilities to isolate product-specific size/gap/bleed rules.
 * These default to "no-op" behavior unless you pass specific overrides,
 * so they won’t alter your existing logic unless you call them explicitly.
 */

export type Size = { width: number; height: number };

export type ShoppingBagSpec = {
  flatWidth?: number;      // finished bag width
  flatHeight?: number;     // finished bag height
  gusset?: number;         // side gusset width
  topFold?: number;        // top fold (hem) if any
  seamAllowance?: number;  // glue seam allowance
};

export type CupSpec = {
  baseGap?: number;        // base horizontal gap
  baseBleed?: number;      // base bleed
  sizeLabel?: string;      // e.g., "8oz", "12oz" if you branch on it
};

/**
 * Computes dieline for Shopping Bag.
 * If you already have a productConfig.calcEffectiveSize, keep using that.
 * This function is a standalone helper mirroring the common formula:
 * widthEffective  = flatWidth + gusset + seamAllowance
 * heightEffective = flatHeight + topFold
 */
export function computeShoppingBagDieline(spec: ShoppingBagSpec): Size {
  const flatWidth  = spec.flatWidth ?? 0;
  const flatHeight = spec.flatHeight ?? 0;
  const gusset     = spec.gusset ?? 0;
  const topFold    = spec.topFold ?? 0;
  const seam       = spec.seamAllowance ?? 0;

  return {
    width: flatWidth + gusset + seam,
    height: flatHeight + topFold,
  };
}

/**
 * Normalizes gap & bleed for cups by size.
 * By default, returns the inputs unchanged (no-op).
 * Plug in your size-based rules via the optional map.
 */
export function normalizeCupGapBleed(
  spec: CupSpec,
  overrides?: Partial<Record<string, { gap: number; bleed: number }>>
): { gap: number; bleed: number } {
  const defGap   = spec.baseGap ?? 0.5;
  const defBleed = spec.baseBleed ?? 0.3;

  if (!spec.sizeLabel) return { gap: defGap, bleed: defBleed };

  const rule = overrides?.[spec.sizeLabel];
  if (!rule) return { gap: defGap, bleed: defBleed };

  return { gap: rule.gap, bleed: rule.bleed };
}

/**
 * Generic helper to choose effective product size when you have either:
 * - a config-provided function, or
 * - a precomputed flat/close size.
 */
export function chooseEffectiveSize(
  base: { width?: number; height?: number } | null | undefined,
  configCalc?: (input: any) => { width: number; height: number } | null
): Size {
  if (typeof configCalc === "function") {
    const res = configCalc(base);
    if (res && typeof res.width === "number" && typeof res.height === "number") {
      return res;
    }
  }
  return {
    width:  base?.width  ?? 0,
    height: base?.height ?? 0,
  };
}
