import { calculateCutPieces } from "../step4Calculation/calculateCutPieces";

// CUT VIEW: Shows how to slice parent sheet into press sheets
export function drawCutView(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  canvasUsableWidth: number,
  canvasUsableHeight: number,
  parentWidth: number,
  parentHeight: number,
  pressWidth: number,
  pressHeight: number
) {
  // Use calculateCutPieces to get the best orientation and accurate cutting dimensions
  const cut = calculateCutPieces(
    parentWidth,
    parentHeight,
    pressWidth,
    pressHeight
  );
  const piecesPerRow = cut.piecesPerRow;
  const piecesPerCol = cut.piecesPerCol;
  const totalPieces = cut.totalPieces;

  // Calculate scaling to fit parent sheet in canvas
  const scaleX = canvasUsableWidth / parentWidth;
  const scaleY = canvasUsableHeight / parentHeight;
  const scale = Math.min(scaleX, scaleY) * 0.9;

  const scaledParentWidth = parentWidth * scale;
  const scaledParentHeight = parentHeight * scale;
  const scaledPressWidth = cut.pieceWidth * scale;
  const scaledPressHeight = cut.pieceHeight * scale;

  const startX = (canvasWidth - scaledParentWidth) / 2;
  const startY = (canvasHeight - scaledParentHeight) / 2 + 50; // Add offset for title space

  // Draw parent sheet (100×70)
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(startX, startY, scaledParentWidth, scaledParentHeight);

  ctx.strokeStyle = "#1e40af";
  ctx.lineWidth = 3;
  ctx.strokeRect(startX, startY, scaledParentWidth, scaledParentHeight);

  // Draw press sheet cut pieces with accurate dimensions
  ctx.fillStyle = "rgba(59, 130, 246, 0.1)";
  ctx.strokeStyle = "#3b82f6";
  ctx.lineWidth = 2;

  // Dynamic drawing based on calculated pieces
  for (let row = 0; row < piecesPerCol; row++) {
    for (let col = 0; col < piecesPerRow; col++) {
      const x = startX + col * scaledPressWidth;
      const y = startY + row * scaledPressHeight;

      ctx.fillRect(x, y, scaledPressWidth, scaledPressHeight);
      ctx.strokeRect(x, y, scaledPressWidth, scaledPressHeight);

      // Add press sheet dimension labels
      const centerX = x + scaledPressWidth / 2;
      const centerY = y + scaledPressHeight / 2;

      ctx.fillStyle = "#1e40af";
      ctx.font = "bold 10px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        `${cut.pieceWidth.toFixed(1)}×${cut.pieceHeight.toFixed(1)}`,
        centerX,
        centerY - 3
      );
      ctx.font = "9px Inter, system-ui, sans-serif";
      ctx.fillText("cm", centerX, centerY + 8);
    }
  }

  // Draw cut lines using actual cutting lines from calculateCutPieces
  ctx.strokeStyle = "#ef4444";
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);

  // Vertical cut lines
  cut.verticalCuts.forEach((cutX) => {
    const scaledCutX = startX + cutX * scale;
    ctx.beginPath();
    ctx.moveTo(scaledCutX, startY);
    ctx.lineTo(scaledCutX, startY + scaledParentHeight);
    ctx.stroke();
  });

  // Horizontal cut lines
  cut.horizontalCuts.forEach((cutY) => {
    const scaledCutY = startY + cutY * scale;
    ctx.beginPath();
    ctx.moveTo(startX, scaledCutY);
    ctx.lineTo(startX + scaledParentWidth, scaledCutY);
    ctx.stroke();
  });
  ctx.setLineDash([]);

  // Professional layout with proper text positioning
  // Responsive sizing based on canvas width
  const isMobile = canvasWidth < 768;
  const isTablet = canvasWidth >= 768 && canvasWidth < 1024;

  // Title positioned above the sheet with proper spacing (responsive font size)
  ctx.fillStyle = "#111827";
  const mainTitleFontSize = isMobile ? "16px" : isTablet ? "18px" : "20px";
  ctx.font = `bold ${mainTitleFontSize} Inter, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("Cutting Operations", canvasWidth / 2, startY - 80);

  // Subtitle with proper spacing from title (responsive font size)
  ctx.fillStyle = "#6b7280";
  const subtitleFontSize = isMobile ? "11px" : isTablet ? "12px" : "14px";
  ctx.font = `${subtitleFontSize} Inter, system-ui, sans-serif`;
  ctx.fillText(
    `Parent ${parentWidth}×${parentHeight} → Press ${pressWidth}×${pressHeight}`,
    canvasWidth / 2,
    startY - 55
  );

  // Add cutting efficiency information
  const efficiency = (
    ((totalPieces * pressWidth * pressHeight) / (parentWidth * parentHeight)) *
    100
  ).toFixed(1);
  const efficiencyText = `Cutting Efficiency: ${efficiency}%`;
  ctx.fillStyle = "#059669";
  ctx.font = `${subtitleFontSize} Inter, system-ui, sans-serif`;
  ctx.fillText(efficiencyText, canvasWidth / 2, startY - 35);

  // Information panels positioned outside the parent sheet area

  const panelWidth = isMobile
    ? Math.min(140, canvasWidth * 0.35)
    : isTablet
    ? Math.min(160, canvasWidth * 0.25)
    : 180;
  const panelHeight = isMobile ? 100 : isTablet ? 110 : 120;
  const panelSpacing = isMobile ? 10 : isTablet ? 15 : 20;

  // Check if panels fit on screen, if not, position them below the sheet
  const leftPanelFits = startX - panelWidth - panelSpacing > 0;
  const rightPanelFits =
    startX + scaledParentWidth + panelSpacing + panelWidth < canvasWidth;

  // Left panel - Specifications (responsive positioning)
  const leftPanelX = leftPanelFits
    ? startX - panelWidth - panelSpacing
    : startX + scaledParentWidth / 2 - panelWidth / 2;
  const leftPanelY = leftPanelFits
    ? startY + 20
    : startY + scaledParentHeight + 30;

  // Panel background with transparency
  ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
  ctx.fillRect(leftPanelX, leftPanelY, panelWidth, panelHeight);

  // Panel border
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1;
  ctx.strokeRect(leftPanelX, leftPanelY, panelWidth, panelHeight);

  // Panel header
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(leftPanelX, leftPanelY, panelWidth, 30);
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1;
  ctx.strokeRect(leftPanelX, leftPanelY, panelWidth, 30);

  // Panel title (responsive font size)
  ctx.fillStyle = "#111827";
  const titleFontSize = isMobile ? "10px" : isTablet ? "11px" : "12px";
  ctx.font = `bold ${titleFontSize} Inter, system-ui, sans-serif`;
  ctx.textAlign = "left";
  ctx.fillText("Specifications", leftPanelX + 8, leftPanelY + 20);

  // Specifications list (responsive font size)
  ctx.fillStyle = "#374151";
  const textFontSize = isMobile ? "8px" : isTablet ? "9px" : "10px";
  ctx.font = `${textFontSize} Inter, system-ui, sans-serif`;
  const specs = [
    `Parent: ${parentWidth}×${parentHeight} cm`,
    `Press: ${pressWidth}×${pressHeight} cm`,
    `Cut Pieces: ${totalPieces} pieces`,
    `Layout: ${piecesPerRow}×${piecesPerCol} grid`,
    `Efficiency: ${(
      ((totalPieces * pressWidth * pressHeight) /
        (parentWidth * parentHeight)) *
      100
    ).toFixed(1)}%`,
  ];

  specs.forEach((spec, index) => {
    ctx.fillText(spec, leftPanelX + 8, leftPanelY + 45 + index * 12);
  });

  // Right panel - Yield Analysis (responsive positioning)
  const rightPanelX = rightPanelFits
    ? startX + scaledParentWidth + panelSpacing
    : leftPanelFits
    ? startX + scaledParentWidth / 2 - panelWidth / 2
    : startX + scaledParentWidth / 2 - panelWidth / 2;
  const rightPanelY = rightPanelFits
    ? startY + 20
    : leftPanelFits
    ? startY + scaledParentHeight + 30
    : startY + scaledParentHeight + 150;

  // Panel background with transparency
  ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
  ctx.fillRect(rightPanelX, rightPanelY, panelWidth, panelHeight);

  // Panel border
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1;
  ctx.strokeRect(rightPanelX, rightPanelY, panelWidth, panelHeight);

  // Panel header with yield theme
  ctx.fillStyle = "#eff6ff";
  ctx.fillRect(rightPanelX, rightPanelY, panelWidth, 30);
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1;
  ctx.strokeRect(rightPanelX, rightPanelY, panelWidth, 30);

  // Panel title (responsive font size)
  ctx.fillStyle = "#1e40af";
  ctx.font = `bold ${titleFontSize} Inter, system-ui, sans-serif`;
  ctx.textAlign = "left";
  ctx.fillText("Yield Analysis", rightPanelX + 8, rightPanelY + 20);

  // Yield details (responsive font size)
  ctx.fillStyle = "#1e3a8a";
  ctx.font = `${textFontSize} Inter, system-ui, sans-serif`;
  const yieldData = [
    `Total Pieces: ${totalPieces}`,
    `Per Row: ${piecesPerRow}`,
    `Per Column: ${piecesPerCol}`,
    `Waste: ${(
      100 -
      ((totalPieces * pressWidth * pressHeight) /
        (parentWidth * parentHeight)) *
        100
    ).toFixed(1)}%`,
  ];

  yieldData.forEach((data, index) => {
    ctx.fillText(data, rightPanelX + 8, rightPanelY + 45 + index * 12);
  });
}