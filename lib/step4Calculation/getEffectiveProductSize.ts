/* eslint-disable @typescript-eslint/no-explicit-any */
import { getShoppingBagPreset } from "@/constants/product-config";

// Unified helper to get effective product dimensions for layout consistency
export function getEffectiveProductSize(product: any, productConfig: any) {
  const productName = product?.productName || "Business Card";
  let width =
    product?.flatSize?.width || productConfig?.defaultSizes?.width || 9;
  let height =
    product?.flatSize?.height || productConfig?.defaultSizes?.height || 5.5;

  // For cups, use original dimensions without modifications to match GitHub version
  if (productName === "Cups") {
    console.log("🍵 getEffectiveProductSize for cups:", {
      cupSizeOz: product?.cupSizeOz,
      originalDimensions: { width, height },
      source: "original GitHub logic - no modifications",
    });
  }

  // Apply shopping bag dieline calculations if needed
  if (productName === "Shopping Bag" && product?.bagPreset) {
    const bagPreset = getShoppingBagPreset(product.bagPreset);
    if (bagPreset) {
      const W = bagPreset.width;
      const H = bagPreset.height;
      const G = bagPreset.gusset;
      const T = Math.max(3, W * 0.12);
      const B = Math.max(6, W * 0.25);
      const glueFlap = 2;
      width = W + G + W + G + glueFlap;
      height = T + H + B;
    }
  }

  return { width, height };
}