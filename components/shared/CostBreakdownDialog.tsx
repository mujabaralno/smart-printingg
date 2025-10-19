/* eslint-disable @typescript-eslint/no-explicit-any */
// components/CostBreakdownDialog.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3 } from "lucide-react";

// === Import kalkulasi & pricing ===
import { calcDigitalCosting, calcOffsetCosting } from "@/lib/imposition";        // :contentReference[oaicite:7]{index=7}
import { PricingService } from "@/lib/pricing-service";                           // :contentReference[oaicite:8]{index=8}

type QuoteFormData = {
  products: any[];
  operational: any;
  additionalCosts: Array<{ label: string; amount: number }>;
  outputDimensions: any[];
};

type PieceSize = { width: number; height: number };

function currency(n: number) {
  return `AED ${Number(n || 0).toFixed(2)}`;
}

export function CostBreakdownDialog({
  open,
  onOpenChange,
  formData,
  pieceSize,        // <- dikirim dari Step4 via getEffectiveProductSize
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  formData: QuoteFormData;
  pieceSize: PieceSize;
}) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [digitalRows, setDigitalRows] = useState<any[]>([]);
  const [offsetRow, setOffsetRow] = useState<any | null>(null);

  // Ambil parameter dari formData (kalau tidak ada, fallback aman)
  const qty = useMemo(
    () =>
      Number(formData?.operational?.qty) ||
      Number(formData?.products?.[0]?.qty) ||
      0,
    [formData]
  );

  const sides = useMemo<1 | 2>(() => {
    const s = Number(formData?.operational?.sides);
    return s === 2 ? 2 : 1;
  }, [formData]);

  const colorsF = useMemo<1 | 2 | 4>(() => {
    const c = Number(formData?.operational?.colorsF);
    return (c === 1 || c === 2 || c === 4) ? (c as 1|2|4) : 4;
  }, [formData]);

  const colorsB = useMemo<1 | 2 | 4 | undefined>(() => {
    const c = Number(formData?.operational?.colorsB);
    if (sides === 2) return (c === 1 || c === 2 || c === 4) ? (c as 1|2|4) : 0 as any;
    return undefined;
  }, [formData, sides]);

  // Gap/bleed default aman (kalau produkmu punya field gap/bleed, bisa dipakai)
  const bleed = Number(formData?.operational?.bleed) || 0.5;
  const gapX  = Number(formData?.operational?.gapX)  || 0.5;
  const gapY  = Number(formData?.operational?.gapY)  || 0.5;

  // Additional & finishing (opsional)
  const finishingCost = Number(formData?.operational?.finishingCost) || 0;
  const additionalCost = (formData?.additionalCosts || []).reduce(
    (s, it) => s + (Number(it?.amount) || 0),
    0
  );

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!open) return;
      setLoading(true);
      setErr(null);
      try {
        // 1) Ambil pricing (digital & offset) :contentReference[oaicite:9]{index=9}
        const { digital, offset } = await PricingService.getAllPricing();

        // 2) DIGITAL: gunakan calcDigitalCosting (default useExcelLogic = true) :contentReference[oaicite:10]{index=10}
        const digitalRes = calcDigitalCosting({
          qty,
          piece: { w: pieceSize.width, h: pieceSize.height },
          bleed,
          gapX,
          gapY,
          margins: undefined as any, // gunakan default dari lib
          sides,
          colorsF,
          colorsB,
          perClick: digital.perClick,
          parentCost: digital.parentSheetCost,
          wasteParents: digital.wasteParents,
          allowRotate: true,
          useExcelLogic: true,
        });

        // 3) OFFSET: gunakan calcOffsetCosting (default useExcelLogic = true) :contentReference[oaicite:11]{index=11}
        //   param 'press' tetap wajib dipassing walau tak dipakai di jalur Excel
        const offsetRes = calcOffsetCosting({
          qty,
          press: { w: 35, h: 50, label: "35×50 cm" },
          piece: { w: pieceSize.width, h: pieceSize.height },
          bleed,
          gapX,
          gapY,
          margins: undefined as any,
          sides,
          colorsF,
          colorsB,
          pricing: offset,
          allowRotate: true,
          useExcelLogic: true,
        });

        if (cancelled) return;

        setDigitalRows(digitalRes || []);
        setOffsetRow(offsetRes || null);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Gagal menghitung breakdown.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [open, qty, pieceSize, sides, colorsF, colorsB, bleed, gapX, gapY]);

  const cheapestDigital = useMemo(() => {
    if (!digitalRows?.length) return null;
    return digitalRows.reduce((a: any, b: any) => (a.total <= b.total ? a : b));
  }, [digitalRows]);

  const grandTotal = useMemo(() => {
    const base =
      (cheapestDigital?.total ?? 0) ||
      (offsetRow?.total ?? 0);
    return base + finishingCost + additionalCost;
  }, [cheapestDigital, offsetRow, finishingCost, additionalCost]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Cost Breakdown
            {!!qty && (
              <Badge variant="secondary" className="ml-2">
                Qty {qty} • {pieceSize.width}×{pieceSize.height} cm
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-sm text-slate-500">Menghitung…</div>
        ) : err ? (
          <div className="py-2 text-sm text-red-600">{err}</div>
        ) : (
          <div className="space-y-6">
            {/* DIGITAL */}
            <div>
              <h3 className="font-semibold mb-2">Digital (per Excel)</h3>
              {(!digitalRows || digitalRows.length === 0) ? (
                <div className="text-sm text-slate-500">Tidak ada opsi digital yang cocok.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-slate-600">
                      <tr className="border-b">
                        <th className="py-2 pr-3">Option</th>
                        <th className="py-2 pr-3 text-right">Ups/Sheet</th>
                        <th className="py-2 pr-3 text-right">Parents</th>
                        <th className="py-2 pr-3 text-right">Paper</th>
                        <th className="py-2 pr-3 text-right">Clicks</th>
                        <th className="py-2 pr-0 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {digitalRows.map((r: any, i: number) => {
                        const isBest = r.total === cheapestDigital?.total;
                        return (
                          <tr key={i} className="border-b last:border-0">
                            <td className="py-2 pr-3">
                              <div className="flex items-center gap-2">
                                <span>{r.option}</span>
                                {isBest && <Badge className="bg-green-600 hover:bg-green-600">Best</Badge>}
                              </div>
                            </td>
                            <td className="py-2 pr-3 text-right">{r.upsPerSheet}</td>
                            <td className="py-2 pr-3 text-right">{r.parents}</td>
                            <td className="py-2 pr-3 text-right">{currency(r.paper)}</td>
                            <td className="py-2 pr-3 text-right">{currency(r.clicks)}</td>
                            <td className="py-2 pr-0 text-right font-semibold">{currency(r.total)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* OFFSET */}
            <div>
              <h3 className="font-semibold mb-2">Offset (per Excel)</h3>
              {!offsetRow ? (
                <div className="text-sm text-slate-500">Tidak ada hasil offset.</div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded-xl border bg-white">
                    <div className="text-slate-500">Parents</div>
                    <div className="font-medium">{offsetRow.parents}</div>
                  </div>
                  <div className="p-3 rounded-xl border bg-white">
                    <div className="text-slate-500">Paper</div>
                    <div className="font-medium">{currency(offsetRow.paper)}</div>
                  </div>
                  <div className="p-3 rounded-xl border bg-white">
                    <div className="text-slate-500">Plates</div>
                    <div className="font-medium">{currency(offsetRow.platesC)}</div>
                  </div>
                  <div className="p-3 rounded-xl border bg-white">
                    <div className="text-slate-500">Make Ready</div>
                    <div className="font-medium">{currency(offsetRow.mkready)}</div>
                  </div>
                  <div className="p-3 rounded-xl border bg-white">
                    <div className="text-slate-500">Run</div>
                    <div className="font-medium">{currency(offsetRow.run)}</div>
                  </div>
                  <div className="p-3 rounded-xl border bg-white">
                    <div className="text-slate-500">Cutting</div>
                    <div className="font-medium">{currency(offsetRow.cutting)}</div>
                  </div>
                  <div className="p-3 rounded-xl border bg-white sm:col-span-2">
                    <div className="text-slate-500">Total (Offset)</div>
                    <div className="font-semibold text-lg">{currency(offsetRow.total)}</div>
                  </div>
                </div>
              )}
            </div>

            {/* GRAND TOTAL (tambahkan finishing & additional) */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2">
              {!!finishingCost && (
                <>
                  <div className="text-sm text-slate-500">Finishing</div>
                  <div className="text-base font-medium">{currency(finishingCost)}</div>
                </>
              )}
              {!!additionalCost && (
                <>
                  <div className="text-sm text-slate-500 sm:ml-4">Additional</div>
                  <div className="text-base font-medium">{currency(additionalCost)}</div>
                </>
              )}
              <div className="text-sm text-slate-500 sm:ml-6">Grand Total</div>
              <div className="text-lg font-bold">{currency(grandTotal)}</div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
