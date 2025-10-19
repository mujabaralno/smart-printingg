"use client";
import * as React from "react";
import type { QuoteFormData } from "@/types"; // tetap pakai tipe existing kamu
import { getShoppingBagPreset, getProductConfig } from "@/constants/product-config";

type Args = {
  formData: QuoteFormData;
  setFormData: React.Dispatch<React.SetStateAction<QuoteFormData>>;
  setOutputDimensions: React.Dispatch<
    React.SetStateAction<Record<number, { width: number; height: number }>>
  >;
  userEditedInputDimensions: Set<string>;
};

export function useOperationalInit({
  formData,
  setFormData,
  setOutputDimensions,
  userEditedInputDimensions,
}: Args) {
  // jalankan sekali saat mount & saat daftar produk berubah
  React.useEffect(() => {
    // 1) bangun struktur operational.papers sesuai total product.papers
    const totalPapers = formData.products.reduce((t, p) => t + p.papers.length, 0);
    if (formData.operational.papers.length !== totalPapers) {
      const newOperationalPapers: QuoteFormData["operational"]["papers"] = [];
      formData.products.forEach((product) => {
        product.papers.forEach(() => {
          newOperationalPapers.push({
            inputWidth: null,
            inputHeight: null,
            pricePerPacket: null,
            pricePerSheet: null,
            sheetsPerPacket: null,
            recommendedSheets: 0,
            enteredSheets: null,
            outputWidth: null,
            outputHeight: null,
            selectedColors: product.colors
              ? [product.colors.front, product.colors.back].filter(Boolean) as string[]
              : [],
          });
        });
      });

      setFormData((prev) => ({
        ...prev,
        operational: { ...prev.operational, papers: newOperationalPapers },
        outputDimensions: formData.outputDimensions ?? prev.outputDimensions,
      }));
    }

    // 2) set default outputDimensions (termasuk special case Shopping Bag)
    const next: Record<number, { width: number; height: number }> = {};
    formData.products.forEach((product, i) => {
      if (product?.productName === "Shopping Bag" && product?.bagPreset) {
        const preset = getShoppingBagPreset(product.bagPreset);
        if (preset) {
          const W = preset.width;
          const H = preset.height;
          const G = preset.gusset;
          const T = Math.max(3, W * 0.12);
          const B = Math.max(6, W * 0.25);
          const glue = 2;
          next[i] = { width: W + G + W + G + glue, height: T + H + B };
          return;
        }
      }
      next[i] = {
        width: product.closeSize?.width ?? product.flatSize?.width ?? 0,
        height: product.closeSize?.height ?? product.flatSize?.height ?? 0,
      };
    });
    setOutputDimensions(next);

    // 3) default input sheet size = 100×70 bila user belum mengedit
    setFormData((prev) => {
      const papers = prev.operational.papers.map((p, idx) => {
        const key = `input-dimensions-${idx}`;
        if (userEditedInputDimensions.has(key)) return p;
        return {
          ...p,
          inputWidth: p.inputWidth ?? 100,
          inputHeight: p.inputHeight ?? 70,
        };
      });
      return { ...prev, operational: { ...prev.operational, papers } };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.products]);
}
