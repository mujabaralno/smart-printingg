/* eslint-disable @typescript-eslint/no-explicit-any */
import { VisualizationSettings } from "@/types";

// Draw rectangular products (Business Cards, Flyers)
export function drawRectangularProduct(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  settings: VisualizationSettings,
  productData?: any
) {
  // Product background with gradient
  const productGradient = ctx.createLinearGradient(x, y, x + width, y + height);
  productGradient.addColorStop(0, "#ffffff");
  productGradient.addColorStop(0.5, "#f8fafc");
  productGradient.addColorStop(1, "#f1f5f9");

  ctx.fillStyle = productGradient;
  ctx.fillRect(x, y, width, height);

  // Professional border
  ctx.strokeStyle = "rgba(59, 130, 246, 0.8)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, height);

  // Inner content area (with bleed consideration)
  const bleedWidth =
    settings.bleedWidth * (width / (productData?.flatSize?.width || 100));
  const contentX = x + bleedWidth;
  const contentY = y + bleedWidth;
  const contentWidth = width - 2 * bleedWidth;
  const contentHeight = height - 2 * bleedWidth;

  // Content background
  ctx.fillStyle = "rgba(59, 130, 246, 0.1)";
  ctx.fillRect(contentX, contentY, contentWidth, contentHeight);

  // Content border
  ctx.strokeStyle = "rgba(59, 130, 246, 0.4)";
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.strokeRect(contentX, contentY, contentWidth, contentHeight);
  ctx.setLineDash([]);

  // Product dimensions label
  ctx.fillStyle = "rgba(55, 65, 81, 0.9)";
  ctx.font = "bold 12px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(
    `${(productData?.flatSize?.width || 9).toFixed(1)}cm × ${(
      productData?.flatSize?.height || 5.5
    ).toFixed(1)}cm`,
    x + width / 2,
    y + height / 2
  );
}
