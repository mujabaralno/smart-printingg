/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { VisualizationSettings } from "@/types";

// Draw circular products (Cups) - EXACT GITHUB STYLE RESTORED
export function drawCircularProduct(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  settings: VisualizationSettings,
  productData?: any,
  row?: number,
  col?: number,
  product?: any
) {
  const cupSizeOz = product?.cupSizeOz || 8;

  console.log(
    `🍵 Drawing Cup ${row || "?"}-${
      col || "?"
    } (${cupSizeOz}oz) - POSITION DEBUG:`,
    {
      allocatedSpace: { x, y, width, height },
      cupIndex: `${(row || 0) * 1 + (col || 0) + 1} of expected 4`,
      drawingCall: `drawCircularProduct called for position ${row || "?"},${
        col || "?"
      }`,
      isLastCup: row === 3 ? "YES - This is the 4th cup!" : "No",
    }
  );

  // EMERGENCY: Check if this cup will be visible
  if (y + height > 800) {
    // Assuming canvas height might be around 800px
    console.log(
      `🚨 WARNING: Cup ${row || "?"}-${
        col || "?"
      } may be outside canvas! Y position: ${y + height}`
    );
  }

  const centerX = x + width / 2;
  const centerY = y + height / 2;

  // Ultra-tight positioning for maximum space utilization
  const margin = 1; // Absolute minimal margin for edge safety
  const availableWidth = width - 2 * margin;
  const availableHeight = height - 2 * margin;

  // Industry standard cup dimensions - KEEP ORIGINAL SIZES
  const cupStandards = {
    4: {
      trapezoidWidth: 0.78, // Original 4oz width
      trapezoidHeight: 0.36, // Original 4oz height
      bottomRatio: 0.94, // Almost no taper
      circleSize: 0.12, // 62mm diameter - real 4oz base size
    },
    6: {
      trapezoidWidth: 0.84, // Original 6oz width
      trapezoidHeight: 0.4, // Original 6oz height
      bottomRatio: 0.94, // Minimal taper
      circleSize: 0.14, // 70mm diameter - real 6oz base size
    },
    8: {
      trapezoidWidth: 0.88, // Original 8oz width
      trapezoidHeight: 0.44, // Original 8oz height
      bottomRatio: 0.93, // Minimal taper
      circleSize: 0.16, // 80mm diameter - real 8oz base size
    },
    12: {
      trapezoidWidth: 0.92, // Original 12oz width
      trapezoidHeight: 0.48, // Original 12oz height
      bottomRatio: 0.92, // Minimal taper
      circleSize: 0.18, // 90mm diameter - real 12oz base size
    },
  };

  const standards =
    cupStandards[cupSizeOz as keyof typeof cupStandards] || cupStandards[8];

  // Apply OZ-specific dimensions
  const trapezoidWidth = availableWidth * standards.trapezoidWidth;
  const trapezoidHeight = availableHeight * standards.trapezoidHeight;
  const trapezoidTopWidth = trapezoidWidth;
  const trapezoidBottomWidth = trapezoidWidth * standards.bottomRatio;

  // Circle dimensions based on OZ size
  const circleRadius =
    Math.min(availableWidth, availableHeight) * standards.circleSize;

  // Calculate total height needed for trapezoid + gap + circle (with default gap)
  const defaultVerticalGap = Math.max(8, availableHeight * 0.03);
  const totalContentHeight =
    trapezoidHeight + defaultVerticalGap + circleRadius * 2;

  // For 4-cup vertical layout, detect special cases
  const isVerticalLayout = row !== undefined && row >= 3; // Detect if this is the 4th cup (row 3)
  const isIn4CupLayout =
    row !== undefined &&
    row >= 0 &&
    totalContentHeight * 4 > availableHeight * 3;

  if (isVerticalLayout) {
    console.log(
      `🎯 4TH CUP DETECTED! Row ${row} - Applying special positioning for visibility`
    );
  }

  // Adjust gap based on layout - smaller gap for 4-cup layouts
  let verticalGap;
  if (isIn4CupLayout || isVerticalLayout) {
    verticalGap = 4; // Ultra-minimal gap for 4-cup layouts
    console.log(`📏 Using minimal gap (4px) for 4-cup layout`);
  } else {
    verticalGap = defaultVerticalGap; // Normal gap
  }

  // Calculate optimal starting Y to center content vertically within available space
  let contentStartY;
  if (isVerticalLayout) {
    // For 4th cup, start at top to ensure it fits
    contentStartY = y + margin;
    console.log(`🎯 4TH CUP: Starting at top Y=${contentStartY}`);
  } else if (isIn4CupLayout) {
    // For all cups in 4-cup layout, use minimal spacing
    contentStartY = y + margin;
    console.log(`📦 4-CUP LAYOUT: Ultra-compact spacing for cup ${row}`);
  } else {
    // Normal centered positioning
    contentStartY =
      y + margin + Math.max(0, (availableHeight - totalContentHeight) / 2);
  }

  // Position trapezoid optimally
  const trapezoidCenterX = centerX;
  const trapezoidCenterY = contentStartY + trapezoidHeight / 2;

  // Position circle as close as possible below trapezoid
  const circleCenterX = centerX;
  const circleCenterY =
    trapezoidCenterY + trapezoidHeight / 2 + verticalGap + circleRadius;

  // Draw trapezoid with blue outline and light fill
  ctx.fillStyle = "#f8fafc";
  ctx.strokeStyle = "#3b82f6"; // Blue outline like in GitHub
  ctx.lineWidth = 2;

  // Calculate trapezoid corners
  const topLeft = {
    x: trapezoidCenterX - trapezoidTopWidth / 2,
    y: trapezoidCenterY - trapezoidHeight / 2,
  };
  const topRight = {
    x: trapezoidCenterX + trapezoidTopWidth / 2,
    y: trapezoidCenterY - trapezoidHeight / 2,
  };
  const bottomLeft = {
    x: trapezoidCenterX - trapezoidBottomWidth / 2,
    y: trapezoidCenterY + trapezoidHeight / 2,
  };
  const bottomRight = {
    x: trapezoidCenterX + trapezoidBottomWidth / 2,
    y: trapezoidCenterY + trapezoidHeight / 2,
  };

  // Draw trapezoid
  ctx.beginPath();
  ctx.moveTo(topLeft.x, topLeft.y);
  ctx.lineTo(topRight.x, topRight.y);
  ctx.lineTo(bottomRight.x, bottomRight.y);
  ctx.lineTo(bottomLeft.x, bottomLeft.y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Clean design - no fold lines or dotted lines

  // Draw circle with blue outline
  ctx.fillStyle = "#f8fafc";
  ctx.strokeStyle = "#3b82f6";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.arc(circleCenterX, circleCenterY, circleRadius, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();

  // Draw cup size label above trapezoid
  ctx.fillStyle = "#1f2937";
  ctx.strokeStyle = "#3b82f6";
  ctx.lineWidth = 1;
  ctx.font = "bold 10px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle"; // Ensure proper text baseline

  // Ultra-compact label for maximum space efficiency
  const labelText = `${cupSizeOz}oz`;
  const labelWidth = 22; // Ultra-compact width
  const labelHeight = 10; // Ultra-compact height
  const labelX = trapezoidCenterX - labelWidth / 2;
  const labelY = topLeft.y - 14; // As close as possible to trapezoid

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(labelX, labelY, labelWidth, labelHeight);
  ctx.strokeRect(labelX, labelY, labelWidth, labelHeight);

  // Label text - positioned correctly in the center of the label box
  ctx.fillStyle = "#3b82f6";
  ctx.fillText(labelText, trapezoidCenterX, labelY + labelHeight / 2);

  console.log(`🍵 GitHub Style Cup Complete:`, {
    cupSize: cupSizeOz,
    trapezoidCenter: { x: trapezoidCenterX, y: trapezoidCenterY },
    circleCenter: { x: circleCenterX, y: circleCenterY },
    layout: "GitHub original style - trapezoid above, circle below",
  });
}