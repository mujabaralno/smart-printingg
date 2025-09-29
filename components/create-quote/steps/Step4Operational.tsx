/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import type { FC, Dispatch, SetStateAction } from "react";
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Calculator, Settings, BarChart3, Edit3, AlertTriangle, Database, Palette, Info, Clock, DollarSign, Search, Building, Plus, Minus, Printer, Scissors, GripHorizontal } from "lucide-react";
import { getProductConfig, getShoppingBagPreset } from "@/constants/product-config";
import type { QuoteFormData, DigitalPricing, OffsetPricing, DigitalCostingResult, OffsetCostingResult } from "@/types";
import { PricingService } from "@/lib/pricing-service";
import { calcDigitalCosting, calcOffsetCosting } from "@/lib/imposition";

interface Step4Props {
  formData: QuoteFormData;
  setFormData: Dispatch<SetStateAction<QuoteFormData>>;
}

// Professional visualization types and interfaces
type VisualizationType = 'cut' | 'print' | 'gripper';
type ProductShape = 'rectangular' | 'circular' | 'complex-3d';

interface VisualizationSettings {
  type: VisualizationType;
  showGripper: boolean;
  showCutLines: boolean;
  showBleed: boolean;
  showGaps: boolean;
  gripperWidth: number;
  bleedWidth: number;
  gapWidth: number;
}


/** Exact HTML calculation logic */
function calculateMaxItemsPerSheet(sheetLength: number, sheetWidth: number, itemLength: number, itemWidth: number) {
  // Orientation 1: Item length aligned with sheet length, item width with sheet width
  const count1 = Math.floor(sheetLength / itemLength) * Math.floor(sheetWidth / itemWidth);

  // Orientation 2: Item length aligned with sheet width, item width with sheet length (rotated)
  const count2 = Math.floor(sheetLength / itemWidth) * Math.floor(sheetWidth / itemLength);

  if (count1 >= count2) {
    return { count: count1, orientation: 'normal' as const };
  } else {
    return { count: count2, orientation: 'rotated' as const };
  }
}

/** Enhanced layout calculation with proper gripper, margins, gaps, and bleed */
function computeLayout(
  inputWidth: number | null,  // Press sheet width (35)
  inputHeight: number | null, // Press sheet height (50) 
  outputWidth: number | null, // Product width (14.8)
  outputHeight: number | null, // Product height (21.0)
  gripperWidth: number = 0.9,  // Fixed gripper area (top)
  edgeMargin: number = 0.5,    // Fixed edge margins
  gapWidth: number = 0.5,      // Fixed gap between products
  bleedWidth: number = 0.3     // Fixed bleed around products
) {
  // Debug log to see what's actually being passed
  console.log('🔍 computeLayout called with:', {
    inputWidth, inputHeight, outputWidth, outputHeight,
    gripperWidth, edgeMargin, gapWidth, bleedWidth
  });
  
  console.log('🔍 computeLayout DEBUG - All parameters received:', {
    inputWidth, inputHeight, outputWidth, outputHeight,
    gripperWidth, edgeMargin, gapWidth, bleedWidth
  });
  
  if (!inputWidth || !inputHeight || !outputWidth || !outputHeight) {
    return {
      usableW: 0,
      usableH: 0,
      itemsPerSheet: 0,
      efficiency: 0,
      orientation: 'normal' as 'normal' | 'rotated',
      itemsPerRow: 0,
      itemsPerCol: 0,
      productShape: 'rectangular' as ProductShape
    };
  }

  // Calculate printable area (after gripper and margins)
  const printableWidth = inputWidth - (2 * edgeMargin);
  const printableHeight = inputHeight - gripperWidth - edgeMargin;

  // Calculate product dimensions with bleed and safety gap
  const safetyGap = 0.5; // 0.5cm safety gap around each object
  let productWithBleedWidth = outputWidth + (2 * bleedWidth) + (2 * safetyGap);
  let productWithBleedHeight = outputHeight + (2 * bleedWidth) + (2 * safetyGap);
  
  // Special optimization for shopping bags to maximize fitment
  // Check if this looks like a shopping bag based on dimensions
  const isShoppingBag = outputWidth > 50 && outputHeight > 30; // Shopping bags are typically large
  
  console.log('🔍 computeLayout shopping bag detection:', {
    outputWidth,
    outputHeight,
    isShoppingBag,
    threshold: { width: 50, height: 30 }
  });
  
  if (isShoppingBag) {
    console.log('🛍️ Detected shopping bag - using original dimensions without scaling');
    
    // For shopping bags, use the original dimensions without scaling
    // The layout calculation will determine the correct fitment
    productWithBleedWidth = outputWidth + (2 * bleedWidth) + (2 * safetyGap);
    productWithBleedHeight = outputHeight + (2 * bleedWidth) + (2 * safetyGap);
    
    console.log('🛍️ Shopping bag dimensions (no scaling):', {
      originalDimensions: { width: outputWidth, height: outputHeight },
      finalDimensions: { width: productWithBleedWidth, height: productWithBleedHeight }
    });
  }
  
  console.log('🔍 computeLayout CALCULATIONS:', {
    printableWidth,
    printableHeight,
    productWithBleedWidth,
    productWithBleedHeight,
    safetyGap,
    bleedWidth,
    gapWidth,
    originalWidth: outputWidth,
    originalHeight: outputHeight,
    isSmallCup: (outputWidth <= 22 && outputHeight <= 8.5)
  });
  

  // Calculate how many products fit in printable area
  // For each row: we need space for products + gaps between them
  // If we have n products in a row, we need: n * productWidth + (n-1) * gapWidth
  // So: n * productWidth + (n-1) * gapWidth <= printableWidth
  // Solving for n: n <= (printableWidth + gapWidth) / (productWidth + gapWidth)
  
  // For smaller cups (4oz, 6oz), force vertical arrangement to prevent overlap
  const isSmallCup = (outputWidth <= 22 && outputHeight <= 8.5); // 4oz: 20x8, 6oz: 22x8.5
  
  let normalItemsPerRow, normalItemsPerCol, normalCount;
  let rotatedItemsPerRow, rotatedItemsPerCol, rotatedCount;
  
  if (isSmallCup) {
    // Force vertical arrangement for small cups (fewer columns, more rows)
    normalItemsPerRow = Math.min(2, Math.floor((printableWidth + gapWidth) / (productWithBleedWidth + gapWidth)));
    normalItemsPerCol = Math.floor((printableHeight + gapWidth) / (productWithBleedHeight + gapWidth));
    normalCount = normalItemsPerRow * normalItemsPerCol;
    
    // For rotated, also limit columns
    rotatedItemsPerRow = Math.min(2, Math.floor((printableWidth + gapWidth) / (productWithBleedHeight + gapWidth)));
    rotatedItemsPerCol = Math.floor((printableHeight + gapWidth) / (productWithBleedWidth + gapWidth));
    rotatedCount = rotatedItemsPerRow * rotatedItemsPerCol;
  } else if (isShoppingBag) {
    // Special handling for shopping bags - force specific fitment targets
    console.log('🛍️ Calculating shopping bag layout with target fitment');
    
    // Determine target fitment based on bag size
    let targetBagsPerRow, targetBagsPerCol;
    
    if (outputWidth <= 60) {
      // Small bag: target 3 pieces per sheet (vertical: 1x3)
      targetBagsPerRow = 1;
      targetBagsPerCol = 3;
    } else {
      // Medium/Large bag: target 2 pieces per sheet (vertical: 1x2)
      targetBagsPerRow = 1;
      targetBagsPerCol = 2;
    }
    
    // Calculate required dimensions per bag to achieve target fitment
    const requiredWidthPerBag = (printableWidth - (targetBagsPerRow - 1) * gapWidth) / targetBagsPerRow;
    const requiredHeightPerBag = (printableHeight - (targetBagsPerCol - 1) * gapWidth) / targetBagsPerCol;
    
    // Check if current bag dimensions fit the target
    const fitsTargetWidth = productWithBleedWidth <= requiredWidthPerBag;
    const fitsTargetHeight = productWithBleedHeight <= requiredHeightPerBag;
    
    // For shopping bags, always use target fitment regardless of calculated fitment
    // This ensures we get the desired number of bags per sheet
    normalItemsPerRow = targetBagsPerRow;
    normalItemsPerCol = targetBagsPerCol;
    normalCount = normalItemsPerRow * normalItemsPerCol;
    
    console.log('🛍️ Shopping bag forced target fitment:', {
      targetBagsPerRow,
      targetBagsPerCol,
      normalCount,
      note: 'Forced target fitment for shopping bags'
    });
    
    // Try rotated orientation
    rotatedItemsPerRow = Math.floor((printableWidth + gapWidth) / (productWithBleedHeight + gapWidth));
    rotatedItemsPerCol = Math.floor((printableHeight + gapWidth) / (productWithBleedWidth + gapWidth));
    rotatedCount = rotatedItemsPerRow * rotatedItemsPerCol;
    
    console.log('🛍️ Shopping bag layout results:', {
      bagSize: outputWidth <= 60 ? 'Small' : 'Medium/Large',
      targetFitment: { rows: targetBagsPerRow, cols: targetBagsPerCol },
      requiredDimensions: { width: requiredWidthPerBag, height: requiredHeightPerBag },
      actualDimensions: { width: productWithBleedWidth, height: productWithBleedHeight },
      fitsTarget: { width: fitsTargetWidth, height: fitsTargetHeight },
      normal: { rows: normalItemsPerRow, cols: normalItemsPerCol, total: normalCount },
      rotated: { rows: rotatedItemsPerRow, cols: rotatedItemsPerCol, total: rotatedCount }
    });
  } else {
    // Normal calculation for other products
    normalItemsPerRow = Math.floor((printableWidth + gapWidth) / (productWithBleedWidth + gapWidth));
    normalItemsPerCol = Math.floor((printableHeight + gapWidth) / (productWithBleedHeight + gapWidth));
    normalCount = normalItemsPerRow * normalItemsPerCol;

  // Rotated orientation (swap width/height)
    rotatedItemsPerRow = Math.floor((printableWidth + gapWidth) / (productWithBleedHeight + gapWidth));
    rotatedItemsPerCol = Math.floor((printableHeight + gapWidth) / (productWithBleedWidth + gapWidth));
    rotatedCount = rotatedItemsPerRow * rotatedItemsPerCol;
  }
  
  console.log('🔍 computeLayout RESULTS:', {
    isSmallCup,
    normalItemsPerRow,
    normalItemsPerCol,
    normalCount,
    rotatedItemsPerRow,
    rotatedItemsPerCol,
    rotatedCount
  });
  

  // Choose the better orientation
  let orientation: 'normal' | 'rotated';
  let itemsPerRow: number;
  let itemsPerCol: number;
  let itemsPerSheet: number;

  if (normalCount >= rotatedCount) {
    orientation = 'normal';
    itemsPerRow = normalItemsPerRow;
    itemsPerCol = normalItemsPerCol;
    itemsPerSheet = normalCount;
  } else {
    orientation = 'rotated';
    itemsPerRow = rotatedItemsPerRow;
    itemsPerCol = rotatedItemsPerCol;
    itemsPerSheet = rotatedCount;
  }

  // Calculate efficiency
  const totalProductArea = itemsPerSheet * outputWidth * outputHeight;
  const totalSheetArea = inputWidth * inputHeight;
  const efficiency = (totalProductArea / totalSheetArea) * 100;

  const result = {
    usableW: printableWidth,
    usableH: printableHeight,
    itemsPerSheet,
    efficiency: Math.min(100, efficiency),
    orientation,
    itemsPerRow,
    itemsPerCol,
    productShape: 'rectangular' as ProductShape
  };
  
  
  return result;
}

/**
 * Enhanced multi-sheet visualization showing total sheets needed with premium quality
 */
function drawPrintingPattern(
  canvas: HTMLCanvasElement,
  layout: ReturnType<typeof computeLayout>,
  inputWidth: number | null,
  inputHeight: number | null,
  actualSheetsNeeded: number,
  outputWidth: number | null,
  outputHeight: number | null
) {
  if (!inputWidth || !inputHeight || layout.itemsPerSheet === 0 || !outputWidth || !outputHeight) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Set high DPI for crisp rendering
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  
  // Ensure canvas dimensions are properly set for mobile
  const canvasWidth = Math.max(rect.width, 200); // Minimum width for mobile
  const canvasHeight = Math.max(rect.height, 150); // Minimum height for mobile
  
  canvas.width = canvasWidth * dpr;
  canvas.height = canvasHeight * dpr;
  ctx.scale(dpr, dpr);
  canvas.style.width = canvasWidth + 'px';
  canvas.style.height = canvasHeight + 'px';

  // Enable ultra-high-quality rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Clear with premium background gradient
  const bgGradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
  bgGradient.addColorStop(0, '#f8fafc');
  bgGradient.addColorStop(1, '#f1f5f9');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Calculate scaling to fit ONE sheet with maximum size and proper centering
  const padding = Math.min(20, Math.max(15, canvasWidth * 0.05)); // Responsive padding based on canvas size
  const canvasUsableWidth = canvasWidth - 2 * padding;
  const canvasUsableHeight = canvasHeight - 2 * padding;
  
  // Calculate scaling to fit ONE sheet with maximum size and proper centering
  const scaleX = canvasUsableWidth / inputWidth;
  const scaleY = canvasUsableHeight / inputHeight;
  const scale = Math.min(scaleX, scaleY) * 0.85; // 85% of max size for better mobile fit
  
  const scaledSheetWidth = inputWidth * scale;
  const scaledSheetHeight = inputHeight * scale;
  
  // Center the single sheet in the canvas
  const startX = (canvasWidth - scaledSheetWidth) / 2;
  const startY = (canvasHeight - scaledSheetHeight) / 2;

  // Draw professional background grid
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.06)';
  ctx.lineWidth = 0.5;
  const gridSize = 20;
  for (let x = 0; x < canvasWidth; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvasHeight);
    ctx.stroke();
  }
  for (let y = 0; y < canvasHeight; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvasWidth, y);
    ctx.stroke();
  }

  // Draw ONE sheet instead of multiple sheets in a grid
  // Draw sheet shadow (multiple layers for depth)
  ctx.shadowColor = 'rgba(0, 0, 0, 0.04)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 10;

  // Sheet background with subtle gradient
  const sheetGradient = ctx.createLinearGradient(startX, startY, startX, startY + scaledSheetHeight);
  sheetGradient.addColorStop(0, '#ffffff');
  sheetGradient.addColorStop(1, '#fefefe');
  ctx.fillStyle = sheetGradient;
  ctx.fillRect(startX, startY, scaledSheetWidth, scaledSheetHeight);

  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Premium sheet border
  const borderGradient = ctx.createLinearGradient(startX, startY, startX + scaledSheetWidth, startY + scaledSheetHeight);
  borderGradient.addColorStop(0, '#1e40af');
  borderGradient.addColorStop(0.5, '#3b82f6');
  borderGradient.addColorStop(1, '#6366f1');
  
  ctx.strokeStyle = borderGradient;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeRect(startX + 1.5, startY + 1.5, scaledSheetWidth - 3, scaledSheetHeight - 3);

  // Inner highlight border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 1;
  ctx.strokeRect(startX + 3, startY + 3, scaledSheetWidth - 6, scaledSheetHeight - 6);

  // Calculate item dimensions based on orientation (exactly like HTML)
  let currentItemWidth = outputWidth;
  let currentItemHeight = outputHeight;

  if (layout.orientation === 'rotated') {
    currentItemWidth = outputHeight;
    currentItemHeight = outputWidth;
  }

  const scaledItemWidth = currentItemWidth * scale;
  const scaledItemHeight = currentItemHeight * scale;

  // Draw items on the single sheet (exactly matching HTML logic)
  const itemsPerRow = layout.itemsPerRow;
  const itemsPerCol = layout.itemsPerCol;

  // Enhanced item rendering on the single sheet
  for (let row = 0; row < itemsPerCol; row++) {
    for (let col = 0; col < itemsPerRow; col++) {
      const x = startX + col * scaledItemWidth;
      const y = startY + row * scaledItemHeight;
      
      // Item background with sophisticated gradient
      const itemGradient = ctx.createRadialGradient(
        x + scaledItemWidth / 2, y + scaledItemHeight / 2, 0,
        x + scaledItemWidth / 2, y + scaledItemHeight / 2, Math.max(scaledItemWidth, scaledItemHeight) / 2
      );
      
      if (layout.orientation === 'rotated') {
        itemGradient.addColorStop(0, 'rgba(139, 92, 246, 0.18)');
        itemGradient.addColorStop(0.7, 'rgba(139, 92, 246, 0.08)');
        itemGradient.addColorStop(1, 'rgba(139, 92, 246, 0.02)');
      } else {
        itemGradient.addColorStop(0, 'rgba(59, 130, 246, 0.18)');
        itemGradient.addColorStop(0.7, 'rgba(59, 130, 246, 0.08)');
        itemGradient.addColorStop(1, 'rgba(59, 130, 246, 0.02)');
      }

      ctx.fillStyle = itemGradient;
      ctx.fillRect(x + 1, y + 1, scaledItemWidth - 2, scaledItemHeight - 2);
      
      // Item border
      ctx.strokeStyle = layout.orientation === 'rotated' ? 'rgba(139, 92, 246, 0.5)' : 'rgba(59, 130, 246, 0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 1, y + 1, scaledItemWidth - 2, scaledItemHeight - 2);
      
      // Premium highlight effect
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(x + 2, y + 2, scaledItemWidth - 4, 1.5);
      
      // Corner accent for larger items
      if (scaledItemWidth > 12 && scaledItemHeight > 12) {
        ctx.fillStyle = layout.orientation === 'rotated' ? 'rgba(139, 92, 246, 0.7)' : 'rgba(59, 130, 246, 0.7)';
        ctx.fillRect(x + scaledItemWidth - 6, y + 2, 4, 4);
      }
    }
  }

  // Professional dimension labels (exactly like HTML but enhanced)
  ctx.fillStyle = '#374151';
  ctx.font = 'bold 12px Inter, system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Width dimension line and label
  ctx.strokeStyle = '#6b7280';
  ctx.lineWidth = 2;
  ctx.setLineDash([3, 3]);
  
  const dimensionLineY = startY + scaledSheetHeight + 25;
  ctx.beginPath();
  ctx.moveTo(startX, dimensionLineY);
  ctx.lineTo(startX + scaledSheetWidth, dimensionLineY);
  ctx.stroke();
  
  // Width tick marks
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(startX, dimensionLineY - 5);
  ctx.lineTo(startX, dimensionLineY + 5);
  ctx.moveTo(startX + scaledSheetWidth, dimensionLineY - 5);
  ctx.lineTo(startX + scaledSheetWidth, dimensionLineY + 5);
  ctx.stroke();

  // Width label with background
  const widthText = `${inputWidth.toFixed(1)}cm`;
  const widthMetrics = ctx.measureText(widthText);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.fillRect(
    startX + scaledSheetWidth / 2 - widthMetrics.width / 2 - 8,
    dimensionLineY + 8,
    widthMetrics.width + 16,
    20
  );
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(
    startX + scaledSheetWidth / 2 - widthMetrics.width / 2 - 8,
    dimensionLineY + 8,
    widthMetrics.width + 16,
    20
  );
  
  ctx.fillStyle = '#374151';
  ctx.fillText(widthText, startX + scaledSheetWidth / 2, dimensionLineY + 18);

  // Height dimension line and label
  ctx.save();
  ctx.translate(startX - 25, startY + scaledSheetHeight / 2);
  ctx.rotate(-Math.PI / 2);
  
  ctx.strokeStyle = '#6b7280';
  ctx.lineWidth = 2;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(-scaledSheetHeight / 2, 0);
  ctx.lineTo(scaledSheetHeight / 2, 0);
  ctx.stroke();
  
  // Height tick marks
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(-scaledSheetHeight / 2, -5);
  ctx.lineTo(-scaledSheetHeight / 2, 5);
  ctx.moveTo(scaledSheetHeight / 2, -5);
  ctx.lineTo(scaledSheetHeight / 2, 5);
  ctx.stroke();

  // Height label with background
  const heightText = `${inputHeight.toFixed(1)}cm`;
  const heightMetrics = ctx.measureText(heightText);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.fillRect(-heightMetrics.width / 2 - 8, -18, heightMetrics.width + 16, 20);
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(-heightMetrics.width / 2 - 8, -18, heightMetrics.width + 16, 20);
  
  ctx.fillStyle = '#374151';
  ctx.fillText(heightText, 0, -8);
  ctx.restore();





  // Sheet information overlay for single sheet display
  if (actualSheetsNeeded > 1) {
    ctx.fillStyle = 'rgba(59, 130, 246, 0.9)';
    ctx.font = 'bold 12px Inter, system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    
    const infoText = `Layout for 1 of ${actualSheetsNeeded} sheets (same pattern)`;
    const infoMetrics = ctx.measureText(infoText);
    
    // Info background
    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
    ctx.fillRect(
      canvasWidth - infoMetrics.width - 15,
      35,
      infoMetrics.width + 10,
      18
    );
    
    ctx.fillStyle = 'rgba(59, 130, 246, 0.9)';
    ctx.fillText(infoText, canvasWidth - 10, 37);
  }

  // Orientation indicator (if rotated)
  if (layout.orientation === 'rotated') {
    ctx.fillStyle = 'rgba(139, 92, 246, 0.9)';
    ctx.font = 'bold 11px Inter, system-ui, -apple-system, sans-serif';
    const rotatedText = '↻ Items are rotated for optimal fit';
    const rotatedMetrics = ctx.measureText(rotatedText);
    
    // Rotated indicator background
    ctx.fillStyle = 'rgba(139, 92, 246, 0.1)';
    ctx.fillRect(
      startX + scaledSheetWidth - rotatedMetrics.width - 10,
      startY + 5,
      rotatedMetrics.width + 10,
      18
    );
    
    ctx.fillStyle = 'rgba(139, 92, 246, 0.9)';
    ctx.textAlign = 'left';
    ctx.fillText(rotatedText, startX + scaledSheetWidth - rotatedMetrics.width - 5, startY + 14);
  }
}

/**
 * Draw cutting layout visualization showing how the large input sheet is cut
 */
function drawCuttingLayout(
  canvas: HTMLCanvasElement,
  inputWidth: number,
  inputHeight: number,
  machineMaxWidth: number,
  machineMaxHeight: number
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Set high DPI for crisp rendering
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';

  // Clear with premium background
  const bgGradient = ctx.createLinearGradient(0, 0, rect.width, rect.height);
  bgGradient.addColorStop(0, '#f8fafc');
  bgGradient.addColorStop(1, '#f1f5f9');
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
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.06)';
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
  ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
  ctx.shadowBlur = 25;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 15;

  // Input sheet background
  const sheetGradient = ctx.createLinearGradient(startX, startY, startX, startY + scaledSheetHeight);
  sheetGradient.addColorStop(0, '#ffffff');
  sheetGradient.addColorStop(1, '#f8fafc');
  ctx.fillStyle = sheetGradient;
  ctx.fillRect(startX, startY, scaledSheetWidth, scaledSheetHeight);

  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Input sheet border
  ctx.strokeStyle = '#1e40af';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeRect(startX + 2, startY + 2, scaledSheetWidth - 4, scaledSheetHeight - 4);

  // Calculate cutting lines
  const cutPieces = calculateCutPieces(inputWidth, inputHeight, machineMaxWidth, machineMaxHeight);
  
  // Draw cutting lines
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 4]);
  
  // Vertical cutting lines
  cutPieces.verticalCuts.forEach(cutX => {
    const scaledCutX = startX + (cutX * scale);
    ctx.beginPath();
    ctx.moveTo(scaledCutX, startY);
    ctx.lineTo(scaledCutX, startY + scaledSheetHeight);
    ctx.stroke();
  });
  
  // Horizontal cutting lines
  cutPieces.horizontalCuts.forEach(cutY => {
    const scaledCutY = startY + (cutY * scale);
    ctx.beginPath();
    ctx.moveTo(startX, scaledCutY);
    ctx.lineTo(startX + scaledSheetWidth, scaledCutY);
    ctx.stroke();
  });

  // Reset line dash
  ctx.setLineDash([]);

  // Draw cut piece labels
  ctx.fillStyle = '#dc2626';
  ctx.font = 'bold 11px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  cutPieces.pieces.forEach((piece, index) => {
    const pieceX = startX + (piece.x * scale);
    const pieceY = startY + (piece.y * scale);
    const pieceWidth = piece.width * scale;
    const pieceHeight = piece.height * scale;
    
    // Piece number
    ctx.fillStyle = 'rgba(220, 38, 38, 0.9)';
    ctx.fillText(`${index + 1}`, pieceX + pieceWidth / 2, pieceY + pieceHeight / 2);
    
    // Piece dimensions
    ctx.fillStyle = 'rgba(220, 38, 38, 0.7)';
    ctx.font = '10px Inter, system-ui, sans-serif';
    ctx.fillText(`${piece.width.toFixed(1)}×${piece.height.toFixed(1)}`, pieceX + pieceWidth / 2, pieceY + pieceHeight / 2 + 15);
  });

  // Draw dimension labels
  ctx.fillStyle = '#374151';
  ctx.font = 'bold 12px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Width dimension
  const widthText = `${inputWidth.toFixed(1)}cm`;
  const widthY = startY + scaledSheetHeight + 25;
  ctx.strokeStyle = '#6b7280';
  ctx.lineWidth = 2;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(startX, widthY);
  ctx.lineTo(startX + scaledSheetWidth, widthY);
  ctx.stroke();
  
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  const widthMetrics = ctx.measureText(widthText);
  ctx.fillRect(
    startX + scaledSheetWidth / 2 - widthMetrics.width / 2 - 8,
    widthY + 8,
    widthMetrics.width + 16,
    20
  );
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(
    startX + scaledSheetWidth / 2 - widthMetrics.width / 2 - 8,
    widthY + 8,
    widthMetrics.width + 16,
    20
  );
  
  ctx.fillStyle = '#374151';
  ctx.fillText(widthText, startX + scaledSheetWidth / 2, widthY + 18);

  // Height dimension
  ctx.save();
  ctx.translate(startX - 25, startY + scaledSheetHeight / 2);
  ctx.rotate(-Math.PI / 2);
  
  const heightText = `${inputHeight.toFixed(1)}cm`;
  ctx.strokeStyle = '#6b7280';
  ctx.lineWidth = 2;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(-scaledSheetHeight / 2, 0);
  ctx.lineTo(scaledSheetHeight / 2, 0);
  ctx.stroke();
  
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  const heightMetrics = ctx.measureText(heightText);
  ctx.fillRect(-heightMetrics.width / 2 - 8, -18, heightMetrics.width + 16, 20);
  
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(-heightMetrics.width / 2 - 8, -18, heightMetrics.width + 16, 20);
  
  ctx.fillStyle = '#374151';
  ctx.fillText(heightText, 0, -8);
  ctx.restore();

  // Cutting information overlay
  ctx.fillStyle = 'rgba(220, 38, 38, 0.9)';
  ctx.font = 'bold 12px Inter, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  
  const infoText = `Cutting Layout: ${cutPieces.pieces.length} pieces`;
  const infoMetrics = ctx.measureText(infoText);
  
  ctx.fillStyle = 'rgba(220, 38, 38, 0.1)';
  ctx.fillRect(10, 10, infoMetrics.width + 10, 18);
  
  ctx.fillStyle = 'rgba(220, 38, 38, 0.9)';
  ctx.fillText(infoText, 15, 12);
}


function createRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// Professional visualization drawing function with HD resolution
function drawProfessionalVisualization(
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
  console.log('🎨 drawProfessionalVisualization called:', {
    productName: productData?.productName,
    bagPreset: productData?.bagPreset,
    layout: layout ? {
      itemsPerRow: layout.itemsPerRow,
      itemsPerCol: layout.itemsPerCol,
      itemsPerSheet: layout.itemsPerSheet
    } : 'null',
    visualizationType
  });
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Set HD resolution
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const canvasWidth = rect.width;
  const canvasHeight = rect.height;
  
  canvas.width = canvasWidth * dpr;
  canvas.height = canvasHeight * dpr;
  ctx.scale(dpr, dpr);
  canvas.style.width = canvasWidth + 'px';
  canvas.style.height = canvasHeight + 'px';

  // Clear canvas with professional background
  const bgGradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
  bgGradient.addColorStop(0, '#f8fafc');
  bgGradient.addColorStop(1, '#f1f5f9');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Enable ultra-high-quality rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Calculate scaling and positioning
  const padding = Math.min(40, Math.max(30, canvasWidth * 0.08));
  const canvasUsableWidth = canvasWidth - 2 * padding;
  const canvasUsableHeight = canvasHeight - 2 * padding;

  if (visualizationType === 'cut') {
    // CUT VIEW: Show how to slice parent sheet into press sheets (35×50)
    drawCutView(ctx, canvasWidth, canvasHeight, canvasUsableWidth, canvasUsableHeight, 
                parentSheetWidth || 100, parentSheetHeight || 70, 
                35, 50); // Fixed press sheet size: 35×50
  } else if (visualizationType === 'print') {
    // PRINT VIEW: Show products on press sheet (35×50)
    drawPrintView(ctx, canvasWidth, canvasHeight, canvasUsableWidth, canvasUsableHeight,
                  35, 50, layout, settings, productData, formData, productIndex); // Fixed press sheet size: 35×50
  } else if (visualizationType === 'gripper') {
    // GRIPPER VIEW: Show pressman's view with gripper area on press sheet (35×50)
    drawGripperView(ctx, canvasWidth, canvasHeight, canvasUsableWidth, canvasUsableHeight,
                    35, 50, layout, settings, productData, formData, productIndex); // Fixed press sheet size: 35×50
  }
}

// CUT VIEW: Shows how to slice parent sheet into press sheets
function drawCutView(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number, 
                     canvasUsableWidth: number, canvasUsableHeight: number,
                     parentWidth: number, parentHeight: number, 
                     pressWidth: number, pressHeight: number) {
  
  // Calculate how many press sheets fit in parent sheet
  const piecesPerRow = Math.floor(parentWidth / pressWidth);
  const piecesPerCol = Math.floor(parentHeight / pressHeight);
  const totalPieces = piecesPerRow * piecesPerCol;
  
  // Calculate scaling to fit parent sheet in canvas
  const scaleX = canvasUsableWidth / parentWidth;
  const scaleY = canvasUsableHeight / parentHeight;
  const scale = Math.min(scaleX, scaleY) * 0.9;
  
  const scaledParentWidth = parentWidth * scale;
  const scaledParentHeight = parentHeight * scale;
  const scaledPressWidth = pressWidth * scale;
  const scaledPressHeight = pressHeight * scale;
  
  const startX = (canvasWidth - scaledParentWidth) / 2;
  const startY = (canvasHeight - scaledParentHeight) / 2 + 50; // Add offset for title space

  // Draw parent sheet (100×70)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(startX, startY, scaledParentWidth, scaledParentHeight);
  
  ctx.strokeStyle = '#1e40af';
  ctx.lineWidth = 3;
  ctx.strokeRect(startX, startY, scaledParentWidth, scaledParentHeight);

  // Draw press sheet cut pieces
  ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2;
  
  for (let row = 0; row < piecesPerCol; row++) {
    for (let col = 0; col < piecesPerRow; col++) {
      const x = startX + col * scaledPressWidth;
      const y = startY + row * scaledPressHeight;
      
      ctx.fillRect(x, y, scaledPressWidth, scaledPressHeight);
      ctx.strokeRect(x, y, scaledPressWidth, scaledPressHeight);
    }
  }

  // Draw cut lines
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  
  // Vertical cut lines
  for (let i = 1; i < piecesPerRow; i++) {
    ctx.beginPath();
    ctx.moveTo(startX + i * scaledPressWidth, startY);
    ctx.lineTo(startX + i * scaledPressWidth, startY + scaledParentHeight);
    ctx.stroke();
  }
  
  // Horizontal cut lines
  for (let i = 1; i < piecesPerCol; i++) {
    ctx.beginPath();
    ctx.moveTo(startX, startY + i * scaledPressHeight);
    ctx.lineTo(startX + scaledParentWidth, startY + i * scaledPressHeight);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Professional layout with proper text positioning
  // Responsive sizing based on canvas width
  const isMobile = canvasWidth < 768;
  const isTablet = canvasWidth >= 768 && canvasWidth < 1024;
  
  // Title positioned above the sheet with proper spacing (responsive font size)
  ctx.fillStyle = '#111827';
  const mainTitleFontSize = isMobile ? '16px' : isTablet ? '18px' : '20px';
  ctx.font = `bold ${mainTitleFontSize} Inter, system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('Cutting Operations', canvasWidth / 2, startY - 80);
  
  // Subtitle with proper spacing from title (responsive font size)
  ctx.fillStyle = '#6b7280';
  const subtitleFontSize = isMobile ? '11px' : isTablet ? '12px' : '14px';
  ctx.font = `${subtitleFontSize} Inter, system-ui, sans-serif`;
  ctx.fillText(`Parent ${parentWidth}×${parentHeight} → Press ${pressWidth}×${pressHeight}`, canvasWidth / 2, startY - 55);
  
  // Information panels positioned outside the parent sheet area
  
  const panelWidth = isMobile ? Math.min(140, canvasWidth * 0.35) : 
                     isTablet ? Math.min(160, canvasWidth * 0.25) : 180;
  const panelHeight = isMobile ? 100 : isTablet ? 110 : 120;
  const panelSpacing = isMobile ? 10 : isTablet ? 15 : 20;
  
  // Check if panels fit on screen, if not, position them below the sheet
  const leftPanelFits = (startX - panelWidth - panelSpacing) > 0;
  const rightPanelFits = (startX + scaledParentWidth + panelSpacing + panelWidth) < canvasWidth;
  
  // Left panel - Specifications (responsive positioning)
  const leftPanelX = leftPanelFits ? startX - panelWidth - panelSpacing : 
                     startX + scaledParentWidth / 2 - panelWidth / 2;
  const leftPanelY = leftPanelFits ? startY + 20 : startY + scaledParentHeight + 30;
  
  // Panel background with transparency
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.fillRect(leftPanelX, leftPanelY, panelWidth, panelHeight);
  
  // Panel border
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.strokeRect(leftPanelX, leftPanelY, panelWidth, panelHeight);
  
  // Panel header
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(leftPanelX, leftPanelY, panelWidth, 30);
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.strokeRect(leftPanelX, leftPanelY, panelWidth, 30);
  
  // Panel title (responsive font size)
  ctx.fillStyle = '#111827';
  const titleFontSize = isMobile ? '10px' : isTablet ? '11px' : '12px';
  ctx.font = `bold ${titleFontSize} Inter, system-ui, sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText('Specifications', leftPanelX + 8, leftPanelY + 20);
  
  // Specifications list (responsive font size)
  ctx.fillStyle = '#374151';
  const textFontSize = isMobile ? '8px' : isTablet ? '9px' : '10px';
  ctx.font = `${textFontSize} Inter, system-ui, sans-serif`;
  const specs = [
    `Parent: ${parentWidth}×${parentHeight} cm`,
    `Press: ${pressWidth}×${pressHeight} cm`,
    `Cut Pieces: ${totalPieces} pieces`,
    `Layout: ${piecesPerRow}×${piecesPerCol} grid`,
    `Efficiency: ${((totalPieces * pressWidth * pressHeight) / (parentWidth * parentHeight) * 100).toFixed(1)}%`
  ];
  
  specs.forEach((spec, index) => {
    ctx.fillText(spec, leftPanelX + 8, leftPanelY + 45 + (index * 12));
  });
  
  // Right panel - Yield Analysis (responsive positioning)
  const rightPanelX = rightPanelFits ? startX + scaledParentWidth + panelSpacing : 
                      leftPanelFits ? startX + scaledParentWidth / 2 - panelWidth / 2 :
                      startX + scaledParentWidth / 2 - panelWidth / 2;
  const rightPanelY = rightPanelFits ? startY + 20 : 
                      leftPanelFits ? startY + scaledParentHeight + 30 :
                      startY + scaledParentHeight + 150;
  
  // Panel background with transparency
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.fillRect(rightPanelX, rightPanelY, panelWidth, panelHeight);
  
  // Panel border
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.strokeRect(rightPanelX, rightPanelY, panelWidth, panelHeight);
  
  // Panel header with yield theme
  ctx.fillStyle = '#eff6ff';
  ctx.fillRect(rightPanelX, rightPanelY, panelWidth, 30);
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.strokeRect(rightPanelX, rightPanelY, panelWidth, 30);
  
  // Panel title (responsive font size)
  ctx.fillStyle = '#1e40af';
  ctx.font = `bold ${titleFontSize} Inter, system-ui, sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText('Yield Analysis', rightPanelX + 8, rightPanelY + 20);
  
  // Yield details (responsive font size)
  ctx.fillStyle = '#1e3a8a';
  ctx.font = `${textFontSize} Inter, system-ui, sans-serif`;
  const yieldData = [
    `Total Pieces: ${totalPieces}`,
    `Per Row: ${piecesPerRow}`,
    `Per Column: ${piecesPerCol}`,
    `Waste: ${(100 - ((totalPieces * pressWidth * pressHeight) / (parentWidth * parentHeight) * 100)).toFixed(1)}%`
  ];
  
  yieldData.forEach((data, index) => {
    ctx.fillText(data, rightPanelX + 8, rightPanelY + 45 + (index * 12));
  });
}

// PRINT VIEW: Shows how many products fit on one press sheet
function drawPrintView(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number,
                       canvasUsableWidth: number, canvasUsableHeight: number,
                       pressWidth: number, pressHeight: number, layout: any, settings: any, productData: any, formData?: any, productIndex?: number) {
  
  // Calculate printable area (after margins and gripper)
  const gripperWidth = settings.gripperWidth || 0.9;
  const edgeMargin = 0.5;
  const printableWidth = pressWidth - (2 * edgeMargin);
  const printableHeight = pressHeight - gripperWidth - (2 * edgeMargin);
  
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
  ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
  ctx.fillRect(startX, startY, scaledPressWidth, scaledPressHeight);
  
  // Draw press sheet border (thicker to emphasize it's the main container)
  ctx.strokeStyle = '#1f2937';
  ctx.lineWidth = 4;
  ctx.strokeRect(startX, startY, scaledPressWidth, scaledPressHeight);

  // Add press sheet dimensions label
  ctx.fillStyle = 'rgba(31, 41, 55, 0.9)';
  ctx.font = 'bold 12px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${pressWidth}×${pressHeight} cm`, startX + scaledPressWidth / 2, startY - 15);

  // Draw gripper area
  ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
  ctx.fillRect(startX, startY, scaledPressWidth, scaledGripperWidth);
  
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.strokeRect(startX, startY, scaledPressWidth, scaledGripperWidth);
  ctx.setLineDash([]);

  // Draw printable area (dashed border)
  const printableX = startX + scaledEdgeMargin;
  const printableY = startY + scaledGripperWidth + scaledEdgeMargin;
  const printableW = scaledPressWidth - (2 * scaledEdgeMargin);
  const printableH = scaledPressHeight - scaledGripperWidth - (2 * scaledEdgeMargin);
  
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.strokeRect(printableX, printableY, printableW, printableH);
  ctx.setLineDash([]);

  // Draw products in printable area using actual Step 3 dimensions
  const currentProduct = formData?.products?.[productIndex || 0];
  const productName = currentProduct?.productName || 'business-cards';
  const productConfig = getProductConfig(productName);
  
  // For shopping bags, use the total dieline dimensions instead of individual panel dimensions
  let productWidth, productHeight;
  if (productName === 'Shopping Bag' && currentProduct?.bagPreset) {
    const bagPreset = getShoppingBagPreset(currentProduct.bagPreset);
    if (bagPreset) {
      const W = bagPreset.width;   // Individual panel width
      const H = bagPreset.height;  // Individual panel height
      const G = bagPreset.gusset;  // Gusset width
      const T = Math.max(3, W * 0.12); // Top hem (proportional)
      const B = Math.max(6, W * 0.25); // Bottom flaps (proportional)
      const glueFlap = 2; // Fixed glue flap width
      
      // Calculate total dieline dimensions (same as in layout calculation)
      productWidth = W + G + W + G + glueFlap; // Back + Gusset + Front + Gusset + Glue
      productHeight = T + H + B; // Top hem + Body height + Bottom flaps
      
      console.log('🛍️ Visualization using shopping bag dieline dimensions:', {
        bagPreset: currentProduct.bagPreset,
        individualPanel: { W, H, G },
        totalDieline: { width: productWidth, height: productHeight }
      });
    } else {
      productWidth = currentProduct?.flatSize?.width || productConfig?.defaultSizes?.width || 9;
      productHeight = currentProduct?.flatSize?.height || productConfig?.defaultSizes?.height || 5.5;
    }
  } else {
    productWidth = currentProduct?.flatSize?.width || productConfig?.defaultSizes?.width || 9;
    productHeight = currentProduct?.flatSize?.height || productConfig?.defaultSizes?.height || 5.5;
  }
  // Fixed default values as requested by client
  const bleedWidth = 0.3;
  const gapWidth = 0.5;
  
  // Calculate safety gap for proper spacing
  const safetyGap = 0.5; // 0.5cm safety gap around each object
  const productWithSafetyWidth = productWidth + (2 * bleedWidth) + (2 * safetyGap);
  const productWithSafetyHeight = productHeight + (2 * bleedWidth) + (2 * safetyGap);
  
  let scaledProductWidth = productWithSafetyWidth * scale;
  let scaledProductHeight = productWithSafetyHeight * scale;
  const scaledBleedWidth = bleedWidth * scale;
  const scaledGapWidth = gapWidth * scale;
  const scaledSafetyGap = safetyGap * scale;

  // Calculate total grid width and height to center the products
  const totalGridWidth = layout.itemsPerRow * scaledProductWidth + (layout.itemsPerRow - 1) * scaledGapWidth;
  const totalGridHeight = layout.itemsPerCol * scaledProductHeight + (layout.itemsPerCol - 1) * scaledGapWidth;
  
  // Special positioning for shopping bags - fill the printable area with proper spacing
  let gridStartX, gridStartY;
  if (productName === 'Shopping Bag') {
    // For shopping bags, use full printable width and distribute height evenly
    gridStartX = printableX; // Start at left edge of printable area
    gridStartY = printableY; // Start at top edge of printable area (after gripper)
    
    // Recalculate dimensions to fill the available space
    const availableWidth = printableW;
    const availableHeight = printableH;
    const gapBetweenBags = scaledGapWidth;
    
    // Calculate dimensions per bag to fill the available space
    const bagWidth = (availableWidth - (layout.itemsPerRow - 1) * gapBetweenBags) / layout.itemsPerRow;
    const bagHeight = (availableHeight - (layout.itemsPerCol - 1) * gapBetweenBags) / layout.itemsPerCol;
    
    // Update scaled dimensions for shopping bags
    scaledProductWidth = bagWidth;
    scaledProductHeight = bagHeight;
    
    console.log('🛍️ Shopping bag positioning:', {
      printableArea: { width: printableW, height: printableH },
      layout: { rows: layout.itemsPerCol, cols: layout.itemsPerRow },
      bagDimensions: { width: bagWidth, height: bagHeight },
      gapBetweenBags: gapBetweenBags
    });
  } else {
    // Center the grid within the printable area for other products
    gridStartX = printableX + (printableW - totalGridWidth) / 2;
    gridStartY = printableY + (printableH - totalGridHeight) / 2;
  }

  // Draw individual products with proper spacing (centered, no offset)
  for (let row = 0; row < layout.itemsPerCol; row++) {
    for (let col = 0; col < layout.itemsPerRow; col++) {
      let x = gridStartX + col * (scaledProductWidth + scaledGapWidth);
      let y = gridStartY + row * (scaledProductHeight + scaledGapWidth);
      
      // Determine product shape for proper rendering
      const currentProduct = formData?.products?.[productIndex || 0];
      const productName = currentProduct?.productName || 'business-cards';
      const productShape = productName === 'Cups' ? 'circular' : 
                         productName === 'Shopping Bag' ? 'complex-3d' : 'rectangular';
      
      // No individual position adjustments needed - grid layout handles positioning correctly
      
      const actualProductWidth = currentProduct?.flatSize?.width || productConfig?.defaultSizes?.width || 9;
      const actualProductHeight = currentProduct?.flatSize?.height || productConfig?.defaultSizes?.height || 5.5;

      if (productShape === 'rectangular') {
        if (settings.showBleed) {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.18)';
          ctx.fillRect(
            x - scaledBleedWidth,
            y - scaledBleedWidth,
            scaledProductWidth + (2 * scaledBleedWidth),
            scaledProductHeight + (2 * scaledBleedWidth)
          );
        }
        drawProductShape(ctx, x, y, scaledProductWidth, scaledProductHeight, 'rectangular', settings, currentProduct);
      } else if (productShape === 'circular') {
        drawCircularProduct(ctx, x, y, scaledProductWidth, scaledProductHeight, settings, productData, row, col, currentProduct);
      } else {
        drawComplex3DProduct(ctx, x, y, scaledProductWidth, scaledProductHeight, settings, currentProduct);
      }

      if (productShape === 'rectangular') {
        const labelText = `${actualProductWidth.toFixed(1)}×${actualProductHeight.toFixed(1)} cm`;
        ctx.font = 'bold 9px Inter, system-ui, sans-serif';
        const labelWidth = ctx.measureText(labelText).width + 16;
        const labelHeight = 16;
        const labelX = x + scaledProductWidth - labelWidth - 4;
        const labelY = y + 4;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.fillRect(labelX, labelY, labelWidth, labelHeight);
        ctx.fillStyle = '#f8fafc';
        ctx.textAlign = 'center';
        ctx.fillText(labelText, labelX + labelWidth / 2, labelY + 11);
      }
    }
  }

  // Professional layout with proper text positioning
  const orientation = layout.orientation === 'rotated' ? 'Rotated' : 'Normal';
  
  // Responsive sizing based on canvas width
  const isMobile = canvasWidth < 768;
  const isTablet = canvasWidth >= 768 && canvasWidth < 1024;
  
  // Title positioned above the sheet with proper spacing (responsive font size)
  ctx.fillStyle = '#111827';
  const mainTitleFontSize = isMobile ? '16px' : isTablet ? '18px' : '20px';
  ctx.font = `bold ${mainTitleFontSize} Inter, system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('Print Layout', canvasWidth / 2, startY - 80);
  
  // Subtitle with proper spacing from title (responsive font size)
  ctx.fillStyle = '#6b7280';
  const subtitleFontSize = isMobile ? '11px' : isTablet ? '12px' : '14px';
  ctx.font = `${subtitleFontSize} Inter, system-ui, sans-serif`;
  ctx.fillText(`${pressWidth}×${pressHeight} • Yield ${layout.itemsPerSheet} (${layout.itemsPerRow}×${layout.itemsPerCol}) • ${orientation}`, canvasWidth / 2, startY - 55);
  
  // Information panels positioned outside the printable area
  const panelWidth = isMobile ? Math.min(140, canvasWidth * 0.35) : 
                     isTablet ? Math.min(160, canvasWidth * 0.25) : 180;
  const panelHeight = isMobile ? 100 : isTablet ? 110 : 120;
  const panelSpacing = isMobile ? 10 : isTablet ? 15 : 20;
  
  // Check if panels fit on screen, if not, position them below the sheet
  const leftPanelFits = (startX - panelWidth - panelSpacing) > 0;
  const rightPanelFits = (startX + scaledPressWidth + panelSpacing + panelWidth) < canvasWidth;
  
  // Left panel - Sheet Specifications (responsive positioning)
  const leftPanelX = leftPanelFits ? startX - panelWidth - panelSpacing : 
                     startX + scaledPressWidth / 2 - panelWidth / 2;
  const leftPanelY = leftPanelFits ? startY + 20 : startY + scaledPressHeight + 30;
  
  // Panel background with transparency
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.fillRect(leftPanelX, leftPanelY, panelWidth, panelHeight);
  
  // Panel border
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.strokeRect(leftPanelX, leftPanelY, panelWidth, panelHeight);
  
  // Panel header
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(leftPanelX, leftPanelY, panelWidth, 30);
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.strokeRect(leftPanelX, leftPanelY, panelWidth, 30);
  
  // Panel title (responsive font size)
  ctx.fillStyle = '#111827';
  const titleFontSize = isMobile ? '10px' : isTablet ? '11px' : '12px';
  ctx.font = `bold ${titleFontSize} Inter, system-ui, sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText('Sheet Specs', leftPanelX + 8, leftPanelY + 20);
  
  // Specifications list (responsive font size)
  ctx.fillStyle = '#374151';
  const textFontSize = isMobile ? '8px' : isTablet ? '9px' : '10px';
  ctx.font = `${textFontSize} Inter, system-ui, sans-serif`;
  const specs = [
    `Press: ${pressWidth}×${pressHeight} cm`,
    `Printable: ${printableWidth.toFixed(1)}×${printableHeight.toFixed(1)} cm`,
    `Gripper: ${gripperWidth} cm`,
    `Margins: ${edgeMargin} cm`,
    `Orientation: ${orientation}`
  ];
  
  specs.forEach((spec, index) => {
    ctx.fillText(spec, leftPanelX + 8, leftPanelY + 45 + (index * 12));
  });
  
  // Right panel - Product Layout (responsive positioning)
  const rightPanelX = rightPanelFits ? startX + scaledPressWidth + panelSpacing : 
                      leftPanelFits ? startX + scaledPressWidth / 2 - panelWidth / 2 :
                      startX + scaledPressWidth / 2 - panelWidth / 2;
  const rightPanelY = rightPanelFits ? startY + 20 : 
                      leftPanelFits ? startY + scaledPressHeight + 30 :
                      startY + scaledPressHeight + 150;
  
  // Panel background with transparency
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.fillRect(rightPanelX, rightPanelY, panelWidth, panelHeight);
  
  // Panel border
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.strokeRect(rightPanelX, rightPanelY, panelWidth, panelHeight);
  
  // Panel header
  ctx.fillStyle = '#f0f9ff';
  ctx.fillRect(rightPanelX, rightPanelY, panelWidth, 30);
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.strokeRect(rightPanelX, rightPanelY, panelWidth, 30);
  
  // Panel title (responsive font size)
  ctx.fillStyle = '#0369a1';
  ctx.font = `bold ${titleFontSize} Inter, system-ui, sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText('Product Layout', rightPanelX + 8, rightPanelY + 20);
  
  // Product details (responsive font size)
  ctx.fillStyle = '#0c4a6e';
  ctx.font = `${textFontSize} Inter, system-ui, sans-serif`;
  const productSpecs = [
    `Products: ${layout.itemsPerSheet}`,
    `Layout: ${layout.itemsPerRow}×${layout.itemsPerCol}`,
    `Grid: ${layout.itemsPerRow} cols`,
    `Rows: ${layout.itemsPerCol}`,
    `Utilization: ${((layout.itemsPerSheet * productWidth * productHeight) / (printableWidth * printableHeight) * 100).toFixed(1)}%`
  ];
  
  productSpecs.forEach((spec, index) => {
    ctx.fillText(spec, rightPanelX + 8, rightPanelY + 45 + (index * 12));
  });
  
  // Printable area dimensions (bottom center)
  ctx.fillStyle = '#059669';
  ctx.font = 'bold 10px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${printableWidth.toFixed(1)}×${printableHeight.toFixed(1)} cm`, printableX + printableW / 2, printableY + printableH + 20);
}

// GRIPPER VIEW: Shows pressman's view with gripper area
function drawGripperView(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number,
                         canvasUsableWidth: number, canvasUsableHeight: number,
                         pressWidth: number, pressHeight: number, layout: any, settings: any, productData: any, formData?: any, productIndex?: number) {
  
  // Same as print view but with gripper area highlighted
  const gripperWidth = settings.gripperWidth || 0.9;
  const edgeMargin = 0.5;
  const printableWidth = pressWidth - (2 * edgeMargin);
  const printableHeight = pressHeight - gripperWidth - (2 * edgeMargin);
  
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
  ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
  ctx.fillRect(startX, startY, scaledPressWidth, scaledPressHeight);
  
  // Draw press sheet border (thicker to emphasize it's the main container)
  ctx.strokeStyle = '#1f2937';
  ctx.lineWidth = 4;
  ctx.strokeRect(startX, startY, scaledPressWidth, scaledPressHeight);

  // Add press sheet dimensions label
  ctx.fillStyle = 'rgba(31, 41, 55, 0.9)';
  ctx.font = 'bold 12px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${pressWidth}×${pressHeight} cm`, startX + scaledPressWidth / 2, startY - 15);

  // Draw gripper area (shaded)
  ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
  ctx.fillRect(startX, startY, scaledPressWidth, scaledGripperWidth);
  
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 8]);
  ctx.strokeRect(startX, startY, scaledPressWidth, scaledGripperWidth);
  ctx.setLineDash([]);

  // Draw safe printable window (dashed green border)
  const printableX = startX + scaledEdgeMargin;
  const printableY = startY + scaledGripperWidth + scaledEdgeMargin;
  const printableW = scaledPressWidth - (2 * scaledEdgeMargin);
  const printableH = scaledPressHeight - scaledGripperWidth - (2 * scaledEdgeMargin);
  
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.strokeRect(printableX, printableY, printableW, printableH);
  ctx.setLineDash([]);

  // Draw products (same as print view but with gripper emphasis) using actual Step 3 dimensions
  const currentProduct = formData?.products?.[productIndex || 0];
  const productName = currentProduct?.productName || 'business-cards';
  const productConfig = getProductConfig(productName);
  
  // For shopping bags, use the total dieline dimensions instead of individual panel dimensions
  let productWidth, productHeight;
  if (productName === 'Shopping Bag' && currentProduct?.bagPreset) {
    const bagPreset = getShoppingBagPreset(currentProduct.bagPreset);
    if (bagPreset) {
      const W = bagPreset.width;   // Individual panel width
      const H = bagPreset.height;  // Individual panel height
      const G = bagPreset.gusset;  // Gusset width
      const T = Math.max(3, W * 0.12); // Top hem (proportional)
      const B = Math.max(6, W * 0.25); // Bottom flaps (proportional)
      const glueFlap = 2; // Fixed glue flap width
      
      // Calculate total dieline dimensions (same as in layout calculation)
      productWidth = W + G + W + G + glueFlap; // Back + Gusset + Front + Gusset + Glue
      productHeight = T + H + B; // Top hem + Body height + Bottom flaps
    } else {
      productWidth = currentProduct?.flatSize?.width || productConfig?.defaultSizes?.width || 9;
      productHeight = currentProduct?.flatSize?.height || productConfig?.defaultSizes?.height || 5.5;
    }
  } else {
    productWidth = currentProduct?.flatSize?.width || productConfig?.defaultSizes?.width || 9;
    productHeight = currentProduct?.flatSize?.height || productConfig?.defaultSizes?.height || 5.5;
  }
  // Fixed default values as requested by client
  const bleedWidth = 0.3;
  const gapWidth = 0.5;
  
  // Calculate safety gap for proper spacing
  const safetyGap = 0.5; // 0.5cm safety gap around each object
  const productWithSafetyWidth = productWidth + (2 * bleedWidth) + (2 * safetyGap);
  const productWithSafetyHeight = productHeight + (2 * bleedWidth) + (2 * safetyGap);
  
  let scaledProductWidth = productWithSafetyWidth * scale;
  let scaledProductHeight = productWithSafetyHeight * scale;
  const scaledBleedWidth = bleedWidth * scale;
  const scaledGapWidth = gapWidth * scale;
  const scaledSafetyGap = safetyGap * scale;

  // Calculate total grid width and height to center the products
  const totalGridWidth = layout.itemsPerRow * scaledProductWidth + (layout.itemsPerRow - 1) * scaledGapWidth;
  const totalGridHeight = layout.itemsPerCol * scaledProductHeight + (layout.itemsPerCol - 1) * scaledGapWidth;
  
  // Special positioning for shopping bags - fill the printable area with proper spacing
  let gridStartX, gridStartY;
  if (productName === 'Shopping Bag') {
    // For shopping bags, use full printable width and distribute height evenly
    gridStartX = printableX; // Start at left edge of printable area
    gridStartY = printableY; // Start at top edge of printable area (after gripper)
    
    // Recalculate dimensions to fill the available space
    const availableWidth = printableW;
    const availableHeight = printableH;
    const gapBetweenBags = scaledGapWidth;
    
    // Calculate dimensions per bag to fill the available space
    const bagWidth = (availableWidth - (layout.itemsPerRow - 1) * gapBetweenBags) / layout.itemsPerRow;
    const bagHeight = (availableHeight - (layout.itemsPerCol - 1) * gapBetweenBags) / layout.itemsPerCol;
    
    // Update scaled dimensions for shopping bags
    scaledProductWidth = bagWidth;
    scaledProductHeight = bagHeight;
  } else {
    // Center the grid within the printable area for other products
    gridStartX = printableX + (printableW - totalGridWidth) / 2;
    gridStartY = printableY + (printableH - totalGridHeight) / 2;
  }

  // Draw individual products with proper spacing and gripper emphasis (centered, no offset)
  for (let row = 0; row < layout.itemsPerCol; row++) {
    for (let col = 0; col < layout.itemsPerRow; col++) {
      let x = gridStartX + col * (scaledProductWidth + scaledGapWidth);
      let y = gridStartY + row * (scaledProductHeight + scaledGapWidth);
      
      // Determine product shape for proper rendering
      const currentProduct = formData?.products?.[productIndex || 0];
      const productName = currentProduct?.productName || 'business-cards';
      const productShape = productName === 'Cups' ? 'circular' : 
                         productName === 'Shopping Bag' ? 'complex-3d' : 'rectangular';
      
      // No individual position adjustments needed - grid layout handles positioning correctly
      
      const actualProductWidth = currentProduct?.flatSize?.width || productConfig?.defaultSizes?.width || 9;
      const actualProductHeight = currentProduct?.flatSize?.height || productConfig?.defaultSizes?.height || 5.5;

      if (productShape === 'rectangular') {
        if (settings.showBleed) {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.18)';
          ctx.fillRect(
            x - scaledBleedWidth,
            y - scaledBleedWidth,
            scaledProductWidth + (2 * scaledBleedWidth),
            scaledProductHeight + (2 * scaledBleedWidth)
          );
        }
        drawProductShape(ctx, x, y, scaledProductWidth, scaledProductHeight, 'rectangular', settings, currentProduct);
      } else if (productShape === 'circular') {
        drawCircularProduct(ctx, x, y, scaledProductWidth, scaledProductHeight, settings, productData, row, col, currentProduct);
      } else {
        drawComplex3DProduct(ctx, x, y, scaledProductWidth, scaledProductHeight, settings, currentProduct);
      }

      if (productShape === 'rectangular') {
        const labelText = `${actualProductWidth.toFixed(1)}×${actualProductHeight.toFixed(1)} cm`;
        ctx.font = 'bold 9px Inter, system-ui, sans-serif';
        const labelWidth = ctx.measureText(labelText).width + 16;
        const labelHeight = 16;
        const labelX = x + scaledProductWidth - labelWidth - 4;
        const labelY = y + 4;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.fillRect(labelX, labelY, labelWidth, labelHeight);
        ctx.fillStyle = '#f8fafc';
        ctx.textAlign = 'center';
        ctx.fillText(labelText, labelX + labelWidth / 2, labelY + 11);
      }
    }
  }

  // Professional layout with proper text positioning
  // Responsive sizing based on canvas width
  const isMobile = canvasWidth < 768;
  const isTablet = canvasWidth >= 768 && canvasWidth < 1024;
  
  // Title positioned above the sheet with proper spacing (responsive font size)
  ctx.fillStyle = '#111827';
  const mainTitleFontSize = isMobile ? '16px' : isTablet ? '18px' : '20px';
  ctx.font = `bold ${mainTitleFontSize} Inter, system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('Gripper Handling', canvasWidth / 2, startY - 80);
  
  // Subtitle with proper spacing from title (responsive font size)
  ctx.fillStyle = '#6b7280';
  const subtitleFontSize = isMobile ? '11px' : isTablet ? '12px' : '14px';
  ctx.font = `${subtitleFontSize} Inter, system-ui, sans-serif`;
  ctx.fillText(`${pressWidth}×${pressHeight} • Safety Check`, canvasWidth / 2, startY - 55);
  
  // Information panels positioned outside the printable area
  const panelWidth = isMobile ? Math.min(140, canvasWidth * 0.35) : 
                     isTablet ? Math.min(160, canvasWidth * 0.25) : 180;
  const panelHeight = isMobile ? 120 : isTablet ? 130 : 140;
  const panelSpacing = isMobile ? 10 : isTablet ? 15 : 20;
  
  // Check if panels fit on screen, if not, position them below the sheet
  const leftPanelFits = (startX - panelWidth - panelSpacing) > 0;
  const rightPanelFits = (startX + scaledPressWidth + panelSpacing + panelWidth) < canvasWidth;
  
  // Left panel - Sheet Specifications (responsive positioning)
  const leftPanelX = leftPanelFits ? startX - panelWidth - panelSpacing : 
                     startX + scaledPressWidth / 2 - panelWidth / 2;
  const leftPanelY = leftPanelFits ? startY + 20 : startY + scaledPressHeight + 30;
  
  // Panel background with transparency
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.fillRect(leftPanelX, leftPanelY, panelWidth, panelHeight);
  
  // Panel border
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.strokeRect(leftPanelX, leftPanelY, panelWidth, panelHeight);
  
  // Panel header
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(leftPanelX, leftPanelY, panelWidth, 30);
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.strokeRect(leftPanelX, leftPanelY, panelWidth, 30);
  
  // Panel title (responsive font size)
  ctx.fillStyle = '#111827';
  const titleFontSize = isMobile ? '10px' : isTablet ? '11px' : '12px';
  ctx.font = `bold ${titleFontSize} Inter, system-ui, sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText('Sheet Specs', leftPanelX + 8, leftPanelY + 20);
  
  // Specifications list (responsive font size)
  ctx.fillStyle = '#374151';
  const textFontSize = isMobile ? '8px' : isTablet ? '9px' : '10px';
  ctx.font = `${textFontSize} Inter, system-ui, sans-serif`;
  const specs = [
    `${pressWidth}×${pressHeight} cm`,
    `Gripper: ${gripperWidth} cm (shaded)`,
    `Gap: ${gapWidth} cm • Bleed: ${bleedWidth} cm`,
    `Edge margins: ${edgeMargin} cm`,
    `Safe Printable Window:`,
    `${printableWidth.toFixed(1)}×${printableHeight.toFixed(1)} cm`
  ];
  
  specs.forEach((spec, index) => {
    ctx.fillText(spec, leftPanelX + 8, leftPanelY + 45 + (index * 12));
  });
  
  // Right panel - Safety Check (responsive positioning)
  const rightPanelX = rightPanelFits ? startX + scaledPressWidth + panelSpacing : 
                      leftPanelFits ? startX + scaledPressWidth / 2 - panelWidth / 2 :
                      startX + scaledPressWidth / 2 - panelWidth / 2;
  const rightPanelY = rightPanelFits ? startY + 20 : 
                      leftPanelFits ? startY + scaledPressHeight + 30 :
                      startY + scaledPressHeight + 150;
  
  // Panel background with transparency
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.fillRect(rightPanelX, rightPanelY, panelWidth, panelHeight);
  
  // Panel border
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.strokeRect(rightPanelX, rightPanelY, panelWidth, panelHeight);
  
  // Panel header with safety theme
  ctx.fillStyle = '#fef2f2';
  ctx.fillRect(rightPanelX, rightPanelY, panelWidth, 30);
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.strokeRect(rightPanelX, rightPanelY, panelWidth, 30);
  
  // Panel title (responsive font size)
  ctx.fillStyle = '#dc2626';
  ctx.font = `bold ${titleFontSize} Inter, system-ui, sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText('Safety Check', rightPanelX + 8, rightPanelY + 20);
  
  // Safety details with checkmarks (responsive font size)
  ctx.fillStyle = '#991b1b';
  ctx.font = `${textFontSize} Inter, system-ui, sans-serif`;
  const safetyChecks = [
    `Gripper Clearance: ✓`,
    `Margin Check: ✓`,
    `Bleed Area: ✓`,
    `Edge Safety: ✓`,
    `Print Area: ${printableWidth.toFixed(1)}×${printableHeight.toFixed(1)} cm`,
    `Utilization: ${((layout.itemsPerSheet * productWidth * productHeight) / (printableWidth * printableHeight) * 100).toFixed(1)}%`
  ];
  
  safetyChecks.forEach((check, index) => {
    ctx.fillText(check, rightPanelX + 8, rightPanelY + 45 + (index * 12));
  });
  
  // Gripper area label (centered in gripper area)
  ctx.fillStyle = '#dc2626';
  ctx.font = 'bold 10px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Gripper: ${gripperWidth} cm`, startX + scaledPressWidth / 2, startY + scaledGripperWidth / 2 + 3);
  
  // Safe printable window dimensions (bottom center)
  ctx.fillStyle = '#059669';
  ctx.font = 'bold 10px Inter, system-ui, sans-serif';
  ctx.fillText(`${printableWidth.toFixed(1)}×${printableHeight.toFixed(1)} cm`, printableX + printableW / 2, printableY + printableH + 20);
}

// Draw product-specific shapes with professional styling
function drawProductShape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  productShape: ProductShape,
  settings: VisualizationSettings,
  productData?: any
) {
  const bleed = (settings.bleedWidth || 0.3) * Math.min(width, height) / Math.max(productData?.flatSize?.width || 1, 1);
  const radius = Math.min(width, height) * 0.16;
  const safeInset = Math.max(Math.min(width, height) * 0.12, bleed * 3);
  const accent = productShape === 'rectangular' ? '#1d4ed8' : '#6366f1';

  ctx.save();
  ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
  ctx.fillRect(
    x - bleed,
    y - bleed,
    width + bleed * 2,
    height + bleed * 2
  );
  ctx.restore();

  ctx.save();
  ctx.shadowColor = 'rgba(15, 23, 42, 0.18)';
  ctx.shadowBlur = Math.max(8, width * 0.15);
  ctx.shadowOffsetY = Math.max(4, height * 0.08);
  ctx.beginPath();
  createRoundedRectPath(ctx, x, y, width, height, radius);
  const faceGradient = ctx.createLinearGradient(x, y, x + width, y + height);
  faceGradient.addColorStop(0, 'rgba(226, 232, 240, 0.96)');
  faceGradient.addColorStop(0.6, 'rgba(241, 245, 249, 0.86)');
  faceGradient.addColorStop(1, 'rgba(248, 250, 252, 0.96)');
  ctx.fillStyle = faceGradient;
  ctx.fill();
  ctx.restore();

  const borderGradient = ctx.createLinearGradient(x, y, x + width, y + height);
  borderGradient.addColorStop(0, accent);
  borderGradient.addColorStop(1, 'rgba(37, 99, 235, 0.55)');
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = borderGradient;
  ctx.beginPath();
  createRoundedRectPath(ctx, x, y, width, height, radius);
  ctx.stroke();

  ctx.fillStyle = 'rgba(59, 130, 246, 0.12)';
  ctx.fillRect(x + 6, y + 6, width - 12, Math.max(4, height * 0.08));

  ctx.save();
  ctx.setLineDash([6, 4]);
  ctx.strokeStyle = 'rgba(59, 130, 246, 0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  createRoundedRectPath(
    ctx,
    x + safeInset,
    y + safeInset,
    width - safeInset * 2,
    height - safeInset * 2,
    Math.max(radius - safeInset * 0.7, 4)
  );
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
  ctx.lineWidth = 1;
  const cornerLen = Math.min(width, height) * 0.14;
  const corners: Array<[number, number]> = [
    [x - bleed, y - bleed],
    [x + width + bleed, y - bleed],
    [x + width + bleed, y + height + bleed],
    [x - bleed, y + height + bleed],
  ];
  corners.forEach(([cx, cy]) => {
    ctx.beginPath();
    ctx.moveTo(cx, cy + cornerLen);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + cornerLen, cy);
    ctx.stroke();
  });
  ctx.restore();

  ctx.save();
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.moveTo(x + width - 14, y + 10);
  ctx.lineTo(x + width - 6, y + 14);
  ctx.lineTo(x + width - 14, y + 18);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// Draw circular products (Cups) - Technical Drawing Style with Proper Gap Compliance
function drawCircularProduct(
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
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const bleed = (settings.bleedWidth || 0.3) * Math.min(width, height) / Math.max(productData?.flatSize?.width || 1, 1);
  const rimHeight = height * 0.18;
  const bodyHeight = height * 0.6;
  const baseHeight = height * 0.12;
  const bodyTopWidth = width * 0.88;
  const bodyBottomWidth = width * 0.6;

  ctx.save();
  ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, width / 2 + bleed, height / 2 + bleed, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.shadowColor = 'rgba(30, 64, 175, 0.18)';
  ctx.shadowBlur = Math.max(8, width * 0.18);
  ctx.shadowOffsetY = Math.max(4, height * 0.08);
  ctx.beginPath();
  ctx.moveTo(centerX - bodyTopWidth / 2, centerY - bodyHeight / 2);
  ctx.quadraticCurveTo(centerX, centerY - bodyHeight / 2 - rimHeight * 0.25, centerX + bodyTopWidth / 2, centerY - bodyHeight / 2);
  ctx.lineTo(centerX + bodyBottomWidth / 2, centerY + bodyHeight / 2);
  ctx.quadraticCurveTo(centerX, centerY + bodyHeight / 2 + baseHeight * 0.6, centerX - bodyBottomWidth / 2, centerY + bodyHeight / 2);
  ctx.closePath();
  const bodyGradient = ctx.createLinearGradient(x, y, x + width, y + height);
  bodyGradient.addColorStop(0, 'rgba(248, 250, 252, 0.96)');
  bodyGradient.addColorStop(0.5, 'rgba(241, 245, 249, 0.82)');
  bodyGradient.addColorStop(1, 'rgba(226, 232, 240, 0.96)');
  ctx.fillStyle = bodyGradient;
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = 'rgba(37, 99, 235, 0.65)';
  ctx.beginPath();
  ctx.moveTo(centerX - bodyTopWidth / 2, centerY - bodyHeight / 2);
  ctx.quadraticCurveTo(centerX, centerY - bodyHeight / 2 - rimHeight * 0.25, centerX + bodyTopWidth / 2, centerY - bodyHeight / 2);
  ctx.lineTo(centerX + bodyBottomWidth / 2, centerY + bodyHeight / 2);
  ctx.quadraticCurveTo(centerX, centerY + bodyHeight / 2 + baseHeight * 0.4, centerX - bodyBottomWidth / 2, centerY + bodyHeight / 2);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.fillStyle = 'rgba(59, 130, 246, 0.12)';
  ctx.beginPath();
  ctx.ellipse(centerX, centerY - bodyHeight / 2, bodyTopWidth / 2, rimHeight / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(37, 99, 235, 0.6)';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.fillStyle = 'rgba(37, 99, 235, 0.08)';
  ctx.beginPath();
  ctx.ellipse(centerX, centerY + bodyHeight / 2, bodyBottomWidth / 2, baseHeight / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(37, 99, 235, 0.35)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  const safeRadius = Math.min(bodyBottomWidth, bodyHeight) * 0.35;
  ctx.save();
  ctx.strokeStyle = 'rgba(37, 99, 235, 0.45)';
  ctx.setLineDash([5, 4]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(centerX, centerY, safeRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  const cupSizeOz = product?.cupSizeOz ?? productData?.cupSizeOz ?? 8;
  const pillText = `${cupSizeOz}oz`;
  ctx.save();
  ctx.font = 'bold 10px Inter, system-ui, sans-serif';
  const pillWidth = ctx.measureText(pillText).width + 14;
  const pillX = centerX - pillWidth / 2;
  const pillY = centerY - bodyHeight / 2 - rimHeight - 18;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fillRect(pillX, pillY, pillWidth, 18);
  ctx.fillStyle = '#f1f5f9';
  ctx.textAlign = 'center';
  ctx.fillText(pillText, centerX, pillY + 12);
  ctx.restore();
}

// Draw complex 3D products (Shopping Bags)
function drawComplex3DProduct(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  settings: VisualizationSettings,
  productData?: any
) {
  console.log('🛍️ drawComplex3DProduct called with:', {
    x, y, width, height,
    productData: productData ? {
      productName: productData.productName,
      bagPreset: productData.bagPreset,
      flatSize: productData.flatSize
    } : 'undefined'
  });

  const bagPresetName = productData?.bagPreset || 'Medium';
  const bagPreset = getShoppingBagPreset(bagPresetName);
  if (!bagPreset) {
    console.error('Shopping bag preset not found:', bagPresetName);
    return;
  }

  const W = bagPreset.width;
  const H = bagPreset.height;
  const G = bagPreset.gusset;
  const T = Math.max(3, W * 0.12);
  const B = Math.max(6, W * 0.25);
  const FIXED = { bleed: 0.3, safety: 0.3, glueFlap: 2, handleDia: 0.6 };

  const totalW = W + G + W + G + FIXED.glueFlap;
  const totalH = T + H + B;
  console.log('🛍️ drawComplex3DProduct dimensions:', {
    bagPreset: bagPresetName,
    individualPanel: { W, H, G },
    calculatedTotal: { totalW, totalH },
    canvasSpace: { width, height }
  });

  const scaleX = (width * 0.8) / totalW;
  const scaleY = (height * 0.8) / totalH;
  const scale = Math.min(scaleX, scaleY);

  const scaledW = W * scale;
  const scaledH = H * scale;
  const scaledG = G * scale;
  const scaledT = T * scale;
  const scaledB = B * scale;
  const scaledGlueFlap = FIXED.glueFlap * scale;
  const scaledHandleDia = FIXED.handleDia * scale;

  const scaledBodyW = scaledW + scaledG + scaledW + scaledG + scaledGlueFlap;
  const scaledBodyH = scaledT + scaledH;
  const scaledTotalW = scaledBodyW;
  const scaledTotalH = scaledBodyH + scaledB;

  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const bagX = centerX - scaledTotalW / 2;
  const bagY = centerY - scaledTotalH / 2;

  const xBack = bagX;
  const xG1 = xBack + scaledW;
  const xFront = xG1 + scaledG;
  const xG2 = xFront + scaledW;
  const xGlue = xG2 + scaledG;

  const slotY = bagY + scaledT * 0.55;
  const slotOffsetX = scaledW / 4;
  const slotR = scaledHandleDia / 2;

  ctx.save();
  ctx.shadowColor = 'rgba(15, 23, 42, 0.18)';
  ctx.shadowBlur = Math.max(10, scaledTotalW * 0.12);
  ctx.shadowOffsetY = Math.max(6, scaledTotalH * 0.08);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
  ctx.fillRect(bagX, bagY, scaledTotalW, scaledTotalH);
  ctx.restore();

  ctx.save();
  const panelGradient = ctx.createLinearGradient(bagX, bagY, bagX, bagY + scaledBodyH);
  panelGradient.addColorStop(0, 'rgba(148, 163, 184, 0.08)');
  panelGradient.addColorStop(1, 'rgba(226, 232, 240, 0.12)');
  ctx.fillStyle = panelGradient;
  ctx.fillRect(bagX, bagY, scaledTotalW, scaledBodyH);
  ctx.fillStyle = 'rgba(37, 99, 235, 0.08)';
  ctx.fillRect(xBack, bagY, scaledW, scaledBodyH);
  ctx.fillRect(xFront, bagY, scaledW, scaledBodyH);
  ctx.fillStyle = 'rgba(59, 130, 246, 0.12)';
  ctx.fillRect(xG1, bagY, scaledG, scaledBodyH);
  ctx.fillRect(xG2, bagY, scaledG, scaledBodyH);
  ctx.fillStyle = 'rgba(14, 165, 233, 0.08)';
  ctx.fillRect(xGlue, bagY, scaledGlueFlap, scaledBodyH);
  ctx.fillStyle = 'rgba(226, 232, 240, 0.25)';
  ctx.fillRect(bagX, bagY + scaledBodyH, scaledTotalW, scaledB);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.45)';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(bagX, bagY, scaledTotalW, scaledBodyH);
  ctx.strokeRect(bagX, bagY + scaledBodyH, scaledTotalW, scaledB);
  ctx.strokeRect(xGlue, bagY, scaledGlueFlap, scaledBodyH + scaledB);
  ctx.restore();

  ctx.save();
  ctx.setLineDash([5, 4]);
  ctx.strokeStyle = 'rgba(30, 64, 175, 0.45)';
  ctx.lineWidth = 0.8;
  for (const seamX of [xG1, xFront, xG2, xGlue]) {
    ctx.beginPath();
    ctx.moveTo(seamX, bagY);
    ctx.lineTo(seamX, bagY + scaledTotalH);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(bagX, bagY + scaledT);
  ctx.lineTo(bagX + scaledTotalW, bagY + scaledT);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(bagX, bagY + scaledBodyH);
  ctx.lineTo(bagX + scaledTotalW, bagY + scaledBodyH);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = 'rgba(30, 64, 175, 0.55)';
  ctx.lineWidth = 0.9;
  const gussetLines: Array<[number, number]> = [
    [xG1, xG1 + scaledG],
    [xG2, xG2 + scaledG]
  ];
  gussetLines.forEach(([startX, endX]) => {
    ctx.beginPath();
    ctx.moveTo(startX, bagY + scaledTotalH);
    ctx.lineTo(startX + (endX - startX) / 2, bagY + scaledBodyH);
    ctx.lineTo(endX, bagY + scaledTotalH);
    ctx.stroke();
  });
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.7)';
  ctx.lineWidth = 1.2;
  for (const handleX of [
    xBack + scaledW / 2 - slotOffsetX,
    xBack + scaledW / 2 + slotOffsetX,
    xFront + scaledW / 2 - slotOffsetX,
    xFront + scaledW / 2 + slotOffsetX
  ]) {
    ctx.beginPath();
    ctx.ellipse(handleX, slotY, slotR, slotR * 0.65, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  const dimensionLabel = `${totalW.toFixed(1)}×${totalH.toFixed(1)} cm`;
  ctx.save();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.font = 'bold 10px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Shopping Bag Dieline', centerX, bagY - 14);
  ctx.fillStyle = 'rgba(55, 65, 81, 0.75)';
  ctx.font = '9px Inter, system-ui, sans-serif';
  ctx.fillText(dimensionLabel, centerX, bagY - 2);
  ctx.restore();
}


function calculateCutPieces(inputWidth: number, inputHeight: number, machineMaxWidth: number, machineMaxHeight: number) {
  // Determine the best cutting strategy
  const strategy1 = calculateCutStrategy(inputWidth, inputHeight, machineMaxWidth, machineMaxHeight);
  const strategy2 = calculateCutStrategy(inputHeight, inputWidth, machineMaxWidth, machineMaxHeight); // Rotated
  
  // Choose the better strategy
  const bestStrategy = strategy1.totalPieces >= strategy2.totalPieces ? strategy1 : strategy2;
  
  return bestStrategy;
}

/**
 * Calculate cutting strategy for given dimensions
 */
function calculateCutStrategy(sheetWidth: number, sheetHeight: number, maxWidth: number, maxHeight: number) {
  const pieces: Array<{x: number, y: number, width: number, height: number}> = [];
  const verticalCuts: number[] = [];
  const horizontalCuts: number[] = [];
  
  // Calculate how many pieces fit horizontally
  const piecesPerRow = Math.floor(sheetWidth / maxWidth);
  const piecesPerCol = Math.floor(sheetHeight / maxHeight);
  
  // Each cut piece should be the machine max dimensions (52x72)
  // This ensures consistent cut piece sizes regardless of input sheet size
  const pieceWidth = maxWidth;
  const pieceHeight = maxHeight;
  
  // Generate pieces
  for (let row = 0; row < piecesPerCol; row++) {
    for (let col = 0; col < piecesPerRow; col++) {
      pieces.push({
        x: col * pieceWidth,
        y: row * pieceHeight,
        width: pieceWidth,
        height: pieceHeight
      });
    }
  }
  
  // Generate cutting lines
  for (let i = 1; i < piecesPerRow; i++) {
    verticalCuts.push(i * pieceWidth);
  }
  for (let i = 1; i < piecesPerCol; i++) {
    horizontalCuts.push(i * pieceHeight);
  }
  
  return {
    pieces,
    verticalCuts,
    horizontalCuts,
    totalPieces: pieces.length,
    pieceWidth,
    pieceHeight,
    piecesPerRow,
    piecesPerCol
  };
}

/**
 * Draw final printing layout showing the cut pieces
 */
function drawFinalPrintingLayout(
  canvas: HTMLCanvasElement,
  cutPieces: ReturnType<typeof calculateCutPieces>,
  outputWidth: number,
  outputHeight: number
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Set high DPI for crisp rendering
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';

  // Clear with premium background
  const bgGradient = ctx.createLinearGradient(0, 0, rect.width, rect.height);
  bgGradient.addColorStop(0, '#f0f9ff');
  bgGradient.addColorStop(1, '#e0f2fe');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, rect.width, rect.height);

  // Calculate scaling to fit all cut pieces
  const padding = Math.min(30, Math.max(20, rect.width * 0.08)); // Responsive padding
  const canvasUsableWidth = rect.width - 2 * padding;
  const canvasUsableHeight = rect.height - 2 * padding;
  
  // Find the maximum dimensions of cut pieces
  const maxPieceWidth = Math.max(...cutPieces.pieces.map(p => p.width));
  const maxPieceHeight = Math.max(...cutPieces.pieces.map(p => p.height));
  
  const scaleX = canvasUsableWidth / (maxPieceWidth * cutPieces.piecesPerRow);
  const scaleY = canvasUsableHeight / (maxPieceHeight * cutPieces.piecesPerCol);
  const scale = Math.min(scaleX, scaleY) * 0.75; // Better mobile fit
  
  // Center the layout
  const totalWidth = maxPieceWidth * cutPieces.piecesPerRow * scale;
  const totalHeight = maxPieceHeight * cutPieces.piecesPerCol * scale;
  const startX = (rect.width - totalWidth) / 2;
  const startY = (rect.height - totalHeight) / 2;

  // Draw background grid
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.06)';
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
    const pieceX = startX + (piece.x * scale);
    const pieceY = startY + (piece.y * scale);
    const pieceWidth = piece.width * scale;
    const pieceHeight = piece.height * scale;
    
    // Piece background with gradient
    const pieceGradient = ctx.createLinearGradient(pieceX, pieceY, pieceX + pieceWidth, pieceY + pieceHeight);
    pieceGradient.addColorStop(0, '#ffffff');
    pieceGradient.addColorStop(1, '#f1f5f9');
    ctx.fillStyle = pieceGradient;
    ctx.fillRect(pieceX, pieceY, pieceWidth, pieceHeight);
    
    // Piece border
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.strokeRect(pieceX + 1, pieceY + 1, pieceWidth - 2, pieceHeight - 2);
    
    // Piece number
    ctx.fillStyle = '#1e40af';
    ctx.font = 'bold 14px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${index + 1}`, pieceX + pieceWidth / 2, pieceY + pieceHeight / 2);
    
    // Piece dimensions
    ctx.fillStyle = '#6b7280';
    ctx.font = '11px Inter, system-ui, sans-serif';
    ctx.fillText(`${piece.width.toFixed(1)}×${piece.height.toFixed(1)}`, pieceX + pieceWidth / 2, pieceY + pieceHeight / 2 + 18);
  });

  // Draw final output items on each piece
  cutPieces.pieces.forEach((piece, pieceIndex) => {
    const pieceX = startX + (piece.x * scale);
    const pieceY = startY + (piece.y * scale);
    const pieceWidth = piece.width * scale;
    const pieceHeight = piece.height * scale;
    
    // Calculate how many output items fit on this cut piece
    // Use the actual output dimensions passed to the function
    const itemsPerRow = Math.floor(piece.width / outputWidth);
    const itemsPerCol = Math.floor(piece.height / outputHeight);
    
    // Draw output items on the cut piece
    for (let row = 0; row < itemsPerCol; row++) {
      for (let col = 0; col < itemsPerRow; col++) {
        const itemX = pieceX + col * (outputWidth * scale);
        const itemY = pieceY + row * (outputHeight * scale);
        const itemWidth = outputWidth * scale;
        const itemHeight = outputHeight * scale;
        
        // Item background
        const itemGradient = ctx.createRadialGradient(
          itemX + itemWidth / 2, itemY + itemHeight / 2, 0,
          itemX + itemWidth / 2, itemY + itemHeight / 2, Math.max(itemWidth, itemHeight) / 2
        );
        itemGradient.addColorStop(0, 'rgba(34, 197, 94, 0.2)');
        itemGradient.addColorStop(0.7, 'rgba(34, 197, 94, 0.1)');
        itemGradient.addColorStop(1, 'rgba(34, 197, 94, 0.05)');
        
        ctx.fillStyle = itemGradient;
        ctx.fillRect(itemX + 2, itemY + 2, itemWidth - 4, itemHeight - 4);
        
        // Item border
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.6)';
        ctx.lineWidth = 1;
        ctx.strokeRect(itemX + 2, itemY + 2, itemWidth - 4, itemHeight - 4);
        
        // Item highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(itemX + 3, itemY + 3, itemWidth - 6, 1.5);
      }
    }
  });

  // Draw layout information
  ctx.fillStyle = '#1e40af';
  ctx.font = 'bold 12px Inter, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  
  const infoText = `Final Printing Layout: ${cutPieces.totalPieces} cut pieces`;
  const infoMetrics = ctx.measureText(infoText);
  
  ctx.fillStyle = 'rgba(30, 64, 175, 0.1)';
  ctx.fillRect(10, 10, infoMetrics.width + 10, 18);
  
  ctx.fillStyle = 'rgba(30, 64, 175, 0.9)';
  ctx.fillText(infoText, 15, 12);

  // Draw efficiency information - use actual output dimensions for calculation
  const totalOutputItems = cutPieces.pieces.reduce((total, piece) => {
    const itemsPerRow = Math.floor(piece.width / outputWidth);
    const itemsPerCol = Math.floor(piece.height / outputHeight);
    return total + (itemsPerRow * itemsPerCol);
  }, 0);
  
  const efficiencyText = `Total Output Items: ${totalOutputItems}`;
  const efficiencyMetrics = ctx.measureText(efficiencyText);
  
  ctx.fillStyle = 'rgba(34, 197, 94, 0.1)';
  ctx.fillRect(10, 35, efficiencyMetrics.width + 10, 18);
  
  ctx.fillStyle = 'rgba(34, 197, 94, 0.9)';
  ctx.fillText(efficiencyText, 15, 37);
}

const Step4Operational: FC<Step4Props> = ({ formData, setFormData }) => {

  // ===== Professional Visualization State =====
  const [visualizationType, setVisualizationType] = React.useState<VisualizationType>('print');
  
  // ===== Costing Analysis State =====
  const [digitalPricing, setDigitalPricing] = React.useState<DigitalPricing | null>(null);
  const [offsetPricing, setOffsetPricing] = React.useState<OffsetPricing | null>(null);
  const [digitalCostingResults, setDigitalCostingResults] = React.useState<DigitalCostingResult[]>([]);
  const [offsetCostingResult, setOffsetCostingResult] = React.useState<OffsetCostingResult | null>(null);
  const [selectedDigitalOption, setSelectedDigitalOption] = React.useState<string>('');
  const [selectedOffsetPress, setSelectedOffsetPress] = React.useState<string>('');
  const [loadingPricing, setLoadingPricing] = React.useState(false);
  
  

  // ===== Debug: Log component mount and initial data =====
  React.useEffect(() => {
    console.log('🚀 Step4Operational: Component mounted with data:', {
      productsLength: formData.products.length,
      operationalPapersLength: formData.operational.papers.length,
      products: formData.products.map(p => ({
        name: p.productName,
        quantity: p.quantity,
        papers: p.papers.length,
        colors: p.colors
      })),
      operationalPapers: formData.operational.papers.map(p => ({
        inputWidth: p.inputWidth,
        inputHeight: p.inputHeight,
        outputWidth: p.outputWidth,
        outputHeight: p.outputHeight,
        selectedColors: p.selectedColors,
        pricePerSheet: p.pricePerSheet,
        pricePerPacket: p.pricePerPacket
      }))
    });
    
    // CRITICAL: Initialize operational data structure for multiple products
    initializeOperationalData();
  }, [formData.products]);

  // ===== Initialize operational data structure for multiple products =====
  const initializeOperationalData = () => {
    console.log('🔄 Step4Operational: Initializing operational data structure...');
    
    // Calculate total papers needed across all products
    const totalPapersNeeded = formData.products.reduce((total, product) => total + product.papers.length, 0);
    
    // If operational papers don't match total papers needed, initialize them
    if (formData.operational.papers.length !== totalPapersNeeded) {
      console.log(`📊 Initializing operational data: ${totalPapersNeeded} papers needed, ${formData.operational.papers.length} currently exist`);
      
      const newOperationalPapers: any[] = [];
      let globalPaperIndex = 0;
      
      formData.products.forEach((product, productIndex) => {
        product.papers.forEach((paper, paperIndex) => {
          // Check if we have existing operational data for this paper
          const existingOpPaper = formData.operational.papers[globalPaperIndex];
          
          if (existingOpPaper) {
            // Use existing data
            newOperationalPapers.push(existingOpPaper);
          } else {
            // Create new operational paper entry
            const newOpPaper = {
              inputWidth: null,
              inputHeight: null,
              pricePerPacket: null,
              pricePerSheet: null,
              sheetsPerPacket: null,
              recommendedSheets: 0,
              enteredSheets: null,
              outputWidth: product.closeSize?.width ?? product.flatSize?.width ?? null,
              outputHeight: product.closeSize?.height ?? product.flatSize?.height ?? null,
              selectedColors: product.colors ? [product.colors.front, product.colors.back].filter((color): color is string => Boolean(color)) : []
            };
            newOperationalPapers.push(newOpPaper);
          }
          
          globalPaperIndex++;
        });
      });
      
      // Update form data with proper operational structure
      setFormData(prev => ({
        ...prev,
        operational: {
          ...prev.operational,
          papers: newOperationalPapers
        }
      }));
      
      console.log('✅ Operational data structure initialized:', newOperationalPapers);
    }
    
    // Initialize output dimensions for all products
      const newOutputDimensions: { [productIndex: number]: { width: number; height: number } } = {};
      formData.products.forEach((product, productIndex) => {
      newOutputDimensions[productIndex] = {
        width: product.closeSize?.width ?? product.flatSize?.width ?? 0,
        height: product.closeSize?.height ?? product.flatSize?.height ?? 0
      };
    });
    setOutputDimensions(newOutputDimensions);
    

  };



  // ===== Output size state management =====
  const [outputDimensions, setOutputDimensions] = React.useState<{
    [productIndex: number]: { width: number; height: number }
  }>(() => {
    const initial: { [productIndex: number]: { width: number; height: number } } = {};
    formData.products.forEach((product, index) => {
      // Check if we have saved operational data for this product
      const hasOperationalData = formData.operational.papers.length > index;
      
      if (hasOperationalData) {
        // Use saved operational data if available
        const opPaper = formData.operational.papers[index];
        initial[index] = {
          width: opPaper?.outputWidth ?? product?.closeSize?.width ?? product?.flatSize?.width ?? 0,
          height: opPaper?.outputHeight ?? product?.closeSize?.height ?? product?.flatSize?.height ?? 0
        };
      } else {
        // Fall back to product dimensions
        initial[index] = {
          width: product?.closeSize?.width ?? product?.flatSize?.width ?? 0,
          height: product?.closeSize?.height ?? product?.flatSize?.height ?? 0
        };
      }
    });
    return initial;
  });



  // ===== New simple color codes state =====
  const [paperColors, setPaperColors] = React.useState<{ [productIndex: number]: { [paperIndex: number]: string[] } }>({});
  const [colorInputs, setColorInputs] = React.useState<{ [productIndex: number]: { [paperIndex: number]: string } }>({});
  const [colorSaveStatus, setColorSaveStatus] = React.useState<{ [productIndex: number]: { [paperIndex: number]: 'idle' | 'saving' | 'saved' | 'error' } }>({});
  const [isColorsLoading, setIsColorsLoading] = React.useState(true);
  const [showColorSavedMessage, setShowColorSavedMessage] = React.useState(false);

  // ===== Enhanced helper function to convert color input to CSS color =====
  const getColorFromInput = (colorInput: string): string => {
    const input = colorInput.trim().toLowerCase();
    
    // Handle hex codes
    if (input.startsWith('#')) {
      // Validate hex format
      if (/^#[0-9A-Fa-f]{3}$|^#[0-9A-Fa-f]{6}$/.test(input)) {
        return input;
      }
      return 'transparent'; // Invalid hex
    }
    
    // Handle common color names with expanded palette
    const colorMap: { [key: string]: string } = {
      // Basic colors
      'red': '#FF0000',
      'green': '#00FF00',
      'blue': '#0000FF',
      'yellow': '#FFFF00',
      'cyan': '#00FFFF',
      'magenta': '#FF00FF',
      'black': '#000000',
      'white': '#FFFFFF',
      'gray': '#808080',
      'grey': '#808080',
      'orange': '#FFA500',
      'purple': '#800080',
      'pink': '#FFC0CB',
      'brown': '#A52A2A',
      'lime': '#00FF00',
      'navy': '#000080',
      'teal': '#008080',
      'olive': '#808000',
      'maroon': '#800000',
      'silver': '#C0C0C0',
      'gold': '#FFD700',
      'violet': '#EE82EE',
      'indigo': '#4B0082',
      'coral': '#FF7F50',
      'turquoise': '#40E0D0',
      'lavender': '#E6E6FA',
      'plum': '#DDA0DD',
      'salmon': '#FA8072',
      'khaki': '#F0E68C',
      'azure': '#F0FFFF',
      'ivory': '#FFFFF0',
      'wheat': '#F5DEB3',
      'tan': '#D2B48C',
      'beige': '#F5F5DC',
      'mint': '#F5FFFA',
      'peach': '#FFE5B4',
      'rose': '#FFE4E1',
      'cream': '#FFFDD0',
      'charcoal': '#36454F',
      'slate': '#708090',
      'steel': '#4682B4',
      
      // Process colors
      'cmyk': '#000000', // Black for CMYK
      'k': '#000000',    // Black key
      'm': '#FF00FF',    // Magenta
      'y': '#FFFF00',    // Yellow
      'c': '#00FFFF',    // Cyan
      
      // Additional professional colors
      'forest': '#228B22',
      'emerald': '#50C878',
      'sapphire': '#0F52BA',
      'ruby': '#E0115F',
      'amber': '#FFBF00',
      'chrome': '#E8F1F8',
      'gunmetal': '#2C3539',
      'platinum': '#E5E4E2',
      'titanium': '#C0C0C0',
      'brass': '#B5A642',
      'aluminum': '#848789',
      'nickel': '#727472',
      'zinc': '#7B8C4D'
    };
    
    if (colorMap[input]) {
      return colorMap[input];
    }
    
    // Handle Pantone-like codes with some common mappings
    if (/^[0-9]{3,4}[A-Z]$/i.test(input)) {
      // Map some common Pantone codes to approximate colors
      const pantoneMap: { [key: string]: string } = {
        '185C': '#C8102E', // Pantone Red
        '286C': '#003DA5', // Pantone Blue
        '354C': '#00A651', // Pantone Green
        '116C': '#FFD100', // Pantone Yellow
        '212C': '#FF6F61', // Pantone Coral
        '2925C': '#7BA7BC', // Pantone Blue Gray
        '7545C': '#425563', // Pantone Dark Blue Gray
        '7546C': '#5B6770', // Pantone Medium Blue Gray
        '7547C': '#8E8F8F', // Pantone Light Blue Gray
        '7548C': '#A7A8AA', // Pantone Very Light Blue Gray
        '7549C': '#C6C7C8', // Pantone Very Light Blue Gray
        '7550C': '#E3E3E3', // Pantone Very Light Blue Gray
        '7551C': '#F0F0F0', // Pantone Very Light Blue Gray
        '7552C': '#F8F8F8', // Pantone Very Light Blue Gray
        '7553C': '#FDFDFD', // Pantone Very Light Blue Gray
        '7554C': '#FFFFFF', // Pantone White
        '7555C': '#000000', // Pantone Black
        '7556C': '#1C1C1C', // Pantone Very Dark Gray
        '7557C': '#2D2D2D', // Pantone Dark Gray
        '7558C': '#3D3D3D', // Pantone Medium Dark Gray
        '7559C': '#4D4D4D', // Pantone Medium Gray
        '7560C': '#5D5D5D', // Pantone Medium Light Gray
        '7561C': '#6D6D6D', // Pantone Light Gray
        '7562C': '#7D7D7D', // Pantone Very Light Gray
        '7563C': '#8D8D8D', // Pantone Very Light Gray
        '7564C': '#9D9D9D', // Pantone Very Light Gray
        '7565C': '#ADADAD', // Pantone Very Light Gray
        '7566C': '#BDBDBD', // Pantone Very Light Gray
        '7567C': '#CDCDCD', // Pantone Very Light Gray
        '7568C': '#DDDDDD', // Pantone Very Light Gray
        '7569C': '#EDEDED', // Pantone Very Light Gray
        '7570C': '#FDFDFD'  // Pantone Very Light Gray
      };
      
      if (pantoneMap[input.toUpperCase()]) {
        return pantoneMap[input.toUpperCase()];
      }
      
      // For unknown Pantone codes, show a pattern
      return 'transparent';
    }
    
    // Try to parse as CSS color
    try {
      // Create a temporary element to test if the color is valid
      const temp = document.createElement('div');
      temp.style.color = input;
      if (temp.style.color !== '') {
        return input;
      }
    } catch (e) {
      // Ignore errors
    }
    
    return 'transparent'; // Unknown color
  };

  // ===== Sync local state with formData changes (important for editing existing quotes) =====
  React.useEffect(() => {
    console.log('🔄 Step4Operational: formData changed, syncing local state...', {
      productsLength: formData.products.length,
      operationalPapersLength: formData.operational.papers.length,
      hasOperationalData: formData.operational.papers.some(p => 
        p.inputWidth !== null || p.inputHeight !== null || 
        p.outputWidth !== null || p.outputHeight !== null
      )
    });

    // Sync colors from formData to local state
    const newPaperColors: { [productIndex: number]: { [paperIndex: number]: string[] } } = {};
    formData.products.forEach((product, productIndex) => {
      product.papers.forEach((paper, paperIndex) => {
        // Calculate global paper index
        const globalPaperIndex = formData.products
          .slice(0, productIndex)
          .reduce((total, p) => total + p.papers.length, 0) + paperIndex;
        
        // Get colors from operational data
        const operationalPaper = formData.operational.papers[globalPaperIndex];
        if (operationalPaper?.selectedColors && operationalPaper.selectedColors.length > 0) {
          if (!newPaperColors[productIndex]) newPaperColors[productIndex] = {};
          newPaperColors[productIndex][paperIndex] = operationalPaper.selectedColors;
        }
      });
    });
    
    // Update local state if colors changed
    if (Object.keys(newPaperColors).length > 0) {
      setPaperColors(newPaperColors);
    }
    
    // Set loading to false after initial sync
    setIsColorsLoading(false);

    // If we have operational data, ensure our local state is in sync
    if (formData.operational.papers.length > 0) {
      // Update outputDimensions from operational data
      const newOutputDimensions: { [productIndex: number]: { width: number; height: number } } = {};
      formData.products.forEach((product, productIndex) => {
        // Find the corresponding operational paper for this product
        let globalPaperIndex = 0;
        for (let pi = 0; pi < productIndex; pi++) {
          globalPaperIndex += formData.products[pi].papers.length;
        }
        
        // Use the first paper's operational data for this product
        const opPaper = formData.operational.papers[globalPaperIndex];
        if (opPaper) {
          newOutputDimensions[productIndex] = {
            width: opPaper.outputWidth ?? product?.closeSize?.width ?? product?.flatSize?.width ?? 0,
            height: opPaper.outputHeight ?? product?.closeSize?.height ?? product?.flatSize?.height ?? 0
          };
          console.log(`📏 Syncing outputDimensions for product ${productIndex}:`, newOutputDimensions[productIndex]);
        } else {
          newOutputDimensions[productIndex] = {
            width: product?.closeSize?.width ?? product?.flatSize?.width ?? 0,
            height: product?.closeSize?.height ?? product?.flatSize?.height ?? 0
          };
        }
      });
      
      setOutputDimensions(newOutputDimensions);
    }
  }, [formData.operational.papers, formData.products]);

  // ===== Debug: Monitor color changes =====


  // ===== Track user edits to enteredSheets =====
  const [userEditedSheets, setUserEditedSheets] = React.useState<Set<string>>(new Set());
  
  // ===== Track user edits to input dimensions =====
  const [userEditedInputDimensions, setUserEditedInputDimensions] = React.useState<Set<string>>(new Set());
  
  // ===== Additional costs state =====
  const [additionalCosts, setAdditionalCosts] = React.useState<Array<{
    id: string;
    description: string;
    cost: number;
    comment: string;
  }>>([]);

  // ===== Supplier database modal =====
  const [showSupplierDB, setShowSupplierDB] = React.useState(false);

  // ===== Update outputDimensions when formData changes (e.g., when existing quote is selected) =====
  React.useEffect(() => {
    console.log('📏 Step4Operational: Updating outputDimensions...', {
      productsLength: formData.products.length,
      operationalPapersLength: formData.operational.papers.length
    });
    
    const newOutputDimensions: { [productIndex: number]: { width: number; height: number } } = {};
    
    formData.products.forEach((product, index) => {
      // Check if we have saved operational data for this product
      const hasOperationalData = formData.operational.papers.length > index;
      
      // Special handling for shopping bags - calculate total dieline dimensions
      if (product?.productName === 'Shopping Bag' && product?.bagPreset) {
        const bagPreset = getShoppingBagPreset(product.bagPreset);
        if (bagPreset) {
          const W = bagPreset.width;   // Individual panel width
          const H = bagPreset.height;  // Individual panel height
          const G = bagPreset.gusset;  // Gusset width
          const T = Math.max(3, W * 0.12); // Top hem (proportional)
          const B = Math.max(6, W * 0.25); // Bottom flaps (proportional)
          const glueFlap = 2; // Fixed glue flap width
          
          // Calculate total dieline dimensions
          const totalWidth = W + G + W + G + glueFlap; // Back + Gusset + Front + Gusset + Glue
          const totalHeight = T + H + B; // Top hem + Body height + Bottom flaps
          
          newOutputDimensions[index] = {
            width: totalWidth,
            height: totalHeight
          };
          
          console.log(`🛍️ Product ${index}: Shopping bag dieline dimensions - width: ${totalWidth}, height: ${totalHeight}`);
        } else {
          // Fallback to product dimensions if preset not found
          newOutputDimensions[index] = {
            width: product?.closeSize?.width ?? product?.flatSize?.width ?? 0,
            height: product?.closeSize?.height ?? product?.flatSize?.height ?? 0
          };
          console.log(`🛍️ Product ${index}: Shopping bag preset not found, using fallback dimensions`);
        }
      } else if (hasOperationalData) {
        // Use saved operational data if available
        const opPaper = formData.operational.papers[index];
        newOutputDimensions[index] = {
          width: opPaper?.outputWidth ?? product?.closeSize?.width ?? product?.flatSize?.width ?? 0,
          height: opPaper?.outputHeight ?? product?.closeSize?.height ?? product?.flatSize?.height ?? 0
        };
        console.log(`📏 Product ${index}: Using operational data - width: ${opPaper?.outputWidth}, height: ${opPaper?.outputHeight}`);
      } else {
        // Fall back to product dimensions
        newOutputDimensions[index] = {
          width: product?.closeSize?.width ?? product?.flatSize?.width ?? 0,
          height: product?.closeSize?.height ?? product?.flatSize?.height ?? 0
        };
        console.log(`📏 Product ${index}: Using product dimensions - width: ${product?.closeSize?.width}, height: ${product?.closeSize?.height}`);
      }
    });
    
    console.log('📏 Final outputDimensions:', newOutputDimensions);
    setOutputDimensions(newOutputDimensions);
  }, [formData.products, formData.operational.papers]);

  // ===== Enhanced calculation exactly matching HTML logic =====
  const perPaperCalc = React.useMemo(() => {
    // Calculate for each product with their own paper indices
    return formData.products.map((product, productIndex) => {
      const qty = product?.quantity ?? 0;
      const productDimensions = outputDimensions[productIndex] || { width: 0, height: 0 };

      // Map through the product's papers (not operational papers)
      return product.papers.map((paper, paperIndex) => {
        // Calculate the global paper index for this product's paper
        let globalPaperIndex = 0;
        for (let pi = 0; pi < productIndex; pi++) {
          globalPaperIndex += formData.products[pi].papers.length;
        }
        globalPaperIndex += paperIndex;
        
        const opPaper = formData.operational.papers[globalPaperIndex];
        
        // Get product configuration for proper gripper, gap, and bleed values
        const productConfig = getProductConfig(product?.productName || 'business-cards');
        const gripperWidth = product?.gripper || productConfig?.defaultGripper || 0.9;
        // Use 0.5cm gap for cups as specified, otherwise use product config
        const gapWidth = product?.productName === 'Cups' ? 0.5 : (product?.gap || productConfig?.defaultGap || 0.5);
        const bleedWidth = product?.bleed || productConfig?.defaultBleed || 0.3;
        
        // Use Step 3 product dimensions directly instead of outputDimensions
        let step3ProductWidth = product?.flatSize?.width || productConfig?.defaultSizes?.width || 9;
        let step3ProductHeight = product?.flatSize?.height || productConfig?.defaultSizes?.height || 5.5;
        
        // Debug: Check what product we're dealing with
        console.log('🔍 Product debug info:', {
          productName: product?.productName,
          bagPreset: product?.bagPreset,
          flatSize: product?.flatSize,
          step3ProductWidth,
          step3ProductHeight
        });
        
        // Special handling for shopping bags - calculate total dieline dimensions
        if (product?.productName === 'Shopping Bag' && product?.bagPreset) {
          console.log('🛍️ Processing shopping bag...');
          const bagPreset = getShoppingBagPreset(product.bagPreset);
          if (bagPreset) {
            const W = bagPreset.width;   // Individual panel width
            const H = bagPreset.height;  // Individual panel height
            const G = bagPreset.gusset;  // Gusset width
            const T = Math.max(3, W * 0.12); // Top hem (proportional)
            const B = Math.max(6, W * 0.25); // Bottom flaps (proportional)
            const glueFlap = 2; // Fixed glue flap width
            
            // Calculate total dieline dimensions
            step3ProductWidth = W + G + W + G + glueFlap; // Back + Gusset + Front + Gusset + Glue
            step3ProductHeight = T + H + B; // Top hem + Body height + Bottom flaps
            
            console.log('🛍️ Shopping bag dieline dimensions (BEFORE computeLayout):', {
              preset: product.bagPreset,
              panelWidth: W,
              panelHeight: H,
              gusset: G,
              topHem: T,
              bottomFlaps: B,
              glueFlap: glueFlap,
              totalWidth: step3ProductWidth,
              totalHeight: step3ProductHeight
            });
          } else {
            console.error('🛍️ Shopping bag preset not found:', product.bagPreset);
          }
        } else {
          console.log('🛍️ Not a shopping bag or missing bagPreset:', {
            isShoppingBag: product?.productName === 'Shopping Bag',
            hasBagPreset: !!product?.bagPreset
          });
        }
        
        // Debug cup dimensions
        if (product?.productName === 'Cups') {
          console.log(`🍵 Cup Product ${productIndex}:`, {
            cupSizeOz: product.cupSizeOz,
            flatSize: product.flatSize,
            step3ProductWidth,
            step3ProductHeight,
            productConfig: productConfig?.defaultSizes,
            safetyGap: 0.5,
            bleedWidth,
            productWithSafetyWidth: step3ProductWidth + (2 * bleedWidth) + (2 * 0.5),
            productWithSafetyHeight: step3ProductHeight + (2 * bleedWidth) + (2 * 0.5)
          });
        }
        
        
        const layout = computeLayout(
          35,  // Fixed press sheet width: 35 cm
          50,  // Fixed press sheet height: 50 cm
          step3ProductWidth,  // Use Step 3 dimensions
          step3ProductHeight, // Use Step 3 dimensions
          gripperWidth,
          0.5, // edgeMargin
          gapWidth,
          bleedWidth
        );
        
        console.log('🔍 computeLayout result:', layout);
        
        

        const recommendedSheets =
          layout.itemsPerSheet > 0 ? Math.ceil(qty / layout.itemsPerSheet) : 0;

        // Use custom price per sheet if provided, otherwise calculate from packet pricing
        const pricePerSheet = opPaper?.pricePerSheet != null 
          ? opPaper.pricePerSheet
          : (opPaper?.pricePerPacket != null &&
             opPaper?.sheetsPerPacket != null &&
             opPaper.sheetsPerPacket > 0
            ? opPaper.pricePerPacket / opPaper.sheetsPerPacket
            : null);

        return { layout, recommendedSheets, pricePerSheet, opPaper };
      });
    });
  }, [
    formData.operational.papers.length,
    outputDimensions,
    formData.products.length,
  ]);

  // ===== Initialize enteredSheets with recommended values =====
  React.useEffect(() => {
    // Only run this effect once when the component mounts and perPaperCalc is available
    if (perPaperCalc.length > 0 && perPaperCalc[0]?.length > 0) {
      setFormData((prev) => {
        const nextPapers = prev.operational.papers.map((p, i) => {
          // Find which product and paper index this operational paper corresponds to
          let productIndex = 0;
          let paperIndex = 0;
          let currentPaperCount = 0;
          
          for (let pi = 0; pi < formData.products.length; pi++) {
            if (i >= currentPaperCount && i < currentPaperCount + formData.products[pi].papers.length) {
              productIndex = pi;
              paperIndex = i - currentPaperCount;
              break;
            }
            currentPaperCount += formData.products[pi].papers.length;
          }
          
          // Get the recommended sheets from the correct product's calculation
          const rec = perPaperCalc[productIndex]?.[paperIndex]?.recommendedSheets ?? p.recommendedSheets;
          const paperKey = `paper-${i}`;
          const hasUserEdited = userEditedSheets.has(paperKey);
          
          // IMPORTANT: Preserve existing data when editing existing quotes
          // Check if this paper has existing data that should be preserved
          const hasExistingData = p.inputWidth !== null || p.inputHeight !== null || 
                                 p.pricePerPacket !== null || p.pricePerSheet !== null ||
                                 p.outputWidth !== null || p.outputHeight !== null;
          
          if (hasUserEdited) {
            // User has manually edited this field, keep their value
            return { ...p, recommendedSheets: rec };
          } else if (hasExistingData && p.enteredSheets !== null) {
            // This paper has existing data from a saved quote, preserve it
            return { ...p, recommendedSheets: rec };
          } else {
            // No existing data, use recommended value as default
            return { ...p, recommendedSheets: rec, enteredSheets: rec };
          }
        });

        const hasChanges = nextPapers.some((p, i) => 
          p.enteredSheets !== prev.operational.papers[i]?.enteredSheets ||
          p.recommendedSheets !== prev.operational.papers[i]?.recommendedSheets
        );

        if (!hasChanges) return prev;

        return {
          ...prev,
          operational: {
            ...prev.operational,
            papers: nextPapers,
          },
        };
      });
    }
  }, [perPaperCalc, setFormData, userEditedSheets, formData.products]);

  // ===== Initialize default input sheet sizes and validate output dimensions =====
  React.useEffect(() => {
    setFormData((prev) => {
      const nextPapers = prev.operational.papers.map((p, i) => {
        const updatedPaper = { ...p };
        const paperKey = `input-dimensions-${i}`;
        const hasUserEdited = userEditedInputDimensions.has(paperKey);
        
        // Only set defaults if user hasn't manually edited these values
        if (!hasUserEdited) {
          if (updatedPaper.inputWidth !== 100) {
            updatedPaper.inputWidth = 100;
          }
          if (updatedPaper.inputHeight !== 70) {
            updatedPaper.inputHeight = 70;
          }
        }
        
        return updatedPaper;
      });

      const hasChanges = nextPapers.some((p, i) => 
        p.inputWidth !== prev.operational.papers[i]?.inputWidth ||
        p.inputHeight !== prev.operational.papers[i]?.inputHeight
      );

      if (!hasChanges) return prev;

      return {
        ...prev,
        operational: {
          ...prev.operational,
          papers: nextPapers,
        },
      };
    });
  }, [setFormData, userEditedInputDimensions]);



  // ===== Plates & Units =====
  const { plates, units } = React.useMemo(() => {
    // Always calculate the proper values first
    let calculatedPlates = 0;
    let calculatedUnits = 0;
    // Ensure we have products to calculate from
    if (formData.products && formData.products.length > 0) {
    formData.products.forEach((product, productIndex) => {
      const sides = product?.sides ?? "1";
      const printing = product?.printingSelection ?? "Digital";

        // Calculate plates: Digital = 0, Offset = 4 plates per side
        const platesForProduct = printing === "Digital" ? 0 : (sides === "2" ? 2 : 1) * 4;
        calculatedPlates += platesForProduct;

        // Calculate units based on sheets needed
      const productPapers = product.papers || [];
      const totalSheets = productPapers.reduce(
        (acc, paper, paperIndex) => {
          // Get the recommended sheets from the correct product's calculation
          const rec = perPaperCalc[productIndex]?.[paperIndex]?.recommendedSheets ?? 0;
          
          // Find the corresponding operational paper
          let globalPaperIndex = 0;
          for (let pi = 0; pi < productIndex; pi++) {
            globalPaperIndex += formData.products[pi].papers.length;
          }
          globalPaperIndex += paperIndex;
          
          const opPaper = formData.operational.papers[globalPaperIndex];
          if (opPaper) {
            const entered = opPaper.enteredSheets ?? null;
            return acc + (entered != null ? entered : rec);
          }
          return acc + rec;
        },
        0
      );

        // Units = sheets × sides
        calculatedUnits += totalSheets * (sides === "2" ? 2 : 1);
      });
    }

    // Always use calculated values by default
    // Only use user values if they were explicitly entered (not null/undefined)
    const userPlates = formData.operational.plates;
    const userUnits = formData.operational.units;
    
    return { 
      plates: userPlates !== null && userPlates !== undefined ? userPlates : calculatedPlates, 
      units: userUnits !== null && userUnits !== undefined ? userUnits : calculatedUnits 
    };
  }, [
    formData.operational.papers,
    perPaperCalc,
    formData.products,
    formData.operational.plates,
    formData.operational.units,
  ]);

  // ===== Sync to state =====
  React.useEffect(() => {
    setFormData((prev) => {
      const nextPapers = prev.operational.papers.map((p, i) => {
        // Find which product and paper index this operational paper corresponds to
        let productIndex = 0;
        let paperIndex = 0;
        let currentPaperCount = 0;
        
        for (let pi = 0; pi < formData.products.length; pi++) {
          if (i >= currentPaperCount && i < currentPaperCount + formData.products[pi].papers.length) {
            productIndex = pi;
            paperIndex = i - currentPaperCount;
            break;
          }
          currentPaperCount += formData.products[pi].papers.length;
        }
        
        // Get the recommended sheets from the correct product's calculation
        const rec = perPaperCalc[productIndex]?.[paperIndex]?.recommendedSheets ?? p.recommendedSheets;
        
        // REVISION 1: Force "Enter Sheets" to match recommended sheets by default
        // But preserve user edits if they have manually changed the value
        const paperKey = `paper-${i}`;
        const hasUserEdited = userEditedSheets.has(paperKey);
        
        let enteredSheets: number;
        if (hasUserEdited) {
          // User has manually edited this field, keep their value
          enteredSheets = p.enteredSheets ?? rec;
        } else {
          // No user edit, use recommended value as default
          enteredSheets = rec;
        }
        
        return p.recommendedSheets === rec && p.enteredSheets === enteredSheets
          ? p
          : { ...p, recommendedSheets: rec, enteredSheets };
      });

      const samePapers =
        nextPapers.length === prev.operational.papers.length &&
        nextPapers.every(
          (p, i) =>
            p.recommendedSheets === prev.operational.papers[i].recommendedSheets &&
            p.enteredSheets === prev.operational.papers[i].enteredSheets
        );

      const samePlates = prev.operational.plates === plates;
      const sameUnits = prev.operational.units === units;

      if (samePapers && samePlates && sameUnits) return prev;

      return {
        ...prev,
        operational: {
          ...prev.operational,
          papers: nextPapers,
          plates,
          units,
        },
      };
    });
  }, [perPaperCalc, plates, units, setFormData, userEditedSheets, formData.products]);

  // ===== Sync operational papers with product papers =====
  React.useEffect(() => {
    // This effect ensures that operational.papers array is synchronized with product papers
    // When new papers are added in Step 3, we create corresponding operational entries
    const totalProductPapers = formData.products.reduce((total, product) => total + product.papers.length, 0);
    const currentOperationalPapers = formData.operational.papers.length;
    
    if (totalProductPapers !== currentOperationalPapers) {
      setFormData((prev) => {
        const newOperationalPapers: QuoteFormData["operational"]["papers"] = [];
        
        // Create operational paper entries for each product's papers
        formData.products.forEach((product, productIndex) => {
          product.papers.forEach((paper, paperIndex) => {
            // Calculate the global paper index for this product's paper
            const globalPaperIndex = newOperationalPapers.length;
            const existingOpPaper = prev.operational.papers[globalPaperIndex];
            
            // Get recommended sheets from calculations if available
            // Use the product-specific calculation
            const recommendedSheets = perPaperCalc[productIndex]?.[paperIndex]?.recommendedSheets ?? 1;
            
            // Create new operational paper entry or use existing one
            // IMPORTANT: Preserve existing data when editing existing quotes
            const newOpPaper: QuoteFormData["operational"]["papers"][0] = existingOpPaper || {
              inputWidth: null,
              inputHeight: null,
              pricePerPacket: null,
              pricePerSheet: null,
              sheetsPerPacket: null,
              recommendedSheets: recommendedSheets,
              enteredSheets: recommendedSheets, // Default to recommended value
              outputWidth: null,
              outputHeight: null,
            };
            
            // Update with latest recommended sheets and ensure enteredSheets matches
            // But preserve existing values if they were set from a saved quote
            newOpPaper.recommendedSheets = recommendedSheets;
            
            // Only override enteredSheets if:
            // 1. No existing operational paper, OR
            // 2. User hasn't manually edited it, OR  
            // 3. The existing value is not from a saved quote (i.e., it's the default)
            if (!existingOpPaper || 
                !userEditedSheets.has(`paper-${globalPaperIndex}`) ||
                existingOpPaper.enteredSheets === existingOpPaper.recommendedSheets) {
              newOpPaper.enteredSheets = recommendedSheets;
            }
            
            newOperationalPapers.push(newOpPaper);
          });
        });
        
        return {
          ...prev,
          operational: {
            ...prev.operational,
            papers: newOperationalPapers,
            plates,
            units,
          },
        };
      });
    }
  }, [formData.products, perPaperCalc, userEditedSheets, setFormData, formData.operational.papers.length]);

  // ===== Validation functions =====
  const validateOutputDimensions = (width: number, height: number, inputWidth: number | null, inputHeight: number | null) => {
    if (!inputWidth || !inputHeight) return null;
    
    const canFitNormal = width <= inputWidth && height <= inputHeight;
    const canFitRotated = width <= inputHeight && height <= inputWidth;
    
    if (!canFitNormal && !canFitRotated) {
      return "Output dimensions are too large for the input sheet size in any orientation";
    }
    return null;
  };

  // ===== handlers =====
  const handlePaperOpChange = (
    index: number,
    field: keyof QuoteFormData["operational"]["papers"][0],
    value: string
  ) => {
    const v: number | null = value === "" ? null : parseFloat(value);
    
    // Track user edits to enteredSheets
    if (field === "enteredSheets") {
      const paperKey = `paper-${index}`;
      if (v !== null) {
        setUserEditedSheets(prev => new Set(prev).add(paperKey));
      } else {
        setUserEditedSheets(prev => {
          const newSet = new Set(prev);
          newSet.delete(paperKey);
          return newSet;
        });
      }
    }
    
    // Track user edits to input dimensions
    if (field === "inputWidth" || field === "inputHeight") {
      const paperKey = `input-dimensions-${index}`;
      if (v !== null) {
        setUserEditedInputDimensions(prev => new Set(prev).add(paperKey));
      } else {
        setUserEditedInputDimensions(prev => {
          const newSet = new Set(prev);
          newSet.delete(paperKey);
          return newSet;
        });
      }
    }
    
    const newPapers = [...formData.operational.papers];
    newPapers[index] = { ...newPapers[index], [field]: v };
    setFormData((prev) => ({
      ...prev,
      operational: { ...prev.operational, papers: newPapers },
    }));
  };



  const handlePlatesChange = (value: string) => {
    if (value === "") {
      setFormData((prev) => ({
        ...prev,
        operational: {
          ...prev.operational,
          plates: null,
        },
      }));
      return;
    }
    
    const plates = parseFloat(value);
    if (isNaN(plates) || plates < 0) return;
    
    // Prevent unreasonably large values (likely typos)
    if (plates > 1000) return;
    
    setFormData((prev) => ({
      ...prev,
      operational: {
        ...prev.operational,
        plates,
      },
    }));
  };

  const handleUnitsChange = (value: string) => {
    if (value === "") {
      setFormData((prev) => ({
        ...prev,
        operational: {
          ...prev.operational,
          units: null,
        },
      }));
      return;
    }
    
    const units = parseFloat(value);
    if (isNaN(units) || units < 0) return;
    
    // Prevent unreasonably large values (likely typos)
    if (units > 1000000) return;
    
    setFormData((prev) => ({
      ...prev,
      operational: {
        ...prev.operational,
        units,
      },
    }));
  };

  const handleOutputDimensionChange = (productIndex: number, field: 'width' | 'height', value: string) => {
    const v = value === "" ? 0 : parseFloat(value);
    setOutputDimensions(prev => ({
      ...prev,
      [productIndex]: {
        ...prev[productIndex],
        [field]: v
      }
    }));
  };





  // ===== Modal state =====
  const [openIdx, setOpenIdx] = React.useState<number | null>(null);
  const [showPricingLogic, setShowPricingLogic] = React.useState(false);
  const [showPaperPrice, setShowPaperPrice] = React.useState<number | null>(null);
  const [showCostBreakdown, setShowCostBreakdown] = React.useState(false);
  const [showFinishingDetails, setShowFinishingDetails] = React.useState(false);
  const openData =
    openIdx != null
      ? (() => {
          // Find which product and paper index this global paper index corresponds to
          let productIndex = 0;
          let paperIndex = 0;
          let currentPaperCount = 0;
          
          for (let pi = 0; pi < formData.products.length; pi++) {
            if (openIdx >= currentPaperCount && openIdx < currentPaperCount + formData.products[pi].papers.length) {
              productIndex = pi;
              paperIndex = openIdx - currentPaperCount;
              break;
            }
            currentPaperCount += formData.products[pi].papers.length;
          }
          
          return {
            paper: formData.products[productIndex]?.papers[paperIndex],
            op: formData.operational.papers[openIdx],
            calc: perPaperCalc[productIndex]?.[paperIndex],
          };
        })()
      : null;

  // ===== Supplier Database state =====
  const [suppliers, setSuppliers] = React.useState<any[]>([
    // Initial sample suppliers for dropdown
    {
      id: 'initial-supplier-1',
      name: 'Premium Print Supplies',
      contact: 'Mohammed Al Rashid',
      email: 'mohammed@premiumprint.ae',
      phone: '0505555555',
      country: 'UAE',
      city: 'Dubai'
    },
    {
      id: 'initial-supplier-2',
      name: 'Paper Source LLC',
      contact: 'Ahmed Al Mansouri',
      email: 'ahmed@papersourcellc.ae',
      phone: '0501234567',
      country: 'UAE',
      city: 'Dubai'
    }
  ]);
  const [materials, setMaterials] = React.useState<any[]>([
    // Initial sample data to show something immediately
    {
      id: 'initial-1',
      name: 'Premium Card Stock 300gsm',
      gsm: '300',
      cost: 0.85,
      unit: 'per_sheet',
      supplierName: 'Premium Print Supplies',
      supplierContact: 'Mohammed Al Rashid',
      supplierEmail: 'mohammed@premiumprint.ae',
      supplierPhone: '0505555555',
      supplierCountry: 'UAE',
      supplierCity: 'Dubai'
    },
    {
      id: 'initial-2',
      name: 'Glossy Paper 200gsm',
      gsm: '200',
      cost: 0.35,
      unit: 'per_sheet',
      supplierName: 'Paper Source LLC',
      supplierContact: 'Ahmed Al Mansouri',
      supplierEmail: 'ahmed@papersourcellc.ae',
      supplierPhone: '0501234567',
      supplierCountry: 'UAE',
      supplierCity: 'Dubai'
    }
  ]);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = React.useState(false);
  const [supplierSearchTerm, setSupplierSearchTerm] = React.useState('');
  const [selectedSupplier, setSelectedSupplier] = React.useState('');
  const [selectedGSM, setSelectedGSM] = React.useState('');

  // ===== Fetch suppliers and materials =====
  const fetchSuppliersAndMaterials = async () => {
    try {
      setIsLoadingSuppliers(true);
      console.log('🔄 Fetching suppliers and materials...');
      
      const response = await fetch('/api/suppliers');
      if (!response.ok) {
        throw new Error(`Failed to fetch suppliers: ${response.status}`);
      }
      
      const suppliersData = await response.json();
      console.log('📊 Suppliers data received:', suppliersData.length, 'suppliers');
      setSuppliers(suppliersData);
      
      // Extract all materials from suppliers
      const allMaterials = suppliersData.reduce((acc: any[], supplier: any) => {
        if (supplier.materials && Array.isArray(supplier.materials)) {
          const materialsWithSupplier = supplier.materials.map((material: any) => ({
            id: material.id,
            materialId: material.materialId,
            name: material.name,
            gsm: material.gsm,
            cost: material.cost,
            unit: material.unit,
            status: material.status,
            supplierName: supplier.name,
            supplierContact: supplier.contact,
            supplierEmail: supplier.email,
            supplierPhone: supplier.phone,
            supplierCountry: supplier.country,
            supplierCity: supplier.city
          }));
          acc.push(...materialsWithSupplier);
        }
        return acc;
      }, []);
      
      console.log('📦 Total materials extracted:', allMaterials.length);
      setMaterials(allMaterials);
    } catch (error) {
      console.error('❌ Error fetching suppliers:', error);
      // Keep the initial sample data if API fails
      console.log('Using fallback data');
    } finally {
      setIsLoadingSuppliers(false);
    }
  };

  // ===== Auto-fetch data on component mount =====
  React.useEffect(() => {
    fetchSuppliersAndMaterials();
  }, []);
  
  // ===== Auto-fill finishing costs based on Step 3 selections =====
  React.useEffect(() => {
    console.log('DEBUG: Step 4 useEffect triggered - refreshing finishing data');
    console.log('DEBUG: Current formData.products:', formData.products);
    
    // Get all unique finishing names from Step 3 selections
    const allFinishingNames = new Set<string>();
    
    formData.products.forEach(product => {
      if (product.finishing && Array.isArray(product.finishing)) {
        product.finishing.forEach(finishingName => {
          // Extract base finishing name (remove side suffix)
          const baseFinishingName = finishingName.split('-')[0];
          allFinishingNames.add(baseFinishingName);
        });
      }
    });

    console.log('DEBUG: Found finishing names from Step 3:', Array.from(allFinishingNames));

    // Update operational finishing with auto-calculated costs
    setFormData((prev) => {
      // COMPLETELY CLEAR old finishing data and start fresh
      const newOperationalFinishing: { name: string; cost: number | null }[] = [];

      // Add only the finishing options that are actually selected in Step 3
      // Note: Costs are now calculated automatically in the display, so we don't need to pre-calculate them here
      allFinishingNames.forEach(finishingName => {
        // Skip any incorrect "Uv spot" entries
        if (finishingName.toLowerCase() === 'uv spot' && finishingName !== 'UV Spot') {
          console.log('DEBUG: Skipping incorrect "Uv spot" entry');
          return;
        }
        
        // Only add if it's actually selected in Step 3
        const isSelectedInStep3 = formData.products.some(product => 
          product.finishing && product.finishing.some(f => {
            const baseName = f.split('-')[0];
            return baseName.toLowerCase() === finishingName.toLowerCase();
          })
        );
        
        if (isSelectedInStep3) {
          console.log('DEBUG: Adding finishing:', finishingName);
          newOperationalFinishing.push({
            name: finishingName,
            cost: null // Cost will be calculated automatically based on formula
          });
        } else {
          console.log('DEBUG: Skipping finishing not selected in Step 3:', finishingName);
        }
      });

      console.log('DEBUG: Setting new operational finishing:', newOperationalFinishing);

      return {
        ...prev,
        operational: {
          ...prev.operational,
          finishing: newOperationalFinishing
        }
      };
    });
  }, [formData.products, setFormData]);
  
  // ===== Clean up incorrect UV Spot entries =====
  React.useEffect(() => {
    setFormData((prev) => {
      const hasIncorrectUVSpot = prev.operational.finishing.some(f => 
        f.name.toLowerCase() === 'uv spot' && f.name !== 'UV Spot'
      );
      
      if (hasIncorrectUVSpot) {
        console.log('DEBUG: Found incorrect UV Spot entry, cleaning up...');
        const cleanedFinishing = prev.operational.finishing.filter(f => 
          !(f.name.toLowerCase() === 'uv spot' && f.name !== 'UV Spot')
        );
        
        return {
          ...prev,
          operational: {
            ...prev.operational,
            finishing: cleanedFinishing
          }
        };
      }
      
      return prev;
    });
  }, [setFormData]);
  
  // ===== Auto-update finishing costs when impressions change =====
  React.useEffect(() => {
    console.log('DEBUG: Impressions changed, recalculating finishing costs');
    console.log('DEBUG: Current impressions:', formData.operational.impressions);
    
    // Force re-render of finishing cost calculations
    // The calculateIndividualFinishingCost function will now use the updated impressions value
  }, [formData.operational.impressions]);
  
  // ===== Force default input dimensions on component mount =====
  React.useEffect(() => {
    // This effect runs once on mount to ensure defaults are set
    setFormData((prev) => {
      const nextPapers = prev.operational.papers.map((p, i) => {
        const updatedPaper = { ...p };
        
        // Force set to 100x70 on first load
        if (updatedPaper.inputWidth !== 100) {
          updatedPaper.inputWidth = 100;
        }
        if (updatedPaper.inputHeight !== 70) {
          updatedPaper.inputHeight = 70;
        }
        
        return updatedPaper;
      });

      const hasChanges = nextPapers.some((p, i) => 
        p.inputWidth !== prev.operational.papers[i]?.inputWidth ||
        p.inputHeight !== prev.operational.papers[i]?.inputHeight
      );

      if (!hasChanges) return prev;

      return {
        ...prev,
        operational: {
          ...prev.operational,
          papers: nextPapers,
        },
      };
    });
  }, []); // Empty dependency array means this runs only once on mount

  // ===== Filter materials based on search and filters =====
  const filteredMaterials = React.useMemo(() => {
    let filtered = materials;
    
    // Filter by search term
    if (supplierSearchTerm) {
      filtered = filtered.filter(material => 
        material.name.toLowerCase().includes(supplierSearchTerm.toLowerCase()) ||
        material.gsm?.toLowerCase().includes(supplierSearchTerm.toLowerCase()) ||
        material.supplierName.toLowerCase().includes(supplierSearchTerm.toLowerCase())
      );
    }
    
    // Filter by supplier
    if (selectedSupplier) {
      filtered = filtered.filter(material => material.supplierName === selectedSupplier);
    }
    
    // Filter by GSM range
    if (selectedGSM) {
      const [min, max] = selectedGSM.split('-').map(Number);
      if (max) {
        filtered = filtered.filter(material => {
          const gsm = parseInt(material.gsm);
          return gsm >= min && gsm <= max;
        });
      } else if (selectedGSM === '400+') {
        filtered = filtered.filter(material => {
          const gsm = parseInt(material.gsm);
          return gsm >= 400;
        });
      }
    }
    
    return filtered;
  }, [materials, supplierSearchTerm, selectedSupplier, selectedGSM]);

  // ===== Currency formatter =====
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);



  // ===== Enhanced pricing calculation with packet + sheet logic =====
  const calculateTotalCost = (opPaper: any, actualSheetsNeeded: number) => {
    if (!opPaper) return 0;
    
    const { pricePerSheet, pricePerPacket, sheetsPerPacket } = opPaper;
    
    // If only packet pricing is available
    if (pricePerPacket != null && sheetsPerPacket != null && sheetsPerPacket > 0 && pricePerSheet == null) {
      const packetsNeeded = Math.ceil(actualSheetsNeeded / sheetsPerPacket);
      return packetsNeeded * pricePerPacket;
    }
    
    // If only sheet pricing is available
    if (pricePerSheet != null && (pricePerPacket == null || sheetsPerPacket == null || sheetsPerPacket <= 0)) {
      return actualSheetsNeeded * pricePerSheet;
    }
    
    // If both are available, use packet first, then sheet pricing for remaining
    if (pricePerSheet != null && pricePerPacket != null && sheetsPerPacket != null && sheetsPerPacket > 0) {
      const fullPackets = Math.floor(actualSheetsNeeded / sheetsPerPacket);
      const remainingSheets = actualSheetsNeeded % sheetsPerPacket;
      
      const packetCost = fullPackets * pricePerPacket;
      const sheetCost = remainingSheets * pricePerSheet;
      
      return packetCost + sheetCost;
    }
    
    return 0;
  };

  // ===== Calculate plates cost =====
  const calculatePlatesCost = () => {
    const platesCount = formData.operational.plates ?? plates ?? 0;
    // Standard plate cost - can be made configurable later
    const costPerPlate = 25; // AED 25 per plate
    return platesCount * costPerPlate;
  };

  // ===== Calculate units cost =====
  const calculateUnitsCost = () => {
    const unitsCount = formData.operational.units ?? units ?? 0;
    // Standard unit cost - can be made configurable later
    const costPerUnit = 0.05; // AED 0.05 per unit
    return unitsCount * costPerUnit;
  };

  // ===== Calculate individual finishing cost =====
  const calculateIndividualFinishingCost = (finishingName: string, product: any, productIndex: number) => {
    // Use the same logic as the display to get sheet count
    const actualSheetsNeeded = formData.operational.papers[productIndex]?.enteredSheets ?? 
                               perPaperCalc[productIndex]?.[0]?.recommendedSheets ?? 0;
    // Use impressions field if available, otherwise fall back to product quantity
    const totalQuantity = formData.operational.impressions || product.quantity || 0;
    
    console.log('DEBUG: calculateIndividualFinishingCost called with:');
    console.log('  finishingName:', finishingName);
    console.log('  productIndex:', productIndex);
    console.log('  actualSheetsNeeded:', actualSheetsNeeded);
    console.log('  totalQuantity:', totalQuantity);
    
    // Extract base finishing name (remove side suffix like "-Front", "-Back", "-Both")
    const baseFinishingName = finishingName.split('-')[0];
    const sideInfo = finishingName.includes('-') ? finishingName.split('-')[1] : 'Front';
    let finishingCost = 0;
    
    switch (baseFinishingName) {
      case 'Lamination':
        // a. Laminated: minimum cost is 75 AED, and 0.75 AED per sheet. (formula: 75+(sheets*0.75))
        finishingCost = 75 + (actualSheetsNeeded * 0.75);
        console.log('DEBUG: Lamination calculation: 75 + (' + actualSheetsNeeded + ' * 0.75) = ' + finishingCost);
        
        // Double the cost if applied to both sides
        if (sideInfo === 'Both') {
          finishingCost = finishingCost * 2;
        }
        break;
        
      case 'Velvet Lamination':
        // b. Velvet laminated: minimum cost is 100 AED, and 1 AED per sheet. (formula: 100+(sheet*1))
        finishingCost = 100 + (actualSheetsNeeded * 1.0);
        
        // Double the cost if applied to both sides
        if (sideInfo === 'Both') {
          finishingCost = finishingCost * 2;
        }
        break;
        
      case 'Embossing':
        // c. Embossing: impression charge 50 AED per 1000. Minimum charge is 75 AED. 
        // by default it set as 1000 impression and minimum is 75 AED. 
        // formula: 75+(50AED per 1000 impression). set as minimum impression as 1000 so by default is (75+50)
        const embossingImpressions = Math.max(1000, totalQuantity); // Minimum 1000 impressions
        const embossingImpressionCost = Math.ceil(embossingImpressions / 1000) * 50;
        finishingCost = Math.max(75, embossingImpressionCost);
        
        // Double the cost if applied to both sides
        if (sideInfo === 'Both') {
          finishingCost = finishingCost * 2;
        }
        break;
        
      case 'Foiling':
        // d. FOILLING: Impression charge 75 AED per 1000. Minimum cost is 75. (formula: 75+75 per 1000 impression)
        const foilingImpressions = Math.max(1000, totalQuantity); // Minimum 1000 impressions
        const foilingImpressionCost = Math.ceil(foilingImpressions / 1000) * 75;
        finishingCost = Math.max(75, foilingImpressionCost);
        
        // Double the cost if applied to both sides
        if (sideInfo === 'Both') {
          finishingCost = finishingCost * 2;
        }
        break;
        
      case 'Die Cutting':
        // e. Die cutting: Impression charge 50 AED per 1000. Minimum cost is 75 AED. formula: (75+50 per 1000 impression)
        // specific size: Minimum price: 75 AED for A5, 100 AED for A4, 150 AED for A3, 200 AED for A2
        const dieCuttingImpressions = Math.max(1000, totalQuantity); // Minimum 1000 impressions
        const dieCuttingImpressionCost = Math.ceil(dieCuttingImpressions / 1000) * 50;
        
        // Min charges by size
        let minCharge = 75; // Default A5
        if (product.flatSize && product.flatSize.width && product.flatSize.height) {
          const area = product.flatSize.width * product.flatSize.height;
          if (area <= 210 * 148) { // A5 size
            minCharge = 75;
          } else if (area <= 297 * 210) { // A4 size
            minCharge = 100;
          } else if (area <= 420 * 297) { // A3 size
            minCharge = 150;
          } else { // A2 and larger
            minCharge = 200;
          }
        }
        finishingCost = Math.max(minCharge, dieCuttingImpressionCost);
        break;
        
      case 'UV Spot':
        // f. UV Spot: 350 AED per 1000 impression with 350 AED minimum of cost. formula: (350+350 per 1000 impression)
        const uvSpotImpressions = Math.max(1000, totalQuantity); // Minimum 1000 impressions
        const uvSpotImpressionCost = Math.ceil(uvSpotImpressions / 1000) * 350;
        finishingCost = Math.max(350, uvSpotImpressionCost);
        console.log('DEBUG: UV Spot calculation:');
        console.log('  totalQuantity:', totalQuantity);
        console.log('  uvSpotImpressions:', uvSpotImpressions);
        console.log('  uvSpotImpressionCost:', uvSpotImpressionCost);
        console.log('  finishingCost:', finishingCost);
        
        // Double the cost if applied to both sides
        if (sideInfo === 'Both') {
          finishingCost = finishingCost * 2;
        }
        break;
        
      case 'Folding':
        // g. Folding charges: impression cost is 25 AED per 1000 impression. minimum cost is 25. formula: 25+25 per 1000 impression
        const foldingImpressions = Math.max(1000, totalQuantity); // Minimum 1000 impressions
        const foldingImpressionCost = Math.ceil(foldingImpressions / 1000) * 25;
        finishingCost = Math.max(25, foldingImpressionCost);
        break;
        
      case 'Padding':
        // Fixed minimum charge 25 dhs
        finishingCost = 25;
        break;
        
      case 'Varnishing':
        // Fixed minimum charge 30 dhs
        finishingCost = 30;
        break;
        
      default:
        // Fallback to manual cost if set in operational finishing
        const finishingItem = formData.operational.finishing.find(f => f.name === finishingName);
        if (finishingItem && finishingItem.cost != null) {
          finishingCost = finishingItem.cost * actualSheetsNeeded;
        }
        break;
    }
    
    console.log('DEBUG: Calculated cost for', finishingName, ':', finishingCost);
    return finishingCost;
  };

  // ===== Calculate finishing costs =====
  const calculateFinishingCosts = () => {
    let totalFinishingCost = 0;
    
    // REQUIREMENT: Finishing costs should be calculated once at the end, not per paper
    // Collect all unique finishing types across all products
    const allFinishingTypes = new Set<string>();
    
    formData.products.forEach((product) => {
      if (product.finishing && product.finishing.length > 0) {
        product.finishing.forEach(finishingName => {
          allFinishingTypes.add(finishingName);
        });
      }
    });
    
    // Calculate cost for each unique finishing type once
    allFinishingTypes.forEach(finishingName => {
      // Use the first product that has this finishing type for calculation
      const productWithFinishing = formData.products.find(product => 
        product.finishing && product.finishing.includes(finishingName)
      );
      
      if (productWithFinishing) {
        const productIndex = formData.products.indexOf(productWithFinishing);
        totalFinishingCost += calculateIndividualFinishingCost(finishingName, productWithFinishing, productIndex);
      }
    });
    
    return totalFinishingCost;
  };

  // ===== Calculate total project cost =====
  const calculateTotalProjectCost = () => {
    let totalCost = 0;
    
    // Paper costs
    formData.operational.papers.forEach((opPaper, index) => {
      const actualSheetsNeeded = opPaper.enteredSheets ?? 
                                 perPaperCalc[Math.floor(index / formData.products[0]?.papers.length || 1)]?.[index % (formData.products[0]?.papers.length || 1)]?.recommendedSheets ?? 0;
      totalCost += calculateTotalCost(opPaper, actualSheetsNeeded);
    });
    
    // Plates cost
    totalCost += calculatePlatesCost();
    
    // Units cost
    totalCost += calculateUnitsCost();
    
    // Finishing costs
    totalCost += calculateFinishingCosts();
    
    // Additional costs
    totalCost += additionalCosts.reduce((acc, cost) => acc + cost.cost, 0);
    
    return totalCost;
  };

  // ===== Calculate cost per unit =====
  const calculateCostPerUnit = () => {
    const totalCost = calculateTotalProjectCost();
    const totalQuantity = formData.products.reduce((acc, product) => acc + (product.quantity || 0), 0);
    return totalQuantity > 0 ? totalCost / totalQuantity : 0;
  };

  // ===== Get pricing breakdown for display =====
  const getPricingBreakdown = (opPaper: any, actualSheetsNeeded: number) => {
    if (!opPaper) return { breakdown: [], totalCost: 0 };
    
    const { pricePerSheet, pricePerPacket, sheetsPerPacket } = opPaper;
    const breakdown: Array<{ type: string; quantity: number; unitPrice: number; total: number; description: string }> = [];
    let totalCost = 0;
    
    // If only packet pricing is available
    if (pricePerPacket != null && sheetsPerPacket != null && sheetsPerPacket > 0 && pricePerSheet == null) {
      const packetsNeeded = Math.ceil(actualSheetsNeeded / sheetsPerPacket);
      const cost = packetsNeeded * pricePerPacket;
      breakdown.push({
        type: 'packet',
        quantity: packetsNeeded,
        unitPrice: pricePerPacket,
        total: cost,
        description: `${packetsNeeded} packet(s) × ${fmt(pricePerPacket)}`
      });
      totalCost = cost;
    }
    
    // If only sheet pricing is available
    else if (pricePerSheet != null && (pricePerPacket == null || sheetsPerPacket == null || sheetsPerPacket <= 0)) {
      const cost = actualSheetsNeeded * pricePerSheet;
      breakdown.push({
        type: 'sheet',
        quantity: actualSheetsNeeded,
        unitPrice: pricePerSheet,
        total: cost,
        description: `${actualSheetsNeeded} sheet(s) × ${fmt(pricePerSheet)}`
      });
      totalCost = cost;
    }
    
    // If both are available, use packet first, then sheet pricing for remaining
    else if (pricePerSheet != null && pricePerPacket != null && sheetsPerPacket != null && sheetsPerPacket > 0) {
      const fullPackets = Math.floor(actualSheetsNeeded / sheetsPerPacket);
      const remainingSheets = actualSheetsNeeded % sheetsPerPacket;
      
      if (fullPackets > 0) {
        const packetCost = fullPackets * pricePerPacket;
        breakdown.push({
          type: 'packet',
          quantity: fullPackets,
          unitPrice: pricePerPacket,
          total: packetCost,
          description: `${fullPackets} packet(s) × ${fmt(pricePerPacket)}`
        });
        totalCost += packetCost;
      }
      
      if (remainingSheets > 0) {
        const sheetCost = remainingSheets * pricePerSheet;
        breakdown.push({
          type: 'sheet',
          quantity: remainingSheets,
          unitPrice: pricePerSheet,
          total: sheetCost,
          description: `${remainingSheets} sheet(s) × ${fmt(pricePerSheet)}`
        });
        totalCost += sheetCost;
      }
    }
    
    return { breakdown, totalCost };
  };

  // ===== Costing Analysis Functions =====
  
  // Load pricing data on component mount
  React.useEffect(() => {
    const loadPricingData = async () => {
      try {
        setLoadingPricing(true);
        const { digital, offset } = await PricingService.getAllPricing();
        setDigitalPricing(digital);
        setOffsetPricing(offset);
        console.log('Pricing data loaded:', { digital, offset });
      } catch (error) {
        console.error('Error loading pricing data:', error);
      } finally {
        setLoadingPricing(false);
      }
    };

    loadPricingData();
  }, []);

  // Calculate costing for the first product
  const calculateCosting = (product: any) => {
    if (!digitalPricing || !offsetPricing) {
      console.log('Pricing data not loaded yet');
      return;
    }
    
    // Validate product data
    const width = product.flatSize?.width || 0;
    const height = product.flatSize?.height || 0;
    const quantity = product.quantity || 0;
    const sides = parseInt(product.sides || '1') || 1;
    const colorsFront = parseInt(product.colors?.front || '0') || 0;
    const colorsBack = parseInt(product.colors?.back || '0') || 0;
    
    console.log('Calculating costing with:', {
      width, height, quantity, sides, colorsFront, colorsBack,
      digitalPricing, offsetPricing
    });
    
    if (width <= 0 || height <= 0 || quantity <= 0) {
      console.log('Invalid product dimensions or quantity');
      return;
    }
    
    try {
      // Calculate digital costing
      const digitalResults = calcDigitalCosting({
        qty: quantity,
        piece: { w: width, h: height },
        sides: sides as 1 | 2,
        colorsF: colorsFront as 1 | 2 | 4,
        colorsB: colorsBack as 1 | 2 | 4,
        perClick: digitalPricing.perClick,
        parentCost: digitalPricing.parentSheetCost,
        wasteParents: digitalPricing.wasteParents,
        bleed: product.bleed || 0.3,
        gapX: product.gap || 0.5,
        gapY: product.gap || 0.5,
        allowRotate: true
      });
      
      console.log('Digital costing results:', digitalResults);
      setDigitalCostingResults(digitalResults);
      
      // For Digital printing, automatically select the cheapest option
      if (digitalResults.length > 0) {
        const cheapest = digitalResults.reduce((min, current) => 
          current.total < min.total ? current : min
        );
        setSelectedDigitalOption(cheapest.option);
      }
      
      // Calculate offset costing
      const offsetResult = calcOffsetCosting({
        qty: quantity,
        parent: { w: 100, h: 70 }, // PARENT stock
        press: { w: 35, h: 50, label: '35×50 cm' }, // 35×50 press
        piece: { w: width, h: height },
        sides: sides as 1 | 2,
        colorsF: colorsFront as 1 | 2 | 4,
        colorsB: colorsBack as 1 | 2 | 4,
        pricing: offsetPricing,
        bleed: product.bleed || 0.3,
        gapX: product.gap || 0.5,
        gapY: product.gap || 0.5,
        allowRotate: true
      });
      
      console.log('Offset costing result:', offsetResult);
      setOffsetCostingResult(offsetResult);
      
      // Set default selection to 35x50 if enabled
      if (offsetResult.pressPerParent > 0 && !selectedOffsetPress) {
        setSelectedOffsetPress('35×50 cm');
      }
      
    } catch (error) {
      console.error('Error calculating costing:', error);
    }
  };

  // Trigger costing calculation when product changes
  React.useEffect(() => {
    if (formData.products.length > 0 && digitalPricing && offsetPricing) {
      calculateCosting(formData.products[0]);
    }
  }, [formData.products, digitalPricing, offsetPricing]);

  // ===== Render =====
  return (
    <div className="space-y-6 md:space-y-8 px-4 md:px-0">
      {/* Header */}
      <div className="text-center space-y-3">
        <h3 className="text-xl md:text-2xl font-bold text-slate-900">Operational Details</h3>
        <p className="text-sm md:text-base text-slate-600">Configure paper specifications, costs, and production details</p>
      </div>



      {formData.products.map((product, productIndex) => (
        <div key={productIndex} className="space-y-6 md:space-y-8">
          {/* Product Header */}
          <div className="bg-[#27aae1]/10 rounded-xl border border-[#27aae1]/30 p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h4 className="text-lg md:text-xl font-bold text-[#27aae1] flex items-center">
                  <Package className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3" />
                  Product {productIndex + 1}: {product.productName || `Product ${productIndex + 1}`}
                </h4>
                <div className="mt-2 text-[#27aae1] text-sm md:text-base">
                  Quantity: {product.quantity || 0} | Sides: {product.sides} | Printing: {product.printingSelection}
                </div>
              </div>
              {/* Product Color Summary Badge */}
              {(() => {
                const totalColors = product.papers.reduce((total, _, paperIdx) => {
                  return total + (paperColors[productIndex]?.[paperIdx]?.length || 0);
                }, 0);
                
                if (totalColors > 0) {
                  return (
                    <div className="flex items-center gap-2 px-3 md:px-4 py-2 bg-[#ea078b]/20 border border-[#ea078b]/50 rounded-full self-start sm:self-auto">
                      <Palette className="w-4 h-4 text-[#ea078b]" />
                      <span className="text-sm font-semibold text-[#ea078b]">
                        {totalColors} color{totalColors !== 1 ? 's' : ''} total
                      </span>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </div>


          {product.papers.map((paper, paperIndex) => {
            // Calculate the global paper index for this product's paper
            let globalPaperIndex = 0;
            for (let pi = 0; pi < productIndex; pi++) {
              globalPaperIndex += formData.products[pi].papers.length;
            }
            globalPaperIndex += paperIndex;
            
            const opPaper = formData.operational.papers[globalPaperIndex];
            const { layout, recommendedSheets, pricePerSheet } = perPaperCalc[productIndex]?.[paperIndex] ?? {
              layout: {
                usableW: 0,
                usableH: 0,
                itemsPerSheet: 0,
                efficiency: 0,
                orientation: 'normal' as const,
                itemsPerRow: 0,
                itemsPerCol: 0
              },
              recommendedSheets: 0,
              pricePerSheet: null as number | null,
            };
            

            const inputWidth = opPaper?.inputWidth ?? null;
            const inputHeight = opPaper?.inputHeight ?? null;
            const qty = product?.quantity ?? 0;
            const enteredSheets = opPaper?.enteredSheets ?? null;

            const sheetsNeeded = layout.itemsPerSheet > 0 ? Math.ceil(qty / layout.itemsPerSheet) : 0;
            const actualSheetsNeeded = enteredSheets ? Math.max(sheetsNeeded, enteredSheets) : sheetsNeeded;
            const totalItemsPossible = actualSheetsNeeded * layout.itemsPerSheet;

            // Validation checks
            const dimensionError = validateOutputDimensions(
              outputDimensions[productIndex]?.width ?? 0, 
              outputDimensions[productIndex]?.height ?? 0, 
              inputWidth, 
              inputHeight
            );

            return (
              <div key={`${productIndex}-${paperIndex}`} className="space-y-4 md:space-y-6">
                                {/* Paper Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <h4 className="text-base md:text-lg font-semibold text-slate-800 flex items-center">
                      <Package className="w-4 h-4 md:w-5 md:h-5 mr-2 text-[#27aae1]" />
                      <span className="text-[#27aae1]">
                        {paper.name ? `${paper.name}${paper.gsm ? ` ${paper.gsm}gsm` : ""}` : `Paper ${paperIndex + 1}${paper.gsm ? ` ${paper.gsm}gsm` : ""}`}
                      </span>
                    </h4>
                    {/* Color Count Badge */}
                    {paperColors[productIndex]?.[paperIndex]?.length > 0 && (
                      <div className="flex items-center gap-2 px-3 py-1 bg-[#ea078b]/10 border border-[#ea078b]/30 rounded-full">
                        <Palette className="w-3 h-3 text-[#ea078b]" />
                        <span className="text-xs font-medium text-[#ea078b]">
                          {paperColors[productIndex][paperIndex].length} color{paperColors[productIndex][paperIndex].length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPaperPrice(globalPaperIndex)}
                      className="border-[#27aae1] text-[#27aae1] hover:bg-[#27aae1]/100 rounded-xl text-xs sm:text-sm"
                    >
                      <Calculator className="w-4 h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">View Paper Price</span>
                      <span className="sm:hidden">Paper Price</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCostBreakdown(true)}
                      className="border-green-500 text-green-600 hover:bg-green-50 rounded-xl text-xs sm:text-sm"
                    >
                      <BarChart3 className="w-4 h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">View Cost Breakdown</span>
                      <span className="sm:hidden">Cost Breakdown</span>
                    </Button>
                  </div>
                </div>

            {/* Dimension Validation Warning */}
            {dimensionError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                  <span className="text-red-800 font-medium">{dimensionError}</span>
                </div>
              </div>
            )}
            
            {/* Output Dimensions Required Warning */}
            {(!outputDimensions[productIndex]?.width || !outputDimensions[productIndex]?.height) && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mr-2" />
                  <div>
                    <span className="text-amber-800 font-medium">Output dimensions required</span>
                    <div className="text-amber-700 text-sm mt-1">
                      Please set the output item dimensions in Step 3 before configuring operational details. 
                      This ensures accurate sheet calculations and cost estimates.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Three Cards Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
              {/* CARD 1: Paper Details */}
              <Card className="border-0 shadow-lg w-full">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-slate-800 flex items-center">
                    <Package className="w-5 h-5 mr-2 text-[#27aae1]" />
                    Paper Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 md:space-y-6">
                  {/* Paper Size Section */}
                  <div className="space-y-3 md:space-y-4">
                    <h5 className="text-md font-semibold text-slate-700 flex items-center mb-3">
                      <Package className="w-4 h-4 mr-2 text-[#27aae1]" />
                      Input Sheet Size
                      <span className="ml-2 text-xs text-[#27aae1] font-normal">(Default: 100×70 cm)</span>
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          Width (cm)
                        </Label>
                        <Input
                          type="number"
                          placeholder="100"
                          min={0}
                          step="0.1"
                          value={opPaper?.inputWidth ?? 100}
                          className="border-slate-300 focus:border-[#27aae1] focus:ring-[#27aae1] rounded-xl h-10 w-full"
                          onChange={(e) =>
                            handlePaperOpChange(globalPaperIndex, "inputWidth", e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          Height (cm)
                        </Label>
                        <Input
                          type="number"
                          placeholder="70"
                          value={opPaper?.inputHeight ?? 70}
                          className="border-slate-300 focus:border-[#27aae1] focus:ring-[#27aae1] rounded-xl h-10 w-full"
                          min={0}
                          step="0.1"
                          onChange={(e) =>
                            handlePaperOpChange(globalPaperIndex, "inputHeight", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Output Size Section - Read Only */}
                  <div className="space-y-3 md:space-y-4">
                    <h5 className="text-md font-semibold text-slate-700 flex items-center mb-3">
                      <Info className="w-4 h-4 mr-2 text-[#27aae1]" />
                      Output Item Size
                      <span className="ml-2 text-xs text-[#27aae1] font-normal">(From Step 3 - Read Only)</span>
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          Output Width (cm)
                        </Label>
                        <Input
                          type="number"
                          placeholder="Width"
                          min={0}
                          step="0.1"
                          readOnly
                          disabled
                          className={`border-slate-300 bg-slate-100 text-slate-500 cursor-not-allowed rounded-xl h-10 w-full ${
                            dimensionError ? 'border-red-300 bg-red-50' : ''
                          }`}
                          value={outputDimensions[productIndex]?.width || ""}
                        />
                        {!outputDimensions[productIndex]?.width && (
                          <div className="text-amber-600 text-xs mt-1">
                            ⚠️ Please set output dimensions in Step 3 first
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          Output Height (cm)
                        </Label>
                        <Input
                          type="number"
                          placeholder="Height"
                          min={0}
                          step="0.1"
                          readOnly
                          disabled
                          className={`border-slate-300 bg-slate-100 text-slate-500 cursor-not-allowed rounded-xl h-10 w-full ${
                            dimensionError ? 'border-red-300 bg-red-50' : ''
                          }`}
                          value={outputDimensions[productIndex]?.height || ""}
                        />
                        {!outputDimensions[productIndex]?.height && (
                          <div className="text-xs text-amber-600 mt-1">
                            ⚠️ Please set output dimensions in Step 3 first
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sheet Management Section */}
                  <div className="space-y-3 md:space-y-4">
                    <h5 className="text-md font-semibold text-slate-700 flex items-center mb-3">
                      <BarChart3 className="w-4 h-4 mr-2 text-[#27aae1]" />
                      Sheet Management
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          Recommended Sheets
                        </Label>
                        <Input
                          value={recommendedSheets || ""}
                          readOnly
                          className="bg-slate-100 border-slate-300 rounded-xl h-10 w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          Enter Sheets
                          {!opPaper?.enteredSheets && (
                            <span className="ml-2 text-xs text-[#27aae1] font-normal">
                              (Default: {recommendedSheets})
                            </span>
                          )}
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          placeholder={recommendedSheets ? String(recommendedSheets) : "e.g. 125"}
                          className={`border-slate-300 focus:border-[#27aae1] focus:ring-[#27aae1] rounded-xl h-10 w-full ${
                            !opPaper?.enteredSheets ? 'bg-[#27aae1]/10 border-[#27aae1]/30' : ''
                          }`}
                          value={opPaper?.enteredSheets ?? recommendedSheets ?? ""}
                          onChange={(e) => {
                              handlePaperOpChange(globalPaperIndex, "enteredSheets", e.target.value);
                          }}
                        />
                        {opPaper?.enteredSheets && opPaper.enteredSheets < recommendedSheets && (
                          <div className="text-amber-600 text-xs mt-1 flex items-center gap-2">
                            <span>⚠ Less than recommended ({recommendedSheets})</span>
                            <button
                              type="button"
                              onClick={() => {
                                // Add "No TRN" option or similar justification
                                const justification = prompt("Please provide justification for using fewer sheets (e.g., 'No TRN', 'Special arrangement', etc.):");
                                if (justification && justification.trim()) {
                                  // Store the justification or show it in the UI
                                  console.log(`Justification for ${opPaper.enteredSheets} sheets: ${justification}`);
                                }
                              }}
                              className="text-xs text-[#27aae1] hover:text-[#27aae1] underline"
                            >
                              Add justification
                            </button>
                          </div>
                        )}
                        {/* Enhanced auto-selection info */}
                        {!opPaper?.enteredSheets ? (
                          <div className="text-[#27aae1] text-xs mt-1">
                            ✓ Using recommended sheets as default ({recommendedSheets})
                          </div>
                        ) : opPaper.enteredSheets === recommendedSheets ? (
                          <div className="text-green-600 text-xs mt-1">
                            ✓ Matches recommended sheets
                          </div>
                        ) : (
                          <div className="text-amber-600 text-xs mt-1 flex items-center justify-between">
                            <span>⚠ Custom value set (recommended: {recommendedSheets})</span>
                            <button
                              type="button"
                              onClick={() => {
                                const paperKey = `paper-${globalPaperIndex}`;
                                setUserEditedSheets(prev => {
                                  const newSet = new Set(prev);
                                  newSet.delete(paperKey);
                                  return newSet;
                                });
                                handlePaperOpChange(globalPaperIndex, "enteredSheets", String(recommendedSheets));
                              }}
                              className="text-xs text-[#27aae1] hover:text-[#27aae1] underline"
                            >
                              Reset to recommended
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Color Codes Section */}
                  <div className="space-y-3 md:space-y-4">
                    <h5 className="text-md font-semibold text-slate-700 flex items-center mb-3">
                      <Palette className="w-4 h-4 mr-2 text-[#27aae1]" />
                      Color Codes
                    </h5>
                    
                    <div className="text-xs text-slate-500 mb-2">
                      Add hex codes, Pantone colors, or color names for this paper
                    </div>
                    
                    {/* Color Input */}
                    <div className="flex flex-col sm:flex-row gap-2 mb-3">
                      <div className="flex-1 relative">
                        <Input
                          type="text"
                          placeholder="e.g., #FF0000, Pantone 185C, Red"
                          value={colorInputs[productIndex]?.[paperIndex] || ''}
                          onChange={(e) => {
                            const newColorInputs = { ...colorInputs };
                            if (!newColorInputs[productIndex]) newColorInputs[productIndex] = {};
                            newColorInputs[productIndex][paperIndex] = e.target.value;
                            setColorInputs(newColorInputs);
                          }}
                          className="h-8 text-sm pr-10 w-full"
                        />
                        {/* Color preview */}
                        {colorInputs[productIndex]?.[paperIndex] && (
                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                            <div 
                              className="w-4 h-4 rounded border border-slate-300"
                              style={{ 
                                backgroundColor: getColorFromInput(colorInputs[productIndex][paperIndex]),
                                backgroundImage: getColorFromInput(colorInputs[productIndex][paperIndex]) === 'transparent' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' : 'none',
                                backgroundSize: '4px 4px'
                              }}
                            ></div>
                          </div>
                        )}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const colorValue = colorInputs[productIndex]?.[paperIndex];
                          if (colorValue && colorValue.trim()) {
                            // Set saving status
                            const newColorSaveStatus = { ...colorSaveStatus };
                            if (!newColorSaveStatus[productIndex]) newColorSaveStatus[productIndex] = {};
                            newColorSaveStatus[productIndex][paperIndex] = 'saving';
                            setColorSaveStatus(newColorSaveStatus);
                            
                            // Add the color to the local state
                            const newColors = [...(paperColors[productIndex]?.[paperIndex] || [])];
                            newColors.push(colorValue.trim());
                            
                            const newPaperColors = { ...paperColors };
                            if (!newPaperColors[productIndex]) newPaperColors[productIndex] = {};
                            newPaperColors[productIndex][paperIndex] = newColors;
                            setPaperColors(newPaperColors);
                            
                            // Update the form data to sync with database
                            const globalPaperIndex = formData.products
                              .slice(0, productIndex)
                              .reduce((total, product) => total + product.papers.length, 0) + paperIndex;
                            
                            setFormData(prev => ({
                              ...prev,
                              operational: {
                                ...prev.operational,
                                papers: prev.operational.papers.map((paper, index) => 
                                  index === globalPaperIndex 
                                    ? { ...paper, selectedColors: newColors }
                                    : paper
                                )
                              }
                            }));
                            
                            // Clear input
                            const newColorInputs = { ...colorInputs };
                            newColorInputs[productIndex][paperIndex] = '';
                            setColorInputs(newColorInputs);
                            
                            // Set saved status after a short delay
                            setTimeout(() => {
                              setColorSaveStatus(prev => ({
                                ...prev,
                                [productIndex]: {
                                  ...prev[productIndex],
                                  [paperIndex]: 'saved'
                                }
                              }));
                              
                              // Reset to idle after 2 seconds
                              setTimeout(() => {
                                setColorSaveStatus(prev => ({
                                  ...prev,
                                  [productIndex]: {
                                    ...prev[productIndex],
                                    [paperIndex]: 'idle'
                                  }
                                }));
                              }, 2000);
                            }, 500);
                          }
                        }}
                        className={`h-8 px-3 text-xs transition-all duration-200 ${
                          colorSaveStatus[productIndex]?.[paperIndex] === 'saving' 
                            ? 'bg-[#27aae1]/20 text-[#27aae1] border-[#27aae1]/50' 
                            : colorSaveStatus[productIndex]?.[paperIndex] === 'saved'
                            ? 'bg-green-100 text-green-700 border-green-300'
                            : ''
                        }`}
                        disabled={!colorInputs[productIndex]?.[paperIndex]?.trim() || colorSaveStatus[productIndex]?.[paperIndex] === 'saving'}
                      >
                        {colorSaveStatus[productIndex]?.[paperIndex] === 'saving' ? (
                          <div className="w-3 h-3 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                        ) : colorSaveStatus[productIndex]?.[paperIndex] === 'saved' ? (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          'Add'
                        )}
                      </Button>
                    </div>
                    
                    {/* Display Colors */}
                    {paperColors[productIndex]?.[paperIndex]?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {paperColors[productIndex][paperIndex].map((colorCode, colorIndex) => (
                          <div key={colorIndex} className="flex items-center gap-2 px-2 py-1 bg-white rounded border border-slate-200">
                            <div 
                              className="w-3 h-3 rounded border border-slate-300"
                              style={{ 
                                backgroundColor: getColorFromInput(colorCode),
                                backgroundImage: getColorFromInput(colorCode) === 'transparent' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' : 'none',
                                backgroundSize: '3px 3px'
                              }}
                            ></div>
                            <span className="text-xs font-mono text-slate-700">{colorCode}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const newColors = [...paperColors[productIndex][paperIndex]];
                                newColors.splice(colorIndex, 1);
                                
                                const newPaperColors = { ...paperColors };
                                newPaperColors[productIndex][paperIndex] = newColors;
                                setPaperColors(newPaperColors);
                                
                                // Update the form data to sync with database
                                const globalPaperIndex = formData.products
                                  .slice(0, productIndex)
                                  .reduce((total, product) => total + product.papers.length, 0) + paperIndex;
                                
                                setFormData(prev => ({
                                  ...prev,
                                  operational: {
                                    ...prev.operational,
                                    papers: prev.operational.papers.map((paper, index) => 
                                      index === globalPaperIndex 
                                        ? { ...paper, selectedColors: newColors }
                                        : paper
                                    )
                                  }
                                }));
                              }}
                              className="text-slate-400 hover:text-red-500 transition-colors ml-1"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* CARD 2: Paper Pricing */}
              <Card className="border-0 shadow-lg w-full">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-slate-800 flex items-center">
                    <Calculator className="w-5 h-5 mr-2 text-[#27aae1]" />
                    Paper Pricing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 md:space-y-6">
                  {/* Pricing Section */}
                                      <div className="space-y-3 md:space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <h5 className="text-md font-semibold text-slate-700 flex items-center">
                          <BarChart3 className="w-4 h-4 mr-2 text-[#27aae1]" />
                          Cost Details
                        </h5>
                        <div className="flex items-center">
                          <Info className="w-4 h-4 text-[#27aae1] mr-1" />
                          <button
                            type="button"
                            onClick={() => setShowPricingLogic(true)}
                            className="text-xs text-[#27aae1] hover:text-[#27aae1] underline flex items-center"
                          >
                            <Info className="w-3 h-3 mr-1" />
                            View Pricing Logic
                          </button>
                        </div>
                      </div>
                      <div className="space-y-3 md:space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          Price per Sheet (Direct)
                        </Label>
                        <Input
                          type="number"
                          placeholder="$ 0.00"
                          step="0.0001"
                          className="border-slate-300 focus:border-[#27aae1] focus:ring-[#27aae1] rounded-xl h-10"
                          value={opPaper?.pricePerSheet ?? ""}
                          onChange={(e) =>
                            handlePaperOpChange(globalPaperIndex, "pricePerSheet", e.target.value)
                          }
                        />
                        <div className="text-xs text-slate-500 mt-1">
                          Leave empty to use packet pricing only
                        </div>
                      </div>
                      <div className="border-t pt-4">
                        <h6 className="text-sm font-medium text-slate-600 mb-3">Packet Pricing:</h6>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700 flex items-center">
                              <Package className="w-4 h-4 mr-2" />
                              Sheets per Packet
                            </Label>
                            <Input
                              type="number"
                              placeholder="e.g. 500"
                              className="border-slate-300 focus:border-[#27aae1] focus:ring-[#27aae1] rounded-xl h-10"
                              min={0}
                              value={opPaper?.sheetsPerPacket ?? ""}
                              onChange={(e) =>
                                handlePaperOpChange(
                                  globalPaperIndex,
                                  "sheetsPerPacket",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700 flex items-center">
                              <DollarSign className="w-4 h-4 mr-2" />
                              Price per Packet
                            </Label>
                            <Input
                              type="number"
                              className="border-slate-300 focus:border-[#27aae1] focus:ring-[#27aae1] rounded-xl h-10"
                              placeholder="$ 0.00"
                              value={opPaper?.pricePerPacket ?? ""}
                              onChange={(e) =>
                                handlePaperOpChange(globalPaperIndex, "pricePerPacket", e.target.value)
                              }
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Enhanced Pricing Summary */}
                      <div className="bg-[#27aae1]/10 rounded-lg p-4 border border-[#27aae1]/30">
                        <h6 className="text-sm font-semibold text-[#27aae1] mb-3 flex items-center">
                          <Calculator className="w-4 h-4 mr-2" />
                          Pricing Summary
                        </h6>
                        
                        {(() => {
                          const pricingBreakdown = getPricingBreakdown(opPaper, actualSheetsNeeded);
                          const { breakdown, totalCost } = pricingBreakdown;
                          
                          if (breakdown.length === 0) {
                            return (
                              <div className="text-sm text-slate-600">
                                Enter pricing details above to see cost breakdown
                              </div>
                            );
                          }
                          
                          return (
                            <div className="space-y-3">
                              {breakdown.map((item, index) => (
                                <div key={index} className="flex justify-between items-center text-sm">
                                  <span className="text-slate-600">{item.description}</span>
                                  <span className="font-semibold text-[#27aae1]">{fmt(item.total)}</span>
                                </div>
                              ))}
                              <div className="border-t pt-2 mt-2">
                                <div className="flex justify-between items-center">
                                  <span className="font-semibold text-[#27aae1]">Total Cost:</span>
                                  <span className="text-lg font-bold text-[#27aae1]">{fmt(totalCost)}</span>
                                </div>
                                <div className="text-xs text-[#27aae1] mt-1">
                                  Cost per sheet: {fmt(totalCost / actualSheetsNeeded)}
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CARD 3: Additional Costs */}
              <Card className="border-0 shadow-lg w-full">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-slate-800 flex items-center">
                    <Calculator className="w-5 h-4 mr-2 text-[#27aae1]" />
                    Additional Costs
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 md:space-y-6">
                  {/* Production Costs Section */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <h5 className="text-md font-semibold text-slate-700 flex items-center">
                        <Calculator className="w-4 h-4 mr-2 text-[#27aae1]" />
                        Production Costs
                      </h5>
                      <div className="text-xs text-slate-500">
                        ✓ Auto-calculated
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          No. of plates
                        </Label>
                        <Input 
                          type="number"
                          min="0"
                          placeholder="e.g. 8"
                          className={`border-slate-300 focus:border-[#27aae1] focus:ring-[#27aae1] rounded-xl h-10 w-full ${
                            !formData.operational.plates ? 'bg-[#27aae1]/10 border-[#27aae1]/30' : 'bg-white'
                          }`}
                          value={formData.operational.plates ?? plates ?? ""} 
                          onChange={(e) => handlePlatesChange(e.target.value)}
                        />
                        {!formData.operational.plates ? (
                          <div className="text-[#27aae1] text-xs mt-1">
                            ✓ Auto-calculated: {plates}
                          </div>
                        ) : (
                          <div className="text-amber-600 text-xs mt-1 flex items-center justify-between">
                            <span>⚠ Custom value (auto: {plates})</span>
                            <button
                              type="button"
                              onClick={() => handlePlatesChange("")}
                              className="text-xs text-[#27aae1] hover:text-[#27aae1] underline"
                            >
                              Reset
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          No. of units
                        </Label>
                        <Input 
                          type="number"
                          min="0"
                          placeholder="e.g. 1000"
                          className={`border-slate-300 focus:border-[#27aae1] focus:ring-[#27aae1] rounded-xl h-10 w-full ${
                            !formData.operational.units ? 'bg-[#27aae1]/10 border-[#27aae1]/30' : 'bg-white'
                          }`}
                          value={formData.operational.units ?? units ?? ""} 
                          onChange={(e) => handleUnitsChange(e.target.value)}
                        />
                        {!formData.operational.units ? (
                          <div className="text-[#27aae1] text-xs mt-1">
                            ✓ Auto-calculated: {units}
                          </div>
                        ) : (
                          <div className="text-amber-600 text-xs mt-1 flex items-center justify-between">
                            <span>⚠ Custom value (auto: {units})</span>
                            <button
                              type="button"
                              onClick={() => handleUnitsChange("")}
                              className="text-xs text-[#27aae1] hover:text-[#27aae1] underline"
                            >
                              Reset
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {/* No. of Impressions Field */}
                      <div className="space-y-2 col-span-1 sm:col-span-2">
                        <Label className="text-sm font-medium text-slate-700">
                          No. of Impressions
                        </Label>
                        <Input 
                          type="number"
                          min="0"
                          placeholder="e.g. 5000"
                          className={`border-slate-300 focus:border-[#27aae1] focus:ring-[#27aae1] rounded-xl h-10 w-full ${
                            !formData.operational.impressions ? 'bg-[#27aae1]/10 border-[#27aae1]/30' : 'bg-white'
                          }`}
                          value={formData.operational.impressions ?? ""} 
                          onChange={(e) => {
                            const impressions = e.target.value === "" ? null : parseFloat(e.target.value);
                            setFormData((prev) => ({
                              ...prev,
                              operational: {
                                ...prev.operational,
                                impressions,
                              },
                            }));
                          }}
                        />
                        {!formData.operational.impressions ? (
                          <div className="text-[#27aae1] text-xs mt-1">
                            ✓ Enter manually or leave empty
                      </div>
                        ) : (
                          <div className="text-amber-600 text-xs mt-1 flex items-center justify-between">
                            <span>⚠ Custom value set</span>
                            <button
                              type="button"
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  operational: {
                                    ...prev.operational,
                                    impressions: null,
                                  },
                                }));
                              }}
                              className="text-xs text-[#27aae1] hover:text-[#27aae1] underline"
                            >
                              Reset
                            </button>
                    </div>
                        )}
                              </div>
                              
                                        </div>
                                        </div>

                  {/* Note: Finishing costs are now calculated once at the end, not per product */}

                  {/* Additional Costs Section */}
                  <div className="space-y-4">
                    <h5 className="text-md font-semibold text-slate-700 flex items-center">
                      <DollarSign className="w-4 h-4 mr-2 text-[#27aae1]" />
                      Additional Costs
                      <span className="ml-2 text-xs text-slate-500">(Unique project costs)</span>
                    </h5>
                    <div className="space-y-4">
                      {additionalCosts.map((cost, index) => (
                        <div key={cost.id} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-2">
                            <div className="flex-1 space-y-2">
                              <Input
                                type="text"
                                placeholder="Cost description"
                                className="w-full border-slate-300 focus:border-[#27aae1] focus:ring-[#27aae1] rounded-lg"
                                value={cost.description}
                                onChange={(e) => {
                                  const newCosts = [...additionalCosts];
                                  newCosts[index].description = e.target.value;
                                  setAdditionalCosts(newCosts);
                                }}
                              />
                              <Input
                                type="number"
                                placeholder="Cost amount"
                                step="0.01"
                                min="0"
                                className="w-full sm:w-32 border-slate-300 focus:border-[#27aae1] focus:ring-[#27aae1] rounded-lg"
                                value={cost.cost}
                                onChange={(e) => {
                                  const newCosts = [...additionalCosts];
                                  newCosts[index].cost = parseFloat(e.target.value) || 0;
                                  setAdditionalCosts(newCosts);
                                }}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const newCosts = additionalCosts.filter((_, i) => i !== index);
                                setAdditionalCosts(newCosts);
                              }}
                              className="ml-2 p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          <Input
                            type="text"
                            placeholder="Comment (mandatory)"
                            className="w-full border-slate-300 focus:border-[#27aae1] focus:ring-[#27aae1] rounded-lg"
                            value={cost.comment}
                            onChange={(e) => {
                              const newCosts = [...additionalCosts];
                              newCosts[index].comment = e.target.value;
                              setAdditionalCosts(newCosts);
                            }}
                          />
                          {!cost.comment && (
                            <div className="text-red-600 text-xs mt-1">
                              ⚠️ Comment is mandatory for additional costs
                            </div>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setAdditionalCosts([
                            ...additionalCosts,
                            {
                              id: Date.now().toString(),
                              description: '',
                              cost: 0,
                              comment: ''
                            }
                          ]);
                        }}
                        className="w-full border-dashed border-slate-300 text-slate-600 hover:border-slate-400 hover:text-slate-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Additional Cost
                      </Button>
                    </div>

                    {/* Finishing Costs Section - Inside Additional Costs */}
                    {(() => {
                      // Collect all unique finishing types across all products
                      const allFinishingTypes = new Set<string>();
                      formData.products.forEach((product) => {
                        if (product.finishing && product.finishing.length > 0) {
                          product.finishing.forEach(finishingName => {
                            allFinishingTypes.add(finishingName);
                          });
                        }
                      });

                      if (allFinishingTypes.size > 0) {
                        const totalFinishingCost = calculateFinishingCosts();
                        
                        return (
                          <div className="space-y-4 mt-6 pt-4 border-t border-slate-200">
                            {/* Header Section */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                              <div className="flex items-center">
                                <Settings className="w-4 h-4 mr-2 text-[#27aae1]" />
                                <h5 className="text-md font-semibold text-slate-700">
                                  Finishing Costs
                                </h5>
                                <span className="ml-2 text-xs text-slate-500">(Calculated once at the end)</span>
                              </div>
                            </div>

                            {/* Cost and Button Section */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                              <div className="flex items-center space-x-3">
                                <span className="text-xl font-bold text-[#27aae1]">
                                  {fmt(totalFinishingCost)}
                                </span>
                                <span className="text-sm text-slate-500">total cost</span>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowFinishingDetails(true)}
                                className="text-xs border-[#27aae1] text-[#27aae1] hover:bg-[#27aae1] hover:text-white w-full sm:w-auto"
                              >
                                View Details
                              </Button>
                            </div>

                            {/* Summary Section */}
                            <div className="text-sm text-slate-600">
                              {allFinishingTypes.size} finishing type{allFinishingTypes.size > 1 ? 's' : ''} applied • Total cost includes all finishing options
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </CardContent>
              </Card>
            </div>

            

            {/* Cutting Layout Visualization - TEMPORARILY HIDDEN FOR CLIENT CLARIFICATION */}
            {false && (

            <Card className="border-0 shadow-lg w-full mx-0">
              <CardHeader className="pb-5 border-b border-slate-200/70">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="text-xl md:text-2xl font-bold text-slate-800 flex items-center">
                      <BarChart3 className="w-6 h-6 md:w-7 md:h-7 mr-2 md:mr-3 text-[#27aae1]" />
                      Single Sheet Layout Visualization
                    </CardTitle>
                    <CardDescription className="text-sm text-slate-500">
                      Visualize how each item is imposed on the parent sheet with production overlays.
                    </CardDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className="w-fit border-[#27aae1]/40 bg-[#27aae1]/10 text-[#27aae1] uppercase tracking-wide text-xs font-semibold"
                  >
                    Operational preview
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 w-full px-2 md:px-4">
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <h5 className="text-base md:text-lg font-semibold text-slate-800">
                      Single Sheet Layout Pattern
                    </h5>
                    <p className="text-sm text-slate-500 max-w-2xl mx-auto">
                      All sheets share the same imposition pattern. Toggle the modes below to inspect print, cutting, and gripper considerations.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Items per sheet</p>
                      <p className="text-lg md:text-2xl font-semibold text-slate-900">
                        {layout.itemsPerSheet > 0 ? layout.itemsPerSheet : 'n/a'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {layout.itemsPerRow && layout.itemsPerCol
                          ? `${layout.itemsPerRow} x ${layout.itemsPerCol} grid`
                          : 'Awaiting layout calculation'}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Parent sheet</p>
                      <p className="text-lg md:text-xl font-semibold text-slate-900">
                        {inputWidth && inputHeight
                          ? `${inputWidth.toFixed(1)} cm x ${inputHeight.toFixed(1)} cm`
                          : 'Set sheet dimensions'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {inputWidth && inputHeight
                          ? `${(inputWidth * inputHeight).toFixed(1)} sq cm`
                          : 'Area appears after both sides are provided'}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Output item</p>
                      <p className="text-lg md:text-xl font-semibold text-slate-900">
                        {outputDimensions[productIndex]?.width && outputDimensions[productIndex]?.height
                          ? `${Number(outputDimensions[productIndex]?.width).toFixed(1)} cm x ${Number(outputDimensions[productIndex]?.height).toFixed(1)} cm`
                          : 'Complete Step 3 sizing'}
                      </p>
                      <p className="text-xs text-slate-500">
                        Efficiency {Number.isFinite(layout.efficiency) ? `${layout.efficiency.toFixed(1)}%` : 'pending'}
                      </p>
                    </div>
                  </div>

                  {/* Professional Visualization Type Selector */}
                  <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
                    <button
                      type="button"
                      onClick={() => setVisualizationType('print')}
                      aria-pressed={visualizationType === 'print'}
                      className={`group flex items-center gap-3 rounded-full border px-5 py-2.5 text-sm font-semibold transition-all ${
                        visualizationType === 'print'
                          ? 'border-transparent bg-[#27aae1] text-white shadow-lg shadow-[#27aae1]/35'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-[#27aae1]/40 hover:text-[#27aae1]'
                      }`}
                    >
                      <Printer className="h-5 w-5 shrink-0" />
                      <span className="flex flex-col text-left leading-tight">
                        <span>Print Layout</span>
                        <span className={`text-xs ${visualizationType === 'print' ? 'text-white/80' : 'text-slate-400'}`}>
                          Imposition & bleed
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setVisualizationType('cut')}
                      aria-pressed={visualizationType === 'cut'}
                      className={`group flex items-center gap-3 rounded-full border px-5 py-2.5 text-sm font-semibold transition-all ${
                        visualizationType === 'cut'
                          ? 'border-transparent bg-orange-500 text-white shadow-lg shadow-orange-500/35'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-orange-400/40 hover:text-orange-500'
                      }`}
                    >
                      <Scissors className="h-5 w-5 shrink-0" />
                      <span className="flex flex-col text-left leading-tight">
                        <span>Cutting Operations</span>
                        <span className={`text-xs ${visualizationType === 'cut' ? 'text-white/80' : 'text-slate-400'}`}>
                          Knife paths & trims
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setVisualizationType('gripper')}
                      aria-pressed={visualizationType === 'gripper'}
                      className={`group flex items-center gap-3 rounded-full border px-5 py-2.5 text-sm font-semibold transition-all ${
                        visualizationType === 'gripper'
                          ? 'border-transparent bg-purple-600 text-white shadow-lg shadow-purple-600/35'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-purple-400/40 hover:text-purple-600'
                      }`}
                    >
                      <GripHorizontal className="h-5 w-5 shrink-0" />
                      <span className="flex flex-col text-left leading-tight">
                        <span>Gripper Handling</span>
                        <span className={`text-xs ${visualizationType === 'gripper' ? 'text-white/80' : 'text-slate-400'}`}>
                          Feeding & margins
                        </span>
                      </span>
                    </button>
                  </div>
                  {/* Single Sheet Canvas Visualization */}
                  <div className="w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-2xl p-2 shadow-lg">
                    <div className="relative w-full h-full bg-white rounded-xl shadow-inner overflow-hidden">
                      <canvas
                        id={`ultra-canvas-${productIndex}-${paperIndex}`}
                        className="w-full h-full rounded-xl transition-all duration-500 hover:shadow-md"
                        style={{ maxWidth: '100%', maxHeight: '100%' }}
                        ref={(canvas) => {
                          if (canvas && layout.itemsPerSheet > 0 && opPaper?.inputWidth && opPaper?.inputHeight) {
                            setTimeout(() => {
                              if (opPaper.inputWidth && opPaper.inputHeight) {
                                const currentProduct = formData.products[productIndex];
                                const productName = currentProduct?.productName || 'business-cards';
                                const productConfig = getProductConfig(productName);
                                const productShape =
                                  productName === 'cups'
                                    ? 'circular'
                                    : productName === 'shopping-bags'
                                    ? 'complex-3d'
                                    : 'rectangular';

                                let step3ProductWidth = currentProduct?.flatSize?.width || productConfig?.defaultSizes?.width || 9;
                                let step3ProductHeight = currentProduct?.flatSize?.height || productConfig?.defaultSizes?.height || 5.5;

                                if (productName === 'Shopping Bag' && currentProduct?.bagPreset) {
                                  const bagPreset = getShoppingBagPreset(currentProduct.bagPreset);
                                  if (bagPreset) {
                                    const W = bagPreset.width;
                                    const H = bagPreset.height;
                                    const G = bagPreset.gusset;
                                    const T = Math.max(3, W * 0.12);
                                    const B = Math.max(6, W * 0.25);
                                    const glueFlap = 2;

                                    step3ProductWidth = W + G + W + G + glueFlap;
                                    step3ProductHeight = T + H + B;

                                    const printableWidth = 34.0;
                                    const printableHeight = 48.1;
                                    const safetyGap = 0.5;
                                    const bleedWidth = 0.3;

                                    const effectiveBagWidth = step3ProductWidth + (2 * bleedWidth) + (2 * safetyGap);
                                    const effectiveBagHeight = step3ProductHeight + (2 * bleedWidth) + (2 * safetyGap);

                                    const bagsPerRow = Math.floor(printableWidth / effectiveBagWidth);
                                    const bagsPerCol = Math.floor(printableHeight / effectiveBagHeight);
                                    const totalBags = bagsPerRow * bagsPerCol;

                                    const rotatedBagsPerRow = Math.floor(printableWidth / effectiveBagHeight);
                                    const rotatedBagsPerCol = Math.floor(printableHeight / effectiveBagWidth);
                                    const rotatedTotalBags = rotatedBagsPerRow * rotatedBagsPerCol;

                                    console.log('Shopping bag layout optimization:', {
                                      preset: currentProduct.bagPreset,
                                      bagDimensions: { width: step3ProductWidth, height: step3ProductHeight },
                                      effectiveDimensions: { width: effectiveBagWidth, height: effectiveBagHeight },
                                      printableArea: { width: printableWidth, height: printableHeight },
                                      normalLayout: { bagsPerRow, bagsPerCol, totalBags },
                                      rotatedLayout: { bagsPerRow: rotatedBagsPerRow, bagsPerCol: rotatedBagsPerCol, totalBags: rotatedTotalBags },
                                      recommendedLayout: rotatedTotalBags > totalBags ? 'rotated' : 'normal'
                                    });
                                  }
                                }

                                const settings: VisualizationSettings = {
                                  type: visualizationType,
                                  showGripper: visualizationType === 'gripper',
                                  showCutLines: visualizationType === 'cut',
                                  showBleed: true,
                                  showGaps: true,
                                  gripperWidth: 0.9,
                                  bleedWidth: 0.3,
                                  gapWidth: 0.5
                                };

                                console.log('About to call drawProfessionalVisualization:', {
                                  productName: currentProduct?.productName,
                                  bagPreset: currentProduct?.bagPreset,
                                  layout: layout
                                    ? {
                                        itemsPerRow: layout.itemsPerRow,
                                        itemsPerCol: layout.itemsPerCol,
                                        itemsPerSheet: layout.itemsPerSheet
                                      }
                                    : 'null',
                                  visualizationType,
                                  step3ProductWidth,
                                  step3ProductHeight
                                });

                                drawProfessionalVisualization(
                                  canvas,
                                  layout,
                                  visualizationType,
                                  settings,
                                  currentProduct,
                                  opPaper.inputWidth,
                                  opPaper.inputHeight,
                                  step3ProductWidth,
                                  step3ProductHeight,
                                  formData,
                                  productIndex
                                );
                              }
                            }, 150);
                          }
                        }}
                      />
                      {layout.itemsPerSheet > 0 &&
                        !dimensionError &&
                        opPaper?.inputWidth &&
                        opPaper?.inputHeight &&
                        outputDimensions[productIndex]?.width &&
                        outputDimensions[productIndex]?.height && (
                          <>
                            <div className="pointer-events-none absolute inset-3 flex flex-col justify-between text-[10px] md:text-xs text-slate-500">
                              <div className="flex items-center justify-between">
                                <span className="rounded bg-white/90 px-2 py-1 shadow-sm">
                                  Sheet width: {opPaper.inputWidth.toFixed(1)} cm
                                </span>
                                <span className="rounded bg-white/90 px-2 py-1 shadow-sm">
                                  Row count: {layout.itemsPerRow}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="rounded bg-white/90 px-2 py-1 shadow-sm">
                                  Sheet height: {opPaper.inputHeight.toFixed(1)} cm
                                </span>
                                <span className="rounded bg-white/90 px-2 py-1 shadow-sm">
                                  Column count: {layout.itemsPerCol}
                                </span>
                              </div>
                            </div>
                            <div className="pointer-events-none absolute bottom-3 left-3 right-3">
                              <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white/90 px-4 py-3 text-[11px] md:text-xs text-slate-600 shadow-sm">
                                <span className="font-semibold text-slate-700">Legend</span>
                                <span className="flex items-center gap-2">
                                  <span className="h-2.5 w-2.5 rounded-full bg-[#27aae1]" />
                                  Item footprint
                                </span>
                                <span className="flex items-center gap-2">
                                  <span className="h-0.5 w-6 rounded-full bg-slate-400" />
                                  {visualizationType === 'cut'
                                    ? 'Cut path focus'
                                    : visualizationType === 'gripper'
                                    ? 'Gripper margin'
                                    : 'Bleed allowance'}
                                </span>
                                <span className="ml-auto uppercase tracking-wide text-[10px] font-semibold text-[#27aae1]">
                                  {visualizationType === 'cut'
                                    ? 'Cutting view'
                                    : visualizationType === 'gripper'
                                    ? 'Gripper view'
                                    : 'Print view'}
                                </span>
                              </div>
                            </div>
                          </>
                        )}
                      {(layout.itemsPerSheet === 0 ||
                        dimensionError ||
                        !opPaper?.inputWidth ||
                        !opPaper?.inputHeight ||
                        !outputDimensions[productIndex]?.width ||
                        !outputDimensions[productIndex]?.height) && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/90 text-center backdrop-blur-sm">
                          <AlertTriangle className="h-10 w-10 text-[#27aae1]" />
                          <p className="text-sm md:text-base font-semibold text-slate-600">
                            {dimensionError
                              ? 'Dimensions exceed the available sheet.'
                              : !opPaper?.inputWidth || !opPaper?.inputHeight
                              ? 'Add parent sheet dimensions to generate the preview.'
                              : !outputDimensions[productIndex]?.width || !outputDimensions[productIndex]?.height
                              ? 'Complete the output size in Step 3 to render the layout.'
                              : 'Imposition data is not available yet.'}
                          </p>
                          <p className="text-xs md:text-sm text-slate-500 max-w-sm">
                            {dimensionError
                              ? 'Adjust the item size or choose a larger sheet to continue.'
                              : 'Once dimensions are filled in, this panel displays the production-ready layout with precise overlays.'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Enhanced Information Cards - Below Canvas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                    {/* Advanced Sheet Analysis */}
                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                      <h6 className="font-semibold text-slate-800 mb-3 text-center flex items-center justify-center">
                        <Package className="w-4 h-4 mr-2 text-[#27aae1]" />
                        Advanced Sheet Analysis
                      </h6>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Input Sheet:</span>
                          <span className="font-semibold">
                            {inputWidth && inputHeight
                              ? `${inputWidth.toFixed(1)} cm x ${inputHeight.toFixed(1)} cm`
                              : 'Set both width and height'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Sheet Area:</span>
                          <span className="font-semibold text-[#27aae1]">
                            {inputWidth && inputHeight
                              ? `${(inputWidth * inputHeight).toFixed(1)} sq cm`
                              : 'Area pending dimensions'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Material Efficiency:</span>
                          <span className={`font-semibold ${layout.efficiency > 85 ? 'text-green-600' : layout.efficiency > 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {Number.isFinite(layout.efficiency) ? `${layout.efficiency.toFixed(1)}%` : 'n/a'}
                          </span>
                        </div>

                        {/* Waste Analysis */}
                        <div className="border-t pt-2 mt-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Used Area:</span>
                            <span className="font-semibold text-green-600">
                              {inputWidth && inputHeight && outputDimensions[productIndex]?.width && outputDimensions[productIndex]?.height && layout.itemsPerSheet > 0
                                ? `${(layout.itemsPerSheet * outputDimensions[productIndex].width * outputDimensions[productIndex].height).toFixed(1)} sq cm`
                                : 'n/a'}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Waste Area:</span>
                            <span className="font-semibold text-red-600">
                              {inputWidth && inputHeight && outputDimensions[productIndex]?.width && outputDimensions[productIndex]?.height && layout.itemsPerSheet > 0
                                ? `${((inputWidth * inputHeight) - (layout.itemsPerSheet * outputDimensions[productIndex].width * outputDimensions[productIndex].height)).toFixed(1)} sq cm`
                                : 'n/a'}
                            </span>
                          </div>
                        </div>

                        {/* Performance Rating */}
                        <div className="bg-slate-50 p-2 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-slate-700 flex items-center">
                              <BarChart3 className="w-4 h-4 mr-2 text-[#27aae1]" />
                              Performance:
                            </span>
                            <div className="flex items-center space-x-1">
                              {[...Array(5)].map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-2 h-2 rounded-full ${
                                    i < Math.ceil((layout.efficiency / 100) * 5)
                                      ? layout.efficiency > 85
                                        ? 'bg-green-500'
                                        : layout.efficiency > 70
                                        ? 'bg-yellow-500'
                                        : 'bg-red-500'
                                      : 'bg-gray-200'
                                  }`}
                                />
                              ))}
                              <span className="text-xs font-semibold ml-1">
                                {layout.efficiency > 85 ? 'Excellent' : layout.efficiency > 70 ? 'Good' : layout.efficiency > 50 ? 'Fair' : 'Poor'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Production Intelligence */}
                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                      <h6 className="font-semibold text-slate-800 mb-3 text-center flex items-center justify-center">
                        <Edit3 className="w-4 h-4 mr-2 text-[#27aae1]" />
                        Production Intelligence
                      </h6>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Item Size:</span>
                          <span className="font-semibold text-[#27aae1]">
                            {outputDimensions[productIndex]?.width && outputDimensions[productIndex]?.height
                              ? `${Number(outputDimensions[productIndex]?.width).toFixed(1)} cm x ${Number(outputDimensions[productIndex]?.height).toFixed(1)} cm`
                              : 'Awaiting size'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Layout Strategy:</span>
                          <span className={`font-semibold ${layout.orientation === 'rotated' ? 'text-[#ea078b]' : 'text-green-600'}`}>
                            {layout.orientation === 'rotated' ? 'Rotated for best fit' : 'Standard orientation'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Grid Pattern:</span>
                          <span className="font-semibold">
                            {layout.itemsPerRow && layout.itemsPerCol
                              ? `${layout.itemsPerRow} x ${layout.itemsPerCol} grid`
                              : 'Pending calculation'}
                          </span>
                        </div>

                        {/* Layout Optimization */}
                        <div className="border-t pt-2 mt-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Items per Sheet:</span>
                            <span className="font-bold text-[#27aae1] text-lg">{layout.itemsPerSheet}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Space Utilization:</span>
                            <span className={`font-semibold ${layout.efficiency > 80 ? 'text-green-600' : 'text-yellow-600'}`}>
                              {inputWidth && inputHeight && outputDimensions[productIndex]?.width && outputDimensions[productIndex]?.height && layout.itemsPerSheet > 0
                                ? `${((layout.itemsPerRow * outputDimensions[productIndex].width) / inputWidth * 100).toFixed(1)}% width | ${((layout.itemsPerCol * outputDimensions[productIndex].height) / inputHeight * 100).toFixed(1)}% height`
                                : 'n/a'}
                            </span>
                          </div>
                        </div>

                        {/* Optimization Recommendations */}
                        <div className="bg-[#27aae1]/10 p-2 rounded-lg">
                          <p className="text-xs text-[#27aae1] font-medium">
                            {layout.efficiency > 85
                              ? 'Layout is production ready.'
                              : layout.efficiency > 70
                              ? 'Consider alternative orientations or spacing tweaks.'
                              : 'Efficiency is low—revisit sheet or product dimensions.'}
                          </p>
                        </div>
                      </div>
                    </div>
                    {/* Operations Dashboard */}
                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                      <h6 className="font-semibold text-slate-800 mb-3 text-center flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 mr-2 text-[#27aae1]" />
                        Operations Dashboard
                      </h6>
                      <div className="space-y-3">
                        {/* Production Metrics */}
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="bg-[#27aae1]/10 p-2 rounded">
                            <div className="text-[#27aae1] font-medium">Required</div>
                            <div className="font-bold text-[#27aae1]">{qty || 0}</div>
                          </div>
                          <div className="bg-orange-50 p-2 rounded">
                            <div className="text-orange-600 font-medium">Sheets</div>
                            <div className="font-bold text-orange-800">{sheetsNeeded}</div>
                          </div>
                        </div>

                        {enteredSheets && (
                          <div className="flex justify-between bg-[#ea078b]/10 p-2 rounded">
                            <span className="text-[#ea078b] font-medium">Planned Sheets:</span>
                            <span className="font-bold text-[#ea078b]">{enteredSheets}</span>
                          </div>
                        )}

                        {/* Production Efficiency */}
                        <div className="border-t pt-2">
                          <div className="flex justify-between bg-green-50 p-2 rounded border border-green-200">
                            <span className="text-green-700 font-medium">Production Yield:</span>
                            <span className="font-bold text-green-800">{totalItemsPossible}</span>
                          </div>

                          {totalItemsPossible > qty && (
                            <div className="mt-2 space-y-1">
                              <div className="flex justify-between bg-amber-50 p-2 rounded border border-amber-200">
                                <span className="text-amber-700 font-medium">Overproduction:</span>
                                <span className="font-bold text-amber-800">{totalItemsPossible - qty}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-600">Waste Rate:</span>
                                <span className="font-semibold text-red-600">
                                  {((totalItemsPossible - qty) / totalItemsPossible * 100).toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Cost Efficiency Indicator */}
                        <div className="bg-slate-50 p-2 rounded">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-slate-700">Cost Efficiency:</span>
                            <div className="text-right">
                              <div className="font-bold text-slate-800">
                                {pricePerSheet ? `${(pricePerSheet * actualSheetsNeeded / qty).toFixed(4)}` : '–'}
                              </div>
                              <div className="text-xs text-slate-500">per item</div>
                            </div>
                          </div>
                        </div>

                        {/* Operational Recommendations */}
                        <div
                          className={`p-2 rounded text-xs font-medium ${
                            layout.efficiency > 85 && totalItemsPossible - qty < qty * 0.1
                              ? 'bg-green-50 text-green-800'
                              : totalItemsPossible - qty > qty * 0.2
                              ? 'bg-red-50 text-red-800'
                              : 'bg-yellow-50 text-yellow-800'
                          }`}
                        >
                          {layout.efficiency > 85 && totalItemsPossible - qty < qty * 0.1
                            ? 'Configuration looks balanced for production.'
                            : totalItemsPossible - qty > qty * 0.2
                            ? 'Waste level is high—consider reducing the planned sheets.'
                            : 'Review the setup to capture more efficiency.'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            )}

            {/* Final Printing Layout Visualization - TEMPORARILY HIDDEN FOR CLIENT CLARIFICATION */}
            {false && (
            <Card className="border-0 shadow-lg w-full mx-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl md:text-2xl font-bold text-slate-800 flex items-center">
                  <Palette className="w-6 h-6 md:w-7 md:h-7 mr-2 md:mr-3 text-green-600" />
                  Final Printing Layout
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 w-full px-2 md:px-4">
                <div className="space-y-3">
                  <h5 className="text-base md:text-lg font-semibold text-slate-700">Final Printing on Cut Pieces (e.g., 50×35cm)</h5>
                  
                  <div className="w-full h-[250px] sm:h-[350px] md:h-[450px] lg:h-[500px] bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-1 shadow-lg overflow-hidden">
                    <div className="relative w-full h-full bg-white rounded-lg shadow-inner overflow-hidden">
                      <canvas
                        id={`final-printing-canvas-${productIndex}-${paperIndex}`}
                        className="w-full h-full rounded-lg transition-all duration-500 hover:shadow-md"
                        style={{ maxWidth: '100%', maxHeight: '100%' }}
                        ref={(canvas) => {
                          if (canvas && opPaper?.inputWidth && opPaper?.inputHeight && outputDimensions[productIndex]?.width && outputDimensions[productIndex]?.height) {
                            setTimeout(() => {
                              if (opPaper.inputWidth && opPaper.inputHeight && outputDimensions[productIndex]?.width && outputDimensions[productIndex]?.height) {
                                const cutPieces = calculateCutPieces(opPaper.inputWidth!, opPaper.inputHeight!, 52, 72);
                                drawFinalPrintingLayout(canvas, cutPieces, outputDimensions[productIndex].width, outputDimensions[productIndex].height);
                              }
                            }, 150);
                          }
                        }}
                      />
                      {(!opPaper?.inputWidth || !opPaper?.inputHeight || !outputDimensions[productIndex]?.width || !outputDimensions[productIndex]?.height) && (
                        <div className="absolute inset-0 grid place-items-center text-sm md:text-lg text-slate-500 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                          <div className="text-center p-3 md:p-4 lg:p-8 max-w-[90%]">
                            <div className="text-green-400 mb-2 md:mb-4 text-2xl md:text-3xl lg:text-5xl">🎨</div>
                            <div className="font-semibold text-slate-600 text-sm md:text-base lg:text-xl">Complete Data Required</div>
                            <div className="text-xs md:text-sm text-slate-400 mt-2 md:mt-3">Set input dimensions and output dimensions to preview final printing layout</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            )}

            {/* Enhanced Sheet Optimization Preview - MAXIMUM SCALE */}
            <Card className="border-0 shadow-lg w-full mx-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl md:text-2xl font-bold text-slate-800 flex items-center">
                  <BarChart3 className="w-6 h-6 md:w-7 md:h-7 mr-2 md:mr-3 text-[#27aae1]" />
                  Single Sheet Layout Visualization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 w-full px-2 md:px-4">
                <div className="space-y-3">
                                      <h5 className="text-base md:text-lg font-semibold text-slate-700">Single Sheet Layout Pattern (All sheets use same pattern)</h5>
                  
                  {/* Professional Visualization Type Selector */}
                  <div className="flex flex-wrap gap-3 justify-center mb-4">
                    <button
                      onClick={() => setVisualizationType('print')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                        visualizationType === 'print'
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <Printer className="w-4 h-4" />
                      Print Layout
                    </button>
                    <button
                      onClick={() => setVisualizationType('cut')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                        visualizationType === 'cut'
                          ? 'bg-red-600 text-white shadow-lg'
                          : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <Scissors className="w-4 h-4" />
                      Cutting Operations
                    </button>
                    <button
                      onClick={() => setVisualizationType('gripper')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                        visualizationType === 'gripper'
                          ? 'bg-purple-600 text-white shadow-lg'
                          : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <GripHorizontal className="w-4 h-4" />
                      Gripper Handling
                    </button>
                  </div>
                  
                  
                  {/* Single Sheet Canvas Visualization */}
                  <div className="w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-lg p-1 shadow-lg overflow-hidden">
                    <div className="relative w-full h-full bg-white rounded-lg shadow-inner overflow-hidden">
                      <canvas
                        id={`ultra-canvas-${productIndex}-${paperIndex}`}
                        className="w-full h-full rounded-lg transition-all duration-500 hover:shadow-md"
                        style={{ maxWidth: '100%', maxHeight: '100%' }}
                        ref={(canvas) => {
                          if (canvas && layout.itemsPerSheet > 0 && opPaper?.inputWidth && opPaper?.inputHeight) {
                            setTimeout(() => {
                              if (opPaper.inputWidth && opPaper.inputHeight) {
                                // Determine product config and shape from form data
                                const currentProduct = formData.products[productIndex];
                                const productName = currentProduct?.productName || 'business-cards';
                                const productConfig = getProductConfig(productName);
                                const productShape = productName === 'cups' ? 'circular' : 
                                                   productName === 'shopping-bags' ? 'complex-3d' : 'rectangular';
                                
                                // Use Step 3 product dimensions directly
        let step3ProductWidth = currentProduct?.flatSize?.width || productConfig?.defaultSizes?.width || 9;
        let step3ProductHeight = currentProduct?.flatSize?.height || productConfig?.defaultSizes?.height || 5.5;
        
        // Special handling for shopping bags - calculate total dieline dimensions
        if (productName === 'Shopping Bag' && currentProduct?.bagPreset) {
          const bagPreset = getShoppingBagPreset(currentProduct.bagPreset);
          if (bagPreset) {
            const W = bagPreset.width;   // Individual panel width
            const H = bagPreset.height;  // Individual panel height
            const G = bagPreset.gusset;  // Gusset width
            const T = Math.max(3, W * 0.12); // Top hem (proportional)
            const B = Math.max(6, W * 0.25); // Bottom flaps (proportional)
            const glueFlap = 2; // Fixed glue flap width
            
            // Calculate total dieline dimensions
            step3ProductWidth = W + G + W + G + glueFlap; // Back + Gusset + Front + Gusset + Glue
            step3ProductHeight = T + H + B; // Top hem + Body height + Bottom flaps
            
            // Optimize layout for shopping bags to maximize fitment
            const printableWidth = 34.0;  // Printable area width (cm)
            const printableHeight = 48.1; // Printable area height (cm)
            const safetyGap = 0.5;        // Safety gap between bags (cm)
            const bleedWidth = 0.3;       // Bleed width (cm)
            
            // Calculate effective bag dimensions including bleed and safety gaps
            const effectiveBagWidth = step3ProductWidth + (2 * bleedWidth) + (2 * safetyGap);
            const effectiveBagHeight = step3ProductHeight + (2 * bleedWidth) + (2 * safetyGap);
            
            // Calculate how many bags can fit
            const bagsPerRow = Math.floor(printableWidth / effectiveBagWidth);
            const bagsPerCol = Math.floor(printableHeight / effectiveBagHeight);
            const totalBags = bagsPerRow * bagsPerCol;
            
            // Try rotated layout if it gives better fitment
            const rotatedBagsPerRow = Math.floor(printableWidth / effectiveBagHeight);
            const rotatedBagsPerCol = Math.floor(printableHeight / effectiveBagWidth);
            const rotatedTotalBags = rotatedBagsPerRow * rotatedBagsPerCol;
            
            console.log('🛍️ Shopping bag layout optimization:', {
              preset: currentProduct.bagPreset,
              bagDimensions: { width: step3ProductWidth, height: step3ProductHeight },
              effectiveDimensions: { width: effectiveBagWidth, height: effectiveBagHeight },
              printableArea: { width: printableWidth, height: printableHeight },
              normalLayout: { bagsPerRow, bagsPerCol, totalBags },
              rotatedLayout: { bagsPerRow: rotatedBagsPerRow, bagsPerCol: rotatedBagsPerCol, totalBags: rotatedTotalBags },
              recommendedLayout: rotatedTotalBags > totalBags ? 'rotated' : 'normal'
            });
          }
        }
                                
                                // Create visualization settings based on Step 3 parameters
                                const settings: VisualizationSettings = {
                                  type: visualizationType,
                                  showGripper: visualizationType === 'gripper',
                                  showCutLines: visualizationType === 'cut',
                                  showBleed: true,
                                  showGaps: true,
                                  gripperWidth: 0.9,
                                  bleedWidth: 0.3,
                                  gapWidth: 0.5
                                };
                                
                                
                                // Debug logging before visualization
                                console.log('🎨 About to call drawProfessionalVisualization:', {
                                  productName: currentProduct?.productName,
                                  bagPreset: currentProduct?.bagPreset,
                                  layout: layout ? {
                                    itemsPerRow: layout.itemsPerRow,
                                    itemsPerCol: layout.itemsPerCol,
                                    itemsPerSheet: layout.itemsPerSheet
                                  } : 'null',
                                  visualizationType,
                                  step3ProductWidth,
                                  step3ProductHeight
                                });
                                
                                // Use the new professional visualization system
                                drawProfessionalVisualization(
                                  canvas, 
                                  layout, 
                                  visualizationType, 
                                  settings, 
                                  currentProduct,  // Pass actual product data instead of config
                                  opPaper.inputWidth,  // Parent sheet width
                                  opPaper.inputHeight,  // Parent sheet height
                                  step3ProductWidth,  // Use Step 3 product width
                                  step3ProductHeight,  // Use Step 3 product height
                                  formData,  // Form data for Step 3 dimensions
                                  productIndex  // Product index
                                );
                              }
                            }, 150);
                          }
                        }}
                      />
                      {(layout.itemsPerSheet === 0 || dimensionError || !outputDimensions[productIndex]?.width || !outputDimensions[productIndex]?.height) && (
                        <div className="absolute inset-0 grid place-items-center text-sm md:text-lg text-slate-500 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg">
                          <div className="text-center p-3 md:p-4 lg:p-8 max-w-[90%]">
                            <div className="text-slate-400 mb-2 md:mb-4 text-2xl md:text-3xl lg:text-5xl">
                              {dimensionError ? "⚠️" : !outputDimensions[productIndex]?.width || !outputDimensions[productIndex]?.height ? "📏" : "🎯"}
                            </div>
                            <div className="font-semibold text-slate-600 text-sm md:text-base lg:text-xl">
                              {dimensionError ? "Invalid Dimensions" : !outputDimensions[productIndex]?.width || !outputDimensions[productIndex]?.height ? "Output Dimensions Required" : "Configure Dimensions"}
                            </div>
                            <div className="text-xs md:text-sm text-slate-400 mt-2 md:mt-3">
                              {dimensionError ? "Adjust item size to fit sheet" : !outputDimensions[productIndex]?.width || !outputDimensions[productIndex]?.height ? "Set output dimensions in Step 3 to preview" : "Set sheet & item sizes to preview"}
                            </div>
                            <div className="text-xs md:text-sm text-slate-400">
                              {dimensionError ? "dimensions properly" : !outputDimensions[productIndex]?.width || !outputDimensions[productIndex]?.height ? "the layout visualization" : "the optimized layout pattern"}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Enhanced Information Cards - Below Canvas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                    {/* Advanced Sheet Analysis */}
                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                      <h6 className="font-semibold text-slate-800 mb-3 text-center flex items-center justify-center">
                        <Package className="w-4 h-4 mr-2 text-[#27aae1]" />
                        Advanced Sheet Analysis
                      </h6>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Input Sheet:</span>
                          <span className="font-semibold">
                            {inputWidth?.toFixed(1) ?? "–"} × {inputHeight?.toFixed(1) ?? "–"} cm
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Sheet Area:</span>
                          <span className="font-semibold text-[#27aae1]">
                            {inputWidth && inputHeight ? (inputWidth * inputHeight).toFixed(1) : "–"} cm²
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Material Efficiency:</span>
                          <span className={`font-semibold ${layout.efficiency > 85 ? 'text-green-600' : layout.efficiency > 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {layout.efficiency ? layout.efficiency.toFixed(1) : "–"}%
                          </span>
                        </div>
                        
                        {/* Waste Analysis */}
                        <div className="border-t pt-2 mt-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Used Area:</span>
                            <span className="font-semibold text-green-600">
                              {inputWidth && inputHeight && outputDimensions[productIndex]?.width && outputDimensions[productIndex]?.height && layout.itemsPerSheet 
                                ? (layout.itemsPerSheet * outputDimensions[productIndex].width * outputDimensions[productIndex].height).toFixed(1) 
                                : "–"} cm²
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Waste Area:</span>
                            <span className="font-semibold text-red-600">
                              {inputWidth && inputHeight && outputDimensions[productIndex]?.width && outputDimensions[productIndex]?.height && layout.itemsPerSheet 
                                ? ((inputWidth * inputHeight) - (layout.itemsPerSheet * outputDimensions[productIndex].width * outputDimensions[productIndex].height)).toFixed(1) 
                                : "–"} cm²
                            </span>
                          </div>
                        </div>

                        {/* Performance Rating */}
                        <div className="bg-slate-50 p-2 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-slate-700 flex items-center">
                              <BarChart3 className="w-4 h-4 mr-2 text-[#27aae1]" />
                              Performance:
                            </span>
                            <div className="flex items-center space-x-1">
                              {[...Array(5)].map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-2 h-2 rounded-full ${
                                    i < Math.ceil((layout.efficiency / 100) * 5) 
                                      ? layout.efficiency > 85 ? 'bg-green-500' : layout.efficiency > 70 ? 'bg-yellow-500' : 'bg-red-500'
                                      : 'bg-gray-200'
                                  }`}
                                />
                              ))}
                              <span className="text-xs font-semibold ml-1">
                                {layout.efficiency > 85 ? 'Excellent' : layout.efficiency > 70 ? 'Good' : layout.efficiency > 50 ? 'Fair' : 'Poor'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Production Intelligence */}
                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                      <h6 className="font-semibold text-slate-800 mb-3 text-center flex items-center justify-center">
                        <Edit3 className="w-4 h-4 mr-2 text-[#27aae1]" />
                        Production Intelligence
                      </h6>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Item Size:</span>
                          <span className="font-semibold text-[#27aae1]">
                            {outputDimensions[productIndex]?.width?.toFixed(1) ?? "–"} × {outputDimensions[productIndex]?.height?.toFixed(1) ?? "–"} cm
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Layout Strategy:</span>
                          <span className={`font-semibold ${layout.orientation === 'rotated' ? 'text-[#ea078b]' : 'text-green-600'}`}>
                            {layout.orientation === 'rotated' ? '↻ Optimized Rotation' : '→ Standard Layout'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Grid Pattern:</span>
                          <span className="font-semibold">
                            {layout.itemsPerRow} × {layout.itemsPerCol} matrix
                          </span>
                        </div>

                        {/* Layout Optimization */}
                        <div className="border-t pt-2 mt-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Items per Sheet:</span>
                            <span className="font-bold text-[#27aae1] text-lg">{layout.itemsPerSheet}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Space Utilization:</span>
                            <span className={`font-semibold ${layout.efficiency > 80 ? 'text-green-600' : 'text-yellow-600'}`}>
                              {inputWidth && inputHeight && outputDimensions[productIndex]?.width && outputDimensions[productIndex]?.height && layout.itemsPerSheet
                                ? ((layout.itemsPerRow * outputDimensions[productIndex].width) / inputWidth * 100).toFixed(1)
                                : "–"}% × {inputWidth && inputHeight && outputDimensions[productIndex]?.width && outputDimensions[productIndex]?.height && layout.itemsPerSheet
                                ? ((layout.itemsPerCol * outputDimensions[productIndex].height) / inputHeight * 100).toFixed(1)
                                : "–"}%
                            </span>
                          </div>
                        </div>

                        {/* Optimization Recommendations */}
                        <div className="bg-[#27aae1]/10 p-2 rounded-lg">
                          <p className="text-xs text-[#27aae1] font-medium">
                            {layout.efficiency > 85 
                              ? "✓ Optimal layout achieved"
                              : layout.efficiency > 70
                              ? "⚡ Consider alternative orientations"
                              : "⚠️ Low efficiency - review dimensions"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Operations Dashboard */}
                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                      <h6 className="font-semibold text-slate-800 mb-3 text-center flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 mr-2 text-[#27aae1]" />
                        Operations Dashboard
                      </h6>
                      <div className="space-y-3">
                        {/* Production Metrics */}
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="bg-[#27aae1]/10 p-2 rounded">
                            <div className="text-[#27aae1] font-medium">Required</div>
                            <div className="font-bold text-[#27aae1]">{qty || 0}</div>
                          </div>
                          <div className="bg-orange-50 p-2 rounded">
                            <div className="text-orange-600 font-medium">Sheets</div>
                            <div className="font-bold text-orange-800">{sheetsNeeded}</div>
                          </div>
                        </div>

                        {enteredSheets && (
                          <div className="flex justify-between bg-[#ea078b]/10 p-2 rounded">
                            <span className="text-[#ea078b] font-medium">Planned Sheets:</span>
                            <span className="font-bold text-[#ea078b]">{enteredSheets}</span>
                          </div>
                        )}

                        {/* Production Efficiency */}
                        <div className="border-t pt-2">
                          <div className="flex justify-between bg-green-50 p-2 rounded border border-green-200">
                            <span className="text-green-700 font-medium">Production Yield:</span>
                            <span className="font-bold text-green-800">{totalItemsPossible}</span>
                          </div>
                          
                          {totalItemsPossible > qty && (
                            <div className="mt-2 space-y-1">
                              <div className="flex justify-between bg-amber-50 p-2 rounded border border-amber-200">
                                <span className="text-amber-700 font-medium">Overproduction:</span>
                                <span className="font-bold text-amber-800">{totalItemsPossible - qty}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-600">Waste Rate:</span>
                                <span className="font-semibold text-red-600">
                                  {((totalItemsPossible - qty) / totalItemsPossible * 100).toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Cost Efficiency Indicator */}
                        <div className="bg-slate-50 p-2 rounded">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-slate-700">Cost Efficiency:</span>
                            <div className="text-right">
                              <div className="font-bold text-slate-800">
                                {pricePerSheet ? `${(pricePerSheet * actualSheetsNeeded / qty).toFixed(4)}` : "–"}
                              </div>
                              <div className="text-xs text-slate-500">per item</div>
                            </div>
                          </div>
                        </div>

                        {/* Operational Recommendations */}
                        <div className={`p-2 rounded text-xs font-medium ${
                          layout.efficiency > 85 && totalItemsPossible - qty < qty * 0.1
                            ? 'bg-green-50 text-green-800'
                            : totalItemsPossible - qty > qty * 0.2
                            ? 'bg-red-50 text-red-800'
                            : 'bg-yellow-50 text-yellow-800'
                        }`}>
                          {layout.efficiency > 85 && totalItemsPossible - qty < qty * 0.1
                            ? "🎯 Optimal production setup"
                            : totalItemsPossible - qty > qty * 0.2
                            ? "⚠️ High waste - consider reducing sheets"
                            : "📊 Review setup for optimization"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>


          </div>
        );
      })}
        </div>
      ))}

      {/* Enhanced Modal Dialog */}
      <Dialog
        open={showSupplierDB}
        onOpenChange={(open) => {
          setShowSupplierDB(open);
          if (open) {
            fetchSuppliersAndMaterials();
          }
        }}
      >
        <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-2xl font-bold text-slate-800">
              <Database className="w-8 h-8 mr-3 text-green-600" />
              Supplier Database & Material Catalog
            </DialogTitle>
            <p className="text-slate-600 mt-2">Browse available materials, suppliers, and pricing information</p>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Search and Filter Section */}
            <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-4 border border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                  <Label htmlFor="material-search" className="text-sm font-medium text-slate-700 flex items-center">
                    <Search className="w-4 h-4 mr-2 text-[#27aae1]" />
                    Search Materials
                  </Label>
                  <Input
                    id="material-search"
                    placeholder="Paper name, GSM, supplier..."
                    className="mt-1"
                    value={supplierSearchTerm}
                    onChange={(e) => setSupplierSearchTerm(e.target.value)}
                  />
                    </div>
                <div>
                  <Label htmlFor="supplier-filter" className="text-sm font-medium text-slate-700 flex items-center">
                    <Building className="w-4 h-4 mr-2 text-[#27aae1]" />
                    Supplier
                  </Label>
                  <select
                    id="supplier-filter"
                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#27aae1]"
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                  >
                    <option value="">All Suppliers</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.name}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                  </div>
                <div>
                  <Label htmlFor="gsm-filter" className="text-sm font-medium text-slate-700 flex items-center">
                    <BarChart3 className="w-4 h-4 mr-2 text-[#27aae1]" />
                    GSM Range
                  </Label>
                  <select
                    id="gsm-filter"
                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#27aae1]"
                    value={selectedGSM}
                    onChange={(e) => setSelectedGSM(e.target.value)}
                  >
                    <option value="">All GSM</option>
                    <option value="80-120">80-120 gsm</option>
                    <option value="150-200">150-200 gsm</option>
                    <option value="250-300">250-300 gsm</option>
                    <option value="400+">400+ gsm</option>
                  </select>
                  </div>
                </div>
              </div>

            {/* Professional Materials Table */}
            {isLoadingSuppliers ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <div className="text-slate-600 font-medium">Loading supplier database...</div>
                <div className="text-slate-500 text-sm mt-2">Fetching materials and supplier information</div>
              </div>
            ) : filteredMaterials.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-slate-400 mb-4 text-6xl">🔍</div>
                <div className="text-slate-600 font-medium text-lg">No materials found</div>
                <div className="text-slate-500 text-sm mt-2">
                  {supplierSearchTerm || selectedSupplier || selectedGSM 
                    ? "Try adjusting your search criteria" 
                    : "No materials available in the database"
                  }
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Material
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          GSM
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Supplier
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {filteredMaterials.map((material, index) => {
                        const isPremium = material.cost > 0.05;
                        const isEco = material.name.toLowerCase().includes('recycled') || material.name.toLowerCase().includes('eco');
                        const isStandard = !isPremium && !isEco;
                        
                        let statusColor = 'bg-[#27aae1]/20 text-[#27aae1]';
                        let statusText = 'Standard';
                        
                        if (isPremium) {
                          statusColor = 'bg-green-100 text-green-800';
                          statusText = 'Premium';
                        } else if (isEco) {
                          statusColor = 'bg-emerald-100 text-emerald-800';
                          statusText = 'Eco-Friendly';
                        }
                        
                        return (
                          <tr key={material.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-slate-900">{material.name}</div>
                                <div className="text-xs text-slate-500">ID: {material.materialId}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#27aae1]/20 text-[#27aae1]">
                                {material.gsm} gsm
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-slate-900">{material.supplierName}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-slate-900">{material.supplierContact || material.supplierEmail}</div>
                              <div className="text-xs text-slate-500">{material.supplierPhone}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-slate-900">{material.supplierCity}</div>
                              <div className="text-xs text-slate-500">{material.supplierCountry}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="text-sm font-semibold text-slate-900">
                                ${material.cost.toFixed(3)}
                              </div>
                              <div className="text-xs text-slate-500">per {material.unit}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                                {statusText}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Additional Information */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <h5 className="font-semibold text-slate-800 mb-3 flex items-center">
                <Info className="w-4 h-4 mr-2 text-[#27aae1]" />
                Material Selection Guidelines
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
                  <div>
                  <strong>Printing Method:</strong> Consider digital vs offset compatibility
                    </div>
                <div>
                  <strong>Finish Requirements:</strong> Matte, glossy, or textured surfaces
                  </div>
                <div>
                  <strong>Environmental Impact:</strong> Recycled content and sustainability
                  </div>
                <div>
                  <strong>Cost Optimization:</strong> Balance quality with budget constraints
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="pt-6">
            <Button variant="outline" onClick={() => setShowSupplierDB(false)} className="px-6 py-2 rounded-xl">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Modal Dialog */}
      <Dialog
        open={openIdx != null}
        onOpenChange={(o) => setOpenIdx(o ? openIdx : null)}
      >
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-6">
            <DialogTitle className="flex items-center text-2xl font-bold text-slate-800">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-slate-600 text-base font-normal">
                  Detailed Cost Analysis
                </div>
                <div className="text-slate-800 text-xl font-bold">
                  {openData?.paper?.name || "Paper"} {openData?.paper?.gsm ? `${openData.paper.gsm}gsm` : ""}
                </div>
              </div>
            </DialogTitle>
            <p className="text-slate-600 mt-2">Understand how your costs are calculated based on different pricing scenarios</p>
          </DialogHeader>

          {openData ? (
            <div className="space-y-8">
              {/* Top Row - Specifications & Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Sheet Specifications Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-[#27aae1]/20 rounded-lg flex items-center justify-center mr-3">
                      <Package className="w-4 h-4 text-[#27aae1]" />
                    </div>
                    <h6 className="text-lg font-semibold text-slate-800">Sheet Specifications</h6>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 px-4 bg-slate-50 rounded-xl">
                      <span className="text-slate-600 font-medium">Sheet Dimensions</span>
                      <span className="font-bold text-slate-800 text-lg">
                        {openData.op?.inputWidth ?? "—"} × {openData.op?.inputHeight ?? "—"} cm
                      </span>
                    </div>
                                          <div className="flex justify-between items-center py-3 px-4 bg-green-50 rounded-xl">
                        <span className="text-slate-600 font-medium">Usable Area</span>
                        <span className="font-bold text-green-700 text-lg">
                          {openData.calc?.layout.usableW?.toFixed(1) ?? "—"} × {openData.calc?.layout.usableH?.toFixed(1) ?? "—"} cm
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-3 px-4 bg-[#27aae1]/10 rounded-xl">
                        <span className="text-slate-600 font-medium">Total Cost</span>
                        <span className="font-bold text-[#27aae1] text-lg">
                          {(() => {
                            const totalCost = calculateTotalCost(openData.op, openData.op?.enteredSheets ?? openData.calc?.recommendedSheets ?? 0);
                            return totalCost > 0 ? fmt(totalCost) : "—";
                          })()}
                        </span>
                      </div>
                    <div className="flex justify-between items-center py-3 px-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl">
                      <span className="text-slate-600 font-medium">Layout Efficiency</span>
                      <span className={`font-bold text-lg ${(openData.calc?.layout.efficiency ?? 0) > 80 ? 'text-green-600' : (openData.calc?.layout.efficiency ?? 0) > 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {openData.calc?.layout.efficiency?.toFixed(1) ?? "—"}%
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Layout Details Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-[#ea078b]/20 rounded-lg flex items-center justify-center mr-3">
                      <BarChart3 className="w-4 h-4 text-[#ea078b]" />
                    </div>
                    <h6 className="text-lg font-semibold text-slate-800">Layout Details</h6>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 px-4 bg-slate-50 rounded-xl">
                      <span className="text-slate-600 font-medium">Grid Layout</span>
                      <span className="font-bold text-slate-800 text-lg">
                        {openData.calc?.layout.itemsPerRow} × {openData.calc?.layout.itemsPerCol}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 px-4 bg-[#27aae1]/10 rounded-xl">
                      <span className="text-slate-600 font-medium">Items per Sheet</span>
                      <span className="font-bold text-[#27aae1] text-lg">
                        {openData.calc?.layout.itemsPerSheet}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 px-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                      <span className="text-slate-600 font-medium">Orientation</span>
                      <span className={`font-bold text-lg flex items-center ${openData.calc?.layout.orientation === 'rotated' ? 'text-[#ea078b]' : 'text-green-600'}`}>
                        {openData.calc?.layout.orientation === 'rotated' ? (
                          <>
                            <span className="mr-2">↻</span> Rotated
                          </>
                        ) : (
                          <>
                            <span className="mr-2">→</span> Normal
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cost Breakdown Section */}
              <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl border border-slate-200 p-8">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-[#27aae1]/20 rounded-xl flex items-center justify-center mr-4">
                    <Calculator className="w-5 h-5 text-[#27aae1]" />
                  </div>
                  <h6 className="text-xl font-bold text-slate-800">Cost Breakdown</h6>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Paper Cost Breakdown */}
                  <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h6 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                      <Package className="w-5 h-5 mr-2 text-[#27aae1]" />
                      Paper Costs
                    </h6>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2">
                        <span className="text-slate-600">Price per Sheet</span>
                        <span className="font-semibold text-[#27aae1]">
                          {openData.op?.pricePerSheet != null
                            ? fmt(openData.op.pricePerSheet)
                            : "—"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-slate-600">Sheets Required</span>
                        <span className="font-semibold text-slate-800">
                          {openData.op?.enteredSheets ?? openData.calc?.recommendedSheets ?? 0}
                        </span>
                      </div>
                      <div className="border-t pt-3 mt-4">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold text-slate-800">Total Paper Cost</span>
                          <span className="text-2xl font-bold text-[#27aae1]">
                            {(() => {
                              const totalCost = calculateTotalCost(openData.op, openData.op?.enteredSheets ?? openData.calc?.recommendedSheets ?? 0);
                              return totalCost > 0 ? fmt(totalCost) : "—";
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Finishing Costs */}
                  <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h6 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                      <Settings className="w-5 h-5 mr-2 text-green-600" />
                      Finishing Options (From Previous Step)
                    </h6>
                    <div className="space-y-3">
                      {formData.products[0]?.finishing && formData.operational.finishing
                        .filter((f) => formData.products[0].finishing?.includes(f.name))
                        .map((f) => {
                          const actualSheetsNeeded = openData?.op?.enteredSheets ?? openData?.calc?.recommendedSheets ?? 0;
                          return (
                            <div key={f.name} className="flex justify-between items-center py-2 px-3 bg-slate-50 rounded-lg">
                              <div>
                                <span className="text-slate-600 font-medium">{f.name}</span>
                                <div className="text-xs text-slate-500">
                                  {f.cost != null ? `${fmt(f.cost)} per unit × ${actualSheetsNeeded} sheets` : "Cost not specified"}
                                </div>
                              </div>
                              <span className="font-semibold text-slate-800">
                                {f.cost != null ? fmt(f.cost * actualSheetsNeeded) : "—"}
                              </span>
                            </div>
                          );
                        })}
                      <div className="border-t pt-3 mt-4">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold text-slate-800">Total Finishing</span>
                          <span className="text-2xl font-bold text-green-600">
                            {fmt(
                              formData.products[0]?.finishing ? formData.operational.finishing
                                .filter((f) => formData.products[0].finishing?.includes(f.name))
                                .reduce((acc, f) => {
                                  const actualSheetsNeeded = openData?.op?.enteredSheets ?? openData?.calc?.recommendedSheets ?? 0;
                                  return acc + ((f.cost ?? 0) * actualSheetsNeeded);
                                }, 0) : 0
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Production Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-[#27aae1]/30 p-6 text-center">
                  <div className="w-12 h-12 bg-blue-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Package className="w-6 h-6 text-[#27aae1]" />
                  </div>
                  <div className="text-[#27aae1] font-medium mb-1">Plates Required</div>
                  <div className="text-3xl font-bold text-[#27aae1]">{plates}</div>
                  <div className="text-xs text-[#27aae1] mt-1">Printing plates</div>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border border-green-200 p-6 text-center">
                  <div className="w-12 h-12 bg-green-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <BarChart3 className="w-6 h-6 text-green-700" />
                  </div>
                  <div className="text-green-700 font-medium mb-1">Units Produced</div>
                  <div className="text-3xl font-bold text-green-800">{units}</div>
                  <div className="text-xs text-green-600 mt-1">Final items</div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border border-[#ea078b]/30 p-6 text-center">
                  <div className="w-12 h-12 bg-purple-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Calculator className="w-6 h-6 text-[#ea078b]" />
                  </div>
                  <div className="text-[#ea078b] font-medium mb-1">Efficiency</div>
                  <div className={`text-3xl font-bold ${(openData.calc?.layout.efficiency ?? 0) > 80 ? 'text-green-600' : (openData.calc?.layout.efficiency ?? 0) > 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {openData.calc?.layout.efficiency?.toFixed(1) ?? "—"}%
                  </div>
                  <div className="text-xs text-[#ea078b] mt-1">Layout optimization</div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl border border-orange-200 p-6 text-center">
                  <div className="w-12 h-12 bg-orange-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Palette className="w-6 h-6 text-orange-700" />
                  </div>
                  <div className="text-orange-700 font-medium mb-1">Colors</div>
                  <div className="text-3xl font-bold text-orange-800">
                    1
                  </div>
                  <div className="text-xs text-orange-600 mt-1">Printing colors</div>
                </div>
              </div>

              {/* Advanced Cost Analysis */}
              <div className="bg-gradient-to-br from-slate-50 to-indigo-50 rounded-2xl border border-slate-200 p-8">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center mr-4">
                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h6 className="text-xl font-bold text-slate-800">Advanced Cost Analysis</h6>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Cost per Unit Analysis */}
                  <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h6 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                      <Calculator className="w-5 h-5 mr-2 text-indigo-600" />
                      Cost per Unit Analysis
                    </h6>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-3 px-4 bg-slate-50 rounded-xl">
                        <span className="text-slate-600">Paper Cost per Unit</span>
                        <span className="font-semibold text-indigo-600">
                          {fmt(
                            calculateTotalCost(openData.op, openData.op?.enteredSheets ?? openData.calc?.recommendedSheets ?? 0) / 
                            (formData.products[0]?.quantity ?? 1)
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-3 px-4 bg-[#27aae1]/10 rounded-xl">
                        <span className="text-slate-600">Finishing Cost per Unit</span>
                        <span className="font-semibold text-[#27aae1]">
                          {fmt(
                            (formData.products[0]?.finishing ? formData.operational.finishing
                              .filter((f) => formData.products[0].finishing?.includes(f.name))
                              .reduce((acc, f) => {
                                const actualSheetsNeeded = openData?.op?.enteredSheets ?? openData?.calc?.recommendedSheets ?? 0;
                                return acc + ((f.cost ?? 0) * actualSheetsNeeded);
                              }, 0) : 0) / (formData.products[0]?.quantity ?? 1)
                          )}
                        </span>
                      </div>
                                            <div className="flex justify-between items-center py-3 px-4 bg-green-50 rounded-xl">
                        <span className="text-slate-600">Total Cost per Unit</span>
                        <span className="font-bold text-green-600 text-lg">
                          {fmt(
                            (calculateTotalCost(openData.op, openData.op?.enteredSheets ?? openData.calc?.recommendedSheets ?? 0) + 
                             (formData.products[0]?.finishing ? formData.operational.finishing
                               .filter((f) => formData.products[0].finishing?.includes(f.name))
                               .reduce((acc, f) => {
                                 const actualSheetsNeeded = openData?.op?.enteredSheets ?? openData?.calc?.recommendedSheets ?? 0;
                                 return acc + ((f.cost ?? 0) * actualSheetsNeeded);
                               }, 0) : 0)) / (formData.products[0]?.quantity ?? 1)
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Production Timeline */}
                  <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h6 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                      <Clock className="w-5 h-5 mr-2 text-orange-600" />
                      Production Timeline
                    </h6>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-3 px-4 bg-slate-50 rounded-xl">
                        <span className="text-slate-600">Setup Time</span>
                        <span className="font-semibold text-slate-800">2-3 hours</span>
                      </div>
                      <div className="flex justify-between items-center py-3 px-4 bg-[#27aae1]/10 rounded-xl">
                        <span className="text-slate-600">Printing Time</span>
                        <span className="font-semibold text-[#27aae1]">
                          {Math.ceil((openData.op?.enteredSheets ?? openData.calc?.recommendedSheets ?? 0) / 100)} hours
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-3 px-4 bg-green-50 rounded-xl">
                        <span className="text-slate-600">Finishing Time</span>
                        <span className="font-semibold text-green-600">
                          {Math.ceil((openData.op?.enteredSheets ?? openData.calc?.recommendedSheets ?? 0) / 50)} hours
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-3 px-4 bg-orange-50 rounded-xl">
                        <span className="text-slate-600">Total Production</span>
                        <span className="font-bold text-orange-600 text-lg">
                          {Math.ceil(2 + (openData.op?.enteredSheets ?? openData.calc?.recommendedSheets ?? 0) / 100 + (openData.op?.enteredSheets ?? openData.calc?.recommendedSheets ?? 0) / 50)} hours
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grand Total */}
              <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-green-50 rounded-2xl border-2 border-slate-300 p-8 text-center">
                <div className="mb-4">
                  <div className="text-slate-600 font-medium text-lg mb-2">Estimated Base Cost</div>
                  <div className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent">
                    {fmt(
                      calculateTotalCost(openData.op, openData.op?.enteredSheets ?? openData.calc?.recommendedSheets ?? 0) +
                        (formData.products[0]?.finishing ? formData.operational.finishing
                          .filter((f) => formData.products[0].finishing?.includes(f.name))
                          .reduce((acc, f) => {
                            const actualSheetsNeeded = openData?.op?.enteredSheets ?? openData?.calc?.recommendedSheets ?? 0;
                            return acc + ((f.cost ?? 0) * actualSheetsNeeded);
                          }, 0) : 0)
                    )}
                  </div>
                </div>
                <div className="text-sm text-slate-500">
                  Includes paper costs, finishing options, and production calculations
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-slate-400 mb-4 text-6xl">📊</div>
              <div className="text-slate-600 font-medium text-lg">No cost data available</div>
              <div className="text-slate-500 text-sm mt-2">Please configure paper specifications to view cost analysis</div>
            </div>
          )}

          <DialogFooter className="pt-6">
            <Button 
              variant="outline" 
              onClick={() => setOpenIdx(null)}
              className="border-slate-300 hover:border-slate-400 hover:bg-slate-50 px-8 py-3 rounded-xl font-medium"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cost Breakdown Modal */}
      <Dialog open={showCostBreakdown} onOpenChange={setShowCostBreakdown}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-2xl font-bold text-slate-800">
              <BarChart3 className="w-8 h-8 mr-3 text-green-600" />
              Complete Cost Breakdown
            </DialogTitle>
            <p className="text-slate-600 mt-2">Detailed breakdown of all project costs and calculations</p>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Paper Costs Breakdown */}
            <div className="bg-[#27aae1]/10 rounded-xl p-6 border border-[#27aae1]/30">
              <h3 className="text-lg font-semibold text-[#27aae1] mb-4 flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Paper Costs
              </h3>
              <div className="space-y-3">
                {formData.operational.papers.map((opPaper, index) => {
                  const actualSheetsNeeded = opPaper.enteredSheets ?? 
                                           perPaperCalc[Math.floor(index / formData.products[0]?.papers.length || 1)]?.[index % (formData.products[0]?.papers.length || 1)]?.recommendedSheets ?? 0;
                  const paperCost = calculateTotalCost(opPaper, actualSheetsNeeded);
                  
                  return (
                    <div key={index} className="bg-white rounded-lg p-3 border border-[#27aae1]/30">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-700">Paper {index + 1}</span>
                        <span className="font-semibold text-[#27aae1]">{fmt(paperCost)}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {actualSheetsNeeded} sheets × {opPaper.pricePerSheet ? fmt(opPaper.pricePerSheet) : 'packet pricing'}
                      </div>
                    </div>
                  );
                })}
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-[#27aae1]">Total Paper Cost:</span>
                    <span className="text-xl font-bold text-[#27aae1]">
                      {fmt(formData.operational.papers.reduce((acc, opPaper, index) => {
                        const actualSheetsNeeded = opPaper.enteredSheets ?? 
                                                 perPaperCalc[Math.floor(index / formData.products[0]?.papers.length || 1)]?.[index % (formData.products[0]?.papers.length || 1)]?.recommendedSheets ?? 0;
                        return acc + calculateTotalCost(opPaper, actualSheetsNeeded);
                      }, 0))}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Plates Costs Breakdown */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
              <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Plates Costs
              </h3>
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-700">Plates Required:</span>
                  <span className="font-semibold text-green-700">{formData.operational.plates ?? plates ?? 0}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm font-medium text-slate-700">Cost per Plate:</span>
                  <span className="font-semibold text-green-700">AED 25.00</span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-green-800">Total Plates Cost:</span>
                    <span className="text-xl font-bold text-green-800">{fmt(calculatePlatesCost())}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Units Costs Breakdown */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-[#ea078b]/30">
              <h3 className="text-lg font-semibold text-[#ea078b] mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Units Costs
              </h3>
              <div className="bg-white rounded-lg p-4 border border-[#ea078b]/30">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-700">Units Required:</span>
                  <span className="font-semibold text-[#ea078b]">{formData.operational.units ?? units ?? 0}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm font-medium text-slate-700">Cost per Unit:</span>
                  <span className="font-semibold text-[#ea078b]">AED 0.05</span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-[#ea078b]">Total Units Cost:</span>
                    <span className="text-xl font-bold text-[#ea078b]">{fmt(calculateUnitsCost())}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Finishing Costs Breakdown */}
            <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
              <h3 className="text-lg font-semibold text-orange-800 mb-4 flex items-center">
                <Palette className="w-5 h-5 mr-2" />
                Finishing Costs
              </h3>
              <div className="space-y-3">
                {formData.operational.finishing
                  .filter(f => formData.products.some(p => p.finishing?.some(productFinishing => {
                    const baseProductFinishing = productFinishing.includes('-') 
                      ? productFinishing.split('-')[0] 
                      : productFinishing;
                    return baseProductFinishing === f.name;
                  })))
                  .map((finishing) => {
                    const totalFinishingCost = formData.products.reduce((acc, product, productIndex) => {
                      if (product.finishing?.some(productFinishing => {
                        const baseProductFinishing = productFinishing.includes('-') 
                          ? productFinishing.split('-')[0] 
                          : productFinishing;
                        return baseProductFinishing === finishing.name;
                      })) {
                        // Use auto-calculated cost (no manual overrides)
                        return acc + calculateIndividualFinishingCost(finishing.name, product, productIndex);
                      }
                      return acc;
                    }, 0);
                    
                    return (
                      <div key={finishing.name} className="bg-white rounded-lg p-3 border border-orange-200">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-slate-700">{finishing.name}</span>
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              value={totalFinishingCost}
                              readOnly
                              className="w-24 h-8 text-sm text-center border-gray-300 bg-gray-50 text-gray-700"
                              step="0.01"
                              min="0"
                            />
                            <span className="text-xs text-slate-500">per unit</span>
                          </div>
                        </div>
                        <div className="text-xs text-slate-500 space-y-1">
                          <div>Cost per unit: {fmt((() => {
                            const baseFinishingName = finishing.name;
                            const actualSheetsNeeded = formData.products.reduce((acc, product, productIndex) => {
                              if (product.finishing?.some(productFinishing => {
                                const baseProductFinishing = productFinishing.includes('-') 
                                  ? productFinishing.split('-')[0] 
                                  : productFinishing;
                                return baseProductFinishing === finishing.name;
                              })) {
                                const sheets = formData.operational.papers[productIndex]?.enteredSheets ?? 
                                             perPaperCalc[productIndex]?.[0]?.recommendedSheets ?? 0;
                                return acc + sheets;
                              }
                              return acc;
                            }, 0);
                            
                            const totalQuantity = formData.products.reduce((acc, product) => {
                              if (product.finishing?.some(productFinishing => {
                                const baseProductFinishing = productFinishing.includes('-') 
                                  ? productFinishing.split('-')[0] 
                                  : productFinishing;
                                return baseProductFinishing === finishing.name;
                              })) {
                                return acc + (product.quantity || 0);
                              }
                              return acc;
                            }, 0);
                            
                            // Calculate total cost based on formula
                            let totalCost = 0;
                            formData.products.forEach((product, productIndex) => {
                              if (product.finishing?.some(productFinishing => {
                                const baseProductFinishing = productFinishing.includes('-') 
                                  ? productFinishing.split('-')[0] 
                                  : productFinishing;
                                return baseProductFinishing === finishing.name;
                              })) {
                                totalCost += calculateIndividualFinishingCost(finishing.name, product, productIndex);
                              }
                            });
                            
                            // Calculate cost per unit
                            if (['Embossing', 'Foiling', 'Die Cutting', 'UV Spot', 'Folding'].includes(baseFinishingName)) {
                              // For impression-based finishing, use total impressions or total quantity
                              const totalImpressions = formData.operational.impressions || formData.products.reduce((acc, product) => acc + (product.quantity || 0), 0);
                              const costPerUnit = totalImpressions > 0 ? totalCost / totalImpressions : totalCost;
                              console.log('DEBUG: Cost per unit calculation for', finishing.name);
                              console.log('  totalCost:', totalCost);
                              console.log('  totalImpressions:', totalImpressions);
                              console.log('  costPerUnit:', costPerUnit);
                              return costPerUnit;
                            } else {
                              return actualSheetsNeeded > 0 ? totalCost / actualSheetsNeeded : 0;
                            }
                          })())}</div>
                          <div>Total for {formData.products.reduce((acc, product, productIndex) => {
                            if (product.finishing?.some(productFinishing => {
                              const baseProductFinishing = productFinishing.includes('-') 
                                ? productFinishing.split('-')[0] 
                                : productFinishing;
                              return baseProductFinishing === finishing.name;
                            })) {
                              const actualSheetsNeeded = formData.operational.papers[productIndex]?.enteredSheets ?? 
                                                       perPaperCalc[productIndex]?.[0]?.recommendedSheets ?? 0;
                              return acc + actualSheetsNeeded;
                            }
                            return acc;
                          }, 0)} sheets: {fmt(totalFinishingCost)}</div>
                          <div className="text-orange-600 font-medium">
                            {finishing.name === 'Lamination' && 'Auto-calculated: 0.75 dhs per 100×70cm sheet, min 75 dhs'}
                            {finishing.name === 'Velvet Lamination' && 'Auto-calculated: 1 dhs per 100×70cm sheet, min 100 dhs'}
                            {finishing.name === 'Embossing' && 'Auto-calculated: 50 dhs per 1000 impressions + 75 dhs block, min 75 dhs'}
                            {finishing.name === 'Foiling' && 'Auto-calculated: 75 dhs per 1000 impressions + 75 dhs block, min 75 dhs'}
                            {finishing.name === 'Die Cutting' && 'Auto-calculated: 50 dhs per 1000 impressions, min varies by size'}
                            {finishing.name === 'UV Spot' && 'Auto-calculated: 350 dhs per 1000 impressions, min 350 dhs'}
                            {finishing.name === 'Folding' && 'Auto-calculated: 25 dhs per 1000 impressions, min 25 dhs'}
                            {finishing.name === 'Padding' && 'Auto-calculated: Fixed minimum charge 25 dhs'}
                            {finishing.name === 'Varnishing' && 'Auto-calculated: Fixed minimum charge 30 dhs'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-orange-800">Total Finishing Cost:</span>
                    <span className="text-xl font-bold text-orange-800">{fmt(calculateFinishingCosts())}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Costs Breakdown */}
            {additionalCosts.length > 0 && (
              <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl p-6 border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Other Costs
                </h3>
                <div className="space-y-3">
                  {additionalCosts.map((cost) => (
                    <div key={cost.id} className="bg-white rounded-lg p-3 border border-slate-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-700">{cost.description}</span>
                        <span className="font-semibold text-slate-700">{fmt(cost.cost)}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">{cost.comment}</div>
                    </div>
                  ))}
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-800">Total Other Costs:</span>
                      <span className="text-xl font-bold text-slate-800">
                        {fmt(additionalCosts.reduce((acc, cost) => acc + cost.cost, 0))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Grand Total */}
            <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-green-50 rounded-xl p-6 border-2 border-slate-300">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Project Total</h3>
                <div className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent mb-2">
                  {fmt(calculateTotalProjectCost())}
                </div>
                <div className="text-lg font-semibold text-slate-600">
                  Cost per Unit: {fmt(calculateCostPerUnit())}
                </div>
                <div className="text-sm text-slate-500 mt-2">
                  Total Quantity: {formData.products.reduce((acc, product) => acc + (product.quantity || 0), 0)} items
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-6">
            <Button 
              onClick={() => setShowCostBreakdown(false)}
              className="bg-green-600 hover:bg-green-700 px-8 py-3 rounded-xl font-medium"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Pricing Logic Modal */}
      <Dialog open={showPricingLogic} onOpenChange={setShowPricingLogic}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-2xl font-bold text-slate-800">
              <Calculator className="w-8 h-8 mr-3 text-[#27aae1]" />
              Pricing Logic & Calculation Methods
            </DialogTitle>
            <p className="text-slate-600 mt-2">Understand how your costs are calculated based on different pricing scenarios</p>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Pricing Methods Overview */}
            <div className="bg-[#27aae1]/10 rounded-xl p-6 border border-[#27aae1]/30">
              <h3 className="text-lg font-semibold text-[#27aae1] mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Pricing Logic & Calculation Methods
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 border border-[#27aae1]/30 shadow-sm">
                  <div className="w-10 h-10 bg-[#27aae1]/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Package className="w-5 h-5 text-[#27aae1]" />
                  </div>
                  <h4 className="font-semibold text-[#27aae1] text-center mb-2">Packet Pricing</h4>
                  <p className="text-xs text-slate-600 text-center">Buy paper in pre-packaged quantities</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-green-200 shadow-sm">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Calculator className="w-5 h-5 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-green-800 text-center mb-2">Sheet Pricing</h4>
                  <p className="text-xs text-slate-600 text-center">Buy individual sheets at unit price</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-[#ea078b]/30 shadow-sm">
                  <div className="w-10 h-10 bg-[#ea078b]/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Settings className="w-5 h-5 text-[#ea078b]" />
                  </div>
                  <h4 className="font-semibold text-[#ea078b] text-center mb-2">Hybrid Pricing</h4>
                  <p className="text-xs text-slate-600 text-center">Combine both methods for optimal cost</p>
                </div>
              </div>
            </div>

            {/* Calculation Rules */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                <Calculator className="w-5 h-5 mr-2 text-green-600" />
                Calculation Rules
              </h3>
              
              <div className="space-y-4">
                {/* Rule 1: Packet Only */}
                <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-[#27aae1]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[#27aae1] font-bold text-sm">1</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-[#27aae1] mb-2">Packet Only Pricing</h4>
                      <div className="bg-[#27aae1]/10 rounded-lg p-3 mb-3">
                        <div className="font-mono text-sm text-[#27aae1]">
                          Total Cost = [(Sheets needed ÷ Sheets per packet)] × Price per packet
                        </div>
                      </div>
                      <p className="text-sm text-slate-600">
                        When only packet pricing is available, we round up to the nearest whole packet. This ensures you have enough paper for your project.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Rule 2: Sheet Only */}
                <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-600 font-bold text-sm">2</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-green-800 mb-2">Sheet Only Pricing</h4>
                      <div className="bg-green-50 rounded-lg p-3 mb-3">
                        <div className="font-mono text-sm text-green-700">
                          Total Cost = Sheets needed × Price per sheet
                        </div>
                      </div>
                      <p className="text-sm text-slate-600">
                        When only sheet pricing is available, you pay for exactly the number of sheets needed.
                        No waste, but potentially higher per-sheet cost.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Rule 3: Hybrid Pricing */}
                <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-[#ea078b]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[#ea078b] font-bold text-sm">3</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-[#ea078b] mb-2">Hybrid Pricing</h4>
                      <div className="bg-[#ea078b]/10 rounded-lg p-3 mb-3">
                        <div className="font-mono text-sm text-[#ea078b]">
                          Total Cost = Full packets × Price per packet + Remaining sheets × Price per sheet
                        </div>
                      </div>
                      <p className="text-sm text-slate-600">
                        When both pricing methods are available, we optimize by using full packets first,
                        then individual sheets for the remainder. This gives you the best of both worlds.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Practical Example */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
              <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                <Calculator className="w-5 h-5 mr-2" />
                Practical Example
              </h3>
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="font-semibold text-green-800 mb-2">Scenario</h4>
                    <ul className="text-sm text-slate-700 space-y-1">
                      <li>• Sheets needed: <span className="font-semibold">25</span></li>
                      <li>• Sheets per packet: <span className="font-semibold">20</span></li>
                      <li>• Price per packet: <span className="font-semibold">AED 200</span></li>
                      <li>• Price per sheet: <span className="font-semibold">AED 15</span></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-800 mb-2">Calculation</h4>
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="text-sm text-green-800 space-y-1">
                        <div>Full packets: ⌊25 ÷ 20⌋ = <span className="font-semibold">1</span></div>
                        <div>Remaining sheets: 25 % 20 = <span className="font-semibold">5</span></div>
                        <div>Packet cost: 1 × AED 200 = <span className="font-semibold">AED 200</span></div>
                        <div>Sheet cost: 5 × AED 15 = <span className="font-semibold">AED 75</span></div>
                        <div className="border-t pt-1 mt-1 font-semibold">
                          Total: AED 200 + AED 75 = <span className="text-lg">AED 275</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-green-100 rounded-lg p-3 border border-green-300">
                  <div className="text-sm text-green-800">
                    <span className="font-semibold">💡 Pro Tip:</span> Hybrid pricing often provides the best value 
                    by combining bulk discounts with precise quantity matching.
                  </div>
                </div>
              </div>
            </div>

            {/* Benefits Section */}
            <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-6 border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Why This System?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-[#27aae1]/100 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="text-sm text-slate-700">
                      <span className="font-semibold">Cost Optimization:</span> Always uses the most economical combination
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="text-sm text-slate-700">
                      <span className="font-semibold">Flexibility:</span> Adapts to different supplier pricing models
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-[#ea078b]/100 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="text-sm text-slate-700">
                      <span className="font-semibold">Transparency:</span> Clear breakdown of all costs
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="text-sm text-slate-700">
                      <span className="font-semibold">Accuracy:</span> No rounding errors or hidden costs
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-6l">
            <Button 
              onClick={() => setShowPricingLogic(false)}
              className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-xl font-medium"
            >
              Got it! Thanks
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Pricing Logic Modal */}
      <Dialog open={showPricingLogic} onOpenChange={setShowPricingLogic}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-2xl font-bold text-slate-800">
              <Calculator className="w-8 h-8 mr-3 text-[#27aae1]" />
              Pricing Logic & Calculation Methods
            </DialogTitle>
            <p className="text-slate-600 mt-2">Understand how your costs are calculated based on different pricing scenarios</p>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Pricing Methods Overview */}
            <div className="bg-[#27aae1]/10 rounded-xl p-6 border border-[#27aae1]/30">
              <h3 className="text-lg font-semibold text-[#27aae1] mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Pricing Logic & Calculation Methods
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 border border-[#27aae1]/30 shadow-sm">
                  <div className="w-10 h-10 bg-[#27aae1]/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Package className="w-5 h-5 text-[#27aae1]" />
                  </div>
                  <h4 className="font-semibold text-[#27aae1] text-center mb-2">Packet Pricing</h4>
                  <p className="text-xs text-slate-600 text-center">Buy paper in pre-packaged quantities</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-green-200 shadow-sm">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Calculator className="w-5 h-5 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-green-800 text-center mb-2">Sheet Pricing</h4>
                  <p className="text-xs text-slate-600 text-center">Buy individual sheets at unit price</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-[#ea078b]/30 shadow-sm">
                  <div className="w-10 h-10 bg-[#ea078b]/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Settings className="w-5 h-5 text-[#ea078b]" />
                  </div>
                  <h4 className="font-semibold text-[#ea078b] text-center mb-2">Hybrid Pricing</h4>
                  <p className="text-xs text-slate-600 text-center">Combine both methods for optimal cost</p>
                </div>
              </div>
            </div>

            {/* Calculation Rules */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                <Calculator className="w-5 h-5 mr-2 text-green-600" />
                Calculation Rules
              </h3>
              
              <div className="space-y-4">
                {/* Rule 1: Packet Only */}
                <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-[#27aae1]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[#27aae1] font-bold text-sm">1</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-[#27aae1] mb-2">Packet Only Pricing</h4>
                      <div className="bg-[#27aae1]/10 rounded-lg p-3 mb-3">
                        <div className="font-mono text-sm text-[#27aae1]">
                          Total Cost = [(Sheets needed ÷ Sheets per packet)] × Price per packet
                        </div>
                      </div>
                      <p className="text-sm text-slate-600">
                        When only packet pricing is available, we round up to the nearest whole packet. This ensures you have enough paper for your project.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Rule 2: Sheet Only */}
                <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-600 font-bold text-sm">2</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-green-800 mb-2">Sheet Only Pricing</h4>
                      <div className="bg-green-50 rounded-lg p-3 mb-3">
                        <div className="font-mono text-sm text-green-700">
                          Total Cost = Sheets needed × Price per sheet
                        </div>
                      </div>
                      <p className="text-sm text-slate-600">
                        When only sheet pricing is available, you pay for exactly the number of sheets needed.
                        No waste, but potentially higher per-sheet cost.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Rule 3: Hybrid Pricing */}
                <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-[#ea078b]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[#ea078b] font-bold text-sm">3</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-[#ea078b] mb-2">Hybrid Pricing</h4>
                      <div className="bg-[#ea078b]/10 rounded-lg p-3 mb-3">
                        <div className="font-mono text-sm text-[#ea078b]">
                          Total Cost = Full packets × Price per packet + Remaining sheets × Price per sheet
                        </div>
                      </div>
                      <p className="text-sm text-slate-600">
                        When both pricing methods are available, we optimize by using full packets first,
                        then individual sheets for the remainder. This gives you the best of both worlds.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Practical Example */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
              <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                <Calculator className="w-5 h-5 mr-2" />
                Practical Example
              </h3>
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="font-semibold text-green-800 mb-2">Scenario</h4>
                    <ul className="text-sm text-slate-700 space-y-1">
                      <li>• Sheets needed: <span className="font-semibold">25</span></li>
                      <li>• Sheets per packet: <span className="font-semibold">20</span></li>
                      <li>• Price per packet: <span className="font-semibold">AED 200</span></li>
                      <li>• Price per sheet: <span className="font-semibold">AED 15</span></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-800 mb-2">Calculation</h4>
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="text-sm text-green-800 space-y-1">
                        <div>Full packets: ⌊25 ÷ 20⌋ = <span className="font-semibold">1</span></div>
                        <div>Remaining sheets: 25 % 20 = <span className="font-semibold">5</span></div>
                        <div>Packet cost: 1 × AED 200 = <span className="font-semibold">AED 200</span></div>
                        <div>Sheet cost: 5 × AED 15 = <span className="font-semibold">AED 75</span></div>
                        <div className="border-t pt-1 mt-1 font-semibold">
                          Total: AED 200 + AED 75 = <span className="text-lg">AED 275</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-green-100 rounded-lg p-3 border border-green-300">
                  <div className="text-sm text-green-800">
                    <span className="font-semibold">💡 Pro Tip:</span> Hybrid pricing often provides the best value 
                    by combining bulk discounts with precise quantity matching.
                  </div>
                </div>
              </div>
            </div>

            {/* Benefits Section */}
            <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-6 border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Why This System?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-[#27aae1]/100 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="text-sm text-slate-700">
                      <span className="font-semibold">Cost Optimization:</span> Always uses the most economical combination
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="text-sm text-slate-700">
                      <span className="font-semibold">Flexibility:</span> Adapts to different supplier pricing models
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-[#ea078b]/100 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="text-sm text-slate-700">
                      <span className="font-semibold">Transparency:</span> Clear breakdown of all costs
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="text-sm text-slate-700">
                      <span className="font-semibold">Accuracy:</span> No rounding errors or hidden costs
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-6">
            <Button 
              onClick={() => setShowPricingLogic(false)}
              className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-xl font-medium"
            >
              Got it! Thanks
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Paper Price Modal - Simple Test */}
      <Dialog open={showPaperPrice !== null} onOpenChange={() => setShowPaperPrice(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-2xl font-bold text-slate-800">
              <Calculator className="w-8 h-8 mr-3 text-[#27aae1]" />
              Paper Price Details
            </DialogTitle>
            <p className="text-slate-600 mt-2">Detailed breakdown of paper pricing and calculations</p>
          </DialogHeader>
          
          {showPaperPrice !== null && (() => {
            const paperIndex = showPaperPrice;
            const opPaper = formData.operational.papers[paperIndex];
            const productIndex = Math.floor(paperIndex / (formData.products[0]?.papers.length || 1));
            const paperCalc = perPaperCalc[productIndex]?.[paperIndex % (formData.products[0]?.papers.length || 1)];
            const actualSheetsNeeded = opPaper?.enteredSheets ?? paperCalc?.recommendedSheets ?? 0;
            const pricePerSheet = opPaper?.pricePerSheet != null
              ? opPaper.pricePerSheet
              : (opPaper?.pricePerPacket != null && opPaper?.sheetsPerPacket != null
                ? opPaper.pricePerPacket / opPaper.sheetsPerPacket
                : null);
            
            return (
              <div className="space-y-6">
                {/* Paper Information */}
                <div className="bg-[#27aae1]/10 rounded-xl p-6 border border-[#27aae1]/30">
                  <h3 className="text-lg font-semibold text-[#27aae1] mb-4 flex items-center">
                    <Package className="w-5 h-5 mr-2" />
                    Paper Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Paper Name:</span>
                        <span className="font-semibold text-[#27aae1]">
                          {formData.products[0]?.papers[paperIndex % (formData.products[0]?.papers.length || 1)]?.name || 'Standard Paper'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">GSM:</span>
                        <span className="font-semibold text-[#27aae1]">
                          {formData.products[0]?.papers[paperIndex % (formData.products[0]?.papers.length || 1)]?.gsm || '150'} gsm
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Input Size:</span>
                        <span className="font-semibold text-[#27aae1]">
                          {opPaper?.inputWidth || 100} × {opPaper?.inputHeight || 70} cm
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Output Size:</span>
                        <span className="font-semibold text-[#27aae1]">
                          {opPaper?.outputWidth || 'Not set'} × {opPaper?.outputHeight || 'Not set'} cm
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Sheets Needed:</span>
                        <span className="font-semibold text-[#27aae1]">{actualSheetsNeeded}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Sheets per Packet:</span>
                        <span className="font-semibold text-[#27aae1]">
                          {opPaper?.sheetsPerPacket || 'Not set'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Paper Index:</span>
                        <span className="font-semibold text-[#27aae1]">{paperIndex + 1}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Product Index:</span>
                        <span className="font-semibold text-[#27aae1]">{productIndex + 1}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pricing Information */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                  <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                    <DollarSign className="w-5 h-5 mr-2" />
                    Pricing Details
                  </h3>
                  <div className="space-y-4">
                    {opPaper?.pricePerSheet != null && (
                      <div className="bg-white rounded-lg p-4 border border-green-200">
                        <h4 className="font-semibold text-green-800 mb-3">Per-Sheet Pricing</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-600">Price per Sheet:</span>
                            <span className="font-semibold text-green-700">{fmt(opPaper.pricePerSheet)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-600">Sheets Required:</span>
                            <span className="font-semibold text-green-700">{actualSheetsNeeded}</span>
                          </div>
                          <div className="border-t pt-2 mt-2">
                            <div className="flex justify-between">
                              <span className="font-semibold text-green-800">Total Cost:</span>
                              <span className="text-xl font-bold text-green-800">
                                {fmt(opPaper.pricePerSheet * actualSheetsNeeded)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {opPaper?.pricePerPacket != null && opPaper?.sheetsPerPacket != null && (
                      <div className="bg-white rounded-lg p-4 border border-green-200">
                        <h4 className="font-semibold text-green-800 mb-3">Per-Packet Pricing</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-600">Price per Packet:</span>
                            <span className="font-semibold text-green-700">{fmt(opPaper.pricePerPacket)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-600">Sheets per Packet:</span>
                            <span className="font-semibold text-green-700">{opPaper.sheetsPerPacket}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-600">Effective Price per Sheet:</span>
                            <span className="font-semibold text-green-700">
                              {fmt(opPaper.pricePerPacket / opPaper.sheetsPerPacket)}
                            </span>
                          </div>
                          <div className="border-t pt-2 mt-2">
                            <div className="flex justify-between">
                              <span className="font-semibold text-green-800">Total Cost:</span>
                              <span className="text-xl font-bold text-green-800">
                                {fmt(opPaper.pricePerPacket * Math.ceil(actualSheetsNeeded / opPaper.sheetsPerPacket))}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {!opPaper?.pricePerSheet && !opPaper?.pricePerPacket && (
                      <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                        <div className="flex items-center">
                          <AlertTriangle className="w-5 h-5 text-amber-600 mr-2" />
                          <span className="text-amber-800 font-medium">No pricing information available</span>
                        </div>
                        <p className="text-amber-700 text-sm mt-2">
                          Please set either price per sheet or price per packet in the paper specifications above.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cost Calculation - Using Hybrid Pricing Logic */}
                {(opPaper?.pricePerSheet != null || opPaper?.pricePerPacket != null) && (
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-[#ea078b]/30">
                    <h3 className="text-lg font-semibold text-[#ea078b] mb-4 flex items-center">
                      <Calculator className="w-5 h-5 mr-2" />
                      Cost Calculation
                    </h3>
                    <div className="bg-white rounded-lg p-4 border border-[#ea078b]/30">
                      {(() => {
                        const pricingBreakdown = getPricingBreakdown(opPaper, actualSheetsNeeded);
                        const { breakdown, totalCost } = pricingBreakdown;
                        
                        return (
                      <div className="space-y-3">
                            {breakdown.map((item, index) => (
                              <div key={index} className="flex justify-between">
                                <span className="text-sm text-slate-600">{item.description}:</span>
                                <span className="font-semibold text-[#ea078b]">{fmt(item.total)}</span>
                        </div>
                            ))}
                        <div className="border-t pt-3 mt-3">
                          <div className="flex justify-between">
                            <span className="font-semibold text-[#ea078b]">Total Paper Cost:</span>
                            <span className="text-xl font-bold text-[#ea078b]">
                                  {fmt(totalCost)}
                            </span>
                          </div>
                        </div>
                      </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Additional Information */}
                <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl p-6 border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                    <Info className="w-5 h-5 mr-2" />
                    Additional Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Calculation Method:</span>
                        <span className="font-semibold text-slate-700">
                          {opPaper?.pricePerSheet != null ? 'Per-Sheet' : 'Per-Packet'}
                        </span>
                      </div>
                                             <div className="flex justify-between">
                         <span className="text-sm text-slate-600">Efficiency:</span>
                         <span className="font-semibold text-slate-700">
                           {paperCalc ? `${paperCalc.layout.efficiency.toFixed(1)}%` : 'N/A'}
                         </span>
                       </div>
                     </div>
                     <div className="space-y-2">
                       <div className="flex justify-between">
                         <span className="text-sm text-slate-600">Items per Sheet:</span>
                         <span className="font-semibold text-slate-700">
                           {paperCalc ? paperCalc.layout.itemsPerSheet : 'N/A'}
                         </span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-sm text-slate-600">Layout Orientation:</span>
                         <span className="font-semibold text-slate-700">
                           {paperCalc ? paperCalc.layout.orientation : 'N/A'}
                         </span>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          <DialogFooter className="pt-6">
            <Button 
              onClick={() => setShowPaperPrice(null)}
              className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-xl font-medium"
            >
              Close
            </Button> 
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* === Costing Analysis Section === */}
      {formData.products.length > 0 && (
        <Card className="bg-white border border-slate-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-slate-800 flex items-center">
              <Calculator className="w-5 h-5 mr-2 text-[#27aae1]" />
              Costing Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Automatic Printing Method Display */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-slate-700">
                Selected Printing Method
              </Label>
              <div className="flex items-center space-x-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className={`w-3 h-3 rounded-full ${
                  formData.products[0]?.printingSelection === "Digital" 
                    ? 'bg-blue-500' 
                    : 'bg-green-500'
                }`}></div>
                <span className="text-sm font-medium text-slate-700">
                  {formData.products[0]?.printingSelection || "Not Selected"}
                </span>
                <span className="text-xs text-slate-500 ml-2">
                  (Change in Basic Information above)
                </span>
              </div>
            </div>

            {/* Digital Costing Results - Show only cheapest option */}
            {formData.products[0]?.printingSelection === "Digital" && digitalCostingResults.length > 0 ? (
              <div className="space-y-3">
                <Label className="text-sm font-medium text-slate-700">
                  Digital Cut-Size Options
                </Label>
                <div className="space-y-2">
                  {/* Show only the cheapest option for Digital printing */}
                  {(() => {
                    const cheapest = digitalCostingResults.reduce((min, current) => 
                      current.total < min.total ? current : min
                    );
                    return (
                      <div className="p-3 rounded-lg border border-[#27aae1] bg-[#27aae1]/5">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-medium text-slate-800">{cheapest.option}</span>
                            <div className="text-xs text-slate-600 mt-1">
                              {cheapest.upsPerSheet} ups per sheet • {cheapest.parents} parent sheets
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-slate-800">AED {cheapest.total.toFixed(2)}</div>
                            <div className="text-xs text-slate-600">
                              Paper: AED {cheapest.paper.toFixed(2)} • Clicks: AED {cheapest.clicks.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            ) : formData.products[0]?.printingSelection === "Digital" ? (
              <div className="text-center py-4">
                <div className="text-sm text-slate-600">Calculating digital pricing options...</div>
              </div>
            ) : null}

            {/* Offset Costing Results */}
            {formData.products[0]?.printingSelection === "Offset" && offsetCostingResult && (
              <div className="space-y-3">
                <Label className="text-sm font-medium text-slate-700">
                  Offset Press Options
                </Label>
                <div className="space-y-2">
                  {/* 35x50 Press */}
                  <div
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedOffsetPress === '35×50 cm'
                        ? 'border-[#27aae1] bg-[#27aae1]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => offsetCostingResult.pressPerParent > 0 && setSelectedOffsetPress('35×50 cm')}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-medium text-slate-800">35×50 cm Press</span>
                        <div className="text-xs text-slate-600 mt-1">
                          {offsetCostingResult.upsPerPress} ups per press • {offsetCostingResult.pressSheets} press sheets • {offsetCostingResult.parents} parent sheets
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-slate-800">AED {offsetCostingResult.total.toFixed(2)}</div>
                        <div className="text-xs text-slate-600">
                          Paper: AED {offsetCostingResult.paper.toFixed(2)} • Plates: AED {offsetCostingResult.plates.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 52x72 Press (Disabled) */}
                  <div className="p-3 rounded-lg border border-gray-200 bg-gray-50 opacity-60">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-medium text-slate-600">52×72 cm Press</span>
                        <div className="text-xs text-slate-500 mt-1">
                          Not cuttable from 100×70 parent
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-slate-400">Disabled</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {loadingPricing && (
              <div className="text-center py-4">
                <div className="text-sm text-slate-600">Loading pricing data...</div>
              </div>
            )}

            {/* No Printing Method Selected */}
            {!formData.products[0]?.printingSelection && !loadingPricing && (
              <div className="text-center py-4">
                <div className="text-sm text-slate-600">Please select a printing method in Basic Information to see costing analysis.</div>
              </div>
            )}

            {/* Error State */}
            {!loadingPricing && (!digitalPricing || !offsetPricing) && (
              <div className="text-center py-4">
                <div className="text-sm text-red-600">Unable to load pricing data. Using default values.</div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Finishing Details Popup Modal */}
      <Dialog open={showFinishingDetails} onOpenChange={setShowFinishingDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle className="text-xl text-slate-800 flex items-center">
              <Settings className="w-5 h-5 mr-2 text-[#27aae1]" />
              Finishing Costs Breakdown
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {(() => {
              // Collect all unique finishing types across all products
              const allFinishingTypes = new Set<string>();
              formData.products.forEach((product) => {
                if (product.finishing && product.finishing.length > 0) {
                  product.finishing.forEach(finishingName => {
                    allFinishingTypes.add(finishingName);
                  });
                }
              });

              return Array.from(allFinishingTypes).map((finishingName) => {
                const baseFinishingName = finishingName.split('-')[0];
                // Find the first product that has this finishing type for calculation
                const productWithFinishing = formData.products.find(product => 
                  product.finishing && product.finishing.includes(finishingName)
                );
                const productIndex = productWithFinishing ? formData.products.indexOf(productWithFinishing) : 0;
                const calculatedCost = calculateIndividualFinishingCost(finishingName, productWithFinishing, productIndex);
                
                return (
                  <div key={finishingName} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-3">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <span className="text-sm font-medium text-slate-700">{baseFinishingName}</span>
                        {finishingName.includes('-') && (
                          <span className="text-xs bg-[#27aae1]/20 text-[#27aae1] px-2 py-1 rounded w-fit">
                            {finishingName.split('-')[1]}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-[#27aae1]">{fmt(calculatedCost)}</span>
                        <span className="text-xs text-slate-500">total cost</span>
                      </div>
                    </div>
                    
                    {/* Cost breakdown based on finishing type */}
                    <div className="text-xs text-slate-600 space-y-1">
                      {(() => {
                        const actualSheetsNeeded = formData.operational.papers[productIndex]?.enteredSheets ?? 
                                                 perPaperCalc[productIndex]?.[0]?.recommendedSheets ?? 0;
                        // Use impressions field if available, otherwise fall back to product quantity
                        const totalQuantity = formData.operational.impressions || productWithFinishing?.quantity || 0;
                        
                        switch (baseFinishingName) {
                          case 'Lamination':
                            const sideInfoLam = finishingName.includes('-') ? finishingName.split('-')[1] : 'Front';
                            const isBothSidesLam = sideInfoLam === 'Both';
                            return (
                              <div>
                                <div>Formula: 75 AED minimum + (0.75 AED × {actualSheetsNeeded} sheets){isBothSidesLam ? ' × 2 for both sides' : ''}</div>
                                <div>Calculation: 75 + ({actualSheetsNeeded} × 0.75){isBothSidesLam ? ' × 2' : ''} = {fmt(calculatedCost)}</div>
                              </div>
                            );
                          case 'Velvet Lamination':
                            const sideInfoVL = finishingName.includes('-') ? finishingName.split('-')[1] : 'Front';
                            const isBothSidesVL = sideInfoVL === 'Both';
                            return (
                              <div>
                                <div>Formula: 100 AED minimum + (1 AED × {actualSheetsNeeded} sheets){isBothSidesVL ? ' × 2 for both sides' : ''}</div>
                                <div>Calculation: 100 + ({actualSheetsNeeded} × 1){isBothSidesVL ? ' × 2' : ''} = {fmt(calculatedCost)}</div>
                              </div>
                            );
                          case 'Embossing':
                             const embossingImpressions = Math.max(1000, totalQuantity);
                             const embossingThousands = Math.ceil(embossingImpressions / 1000);
                             const sideInfoEmb = finishingName.includes('-') ? finishingName.split('-')[1] : 'Front';
                             const isBothSidesEmb = sideInfoEmb === 'Both';
                             return (
                               <div>
                                 <div>Formula: 50 AED per 1000 impressions (minimum 75 AED){isBothSidesEmb ? ' × 2 for both sides' : ''}</div>
                                 <div>Calculation: {embossingThousands} × 1000 impressions × 50 AED{isBothSidesEmb ? ' × 2' : ''} = {fmt(calculatedCost)}</div>
                               </div>
                             );
                           case 'Foiling':
                             const foilingImpressions = Math.max(1000, totalQuantity);
                             const foilingThousands = Math.ceil(foilingImpressions / 1000);
                             const sideInfoFoil = finishingName.includes('-') ? finishingName.split('-')[1] : 'Front';
                             const isBothSidesFoil = sideInfoFoil === 'Both';
                             return (
                               <div>
                                 <div>Formula: 75 AED per 1000 impressions (minimum 75 AED){isBothSidesFoil ? ' × 2 for both sides' : ''}</div>
                                 <div>Calculation: {foilingThousands} × 1000 impressions × 75 AED{isBothSidesFoil ? ' × 2' : ''} = {fmt(calculatedCost)}</div>
                               </div>
                             );
                           case 'Die Cutting':
                             const dieCuttingImpressions = Math.max(1000, totalQuantity);
                             const dieCuttingThousands = Math.ceil(dieCuttingImpressions / 1000);
                             const minCharge = (() => {
                               if (productWithFinishing?.flatSize && productWithFinishing.flatSize.width && productWithFinishing.flatSize.height) {
                                 const area = productWithFinishing.flatSize.width * productWithFinishing.flatSize.height;
                                 if (area <= 210 * 148) return 75; // A5
                                 if (area <= 297 * 210) return 100; // A4
                                 if (area <= 420 * 297) return 150; // A3
                                 return 200; // A2+
                               }
                               return 75; // Default
                             })();
                             return (
                               <div>
                                 <div>Formula: 50 AED per 1000 impressions (minimum {minCharge} AED by size)</div>
                                 <div>Calculation: {dieCuttingThousands} × 1000 impressions × 50 AED = {fmt(calculatedCost)}</div>
                               </div>
                             );
                           case 'UV Spot':
                             const uvSpotImpressions = Math.max(1000, totalQuantity);
                             const uvSpotThousands = Math.ceil(uvSpotImpressions / 1000);
                             const sideInfoUV = finishingName.includes('-') ? finishingName.split('-')[1] : 'Front';
                             const isBothSidesUV = sideInfoUV === 'Both';
                             return (
                               <div>
                                 <div>Formula: 350 AED per 1000 impressions (minimum 350 AED){isBothSidesUV ? ' × 2 for both sides' : ''}</div>
                                 <div>Calculation: {uvSpotThousands} × 1000 impressions × 350 AED{isBothSidesUV ? ' × 2' : ''} = {fmt(calculatedCost)}</div>
                               </div>
                             );
                           case 'Folding':
                             const foldingImpressions = Math.max(1000, totalQuantity);
                             const foldingThousands = Math.ceil(foldingImpressions / 1000);
                             return (
                               <div>
                                 <div>Formula: 25 AED per 1000 impressions (minimum 25 AED)</div>
                                 <div>Calculation: {foldingThousands} × 1000 impressions × 25 AED = {fmt(calculatedCost)}</div>
                               </div>
                             );
                          default:
                            return <div>Auto-calculated based on finishing type and quantity</div>;
                        }
                      })()}
                    </div>
                  </div>
                );
              });
            })()}
            
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between items-center bg-green-50 p-4 rounded-lg border border-green-200">
                <span className="font-semibold text-slate-800">Total Finishing Cost:</span>
                <span className="text-xl font-bold text-green-600">
                  {fmt(calculateFinishingCosts())}
                </span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowFinishingDetails(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Step4Operational;