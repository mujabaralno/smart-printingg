"use client";
import * as React from "react";
import type { QuoteFormData } from "@/types";
import { computePerPaperCalc } from "../calculations/computePerPaperCalc";

type Args = {
  formData: QuoteFormData;
  setFormData: React.Dispatch<React.SetStateAction<QuoteFormData>>;
  outputDimensions: Record<number, { width: number; height: number }>;
  userEditedSheets: Set<string>;
  getPaperPriceFromMaterials: (paperName: string, gsm: string) => number | null;
};

export function useOperationalSync({
  formData, setFormData, outputDimensions, userEditedSheets, getPaperPriceFromMaterials,
}: Args) {
  const perPaperCalc = React.useMemo(
    () => computePerPaperCalc(formData, outputDimensions, getPaperPriceFromMaterials),
    [formData.operational.papers, formData.products, outputDimensions, getPaperPriceFromMaterials]
  );

  // Seed recommended & enteredSheets (hormati userEditedSheets & data existing)
  React.useEffect(() => {
    if (!perPaperCalc.length) return;
    setFormData(prev => {
      const papers = prev.operational.papers.map((p, gi) => {
        // cari productIndex/paperIndex
        let acc = 0, prodIdx = 0, paperIdx = 0;
        for (let pi = 0; pi < prev.products.length; pi++) {
          const cnt = prev.products[pi].papers.length;
          if (gi < acc + cnt) { prodIdx = pi; paperIdx = gi - acc; break; }
          acc += cnt;
        }
        const rec = perPaperCalc[prodIdx]?.[paperIdx]?.recommendedSheets ?? p.recommendedSheets ?? 1;
        const key = `paper-${gi}`;
        const hasUserEdited = userEditedSheets.has(key);

        // preserve enteredSheets bila user sudah edit / dari quote tersimpan
        const hasExisting = p.enteredSheets != null;
        const enteredSheets = hasUserEdited ? (p.enteredSheets ?? rec) : (hasExisting ? p.enteredSheets! : rec);

        return { ...p, recommendedSheets: rec, enteredSheets };
      });
      return { ...prev, operational: { ...prev.operational, papers } };
    });
  }, [perPaperCalc, setFormData, userEditedSheets]);

  return { perPaperCalc };
}
