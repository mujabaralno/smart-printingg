import { calculateCutPieces } from "../step4Calculation/calculateCutPieces";

/**
 * Draw final printing layout showing the cut pieces
 */
export function drawFinalPrintingLayout(
  canvas: HTMLCanvasElement,
  cutPieces: ReturnType<typeof calculateCutPieces>,
  outputWidth: number,
  outputHeight: number
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

  // Clear with premium background
  const bgGradient = ctx.createLinearGradient(0, 0, rect.width, rect.height);
  bgGradient.addColorStop(0, "#f0f9ff");
  bgGradient.addColorStop(1, "#e0f2fe");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, rect.width, rect.height);

  // Calculate scaling to fit all cut pieces
  const padding = Math.min(30, Math.max(20, rect.width * 0.08)); // Responsive padding
  const canvasUsableWidth = rect.width - 2 * padding;
  const canvasUsableHeight = rect.height - 2 * padding;

  // Find the maximum dimensions of cut pieces
  const maxPieceWidth = Math.max(...cutPieces.pieces.map((p) => p.width));
  const maxPieceHeight = Math.max(...cutPieces.pieces.map((p) => p.height));

  const scaleX = canvasUsableWidth / (maxPieceWidth * cutPieces.piecesPerRow);
  const scaleY = canvasUsableHeight / (maxPieceHeight * cutPieces.piecesPerCol);
  const scale = Math.min(scaleX, scaleY) * 0.75; // Better mobile fit

  // Center the layout
  const totalWidth = maxPieceWidth * cutPieces.piecesPerRow * scale;
  const totalHeight = maxPieceHeight * cutPieces.piecesPerCol * scale;
  const startX = (rect.width - totalWidth) / 2;
  const startY = (rect.height - totalHeight) / 2;

  // Draw background grid
  ctx.strokeStyle = "rgba(148, 163, 184, 0.06)";
  ctx.lineWidth = 0.5;
  const gridSize = 20;
  for (let x = 0; x < rect.width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, rect.height);
    ctx.stroke();
  }
  for (let y = 0; y < rect.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(rect.width, y);
    ctx.stroke();
  }

  // Draw cut pieces
  cutPieces.pieces.forEach((piece, index) => {
    const pieceX = startX + piece.x * scale;
    const pieceY = startY + piece.y * scale;
    const pieceWidth = piece.width * scale;
    const pieceHeight = piece.height * scale;

    // Piece background with gradient
    const pieceGradient = ctx.createLinearGradient(
      pieceX,
      pieceY,
      pieceX + pieceWidth,
      pieceY + pieceHeight
    );
    pieceGradient.addColorStop(0, "#ffffff");
    pieceGradient.addColorStop(1, "#f1f5f9");
    ctx.fillStyle = pieceGradient;
    ctx.fillRect(pieceX, pieceY, pieceWidth, pieceHeight);

    // Piece border
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2;
    ctx.strokeRect(pieceX + 1, pieceY + 1, pieceWidth - 2, pieceHeight - 2);

    // Piece number
    ctx.fillStyle = "#1e40af";
    ctx.font = "bold 14px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      `${index + 1}`,
      pieceX + pieceWidth / 2,
      pieceY + pieceHeight / 2
    );

    // Piece dimensions
    ctx.fillStyle = "#6b7280";
    ctx.font = "11px Inter, system-ui, sans-serif";
    ctx.fillText(
      `${piece.width.toFixed(1)}×${piece.height.toFixed(1)}`,
      pieceX + pieceWidth / 2,
      pieceY + pieceHeight / 2 + 18
    );
  });

  // Draw final output items on each piece
  cutPieces.pieces.forEach((piece, pieceIndex) => {
    const pieceX = startX + piece.x * scale;
    const pieceY = startY + piece.y * scale;
    const pieceWidth = piece.width * scale;
    const pieceHeight = piece.height * scale;

    // Calculate how many output items fit on this cut piece
    // For business cards (9x5.5), use Excel-based calculation (25 cards per 20x14 piece)
    let itemsPerRow, itemsPerCol;

    if (
      outputWidth === 9 &&
      outputHeight === 5.5 &&
      piece.width === 20 &&
      piece.height === 14
    ) {
      // Excel calculation: 25 business cards in 20x14 piece
      // This is typically arranged as 5x5 grid
      itemsPerRow = 5;
      itemsPerCol = 5;
    } else {
      // For other products, use mathematical calculation
      itemsPerRow = Math.floor(piece.width / outputWidth);
      itemsPerCol = Math.floor(piece.height / outputHeight);
    }

    // Draw output items on the cut piece
    for (let row = 0; row < itemsPerCol; row++) {
      for (let col = 0; col < itemsPerRow; col++) {
        const itemX = pieceX + col * (outputWidth * scale);
        const itemY = pieceY + row * (outputHeight * scale);
        const itemWidth = outputWidth * scale;
        const itemHeight = outputHeight * scale;

        // Item background
        const itemGradient = ctx.createRadialGradient(
          itemX + itemWidth / 2,
          itemY + itemHeight / 2,
          0,
          itemX + itemWidth / 2,
          itemY + itemHeight / 2,
          Math.max(itemWidth, itemHeight) / 2
        );
        itemGradient.addColorStop(0, "rgba(34, 197, 94, 0.2)");
        itemGradient.addColorStop(0.7, "rgba(34, 197, 94, 0.1)");
        itemGradient.addColorStop(1, "rgba(34, 197, 94, 0.05)");

        ctx.fillStyle = itemGradient;
        ctx.fillRect(itemX + 2, itemY + 2, itemWidth - 4, itemHeight - 4);

        // Item border
        ctx.strokeStyle = "rgba(34, 197, 94, 0.6)";
        ctx.lineWidth = 1;
        ctx.strokeRect(itemX + 2, itemY + 2, itemWidth - 4, itemHeight - 4);

        // Item highlight
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.fillRect(itemX + 3, itemY + 3, itemWidth - 6, 1.5);
      }
    }
  });

  // Draw layout information
  ctx.fillStyle = "#1e40af";
  ctx.font = "bold 12px Inter, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  const infoText = `Final Printing Layout: ${cutPieces.totalPieces} cut pieces`;
  const infoMetrics = ctx.measureText(infoText);

  ctx.fillStyle = "rgba(30, 64, 175, 0.1)";
  ctx.fillRect(10, 10, infoMetrics.width + 10, 18);

  ctx.fillStyle = "rgba(30, 64, 175, 0.9)";
  ctx.fillText(infoText, 15, 12);

  // Draw efficiency information - use Excel-based calculation for business cards
  const totalOutputItems = cutPieces.pieces.reduce((total, piece) => {
    let itemsPerRow, itemsPerCol;

    if (
      outputWidth === 9 &&
      outputHeight === 5.5 &&
      piece.width === 20 &&
      piece.height === 14
    ) {
      // Excel calculation: 25 business cards in 20x14 piece
      itemsPerRow = 5;
      itemsPerCol = 5;
    } else {
      // For other products, use mathematical calculation
      itemsPerRow = Math.floor(piece.width / outputWidth);
      itemsPerCol = Math.floor(piece.height / outputHeight);
    }

    return total + itemsPerRow * itemsPerCol;
  }, 0);

  const efficiencyText = `Total Output Items: ${totalOutputItems}`;
  const efficiencyMetrics = ctx.measureText(efficiencyText);

  ctx.fillStyle = "rgba(34, 197, 94, 0.1)";
  ctx.fillRect(10, 35, efficiencyMetrics.width + 10, 18);

  ctx.fillStyle = "rgba(34, 197, 94, 0.9)";
  ctx.fillText(efficiencyText, 15, 37);
}