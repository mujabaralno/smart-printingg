/* eslint-disable @typescript-eslint/no-explicit-any */
import { getShoppingBagPreset } from "@/constants/product-config";
import { VisualizationSettings } from "@/types";

export function drawComplex3DProduct(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  settings: VisualizationSettings,
  productData?: any
) {
  console.log("🛍️ drawComplex3DProduct called with:", {
    x,
    y,
    width,
    height,
    productData: productData
      ? {
          productName: productData.productName,
          bagPreset: productData.bagPreset,
          flatSize: productData.flatSize,
        }
      : "undefined",
  });

  const centerX = x + width / 2;
  const centerY = y + height / 2;

  // Get shopping bag preset from product data or use default
  const bagPresetName = productData?.bagPreset || "Medium";
  const bagPreset = getShoppingBagPreset(bagPresetName);

  console.log("🛍️ Bag preset lookup:", { bagPresetName, bagPreset });

  if (!bagPreset) {
    console.error("Shopping bag preset not found:", bagPresetName);
    return;
  }

  // Use the actual Step 3 dimensions from productData
  const step3Width = productData?.flatSize?.width || bagPreset.width;
  const step3Height = productData?.flatSize?.height || bagPreset.height;

  // For shopping bags, we need to calculate the total dieline dimensions
  // The Step 3 dimensions are the individual panel dimensions, not the total dieline
  const W = bagPreset.width; // Individual panel width (cm)
  const H = bagPreset.height; // Individual panel height (cm)
  const G = bagPreset.gusset; // Gusset width (cm)

  // Fixed dimensions for shopping bags
  const T = Math.max(3, W * 0.12); // Top hem (proportional to width)
  const B = Math.max(6, W * 0.25); // Bottom flaps (proportional to width)

  const FIXED = {
    bleed: 0.3, // cm
    safety: 0.3, // cm
    glueFlap: 2, // cm
    handleDia: 0.6, // cm
  };

  // Calculate total dieline dimensions (same as in Step 4 layout calculation)
  const totalW = W + G + W + G + FIXED.glueFlap; // Back + Gusset + Front + Gusset + Glue
  const totalH = T + H + B; // Top hem + Body height + Bottom flaps

  // Debug logging to verify dimensions
  console.log("🛍️ drawComplex3DProduct dimensions:", {
    bagPreset: bagPresetName,
    step3Width: step3Width,
    step3Height: step3Height,
    individualPanel: { W, H, G },
    calculatedTotal: { totalW, totalH },
    canvasSpace: { width, height },
  });

  // Scale to fit within the allocated canvas space
  const scaleX = (width * 0.8) / totalW;
  const scaleY = (height * 0.8) / totalH;
  const scale = Math.min(scaleX, scaleY);

  // Scaled dimensions
  const scaledW = W * scale;
  const scaledH = H * scale;
  const scaledG = G * scale;
  const scaledT = T * scale;
  const scaledB = B * scale;
  const scaledGlueFlap = FIXED.glueFlap * scale;
  const scaledHandleDia = FIXED.handleDia * scale;

  // Calculate scaled total dimensions
  const scaledBodyW = scaledW + scaledG + scaledW + scaledG + scaledGlueFlap;
  const scaledBodyH = scaledT + scaledH;
  const scaledTotalW = scaledBodyW;
  const scaledTotalH = scaledBodyH + scaledB;

  // Position bag centered
  const bagX = centerX - scaledTotalW / 2;
  const bagY = centerY - scaledTotalH / 2;

  // Positions of vertical seams from left
  const xBack = bagX;
  const xG1 = xBack + scaledW;
  const xFront = xG1 + scaledG;
  const xG2 = xFront + scaledW;
  const xGlue = xG2 + scaledG;

  // Handle positions
  const slotY = bagY + scaledT / 2;
  const slotOffsetX = scaledW / 4;
  const slotR = scaledHandleDia / 2;

  // Set drawing styles
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 1;
  ctx.fillStyle = "#ffffff";

  // Draw outer cut rectangle for body
  ctx.strokeRect(bagX, bagY, scaledTotalW, scaledBodyH);

  // Draw bottom flaps (cut rectangles)
  ctx.strokeRect(bagX, bagY + scaledBodyH, scaledW, scaledB);
  ctx.strokeRect(xG1, bagY + scaledBodyH, scaledG, scaledB);
  ctx.strokeRect(xFront, bagY + scaledBodyH, scaledW, scaledB);
  ctx.strokeRect(xG2, bagY + scaledBodyH, scaledG, scaledB);

  // Draw glue flap (cut rectangle)
  ctx.strokeRect(xGlue, bagY, scaledGlueFlap, scaledTotalH);

  // Draw vertical fold/seam lines (dashed)
  ctx.setLineDash([4, 2]);
  ctx.strokeStyle = "#666666";
  ctx.lineWidth = 0.5;

  // Vertical fold lines
  ctx.beginPath();
  ctx.moveTo(xG1, bagY);
  ctx.lineTo(xG1, bagY + scaledTotalH);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(xFront, bagY);
  ctx.lineTo(xFront, bagY + scaledTotalH);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(xG2, bagY);
  ctx.lineTo(xG2, bagY + scaledTotalH);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(xGlue, bagY);
  ctx.lineTo(xGlue, bagY + scaledTotalH);
  ctx.stroke();

  // Top hem fold line
  ctx.beginPath();
  ctx.moveTo(bagX, bagY + scaledT);
  ctx.lineTo(bagX + scaledTotalW, bagY + scaledT);
  ctx.stroke();

  // Bottom flap fold line
  ctx.beginPath();
  ctx.moveTo(bagX, bagY + scaledBodyH);
  ctx.lineTo(bagX + scaledTotalW, bagY + scaledBodyH);
  ctx.stroke();

  // Gusset triangular fold lines on bottom flaps
  // Left gusset
  ctx.beginPath();
  ctx.moveTo(xG1, bagY + scaledTotalH);
  ctx.lineTo(xG1 + scaledG / 2, bagY + scaledBodyH);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(xG1 + scaledG, bagY + scaledTotalH);
  ctx.lineTo(xG1 + scaledG / 2, bagY + scaledBodyH);
  ctx.stroke();

  // Right gusset
  ctx.beginPath();
  ctx.moveTo(xG2, bagY + scaledTotalH);
  ctx.lineTo(xG2 + scaledG / 2, bagY + scaledBodyH);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(xG2 + scaledG, bagY + scaledTotalH);
  ctx.lineTo(xG2 + scaledG / 2, bagY + scaledBodyH);
  ctx.stroke();

  // Reset line dash for solid lines
  ctx.setLineDash([]);
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 1;

  // Draw handle slots (circles)
  ctx.beginPath();
  ctx.arc(xBack + scaledW / 2 - slotOffsetX, slotY, slotR, 0, 2 * Math.PI);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(xBack + scaledW / 2 + slotOffsetX, slotY, slotR, 0, 2 * Math.PI);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(xFront + scaledW / 2 - slotOffsetX, slotY, slotR, 0, 2 * Math.PI);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(xFront + scaledW / 2 + slotOffsetX, slotY, slotR, 0, 2 * Math.PI);
  ctx.stroke();

  // Shopping bag label
  ctx.fillStyle = "#000000";
  ctx.font = "bold 10px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Shopping Bag", centerX, bagY - 8);
}