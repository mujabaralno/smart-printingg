import { calculateCutPieces } from "../step4Calculation/calculateCutPieces";

/**
 * Draw cutting layout visualization showing how the large input sheet is cut
 */
export function drawCuttingLayout(
  canvas: HTMLCanvasElement,
  inputWidth: number,
  inputHeight: number,
  machineMaxWidth: number,
  machineMaxHeight: number
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
  bgGradient.addColorStop(0, "#f8fafc");
  bgGradient.addColorStop(1, "#f1f5f9");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, rect.width, rect.height);

  // Calculate scaling to fit the input sheet
  const padding = Math.min(30, Math.max(20, rect.width * 0.08)); // Responsive padding
  const canvasUsableWidth = rect.width - 2 * padding;
  const canvasUsableHeight = rect.height - 2 * padding;

  const scaleX = canvasUsableWidth / inputWidth;
  const scaleY = canvasUsableHeight / inputHeight;
  const scale = Math.min(scaleX, scaleY) * 0.8; // Better mobile fit

  const scaledSheetWidth = inputWidth * scale;
  const scaledSheetHeight = inputHeight * scale;

  // Center the sheet
  const startX = (rect.width - scaledSheetWidth) / 2;
  const startY = (rect.height - scaledSheetHeight) / 2;

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

  // Draw input sheet with shadow
  ctx.shadowColor = "rgba(0, 0, 0, 0.08)";
  ctx.shadowBlur = 25;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 15;

  // Input sheet background
  const sheetGradient = ctx.createLinearGradient(
    startX,
    startY,
    startX,
    startY + scaledSheetHeight
  );
  sheetGradient.addColorStop(0, "#ffffff");
  sheetGradient.addColorStop(1, "#f8fafc");
  ctx.fillStyle = sheetGradient;
  ctx.fillRect(startX, startY, scaledSheetWidth, scaledSheetHeight);

  // Reset shadow
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Input sheet border
  ctx.strokeStyle = "#1e40af";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeRect(
    startX + 2,
    startY + 2,
    scaledSheetWidth - 4,
    scaledSheetHeight - 4
  );

  // Calculate cutting lines
  console.log("🎨 drawCuttingLayout called with:", {
    inputWidth,
    inputHeight,
    machineMaxWidth,
    machineMaxHeight,
  });

  // Use the exact same calculation logic as the main calculation
  // This ensures visualization matches the calculation results exactly
  let visMaxW = machineMaxWidth;
  let visMaxH = machineMaxHeight;

  // For business cards with 10x8 dimensions, optimize for >99% efficiency
  // Check both orientations and pick the one with better efficiency
  const countCurrent =
    Math.floor(inputWidth / machineMaxWidth) *
    Math.floor(inputHeight / machineMaxHeight);
  const countRotated =
    Math.floor(inputWidth / machineMaxHeight) *
    Math.floor(inputHeight / machineMaxWidth);

  // Calculate efficiency for both orientations
  const efficiencyCurrent =
    (countCurrent * machineMaxWidth * machineMaxHeight) /
    (inputWidth * inputHeight);
  const efficiencyRotated =
    (countRotated * machineMaxWidth * machineMaxHeight) /
    (inputWidth * inputHeight);

  console.log("🎯 Cutting efficiency comparison:", {
    current: {
      count: countCurrent,
      efficiency: (efficiencyCurrent * 100).toFixed(1) + "%",
    },
    rotated: {
      count: countRotated,
      efficiency: (efficiencyRotated * 100).toFixed(1) + "%",
    },
  });

  // Choose orientation with better efficiency (>99% target)
  if (efficiencyRotated > efficiencyCurrent && efficiencyRotated > 0.99) {
    visMaxW = machineMaxHeight;
    visMaxH = machineMaxWidth;
    console.log(
      "🎯 Visualization selecting rotated orientation for >99% efficiency"
    );
  }

  const cutPieces = calculateCutPieces(
    inputWidth,
    inputHeight,
    visMaxW,
    visMaxH
  );

  console.log("✂️ cutPieces result:", {
    totalPieces: cutPieces.totalPieces,
    piecesPerRow: cutPieces.piecesPerRow,
    piecesPerCol: cutPieces.piecesPerCol,
    pieceWidth: cutPieces.pieceWidth,
    pieceHeight: cutPieces.pieceHeight,
  });

  // Draw cutting lines
  ctx.strokeStyle = "#dc2626";
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 4]);

  // Vertical cutting lines
  cutPieces.verticalCuts.forEach((cutX) => {
    const scaledCutX = startX + cutX * scale;
    ctx.beginPath();
    ctx.moveTo(scaledCutX, startY);
    ctx.lineTo(scaledCutX, startY + scaledSheetHeight);
    ctx.stroke();
  });

  // Horizontal cutting lines
  cutPieces.horizontalCuts.forEach((cutY) => {
    const scaledCutY = startY + cutY * scale;
    ctx.beginPath();
    ctx.moveTo(startX, scaledCutY);
    ctx.lineTo(startX + scaledSheetWidth, scaledCutY);
    ctx.stroke();
  });

  // Reset line dash
  ctx.setLineDash([]);

  // Draw cut piece labels
  ctx.fillStyle = "#dc2626";
  ctx.font = "bold 11px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  cutPieces.pieces.forEach((piece, index) => {
    const pieceX = startX + piece.x * scale;
    const pieceY = startY + piece.y * scale;
    const pieceWidth = piece.width * scale;
    const pieceHeight = piece.height * scale;

    // Piece number
    ctx.fillStyle = "rgba(220, 38, 38, 0.9)";
    ctx.fillText(
      `${index + 1}`,
      pieceX + pieceWidth / 2,
      pieceY + pieceHeight / 2
    );

    // Piece dimensions - show press dimensions for special case
    ctx.fillStyle = "rgba(220, 38, 38, 0.7)";
    ctx.font = "10px Inter, system-ui, sans-serif";

    // Show actual piece dimensions from calculation
    ctx.fillText(
      `${piece.width.toFixed(1)}×${piece.height.toFixed(1)}`,
      pieceX + pieceWidth / 2,
      pieceY + pieceHeight / 2 + 15
    );
  });

  // Draw dimension labels
  ctx.fillStyle = "#374151";
  ctx.font = "bold 12px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Width dimension
  const widthText = `${inputWidth.toFixed(1)}cm`;
  const widthY = startY + scaledSheetHeight + 25;
  ctx.strokeStyle = "#6b7280";
  ctx.lineWidth = 2;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(startX, widthY);
  ctx.lineTo(startX + scaledSheetWidth, widthY);
  ctx.stroke();

  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
  const widthMetrics = ctx.measureText(widthText);
  ctx.fillRect(
    startX + scaledSheetWidth / 2 - widthMetrics.width / 2 - 8,
    widthY + 8,
    widthMetrics.width + 16,
    20
  );
  ctx.strokeStyle = "rgba(148, 163, 184, 0.3)";
  ctx.lineWidth = 1;
  ctx.strokeRect(
    startX + scaledSheetWidth / 2 - widthMetrics.width / 2 - 8,
    widthY + 8,
    widthMetrics.width + 16,
    20
  );

  ctx.fillStyle = "#374151";
  ctx.fillText(widthText, startX + scaledSheetWidth / 2, widthY + 18);

  // Height dimension
  ctx.save();
  ctx.translate(startX - 25, startY + scaledSheetHeight / 2);
  ctx.rotate(-Math.PI / 2);

  const heightText = `${inputHeight.toFixed(1)}cm`;
  ctx.strokeStyle = "#6b7280";
  ctx.lineWidth = 2;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(-scaledSheetHeight / 2, 0);
  ctx.lineTo(scaledSheetHeight / 2, 0);
  ctx.stroke();

  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
  const heightMetrics = ctx.measureText(heightText);
  ctx.fillRect(-heightMetrics.width / 2 - 8, -18, heightMetrics.width + 16, 20);

  ctx.strokeStyle = "rgba(148, 163, 184, 0.3)";
  ctx.lineWidth = 1;
  ctx.strokeRect(
    -heightMetrics.width / 2 - 8,
    -18,
    heightMetrics.width + 16,
    20
  );

  ctx.fillStyle = "#374151";
  ctx.fillText(heightText, 0, -8);
  ctx.restore();

  // Cutting information overlay
  ctx.fillStyle = "rgba(220, 38, 38, 0.9)";
  ctx.font = "bold 12px Inter, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  const infoText = `Cutting Layout: ${cutPieces.pieces.length} pieces`;
  const infoMetrics = ctx.measureText(infoText);

  ctx.fillStyle = "rgba(220, 38, 38, 0.1)";
  ctx.fillRect(10, 10, infoMetrics.width + 10, 18);

  ctx.fillStyle = "rgba(220, 38, 38, 0.9)";
  ctx.fillText(infoText, 15, 12);
}
