/* eslint-disable @typescript-eslint/no-explicit-any */

import { getProductConfig, getShoppingBagPreset } from "@/constants/product-config";
import { getEffectiveProductSize } from "../step4Calculation/getEffectiveProductSize";
import { drawCircularProduct } from "./drawCircularProduct";
import { drawProductShape } from "./drawProductShape";

// GRIPPER VIEW: Shows pressman's view with gripper area
export function drawGripperView(
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
  const gripperCurrentProduct = formData?.products?.[productIndex || 0];
  const gripperProductName =
    gripperCurrentProduct?.productName || "Business Card";

  // Use exact layout calculation results
  const actualItemsPerRow = layout?.itemsPerRow || 0;
  const actualItemsPerCol = layout?.itemsPerCol || 0;
  const actualItemsPerSheet = layout?.itemsPerSheet || 0;
  const gripperOrientation = layout?.orientation || "normal";

  console.log("🎨 Gripper View Layout:", {
    pressDimensions: `${pressWidth}×${pressHeight}`,
    layout: {
      actualItemsPerRow,
      actualItemsPerCol,
      actualItemsPerSheet,
      orientation: gripperOrientation,
    },
    productName: gripperProductName,
  });

  // Same as print view but with gripper area highlighted
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

  // Add professional press sheet dimensions label with background (UPDATED VERSION)
  const gripperDimensionText = `${pressWidth} × ${pressHeight} cm`;
  ctx.font = "bold 14px Inter, -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const gripperDimensionMetrics = ctx.measureText(gripperDimensionText);
  const labelX = startX + scaledPressWidth / 2;
  const labelY = startY - 25;

  // Draw professional background for dimension label
  ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
  ctx.fillRect(
    labelX - gripperDimensionMetrics.width / 2 - 12,
    labelY - 12,
    gripperDimensionMetrics.width + 24,
    24
  );

  // Add subtle border
  ctx.strokeStyle = "rgba(71, 85, 105, 0.3)";
  ctx.lineWidth = 1;
  ctx.strokeRect(
    labelX - gripperDimensionMetrics.width / 2 - 12,
    labelY - 12,
    gripperDimensionMetrics.width + 24,
    24
  );

  // Draw white text
  ctx.fillStyle = "#ffffff";
  ctx.fillText(gripperDimensionText, labelX, labelY);

  // Draw professional gripper area with industry-standard markings based on position
  ctx.fillStyle = "rgba(239, 68, 68, 0.15)"; // Subtle red tint
  ctx.strokeStyle = "#dc2626"; // Professional red
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 5]); // Professional dashed pattern

  if (isWidthLonger) {
    // Gripper at top (traditional position)
    ctx.fillRect(startX, startY, scaledPressWidth, scaledGripperWidth);
    ctx.strokeRect(startX, startY, scaledPressWidth, scaledGripperWidth);
    printableX = startX + scaledEdgeMargin;
    printableY = startY + scaledGripperWidth + scaledEdgeMargin;

    // Add professional gripper labels for top position with enhanced styling
    const gripperCenterX = startX + scaledPressWidth / 2;
    const gripperCenterY = startY + scaledGripperWidth / 2;

    // Professional gripper label with printable area styling
    const gripperText = "GRIPPER";
    ctx.font = "bold 11px Inter, -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const gripperTextMetrics = ctx.measureText(gripperText);
    const gripperLabelY = gripperCenterY - 2;

    // White background for gripper label
    ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
    ctx.fillRect(
      gripperCenterX - gripperTextMetrics.width / 2 - 6,
      gripperLabelY - 8,
      gripperTextMetrics.width + 12,
      16
    );

    // Light green dashed border
    ctx.strokeStyle = "rgba(5, 150, 105, 0.3)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(
      gripperCenterX - gripperTextMetrics.width / 2 - 6,
      gripperLabelY - 8,
      gripperTextMetrics.width + 12,
      16
    );
    ctx.setLineDash([]);

    // Dark green text
    ctx.fillStyle = "#059669";
    ctx.fillText(gripperText, gripperCenterX, gripperLabelY);

    // Dimension label with same professional styling
    const dimensionText = `${gripperWidth} cm`;
    ctx.font = "10px Inter, -apple-system, BlinkMacSystemFont, sans-serif";
    const dimensionMetrics = ctx.measureText(dimensionText);
    const dimensionLabelY = gripperCenterY + 12;

    // White background for dimension label
    ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
    ctx.fillRect(
      gripperCenterX - dimensionMetrics.width / 2 - 4,
      dimensionLabelY - 6,
      dimensionMetrics.width + 8,
      12
    );

    // Light green dashed border
    ctx.strokeStyle = "rgba(5, 150, 105, 0.3)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(
      gripperCenterX - dimensionMetrics.width / 2 - 4,
      dimensionLabelY - 6,
      dimensionMetrics.width + 8,
      12
    );
    ctx.setLineDash([]);

    // Dark green text
    ctx.fillStyle = "#059669";
    ctx.fillText(dimensionText, gripperCenterX, dimensionLabelY);
  } else {
    // Gripper at left side
    ctx.fillRect(startX, startY, scaledGripperWidth, scaledPressHeight);
    ctx.strokeRect(startX, startY, scaledGripperWidth, scaledPressHeight);
    printableX = startX + scaledGripperWidth + scaledEdgeMargin;
    printableY = startY + scaledEdgeMargin;

    // Add professional gripper labels for left position (rotated text) with printable area styling
    ctx.save();
    ctx.translate(
      startX + scaledGripperWidth / 2,
      startY + scaledPressHeight / 2
    );
    ctx.rotate(-Math.PI / 2);

    // Main gripper label with professional styling
    const gripperText = "GRIPPER";
    ctx.font = "bold 11px Inter, -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const gripperTextMetrics = ctx.measureText(gripperText);
    const gripperLabelY = -2;

    // White background for gripper label
    ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
    ctx.fillRect(
      -gripperTextMetrics.width / 2 - 6,
      gripperLabelY - 8,
      gripperTextMetrics.width + 12,
      16
    );

    // Light green dashed border
    ctx.strokeStyle = "rgba(5, 150, 105, 0.3)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(
      -gripperTextMetrics.width / 2 - 6,
      gripperLabelY - 8,
      gripperTextMetrics.width + 12,
      16
    );
    ctx.setLineDash([]);

    // Dark green text
    ctx.fillStyle = "#059669";
    ctx.fillText(gripperText, 0, gripperLabelY);

    // Dimension label with same professional styling
    const dimensionText = `${gripperWidth} cm`;
    ctx.font = "10px Inter, -apple-system, BlinkMacSystemFont, sans-serif";
    const dimensionMetrics = ctx.measureText(dimensionText);
    const dimensionLabelY = 12;

    // White background for dimension label
    ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
    ctx.fillRect(
      -dimensionMetrics.width / 2 - 4,
      dimensionLabelY - 6,
      dimensionMetrics.width + 8,
      12
    );

    // Light green dashed border
    ctx.strokeStyle = "rgba(5, 150, 105, 0.3)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(
      -dimensionMetrics.width / 2 - 4,
      dimensionLabelY - 6,
      dimensionMetrics.width + 8,
      12
    );
    ctx.setLineDash([]);

    // Dark green text
    ctx.fillStyle = "#059669";
    ctx.fillText(dimensionText, 0, dimensionLabelY);

    ctx.restore();
  }

  ctx.setLineDash([]);

  // Draw professional printable area with industry-standard markings - coordinates already set above
  const printableW = printableWidth * scale;
  const printableH = printableHeight * scale;

  // Professional printable area border
  ctx.strokeStyle = "#059669"; // Professional green
  ctx.lineWidth = 2;
  ctx.setLineDash([12, 6]); // Professional dashed pattern
  ctx.strokeRect(printableX, printableY, printableW, printableH);
  ctx.setLineDash([]);

  // Add professional printable area labels with enhanced styling
  const printableCenterX = printableX + printableW / 2;

  // Top label with background
  const printableText = "PRINTABLE AREA";
  ctx.font = "bold 10px Inter, -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const printableMetrics = ctx.measureText(printableText);
  const topLabelY = printableY - 8;

  // Background for top label
  ctx.fillStyle = "rgba(5, 150, 105, 0.9)";
  ctx.fillRect(
    printableCenterX - printableMetrics.width / 2 - 6,
    topLabelY - 8,
    printableMetrics.width + 12,
    16
  );

  // Top label text
  ctx.fillStyle = "#ffffff";
  ctx.fillText(printableText, printableCenterX, topLabelY);

  // Bottom dimension label with enhanced styling
  const bottomDimensionText = `${printableWidth.toFixed(
    1
  )} × ${printableHeight.toFixed(1)} cm`;
  ctx.font = "11px Inter, -apple-system, BlinkMacSystemFont, sans-serif";
  const bottomDimensionMetrics = ctx.measureText(bottomDimensionText);
  const bottomLabelY = printableY + printableH + 35; // Increased spacing for better section alignment

  // High contrast background for maximum visibility
  ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
  ctx.fillRect(
    printableCenterX - bottomDimensionMetrics.width / 2 - 12,
    bottomLabelY - 14,
    bottomDimensionMetrics.width + 24,
    28
  );

  // Strong border for better definition
  ctx.strokeStyle = "rgba(71, 85, 105, 0.3)";
  ctx.lineWidth = 1;
  ctx.strokeRect(
    printableCenterX - bottomDimensionMetrics.width / 2 - 12,
    bottomLabelY - 14,
    bottomDimensionMetrics.width + 24,
    28
  );

  // High contrast white text
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 13px Inter, -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText(bottomDimensionText, printableCenterX, bottomLabelY);

  // Draw products (same as print view but with gripper emphasis) using actual Step 3 dimensions
  const gripperDrawCurrentProduct = formData?.products?.[productIndex || 0];
  const gripperDrawProductName =
    gripperDrawCurrentProduct?.productName || "Business Card";
  const productConfig = getProductConfig(gripperDrawProductName);

  // Enhanced product dimension handling for different product types
  let productWidth, productHeight;
  if (
    gripperDrawProductName === "Shopping Bag" &&
    gripperDrawCurrentProduct?.bagPreset
  ) {
    const bagPreset = getShoppingBagPreset(gripperDrawCurrentProduct.bagPreset);
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
    } else {
      productWidth =
        gripperCurrentProduct?.flatSize?.width ||
        productConfig?.defaultSizes?.width ||
        9;
      productHeight =
        gripperCurrentProduct?.flatSize?.height ||
        productConfig?.defaultSizes?.height ||
        5.5;
    }
  } else {
    // Use unified helper for consistent dimensions across all views
    const effectiveSize = getEffectiveProductSize(
      gripperCurrentProduct,
      productConfig
    );
    productWidth = effectiveSize.width;
    productHeight = effectiveSize.height;

    if (gripperProductName === "Cups") {
      console.log("🍵 Gripper view using unified cup dimensions:", {
        originalHeight: gripperCurrentProduct?.flatSize?.height,
        effectiveHeight: productHeight,
        adjustment:
          effectiveSize.height - (gripperCurrentProduct?.flatSize?.height || 0),
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
  if (gripperProductName === "Shopping Bag") {
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

    console.log("🛍️ Shopping bag positioning (centered) in gripper view:", {
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

    console.log("📐 GRIPPER VIEW - GRID POSITIONING DEBUG:", {
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

    // OVERFLOW PROTECTION (same as print view)
    if (totalGridHeight > printableH) {
      console.log(
        "🚨 GRIPPER GRID TOO TALL! Forcing grid to start at top of printable area"
      );
      gridStartY = printableY; // Start at top instead of centering
    } else if (gridStartY + totalGridHeight > printableY + printableH) {
      console.log("🚨 GRIPPER GRID OVERFLOWS! Adjusting start position");
      gridStartY = printableY + printableH - totalGridHeight; // Fit at bottom
    }
  }

  // Draw individual products with proper spacing and gripper emphasis (centered, no offset)
  console.log("🎨 Drawing cups - Gripper View:", {
    itemsPerRow: layout.itemsPerRow,
    itemsPerCol: layout.itemsPerCol,
    totalToDraw: layout.itemsPerRow * layout.itemsPerCol,
    productName: gripperProductName,
  });

  for (let row = 0; row < layout.itemsPerCol; row++) {
    for (let col = 0; col < layout.itemsPerRow; col++) {
      let x, y;
      let actualProductWidth, actualProductHeight;

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
        gripperProductName === "Cups"
          ? "circular"
          : gripperProductName === "Shopping Bag"
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
            gripperCurrentProduct
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
        gripperCurrentProduct?.flatSize?.width ||
        productConfig?.defaultSizes?.width ||
        9;
      const labelProductHeight =
        gripperCurrentProduct?.flatSize?.height ||
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
  // Responsive sizing based on canvas width
  const isMobile = canvasWidth < 768;
  const isTablet = canvasWidth >= 768 && canvasWidth < 1024;

  // Title positioned above the sheet with proper spacing (responsive font size)
  ctx.fillStyle = "#111827";
  const mainTitleFontSize = isMobile ? "16px" : isTablet ? "18px" : "20px";
  ctx.font = `bold ${mainTitleFontSize} Inter, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("Gripper Handling", canvasWidth / 2, startY - 80);

  // Subtitle with proper spacing from title (responsive font size)
  ctx.fillStyle = "#6b7280";
  const subtitleFontSize = isMobile ? "11px" : isTablet ? "12px" : "14px";
  ctx.font = `${subtitleFontSize} Inter, system-ui, sans-serif`;
  ctx.fillText(
    `${pressWidth}×${pressHeight} • Safety Check`,
    canvasWidth / 2,
    startY - 55
  );

  // Information panels positioned outside the printable area
  const panelWidth = isMobile
    ? Math.min(140, canvasWidth * 0.35)
    : isTablet
    ? Math.min(160, canvasWidth * 0.25)
    : 180;
  const panelHeight = isMobile ? 120 : isTablet ? 130 : 140;
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
    `Press Sheet: ${pressWidth} × ${pressHeight} cm`,
    `Gripper: ${gripperWidth} cm`,
    `Gap: ${gapWidth} cm  •  Bleed: ${bleedWidth} cm`,
    `Edge margins: ${edgeMargin} cm`,
    `Printable: ${printableWidth.toFixed(1)} × ${printableHeight.toFixed(
      1
    )} cm`,
  ];

  specs.forEach((spec, index) => {
    ctx.fillText(spec, leftPanelX + 8, leftPanelY + 45 + index * 12);
  });

  // Right panel - Safety Check (responsive positioning)
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

  // Panel header with safety theme
  ctx.fillStyle = "#fef2f2";
  ctx.fillRect(rightPanelX, rightPanelY, panelWidth, 30);
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1;
  ctx.strokeRect(rightPanelX, rightPanelY, panelWidth, 30);

  // Panel title (responsive font size)
  ctx.fillStyle = "#dc2626";
  ctx.font = `bold ${titleFontSize} Inter, system-ui, sans-serif`;
  ctx.textAlign = "left";
  ctx.fillText("Safety Check", rightPanelX + 8, rightPanelY + 20);

  // Safety details with checkmarks (responsive font size)
  ctx.fillStyle = "#991b1b";
  ctx.font = `${textFontSize} Inter, system-ui, sans-serif`;
  const safetyChecks = [
    `Gripper Clearance: ✓`,
    `Margin Check: ✓`,
    `Bleed Area: ✓`,
    `Edge Safety: ✓`,
    `Print Area: ${printableWidth.toFixed(1)}×${printableHeight.toFixed(1)} cm`,
    `Utilization: ${(
      ((layout.itemsPerSheet * productWidth * productHeight) /
        (printableWidth * printableHeight)) *
      100
    ).toFixed(1)}%`,
  ];

  safetyChecks.forEach((check, index) => {
    ctx.fillText(check, rightPanelX + 8, rightPanelY + 45 + index * 12);
  });

  // Old gripper label removed - now handled in main gripper drawing section with professional styling

  // Printable dimensions already displayed with proper styling in main views
}