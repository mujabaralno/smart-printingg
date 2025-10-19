/* eslint-disable @typescript-eslint/no-explicit-any */

import { getProductConfig, getShoppingBagPreset } from "@/constants/product-config";
import { getEffectiveProductSize } from "../step4Calculation/getEffectiveProductSize";
import { drawCircularProduct } from "./drawCircularProduct";
import { drawProductShape } from "./drawProductShape";

// PRINT VIEW: Shows how many products fit on one press sheet
export function drawPrintView(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  canvasUsableWidth: number,
  canvasUsableHeight: number,
  pressWidth: number,
  pressHeight: number,
  layout: any,
  settings: any,
  productData: any,
  formData?: any,
  productIndex?: number
) {
  // Get product information first
  const printCurrentProduct = formData?.products?.[productIndex || 0];
  const productName = printCurrentProduct?.productName || "Business Card";

  // Use exact layout calculation results
  const actualItemsPerRow = layout?.itemsPerRow || 0;
  const actualItemsPerCol = layout?.itemsPerCol || 0;
  const actualItemsPerSheet = layout?.itemsPerSheet || 0;
  const layoutOrientation = layout?.orientation || "normal";

  console.log("🎨 Print View Layout RECEIVED:", {
    pressDimensions: `${pressWidth}×${pressHeight}`,
    layoutItemsPerRow: layout?.itemsPerRow,
    layoutItemsPerCol: layout?.itemsPerCol,
    actualItemsPerRow,
    actualItemsPerCol,
    actualItemsPerSheet,
    orientation: layoutOrientation,
    productName: productName,
    fullLayout: layout,
  });

  // Calculate printable area (after margins and gripper)
  const gripperWidth = settings.gripperWidth || 0.9;
  const edgeMargin = 0.5;

  // Determine gripper position based on paper orientation
  const isWidthLonger = pressWidth >= pressHeight;
  const gripperPosition = isWidthLonger ? "top" : "left";

  let printableWidth, printableHeight, printableX, printableY;

  if (isWidthLonger) {
    // Gripper along the width (traditional top position)
    printableWidth = pressWidth - 2 * edgeMargin;
    printableHeight = pressHeight - gripperWidth - edgeMargin;
  } else {
    // Gripper along the height (side position)
    printableWidth = pressWidth - gripperWidth - edgeMargin;
    printableHeight = pressHeight - 2 * edgeMargin;
  }

  // Calculate scaling
  const scaleX = canvasUsableWidth / pressWidth;
  const scaleY = canvasUsableHeight / pressHeight;
  const scale = Math.min(scaleX, scaleY) * 0.9;

  const scaledPressWidth = pressWidth * scale;
  const scaledPressHeight = pressHeight * scale;
  const scaledGripperWidth = gripperWidth * scale;
  const scaledEdgeMargin = edgeMargin * scale;

  const startX = (canvasWidth - scaledPressWidth) / 2;
  const startY = (canvasHeight - scaledPressHeight) / 2 + 50; // Add offset for title space

  // Draw press sheet with better visibility
  ctx.fillStyle = "rgba(255, 255, 255, 0.98)";
  ctx.fillRect(startX, startY, scaledPressWidth, scaledPressHeight);

  // Draw press sheet border (thicker to emphasize it's the main container)
  ctx.strokeStyle = "#1f2937";
  ctx.lineWidth = 4;
  ctx.strokeRect(startX, startY, scaledPressWidth, scaledPressHeight);

  // Add professional press sheet dimensions label with background (PRINT VIEW UPDATED)
  const dimensionText = `${pressWidth} × ${pressHeight} cm`;
  ctx.font = "bold 14px Inter, -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const dimensionMetrics = ctx.measureText(dimensionText);
  const labelX = startX + scaledPressWidth / 2;
  const labelY = startY - 25;

  // Draw professional background for dimension label
  ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
  ctx.fillRect(
    labelX - dimensionMetrics.width / 2 - 12,
    labelY - 12,
    dimensionMetrics.width + 24,
    24
  );

  // Add subtle border
  ctx.strokeStyle = "rgba(71, 85, 105, 0.3)";
  ctx.lineWidth = 1;
  ctx.strokeRect(
    labelX - dimensionMetrics.width / 2 - 12,
    labelY - 12,
    dimensionMetrics.width + 24,
    24
  );

  // Draw white text
  ctx.fillStyle = "#ffffff";
  ctx.fillText(dimensionText, labelX, labelY);

  // Draw gripper area based on position
  ctx.fillStyle = "rgba(239, 68, 68, 0.1)";
  ctx.strokeStyle = "#ef4444";
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);

  if (isWidthLonger) {
    // Gripper at top (traditional position)
    ctx.fillRect(startX, startY, scaledPressWidth, scaledGripperWidth);
    ctx.strokeRect(startX, startY, scaledPressWidth, scaledGripperWidth);
    printableX = startX + scaledEdgeMargin;
    printableY = startY + scaledGripperWidth + scaledEdgeMargin;
  } else {
    // Gripper at left side
    ctx.fillRect(startX, startY, scaledGripperWidth, scaledPressHeight);
    ctx.strokeRect(startX, startY, scaledGripperWidth, scaledPressHeight);
    printableX = startX + scaledGripperWidth + scaledEdgeMargin;
    printableY = startY + scaledEdgeMargin;
  }

  ctx.setLineDash([]);

  // Draw printable area (dashed border) - coordinates already set above based on gripper position
  const printableW = printableWidth * scale;
  const printableH = printableHeight * scale;

  ctx.strokeStyle = "#10b981";
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.strokeRect(printableX, printableY, printableW, printableH);
  ctx.setLineDash([]);

  // Draw products in printable area using actual Step 3 dimensions
  const productConfig = getProductConfig(productName);

  // For shopping bags, use the total dieline dimensions instead of individual panel dimensions
  let productWidth, productHeight;
  if (productName === "Shopping Bag" && printCurrentProduct?.bagPreset) {
    const bagPreset = getShoppingBagPreset(printCurrentProduct.bagPreset);
    if (bagPreset) {
      const W = bagPreset.width; // Individual panel width
      const H = bagPreset.height; // Individual panel height
      const G = bagPreset.gusset; // Gusset width
      const T = Math.max(3, W * 0.12); // Top hem (proportional)
      const B = Math.max(6, W * 0.25); // Bottom flaps (proportional)
      const glueFlap = 2; // Fixed glue flap width

      // Calculate total dieline dimensions (same as in layout calculation)
      productWidth = W + G + W + G + glueFlap; // Back + Gusset + Front + Gusset + Glue
      productHeight = T + H + B; // Top hem + Body height + Bottom flaps

      console.log("🛍️ Visualization using shopping bag dieline dimensions:", {
        bagPreset: printCurrentProduct.bagPreset,
        individualPanel: { W, H, G },
        totalDieline: { width: productWidth, height: productHeight },
      });
    } else {
      productWidth =
        printCurrentProduct?.flatSize?.width ||
        productConfig?.defaultSizes?.width ||
        9;
      productHeight =
        printCurrentProduct?.flatSize?.height ||
        productConfig?.defaultSizes?.height ||
        5.5;
    }
  } else {
    // Use unified helper for consistent dimensions across all views
    const effectiveSize = getEffectiveProductSize(
      printCurrentProduct,
      productConfig
    );
    productWidth = effectiveSize.width;
    productHeight = effectiveSize.height;

    if (productName === "Cups") {
      console.log("🍵 Print view using unified cup dimensions:", {
        originalHeight: printCurrentProduct?.flatSize?.height,
        effectiveHeight: productHeight,
        adjustment:
          effectiveSize.height - (printCurrentProduct?.flatSize?.height || 0),
        source: "unified getEffectiveProductSize helper",
      });
    }
  }
  // Fixed default values as requested by client
  const bleedWidth = productConfig?.defaultBleed || 0.3;
  // Use optimized gap for business cards
  const baseGapWidth = productConfig?.defaultGap || 0.5;
  const gapWidth =
    productWidth === 9 && productHeight === 5.5
      ? Math.min(baseGapWidth, 0.2)
      : baseGapWidth;

  // Scale product dimensions to match layout calculation (product + gap)
  const productWithGapWidth = productWidth + gapWidth;
  const productWithGapHeight = productHeight + gapWidth;

  // Handle rotated orientation - swap dimensions if rotated
  // IMPORTANT: Keep proportional dimensions for accurate visualization
  let scaledProductWidth, scaledProductHeight;
  let visualProductWidth, visualProductHeight; // Pure product dimensions for drawing

  if (layout.orientation === "rotated") {
    scaledProductWidth = productWithGapHeight * scale; // Height becomes width (with gap)
    scaledProductHeight = productWithGapWidth * scale; // Width becomes height (with gap)
    visualProductWidth = productHeight * scale; // Pure height for drawing
    visualProductHeight = productWidth * scale; // Pure width for drawing
  } else {
    scaledProductWidth = productWithGapWidth * scale; // With gap
    scaledProductHeight = productWithGapHeight * scale; // With gap
    visualProductWidth = productWidth * scale; // Pure width for drawing
    visualProductHeight = productHeight * scale; // Pure height for drawing
  }

  const scaledBleedWidth = bleedWidth * scale;
  const scaledGapWidth = gapWidth * scale;

  // Calculate total grid width and height to center the products
  // For business cards, use optimized spacing to maximize printable area usage
  let totalGridWidth, totalGridHeight;

  if (productWidth === 9 && productHeight === 5.5) {
    // For business cards, calculate optimal spacing to maximize printable area usage
    const availableWidth = printableW;
    const availableHeight = printableH;

    // Calculate optimal spacing to fill the printable area
    const totalProductWidth = layout.itemsPerRow * productWidth * scale;
    const totalProductHeight = layout.itemsPerCol * productHeight * scale;

    // Calculate remaining space for gaps
    const remainingWidth = availableWidth - totalProductWidth;
    const remainingHeight = availableHeight - totalProductHeight;

    // Distribute remaining space as gaps (minimum 0.2cm, maximum 0.8cm)
    const minGap = 0.2 * scale; // Minimum 0.2cm gap
    const maxGap = 0.8 * scale; // Maximum 0.8cm gap

    const optimalGapX =
      layout.itemsPerRow > 1 ? remainingWidth / (layout.itemsPerRow - 1) : 0;
    const optimalGapY =
      layout.itemsPerCol > 1 ? remainingHeight / (layout.itemsPerCol - 1) : 0;

    const finalGapX = Math.max(minGap, Math.min(maxGap, optimalGapX));
    const finalGapY = Math.max(minGap, Math.min(maxGap, optimalGapY));

    totalGridWidth = totalProductWidth + (layout.itemsPerRow - 1) * finalGapX;
    totalGridHeight = totalProductHeight + (layout.itemsPerCol - 1) * finalGapY;

    console.log("📱 Business card grid calculation:", {
      availableWidth: availableWidth.toFixed(1),
      availableHeight: availableHeight.toFixed(1),
      totalProductWidth: totalProductWidth.toFixed(1),
      totalProductHeight: totalProductHeight.toFixed(1),
      remainingWidth: remainingWidth.toFixed(1),
      remainingHeight: remainingHeight.toFixed(1),
      optimalGapX: optimalGapX.toFixed(1),
      optimalGapY: optimalGapY.toFixed(1),
      finalGapX: finalGapX.toFixed(1),
      finalGapY: finalGapY.toFixed(1),
      totalGridWidth: totalGridWidth.toFixed(1),
      totalGridHeight: totalGridHeight.toFixed(1),
    });
  } else {
    // For other products, use standard calculation
    totalGridWidth = layout.itemsPerRow * scaledProductWidth;
    totalGridHeight = layout.itemsPerCol * scaledProductHeight;
  }

  // Center all products within the printable area
  let gridStartX, gridStartY;
  if (productName === "Shopping Bag") {
    // For shopping bags, recalculate dimensions to fill the available space
    const availableWidth = printableW;
    const availableHeight = printableH;
    const gapBetweenBags = scaledGapWidth;

    // Calculate dimensions per bag to fill the available space
    const bagWidth =
      (availableWidth - (layout.itemsPerRow - 1) * gapBetweenBags) /
      layout.itemsPerRow;
    const bagHeight =
      (availableHeight - (layout.itemsPerCol - 1) * gapBetweenBags) /
      layout.itemsPerCol;

    // Update scaled dimensions for shopping bags
    scaledProductWidth = bagWidth;
    scaledProductHeight = bagHeight;

    // Calculate total grid dimensions for shopping bags
    const totalGridWidth = layout.itemsPerRow * scaledProductWidth;
    const totalGridHeight = layout.itemsPerCol * scaledProductHeight;

    // Center the shopping bag grid within the printable area
    gridStartX = printableX + (printableW - totalGridWidth) / 2;
    gridStartY = printableY + (printableH - totalGridHeight) / 2;

    console.log("🛍️ Shopping bag positioning (centered):", {
      printableArea: { width: printableW, height: printableH },
      layout: { rows: layout.itemsPerCol, cols: layout.itemsPerRow },
      bagDimensions: { width: bagWidth, height: bagHeight },
      totalGridDimensions: { width: totalGridWidth, height: totalGridHeight },
      gridStartPosition: { x: gridStartX, y: gridStartY },
      gapBetweenBags: gapBetweenBags,
    });
  } else {
    // Center the grid within the printable area for other products
    gridStartX = printableX + (printableW - totalGridWidth) / 2;
    gridStartY = printableY + (printableH - totalGridHeight) / 2;

    console.log("📐 PRINT VIEW - GRID POSITIONING DEBUG:", {
      printableArea: {
        x: printableX,
        y: printableY,
        width: printableW,
        height: printableH,
      },
      totalGrid: { width: totalGridWidth, height: totalGridHeight },
      gridStart: { x: gridStartX, y: gridStartY },
      wouldFit: totalGridHeight <= printableH ? "✅ FITS" : "❌ TOO TALL",
      gridEndY: gridStartY + totalGridHeight,
      printableEndY: printableY + printableH,
    });

    // EMERGENCY FIX: If grid is too tall, force it to start at top
    if (totalGridHeight > printableH) {
      console.log(
        "🚨 GRID TOO TALL! Forcing grid to start at top of printable area"
      );
      gridStartY = printableY; // Start at top instead of centering
    } else if (gridStartY + totalGridHeight > printableY + printableH) {
      console.log("🚨 GRID OVERFLOWS! Adjusting start position");
      gridStartY = printableY + printableH - totalGridHeight; // Fit at bottom
    }
  }

  // Draw individual products with proper spacing (centered, no offset)
  console.log("🎨 Drawing cups - Print View:", {
    itemsPerRow: layout.itemsPerRow,
    itemsPerCol: layout.itemsPerCol,
    totalToDraw: layout.itemsPerRow * layout.itemsPerCol,
    productName: productName,
  });

  console.log(`🚨 CRITICAL DEBUG - Loop bounds:`, {
    itemsPerCol: layout.itemsPerCol,
    itemsPerRow: layout.itemsPerRow,
    itemsPerColType: typeof layout.itemsPerCol,
    itemsPerRowType: typeof layout.itemsPerRow,
    willIterate: `rows 0 to ${layout.itemsPerCol - 1}, cols 0 to ${
      layout.itemsPerRow - 1
    }`,
    loopCondition: `row < ${layout.itemsPerCol} means max row is ${
      layout.itemsPerCol - 1
    }`,
  });

  // EMERGENCY CHECK: If layout shows wrong values, force 4 cups for 6oz
  if (layout.itemsPerCol !== 4 && layout.itemsPerRow === 1) {
    console.log(
      "🚨 EMERGENCY: layout.itemsPerCol is not 4, forcing correction"
    );
    const correctedLayout = { ...layout, itemsPerCol: 4 };
    console.log("🔧 Corrected layout:", correctedLayout);
  }

  for (let row = 0; row < layout.itemsPerCol; row++) {
    console.log(`🔄 Print View - Starting row ${row} of ${layout.itemsPerCol}`);
    for (let col = 0; col < layout.itemsPerRow; col++) {
      console.log(`  🔄 Print View - Drawing position [${row},${col}]`);
      let x, y;

      let actualProductWidth, actualProductHeight;

      // Calculate position first
      if (productName === "Cups") {
        x = gridStartX + col * scaledProductWidth;
        y = gridStartY + row * scaledProductHeight;
        actualProductWidth = scaledProductWidth;
        actualProductHeight = scaledProductHeight;

        // CRITICAL: Check if this cup is outside printable area
        const cupEndY = y + actualProductHeight;
        const printableEndY = printableY + printableH;
        const isOutsidePrintable = cupEndY > printableEndY;

        console.log(`🚨 Cup [${row},${col}] CLIPPING CHECK:`, {
          cupStartY: y.toFixed(1),
          cupEndY: cupEndY.toFixed(1),
          printableEndY: printableEndY.toFixed(1),
          overflowAmount: isOutsidePrintable
            ? `${(cupEndY - printableEndY).toFixed(1)}px OUTSIDE`
            : "FITS",
          status: isOutsidePrintable ? "❌ WILL BE CLIPPED" : "✅ VISIBLE",
          isRow3: row === 3 ? "YES - This is the 4th cup!" : "No",
        });

        if (isOutsidePrintable && row === 3) {
          console.log("🎯 FOUND THE ISSUE! 4th cup is outside printable area!");
        }
      }

      if (productWidth === 9 && productHeight === 5.5) {
        // For business cards, use optimized spacing to maximize printable area usage
        const availableWidth = printableW;
        const availableHeight = printableH;

        // Calculate optimal spacing to fill the printable area
        const totalProductWidth = layout.itemsPerRow * visualProductWidth;
        const totalProductHeight = layout.itemsPerCol * visualProductHeight;

        // Calculate remaining space for gaps
        const remainingWidth = availableWidth - totalProductWidth;
        const remainingHeight = availableHeight - totalProductHeight;

        // Distribute remaining space as gaps (minimum 0.2cm, maximum 0.8cm)
        const minGap = 0.2 * scale; // Minimum 0.2cm gap
        const maxGap = 0.8 * scale; // Maximum 0.8cm gap

        const optimalGapX =
          layout.itemsPerRow > 1
            ? remainingWidth / (layout.itemsPerRow - 1)
            : 0;
        const optimalGapY =
          layout.itemsPerCol > 1
            ? remainingHeight / (layout.itemsPerCol - 1)
            : 0;

        const finalGapX = Math.max(minGap, Math.min(maxGap, optimalGapX));
        const finalGapY = Math.max(minGap, Math.min(maxGap, optimalGapY));

        x = gridStartX + col * (visualProductWidth + finalGapX);
        y = gridStartY + row * (visualProductHeight + finalGapY);

        // For business cards, use proportional visual dimensions for drawing
        actualProductWidth = visualProductWidth;
        actualProductHeight = visualProductHeight;

        console.log("📱 Business card optimized spacing:", {
          availableWidth: availableWidth.toFixed(1),
          availableHeight: availableHeight.toFixed(1),
          totalProductWidth: totalProductWidth.toFixed(1),
          totalProductHeight: totalProductHeight.toFixed(1),
          remainingWidth: remainingWidth.toFixed(1),
          remainingHeight: remainingHeight.toFixed(1),
          optimalGapX: optimalGapX.toFixed(1),
          optimalGapY: optimalGapY.toFixed(1),
          finalGapX: finalGapX.toFixed(1),
          finalGapY: finalGapY.toFixed(1),
        });
      } else {
        // For other products, use standard spacing
        x = gridStartX + col * scaledProductWidth;
        y = gridStartY + row * scaledProductHeight;

        // For other products, use scaled dimensions (with gaps) for boundary checks
        actualProductWidth = scaledProductWidth;
        actualProductHeight = scaledProductHeight;
      }

      // Ensure products don't extend outside printable area
      const maxX = printableX + printableW - actualProductWidth;
      const maxY = printableY + printableH - actualProductHeight;

      if (x > maxX) x = maxX;
      if (y > maxY) y = maxY;

      // Skip drawing if product would extend outside printable area
      if (
        x < printableX ||
        y < printableY ||
        x + actualProductWidth > printableX + printableW ||
        y + actualProductHeight > printableY + printableH
      ) {
        continue;
      }

      // Determine product shape for proper rendering
      const productShape =
        productName === "Cups"
          ? "circular"
          : productName === "Shopping Bag"
          ? "complex-3d"
          : "rectangular";

      // No individual position adjustments needed - grid layout handles positioning correctly

      // Draw bleed area (red) - only for rectangular products
      if (productShape === "rectangular") {
        ctx.fillStyle = "rgba(239, 68, 68, 0.3)";

        // Calculate bleed area that stays within printable boundaries
        const bleedLeft = Math.max(0, scaledBleedWidth);
        const bleedTop = Math.max(0, scaledBleedWidth);
        const bleedRight = Math.max(0, scaledBleedWidth);
        const bleedBottom = Math.max(0, scaledBleedWidth);

        // Ensure bleed doesn't extend outside printable area
        const bleedX = Math.max(printableX, x - bleedLeft);
        const bleedY = Math.max(printableY, y - bleedTop);
        const bleedW = Math.min(
          printableX + printableW - bleedX,
          actualProductWidth + bleedLeft + bleedRight
        );
        const bleedH = Math.min(
          printableY + printableH - bleedY,
          actualProductHeight + bleedTop + bleedBottom
        );

        // Only draw bleed if it has valid dimensions
        if (bleedW > 0 && bleedH > 0) {
          ctx.fillRect(bleedX, bleedY, bleedW, bleedH);
        }

        // Draw final trim area (black) for rectangular products
        ctx.fillStyle = "#000000";
        ctx.fillRect(x, y, actualProductWidth, actualProductHeight);
      } else {
        // For circular products (cups), use the specialized drawing function
        if (productShape === "circular") {
          drawCircularProduct(
            ctx,
            x,
            y,
            actualProductWidth,
            actualProductHeight,
            settings,
            productData,
            row,
            col,
            printCurrentProduct
          );
        } else {
          drawProductShape(
            ctx,
            x,
            y,
            actualProductWidth,
            actualProductHeight,
            productShape,
            settings,
            productData
          );
        }
      }

      // Draw enhanced product dimensions label using actual Step 3 dimensions
      const labelProductWidth =
        printCurrentProduct?.flatSize?.width ||
        productConfig?.defaultSizes?.width ||
        9;
      const labelProductHeight =
        printCurrentProduct?.flatSize?.height ||
        productConfig?.defaultSizes?.height ||
        5.5;

      // Only draw text label for rectangular products (cups have their own label in drawCircularProduct)
      if (productShape === "rectangular") {
        // Background for dimension label
        const labelWidth = 60;
        const labelHeight = 20;
        const labelX = x + actualProductWidth / 2 - labelWidth / 2;
        const labelY = y + actualProductHeight / 2 - labelHeight / 2;

        // Draw background with modern styling
        ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
        ctx.fillRect(labelX, labelY, labelWidth, labelHeight);
        ctx.strokeStyle = "rgba(59, 130, 246, 0.3)";
        ctx.lineWidth = 1;
        ctx.strokeRect(labelX, labelY, labelWidth, labelHeight);

        // Draw dimension text
        ctx.fillStyle = "#1e40af";
        ctx.font = "bold 9px Inter, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(
          `${labelProductWidth}×${labelProductHeight}`,
          x + actualProductWidth / 2,
          y + actualProductHeight / 2 + 3
        );

        // Add unit label
        ctx.fillStyle = "#6b7280";
        ctx.font = "8px Inter, system-ui, sans-serif";
        ctx.fillText(
          "cm",
          x + actualProductWidth / 2,
          y + actualProductHeight / 2 + 12
        );
      }
    }
  }

  // Professional layout with proper text positioning
  const displayOrientation =
    layout.orientation === "rotated" ? "Rotated" : "Normal";

  // Responsive sizing based on canvas width
  const isMobile = canvasWidth < 768;
  const isTablet = canvasWidth >= 768 && canvasWidth < 1024;

  // Title positioned above the sheet with proper spacing (responsive font size)
  ctx.fillStyle = "#111827";
  const mainTitleFontSize = isMobile ? "16px" : isTablet ? "18px" : "20px";
  ctx.font = `bold ${mainTitleFontSize} Inter, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("Print Layout", canvasWidth / 2, startY - 80);

  // Enhanced subtitle with better formatting and spacing
  const subtitleText = `${pressWidth} × ${pressHeight} cm  •  Yield: ${layout.itemsPerSheet} pieces (${layout.itemsPerRow} × ${layout.itemsPerCol})  •  ${layoutOrientation}`;
  ctx.fillStyle = "#64748b";
  const subtitleFontSize = isMobile ? "11px" : isTablet ? "12px" : "13px";
  ctx.font = `${subtitleFontSize} Inter, -apple-system, BlinkMacSystemFont, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Add subtle background for better readability
  const subtitleMetrics = ctx.measureText(subtitleText);
  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  ctx.fillRect(
    canvasWidth / 2 - subtitleMetrics.width / 2 - 8,
    startY - 63,
    subtitleMetrics.width + 16,
    18
  );

  // Add subtle border
  ctx.strokeStyle = "rgba(100, 116, 139, 0.2)";
  ctx.lineWidth = 1;
  ctx.strokeRect(
    canvasWidth / 2 - subtitleMetrics.width / 2 - 8,
    startY - 63,
    subtitleMetrics.width + 16,
    18
  );

  // Draw the subtitle text
  ctx.fillStyle = "#475569";
  ctx.fillText(subtitleText, canvasWidth / 2, startY - 54);

  // Information panels positioned outside the printable area
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
    startX + scaledPressWidth + panelSpacing + panelWidth < canvasWidth;

  // Left panel - Sheet Specifications (responsive positioning)
  const leftPanelX = leftPanelFits
    ? startX - panelWidth - panelSpacing
    : startX + scaledPressWidth / 2 - panelWidth / 2;
  const leftPanelY = leftPanelFits
    ? startY + 20
    : startY + scaledPressHeight + 30;

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
  ctx.fillText("Sheet Specs", leftPanelX + 8, leftPanelY + 20);

  // Specifications list (responsive font size)
  ctx.fillStyle = "#374151";
  const textFontSize = isMobile ? "8px" : isTablet ? "9px" : "10px";
  ctx.font = `${textFontSize} Inter, system-ui, sans-serif`;
  const specs = [
    `Press: ${pressWidth}×${pressHeight} cm`,
    `Printable: ${printableWidth.toFixed(1)}×${printableHeight.toFixed(1)} cm`,
    `Gripper: ${gripperWidth} cm`,
    `Margins: ${edgeMargin} cm`,
    `Orientation: ${layoutOrientation}`,
  ];

  specs.forEach((spec, index) => {
    ctx.fillText(spec, leftPanelX + 8, leftPanelY + 45 + index * 12);
  });

  // Right panel - Product Layout (responsive positioning)
  const rightPanelX = rightPanelFits
    ? startX + scaledPressWidth + panelSpacing
    : leftPanelFits
    ? startX + scaledPressWidth / 2 - panelWidth / 2
    : startX + scaledPressWidth / 2 - panelWidth / 2;
  const rightPanelY = rightPanelFits
    ? startY + 20
    : leftPanelFits
    ? startY + scaledPressHeight + 30
    : startY + scaledPressHeight + 150;

  // Panel background with transparency
  ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
  ctx.fillRect(rightPanelX, rightPanelY, panelWidth, panelHeight);

  // Panel border
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1;
  ctx.strokeRect(rightPanelX, rightPanelY, panelWidth, panelHeight);

  // Panel header
  ctx.fillStyle = "#f0f9ff";
  ctx.fillRect(rightPanelX, rightPanelY, panelWidth, 30);
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1;
  ctx.strokeRect(rightPanelX, rightPanelY, panelWidth, 30);

  // Panel title (responsive font size)
  ctx.fillStyle = "#0369a1";
  ctx.font = `bold ${titleFontSize} Inter, system-ui, sans-serif`;
  ctx.textAlign = "left";
  ctx.fillText("Product Layout", rightPanelX + 8, rightPanelY + 20);

  // Product details (responsive font size)
  ctx.fillStyle = "#0c4a6e";
  ctx.font = `${textFontSize} Inter, system-ui, sans-serif`;
  const productSpecs = [
    `Products: ${layout.itemsPerSheet}`,
    `Layout: ${layout.itemsPerRow}×${layout.itemsPerCol}`,
    `Grid: ${layout.itemsPerRow} cols`,
    `Rows: ${layout.itemsPerCol}`,
    `Utilization: ${(
      ((layout.itemsPerSheet * productWidth * productHeight) /
        (printableWidth * printableHeight)) *
      100
    ).toFixed(1)}%`,
  ];

  productSpecs.forEach((spec, index) => {
    ctx.fillText(spec, rightPanelX + 8, rightPanelY + 45 + index * 12);
  });

  // Enhanced printable area dimensions (bottom center) with better styling
  const printableDimensionText = `${printableWidth.toFixed(
    1
  )} × ${printableHeight.toFixed(1)} cm`;
  ctx.font = "bold 11px Inter, -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const printableDimMetrics = ctx.measureText(printableDimensionText);
  const printableCenterX = printableX + printableW / 2;
  const printableLabelY = printableY + printableH + 35; // Increased spacing for better section alignment

  // High contrast background for maximum visibility
  ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
  ctx.fillRect(
    printableCenterX - printableDimMetrics.width / 2 - 12,
    printableLabelY - 14,
    printableDimMetrics.width + 24,
    28
  );

  // Strong border for better definition
  ctx.strokeStyle = "rgba(71, 85, 105, 0.3)";
  ctx.lineWidth = 1;
  ctx.strokeRect(
    printableCenterX - printableDimMetrics.width / 2 - 12,
    printableLabelY - 14,
    printableDimMetrics.width + 24,
    28
  );

  // High contrast white text
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 13px Inter, -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText(printableDimensionText, printableCenterX, printableLabelY);
}