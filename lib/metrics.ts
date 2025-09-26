export type QuoteStatus = "Approved" | "Pending" | "Rejected" | string;

export type QuoteLike = {
  status: QuoteStatus;
  createdAt?: string | number | Date;
  created_at?: string | number | Date;
  date?: string | number | Date;
};

export function calcGrowth(current: number, previous: number) {
  if (previous === 0) return 0;
  const growth = ((current - previous) / previous) * 100;
  return Math.max(-100, Math.min(100, growth));
}

export function asTrend(v: number) {
  return (v > 0 ? "up" : v < 0 ? "down" : "flat") as "up" | "down" | "flat";
}

export function pickDate(q: QuoteLike): Date | null {
  const raw = q?.createdAt ?? q?.created_at ?? q?.date;
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

export function inRange(d: Date | null, start: Date, end: Date) {
  if (!d) return false;
  return d >= start && d <= end;
}

/** Rolling 30 hari terakhir vs 30 hari sebelumnya (inklusif) */
export function getRolling30dRanges() {
  const end = new Date(); // now
  const start = new Date(end);
  start.setDate(start.getDate() - 29);

  const prevEnd = new Date(start);
  prevEnd.setDate(prevEnd.getDate() - 1);

  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - 29);

  return { start, end, prevStart, prevEnd };
}
