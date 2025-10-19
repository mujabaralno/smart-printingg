/* eslint-disable @typescript-eslint/no-explicit-any */
import { VisualizationSettings, VisualizationType } from "@/types";
import { computeLayout } from "../step4Calculation/computeLayout";
import { calculateVisualizationPressDimensions } from "../dynamic-press-calculator";
import { drawPrintView } from "./drawPrintView";
import { drawGripperView } from "./drawGripperView";
import { drawCutView } from "./drawCutView";

// Professional visualization drawing function with HD resolution
export function drawProfessionalVisualization(
  canvas: HTMLCanvasElement,
  layout: ReturnType<typeof computeLayout>,
  visualizationType: VisualizationType,
  settings: VisualizationSettings,
  productData?: any,
  parentSheetWidth?: number,
  parentSheetHeight?: number,
  pressSheetWidth?: number,
  pressSheetHeight?: number,
  formData?: any,
  productIndex?: number
) {
  console.log("🎨 drawProfessionalVisualization called:", {
    productName: productData?.productName,
    bagPreset: productData?.bagPreset,
    layout: layout
      ? {
          itemsPerRow: layout.itemsPerRow,
          itemsPerCol: layout.itemsPerCol,
          itemsPerSheet: layout.itemsPerSheet,
        }
      : "null",
    visualizationType,
  });

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Set HD resolution
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const canvasWidth = rect.width;
  const canvasHeight = rect.height;

  canvas.width = canvasWidth * dpr;
  canvas.height = canvasHeight * dpr;
  ctx.scale(dpr, dpr);
  canvas.style.width = canvasWidth + "px";
  canvas.style.height = canvasHeight + "px";

  // Clear canvas with professional background
  const bgGradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
  bgGradient.addColorStop(0, "#f8fafc");
  bgGradient.addColorStop(1, "#f1f5f9");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Enable ultra-high-quality rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Calculate scaling and positioning
  const padding = Math.min(40, Math.max(30, canvasWidth * 0.08));
  const canvasUsableWidth = canvasWidth - 2 * padding;
  const canvasUsableHeight = canvasHeight - 2 * padding;

  // Calculate dynamic press dimensions based on product size
  let dynamicPressWidth = 35; // Default fallback
  let dynamicPressHeight = 50; // Default fallback

  // IMPORTANT: For digital printing, use the sheet dimensions from digital calculation
  const currentProduct = formData?.products?.[productIndex || 0];
  const isDigitalPrinting = currentProduct?.printingSelection === "Digital";

  if (
    isDigitalPrinting &&
    (layout as any)?.pressWidth &&
    (layout as any)?.pressHeight
  ) {
    // Use digital sheet dimensions from enhanced calculation
    dynamicPressWidth = (layout as any).pressWidth;
    dynamicPressHeight = (layout as any).pressHeight;
    console.log("📱 Using digital sheet dimensions from calculation:", {
      width: dynamicPressWidth,
      height: dynamicPressHeight,
      itemsPerRow: (layout as any).itemsPerRow,
      itemsPerCol: (layout as any).itemsPerCol,
      orientation: (layout as any).orientation,
      source: "digital calculation gridLayout",
    });
  } else {
    // Use outputDimensions if available (from Step 3), otherwise fall back to productData
    let productWidth, productHeight;
    if (
      formData &&
      productIndex !== undefined &&
      formData.outputDimensions &&
      formData.outputDimensions[productIndex]
    ) {
      productWidth = formData.outputDimensions[productIndex].width;
      productHeight = formData.outputDimensions[productIndex].height;
      console.log("🔍 Using outputDimensions for press calculation:", {
        width: productWidth,
        height: productHeight,
        productIndex,
        source: "outputDimensions",
      });
    } else if (
      productData &&
      productData.flatSize &&
      productData.flatSize.width &&
      productData.flatSize.height
    ) {
      productWidth = productData.flatSize.width;
      productHeight = productData.flatSize.height;
      console.log("🔍 Using productData.flatSize for press calculation:", {
        width: productWidth,
        height: productHeight,
        productName: productData.name,
        source: "productData.flatSize",
      });
    }

    if (productWidth && productHeight) {
      const pressDimension = calculateVisualizationPressDimensions(
        {
          width: productWidth,
          height: productHeight,
        },
        formData
      );

      if (pressDimension) {
        dynamicPressWidth = pressDimension.width;
        dynamicPressHeight = pressDimension.height;
        console.log("🎯 Using dynamic press dimensions:", pressDimension);
        console.log("📊 Press dimensions applied:", {
          width: dynamicPressWidth,
          height: dynamicPressHeight,
        });
      } else {
        console.warn(
          "⚠️ Failed to calculate dynamic press dimensions, using fallback"
        );
      }
    } else {
      console.warn("⚠️ Missing product dimensions, using default press size");
      console.log("🔍 Available productData:", productData);
      console.log(
        "🔍 Available formData.outputDimensions:",
        formData?.outputDimensions
      );
    }
  }

  if (visualizationType === "cut") {
    // CUT VIEW: Show how to slice parent sheet into press sheets (dynamic dimensions)
    drawCutView(
      ctx,
      canvasWidth,
      canvasHeight,
      canvasUsableWidth,
      canvasUsableHeight,
      parentSheetWidth || 100,
      parentSheetHeight || 70,
      dynamicPressWidth,
      dynamicPressHeight
    ); // Dynamic press sheet size
  } else if (visualizationType === "print") {
    // PRINT VIEW: Show products on press sheet (dynamic dimensions)
    drawPrintView(
      ctx,
      canvasWidth,
      canvasHeight,
      canvasUsableWidth,
      canvasUsableHeight,
      dynamicPressWidth,
      dynamicPressHeight,
      layout,
      settings,
      productData,
      formData,
      productIndex
    ); // Dynamic press sheet size
  } else if (visualizationType === "gripper") {
    // GRIPPER VIEW: Show pressman's view with gripper area on press sheet (dynamic dimensions)
    drawGripperView(
      ctx,
      canvasWidth,
      canvasHeight,
      canvasUsableWidth,
      canvasUsableHeight,
      dynamicPressWidth,
      dynamicPressHeight,
      layout,
      settings,
      productData,
      formData,
      productIndex
    ); // Dynamic press sheet size
  }
}
