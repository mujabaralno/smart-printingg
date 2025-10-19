/* eslint-disable @typescript-eslint/no-explicit-any */

import { drawProfessionalLabels } from "./drawProfessionalLabels";

/**
 * Draw cutting operations visualization - shows only cut pieces
 */
export function drawCuttingOperations(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  scaledSheetWidth: number,
  scaledSheetHeight: number,
  cutPieces: number,
  sheetWidth: number,
  sheetHeight: number,
  selectedResult: any
) {
  // Professional sheet background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(startX, startY, scaledSheetWidth, scaledSheetHeight);

  // Professional border
  ctx.strokeStyle = "#374151";
  ctx.lineWidth = 2;
  ctx.strokeRect(startX, startY, scaledSheetWidth, scaledSheetHeight);

  // Calculate cut piece dimensions
  const cutPieceWidth = scaledSheetWidth / (cutPieces === 4 ? 2 : cutPieces);
  const cutPieceHeight = scaledSheetHeight / (cutPieces === 4 ? 2 : 1);

  // Draw cut pieces with professional styling
  for (let cutPiece = 0; cutPiece < cutPieces; cutPiece++) {
    let pieceX = startX;
    let pieceY = startY;

    if (cutPieces === 4) {
      // 2x2 grid
      const row = Math.floor(cutPiece / 2);
      const col = cutPiece % 2;
      pieceX = startX + col * cutPieceWidth;
      pieceY = startY + row * cutPieceHeight;
    } else if (cutPieces === 3) {
      // 1x3 grid
      pieceX = startX + cutPiece * cutPieceWidth;
      pieceY = startY;
    }

    // Draw cut piece background
    ctx.fillStyle = "#f3f4f6";
    ctx.fillRect(pieceX, pieceY, cutPieceWidth, cutPieceHeight);

    // Draw cut piece border
    ctx.strokeStyle = "#6b7280";
    ctx.lineWidth = 1;
    ctx.strokeRect(pieceX, pieceY, cutPieceWidth, cutPieceHeight);

    // Add cut piece label
    ctx.fillStyle = "#374151";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      `Cut Piece ${cutPiece + 1}`,
      pieceX + cutPieceWidth / 2,
      pieceY + cutPieceHeight / 2 - 5
    );

    // Add cards per piece info
    const cardsPerPiece = selectedResult.upsPerSheet / cutPieces;
    ctx.font = "12px Arial";
    ctx.fillText(
      `${cardsPerPiece} cards`,
      pieceX + cutPieceWidth / 2,
      pieceY + cutPieceHeight / 2 + 10
    );
  }

  // Draw cut lines
  ctx.strokeStyle = "#dc2626";
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 8]);

  if (cutPieces === 4) {
    // 2x2 grid for 4 pieces
    const midX = startX + scaledSheetWidth / 2;
    const midY = startY + scaledSheetHeight / 2;

    // Vertical line
    ctx.beginPath();
    ctx.moveTo(midX, startY);
    ctx.lineTo(midX, startY + scaledSheetHeight);
    ctx.stroke();

    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(startX, midY);
    ctx.lineTo(startX + scaledSheetWidth, midY);
    ctx.stroke();
  } else if (cutPieces === 3) {
    // 1x3 grid for 3 pieces
    for (let i = 1; i < 3; i++) {
      const x = startX + cutPieceWidth * i;
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, startY + scaledSheetHeight);
      ctx.stroke();
    }
  }
  ctx.setLineDash([]);

  // Professional labels
  drawProfessionalLabels(
    ctx,
    startX,
    startY,
    scaledSheetWidth,
    scaledSheetHeight,
    sheetWidth,
    sheetHeight,
    selectedResult,
    cutPieces,
    selectedResult.upsPerSheet
  );
}