import type { QuoteFormData } from "@/types";

export function globalToLocalIndex(
  formData: QuoteFormData,
  globalPaperIndex: number
) {
  let acc = 0;
  for (let pi = 0; pi < formData.products.length; pi++) {
    const count = formData.products[pi].papers.length;
    if (globalPaperIndex < acc + count) {
      return { productIndex: pi, paperIndex: globalPaperIndex - acc };
    }
    acc += count;
  }
  return { productIndex: 0, paperIndex: 0 };
}

export function localToGlobalIndex(
  formData: QuoteFormData,
  productIndex: number,
  paperIndex: number
) {
  let acc = 0;
  for (let i = 0; i < productIndex; i++) acc += formData.products[i].papers.length;
  return acc + paperIndex;
}
