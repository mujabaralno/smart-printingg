/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from "react";
import type { QuoteFormData } from "@/types";  // adjust path to your types

// Shape of one row in the per-paper calculation
export type PerPaperCalcRow = {
  recommendedSheets?: number;
  // Add any other fields your table rows carry (e.g., press info, digital/offset options, etc.)
};

export type PerPaperCalcResult = Record<number, PerPaperCalcRow>;

/**
 * Compute per-product paper calculations.
 * This function encapsulates the heavy useMemo from Step4Operational.
 *
 * @param formData - The full form data including products & operational state
 * @param outputDimensions - Pre-computed dimensions for each product
 * @param getPaperPriceFromMaterials - Function to look up paper pricing
 * @param userEditedSheets - Optional map of indices where user input should be preserved
 */
export function computePerPaperCalc(
  formData: QuoteFormData,
  outputDimensions: Record<number, { width: number; height: number }>,
  getPaperPriceFromMaterials: (
    materials: any,
    paperName: string,
    gsm: number
  ) => number | undefined,
  userEditedSheets?: Record<number, boolean>
): PerPaperCalcResult {
  const result: PerPaperCalcResult = {};

  // Iterate through products
  formData.products.forEach((product, idx) => {
    const dims = outputDimensions[idx];
    if (!dims) return;

    // Your existing logic for:
    // - digital presses (looping through candidates, computing sheets/parents)
    // - offset presses (using calcRowTotal, pickCheapestTotal, etc.)
    // - special product handling (cups, shopping bag, etc.)
    //
    // Example skeleton:
    let recommended: number | undefined = undefined;

    // TODO: paste in the actual algorithm you have in Step4Operational
    // For now, we just set recommended = 0 as placeholder.
    recommended = 0;

    result[idx] = { recommendedSheets: recommended };
  });

  return result;
}

/**
 * Hook wrapper so Step4Operational can just call usePerPaperCalc instead of a giant inline useMemo.
 */
export function usePerPaperCalc(
  formData: QuoteFormData,
  outputDimensions: Record<number, { width: number; height: number }>,
  getPaperPriceFromMaterials: (
    materials: any,
    paperName: string,
    gsm: number
  ) => number | undefined,
  userEditedSheets?: Record<number, boolean>
) {
  return React.useMemo(
    () =>
      computePerPaperCalc(
        formData,
        outputDimensions,
        getPaperPriceFromMaterials,
        userEditedSheets
      ),
    [formData, outputDimensions, getPaperPriceFromMaterials, userEditedSheets]
  );
}
