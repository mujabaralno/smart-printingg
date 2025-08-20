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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Calculator, Settings, BarChart3, Edit3, AlertTriangle, Database, Palette, Info } from "lucide-react";
import type { QuoteFormData } from "@/types";

interface Step4Props {
  formData: QuoteFormData;
  setFormData: Dispatch<SetStateAction<QuoteFormData>>;
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

/** Enhanced layout calculation exactly matching HTML logic */
function computeLayout(
  inputWidth: number | null,  // Sheet width (horizontal)
  inputHeight: number | null, // Sheet height (vertical) 
  outputWidth: number | null, // Item width
  outputHeight: number | null // Item height
) {
  if (!inputWidth || !inputHeight || !outputWidth || !outputHeight) {
    return {
      usableW: 0,
      usableH: 0,
      itemsPerSheet: 0,
      efficiency: 0,
      orientation: 'normal' as 'normal' | 'rotated',
      itemsPerRow: 0,
      itemsPerCol: 0
    };
  }

  // Use exact HTML calculation - treating inputHeight as length, inputWidth as width
  const result = calculateMaxItemsPerSheet(inputHeight, inputWidth, outputHeight, outputWidth);
  
  // Calculate actual items per row and column based on orientation
  let itemsPerRow: number;
  let itemsPerCol: number;
  
  if (result.orientation === 'normal') {
    itemsPerRow = Math.floor(inputWidth / outputWidth);
    itemsPerCol = Math.floor(inputHeight / outputHeight);
  } else {
    // Rotated: item dimensions are swapped
    itemsPerRow = Math.floor(inputWidth / outputHeight);
    itemsPerCol = Math.floor(inputHeight / outputWidth);
  }

  const efficiency = (result.count * outputWidth * outputHeight * 100) / (inputWidth * inputHeight);

  return {
    usableW: inputWidth,
    usableH: inputHeight,
    itemsPerSheet: result.count,
    efficiency: Math.min(100, efficiency),
    orientation: result.orientation,
    itemsPerRow,
    itemsPerCol
  };
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
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';

  // Enable ultra-high-quality rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Clear with premium background gradient
  const bgGradient = ctx.createLinearGradient(0, 0, rect.width, rect.height);
  bgGradient.addColorStop(0, '#f8fafc');
  bgGradient.addColorStop(1, '#f1f5f9');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, rect.width, rect.height);

  // Calculate scaling to fit ONE sheet with maximum size and proper centering
  const padding = 30; // Increased padding for single sheet display
  const canvasUsableWidth = rect.width - 2 * padding;
  const canvasUsableHeight = rect.height - 2 * padding;
  
  // Calculate scaling to fit ONE sheet with maximum size and proper centering
  const scaleX = canvasUsableWidth / inputWidth;
  const scaleY = canvasUsableHeight / inputHeight;
  const scale = Math.min(scaleX, scaleY) * 0.9; // 90% of max size for better visual balance
  
  const scaledSheetWidth = inputWidth * scale;
  const scaledSheetHeight = inputHeight * scale;
  
  // Center the single sheet in the canvas
  const startX = (rect.width - scaledSheetWidth) / 2;
  const startY = (rect.height - scaledSheetHeight) / 2;

  // Draw professional background grid
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
      rect.width - infoMetrics.width - 15,
      35,
      infoMetrics.width + 10,
      18
    );
    
    ctx.fillStyle = 'rgba(59, 130, 246, 0.9)';
    ctx.fillText(infoText, rect.width - 10, 37);
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

const Step4Operational: FC<Step4Props> = ({ formData, setFormData }) => {

  
  // ===== Output size state management =====
  const [outputDimensions, setOutputDimensions] = React.useState<{
    [productIndex: number]: { width: number; height: number }
  }>(() => {
    const initial: { [productIndex: number]: { width: number; height: number } } = {};
    formData.products.forEach((product, index) => {
      initial[index] = {
        width: product?.closeSize?.width ?? product?.flatSize?.width ?? 0,
        height: product?.closeSize?.height ?? product?.flatSize?.height ?? 0
      };
    });
    return initial;
  });

  // ===== Color options state =====
  const [selectedColors, setSelectedColors] = React.useState<{
    [productIndex: number]: {
      [paperIndex: number]: string[]
    }
  }>(() => {
    const initial: { [productIndex: number]: { [paperIndex: number]: string[] } } = {};
    formData.products.forEach((product, productIndex) => {
      initial[productIndex] = {};
      product.papers.forEach((paper, paperIndex) => {
        initial[productIndex][paperIndex] = [];
      });
    });
    return initial;
  });



  // ===== Helper function to parse color count from Step 3 =====
  const getMaxColorsForProduct = (product: any) => {
    const frontColors = product.colors?.front || "";
    const backColors = product.colors?.back || "";
    
    // Parse color strings to get maximum number of colors
    const parseColorCount = (colorStr: string) => {
      if (colorStr.includes("1 Color")) return 1;
      if (colorStr.includes("2 Colors")) return 2;
      if (colorStr.includes("3 Colors")) return 3;
      if (colorStr.includes("4 Colors (CMYK)")) return 4;
      if (colorStr.includes("4+1 Colors")) return 5;
      if (colorStr.includes("4+2 Colors")) return 6;
      return 0;
    };
    
    const frontCount = parseColorCount(frontColors);
    const backCount = parseColorCount(backColors);
    
    // Return the maximum count between front and back
    return Math.max(frontCount, backCount);
  };

  // ===== Track user edits to enteredSheets =====
  const [userEditedSheets, setUserEditedSheets] = React.useState<Set<string>>(new Set());

  // ===== Supplier database modal =====
  const [showSupplierDB, setShowSupplierDB] = React.useState(false);

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
        const layout = computeLayout(
          opPaper?.inputWidth ?? null,
          opPaper?.inputHeight ?? null,
          productDimensions.width,
          productDimensions.height
        );

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
    formData.operational.papers,
    outputDimensions,
    formData.products,
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
          
          // Force enteredSheets to match recommended value unless user has edited it
          if (hasUserEdited) {
            return { ...p, recommendedSheets: rec };
          } else {
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

  // ===== Sync selected colors when form data changes =====
  React.useEffect(() => {
    // Only reset colors when the actual color configuration changes, not on every render
    setSelectedColors(prev => {
      const newState = { ...prev };
      formData.products.forEach((product, productIndex) => {
        if (!newState[productIndex]) {
          newState[productIndex] = {};
        }
        product.papers.forEach((paper, paperIndex) => {
          if (!newState[productIndex][paperIndex]) {
            newState[productIndex][paperIndex] = [];
          }
          
          // Only clear colors if the color configuration actually changed
          const maxColors = getMaxColorsForProduct(product);
          const currentColors = newState[productIndex][paperIndex];
          
          // If we have a limit and exceed it, trim to the limit
          if (maxColors > 0 && currentColors.length > maxColors) {
            newState[productIndex][paperIndex] = currentColors.slice(0, maxColors);
          }
        });
      });
      return newState;
    });
  }, [formData.products.map(p => `${p.colors?.front}-${p.colors?.back}`).join('|')]);

  // ===== Plates & Units =====
  const { plates, units } = React.useMemo(() => {
    // Calculate total plates and units across all products
    let totalPlates = 0;
    let totalUnits = 0;

    formData.products.forEach((product, productIndex) => {
      const sides = product?.sides ?? "1";
      const printing = product?.printingSelection ?? "Digital";

      const p = printing === "Digital" ? 0 : (sides === "2" ? 2 : 1) * 4;
      totalPlates += p;

      // For units, we need to calculate based on the product's papers
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

      totalUnits += totalSheets * (sides === "2" ? 2 : 1);
    });

    return { plates: totalPlates, units: totalUnits };
  }, [
    formData.operational.papers,
    perPaperCalc,
    formData.products,
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
            newOpPaper.recommendedSheets = recommendedSheets;
            if (!existingOpPaper || !userEditedSheets.has(`paper-${globalPaperIndex}`)) {
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

  // ===== Sync selectedColors with product structure =====
  React.useEffect(() => {
    setSelectedColors(prev => {
      const newState = { ...prev };
      let hasChanges = false;
      
      formData.products.forEach((product, productIndex) => {
        if (!newState[productIndex]) {
          newState[productIndex] = {};
          hasChanges = true;
        }
        
        product.papers.forEach((paper, paperIndex) => {
          if (!newState[productIndex][paperIndex]) {
            newState[productIndex][paperIndex] = [];
            hasChanges = true;
          }
        });
        
        // Remove papers that no longer exist
        const currentPaperIndices = Object.keys(newState[productIndex]).map(Number);
        const validPaperIndices = product.papers.map((_, index) => index);
        currentPaperIndices.forEach(paperIndex => {
          if (!validPaperIndices.includes(paperIndex)) {
            delete newState[productIndex][paperIndex];
            hasChanges = true;
          }
        });
      });
      
      // Remove products that no longer exist
      const currentProductIndices = Object.keys(newState).map(Number);
      const validProductIndices = formData.products.map((_, index) => index);
      currentProductIndices.forEach(productIndex => {
        if (!validProductIndices.includes(productIndex)) {
          delete newState[productIndex];
          hasChanges = true;
        }
      });
      
      return hasChanges ? newState : prev;
    });
  }, [formData.products]);

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
    
    const newPapers = [...formData.operational.papers];
    newPapers[index] = { ...newPapers[index], [field]: v };
    setFormData((prev) => ({
      ...prev,
      operational: { ...prev.operational, papers: newPapers },
    }));
  };

  const handleFinishingCostChange = (name: string, value: string) => {
    // REVISION 2: Allow editing finishing costs for each selection from previous step
    const cost = value === "" ? null : parseFloat(value);
    setFormData((prev) => ({
      ...prev,
      operational: {
        ...prev.operational,
        finishing: prev.operational.finishing.map((f) =>
          f.name === name ? { ...f, cost } : f
        ),
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

  // ===== Enhanced color toggle with validation =====
  const handleColorToggle = (productIndex: number, paperIndex: number, color: string) => {
    const product = formData.products[productIndex];
    const maxColors = getMaxColorsForProduct(product);
    
    // Create a completely new state object
    const newSelectedColors = { ...selectedColors };
    
    // Ensure the structure exists
    if (!newSelectedColors[productIndex]) {
      newSelectedColors[productIndex] = {};
    }
    if (!newSelectedColors[productIndex][paperIndex]) {
      newSelectedColors[productIndex][paperIndex] = [];
    }
    
    const currentColorsArray = newSelectedColors[productIndex][paperIndex];
    
    if (currentColorsArray.includes(color)) {
      // Remove color if already selected
      newSelectedColors[productIndex][paperIndex] = currentColorsArray.filter(c => c !== color);
    } else {
      // Add color if we have no limit or haven't reached it
      if (maxColors === 0 || currentColorsArray.length < maxColors) {
        newSelectedColors[productIndex][paperIndex] = [...currentColorsArray, color];
      }
    }
    
    // Update the state
    setSelectedColors(newSelectedColors);
  };

  // ===== Sync selected colors with form data =====
  const syncColorsWithFormData = () => {
    // This function can be called when moving to the next step
    // to ensure the selected colors are properly saved
    console.log('Selected colors:', selectedColors);
    // You can add logic here to save the colors to the form data if needed
  };



  // ===== Modal state =====
  const [openIdx, setOpenIdx] = React.useState<number | null>(null);
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

  // ===== Currency formatter =====
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(n);

  // ===== Available colors with unique short names =====
  const availableColors = [
    { name: "CMYK Process", shortName: "CMYK", value: "cmyk", color: "bg-gradient-to-r from-cyan-500 via-magenta-500 via-yellow-500 to-black" },
    { name: "Black & White", shortName: "B&W", value: "black", color: "bg-black" },
    { name: "Pantone Red 186", shortName: "Red 186", value: "red", color: "bg-red-600" },
    { name: "Pantone Blue 286", shortName: "Blue 286", value: "blue", color: "bg-blue-600" },
    { name: "Pantone Green 348", shortName: "Green 348", value: "green", color: "bg-green-600" },
    { name: "Pantone Orange 165", shortName: "Orange 165", value: "orange", color: "bg-orange-500" },
    { name: "Pantone Purple 2685", shortName: "Purple", value: "purple", color: "bg-purple-600" },
    { name: "Pantone Pink 213", shortName: "Pink 213", value: "pink", color: "bg-pink-500" },
    { name: "Pantone Yellow 116", shortName: "Yellow", value: "yellow", color: "bg-yellow-400" },
    { name: "Pantone Brown 476", shortName: "Brown", value: "brown", color: "bg-amber-700" },
    { name: "Pantone Navy 539", shortName: "Navy", value: "navy", color: "bg-blue-900" },
    { name: "Pantone Teal 3278", shortName: "Teal", value: "teal", color: "bg-teal-600" },
    { name: "Pantone Magenta 247", shortName: "Magenta", value: "magenta", color: "bg-fuchsia-600" },
    { name: "Pantone Cyan 306", shortName: "Cyan", value: "cyan", color: "bg-cyan-500" },
    { name: "Pantone Black 426", shortName: "Black 426", value: "black426", color: "bg-gray-800" },
    { name: "Pantone Warm Gray 9", shortName: "Gray 9", value: "gray9", color: "bg-gray-600" },
    { name: "Pantone Cool Gray 7", shortName: "Gray 7", value: "gray7", color: "bg-slate-500" },
    { name: "Pantone Burgundy 505", shortName: "Burgundy", value: "burgundy", color: "bg-red-800" },
    { name: "Pantone Forest 3425", shortName: "Forest", value: "forest", color: "bg-green-800" },
    { name: "Pantone Coral 16-1546", shortName: "Coral", value: "coral", color: "bg-orange-400" },
    { name: "Metallic Gold", shortName: "Gold", value: "gold", color: "bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-700 shadow-lg" },
    { name: "Metallic Silver", shortName: "Silver", value: "silver", color: "bg-gradient-to-br from-gray-200 via-gray-400 to-gray-600 shadow-lg" },
    { name: "Metallic Copper", shortName: "Copper", value: "copper", color: "bg-gradient-to-br from-orange-300 via-orange-500 to-red-700 shadow-lg" },
    { name: "Metallic Bronze", shortName: "Bronze", value: "bronze", color: "bg-gradient-to-br from-yellow-600 via-orange-600 to-red-800 shadow-lg" },
    { name: "Metallic Platinum", shortName: "Platinum", value: "platinum", color: "bg-gradient-to-br from-gray-100 via-gray-300 to-gray-500 shadow-lg" },
    { name: "Fluorescent Pink", shortName: "Fluor Pink", value: "fluor-pink", color: "bg-gradient-to-r from-pink-400 to-pink-600 shadow-pink-300 shadow-lg" },
    { name: "Fluorescent Green", shortName: "Fluor Green", value: "fluor-green", color: "bg-gradient-to-r from-green-400 to-green-500 shadow-green-300 shadow-lg" },
    { name: "Fluorescent Orange", shortName: "Fluor Orange", value: "fluor-orange", color: "bg-gradient-to-r from-orange-400 to-orange-500 shadow-orange-300 shadow-lg" },
    { name: "Fluorescent Yellow", shortName: "Fluor Yellow", value: "fluor-yellow", color: "bg-gradient-to-r from-yellow-300 to-yellow-400 shadow-yellow-300 shadow-lg" },
    { name: "Fluorescent Blue", shortName: "Fluor Blue", value: "fluor-blue", color: "bg-gradient-to-r from-blue-400 to-blue-500 shadow-blue-300 shadow-lg" },
    { name: "White Ink", shortName: "White", value: "white", color: "bg-white border-2 border-gray-400 shadow-inner" },
    { name: "Spot Varnish", shortName: "Varnish", value: "varnish", color: "bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300" },
    { name: "UV Coating", shortName: "UV", value: "uv", color: "bg-gradient-to-br from-blue-50 to-blue-200 border border-blue-300" },
    { name: "Matte Coating", shortName: "Matte", value: "matte", color: "bg-gradient-to-br from-gray-50 to-gray-150 border border-gray-200" },
    { name: "Satin Finish", shortName: "Satin", value: "satin", color: "bg-gradient-to-br from-blue-25 to-blue-100 border border-blue-200" },
    { name: "Gloss Coating", shortName: "Gloss", value: "gloss", color: "bg-gradient-to-br from-white to-blue-50 border border-blue-100 shadow-sm" },
    { name: "Soft Touch", shortName: "Soft Touch", value: "soft-touch", color: "bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200" },
    { name: "Textured Finish", shortName: "Textured", value: "textured", color: "bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200" },
    { name: "Holographic", shortName: "Holo", value: "holographic", color: "bg-gradient-to-r from-pink-200 via-blue-200 via-green-200 to-yellow-200 animate-pulse" },
    { name: "Pearlescent", shortName: "Pearl", value: "pearl", color: "bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 shadow-lg" },
  ];

  // ===== Render =====
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <h3 className="text-2xl font-bold text-slate-900">Operational Details</h3>
        <p className="text-slate-600">Configure paper specifications, costs, and production details</p>
      </div>

      {formData.products.map((product, productIndex) => (
        <div key={productIndex} className="space-y-8">
          {/* Product Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
            <h4 className="text-xl font-bold text-blue-800 flex items-center">
              <Package className="w-6 h-6 mr-3" />
              Product {productIndex + 1}: {product.productName || `Product ${productIndex + 1}`}
            </h4>
            <div className="mt-2 text-blue-700">
              Quantity: {product.quantity || 0} | Sides: {product.sides} | Printing: {product.printingSelection}
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
              <div key={`${productIndex}-${paperIndex}`} className="space-y-6">
                {/* Paper Header */}
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-slate-800 flex items-center">
                    <Package className="w-5 h-5 mr-2 text-blue-600" />
                    <span className="text-blue-600">
                      {paper.name ? `${paper.name}${paper.gsm ? ` ${paper.gsm}gsm` : ""}` : `Paper ${paperIndex + 1}${paper.gsm ? ` ${paper.gsm}gsm` : ""}`}
                    </span>
                  </h4>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSupplierDB(true)}
                      className="border-green-500 text-green-600 hover:bg-green-50 rounded-xl"
                    >
                      <Database className="w-4 h-4 mr-2" />
                      Supplier Database
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOpenIdx(globalPaperIndex)}
                      className="border-blue-500 text-blue-600 hover:bg-blue-500 rounded-xl"
                    >
                      <Calculator className="w-4 h-4 mr-2" />
                      View Cost Details
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

            {/* Three Cards Layout */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* CARD 1: Paper Specifications */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-slate-800 flex items-center">
                    <Package className="w-5 h-5 mr-2 text-blue-600" />
                    Paper Specifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Paper Size Section */}
                  <div className="space-y-4">
                    <h5 className="text-md font-semibold text-slate-700">Input Sheet Size</h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="mb-2 block text-sm font-medium text-slate-700">Width (cm)</Label>
                        <Input
                          type="number"
                          placeholder="Width"
                          min={0}
                          step="0.1"
                          value={opPaper?.inputWidth ?? ""}
                          className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                          onChange={(e) =>
                            handlePaperOpChange(globalPaperIndex, "inputWidth", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label className="mb-2 block text-sm font-medium text-slate-700">Height (cm)</Label>
                        <Input
                          type="number"
                          placeholder="Height"
                          value={opPaper?.inputHeight ?? ""}
                          className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                          min={0}
                          step="0.1"
                          onChange={(e) =>
                            handlePaperOpChange(globalPaperIndex, "inputHeight", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Output Size Section - Now Editable */}
                  <div className="space-y-4">
                    <h5 className="text-md font-semibold text-slate-700 flex items-center">
                      <Edit3 className="w-4 h-4 mr-2 text-blue-600" />
                      Output Item Size
                    </h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="mb-2 block text-sm font-medium text-slate-700">Output Width (cm)</Label>
                        <Input
                          type="number"
                          placeholder="Width"
                          min={0}
                          step="0.1"
                          className={`border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl ${
                            dimensionError ? 'border-red-300 bg-red-50' : ''
                          }`}
                          value={outputDimensions[productIndex]?.width || ""}
                          onChange={(e) => handleOutputDimensionChange(productIndex, 'width', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="mb-2 block text-sm font-medium text-slate-700">Output Height (cm)</Label>
                        <Input
                          type="number"
                          placeholder="Height"
                          min={0}
                          step="0.1"
                          className={`border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl ${
                            dimensionError ? 'border-red-300 bg-red-50' : ''
                          }`}
                          value={outputDimensions[productIndex]?.height || ""}
                          onChange={(e) => handleOutputDimensionChange(productIndex, 'height', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sheet Management Section */}
                  <div className="space-y-4">
                    <h5 className="text-md font-semibold text-slate-700">Sheet Management</h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="mb-2 block text-sm font-medium text-slate-700">Recommended Sheets</Label>
                        <Input
                          value={recommendedSheets || ""}
                          readOnly
                          className="bg-slate-100 border-slate-300 rounded-xl"
                        />
                      </div>
                      <div>
                        <Label className="mb-2 block text-sm font-medium text-slate-700">
                          Enter Sheets
                          {!opPaper?.enteredSheets && (
                            <span className="ml-2 text-xs text-blue-600 font-normal">
                              (Default: {recommendedSheets})
                            </span>
                          )}
                        </Label>
                        <Input
                          type="number"
                          min={recommendedSheets || 0}
                          placeholder={recommendedSheets ? String(recommendedSheets) : "e.g. 125"}
                          className={`border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl ${
                            !opPaper?.enteredSheets ? 'bg-blue-50 border-blue-200' : ''
                          }`}
                          value={opPaper?.enteredSheets ?? recommendedSheets ?? ""}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            if (value >= (recommendedSheets || 0)) {
                              handlePaperOpChange(globalPaperIndex, "enteredSheets", e.target.value);
                            }
                          }}
                        />
                        {opPaper?.enteredSheets && opPaper.enteredSheets < recommendedSheets && (
                          <div className="text-red-600 text-xs mt-1">
                            Cannot be less than recommended sheets ({recommendedSheets})
                          </div>
                        )}
                        {/* Enhanced auto-selection info */}
                        {!opPaper?.enteredSheets ? (
                          <div className="text-blue-600 text-xs mt-1">
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
                              className="text-xs text-blue-600 hover:text-blue-800 underline"
                            >
                              Reset to recommended
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CARD 2: Pricing */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-slate-800 flex items-center">
                    <Calculator className="w-5 h-5 mr-2 text-blue-600" />
                    Pricing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Pricing Section */}
                  <div className="space-y-4">
                    <h5 className="text-md font-semibold text-slate-700">Cost Details</h5>
                    <div className="space-y-4">
                      <div>
                        <Label className="mb-2 block text-sm font-medium text-slate-700">Price per Sheet (Direct)</Label>
                        <Input
                          type="number"
                          placeholder="$ 0.00"
                          step="0.0001"
                          className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                          value={opPaper?.pricePerSheet ?? ""}
                          onChange={(e) =>
                            handlePaperOpChange(globalPaperIndex, "pricePerSheet", e.target.value)
                          }
                        />
                        <div className="text-xs text-slate-500 mt-1">
                          Leave empty to calculate from packet pricing below
                        </div>
                      </div>
                      <div className="border-t pt-4">
                        <h6 className="text-sm font-medium text-slate-600 mb-3">OR Calculate from Packet Pricing:</h6>
                        <div className="space-y-3">
                          <div>
                            <Label className="mb-2 block text-sm font-medium text-slate-700">Sheets per Packet</Label>
                            <Input
                              type="number"
                              placeholder="e.g. 500"
                              className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
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
                          <div>
                            <Label className="mb-2 block text-sm font-medium text-slate-700">Price per Packet</Label>
                            <Input
                              type="number"
                              className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                              placeholder="$ 0.00"
                              value={opPaper?.pricePerPacket ?? ""}
                              onChange={(e) =>
                                handlePaperOpChange(globalPaperIndex, "pricePerPacket", e.target.value)
                              }
                            />
                          </div>
                          <div>
                            <Label className="mb-2 block text-sm font-medium text-slate-700">Calculated Price per Sheet</Label>
                            <Input
                              readOnly
                              className="bg-slate-100 border-slate-300 rounded-xl"
                              value={
                                (() => {
                                  // If direct price per sheet is set, show that
                                  if (opPaper?.pricePerSheet != null) {
                                    return opPaper.pricePerSheet.toFixed(4);
                                  }
                                  
                                  // If packet pricing is available, calculate from that
                                  if (opPaper?.pricePerPacket != null && 
                                      opPaper?.sheetsPerPacket != null && 
                                      opPaper.sheetsPerPacket > 0) {
                                    return (opPaper.pricePerPacket / opPaper.sheetsPerPacket).toFixed(4);
                                  }
                                  
                                  // Show that calculation is not possible yet
                                  return "Enter pricing details above";
                                })()
                              }
                            />
                            <div className="text-xs text-slate-500 mt-1">
                              {opPaper?.pricePerSheet != null 
                                ? "Using direct price per sheet"
                                : opPaper?.pricePerPacket != null && opPaper?.sheetsPerPacket != null
                                ? "Calculated from packet pricing"
                                : "Set either direct price or packet pricing above"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CARD 3: Additional Costs */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-slate-800 flex items-center">
                    <Calculator className="w-5 h-5 mr-2 text-blue-600" />
                    Additional Costs
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Production Costs Section */}
                  <div className="space-y-4">
                    <h5 className="text-md font-semibold text-slate-700">Production Costs</h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="mb-2 block text-sm font-medium text-slate-700">No. of plates</Label>
                        <Input 
                          readOnly 
                          className="bg-slate-100 border-slate-300 rounded-xl" 
                          value={plates} 
                        />
                      </div>
                      <div>
                        <Label className="mb-2 block text-sm font-medium text-slate-700">No. of units</Label>
                        <Input 
                          readOnly 
                          className="bg-slate-100 border-slate-300 rounded-xl" 
                          value={units} 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Finishing Costs Section - From Previous Step */}
                  {product.finishing.length > 0 && (
                    <div className="space-y-4">
                      <h5 className="text-md font-semibold text-slate-700 flex items-center">
                        <Settings className="w-4 h-4 mr-2 text-blue-600" />
                        Finishing Costs 
                        <span className="ml-2 text-xs text-slate-500">(Editable)</span>
                      </h5>
                      <div className="space-y-4">
                        {formData.operational.finishing
                          .filter((f) => product.finishing.includes(f.name))
                          .map((item) => (
                            <div key={item.name} className="bg-slate-50 rounded-lg p-3">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-slate-700">{item.name}</span>
                                <div className="flex items-center space-x-2">
                                  <Input
                                    type="number"
                                    placeholder="Cost per unit"
                                    step="0.01"
                                    min="0"
                                    className="w-24 h-8 text-sm border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                                    value={item.cost ?? ""}
                                    onChange={(e) => handleFinishingCostChange(item.name, e.target.value)}
                                  />
                                  <span className="text-xs text-slate-500">per unit</span>
                                </div>
                              </div>
                              <div className="text-xs text-slate-500">
                                Cost per unit: {item.cost != null ? fmt(item.cost) : "Not specified"}
                              </div>
                              <div className="text-xs text-slate-500">
                                Total for {actualSheetsNeeded} sheets: {item.cost != null ? fmt(item.cost * actualSheetsNeeded) : "—"}
                              </div>
                            </div>
                          ))}
                        <div className="border-t pt-3 mt-4">
                          <div className="flex justify-between items-center bg-green-50 p-3 rounded-lg">
                            <span className="font-semibold text-slate-800">Total Finishing Cost:</span>
                            <span className="text-lg font-bold text-green-600">
                              {fmt(
                                formData.operational.finishing
                                  .filter((f) => product.finishing.includes(f.name))
                                  .reduce((acc, f) => acc + ((f.cost ?? 0) * actualSheetsNeeded), 0)
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Compact Color Selection Section */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <h5 className="text-md font-semibold text-slate-700 flex items-center mb-3">
                <Palette className="w-4 h-4 mr-2 text-blue-600" />
                Color Options for {paper.name ? `${paper.name}${paper.gsm ? ` ${paper.gsm}gsm` : ""}` : `Paper ${paperIndex + 1}`}
                <span className="ml-2 text-xs text-slate-500 font-normal">
                  (Max: {getMaxColorsForProduct(formData.products[productIndex])} colors from Step 3)
                </span>
                <span className="ml-auto text-xs text-blue-600 font-mono">
                  {selectedColors[productIndex]?.[paperIndex]?.length || 0}/{getMaxColorsForProduct(formData.products[productIndex])} selected
                </span>
              </h5>
              {getMaxColorsForProduct(formData.products[productIndex]) === 0 && (
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Info className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-800">
                      No color limit set in Step 3. You can select unlimited colors here, or go back to Step 3 to set specific color limits.
                    </span>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-10 gap-2">
                {availableColors.map((color) => {
                  const maxColors = getMaxColorsForProduct(formData.products[productIndex]);
                  const currentCount = selectedColors[productIndex]?.[paperIndex]?.length || 0;
                  const isSelected = selectedColors[productIndex]?.[paperIndex]?.includes(color.value);
                  // Disable if we have a limit AND we've reached it AND this color is not selected
                  const isDisabled = maxColors > 0 && currentCount >= maxColors && !isSelected;
                  
                  return (
                    <div
                      key={color.value}
                      className={`p-2 rounded-lg border transition-all duration-300 text-center group relative overflow-hidden ${
                        isSelected
                          ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 ring-2 ring-blue-200 ring-offset-1 shadow-md cursor-pointer transform scale-105'
                          : isDisabled
                          ? 'border-slate-100 bg-slate-50 cursor-not-allowed opacity-40 grayscale'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm cursor-pointer active:scale-95 hover:scale-105'
                      }`}
                      onClick={() => {
                        if (!isDisabled) {
                          handleColorToggle(productIndex, paperIndex, color.value);
                        }
                      }}
                      title={isDisabled ? `${color.name} - Color limit reached` : color.name}
                    >
                      {/* Selection Checkmark */}
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center shadow-sm">
                          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      
                      {/* Color Swatch with Enhanced Styling */}
                      <div className={`w-full h-4 rounded mb-1 ${color.color} ${
                        !isDisabled ? 'group-hover:scale-105' : ''
                      } transition-all duration-300 ${
                        isSelected ? 'ring-2 ring-blue-300 ring-offset-1 shadow-inner' : ''
                      }`}></div>
                      
                      {/* Color Name with Enhanced Typography */}
                      <div className={`text-xs font-medium truncate transition-colors duration-300 ${
                        isSelected 
                          ? 'text-blue-700 font-semibold' 
                          : isDisabled 
                            ? 'text-slate-400' 
                            : 'text-slate-600 group-hover:text-slate-800'
                      }`}>
                        {color.shortName}
                      </div>
                    </div>
                  );
                })}
              </div>
              {(() => {
                const maxColors = getMaxColorsForProduct(formData.products[productIndex]);
                const currentCount = selectedColors[productIndex]?.[paperIndex]?.length || 0;
                const remainingColors = maxColors - currentCount;
                
                if (currentCount > 0) {
                  return (
                    <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-sm">
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-blue-800 mb-2">
                            Selected Colors ({currentCount})
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {selectedColors[productIndex]?.[paperIndex]?.map(c => {
                              const colorObj = availableColors.find(ac => ac.value === c);
                              return (
                                <div key={c} className="flex items-center space-x-1 px-2 py-1 bg-white rounded-full border border-blue-200 shadow-sm">
                                  <div className={`w-3 h-3 rounded-full ${colorObj?.color || 'bg-gray-400'}`}></div>
                                  <span className="text-xs font-medium text-blue-700">{colorObj?.shortName || c}</span>
                                </div>
                              );
                            })}
                          </div>
                          {maxColors > 0 && remainingColors > 0 && (
                            <div className="text-xs text-blue-600 mt-2">
                              {remainingColors} more color{remainingColors !== 1 ? 's' : ''} available
                            </div>
                          )}
                          {maxColors === 0 && (
                            <div className="text-xs text-blue-600 mt-2">
                              Unlimited selection enabled
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedColors(prev => ({
                              ...prev,
                              [productIndex]: {
                                ...prev[productIndex],
                                [paperIndex]: []
                              }
                            }));
                          }}
                          className="ml-4 px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200 border border-red-200 hover:border-red-300"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div className="mt-3 p-3 bg-gradient-to-r from-slate-50 to-gray-50 border border-slate-200 rounded-lg">
                      <div className="text-center">
                        <div className="w-8 h-8 mx-auto mb-2 bg-slate-200 rounded-full flex items-center justify-center">
                          <Palette className="w-4 h-4 text-slate-500" />
                        </div>
                        <div className="text-sm font-medium text-slate-600 mb-1">
                          No colors selected for this paper
                        </div>
                        {maxColors > 0 ? (
                          <div className="text-xs text-blue-600">
                            You can select up to {maxColors} color{maxColors !== 1 ? 's' : ''}
                          </div>
                        ) : (
                          <div className="text-xs text-blue-600">
                            You can select unlimited colors (no limit set in Step 3)
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
              })()}
            </div>

            {/* Summary Information Card - Above Visualization */}
            <Card className="border-0 shadow-lg w-full mx-0 mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-bold text-slate-800 flex items-center">
                  <Info className="w-6 h-6 mr-3 text-blue-600" />
                  Layout Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 w-full px-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Green Header Info */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="text-green-800 font-semibold text-sm leading-relaxed">
                      {(() => {
                        const layout = perPaperCalc[productIndex]?.[paperIndex]?.layout;
                        if (!layout) return 'Calculating...';
                        // Get the actual sheets from the operational paper data
                        const opPaper = formData.operational.papers[paperIndex];
                        const recommendedSheets = perPaperCalc[productIndex]?.[paperIndex]?.recommendedSheets || 0;
                        const enteredSheets = opPaper?.enteredSheets ?? null;
                        const actualSheets = enteredSheets || recommendedSheets;
                        const totalItems = layout.itemsPerSheet * actualSheets;
                        return `${layout.itemsPerSheet} items per sheet × ${actualSheets} sheets = ${totalItems} total items`;
                      })()}
                      {perPaperCalc[productIndex]?.[paperIndex]?.layout?.orientation === 'rotated' && ' (Rotated Layout)'}
                    </div>
                  </div>
                  
                  {/* Bottom Info */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="text-gray-800 font-semibold text-sm leading-relaxed">
                      {(() => {
                        const outputWidth = outputDimensions[productIndex]?.width || 0;
                        const outputHeight = outputDimensions[productIndex]?.height || 0;
                        const layout = perPaperCalc[productIndex]?.[paperIndex]?.layout;
                        const opPaper = formData.operational.papers[paperIndex];
                        const recommendedSheets = perPaperCalc[productIndex]?.[paperIndex]?.recommendedSheets || 0;
                        const enteredSheets = opPaper?.enteredSheets ?? null;
                        const actualSheetsNeeded = enteredSheets || recommendedSheets;
                        const sheetsPerRow = Math.ceil(Math.sqrt(actualSheetsNeeded));
                        const sheetsPerCol = Math.ceil(actualSheetsNeeded / sheetsPerRow);
                        
                        let info = `Item: ${outputWidth.toFixed(1)} × ${outputHeight.toFixed(1)} cm`;
                        if (actualSheetsNeeded > 1) {
                          info += ` • Sheets: ${actualSheetsNeeded} (${sheetsPerRow}×${sheetsPerCol} grid shown)`;
                        }
                        if (layout?.efficiency && layout.efficiency > 0) {
                          info += ` • Efficiency: ${layout.efficiency.toFixed(1)}%`;
                        }
                        return info;
                      })()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Sheet Optimization Preview - MAXIMUM SCALE */}
            <Card className="border-0 shadow-lg w-full mx-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-2xl font-bold text-slate-800 flex items-center">
                  <BarChart3 className="w-7 h-7 mr-3 text-blue-600" />
                  Single Sheet Layout Visualization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 w-full px-2">
                <div className="space-y-3">
                  <h5 className="text-lg font-semibold text-slate-700">Single Sheet Layout Pattern (All sheets use same pattern)</h5>
                  
                  {/* Single Sheet Canvas Visualization */}
                  <div className="w-full h-[600px] bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-lg p-1 shadow-lg">
                    <div className="relative w-full h-full bg-white rounded-lg shadow-inner overflow-hidden">
                      <canvas
                        id={`ultra-canvas-${productIndex}-${paperIndex}`}
                        className="w-full h-full rounded-lg transition-all duration-500 hover:shadow-md"
                        ref={(canvas) => {
                          if (canvas && layout.itemsPerSheet > 0 && opPaper?.inputWidth && opPaper?.inputHeight && outputDimensions[productIndex]?.width && outputDimensions[productIndex]?.height) {
                            setTimeout(() => {
                              drawPrintingPattern(canvas, layout, opPaper.inputWidth, opPaper.inputHeight, actualSheetsNeeded, outputDimensions[productIndex].width, outputDimensions[productIndex].height);
                            }, 150);
                          }
                        }}
                      />
                      {(layout.itemsPerSheet === 0 || dimensionError) && (
                        <div className="absolute inset-0 grid place-items-center text-lg text-slate-500 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg">
                          <div className="text-center p-8">
                            <div className="text-slate-400 mb-4 text-5xl">
                              {dimensionError ? "⚠️" : "🎯"}
                            </div>
                            <div className="font-semibold text-slate-600 text-xl">
                              {dimensionError ? "Invalid Dimensions" : "Configure Dimensions"}
                            </div>
                            <div className="text-sm text-slate-400 mt-3">
                              {dimensionError ? "Adjust item size to fit sheet" : "Set sheet & item sizes to preview"}
                            </div>
                            <div className="text-sm text-slate-400">
                              {dimensionError ? "dimensions properly" : "the optimized layout pattern"}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Enhanced Information Cards - Below Canvas */}
                  <div className="grid md:grid-cols-3 gap-4 mt-6">
                    {/* Advanced Sheet Analysis */}
                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                      <h6 className="font-semibold text-slate-800 mb-3 text-center flex items-center justify-center">
                        <Package className="w-4 h-4 mr-2 text-blue-600" />
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
                          <span className="font-semibold text-blue-600">
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
                            <span className="text-sm font-medium text-slate-700">Performance:</span>
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
                        <Edit3 className="w-4 h-4 mr-2 text-blue-600" />
                        Production Intelligence
                      </h6>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Item Size:</span>
                          <span className="font-semibold text-blue-600">
                            {outputDimensions[productIndex]?.width?.toFixed(1) ?? "–"} × {outputDimensions[productIndex]?.height?.toFixed(1) ?? "–"} cm
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Layout Strategy:</span>
                          <span className={`font-semibold ${layout.orientation === 'rotated' ? 'text-purple-600' : 'text-green-600'}`}>
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
                            <span className="font-bold text-blue-600 text-lg">{layout.itemsPerSheet}</span>
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
                        <div className="bg-blue-50 p-2 rounded-lg">
                          <p className="text-xs text-blue-800 font-medium">
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
                        <BarChart3 className="w-4 h-4 mr-2 text-blue-600" />
                        Operations Dashboard
                      </h6>
                      <div className="space-y-3">
                        {/* Production Metrics */}
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="bg-blue-50 p-2 rounded">
                            <div className="text-blue-600 font-medium">Required</div>
                            <div className="font-bold text-blue-800">{qty || 0}</div>
                          </div>
                          <div className="bg-orange-50 p-2 rounded">
                            <div className="text-orange-600 font-medium">Sheets</div>
                            <div className="font-bold text-orange-800">{sheetsNeeded}</div>
                          </div>
                        </div>

                        {enteredSheets && (
                          <div className="flex justify-between bg-purple-50 p-2 rounded">
                            <span className="text-purple-700 font-medium">Planned Sheets:</span>
                            <span className="font-bold text-purple-800">{enteredSheets}</span>
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

      {/* Supplier Database Modal */}
      <Dialog open={showSupplierDB} onOpenChange={setShowSupplierDB}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl font-bold text-slate-800">
              <Database className="w-6 h-6 mr-3 text-green-600" />
              Supplier Database
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Sample supplier data */}
            <div className="grid gap-4">
              <div className="border border-slate-200 rounded-xl p-4 hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-slate-800">Premium Art Paper 300gsm</h4>
                    <p className="text-slate-600 text-sm">High-quality coated paper, ideal for marketing materials</p>
                    <div className="mt-2 flex gap-4 text-sm">
                      <span className="text-green-600">✓ In Stock</span>
                      <span className="text-blue-600">32×45 cm sheets</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">$0.085</div>
                    <div className="text-slate-500 text-sm">per sheet</div>
                  </div>
                </div>
              </div>
              <div className="border border-slate-200 rounded-xl p-4 hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-slate-800">Standard Offset 200gsm</h4>
                    <p className="text-slate-600 text-sm">Cost-effective option for general printing needs</p>
                    <div className="mt-2 flex gap-4 text-sm">
                      <span className="text-yellow-600">⚠ Low Stock</span>
                      <span className="text-blue-600">35×50 cm sheets</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">$0.045</div>
                    <div className="text-slate-500 text-sm">per sheet</div>
                  </div>
                </div>
              </div>
              <div className="border border-slate-200 rounded-xl p-4 hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-slate-800">Recycled Paper 150gsm</h4>
                    <p className="text-slate-600 text-sm">Eco-friendly option with good print quality</p>
                    <div className="mt-2 flex gap-4 text-sm">
                      <span className="text-green-600">✓ In Stock</span>
                      <span className="text-blue-600">30×42 cm sheets</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">$0.032</div>
                    <div className="text-slate-500 text-sm">per sheet</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowSupplierDB(false)} className="px-6 py-2 rounded-xl">
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
          </DialogHeader>

          {openData ? (
            <div className="space-y-8">
              {/* Top Row - Specifications & Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Sheet Specifications Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <Package className="w-4 h-4 text-blue-600" />
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
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                      <BarChart3 className="w-4 h-4 text-purple-600" />
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
                    <div className="flex justify-between items-center py-3 px-4 bg-blue-50 rounded-xl">
                      <span className="text-slate-600 font-medium">Items per Sheet</span>
                      <span className="font-bold text-blue-700 text-lg">
                        {openData.calc?.layout.itemsPerSheet}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 px-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                      <span className="text-slate-600 font-medium">Orientation</span>
                      <span className={`font-bold text-lg flex items-center ${openData.calc?.layout.orientation === 'rotated' ? 'text-purple-600' : 'text-green-600'}`}>
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
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                    <Calculator className="w-5 h-5 text-blue-600" />
                  </div>
                  <h6 className="text-xl font-bold text-slate-800">Cost Breakdown</h6>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Paper Cost Breakdown */}
                  <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h6 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                      <Package className="w-5 h-5 mr-2 text-blue-600" />
                      Paper Costs
                    </h6>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2">
                        <span className="text-slate-600">Price per Sheet</span>
                        <span className="font-semibold text-blue-600">
                          {openData.calc?.pricePerSheet != null
                            ? fmt(openData.calc.pricePerSheet)
                            : "—"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-slate-600">Sheets Required</span>
                        <span className="font-semibold text-slate-800">
                          {openData.calc?.recommendedSheets ?? 0}
                        </span>
                      </div>
                      <div className="border-t pt-3 mt-4">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold text-slate-800">Total Paper Cost</span>
                          <span className="text-2xl font-bold text-blue-600">
                            {fmt(
                              (openData.op?.enteredSheets ??
                                openData.calc?.recommendedSheets ??
                                0) * (openData.calc?.pricePerSheet ?? 0)
                            )}
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
                        .filter((f) => formData.products[0].finishing.includes(f.name))
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
                                .filter((f) => formData.products[0].finishing.includes(f.name))
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

              {/* Production Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200 p-6 text-center">
                  <div className="w-12 h-12 bg-blue-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Package className="w-6 h-6 text-blue-700" />
                  </div>
                  <div className="text-blue-700 font-medium mb-1">Plates Required</div>
                  <div className="text-3xl font-bold text-blue-800">{plates}</div>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border border-green-200 p-6 text-center">
                  <div className="w-12 h-12 bg-green-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <BarChart3 className="w-6 h-6 text-green-700" />
                  </div>
                  <div className="text-green-700 font-medium mb-1">Units Produced</div>
                  <div className="text-3xl font-bold text-green-800">{units}</div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border border-purple-200 p-6 text-center">
                  <div className="w-12 h-12 bg-purple-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Calculator className="w-6 h-6 text-purple-700" />
                  </div>
                  <div className="text-purple-700 font-medium mb-1">Efficiency</div>
                  <div className={`text-3xl font-bold ${(openData.calc?.layout.efficiency ?? 0) > 80 ? 'text-green-600' : (openData.calc?.layout.efficiency ?? 0) > 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {openData.calc?.layout.efficiency?.toFixed(1) ?? "—"}%
                  </div>
                </div>
              </div>

              {/* Grand Total */}
              <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-green-50 rounded-2xl border-2 border-slate-300 p-8 text-center">
                <div className="mb-4">
                  <div className="text-slate-600 font-medium text-lg mb-2">Estimated Base Cost</div>
                  <div className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent">
                    {fmt(
                      (openData.op?.enteredSheets ??
                        openData.calc?.recommendedSheets ??
                        0) *
                        (openData.calc?.pricePerSheet ?? 0) +
                        (formData.products[0]?.finishing ? formData.operational.finishing
                          .filter((f) => formData.products[0].finishing.includes(f.name))
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
    </div>
  );
};

export default Step4Operational;