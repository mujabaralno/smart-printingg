export function validateOutputDimensions(
  w: number, h: number,
  parentW?: number | null, parentH?: number | null
): string | null {
  if (!parentW || !parentH) return null;
  const ok = (w <= parentW && h <= parentH) || (w <= parentH && h <= parentW);
  return ok ? null : "Output too large for parent sheet (any orientation).";
}
