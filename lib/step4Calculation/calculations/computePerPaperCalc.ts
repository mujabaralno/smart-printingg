import { CUT_SIZE_CANDIDATES } from "@/constants";
import { getProductConfig, getShoppingBagPreset } from "@/constants/product-config";
import { excelDigitalCalculation } from "@/lib/excel-calculation";
import { computeLayout } from "@/lib/step4Calculation/computeLayout";
import { calcRowTotal } from "@/lib/step4Calculation/calcRowTotal";
import { pickCheapestTotal } from "@/lib/step4Calculation/pickCheapestTotal";
import { calculateVisualizationPressDimensions } from "@/lib/dynamic-press-calculator";
import { parseColorsCount } from "./colorParsing";
import type { QuoteFormData } from "@/types";

export function computePerPaperCalc(
  formData: QuoteFormData,
  outputDimensions: Record<number, { width: number; height: number }>,
  getPaperPriceFromMaterials: (paperName: string, gsm: string) => number | null
) {
  return formData.products.map((product, productIndex) => {
    const qty = product?.quantity ?? 0;
    return product.papers.map((paper: any, paperIndex: number) => {
      const globalPaperIndex = formData.products
        .slice(0, productIndex)
        .reduce((t, p) => t + p.papers.length, 0) + paperIndex;

      const opPaper = formData.operational.papers[globalPaperIndex];
      // dimensi produk (pilih dari outputDimensions / flatSize / closeSize)
      let w = outputDimensions[productIndex]?.width ??
              product?.flatSize?.width ?? product?.closeSize?.width ?? 0;
      let h = outputDimensions[productIndex]?.height ??
              product?.flatSize?.height ?? product?.closeSize?.height ?? 0;

      if (product.productName === "Shopping Bag" && product.bagPreset) {
        const bag = getShoppingBagPreset(product.bagPreset);
        if (bag) {
          const W = bag.width, H = bag.height, G = bag.gusset;
          const T = Math.max(3, W*0.12), B = Math.max(6, W*0.25), glue = 2;
          w = W + G + W + G + glue;
          h = T + H + B;
        }
      }

      const paperName = paper?.name ?? "";
      const gsm = paper?.gsm ?? "";
      let pricePerSheet = opPaper?.pricePerSheet ?? null;
      if (pricePerSheet == null) {
        if (opPaper?.pricePerPacket && opPaper?.sheetsPerPacket) {
          pricePerSheet = opPaper.pricePerPacket / opPaper.sheetsPerPacket;
        } else {
          pricePerSheet = getPaperPriceFromMaterials(paperName, gsm) ?? 10;
        }
      }

      const conf = getProductConfig(product?.productName || "Business Card");
      const gripper = product?.gripper ?? conf?.defaultGripper ?? 0.9;
      const bleed = product?.bleed ?? conf?.defaultBleed ?? 0.3;
      const baseGap = product?.productName === "Cups" ? 0.2 : (product?.gap ?? conf?.defaultGap ?? 0.5);

      // warna
      const fc = parseColorsCount(product.colors?.front);
      const bc = parseColorsCount(product.colors?.back);
      const raw = Math.max(fc, bc) || 4;
      const isDigital = product?.printingSelection === "Digital";
      const colours = isDigital ? (raw <= 3 ? 1 : 4) : raw;

      // pilih press size dinamis
      const pd = calculateVisualizationPressDimensions({ width: w, height: h }, formData);
      const pressW = pd?.width ?? 35;
      const pressH = pd?.height ?? 50;

      let layout: any;
      let recommendedSheets = 0;

      if (isDigital) {
        try {
          const results = excelDigitalCalculation({
            qty,
            piece: { w, h },
            sides: Number(product.sides) as 1|2,
            colorsF: (colours as 1|2|4),
            colorsB: 1,
            parent: { w: 100, h: 70 },
            allowRotate: true,
            paperCostPerSheet: pricePerSheet ?? 10,
          });
          const valid = results.filter(r => r.total > 0);
          const cheapest = valid.reduce((m, c) => c.total < m.total ? c : m, valid[0]);
          recommendedSheets = cheapest.parents;
          layout = {
            itemsPerSheet: cheapest.upsPerSheet,
            orientation: cheapest.gridLayout?.orientation,
            itemsPerRow: cheapest.gridLayout?.itemsPerRow,
            itemsPerCol: cheapest.gridLayout?.itemsPerCol,
            pressWidth: cheapest.gridLayout?.sheetWidth,
            pressHeight: cheapest.gridLayout?.sheetHeight,
            digitalResults: results,
            selectedDigitalOption: cheapest,
          };
        } catch {
          layout = computeLayout(pressW, pressH, w, h, gripper, 0.5, baseGap, bleed);
          recommendedSheets = layout.itemsPerSheet > 0 ? Math.ceil(qty / layout.itemsPerSheet) : 0;
        }
      } else {
        // OFFSET
        layout = computeLayout(pressW, pressH, w, h, gripper, 0.5, baseGap, bleed);
        const baseSel = { pieceW: w, pieceH: h, qty, sides: Number(product.sides)||2, colours, paperCostPerSheet: pricePerSheet ?? 10 };
        let chosen = pickCheapestTotal({ ...baseSel, paperCostPerSheet: pricePerSheet ?? 10 }, CUT_SIZE_CANDIDATES)[0];
        if (!chosen) return null;
        const excel = calcRowTotal(baseSel, chosen);
        recommendedSheets = excel.sheets;
        layout.itemsPerSheet = excel.upsPerSht;
        layout.selectedParentWidth = chosen.parentW;
        layout.selectedParentHeight = chosen.parentH;
      }

      return { layout, recommendedSheets, pricePerSheet, opPaper };
    });
  });
}
