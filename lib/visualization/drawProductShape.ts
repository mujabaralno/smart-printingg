/* eslint-disable @typescript-eslint/no-explicit-any */
import { ProductShape, VisualizationSettings } from "@/types";
import { drawRectangularProduct } from "./drawRectangularProduct";
import { drawCircularProduct } from "./drawCircularProduct";
import { drawComplex3DProduct } from "./drawComplex3DProduct";

// Draw product-specific shapes with professional styling
export function drawProductShape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  productShape: ProductShape,
  settings: VisualizationSettings,
  productData?: any
) {
  switch (productShape) {
    case "rectangular":
      drawRectangularProduct(ctx, x, y, width, height, settings, productData);
      break;
    case "circular":
      drawCircularProduct(ctx, x, y, width, height, settings, productData);
      break;
    case "complex-3d":
      drawComplex3DProduct(ctx, x, y, width, height, settings, productData);
      break;
  }
}