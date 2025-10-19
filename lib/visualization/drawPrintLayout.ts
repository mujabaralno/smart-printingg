/* eslint-disable @typescript-eslint/no-explicit-any */
import { VisualizationType } from "@/types";
import { drawProfessionalLabels } from "./drawProfessionalLabels";

/**
 * Draw print layout visualization - shows individual cards
 */
export function drawPrintLayout(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  scaledSheetWidth: number,
  scaledSheetHeight: number,
  cutPieces: number,
  productWidth: number,
  productHeight: number,
  scale: number,
  selectedResult: any,
  visualizationType: VisualizationType,
  sheetWidth: number,
  sheetHeight: number
) {
  // Professional sheet background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(startX, startY, scaledSheetWidth, scaledSheetHeight);

  // Professional border
  ctx.strokeStyle = "#374151";
  ctx.lineWidth = 2;
  ctx.strokeRect(startX, startY, scaledSheetWidth, scaledSheetHeight);

  // Draw gripper area (always present in print layout)
  const gripperWidth = 0.9 * scale;
  ctx.fillStyle = "rgba(251, 191, 36, 0.3)";
  ctx.fillRect(startX, startY, scaledSheetWidth, gripperWidth);

  ctx.fillStyle = "#f59e0b";
  ctx.font = "bold 12px Arial";
  ctx.textAlign = "center";
  ctx.fillText(
    "Gripper Area",
    startX + scaledSheetWidth / 2,
    startY + gripperWidth / 2 + 4
  );

  // Draw printable area (area below gripper)
  const printableAreaY = startY + gripperWidth;
  const printableAreaHeight = scaledSheetHeight - gripperWidth;

  ctx.fillStyle = "rgba(59, 130, 246, 0.1)";
  ctx.fillRect(startX, printableAreaY, scaledSheetWidth, printableAreaHeight);

  ctx.strokeStyle = "#3b82f6";
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  ctx.strokeRect(startX, printableAreaY, scaledSheetWidth, printableAreaHeight);
  ctx.setLineDash([]);

  ctx.fillStyle = "#3b82f6";
  ctx.font = "bold 12px Arial";
  ctx.textAlign = "center";
  ctx.fillText(
    "Printable Area",
    startX + scaledSheetWidth / 2,
    printableAreaY + printableAreaHeight / 2
  );

  // Calculate card layout
  const cutPieceWidth = scaledSheetWidth / (cutPieces === 4 ? 2 : cutPieces);
  let cutPieceHeight = scaledSheetHeight / (cutPieces === 4 ? 2 : 1);

  // Adjust cut piece height for gripper area (always present in print layout)
  cutPieceHeight =
    (scaledSheetHeight - gripperWidth) / (cutPieces === 4 ? 2 : 1);

  // Handle card dimensions - swap if rotated orientation
  let cardRealWidth = productWidth;
  let cardRealHeight = productHeight;
  if (
    selectedResult.gridLayout &&
    selectedResult.gridLayout.orientation === "rotated"
  ) {
    cardRealWidth = productHeight; // Swap dimensions for rotated
    cardRealHeight = productWidth;
    console.log("🔄 Rotating card dimensions:", {
      original: `${productWidth}×${productHeight}`,
      rotated: `${cardRealWidth}×${cardRealHeight}`,
    });
  }

  const scaledCardWidth = cardRealWidth * scale;
  const scaledCardHeight = cardRealHeight * scale;

  // Use same gap rules as offset layout for consistency
  // Business cards (8.5-10cm width, 5-6cm height): 0.2cm gap
  // Cups: 0.2cm gap
  // All others: 0.5cm gap
  const isBusinessCard =
    productWidth >= 8.5 &&
    productWidth <= 10 &&
    productHeight >= 5 &&
    productHeight <= 6;
  const isCup =
    productWidth >= 20 &&
    productWidth <= 25 &&
    productHeight >= 8 &&
    productHeight <= 10; // Typical cup dimensions
  const gapWidth = isCup || isBusinessCard ? 0.2 : 0.5;
  const scaledGap = gapWidth * scale;

  // Use the actual calculated cards per cut piece from the digital calculation
  // upsPerSheet is total cards per sheet, but we need cards per cut piece for visualization
  const cardsPerCutPiece = selectedResult.upsPerSheet / cutPieces;
  const totalCardsPerSheet = cardsPerCutPiece; // Show only one cut piece worth of cards

  // Use grid layout from digital calculation if available, otherwise calculate
  let cardsPerRow, cardsPerCol;
  if (selectedResult.gridLayout) {
    // Use the optimized grid from digital calculation
    cardsPerRow = selectedResult.gridLayout.itemsPerRow;
    cardsPerCol = selectedResult.gridLayout.itemsPerCol;
    console.log("✅ Using optimized digital grid layout:", {
      itemsPerRow: cardsPerRow,
      itemsPerCol: cardsPerCol,
      orientation: selectedResult.gridLayout.orientation,
      cardDimensions: `${cardRealWidth}×${cardRealHeight} cm`,
      gap: `${gapWidth} cm`,
      source: "excelDigitalCalculation",
    });
  } else {
    // Fallback: Calculate optimal grid layout for the actual number of cards
    cardsPerRow = Math.ceil(Math.sqrt(totalCardsPerSheet));
    cardsPerCol = Math.ceil(totalCardsPerSheet / cardsPerRow);
    console.log("⚠️ Using fallback grid calculation:", {
      cardsPerRow,
      cardsPerCol,
    });
  }

  // Calculate total grid dimensions including gaps
  const totalGridWidth =
    cardsPerRow * scaledCardWidth + (cardsPerRow - 1) * scaledGap;
  const totalGridHeight =
    cardsPerCol * scaledCardHeight + (cardsPerCol - 1) * scaledGap;

  // Calculate printable area (below gripper)
  const printableStartY = startY + gripperWidth;
  const printableHeight = scaledSheetHeight - gripperWidth;

  // Center the grid within the printable area
  const gridOffsetX = (scaledSheetWidth - totalGridWidth) / 2;
  const gridOffsetY = (printableHeight - totalGridHeight) / 2;

  // Draw all cards with proper spacing
  let cardIndex = 0;
  for (let row = 0; row < cardsPerCol; row++) {
    for (let col = 0; col < cardsPerRow; col++) {
      // Stop if we've drawn all cards for the sheet
      if (cardIndex >= totalCardsPerSheet) break;

      // Position with gaps between cards
      const cardX = startX + gridOffsetX + col * (scaledCardWidth + scaledGap);
      const cardY =
        printableStartY + gridOffsetY + row * (scaledCardHeight + scaledGap);

      // Draw card with professional styling (light blue like reference image)
      ctx.fillStyle = "#93c5fd"; // Light blue fill
      ctx.fillRect(cardX, cardY, scaledCardWidth, scaledCardHeight);

      ctx.strokeStyle = "#94a3b8"; // Gray border
      ctx.lineWidth = 1;
      ctx.strokeRect(cardX, cardY, scaledCardWidth, scaledCardHeight);

      // Add card number if space allows
      if (scaledCardWidth > 25 && scaledCardHeight > 20) {
        ctx.fillStyle = "#64748b";
        ctx.font = "bold 10px Arial";
        ctx.textAlign = "center";
        const cardNum = cardIndex + 1;
        ctx.fillText(
          cardNum.toString(),
          cardX + scaledCardWidth / 2,
          cardY + scaledCardHeight / 2 + 3
        );
      }

      cardIndex++;
    }
    // Stop if we've drawn all cards for the sheet
    if (cardIndex >= totalCardsPerSheet) break;
  }

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
    totalCardsPerSheet
  );
}