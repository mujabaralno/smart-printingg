/* eslint-disable @typescript-eslint/no-explicit-any */
import { VisualizationType } from "@/types";
import { drawCuttingOperations } from "./drawCuttingOperations";
import { drawPrintLayout } from "./drawPrintLayout";

/**
 * Draw professional digital layout visualization
 */
export function drawDigitalLayout(
  canvas: HTMLCanvasElement,
  digitalResults: any[],
  selectedOption: string,
  productWidth: number,
  productHeight: number,
  visualizationType: VisualizationType = "cut"
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Set high DPI for crisp rendering
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  canvas.style.width = rect.width + "px";
  canvas.style.height = rect.height + "px";

  // Professional background (matching offset visualization)
  const bgGradient = ctx.createLinearGradient(0, 0, rect.width, rect.height);
  bgGradient.addColorStop(0, "#f8fafc");
  bgGradient.addColorStop(1, "#f1f5f9");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, rect.width, rect.height);

  // Enable ultra-high-quality rendering (matching offset)
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  if (digitalResults.length === 0) return;

  // Find the selected option or use the first one
  const selectedResult =
    digitalResults.find((r) => r.option === selectedOption) ||
    digitalResults[0];

  // Parse sheet dimensions from option label (e.g., "48×33 cm")
  const optionMatch = selectedResult.option.match(/(\d+)×(\d+)/);
  if (!optionMatch) return;

  const sheetWidth = parseInt(optionMatch[1]);
  const sheetHeight = parseInt(optionMatch[2]);
  const cutPieces = selectedResult.cutPerParent;

  // Calculate scale to match offset visualization exactly
  const padding = Math.min(40, Math.max(30, rect.width * 0.08));
  const canvasUsableWidth = rect.width - 2 * padding;
  const canvasUsableHeight = rect.height - 2 * padding;

  const scaleX = canvasUsableWidth / sheetWidth;
  const scaleY = canvasUsableHeight / sheetHeight;
  const scale = Math.min(scaleX, scaleY) * 0.9;

  const scaledSheetWidth = sheetWidth * scale;
  const scaledSheetHeight = sheetHeight * scale;

  const startX = (rect.width - scaledSheetWidth) / 2;
  const startY = (rect.height - scaledSheetHeight) / 2;

  if (visualizationType === "cut") {
    // CUTTING OPERATIONS: Show only cut pieces, no individual cards
    drawCuttingOperations(
      ctx,
      startX,
      startY,
      scaledSheetWidth,
      scaledSheetHeight,
      cutPieces,
      sheetWidth,
      sheetHeight,
      selectedResult
    );
  } else {
    // PRINT LAYOUT & GRIPPER: Show full card layout
    drawPrintLayout(
      ctx,
      startX,
      startY,
      scaledSheetWidth,
      scaledSheetHeight,
      cutPieces,
      productWidth,
      productHeight,
      scale,
      selectedResult,
      visualizationType,
      sheetWidth,
      sheetHeight
    );
  }
}