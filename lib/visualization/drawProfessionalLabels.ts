/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Draw professional labels
 */
export function drawProfessionalLabels(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  scaledSheetWidth: number,
  scaledSheetHeight: number,
  sheetWidth: number,
  sheetHeight: number,
  selectedResult: any,
  cutPieces: number,
  totalCardsPerSheet: number
) {
  // Sheet dimensions
  ctx.fillStyle = "#374151";
  ctx.font = "bold 16px Arial";
  ctx.textAlign = "center";
  ctx.fillText(
    `${sheetWidth}×${sheetHeight} cm`,
    startX + scaledSheetWidth / 2,
    startY - 20
  );

  // Layout info
  ctx.font = "14px Arial";
  ctx.fillText(
    `${cutPieces} cut pieces`,
    startX + scaledSheetWidth / 2,
    startY + scaledSheetHeight + 25
  );
  ctx.fillText(
    `${totalCardsPerSheet} cards per piece`,
    startX + scaledSheetWidth / 2,
    startY + scaledSheetHeight + 45
  );
  ctx.fillText(
    `Total: ${selectedResult.upsPerSheet} cards per sheet`,
    startX + scaledSheetWidth / 2,
    startY + scaledSheetHeight + 65
  );

  // Option label
  ctx.fillStyle = "#2563eb";
  ctx.font = "bold 18px Arial";
  ctx.fillText(
    selectedResult.option,
    startX + scaledSheetWidth / 2,
    startY + scaledSheetHeight + 90
  );
}
