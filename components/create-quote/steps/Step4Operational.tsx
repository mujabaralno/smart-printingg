/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
import {
  Package,
  Calculator,
  Settings,
  BarChart3,
  Edit3,
  AlertTriangle,
  Database,
  Palette,
  Info,
  Clock,
  DollarSign,
  Search,
  Building,
  Plus,
  Minus,
  Printer,
  Scissors,
  GripHorizontal,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  getProductConfig,
  getShoppingBagPreset,
} from "@/constants/product-config";
import { PricingService } from "@/lib/pricing-service";
import { calcDigitalCosting, calcOffsetCosting } from "@/lib/imposition";
import { excelDigitalCalculation } from "@/lib/excel-calculation";
import {
  calculateVisualizationPressDimensions,
  type PressDimension,
} from "@/lib/dynamic-press-calculator";
import {
  calculateExcelBasedPricing,
  getRecommendedSheets,
  calculatePiecesPerSheet,
  getWasteSheets,
  type ImpositionResult,
  type CalculationInput,
} from "@/lib/excel-calculations";
import { CostBreakdownDialog } from "@/components/shared/CostBreakdownDialog";
import { drawProfessionalVisualization } from "@/lib/visualization/drawProfessionalVisualization";
import { drawDigitalLayout } from "@/lib/visualization/drawDigitalLayout";
import { calculateCutPieces } from "@/lib/step4Calculation/calculateCutPieces";
import { drawFinalPrintingLayout } from "@/lib/visualization/drawFinalPrintingLayout";
import { computeLayout } from "@/lib/step4Calculation/computeLayout";
import { getEffectiveProductSize } from "@/lib/step4Calculation/getEffectiveProductSize";
import {
  CandidateRow,
  DigitalCostingResult,
  DigitalPricing,
  OffsetCostingResult,
  OffsetPricing,
  QuoteFormData,
  VisualizationType,
} from "@/types";
import { drawCuttingLayout } from "@/lib/visualization/drawCuttingLayout";
import { CUT_SIZE_CANDIDATES } from "@/constants";
import { calcRowTotal } from "@/lib/step4Calculation/calcRowTotal";
import { pickCheapestTotal } from "@/lib/step4Calculation/pickCheapestTotal";

interface Step4Props {
  formData: QuoteFormData;
  setFormData: Dispatch<SetStateAction<QuoteFormData>>;
}


/** Exact HTML calculation logic */
function calculateMaxItemsPerSheet(
  sheetLength: number,
  sheetWidth: number,
  itemLength: number,
  itemWidth: number
) {
  // Orientation 1: Item length aligned with sheet length, item width with sheet width
  const count1 =
    Math.floor(sheetLength / itemLength) * Math.floor(sheetWidth / itemWidth);

  // Orientation 2: Item length aligned with sheet width, item width with sheet length (rotated)
  const count2 =
    Math.floor(sheetLength / itemWidth) * Math.floor(sheetWidth / itemLength);

  if (count1 >= count2) {
    return { count: count1, orientation: "normal" as const };
  } else {
    return { count: count2, orientation: "rotated" as const };
  }
}

const Step4Operational: FC<Step4Props> = ({ formData, setFormData }) => {
  // ===== Professional Visualization State =====
  const [visualizationType, setVisualizationType] =
    React.useState<VisualizationType>("print");

  // ===== Dashboard Cards Collapse State =====
  const [
    isAdvancedSheetAnalysisCollapsed,
    setIsAdvancedSheetAnalysisCollapsed,
  ] = React.useState(true);
  const [
    isProductionIntelligenceCollapsed,
    setIsProductionIntelligenceCollapsed,
  ] = React.useState(true);
  const [isOperationsDashboardCollapsed, setIsOperationsDashboardCollapsed] =
    React.useState(true);

  // ===== Costing Analysis State =====
  const [digitalPricing, setDigitalPricing] =
    React.useState<DigitalPricing | null>(null);
  const [offsetPricing, setOffsetPricing] =
    React.useState<OffsetPricing | null>(null);
  const [digitalCostingResults, setDigitalCostingResults] = React.useState<
    DigitalCostingResult[]
  >([]);
  const [offsetCostingResult, setOffsetCostingResult] =
    React.useState<OffsetCostingResult | null>(null);
  const [selectedDigitalOption, setSelectedDigitalOption] =
    React.useState<string>("");
  const [selectedOffsetPress, setSelectedOffsetPress] =
    React.useState<string>("");
  const [loadingPricing, setLoadingPricing] = React.useState(false);

  // ===== Debug: Log component mount and initial data =====
  React.useEffect(() => {
    console.log("🚀 Step4Operational: Component mounted with data:", {
      productsLength: formData.products.length,
      operationalPapersLength: formData.operational.papers.length,
      products: formData.products.map((p: any) => ({
        name: p.productName,
        quantity: p.quantity,
        papers: p.papers.length,
        colors: p.colors,
      })),
      operationalPapers: formData.operational.papers.map((p: any) => ({
        inputWidth: p.inputWidth,
        inputHeight: p.inputHeight,
        outputWidth: p.outputWidth,
        outputHeight: p.outputHeight,
        selectedColors: p.selectedColors,
        pricePerSheet: p.pricePerSheet,
        pricePerPacket: p.pricePerPacket,
      })),
    });

    // CRITICAL: Initialize operational data structure for multiple products
    initializeOperationalData();
  }, [formData.products,]);

  // ===== Initialize operational data structure for multiple products =====
  const initializeOperationalData = () => {
    console.log(
      "🔄 Step4Operational: Initializing operational data structure..."
    );

    // Calculate total papers needed across all products
    const totalPapersNeeded = formData.products.reduce(
      (total, product) => total + product.papers.length,
      0
    );

    // If operational papers don't match total papers needed, initialize them
    if (formData.operational.papers.length !== totalPapersNeeded) {
      console.log(
        `📊 Initializing operational data: ${totalPapersNeeded} papers needed, ${formData.operational.papers.length} currently exist`
      );

      const newOperationalPapers: any[] = [];
      let globalPaperIndex = 0;

      formData.products.forEach((product, productIndex) => {
        product.papers.forEach((paper: any, paperIndex: number) => {
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
              // Always mirror latest Step 3 dimensions (closeSize preferred, then flatSize)
              outputWidth:
                formData.outputDimensions?.[productIndex]?.width ??
                product.closeSize?.width ??
                product.flatSize?.width ??
                null,
              outputHeight:
                formData.outputDimensions?.[productIndex]?.height ??
                product.closeSize?.height ??
                product.flatSize?.height ??
                null,
              selectedColors: product.colors
                ? [product.colors.front, product.colors.back].filter(
                    (color): color is string => Boolean(color)
                  )
                : [],
            };
            newOperationalPapers.push(newOpPaper);
          }

          globalPaperIndex++;
        });
      });

      // Update form data with proper operational structure
      setFormData((prev) => ({
        ...prev,
        operational: {
          ...prev.operational,
          papers: newOperationalPapers,
        },
        // Keep outputDimensions in sync with Step 3 so Step 4 mirrors latest sizes
        outputDimensions: formData.outputDimensions ?? prev.outputDimensions,
      }));

      console.log(
        "✅ Operational data structure initialized:",
        newOperationalPapers
      );
    }

    // Initialize output dimensions for all products
    const newOutputDimensions: {
      [productIndex: number]: { width: number; height: number };
    } = {};
    formData.products.forEach((product, productIndex) => {
      newOutputDimensions[productIndex] = {
        width: product.closeSize?.width ?? product.flatSize?.width ?? 0,
        height: product.closeSize?.height ?? product.flatSize?.height ?? 0,
      };
    });
    setOutputDimensions(newOutputDimensions);
  };

  const primaryProduct = formData?.products?.[0];
  const productConfig = React.useMemo(
    () => getProductConfig(primaryProduct?.productName),
    [primaryProduct?.productName]
  );

  // Pakai helper kamu sendiri untuk dapetin size efektif :contentReference[oaicite:14]{index=14}
  const effectiveSize = React.useMemo(() => {
    const { width, height } = getEffectiveProductSize(
      primaryProduct,
      productConfig
    ); // :contentReference[oaicite:15]{index=15}
    return { width, height };
  }, [primaryProduct, productConfig]);

  // ===== Output size state management =====
  const [outputDimensions, setOutputDimensions] = React.useState<{
    [productIndex: number]: { width: number; height: number };
  }>(() => {
    const initial: {
      [productIndex: number]: { width: number; height: number };
    } = {};
    formData.products.forEach((product, index) => {
      // Check if we have saved operational data for this product
      const hasOperationalData = formData.operational.papers.length > index;

      if (hasOperationalData) {
        // Use saved operational data if available
        const opPaper = formData.operational.papers[index];
        initial[index] = {
          width:
            opPaper?.outputWidth ??
            product?.closeSize?.width ??
            product?.flatSize?.width ??
            0,
          height:
            opPaper?.outputHeight ??
            product?.closeSize?.height ??
            product?.flatSize?.height ??
            0,
        };
      } else {
        // Fall back to product dimensions
        initial[index] = {
          width: product?.closeSize?.width ?? product?.flatSize?.width ?? 0,
          height: product?.closeSize?.height ?? product?.flatSize?.height ?? 0,
        };
      }
    });
    return initial;
  });

  // ===== New simple color codes state =====
  const [paperColors, setPaperColors] = React.useState<{
    [productIndex: number]: { [paperIndex: number]: string[] };
  }>({});
  const [colorInputs, setColorInputs] = React.useState<{
    [productIndex: number]: { [paperIndex: number]: string };
  }>({});
  const [colorSaveStatus, setColorSaveStatus] = React.useState<{
    [productIndex: number]: {
      [paperIndex: number]: "idle" | "saving" | "saved" | "error";
    };
  }>({});
  const [isColorsLoading, setIsColorsLoading] = React.useState(true);
  const [showColorSavedMessage, setShowColorSavedMessage] =
    React.useState(false);

  // ===== Enhanced helper function to convert color input to CSS color =====
  const getColorFromInput = (colorInput: string): string => {
    const input = colorInput.trim().toLowerCase();

    // Handle hex codes
    if (input.startsWith("#")) {
      // Validate hex format
      if (/^#[0-9A-Fa-f]{3}$|^#[0-9A-Fa-f]{6}$/.test(input)) {
        return input;
      }
      return "transparent"; // Invalid hex
    }

    // Handle common color names with expanded palette
    const colorMap: { [key: string]: string } = {
      // Basic colors
      red: "#FF0000",
      green: "#00FF00",
      blue: "#0000FF",
      yellow: "#FFFF00",
      cyan: "#00FFFF",
      magenta: "#FF00FF",
      black: "#000000",
      white: "#FFFFFF",
      gray: "#808080",
      grey: "#808080",
      orange: "#FFA500",
      purple: "#800080",
      pink: "#FFC0CB",
      brown: "#A52A2A",
      lime: "#00FF00",
      navy: "#000080",
      teal: "#008080",
      olive: "#808000",
      maroon: "#800000",
      silver: "#C0C0C0",
      gold: "#FFD700",
      violet: "#EE82EE",
      indigo: "#4B0082",
      coral: "#FF7F50",
      turquoise: "#40E0D0",
      lavender: "#E6E6FA",
      plum: "#DDA0DD",
      salmon: "#FA8072",
      khaki: "#F0E68C",
      azure: "#F0FFFF",
      ivory: "#FFFFF0",
      wheat: "#F5DEB3",
      tan: "#D2B48C",
      beige: "#F5F5DC",
      mint: "#F5FFFA",
      peach: "#FFE5B4",
      rose: "#FFE4E1",
      cream: "#FFFDD0",
      charcoal: "#36454F",
      slate: "#708090",
      steel: "#4682B4",

      // Process colors
      cmyk: "#000000", // Black for CMYK
      k: "#000000", // Black key
      m: "#FF00FF", // Magenta
      y: "#FFFF00", // Yellow
      c: "#00FFFF", // Cyan

      // Additional professional colors
      forest: "#228B22",
      emerald: "#50C878",
      sapphire: "#0F52BA",
      ruby: "#E0115F",
      amber: "#FFBF00",
      chrome: "#E8F1F8",
      gunmetal: "#2C3539",
      platinum: "#E5E4E2",
      titanium: "#C0C0C0",
      brass: "#B5A642",
      aluminum: "#848789",
      nickel: "#727472",
      zinc: "#7B8C4D",
    };

    if (colorMap[input]) {
      return colorMap[input];
    }

    // Handle Pantone-like codes with some common mappings
    if (/^[0-9]{3,4}[A-Z]$/i.test(input)) {
      // Map some common Pantone codes to approximate colors
      const pantoneMap: { [key: string]: string } = {
        "185C": "#C8102E", // Pantone Red
        "286C": "#003DA5", // Pantone Blue
        "354C": "#00A651", // Pantone Green
        "116C": "#FFD100", // Pantone Yellow
        "212C": "#FF6F61", // Pantone Coral
        "2925C": "#7BA7BC", // Pantone Blue Gray
        "7545C": "#425563", // Pantone Dark Blue Gray
        "7546C": "#5B6770", // Pantone Medium Blue Gray
        "7547C": "#8E8F8F", // Pantone Light Blue Gray
        "7548C": "#A7A8AA", // Pantone Very Light Blue Gray
        "7549C": "#C6C7C8", // Pantone Very Light Blue Gray
        "7550C": "#E3E3E3", // Pantone Very Light Blue Gray
        "7551C": "#F0F0F0", // Pantone Very Light Blue Gray
        "7552C": "#F8F8F8", // Pantone Very Light Blue Gray
        "7553C": "#FDFDFD", // Pantone Very Light Blue Gray
        "7554C": "#FFFFFF", // Pantone White
        "7555C": "#000000", // Pantone Black
        "7556C": "#1C1C1C", // Pantone Very Dark Gray
        "7557C": "#2D2D2D", // Pantone Dark Gray
        "7558C": "#3D3D3D", // Pantone Medium Dark Gray
        "7559C": "#4D4D4D", // Pantone Medium Gray
        "7560C": "#5D5D5D", // Pantone Medium Light Gray
        "7561C": "#6D6D6D", // Pantone Light Gray
        "7562C": "#7D7D7D", // Pantone Very Light Gray
        "7563C": "#8D8D8D", // Pantone Very Light Gray
        "7564C": "#9D9D9D", // Pantone Very Light Gray
        "7565C": "#ADADAD", // Pantone Very Light Gray
        "7566C": "#BDBDBD", // Pantone Very Light Gray
        "7567C": "#CDCDCD", // Pantone Very Light Gray
        "7568C": "#DDDDDD", // Pantone Very Light Gray
        "7569C": "#EDEDED", // Pantone Very Light Gray
        "7570C": "#FDFDFD", // Pantone Very Light Gray
      };

      if (pantoneMap[input.toUpperCase()]) {
        return pantoneMap[input.toUpperCase()];
      }

      // For unknown Pantone codes, show a pattern
      return "transparent";
    }

    // Try to parse as CSS color
    try {
      // Create a temporary element to test if the color is valid
      const temp = document.createElement("div");
      temp.style.color = input;
      if (temp.style.color !== "") {
        return input;
      }
    } catch (e) {
      // Ignore errors
    }

    return "transparent"; // Unknown color
  };

  // ===== Sync local state with formData changes (important for editing existing quotes) =====
  React.useEffect(() => {
    console.log(
      "🔄 Step4Operational: formData changed, syncing local state...",
      {
        productsLength: formData.products.length,
        operationalPapersLength: formData.operational.papers.length,
        hasOperationalData: formData.operational.papers.some(
          (p: any) =>
            p.inputWidth !== null ||
            p.inputHeight !== null ||
            p.outputWidth !== null ||
            p.outputHeight !== null
        ),
      }
    );

    // Sync colors from formData to local state
    const newPaperColors: {
      [productIndex: number]: { [paperIndex: number]: string[] };
    } = {};
    formData.products.forEach((product, productIndex) => {
      product.papers.forEach((paper: any, paperIndex: number) => {
        // Calculate global paper index
        const globalPaperIndex =
          formData.products
            .slice(0, productIndex)
            .reduce((total: number, p: any) => total + p.papers.length, 0) +
          paperIndex;

        // Get colors from operational data
        const operationalPaper = formData.operational.papers[globalPaperIndex];
        if (
          operationalPaper?.selectedColors &&
          operationalPaper.selectedColors.length > 0
        ) {
          if (!newPaperColors[productIndex]) newPaperColors[productIndex] = {};
          newPaperColors[productIndex][paperIndex] =
            operationalPaper.selectedColors;
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
      const newOutputDimensions: {
        [productIndex: number]: { width: number; height: number };
      } = {};
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
            width:
              opPaper.outputWidth ??
              product?.closeSize?.width ??
              product?.flatSize?.width ??
              0,
            height:
              opPaper.outputHeight ??
              product?.closeSize?.height ??
              product?.flatSize?.height ??
              0,
          };
          console.log(
            `📏 Syncing outputDimensions for product ${productIndex}:`,
            newOutputDimensions[productIndex]
          );
        } else {
          newOutputDimensions[productIndex] = {
            width: product?.closeSize?.width ?? product?.flatSize?.width ?? 0,
            height:
              product?.closeSize?.height ?? product?.flatSize?.height ?? 0,
          };
        }
      });

      setOutputDimensions(newOutputDimensions);
    }
  }, [formData.operational.papers, formData.products]);

  // ===== Debug: Monitor color changes =====

  // ===== Track user edits to enteredSheets =====
  const [userEditedSheets, setUserEditedSheets] = React.useState<Set<string>>(
    new Set()
  );

  // ===== Track user edits to input dimensions =====
  const [userEditedInputDimensions, setUserEditedInputDimensions] =
    React.useState<Set<string>>(new Set());

  // ===== Additional costs state =====
  // Use formData.additionalCosts instead of local state for persistence
  const additionalCosts = formData.additionalCosts || [];

  const setAdditionalCosts = (
    newCosts: Array<{
      id: string;
      description: string;
      cost: number;
      comment: string;
    }>
  ) => {
    setFormData((prev) => ({
      ...prev,
      additionalCosts: newCosts,
    }));
  };

  // ===== Supplier database modal =====
  const [showSupplierDB, setShowSupplierDB] = React.useState(false);

  // ===== Update outputDimensions when formData changes (e.g., when existing quote is selected) =====
  React.useEffect(() => {
    console.log("📏 Step4Operational: Updating outputDimensions...", {
      productsLength: formData.products.length,
      operationalPapersLength: formData.operational.papers.length,
      formDataProducts: formData.products.map((p, i) => ({
        index: i,
        productName: p.productName,
        flatSize: p.flatSize,
        closeSize: p.closeSize,
      })),
    });

    const newOutputDimensions: {
      [productIndex: number]: { width: number; height: number };
    } = {};

    formData.products.forEach((product, index) => {
      // Check if we have saved operational data for this product
      const hasOperationalData = formData.operational.papers.length > index;

      // Special handling for shopping bags - calculate total dieline dimensions
      if (product?.productName === "Shopping Bag" && product?.bagPreset) {
        const bagPreset = getShoppingBagPreset(product.bagPreset);
        if (bagPreset) {
          const W = bagPreset.width; // Individual panel width
          const H = bagPreset.height; // Individual panel height
          const G = bagPreset.gusset; // Gusset width
          const T = Math.max(3, W * 0.12); // Top hem (proportional)
          const B = Math.max(6, W * 0.25); // Bottom flaps (proportional)
          const glueFlap = 2; // Fixed glue flap width

          // Calculate total dieline dimensions
          const totalWidth = W + G + W + G + glueFlap; // Back + Gusset + Front + Gusset + Glue
          const totalHeight = T + H + B; // Top hem + Body height + Bottom flaps

          newOutputDimensions[index] = {
            width: totalWidth,
            height: totalHeight,
          };

          console.log(
            `🛍️ Product ${index}: Shopping bag dieline dimensions - width: ${totalWidth}, height: ${totalHeight}`
          );
        } else {
          // Fallback to product dimensions if preset not found
          newOutputDimensions[index] = {
            width: product?.closeSize?.width ?? product?.flatSize?.width ?? 0,
            height:
              product?.closeSize?.height ?? product?.flatSize?.height ?? 0,
          };
          console.log(
            `🛍️ Product ${index}: Shopping bag preset not found, using fallback dimensions`
          );
        }
      } else if (hasOperationalData) {
        // Use saved operational data if available
        const opPaper = formData.operational.papers[index];
        newOutputDimensions[index] = {
          width:
            opPaper?.outputWidth ??
            product?.closeSize?.width ??
            product?.flatSize?.width ??
            0,
          height:
            opPaper?.outputHeight ??
            product?.closeSize?.height ??
            product?.flatSize?.height ??
            0,
        };
        console.log(
          `📏 Product ${index}: Using operational data - width: ${opPaper?.outputWidth}, height: ${opPaper?.outputHeight}`
        );
      } else {
        // Fall back to product dimensions
        newOutputDimensions[index] = {
          width: product?.closeSize?.width ?? product?.flatSize?.width ?? 0,
          height: product?.closeSize?.height ?? product?.flatSize?.height ?? 0,
        };
        console.log(
          `📏 Product ${index}: Using product dimensions - width: ${
            product?.closeSize?.width || product?.flatSize?.width
          }, height: ${product?.closeSize?.height || product?.flatSize?.height}`
        );
      }
    });

    console.log("📏 Final outputDimensions:", newOutputDimensions);
    setOutputDimensions(newOutputDimensions);
  }, [formData.products, formData.operational.papers]);

  // ===== Supplier Database state =====
  const [suppliers, setSuppliers] = React.useState<any[]>([]);
  const [materials, setMaterials] = React.useState<any[]>([]);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = React.useState(false);
  const [supplierSearchTerm, setSupplierSearchTerm] = React.useState("");
  const [selectedSupplier, setSelectedSupplier] = React.useState("");
  const [selectedGSM, setSelectedGSM] = React.useState("");

  // ===== Get paper price from materials database =====
  const getPaperPriceFromMaterials = (
    paperName: string,
    gsm: string
  ): number | null => {
    if (!materials || materials.length === 0) {
      console.log("🔍 getPaperPriceFromMaterials: No materials available");
      return null;
    }

    console.log("🔍 getPaperPriceFromMaterials: Looking for paper:", {
      paperName,
      gsm,
    });
    console.log(
      "🔍 Available materials:",
      materials.map((m) => ({
        name: m.name,
        gsm: m.gsm,
        cost: m.cost,
        unit: m.unit,
        sheetsPerPacket: m.sheetsPerPacket,
      }))
    );

    // Try to find exact match first
    const exactMatch = materials.find(
      (material) =>
        material.name?.toLowerCase().includes(paperName.toLowerCase()) &&
        material.gsm === gsm
    );

    if (exactMatch && exactMatch.cost) {
      console.log("🔍 Found exact match:", exactMatch);
      // Convert cost to price per sheet if needed
      // If unit is 'packet' and we have sheetsPerPacket, calculate per sheet
      if (exactMatch.unit === "packet" && exactMatch.sheetsPerPacket) {
        return exactMatch.cost / exactMatch.sheetsPerPacket;
      }
      // If unit is 'sheet' or 'per sheet', use cost directly
      return exactMatch.cost;
    }

    // Try to find by name only
    const nameMatch = materials.find((material) =>
      material.name?.toLowerCase().includes(paperName.toLowerCase())
    );

    if (nameMatch && nameMatch.cost) {
      console.log("🔍 Found name match:", nameMatch);
      // Convert cost to price per sheet if needed
      if (nameMatch.unit === "packet" && nameMatch.sheetsPerPacket) {
        return nameMatch.cost / nameMatch.sheetsPerPacket;
      }
      return nameMatch.cost;
    }

    console.log("🔍 No match found for paper:", paperName);
    return null;
  };

  // ===== Enhanced calculation exactly matching HTML logic =====
  const perPaperCalc = React.useMemo(() => {
    console.log("🔄 perPaperCalc recalculating due to dependency change:", {
      operationalPapersLength: formData.operational.papers.length,
      productsLength: formData.products.length,
      manualPricingData: formData.operational.papers.map((p: any) => ({
        pricePerSheet: p.pricePerSheet,
        pricePerPacket: p.pricePerPacket,
        sheetsPerPacket: p.sheetsPerPacket,
      })),
    });
    // Calculate for each product with their own paper indices
    return formData.products.map((product, productIndex) => {
      const qty = product?.quantity ?? 0;
      const productDimensions = outputDimensions[productIndex] || {
        width: 0,
        height: 0,
      };

      // Map through the product's papers (not operational papers)
      return product.papers.map((paper: any, paperIndex: number) => {
        // Calculate the global paper index for this product's paper
        let globalPaperIndex = 0;
        for (let pi = 0; pi < productIndex; pi++) {
          globalPaperIndex += formData.products[pi].papers.length;
        }
        globalPaperIndex += paperIndex;

        const opPaper = formData.operational.papers[globalPaperIndex];

        // Get product configuration for proper gripper, gap, and bleed values
        const productConfig = getProductConfig(
          product?.productName || "Business Card"
        );
        const gripperWidth =
          product?.gripper || productConfig?.defaultGripper || 0.9;

        // Use Step 3 product dimensions directly instead of outputDimensions
        let step3ProductWidth =
          product?.flatSize?.width || productConfig?.defaultSizes?.width || 0;
        let step3ProductHeight =
          product?.flatSize?.height || productConfig?.defaultSizes?.height || 0;

        // Use optimized gap for business cards, 0.2cm gap for cups for maximum packing, otherwise use product config
        const baseGapWidth =
          product?.productName === "Cups"
            ? 0.2
            : product?.gap || productConfig?.defaultGap || 0.5;
        const gapWidth =
          step3ProductWidth >= 8.5 &&
          step3ProductWidth <= 10 &&
          step3ProductHeight >= 5 &&
          step3ProductHeight <= 6
            ? Math.min(baseGapWidth, 0.2)
            : baseGapWidth;
        const bleedWidth = product?.bleed || productConfig?.defaultBleed || 0.3;

        // Debug: Check what product we're dealing with
        console.log("🔍 Product debug info:", {
          productName: product?.productName,
          bagPreset: product?.bagPreset,
          flatSize: product?.flatSize,
          step3ProductWidth,
          step3ProductHeight,
        });

        // Special handling for shopping bags - calculate total dieline dimensions
        if (product?.productName === "Shopping Bag" && product?.bagPreset) {
          console.log("🛍️ Processing shopping bag...");
          const bagPreset = getShoppingBagPreset(product.bagPreset);
          if (bagPreset) {
            const W = bagPreset.width; // Individual panel width
            const H = bagPreset.height; // Individual panel height
            const G = bagPreset.gusset; // Gusset width
            const T = Math.max(3, W * 0.12); // Top hem (proportional)
            const B = Math.max(6, W * 0.25); // Bottom flaps (proportional)
            const glueFlap = 2; // Fixed glue flap width

            // Calculate total dieline dimensions
            step3ProductWidth = W + G + W + G + glueFlap; // Back + Gusset + Front + Gusset + Glue
            step3ProductHeight = T + H + B; // Top hem + Body height + Bottom flaps

            console.log(
              "🛍️ Shopping bag dieline dimensions (BEFORE computeLayout):",
              {
                preset: product.bagPreset,
                panelWidth: W,
                panelHeight: H,
                gusset: G,
                topHem: T,
                bottomFlaps: B,
                glueFlap: glueFlap,
                totalWidth: step3ProductWidth,
                totalHeight: step3ProductHeight,
              }
            );
          } else {
            console.error(
              "🛍️ Shopping bag preset not found:",
              product.bagPreset
            );
          }
        } else {
          console.log("🛍️ Not a shopping bag or missing bagPreset:", {
            isShoppingBag: product?.productName === "Shopping Bag",
            hasBagPreset: !!product?.bagPreset,
          });
        }

        // Debug cup dimensions
        if (product?.productName === "Cups") {
          console.log(`🍵 Cup Product ${productIndex}:`, {
            cupSizeOz: product.cupSizeOz,
            flatSize: product.flatSize,
            step3ProductWidth,
            step3ProductHeight,
            productConfig: productConfig?.defaultSizes,
            safetyGap: 0.5,
            bleedWidth,
            productWithSafetyWidth:
              step3ProductWidth + 2 * bleedWidth + 2 * 0.5,
            productWithSafetyHeight:
              step3ProductHeight + 2 * bleedWidth + 2 * 0.5,
          });
        }

        // Calculate dynamic press dimensions based on product size
        let dynamicPressWidth = 35; // Default fallback
        let dynamicPressHeight = 50; // Default fallback

        // Use outputDimensions if available (from Step 3), otherwise fall back to step3Product dimensions
        let productWidth, productHeight;
        if (
          formData &&
          productIndex !== undefined &&
          formData.outputDimensions &&
          formData.outputDimensions[productIndex]
        ) {
          productWidth = formData.outputDimensions[productIndex].width;
          productHeight = formData.outputDimensions[productIndex].height;
          console.log("🔍 Using outputDimensions for computeLayout:", {
            width: productWidth,
            height: productHeight,
            productIndex,
            source: "outputDimensions",
          });
        } else if (step3ProductWidth && step3ProductHeight) {
          productWidth = step3ProductWidth;
          productHeight = step3ProductHeight;
          console.log("🔍 Using step3Product dimensions for computeLayout:", {
            width: productWidth,
            height: productHeight,
            source: "step3Product",
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
            console.log(
              "🎯 Using dynamic press dimensions for computeLayout:",
              pressDimension
            );
          } else {
            console.warn(
              "⚠️ Failed to calculate dynamic press dimensions for computeLayout, using fallback"
            );
          }
        } else {
          console.warn(
            "⚠️ Missing product dimensions for computeLayout, using default press size"
          );
        }

        // Initialize layout - will be populated differently for digital vs offset
        let layout: any;

        // Use new Excel-based calculation for recommended sheets
        let recommendedSheets: number;

        // Get paper cost per sheet for calculation - same logic as Digital Pricing Summary
        const paperName = product.papers[paperIndex]?.name || "";
        const paperGSM = product.papers[paperIndex]?.gsm || "";
        const materialPrice = getPaperPriceFromMaterials(paperName, paperGSM);

        let paperCostPerSheet = opPaper?.pricePerSheet;
        if (paperCostPerSheet == null) {
          if (
            opPaper?.pricePerPacket != null &&
            opPaper?.sheetsPerPacket != null &&
            opPaper.sheetsPerPacket > 0
          ) {
            paperCostPerSheet =
              opPaper.pricePerPacket / opPaper.sheetsPerPacket;
          } else {
            paperCostPerSheet = materialPrice ?? 10; // Use Step 3 materials database, fallback to 10
          }
        }

        // Debug logging for manual pricing integration
        if (opPaper?.pricePerSheet != null) {
          console.log("💰 Main calc using direct sheet pricing:", {
            pricePerSheet: paperCostPerSheet,
          });
        } else if (
          opPaper?.pricePerPacket != null &&
          opPaper?.sheetsPerPacket != null &&
          opPaper.sheetsPerPacket > 0
        ) {
          console.log("📦 Main calc using packet pricing:", {
            pricePerPacket: opPaper.pricePerPacket,
            sheetsPerPacket: opPaper.sheetsPerPacket,
            calculatedPricePerSheet: paperCostPerSheet,
          });
        } else {
          console.log("📄 Main calc using materials database pricing:", {
            materialPrice,
            fallbackPrice: paperCostPerSheet,
          });
        }

        // Extract colors from product
        const parseColors = (colorStr: any): number => {
          if (!colorStr) return 0;
          const str = colorStr.toString();

          // Check for "4+1" or "4+2" format
          const plusMatch = str.match(/(\d+)\+(\d+)/);
          if (plusMatch) {
            const base = parseInt(plusMatch[1]);
            const additional = parseInt(plusMatch[2]);
            return base + additional;
          }

          // Fallback to single number
          const singleMatch = str.match(/\d+/);
          return singleMatch ? parseInt(singleMatch[0]) : 0;
        };

        const frontColors = parseColors(product.colors?.front);
        const backColors = parseColors(product.colors?.back);
        const rawColours = Math.max(frontColors, backColors) || 4;

        // Check if this is digital printing
        const isDigital = product?.printingSelection === "Digital";

        // Color categorization: ONLY apply for Digital (1-3 colors = 1 color, 4+ colors = 4 colors)
        // For Offset, use actual color count for accurate plate cost calculation
        const colours = isDigital ? (rawColours <= 3 ? 1 : 4) : rawColours;

        if (isDigital) {
          // Use digital calculation for digital printing
          try {
            const digitalResults = excelDigitalCalculation({
              qty,
              piece: { w: step3ProductWidth, h: step3ProductHeight },
              sides: Number(product.sides) as 1 | 2,
              colorsF: colours as 1 | 2 | 4,
              colorsB: 1,
              parent: { w: 100, h: 70 },
              allowRotate: true,
              paperCostPerSheet: paperCostPerSheet, // Pass manual paper pricing
            });

            if (digitalResults.length > 0) {
              // Use the cheapest digital option (avoiding zero values)
              const validResults = digitalResults.filter(
                (result) => result.total > 0
              );
              const cheapest =
                validResults.length > 0
                  ? validResults.reduce((min, current) =>
                      current.total < min.total ? current : min
                    )
                  : null;

              if (!cheapest) {
                console.warn(
                  "⚠️ All digital calculation results have zero total - no valid option found"
                );
                return null; // Skip this product if no valid results
              }

              recommendedSheets = cheapest.parents;

              // Create layout object from digital calculation results
              if (cheapest.gridLayout) {
                layout = {
                  usableW: cheapest.gridLayout.sheetWidth - 1, // Subtract margins
                  usableH: cheapest.gridLayout.sheetHeight - 1,
                  itemsPerSheet: cheapest.upsPerSheet,
                  efficiency: 95,
                  orientation: cheapest.gridLayout.orientation,
                  itemsPerRow: cheapest.gridLayout.itemsPerRow,
                  itemsPerCol: cheapest.gridLayout.itemsPerCol,
                  productShape: "rectangular" as const,
                  gripperOnLongSide: true,
                  gripperPosition: "top",
                  pressWidth: cheapest.gridLayout.sheetWidth,
                  pressHeight: cheapest.gridLayout.sheetHeight,
                  digitalResults: digitalResults,
                  selectedDigitalOption: cheapest,
                };
              } else {
                throw new Error("No grid layout data in digital results");
              }

              console.log("📊 Digital calculation result:", {
                productName: product?.productName,
                pieceW: step3ProductWidth,
                pieceH: step3ProductHeight,
                digitalResults,
                selectedOption: cheapest.option,
                recommendedSheets: cheapest.parents,
                upsPerSheet: cheapest.upsPerSheet,
                gridLayout: cheapest.gridLayout,
                layout: layout,
                pressSheetSize: `${cheapest.gridLayout.sheetWidth}×${cheapest.gridLayout.sheetHeight} cm`,
                total: cheapest.total,
              });
            } else {
              throw new Error("No digital results available");
            }
          } catch (error) {
            console.error(
              "❌ Digital calculation failed, falling back to computeLayout:",
              error
            );
            // Fallback to computeLayout for digital
            layout = computeLayout(
              dynamicPressWidth,
              dynamicPressHeight,
              step3ProductWidth,
              step3ProductHeight,
              gripperWidth,
              0.5,
              gapWidth,
              bleedWidth
            );
            recommendedSheets =
              layout.itemsPerSheet > 0
                ? Math.ceil(qty / layout.itemsPerSheet)
                : 0;
          }
        } else {
          // Use offset calculation for offset printing
          // First, compute layout using offset press dimensions
          layout = computeLayout(
            dynamicPressWidth, // Dynamic press sheet width
            dynamicPressHeight, // Dynamic press sheet height
            step3ProductWidth, // Use Step 3 dimensions
            step3ProductHeight, // Use Step 3 dimensions
            gripperWidth,
            0.5, // edgeMargin
            gapWidth,
            bleedWidth
          );

          console.log("🔍 computeLayout result for offset:", layout);

          try {
            // Build base parameters
            const base = {
              pieceW: step3ProductWidth,
              pieceH: step3ProductHeight,
              qty,
              sides: Number(product.sides) || 2,
              colours,
              paperCostPerSheet,
            };

            // Check if user specified parent size in Step 4
            const userParentW = opPaper?.inputWidth;
            const userParentH = opPaper?.inputHeight;

            let chosenRow;
            if (userParentW && userParentH) {
              // Find exact match in candidates
              chosenRow = CUT_SIZE_CANDIDATES.find(
                (r) =>
                  Number(r.parentW) === Number(userParentW) &&
                  Number(r.parentH) === Number(userParentH)
              );
            }

            // If no exact match, pick cheapest (avoiding zero values)
            // Use materials database price for candidate selection to avoid price-dependent sheet count changes
            if (!chosenRow) {
              const baseForSelection = {
                ...base,
                paperCostPerSheet: materialPrice ?? 10, // Use materials DB price for selection, not user input
              };
              const ranked = pickCheapestTotal(
                baseForSelection,
                CUT_SIZE_CANDIDATES
              );
              if (ranked.length > 0) {
                chosenRow = ranked[0]; // cheapest non-zero row
              } else {
                console.warn(
                  "⚠️ No valid offset calculation results found - all have zero total"
                );
                return null; // Skip this product if no valid results
              }
            }

            // Calculate final result
            if (!chosenRow) {
              console.warn("⚠️ No chosenRow available for offset calculation");
              return null;
            }
            const excelResult = calcRowTotal(base, chosenRow);

            recommendedSheets = excelResult.sheets;

            // Update layout with Excel-based pieces per sheet
            layout.itemsPerSheet = excelResult.upsPerSht;
            layout.efficiency =
              (excelResult.upsPerSht /
                ((chosenRow.parentW * chosenRow.parentH) /
                  (step3ProductWidth * step3ProductHeight))) *
              100;

            // Add selected parent dimensions for visualization
            layout.selectedParentWidth = chosenRow.parentW;
            layout.selectedParentHeight = chosenRow.parentH;

            console.log("📊 Offset calculation result:", {
              productName: product?.productName,
              pieceW: step3ProductWidth,
              pieceH: step3ProductHeight,
              chosenRow,
              recommendedSheets: excelResult.sheets,
              upsPerSht: excelResult.upsPerSht,
              noOfUps: excelResult.noOfUps,
              total: excelResult.total,
            });
          } catch (error) {
            console.error(
              "❌ Offset calculation failed, falling back to original:",
              error
            );
            recommendedSheets =
              layout.itemsPerSheet > 0
                ? Math.ceil(qty / layout.itemsPerSheet)
                : 0;
          }
        }

        // Use custom price per sheet if provided, otherwise calculate from packet pricing
        const pricePerSheet =
          opPaper?.pricePerSheet != null
            ? opPaper.pricePerSheet
            : opPaper?.pricePerPacket != null &&
              opPaper?.sheetsPerPacket != null &&
              opPaper.sheetsPerPacket > 0
            ? opPaper.pricePerPacket / opPaper.sheetsPerPacket
            : null;

        return { layout, recommendedSheets, pricePerSheet, opPaper };
      });
    });
  }, [
    formData.operational.papers.length,
    outputDimensions,
    formData.products.length,
    paperColors, // Add paperColors dependency for Excel calculation
    // Add manual pricing dependencies to trigger recalculation when manual inputs change
    formData.operational.papers,
  ]);

  // ===== Initialize enteredSheets with recommended values =====
  React.useEffect(() => {
    // Only run this effect once when the component mounts and perPaperCalc is available
    if (perPaperCalc.length > 0 && perPaperCalc[0]?.length > 0) {
      setFormData((prev) => {
        const nextPapers = prev.operational.papers.map((p: any, i: number) => {
          // Find which product and paper index this operational paper corresponds to
          let productIndex = 0;
          let paperIndex = 0;
          let currentPaperCount = 0;

          for (let pi = 0; pi < formData.products.length; pi++) {
            if (
              i >= currentPaperCount &&
              i < currentPaperCount + formData.products[pi].papers.length
            ) {
              productIndex = pi;
              paperIndex = i - currentPaperCount;
              break;
            }
            currentPaperCount += formData.products[pi].papers.length;
          }

          // Get the recommended sheets from the correct product's calculation
          const rec =
            perPaperCalc[productIndex]?.[paperIndex]?.recommendedSheets ??
            p.recommendedSheets;
          const paperKey = `paper-${i}`;
          const hasUserEdited = userEditedSheets.has(paperKey);

          // IMPORTANT: Preserve existing data when editing existing quotes
          // Check if this paper has existing data that should be preserved
          const hasExistingData =
            p.inputWidth !== null ||
            p.inputHeight !== null ||
            p.pricePerPacket !== null ||
            p.pricePerSheet !== null ||
            p.outputWidth !== null ||
            p.outputHeight !== null;

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

        const hasChanges = nextPapers.some(
          (p: any, i: number) =>
            p.enteredSheets !== prev.operational.papers[i]?.enteredSheets ||
            p.recommendedSheets !==
              prev.operational.papers[i]?.recommendedSheets
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
      const nextPapers = prev.operational.papers.map((p: any, i: number) => {
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

      const hasChanges = nextPapers.some(
        (p: any, i: number) =>
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

  // ===== Plates & Units (Excel-Based) =====
  const { plates, units } = React.useMemo(() => {
    // Always calculate the proper values first using Excel-based logic
    let calculatedPlates = 0;
    let calculatedUnits = 0;

    // Ensure we have products to calculate from
    if (formData.products && formData.products.length > 0) {
      formData.products.forEach((product, productIndex) => {
        const sides = product?.sides ?? "1";
        const printing = product?.printingSelection ?? "Digital";

        // Calculate plates using Excel-based formula
        // The Excel formula calculates PLATES, not units
        try {
          const excelResult = calculateExcelBasedPricing({
            productWidth:
              outputDimensions[productIndex]?.width ||
              product?.flatSize?.width ||
              0,
            productHeight:
              outputDimensions[productIndex]?.height ||
              product?.flatSize?.height ||
              0,
            quantity: product.quantity || 0,
            paperCostPerSheet: 1, // Placeholder for plates calculation
            colors: Math.max(paperColors[productIndex]?.[0]?.length || 1, 1),
            sides: product.sides || "2",
            printingSelection: product.printingSelection || "Offset",
          });

          // Use Excel-calculated plates
          calculatedPlates += excelResult.excelPlates;

          console.log("📊 Excel Plates calculation:", {
            productName: product?.productName,
            productWidth:
              outputDimensions[productIndex]?.width ||
              product?.flatSize?.width ||
              0,
            productHeight:
              outputDimensions[productIndex]?.height ||
              product?.flatSize?.height ||
              0,
            colors: Math.max(paperColors[productIndex]?.[0]?.length || 1, 1),
            sides: product.sides || "2",
            excelPlates: excelResult.excelPlates,
            totalCalculatedPlates: calculatedPlates,
          });
        } catch (error) {
          console.error(
            "❌ Excel plates calculation failed, falling back to original:",
            error
          );
          // Fallback to original calculation if Excel calculation fails
          const currentColors = paperColors[productIndex]?.[0] || [];
          const colorsCount = Math.max(currentColors.length, 1);
          const platesForProduct = printing === "Digital" ? 0 : colorsCount;
          calculatedPlates += platesForProduct;
        }

        // Calculate units using Excel-based formula
        // Formula: =IF([@[Odd or even]]=TRUE,IF([@W]>54,50*$L$2,20*$L$2),IF([@W]>54,50*$L$2,20*$L$2)*2)
        try {
          const excelResult = calculateExcelBasedPricing({
            productWidth:
              outputDimensions[productIndex]?.width ||
              product?.flatSize?.width ||
              0,
            productHeight:
              outputDimensions[productIndex]?.height ||
              product?.flatSize?.height ||
              0,
            quantity: product.quantity || 0,
            paperCostPerSheet: 1, // Placeholder for units calculation
            colors: Math.max(paperColors[productIndex]?.[0]?.length || 1, 1),
            sides: product.sides || "2",
            printingSelection: product.printingSelection || "Offset",
          });

          // Use Excel-calculated units directly
          calculatedUnits += excelResult.units;

          console.log("📊 Excel Units calculation:", {
            productName: product?.productName,
            productWidth:
              outputDimensions[productIndex]?.width ||
              product?.flatSize?.width ||
              0,
            productHeight:
              outputDimensions[productIndex]?.height ||
              product?.flatSize?.height ||
              0,
            colors: Math.max(paperColors[productIndex]?.[0]?.length || 1, 1),
            sides: product.sides || "2",
            excelUnits: excelResult.units,
            totalCalculatedUnits: calculatedUnits,
          });
        } catch (error) {
          console.error(
            "❌ Excel units calculation failed, falling back to original:",
            error
          );
          // Fallback to original calculation if Excel calculation fails
          const productPapers = product.papers || [];
          const totalSheets = productPapers.reduce(
            (acc: any, paper: any, paperIndex: number) => {
              const rec =
                perPaperCalc[productIndex]?.[paperIndex]?.recommendedSheets ??
                0;
              const globalPaperIndex =
                formData.products
                  .slice(0, productIndex)
                  .reduce(
                    (total: number, p: any) => total + p.papers.length,
                    0
                  ) + paperIndex;
              const opPaper = formData.operational.papers[globalPaperIndex];
              const entered = opPaper?.enteredSheets ?? null;
              return acc + (entered != null ? entered : rec);
            },
            0
          );
          calculatedUnits += totalSheets * (sides === "2" ? 2 : 1);
        }
      });
    }

    // Always use calculated values by default
    // Only use user values if they were explicitly entered (not null/undefined)
    const userPlates = formData.operational.plates;
    const userUnits = formData.operational.units;

    return {
      plates:
        userPlates !== null && userPlates !== undefined
          ? userPlates
          : calculatedPlates,
      units:
        userUnits !== null && userUnits !== undefined
          ? userUnits
          : calculatedUnits,
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
      const nextPapers = prev.operational.papers.map((p: any, i: number) => {
        // Find which product and paper index this operational paper corresponds to
        let productIndex = 0;
        let paperIndex = 0;
        let currentPaperCount = 0;

        for (let pi = 0; pi < formData.products.length; pi++) {
          if (
            i >= currentPaperCount &&
            i < currentPaperCount + formData.products[pi].papers.length
          ) {
            productIndex = pi;
            paperIndex = i - currentPaperCount;
            break;
          }
          currentPaperCount += formData.products[pi].papers.length;
        }

        // Get the recommended sheets from the correct product's calculation
        const rec =
          perPaperCalc[productIndex]?.[paperIndex]?.recommendedSheets ??
          p.recommendedSheets;

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
          (p: any, i: number) =>
            p.recommendedSheets ===
              prev.operational.papers[i].recommendedSheets &&
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
  }, [
    perPaperCalc,
    plates,
    units,
    setFormData,
    userEditedSheets,
    formData.products,
  ]);

  // ===== Sync operational papers with product papers =====
  React.useEffect(() => {
    // This effect ensures that operational.papers array is synchronized with product papers
    // When new papers are added in Step 3, we create corresponding operational entries
    const totalProductPapers = formData.products.reduce(
      (total, product) => total + product.papers.length,
      0
    );
    const currentOperationalPapers = formData.operational.papers.length;

    if (totalProductPapers !== currentOperationalPapers) {
      setFormData((prev) => {
        const newOperationalPapers: QuoteFormData["operational"]["papers"] = [];

        // Create operational paper entries for each product's papers
        formData.products.forEach((product, productIndex) => {
          product.papers.forEach((paper: any, paperIndex: number) => {
            // Calculate the global paper index for this product's paper
            const globalPaperIndex = newOperationalPapers.length;
            const existingOpPaper = prev.operational.papers[globalPaperIndex];

            // Get recommended sheets from calculations if available
            // Use the product-specific calculation
            const recommendedSheets =
              perPaperCalc[productIndex]?.[paperIndex]?.recommendedSheets ?? 1;

            // Create new operational paper entry or use existing one
            // IMPORTANT: Preserve existing data when editing existing quotes
            const newOpPaper: QuoteFormData["operational"]["papers"][0] =
              existingOpPaper || {
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
            if (
              !existingOpPaper ||
              !userEditedSheets.has(`paper-${globalPaperIndex}`) ||
              existingOpPaper.enteredSheets ===
                existingOpPaper.recommendedSheets
            ) {
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
  }, [
    formData.products,
    perPaperCalc,
    userEditedSheets,
    setFormData,
    formData.operational.papers.length,
  ]);

  // ===== Validation functions =====
  const validateOutputDimensions = (
    width: number,
    height: number,
    inputWidth: number | null,
    inputHeight: number | null
  ) => {
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
        setUserEditedSheets((prev) => new Set(prev).add(paperKey));
      } else {
        setUserEditedSheets((prev) => {
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
        setUserEditedInputDimensions((prev) => new Set(prev).add(paperKey));
      } else {
        setUserEditedInputDimensions((prev) => {
          const newSet = new Set(prev);
          newSet.delete(paperKey);
          return newSet;
        });
      }
    }

    const newPapers = [...formData.operational.papers];
    newPapers[index] = { ...newPapers[index], [field]: v };

    // Debug logging for manual pricing changes
    if (
      field === "pricePerSheet" ||
      field === "pricePerPacket" ||
      field === "sheetsPerPacket"
    ) {
      console.log("🔧 Manual pricing input changed:", {
        field,
        value: v,
        paperIndex: index,
        newPaperData: newPapers[index],
      });
    }

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

  const handleOutputDimensionChange = (
    productIndex: number,
    field: "width" | "height",
    value: string
  ) => {
    const v = value === "" ? 0 : parseFloat(value);
    setOutputDimensions((prev) => ({
      ...prev,
      [productIndex]: {
        ...prev[productIndex],
        [field]: v,
      },
    }));
  };

  // ===== Modal state =====
  const [openIdx, setOpenIdx] = React.useState<number | null>(null);
  const [showPricingLogic, setShowPricingLogic] = React.useState(false);
  const [showPaperPrice, setShowPaperPrice] = React.useState<number | null>(
    null
  );
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
            if (
              openIdx >= currentPaperCount &&
              openIdx < currentPaperCount + formData.products[pi].papers.length
            ) {
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

  // ===== Fetch suppliers and materials =====
  const fetchSuppliersAndMaterials = async () => {
    try {
      setIsLoadingSuppliers(true);
      console.log("🔄 Fetching suppliers and materials...");

      const response = await fetch("/api/suppliers");
      if (!response.ok) {
        throw new Error(`Failed to fetch suppliers: ${response.status}`);
      }

      const suppliersData = await response.json();
      console.log(
        "📊 Suppliers data received:",
        suppliersData.length,
        "suppliers"
      );
      setSuppliers(suppliersData);

      // Extract all materials from suppliers
      const allMaterials = suppliersData.reduce((acc: any[], supplier: any) => {
        if (supplier.materials && Array.isArray(supplier.materials)) {
          const materialsWithSupplier = supplier.materials.map(
            (material: any) => ({
              id: material.id,
              materialId: material.materialId,
              name: material.name,
              gsm: material.gsm,
              cost: material.cost,
              unit: material.unit,
              sheetsPerPacket: material.sheetsPerPacket,
              status: material.status,
              supplierName: supplier.name,
              supplierContact: supplier.contact,
              supplierEmail: supplier.email,
              supplierPhone: supplier.phone,
              supplierCountry: supplier.country,
              supplierCity: supplier.city,
            })
          );
          acc.push(...materialsWithSupplier);
        }
        return acc;
      }, []);

      console.log("📦 Total materials extracted:", allMaterials.length);
      setMaterials(allMaterials);
    } catch (error) {
      console.error("❌ Error fetching suppliers:", error);
      // Keep the initial sample data if API fails
      console.log("Using fallback data");
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
    console.log(
      "DEBUG: Step 4 useEffect triggered - refreshing finishing data"
    );
    console.log("DEBUG: Current formData.products:", formData.products);

    // Get all unique finishing names from Step 3 selections
    const allFinishingNames = new Set<string>();

    formData.products.forEach((product) => {
      if (product.finishing && Array.isArray(product.finishing)) {
        product.finishing.forEach((finishingName: any) => {
          // Extract base finishing name (remove side suffix)
          const baseFinishingName = finishingName.split("-")[0];
          allFinishingNames.add(baseFinishingName);
        });
      }
    });

    console.log(
      "DEBUG: Found finishing names from Step 3:",
      Array.from(allFinishingNames)
    );

    // Update operational finishing with auto-calculated costs
    setFormData((prev) => {
      // COMPLETELY CLEAR old finishing data and start fresh
      const newOperationalFinishing: { name: string; cost: number | null }[] =
        [];

      // Add only the finishing options that are actually selected in Step 3
      // Note: Costs are now calculated automatically in the display, so we don't need to pre-calculate them here
      allFinishingNames.forEach((finishingName) => {
        // Skip any incorrect "Uv spot" entries
        if (
          finishingName.toLowerCase() === "uv spot" &&
          finishingName !== "UV Spot"
        ) {
          console.log('DEBUG: Skipping incorrect "Uv spot" entry');
          return;
        }

        // Only add if it's actually selected in Step 3
        const isSelectedInStep3 = formData.products.some(
          (product) =>
            product.finishing &&
            product.finishing.some((f: any) => {
              const baseName = f.split("-")[0];
              return baseName.toLowerCase() === finishingName.toLowerCase();
            })
        );

        if (isSelectedInStep3) {
          console.log("DEBUG: Adding finishing:", finishingName);
          newOperationalFinishing.push({
            name: finishingName,
            cost: null, // Cost will be calculated automatically based on formula
          });
        } else {
          console.log(
            "DEBUG: Skipping finishing not selected in Step 3:",
            finishingName
          );
        }
      });

      console.log(
        "DEBUG: Setting new operational finishing:",
        newOperationalFinishing
      );

      return {
        ...prev,
        operational: {
          ...prev.operational,
          finishing: newOperationalFinishing,
        },
      };
    });
  }, [formData.products, setFormData]);

  // ===== Clean up incorrect UV Spot entries =====
  React.useEffect(() => {
    setFormData((prev) => {
      const hasIncorrectUVSpot = prev.operational.finishing.some(
        (f: any) => f.name.toLowerCase() === "uv spot" && f.name !== "UV Spot"
      );

      if (hasIncorrectUVSpot) {
        console.log("DEBUG: Found incorrect UV Spot entry, cleaning up...");
        const cleanedFinishing = prev.operational.finishing.filter(
          (f: any) =>
            !(f.name.toLowerCase() === "uv spot" && f.name !== "UV Spot")
        );

        return {
          ...prev,
          operational: {
            ...prev.operational,
            finishing: cleanedFinishing,
          },
        };
      }

      return prev;
    });
  }, [setFormData]);

  // ===== Auto-update finishing costs when impressions change =====
  React.useEffect(() => {
    console.log("DEBUG: Impressions changed, recalculating finishing costs");
    console.log(
      "DEBUG: Current impressions:",
      formData.operational.impressions
    );

    // Force re-render of finishing cost calculations
    // The calculateIndividualFinishingCost function will now use the updated impressions value
  }, [formData.operational.impressions]);

  // ===== Store individual product costs in formData =====
  React.useEffect(() => {
    // console.log('🔄 Step4Operational: Calculating and storing individual product costs...');

    const individualCosts = calculateIndividualProductCosts();
    // console.log('📊 Individual product costs calculated:', individualCosts);

    setFormData((prev) => ({
      ...prev,
      individualProductCosts: individualCosts,
    }));
  }, [
    formData.operational.papers,
    formData.operational.plates,
    formData.operational.units,
    formData.operational.finishing,
    formData.products,
    // Removed perPaperCalc and additionalCosts to prevent infinite loop
    // These are derived from formData and cause unnecessary re-renders
  ]);

  // ===== Force default input dimensions on component mount =====
  React.useEffect(() => {
    // This effect runs once on mount to ensure defaults are set
    setFormData((prev) => {
      const nextPapers = prev.operational.papers.map((p: any, i: number) => {
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

      const hasChanges = nextPapers.some(
        (p: any, i: number) =>
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
      filtered = filtered.filter(
        (material) =>
          material.name
            .toLowerCase()
            .includes(supplierSearchTerm.toLowerCase()) ||
          material.gsm
            ?.toLowerCase()
            .includes(supplierSearchTerm.toLowerCase()) ||
          material.supplierName
            .toLowerCase()
            .includes(supplierSearchTerm.toLowerCase())
      );
    }

    // Filter by supplier
    if (selectedSupplier) {
      filtered = filtered.filter(
        (material) => material.supplierName === selectedSupplier
      );
    }

    // Filter by GSM range
    if (selectedGSM) {
      const [min, max] = selectedGSM.split("-").map(Number);
      if (max) {
        filtered = filtered.filter((material) => {
          const gsm = parseInt(material.gsm);
          return gsm >= min && gsm <= max;
        });
      } else if (selectedGSM === "400+") {
        filtered = filtered.filter((material) => {
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

  const ROUNDUP0 = (x: number) => Math.ceil(x);
  const ROUNDDOWN0 = (x: number) => Math.floor(x);

  // ===== Enhanced pricing calculation with Excel formula integration =====
  const calculateTotalCost = (
    opPaper: any,
    actualSheetsNeeded: number,
    productData?: any,
    productIndex?: number
  ) => {
    if (!opPaper) return 0;

    // Get paper cost per sheet - prioritize Step 4 manual input, fallback to Step 3 database
    let paperCostPerSheet = opPaper.pricePerSheet;

    // If no manual input, try packet pricing
    if (
      paperCostPerSheet == null &&
      opPaper.pricePerPacket != null &&
      opPaper.sheetsPerPacket != null &&
      opPaper.sheetsPerPacket > 0
    ) {
      paperCostPerSheet = opPaper.pricePerPacket / opPaper.sheetsPerPacket;
    }

    // If still no price, try materials database
    if (
      paperCostPerSheet == null &&
      productData &&
      productIndex !== undefined
    ) {
      const product = formData.products[productIndex];
      if (product && product.papers && product.papers.length > 0) {
        // Find the paper that matches this operational paper
        const matchingPaper = product.papers.find(
          (p: any) =>
            p.name === opPaper.name ||
            (p.gsm && opPaper.gsm && p.gsm === opPaper.gsm)
        );
        if (matchingPaper) {
          const materialPrice = getPaperPriceFromMaterials(
            matchingPaper.name,
            matchingPaper.gsm
          );
          if (materialPrice != null) {
            paperCostPerSheet = materialPrice;
          }
        }
      }
    }

    // Final fallback
    if (paperCostPerSheet == null) {
      paperCostPerSheet = 0;
    }

    // If we have product data, use Excel formula with candidate-based logic
    if (productData && productIndex !== undefined) {
      const product = formData.products[productIndex];
      if (!product) return 0;

      // Get product dimensions from Step 3
      const pieceH =
        outputDimensions[productIndex]?.height ||
        product?.flatSize?.height ||
        0;
      const pieceW =
        outputDimensions[productIndex]?.width || product?.flatSize?.width || 0;

      // Get quantity
      const qty = Number(product.quantity) || 0;

      // Get sides and colours
      const sides = Number(product.sides) || 2;

      // Debug colors calculation
      console.log("🎨 calculateTotalCost - product.colors:", product.colors);
      console.log(
        "🎨 calculateTotalCost - front:",
        product.colors?.front,
        "back:",
        product.colors?.back
      );

      // Extract number of colors from Step 3 selection
      // Handle formats like "4 Colors (CMYK)", "4+1 Colors", "4+2 Colors"
      const parseColors = (colorStr: any): number => {
        if (!colorStr) return 0;
        const str = colorStr.toString();

        // Check for "4+1" or "4+2" format
        const plusMatch = str.match(/(\d+)\+(\d+)/);
        if (plusMatch) {
          const base = parseInt(plusMatch[1]);
          const additional = parseInt(plusMatch[2]);
          return base + additional;
        }

        // Fallback to single number
        const singleMatch = str.match(/\d+/);
        return singleMatch ? parseInt(singleMatch[0]) : 0;
      };

      const frontColors = parseColors(product.colors?.front);
      const backColors = parseColors(product.colors?.back);

      // For 2-sided printing, use max of front/back (same plates used)
      const rawColours = Math.max(frontColors, backColors) || 4;

      // Check printing selection
      const isDigital = product?.printingSelection === "Digital";

      // Color categorization: ONLY apply for Digital (1-3 colors = 1 color, 4+ colors = 4 colors)
      // For Offset, use actual color count for accurate plate cost calculation
      const colours = isDigital ? (rawColours <= 3 ? 1 : 4) : rawColours;

      console.log(
        "🎨 calculateTotalCost - calculated colours:",
        colours,
        "(isDigital:",
        isDigital,
        ", rawColours:",
        rawColours,
        ")"
      );

      // Get materials database price for candidate selection
      const paperName = product.papers[0]?.name || "";
      const paperGSM = product.papers[0]?.gsm || "";
      const materialPrice = getPaperPriceFromMaterials(paperName, paperGSM);

      // Use the complete candidate rows from Excel
      const candidates = CUT_SIZE_CANDIDATES;

      // Decide which row to use (same logic as pricing summary)
      const userParentW = opPaper?.inputWidth;
      const userParentH = opPaper?.inputHeight;

      let chosenRow;
      if (userParentW && userParentH) {
        chosenRow = candidates.find(
          (r) =>
            Number(r.parentW) === Number(userParentW) &&
            Number(r.parentH) === Number(userParentH)
        );
      }

      const base = { pieceW, pieceH, qty, sides, colours, paperCostPerSheet };

      if (!chosenRow) {
        // rank all rows by total and take cheapest (avoiding zero values)
        // Use materials database price for candidate selection to avoid price-dependent sheet count changes
        const baseForSelection = {
          ...base,
          paperCostPerSheet: materialPrice ?? 10, // Use materials DB price for selection, not user input
        };
        const rankedRows = pickCheapestTotal(baseForSelection, candidates);
        if (rankedRows.length > 0) {
          chosenRow = rankedRows[0];
        } else {
          console.warn(
            "⚠️ No valid offset calculation results found - all have zero total"
          );
          return 0; // Return 0 cost if no valid results
        }
      }

      if (isDigital) {
        // Debug input values - COMMENTED OUT FOR PRODUCTION
        /*
        console.log('🔍 calculateTotalCost - Digital inputs:', {
          productIndex,
          productName: product.productName,
          qty,
          pieceW,
          pieceH,
          sides,
          colours,
          paperCostPerSheet,
          isDigital
        });
        */

        // Use Digital calculation for Digital products
        const digitalResults = calcDigitalCosting({
          qty,
          piece: { w: pieceW, h: pieceH },
          sides: sides as 1 | 2,
          colorsF: colours as 1 | 2 | 4,
          colorsB: undefined,
          bleed: 0.3,
          gapX: 0.5,
          gapY: 0.5,
          margins: { left: 1, right: 1, top: 1, bottom: 1, gripperTop: 0 },
          perClick: 1.0, // Digital click cost per 1000 impressions
          parentCost: paperCostPerSheet || 0, // Ensure we have a valid number
          wasteParents: 3,
          allowRotate: true,
          useExcelLogic: true, // Use Excel calculation logic
        });

        // Debug calculation results - COMMENTED OUT FOR PRODUCTION
        /*
        console.log('🔍 calculateTotalCost - Digital calculation results:', {
          productIndex,
          productName: product.productName,
          isDigital,
          digitalResults,
          firstResult: digitalResults?.[0]
        });
        */

        // Return the first result's total (should be the best option)
        if (
          digitalResults &&
          digitalResults.length > 0 &&
          digitalResults[0].total !== undefined &&
          !isNaN(digitalResults[0].total)
        ) {
          return digitalResults[0].total;
        } else {
          // console.warn('⚠️ No valid digital calculation results found:', digitalResults);
          return 0;
        }
      } else {
        // Use Offset calculation for Offset products
        if (!chosenRow) {
          console.warn("⚠️ No chosenRow available for offset calculation");
          return 0;
        }
        const excelResult = calcRowTotal(base, chosenRow);

        // Also compute sheets using Excel logic so Recommended/Enter Sheets matches Excel
        const excelOffset = calcOffsetCosting({
          qty,
          parent: { w: chosenRow.parentW, h: chosenRow.parentH },
          press: { w: 35, h: 50, label: "35x50" },
          piece: { w: pieceW, h: pieceH },
          sides: sides as 1 | 2,
          colorsF: colours as 1 | 2 | 4,
          colorsB: undefined,
          pricing: {
            parentCost: paperCostPerSheet,
            plateCost: 20,
            makeReadySetup: 0,
            makeReadySheets: 0,
            runPer1000: 0,
            cutOpRate: 0,
          },
          bleed: 0.3,
          gapX: 0.5,
          gapY: 0.5,
          allowRotate: true,
          useExcelLogic: true,
        });

        const recommendedSheets = excelOffset.parents;

        // Debug logging for testing - COMMENTED OUT FOR PRODUCTION
        /*
        console.log('🔍 calculateTotalCost - Offset calculation:', {
          productIndex,
          productName: product.productName,
          isDigital,
          chosenRow,
          excelResult,
          excelParents: excelOffset.parents
        });
        */

        return excelResult.total;
      }
    }

    // Fallback to original packet + sheet logic for backward compatibility
    const { pricePerSheet, pricePerPacket, sheetsPerPacket } = opPaper;

    // If only packet pricing is available
    if (
      pricePerPacket != null &&
      sheetsPerPacket != null &&
      sheetsPerPacket > 0 &&
      pricePerSheet == null
    ) {
      const packetsNeeded = Math.ceil(actualSheetsNeeded / sheetsPerPacket);
      return packetsNeeded * pricePerPacket;
    }

    // If only sheet pricing is available
    if (
      pricePerSheet != null &&
      (pricePerPacket == null ||
        sheetsPerPacket == null ||
        sheetsPerPacket <= 0)
    ) {
      return actualSheetsNeeded * pricePerSheet;
    }

    // If both are available, use packet first, then sheet pricing for remaining
    if (
      pricePerSheet != null &&
      pricePerPacket != null &&
      sheetsPerPacket != null &&
      sheetsPerPacket > 0
    ) {
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
  const calculateIndividualFinishingCost = (
    finishingName: string,
    product: any,
    productIndex: number
  ) => {
    // Use the same logic as the display to get sheet count
    const actualSheetsNeeded =
      formData.operational.papers[productIndex]?.enteredSheets ??
      perPaperCalc[productIndex]?.[0]?.recommendedSheets ??
      0;
    // Use impressions field if available, otherwise fall back to product quantity
    const totalQuantity =
      formData.operational.impressions || product.quantity || 0;

    console.log("DEBUG: calculateIndividualFinishingCost called with:");
    console.log("  finishingName:", finishingName);
    console.log("  productIndex:", productIndex);
    console.log("  actualSheetsNeeded:", actualSheetsNeeded);
    console.log("  totalQuantity:", totalQuantity);

    // Extract base finishing name (remove side suffix like "-Front", "-Back", "-Both")
    const baseFinishingName = finishingName.split("-")[0];
    const sideInfo = finishingName.includes("-")
      ? finishingName.split("-")[1]
      : "Front";
    let finishingCost = 0;

    switch (baseFinishingName) {
      case "Lamination":
        // a. Laminated: minimum cost is 75 AED, and 0.75 AED per sheet. (formula: 75+(sheets*0.75))
        finishingCost = 75 + actualSheetsNeeded * 0.75;
        console.log(
          "DEBUG: Lamination calculation: 75 + (" +
            actualSheetsNeeded +
            " * 0.75) = " +
            finishingCost
        );

        // Double the cost if applied to both sides
        if (sideInfo === "Both") {
          finishingCost = finishingCost * 2;
        }
        break;

      case "Velvet Lamination":
        // b. Velvet laminated: minimum cost is 100 AED, and 1 AED per sheet. (formula: 100+(sheet*1))
        finishingCost = 100 + actualSheetsNeeded * 1.0;

        // Double the cost if applied to both sides
        if (sideInfo === "Both") {
          finishingCost = finishingCost * 2;
        }
        break;

      case "Embossing":
        // c. Embossing: impression charge 50 AED per 1000. Minimum charge is 75 AED.
        // by default it set as 1000 impression and minimum is 75 AED.
        // formula: 75+(50AED per 1000 impression). set as minimum impression as 1000 so by default is (75+50)
        const embossingImpressions = Math.max(1000, totalQuantity); // Minimum 1000 impressions
        const embossingImpressionCost =
          Math.ceil(embossingImpressions / 1000) * 50;
        finishingCost = Math.max(75, embossingImpressionCost);

        // Double the cost if applied to both sides
        if (sideInfo === "Both") {
          finishingCost = finishingCost * 2;
        }
        break;

      case "Foiling":
        // d. FOILLING: Impression charge 75 AED per 1000. Minimum cost is 75. (formula: 75+75 per 1000 impression)
        const foilingImpressions = Math.max(1000, totalQuantity); // Minimum 1000 impressions
        const foilingImpressionCost = Math.ceil(foilingImpressions / 1000) * 75;
        finishingCost = Math.max(75, foilingImpressionCost);

        // Double the cost if applied to both sides
        if (sideInfo === "Both") {
          finishingCost = finishingCost * 2;
        }
        break;

      case "Die Cutting":
        // e. Die cutting: Impression charge 50 AED per 1000. Minimum cost is 75 AED. formula: (75+50 per 1000 impression)
        // specific size: Minimum price: 75 AED for A5, 100 AED for A4, 150 AED for A3, 200 AED for A2
        const dieCuttingImpressions = Math.max(1000, totalQuantity); // Minimum 1000 impressions
        const dieCuttingImpressionCost =
          Math.ceil(dieCuttingImpressions / 1000) * 50;

        // Min charges by size
        let minCharge = 75; // Default A5
        if (
          product.flatSize &&
          product.flatSize.width &&
          product.flatSize.height
        ) {
          const area = product.flatSize.width * product.flatSize.height;
          if (area <= 210 * 148) {
            // A5 size
            minCharge = 75;
          } else if (area <= 297 * 210) {
            // A4 size
            minCharge = 100;
          } else if (area <= 420 * 297) {
            // A3 size
            minCharge = 150;
          } else {
            // A2 and larger
            minCharge = 200;
          }
        }
        finishingCost = Math.max(minCharge, dieCuttingImpressionCost);
        break;

      case "UV Spot":
        // f. UV Spot: 350 AED per 1000 impression with 350 AED minimum of cost. formula: (350+350 per 1000 impression)
        const uvSpotImpressions = Math.max(1000, totalQuantity); // Minimum 1000 impressions
        const uvSpotImpressionCost = Math.ceil(uvSpotImpressions / 1000) * 350;
        finishingCost = Math.max(350, uvSpotImpressionCost);
        console.log("DEBUG: UV Spot calculation:");
        console.log("  totalQuantity:", totalQuantity);
        console.log("  uvSpotImpressions:", uvSpotImpressions);
        console.log("  uvSpotImpressionCost:", uvSpotImpressionCost);
        console.log("  finishingCost:", finishingCost);

        // Double the cost if applied to both sides
        if (sideInfo === "Both") {
          finishingCost = finishingCost * 2;
        }
        break;

      case "Folding":
        // g. Folding charges: impression cost is 25 AED per 1000 impression. minimum cost is 25. formula: 25+25 per 1000 impression
        const foldingImpressions = Math.max(1000, totalQuantity); // Minimum 1000 impressions
        const foldingImpressionCost = Math.ceil(foldingImpressions / 1000) * 25;
        finishingCost = Math.max(25, foldingImpressionCost);
        break;

      case "Padding":
        // Fixed minimum charge 25 dhs
        finishingCost = 25;
        break;

      case "Varnishing":
        // Fixed minimum charge 30 dhs
        finishingCost = 30;
        break;

      default:
        // Fallback to manual cost if set in operational finishing
        const finishingItem = formData.operational.finishing.find(
          (f: any) => f.name === finishingName
        );
        if (finishingItem && finishingItem.cost != null) {
          finishingCost = finishingItem.cost * actualSheetsNeeded;
        }
        break;
    }

    console.log(
      "DEBUG: Calculated cost for",
      finishingName,
      ":",
      finishingCost
    );
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
        product.finishing.forEach((finishingName: any) => {
          allFinishingTypes.add(finishingName);
        });
      }
    });

    // Calculate cost for each unique finishing type once
    allFinishingTypes.forEach((finishingName) => {
      // Use the first product that has this finishing type for calculation
      const productWithFinishing = formData.products.find(
        (product) =>
          product.finishing && product.finishing.includes(finishingName)
      );

      if (productWithFinishing) {
        const productIndex = formData.products.indexOf(productWithFinishing);
        totalFinishingCost += calculateIndividualFinishingCost(
          finishingName,
          productWithFinishing,
          productIndex
        );
      }
    });

    return totalFinishingCost;
  };

  // ===== Calculate individual product costs =====
  const calculateIndividualProductCosts = () => {
    const productCosts = formData.products.map(
      (product: any, productIndex: number) => {
        let productTotalCost = 0;

        // Calculate paper cost for this specific product
        // Find the operational papers that belong to this specific product
        let startIndex = 0;
        for (let i = 0; i < productIndex; i++) {
          startIndex += formData.products[i]?.papers?.length || 0;
        }
        const endIndex = startIndex + (product.papers?.length || 0);
        const productPapers = formData.operational.papers.slice(
          startIndex,
          endIndex
        );

        productPapers.forEach((opPaper: any, paperIndex: number) => {
          const actualSheetsNeeded =
            opPaper.enteredSheets ??
            perPaperCalc[productIndex]?.[paperIndex]?.recommendedSheets ??
            0;
          productTotalCost += calculateTotalCost(
            opPaper,
            actualSheetsNeeded,
            product,
            productIndex
          );
        });

        // Calculate finishing cost for this specific product (separately, not added to productTotalCost)
        const finishingCost = product.finishing
          ? product.finishing.reduce(
              (total: number, finishingName: any) =>
                total +
                calculateIndividualFinishingCost(
                  finishingName,
                  product,
                  productIndex
                ),
              0
            )
          : 0;

        return {
          productIndex,
          productName: product.productName,
          quantity: product.quantity,
          pricingSummary: productTotalCost, // Paper + plates + units cost
          finishingCost: product.finishing
            ? product.finishing.reduce(
                (total: number, finishingName: any) =>
                  total +
                  calculateIndividualFinishingCost(
                    finishingName,
                    product,
                    productIndex
                  ),
                0
              )
            : 0,
          additionalCost: 0, // Additional costs are shared across all products
          totalCost: productTotalCost,
        };
      }
    );

    return productCosts;
  };

  // ===== Calculate total project cost =====
  const calculateTotalProjectCost = () => {
    let totalCost = 0;

    // Paper costs
    formData.operational.papers.forEach((opPaper: any, index: number) => {
      const actualSheetsNeeded =
        opPaper.enteredSheets ??
        perPaperCalc[
          Math.floor(index / formData.products[0]?.papers.length || 1)
        ]?.[index % (formData.products[0]?.papers.length || 1)]
          ?.recommendedSheets ??
        0;
      const productData =
        formData.products[
          Math.floor(index / (formData.products[0]?.papers.length || 1))
        ];
      totalCost += calculateTotalCost(
        opPaper,
        actualSheetsNeeded,
        productData,
        Math.floor(index / (formData.products[0]?.papers.length || 1))
      );
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
    const totalQuantity = formData.products.reduce(
      (acc, product) => acc + (product.quantity || 0),
      0
    );
    return totalQuantity > 0 ? totalCost / totalQuantity : 0;
  };

  // ===== Get pricing breakdown for display =====
  const getPricingBreakdown = (opPaper: any, actualSheetsNeeded: number) => {
    if (!opPaper) return { breakdown: [], totalCost: 0 };

    const { pricePerSheet, pricePerPacket, sheetsPerPacket } = opPaper;
    const breakdown: Array<{
      type: string;
      quantity: number;
      unitPrice: number;
      total: number;
      description: string;
    }> = [];
    let totalCost = 0;

    // If only packet pricing is available
    if (
      pricePerPacket != null &&
      sheetsPerPacket != null &&
      sheetsPerPacket > 0 &&
      pricePerSheet == null
    ) {
      const packetsNeeded = Math.ceil(actualSheetsNeeded / sheetsPerPacket);
      const cost = packetsNeeded * pricePerPacket;
      breakdown.push({
        type: "packet",
        quantity: packetsNeeded,
        unitPrice: pricePerPacket,
        total: cost,
        description: `${packetsNeeded} packet(s) × ${fmt(pricePerPacket)}`,
      });
      totalCost = cost;
    }

    // If only sheet pricing is available
    else if (
      pricePerSheet != null &&
      (pricePerPacket == null ||
        sheetsPerPacket == null ||
        sheetsPerPacket <= 0)
    ) {
      const cost = actualSheetsNeeded * pricePerSheet;
      breakdown.push({
        type: "sheet",
        quantity: actualSheetsNeeded,
        unitPrice: pricePerSheet,
        total: cost,
        description: `${actualSheetsNeeded} sheet(s) × ${fmt(pricePerSheet)}`,
      });
      totalCost = cost;
    }

    // If both are available, use packet first, then sheet pricing for remaining
    else if (
      pricePerSheet != null &&
      pricePerPacket != null &&
      sheetsPerPacket != null &&
      sheetsPerPacket > 0
    ) {
      const fullPackets = Math.floor(actualSheetsNeeded / sheetsPerPacket);
      const remainingSheets = actualSheetsNeeded % sheetsPerPacket;

      if (fullPackets > 0) {
        const packetCost = fullPackets * pricePerPacket;
        breakdown.push({
          type: "packet",
          quantity: fullPackets,
          unitPrice: pricePerPacket,
          total: packetCost,
          description: `${fullPackets} packet(s) × ${fmt(pricePerPacket)}`,
        });
        totalCost += packetCost;
      }

      if (remainingSheets > 0) {
        const sheetCost = remainingSheets * pricePerSheet;
        breakdown.push({
          type: "sheet",
          quantity: remainingSheets,
          unitPrice: pricePerSheet,
          total: sheetCost,
          description: `${remainingSheets} sheet(s) × ${fmt(pricePerSheet)}`,
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
        console.log("Pricing data loaded:", { digital, offset });
      } catch (error) {
        console.error("Error loading pricing data:", error);
      } finally {
        setLoadingPricing(false);
      }
    };

    loadPricingData();
  }, []);

  // Calculate costing for the first product
  const calculateCosting = (product: any, productIndex: number = 0) => {
    if (!digitalPricing || !offsetPricing) {
      console.log("Pricing data not loaded yet");
      return;
    }

    // Validate product data
    const width = product.flatSize?.width || 0;
    const height = product.flatSize?.height || 0;
    const quantity = product.quantity || 0;
    const sides = parseInt(product.sides || "1") || 1;
    const colorsFrontRaw = parseInt(product.colors?.front || "0") || 0;
    const colorsBackRaw = parseInt(product.colors?.back || "0") || 0;

    // Color categorization: 1-3 colors = 1 color, 4+ colors = 4 colors
    const colorsFront = colorsFrontRaw <= 3 ? 1 : 4;
    const colorsBack = colorsBackRaw <= 3 ? 1 : 4;

    console.log("Calculating costing with:", {
      width,
      height,
      quantity,
      sides,
      colorsFront,
      colorsBack,
      digitalPricing,
      offsetPricing,
    });

    if (width <= 0 || height <= 0 || quantity <= 0) {
      console.log("Invalid product dimensions or quantity");
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
        allowRotate: true,
      });

      console.log("Digital costing results:", digitalResults);
      setDigitalCostingResults(digitalResults);

      // For Digital printing, automatically select the cheapest option (avoiding zero values)
      if (digitalResults.length > 0) {
        const validResults = digitalResults.filter(
          (result) => result.total > 0
        );
        if (validResults.length > 0) {
          const cheapest = validResults.reduce((min, current) =>
            current.total < min.total ? current : min
          );
          setSelectedDigitalOption(cheapest.option);
        } else {
          console.warn(
            "⚠️ All digital calculation results have zero total - no valid option found"
          );
        }
      }

      // Calculate dynamic press dimensions for offset costing
      let dynamicPressWidth = 35;
      let dynamicPressHeight = 50;
      let dynamicPressLabel = "35×50 cm";

      // Use outputDimensions if available (from Step 3), otherwise fall back to width/height
      let productWidth, productHeight;
      if (
        formData &&
        productIndex !== undefined &&
        formData.outputDimensions &&
        formData.outputDimensions[productIndex]
      ) {
        productWidth = formData.outputDimensions[productIndex].width;
        productHeight = formData.outputDimensions[productIndex].height;
        console.log("🔍 Using outputDimensions for offset costing:", {
          width: productWidth,
          height: productHeight,
          productIndex,
          source: "outputDimensions",
        });
      } else if (width && height) {
        productWidth = width;
        productHeight = height;
        console.log("🔍 Using width/height for offset costing:", {
          width: productWidth,
          height: productHeight,
          source: "width/height",
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
          dynamicPressLabel = pressDimension.label;
          console.log(
            "🎯 Using dynamic press for offset costing:",
            pressDimension
          );
        }
      }

      // Calculate offset costing with dynamic press dimensions
      const offsetResult = calcOffsetCosting({
        qty: quantity,
        parent: { w: 100, h: 70 }, // PARENT stock
        press: {
          w: dynamicPressWidth,
          h: dynamicPressHeight,
          label: dynamicPressLabel,
        }, // Dynamic press dimensions
        piece: { w: width, h: height },
        sides: sides as 1 | 2,
        colorsF: colorsFront as 1 | 2 | 4,
        colorsB: colorsBack as 1 | 2 | 4,
        pricing: offsetPricing,
        bleed: product.bleed || 0.3,
        gapX: product.gap || 0.5,
        gapY: product.gap || 0.5,
        allowRotate: true,
      });

      console.log("Offset costing result:", offsetResult);
      setOffsetCostingResult(offsetResult);

      // Set default selection to dynamic press if enabled
      if (offsetResult.pressPerParent > 0 && !selectedOffsetPress) {
        setSelectedOffsetPress(dynamicPressLabel);
      }
    } catch (error) {
      console.error("Error calculating costing:", error);
    }
  };

  // Trigger costing calculation when product changes
  React.useEffect(() => {
    if (formData.products.length > 0 && digitalPricing && offsetPricing) {
      calculateCosting(formData.products[0], 0);
    }
  }, [formData.products, digitalPricing, offsetPricing]);

  // ===== Render =====
  return (
    <div className="space-y-6 md:space-y-8 px-4 md:px-0">
      {/* Header */}
      <div className="text-center space-y-3">
        <h3 className="text-xl md:text-2xl font-bold text-slate-900">
          Operational Details
        </h3>
        <p className="text-sm md:text-base text-slate-600">
          Configure paper specifications, costs, and production details
        </p>
      </div>

      {formData.products.map((product, productIndex) => (
        <div key={productIndex} className="space-y-6 md:space-y-8">
          {/* Product Header */}
          <div className="bg-[#27aae1]/10 rounded-xl border border-[#27aae1]/30 p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h4 className="text-lg md:text-xl font-bold text-[#27aae1] flex items-center">
                  <Package className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3" />
                  Product {productIndex + 1}:{" "}
                  {product.productName || `Product ${productIndex + 1}`}
                </h4>
                <div className="mt-2 text-[#27aae1] text-sm md:text-base">
                  Quantity: {product.quantity || 0} | Sides: {product.sides} |
                  Printing: {product.printingSelection}
                </div>
              </div>
              {/* Product Color Summary Badge */}
              {(() => {
                const totalColors = product.papers.reduce(
                  (total: any, _: any, paperIdx: number) => {
                    return (
                      total +
                      (paperColors[productIndex]?.[paperIdx]?.length || 0)
                    );
                  },
                  0
                );

                if (totalColors > 0) {
                  return (
                    <div className="flex items-center gap-2 px-3 md:px-4 py-2 bg-[#ea078b]/20 border border-[#ea078b]/50 rounded-full self-start sm:self-auto">
                      <Palette className="w-4 h-4 text-[#ea078b]" />
                      <span className="text-sm font-semibold text-[#ea078b]">
                        {totalColors} color{totalColors !== 1 ? "s" : ""} total
                      </span>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </div>

          {product.papers.map((paper: any, paperIndex: number) => {
            // Calculate the global paper index for this product's paper
            let globalPaperIndex = 0;
            for (let pi = 0; pi < productIndex; pi++) {
              globalPaperIndex += formData.products[pi].papers.length;
            }
            globalPaperIndex += paperIndex;

            const opPaper = formData.operational.papers[globalPaperIndex];
            const { layout, recommendedSheets, pricePerSheet } = perPaperCalc[
              productIndex
            ]?.[paperIndex] ?? {
              layout: {
                usableW: 0,
                usableH: 0,
                itemsPerSheet: 0,
                efficiency: 0,
                orientation: "normal" as const,
                itemsPerRow: 0,
                itemsPerCol: 0,
              },
              recommendedSheets: 0,
              pricePerSheet: null as number | null,
            };

            const inputWidth = opPaper?.inputWidth ?? null;
            const inputHeight = opPaper?.inputHeight ?? null;
            const qty = product?.quantity ?? 0;
            const enteredSheets = opPaper?.enteredSheets ?? null;

            const sheetsNeeded =
              layout.itemsPerSheet > 0
                ? Math.ceil(qty / layout.itemsPerSheet)
                : 0;
            const actualSheetsNeeded = enteredSheets
              ? Math.max(sheetsNeeded, enteredSheets)
              : sheetsNeeded;
            const totalItemsPossible =
              actualSheetsNeeded * layout.itemsPerSheet;

            // Validation checks
            const dimensionError = validateOutputDimensions(
              outputDimensions[productIndex]?.width ?? 0,
              outputDimensions[productIndex]?.height ?? 0,
              inputWidth,
              inputHeight
            );

            return (
              <div
                key={`${productIndex}-${paperIndex}`}
                className="space-y-4 md:space-y-6"
              >
                {/* Paper Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <h4 className="text-base md:text-lg font-semibold text-slate-800 flex items-center">
                      <Package className="w-4 h-4 md:w-5 md:h-5 mr-2 text-[#27aae1]" />
                      <span className="text-[#27aae1]">
                        {paper.name
                          ? `${paper.name}${
                              paper.gsm ? ` ${paper.gsm}gsm` : ""
                            }`
                          : `Paper ${paperIndex + 1}${
                              paper.gsm ? ` ${paper.gsm}gsm` : ""
                            }`}
                      </span>
                    </h4>
                    {/* Color Count Badge */}
                    {paperColors[productIndex]?.[paperIndex]?.length > 0 && (
                      <div className="flex items-center gap-2 px-3 py-1 bg-[#ea078b]/10 border border-[#ea078b]/30 rounded-full">
                        <Palette className="w-3 h-3 text-[#ea078b]" />
                        <span className="text-xs font-medium text-[#ea078b]">
                          {paperColors[productIndex][paperIndex].length} color
                          {paperColors[productIndex][paperIndex].length !== 1
                            ? "s"
                            : ""}
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
                      <span className="hidden sm:inline">
                        View Cost Breakdown
                      </span>
                      <span className="sm:hidden">Cost Breakdown</span>
                    </Button>
                  </div>
                </div>

                {/* Dimension Validation Warning */}
                {dimensionError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center">
                      <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                      <span className="text-red-800 font-medium">
                        {dimensionError}
                      </span>
                    </div>
                  </div>
                )}

                {/* Output Dimensions Required Warning */}
                {(!outputDimensions[productIndex]?.width ||
                  !outputDimensions[productIndex]?.height) && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-center">
                      <AlertTriangle className="w-5 h-5 text-amber-600 mr-2" />
                      <div>
                        <span className="text-amber-800 font-medium">
                          Output dimensions required
                        </span>
                        <div className="text-amber-700 text-sm mt-1">
                          Please set the output item dimensions in Step 3 before
                          configuring operational details. This ensures accurate
                          sheet calculations and cost estimates.
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
                          <span className="ml-2 text-xs text-[#27aae1] font-normal">
                            (Default: 100×70 cm)
                          </span>
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
                                handlePaperOpChange(
                                  globalPaperIndex,
                                  "inputWidth",
                                  e.target.value
                                )
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
                                handlePaperOpChange(
                                  globalPaperIndex,
                                  "inputHeight",
                                  e.target.value
                                )
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
                          <span className="ml-2 text-xs text-[#27aae1] font-normal">
                            (From Step 3 - Read Only)
                          </span>
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
                                dimensionError ? "border-red-300 bg-red-50" : ""
                              }`}
                              value={(() => {
                                const product = formData.products[productIndex];
                                const width =
                                  outputDimensions[productIndex]?.width ||
                                  product?.flatSize?.width ||
                                  product?.closeSize?.width ||
                                  "";
                                console.log("🔍 Output Width Debug:", {
                                  productIndex,
                                  outputDimensions:
                                    outputDimensions[productIndex],
                                  product: product,
                                  flatSize: product?.flatSize,
                                  closeSize: product?.closeSize,
                                  finalWidth: width,
                                  allOutputDimensions: outputDimensions,
                                });
                                return width;
                              })()}
                            />
                            {!(
                              outputDimensions[productIndex]?.width ||
                              formData.products[productIndex]?.flatSize
                                ?.width ||
                              formData.products[productIndex]?.closeSize?.width
                            ) && (
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
                                dimensionError ? "border-red-300 bg-red-50" : ""
                              }`}
                              value={(() => {
                                const product = formData.products[productIndex];
                                const height =
                                  outputDimensions[productIndex]?.height ||
                                  product?.flatSize?.height ||
                                  product?.closeSize?.height ||
                                  "";
                                console.log("🔍 Output Height Debug:", {
                                  productIndex,
                                  outputDimensions:
                                    outputDimensions[productIndex],
                                  product: product,
                                  flatSize: product?.flatSize,
                                  closeSize: product?.closeSize,
                                  finalHeight: height,
                                  allOutputDimensions: outputDimensions,
                                });
                                return height;
                              })()}
                            />
                            {!(
                              outputDimensions[productIndex]?.height ||
                              formData.products[productIndex]?.flatSize
                                ?.height ||
                              formData.products[productIndex]?.closeSize?.height
                            ) && (
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
                              placeholder={
                                recommendedSheets
                                  ? String(recommendedSheets)
                                  : "e.g. 125"
                              }
                              className={`border-slate-300 focus:border-[#27aae1] focus:ring-[#27aae1] rounded-xl h-10 w-full ${
                                !opPaper?.enteredSheets
                                  ? "bg-[#27aae1]/10 border-[#27aae1]/30"
                                  : ""
                              }`}
                              value={
                                opPaper?.enteredSheets ??
                                recommendedSheets ??
                                ""
                              }
                              onChange={(e) => {
                                handlePaperOpChange(
                                  globalPaperIndex,
                                  "enteredSheets",
                                  e.target.value
                                );
                              }}
                            />
                            {opPaper?.enteredSheets &&
                              opPaper.enteredSheets < recommendedSheets && (
                                <div className="text-amber-600 text-xs mt-1 flex items-center gap-2">
                                  <span>
                                    ⚠ Less than recommended ({recommendedSheets}
                                    )
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      // Add "No TRN" option or similar justification
                                      const justification = prompt(
                                        "Please provide justification for using fewer sheets (e.g., 'No TRN', 'Special arrangement', etc.):"
                                      );
                                      if (
                                        justification &&
                                        justification.trim()
                                      ) {
                                        // Store the justification or show it in the UI
                                        console.log(
                                          `Justification for ${opPaper.enteredSheets} sheets: ${justification}`
                                        );
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
                                ✓ Using recommended sheets as default (
                                {recommendedSheets})
                              </div>
                            ) : opPaper.enteredSheets === recommendedSheets ? (
                              <div className="text-green-600 text-xs mt-1">
                                ✓ Matches recommended sheets
                              </div>
                            ) : (
                              <div className="text-amber-600 text-xs mt-1 flex items-center justify-between">
                                <span>
                                  ⚠ Custom value set (recommended:{" "}
                                  {recommendedSheets})
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const paperKey = `paper-${globalPaperIndex}`;
                                    setUserEditedSheets((prev) => {
                                      const newSet = new Set(prev);
                                      newSet.delete(paperKey);
                                      return newSet;
                                    });
                                    handlePaperOpChange(
                                      globalPaperIndex,
                                      "enteredSheets",
                                      String(recommendedSheets)
                                    );
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
                          Add hex codes, Pantone colors, or color names for this
                          paper
                        </div>

                        {/* Color Input */}
                        <div className="flex flex-col sm:flex-row gap-2 mb-3">
                          <div className="flex-1 relative">
                            <Input
                              type="text"
                              placeholder="e.g., #FF0000, Pantone 185C, Red"
                              value={
                                colorInputs[productIndex]?.[paperIndex] || ""
                              }
                              onChange={(e) => {
                                const newColorInputs = { ...colorInputs };
                                if (!newColorInputs[productIndex])
                                  newColorInputs[productIndex] = {};
                                newColorInputs[productIndex][paperIndex] =
                                  e.target.value;
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
                                    backgroundColor: getColorFromInput(
                                      colorInputs[productIndex][paperIndex]
                                    ),
                                    backgroundImage:
                                      getColorFromInput(
                                        colorInputs[productIndex][paperIndex]
                                      ) === "transparent"
                                        ? "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)"
                                        : "none",
                                    backgroundSize: "4px 4px",
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
                              const colorValue =
                                colorInputs[productIndex]?.[paperIndex];
                              if (colorValue && colorValue.trim()) {
                                // Set saving status
                                const newColorSaveStatus = {
                                  ...colorSaveStatus,
                                };
                                if (!newColorSaveStatus[productIndex])
                                  newColorSaveStatus[productIndex] = {};
                                newColorSaveStatus[productIndex][paperIndex] =
                                  "saving";
                                setColorSaveStatus(newColorSaveStatus);

                                // Add the color to the local state
                                const newColors = [
                                  ...(paperColors[productIndex]?.[paperIndex] ||
                                    []),
                                ];
                                newColors.push(colorValue.trim());

                                const newPaperColors = { ...paperColors };
                                if (!newPaperColors[productIndex])
                                  newPaperColors[productIndex] = {};
                                newPaperColors[productIndex][paperIndex] =
                                  newColors;
                                setPaperColors(newPaperColors);

                                // Update the form data to sync with database
                                const globalPaperIndex =
                                  formData.products
                                    .slice(0, productIndex)
                                    .reduce(
                                      (total, product) =>
                                        total + product.papers.length,
                                      0
                                    ) + paperIndex;

                                setFormData((prev) => ({
                                  ...prev,
                                  operational: {
                                    ...prev.operational,
                                    papers: prev.operational.papers.map(
                                      (paper: any, index: number) =>
                                        index === globalPaperIndex
                                          ? {
                                              ...paper,
                                              selectedColors: newColors,
                                            }
                                          : paper
                                    ),
                                  },
                                }));

                                // Clear input
                                const newColorInputs = { ...colorInputs };
                                newColorInputs[productIndex][paperIndex] = "";
                                setColorInputs(newColorInputs);

                                // Set saved status after a short delay
                                setTimeout(() => {
                                  setColorSaveStatus((prev) => ({
                                    ...prev,
                                    [productIndex]: {
                                      ...prev[productIndex],
                                      [paperIndex]: "saved",
                                    },
                                  }));

                                  // Reset to idle after 2 seconds
                                  setTimeout(() => {
                                    setColorSaveStatus((prev) => ({
                                      ...prev,
                                      [productIndex]: {
                                        ...prev[productIndex],
                                        [paperIndex]: "idle",
                                      },
                                    }));
                                  }, 2000);
                                }, 500);
                              }
                            }}
                            className={`h-8 px-3 text-xs transition-all duration-200 ${
                              colorSaveStatus[productIndex]?.[paperIndex] ===
                              "saving"
                                ? "bg-[#27aae1]/20 text-[#27aae1] border-[#27aae1]/50"
                                : colorSaveStatus[productIndex]?.[
                                    paperIndex
                                  ] === "saved"
                                ? "bg-green-100 text-green-700 border-green-300"
                                : ""
                            }`}
                            disabled={
                              !colorInputs[productIndex]?.[
                                paperIndex
                              ]?.trim() ||
                              colorSaveStatus[productIndex]?.[paperIndex] ===
                                "saving"
                            }
                          >
                            {colorSaveStatus[productIndex]?.[paperIndex] ===
                            "saving" ? (
                              <div className="w-3 h-3 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                            ) : colorSaveStatus[productIndex]?.[paperIndex] ===
                              "saved" ? (
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            ) : (
                              "Add"
                            )}
                          </Button>
                        </div>

                        {/* Display Colors */}
                        {paperColors[productIndex]?.[paperIndex]?.length >
                          0 && (
                          <div className="flex flex-wrap gap-2">
                            {paperColors[productIndex][paperIndex].map(
                              (colorCode, colorIndex) => (
                                <div
                                  key={colorIndex}
                                  className="flex items-center gap-2 px-2 py-1 bg-white rounded border border-slate-200"
                                >
                                  <div
                                    className="w-3 h-3 rounded border border-slate-300"
                                    style={{
                                      backgroundColor:
                                        getColorFromInput(colorCode),
                                      backgroundImage:
                                        getColorFromInput(colorCode) ===
                                        "transparent"
                                          ? "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)"
                                          : "none",
                                      backgroundSize: "3px 3px",
                                    }}
                                  ></div>
                                  <span className="text-xs font-mono text-slate-700">
                                    {colorCode}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newColors = [
                                        ...paperColors[productIndex][
                                          paperIndex
                                        ],
                                      ];
                                      newColors.splice(colorIndex, 1);

                                      const newPaperColors = { ...paperColors };
                                      newPaperColors[productIndex][paperIndex] =
                                        newColors;
                                      setPaperColors(newPaperColors);

                                      // Update the form data to sync with database
                                      const globalPaperIndex =
                                        formData.products
                                          .slice(0, productIndex)
                                          .reduce(
                                            (total, product) =>
                                              total + product.papers.length,
                                            0
                                          ) + paperIndex;

                                      setFormData((prev) => ({
                                        ...prev,
                                        operational: {
                                          ...prev.operational,
                                          papers: prev.operational.papers.map(
                                            (paper: any, index: number) =>
                                              index === globalPaperIndex
                                                ? {
                                                    ...paper,
                                                    selectedColors: newColors,
                                                  }
                                                : paper
                                          ),
                                        },
                                      }));
                                    }}
                                    className="text-slate-400 hover:text-red-500 transition-colors ml-1"
                                  >
                                    <svg
                                      className="w-3 h-3"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              )
                            )}
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
                        <span className="ml-2 text-xs text-[#27aae1] bg-[#27aae1]/10 px-2 py-1 rounded-full">
                          Excel-Based
                        </span>
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
                                handlePaperOpChange(
                                  globalPaperIndex,
                                  "pricePerSheet",
                                  e.target.value
                                )
                              }
                            />
                            <div className="text-xs text-slate-500 mt-1">
                              Leave empty to use packet pricing only
                            </div>
                          </div>
                          <div className="border-t pt-4">
                            <h6 className="text-sm font-medium text-slate-600 mb-3">
                              Packet Pricing:
                            </h6>
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
                                    handlePaperOpChange(
                                      globalPaperIndex,
                                      "pricePerPacket",
                                      e.target.value
                                    )
                                  }
                                />
                              </div>
                            </div>
                          </div>

                          {/* Excel-Based Pricing Summary */}
                          <div className="bg-[#27aae1]/10 rounded-lg p-4 border border-[#27aae1]/30">
                            <h6 className="text-sm font-semibold text-[#27aae1] mb-3 flex items-center">
                              <Calculator className="w-4 h-4 mr-2" />
                              Excel-Based Pricing Summary
                            </h6>

                            {(() => {
                              try {
                                // 1) Inputs from Step 3 / product
                                console.log(
                                  "🔍 Pricing Summary - productIndex:",
                                  productIndex
                                );
                                console.log(
                                  "🔍 Pricing Summary - outputDimensions:",
                                  outputDimensions
                                );
                                console.log(
                                  "🔍 Pricing Summary - product:",
                                  product
                                );
                                console.log(
                                  "🔍 Pricing Summary - outputDimensions[productIndex]:",
                                  outputDimensions[productIndex]
                                );
                                console.log(
                                  "🔍 Pricing Summary - product.flatSize:",
                                  product?.flatSize
                                );

                                // Use same logic as main calculation - prioritize product.flatSize directly
                                const pieceH = product?.flatSize?.height ?? 9;
                                const pieceW = product?.flatSize?.width ?? 5.5;

                                console.log(
                                  "🔍 Pricing Summary - Final dimensions:",
                                  { pieceH, pieceW }
                                );

                                const qty = Number(product.quantity) || 1000;
                                const sides = Number(product.sides) || 2;

                                // Extract number of colors from Step 3 selection
                                // Handle formats like "4 Colors (CMYK)", "4+1 Colors", "4+2 Colors"
                                const parseColors = (colorStr: any): number => {
                                  if (!colorStr) return 0;
                                  const str = colorStr.toString();

                                  // Check for "4+1" or "4+2" format
                                  const plusMatch = str.match(/(\d+)\+(\d+)/);
                                  if (plusMatch) {
                                    const base = parseInt(plusMatch[1]);
                                    const additional = parseInt(plusMatch[2]);
                                    return base + additional;
                                  }

                                  // Fallback to single number
                                  const singleMatch = str.match(/\d+/);
                                  return singleMatch
                                    ? parseInt(singleMatch[0])
                                    : 0;
                                };

                                const frontColors = parseColors(
                                  product.colors?.front
                                );
                                const backColors = parseColors(
                                  product.colors?.back
                                );

                                // For 2-sided printing, use max of front/back (same plates used)
                                const rawColours =
                                  Math.max(frontColors, backColors) || 4;

                                // Check if this is digital printing
                                const isDigital =
                                  product?.printingSelection === "Digital";

                                // Color categorization: ONLY apply for Digital (1-3 colors = 1 color, 4+ colors = 4 colors)
                                // For Offset, use actual color count for accurate plate cost calculation
                                const colours = isDigital
                                  ? rawColours <= 3
                                    ? 1
                                    : 4
                                  : rawColours;

                                // 2) Paper cost per sheet: Step 4 manual > packet/ratio > materials DB
                                const paperName =
                                  product.papers[paperIndex]?.name || "";
                                const paperGSM =
                                  product.papers[paperIndex]?.gsm || "";
                                const materialPrice =
                                  getPaperPriceFromMaterials(
                                    paperName,
                                    paperGSM
                                  );

                                let paperCostPerSheet = opPaper?.pricePerSheet;
                                if (paperCostPerSheet == null) {
                                  if (
                                    opPaper?.pricePerPacket != null &&
                                    opPaper?.sheetsPerPacket != null &&
                                    opPaper.sheetsPerPacket > 0
                                  ) {
                                    paperCostPerSheet =
                                      opPaper.pricePerPacket /
                                      opPaper.sheetsPerPacket;
                                    console.log("📦 Using packet pricing:", {
                                      pricePerPacket: opPaper.pricePerPacket,
                                      sheetsPerPacket: opPaper.sheetsPerPacket,
                                      calculatedPricePerSheet:
                                        paperCostPerSheet,
                                    });
                                  } else {
                                    paperCostPerSheet = materialPrice ?? 10;
                                    console.log(
                                      "📄 Using materials database pricing:",
                                      {
                                        materialPrice,
                                        fallbackPrice: paperCostPerSheet,
                                      }
                                    );
                                  }
                                } else {
                                  console.log(
                                    "💰 Using direct sheet pricing:",
                                    {
                                      pricePerSheet: paperCostPerSheet,
                                    }
                                  );
                                }

                                // isDigital already declared above for color categorization

                                if (isDigital) {
                                  // Use digital calculation for digital printing
                                  try {
                                    const digitalResults =
                                      excelDigitalCalculation({
                                        qty,
                                        piece: { w: pieceW, h: pieceH },
                                        sides: sides as 1 | 2,
                                        colorsF: colours as 1 | 2 | 4,
                                        colorsB: 1,
                                        parent: { w: 100, h: 70 },
                                        allowRotate: true,
                                        paperCostPerSheet: paperCostPerSheet, // Pass manual paper pricing
                                      });

                                    if (digitalResults.length > 0) {
                                      // Use the cheapest digital option (avoiding zero values)
                                      const validResults =
                                        digitalResults.filter(
                                          (result) => result.total > 0
                                        );
                                      const cheapest =
                                        validResults.length > 0
                                          ? validResults.reduce(
                                              (min, current) =>
                                                current.total < min.total
                                                  ? current
                                                  : min
                                            )
                                          : null;

                                      if (!cheapest) {
                                        console.warn(
                                          "⚠️ All digital calculation results have zero total - no valid option found"
                                        );
                                        return (
                                          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                                            <div className="text-yellow-700">
                                              No valid digital pricing options
                                              found. Please check your
                                              dimensions.
                                            </div>
                                          </div>
                                        );
                                      }

                                      // 7) Render digital results
                                      return (
                                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                          <div className="flex items-center mb-4">
                                            <Calculator className="w-5 h-5 text-blue-600 mr-2" />
                                            <h4 className="text-lg font-semibold text-blue-800">
                                              Digital Pricing Summary
                                            </h4>
                                          </div>

                                          <div className="text-xs text-slate-500 mb-2">
                                            Sheet option:{" "}
                                            <b>{cheapest.option}</b>{" "}
                                            &nbsp;|&nbsp; Cut pcs:{" "}
                                            <b>{cheapest.cutPerParent}</b>
                                          </div>

                                          <div className="space-y-3">
                                            <div className="flex justify-between items-center text-sm">
                                              <span className="text-slate-600">
                                                Paper Cost (
                                                {opPaper?.enteredSheets ||
                                                  cheapest.parents}{" "}
                                                sheets):
                                              </span>
                                              <span className="font-semibold text-blue-600">
                                                {fmt(
                                                  (opPaper?.enteredSheets ||
                                                    cheapest.parents) *
                                                    paperCostPerSheet
                                                )}
                                              </span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                              <span className="text-slate-600">
                                                Click Cost:
                                              </span>
                                              <span className="font-semibold text-blue-600">
                                                {fmt(cheapest.clicks)}
                                              </span>
                                            </div>
                                          </div>

                                          <div className="border-t border-gray-300 pt-3 mt-3">
                                            <div className="flex justify-between items-center">
                                              <span className="font-bold text-blue-800">
                                                Digital Total Cost:
                                              </span>
                                              <span className="text-xl font-bold text-blue-800">
                                                {fmt(
                                                  cheapest.clicks +
                                                    (opPaper?.enteredSheets ||
                                                      cheapest.parents) *
                                                      paperCostPerSheet
                                                )}
                                              </span>
                                            </div>
                                            <div className="text-xs text-slate-500 mt-1">
                                              Ups/sheet: {cheapest.upsPerSheet}{" "}
                                              &nbsp;|&nbsp; Sheets:{" "}
                                              {opPaper?.enteredSheets ||
                                                cheapest.parents}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    } else {
                                      throw new Error(
                                        "No digital results available"
                                      );
                                    }
                                  } catch (error) {
                                    console.error(
                                      "❌ Digital pricing summary failed:",
                                      error
                                    );
                                    return (
                                      <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                                        <div className="text-red-600">
                                          Digital calculation failed. Please
                                          check your inputs.
                                        </div>
                                      </div>
                                    );
                                  }
                                } else {
                                  // Use offset calculation for offset printing
                                  // 3) Build base and candidate list
                                  const base = {
                                    pieceW,
                                    pieceH,
                                    qty,
                                    sides,
                                    colours,
                                    paperCostPerSheet,
                                  };
                                  const candidates = CUT_SIZE_CANDIDATES;

                                  // 4) Did user type a parent in Step 4? Use that exact row (and its real cutPcs).
                                  const userParentW = opPaper?.inputWidth;
                                  const userParentH = opPaper?.inputHeight;

                                  let chosenRow: CandidateRow | undefined;
                                  let ranked:
                                    | ReturnType<typeof pickCheapestTotal>
                                    | undefined;

                                  if (userParentW && userParentH) {
                                    chosenRow = candidates.find(
                                      (r) =>
                                        Number(r.parentW) ===
                                          Number(userParentW) &&
                                        Number(r.parentH) ===
                                          Number(userParentH)
                                    );
                                    if (!chosenRow) {
                                      console.warn(
                                        "Manual parent size not found in candidates; falling back to cheapest."
                                      );
                                    }
                                  }

                                  // 5) If no exact match, pick the cheapest across all rows (avoiding zero values)
                                  // Use materials database price for candidate selection to avoid price-dependent sheet count changes
                                  if (!chosenRow) {
                                    const baseForSelection = {
                                      ...base,
                                      paperCostPerSheet: materialPrice ?? 10, // Use materials DB price for selection, not user input
                                    };
                                    ranked = pickCheapestTotal(
                                      baseForSelection,
                                      candidates
                                    );
                                    if (ranked.length > 0) {
                                      chosenRow = ranked[0]; // cheapest non-zero row
                                    } else {
                                      console.warn(
                                        "⚠️ No valid offset calculation results found - all have zero total"
                                      );
                                      return (
                                        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                                          <div className="text-yellow-700">
                                            No valid offset pricing options
                                            found. Please check your dimensions.
                                          </div>
                                        </div>
                                      );
                                    }
                                  }

                                  // 6) Compute final breakdown using the selected REAL row
                                  const excelResult = calcRowTotal(
                                    base,
                                    chosenRow
                                  );

                                  // Debug logging
                                  console.log(
                                    "🔍 Offset Pricing Summary Debug:",
                                    {
                                      pieceW,
                                      pieceH,
                                      qty,
                                      sides,
                                      colours,
                                      paperCostPerSheet,
                                      chosenRow,
                                      excelResult,
                                      userParentW,
                                      userParentH,
                                      candidatesLength: candidates.length,
                                    }
                                  );

                                  // 7) Render offset results
                                  return (
                                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                      <div className="flex items-center mb-4">
                                        <Calculator className="w-5 h-5 text-blue-600 mr-2" />
                                        <h4 className="text-lg font-semibold text-blue-800">
                                          Offset Pricing Summary
                                        </h4>
                                      </div>

                                      <div className="text-xs text-slate-500 mb-2">
                                        Parent used:{" "}
                                        <b>
                                          {chosenRow.parentW}×
                                          {chosenRow.parentH}
                                        </b>{" "}
                                        &nbsp;|&nbsp; Cut pcs:{" "}
                                        <b>{chosenRow.cutPcs}</b>
                                      </div>

                                      <div className="space-y-3">
                                        <div className="flex justify-between items-center text-sm">
                                          <span className="text-slate-600">
                                            Paper Cost (
                                            {opPaper?.enteredSheets ||
                                              excelResult.sheets}{" "}
                                            sheets):
                                          </span>
                                          <span className="font-semibold text-blue-600">
                                            {fmt(
                                              (opPaper?.enteredSheets ||
                                                excelResult.sheets) *
                                                paperCostPerSheet
                                            )}
                                          </span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                          <span className="text-slate-600">
                                            Unit Price:
                                          </span>
                                          <span className="font-semibold text-blue-600">
                                            {fmt(excelResult.unit_price)}
                                          </span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                          <span className="text-slate-600">
                                            Plate Cost ({colours} colors):
                                          </span>
                                          <span className="font-semibold text-blue-600">
                                            {fmt(excelResult.plateTotal)}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="border-t border-gray-300 pt-3 mt-3">
                                        <div className="flex justify-between items-center">
                                          <span className="font-bold text-blue-800">
                                            Offset Total Cost:
                                          </span>
                                          <span className="text-xl font-bold text-blue-800">
                                            {fmt(
                                              excelResult.unit_price +
                                                (opPaper?.enteredSheets ||
                                                  excelResult.sheets) *
                                                  paperCostPerSheet +
                                                excelResult.plateTotal
                                            )}
                                          </span>
                                        </div>
                                        <div className="text-xs text-slate-500 mt-1">
                                          Ups/sheet: {excelResult.upsPerSht}{" "}
                                          &nbsp;|&nbsp; Waste:{" "}
                                          {excelResult.wasteSheets}{" "}
                                          &nbsp;|&nbsp; No. of ups:{" "}
                                          {excelResult.noOfUps}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }
                              } catch (e) {
                                console.error(e);
                                return (
                                  <div className="text-sm text-slate-600">
                                    Excel calculation unavailable.
                                  </div>
                                );
                              }
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
                                !formData.operational.plates
                                  ? "bg-[#27aae1]/10 border-[#27aae1]/30"
                                  : "bg-white"
                              }`}
                              value={
                                formData.operational.plates ?? plates ?? ""
                              }
                              onChange={(e) =>
                                handlePlatesChange(e.target.value)
                              }
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
                                !formData.operational.units
                                  ? "bg-[#27aae1]/10 border-[#27aae1]/30"
                                  : "bg-white"
                              }`}
                              value={formData.operational.units ?? units ?? ""}
                              onChange={(e) =>
                                handleUnitsChange(e.target.value)
                              }
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
                                !formData.operational.impressions
                                  ? "bg-[#27aae1]/10 border-[#27aae1]/30"
                                  : "bg-white"
                              }`}
                              value={formData.operational.impressions ?? ""}
                              onChange={(e) => {
                                const impressions =
                                  e.target.value === ""
                                    ? null
                                    : parseFloat(e.target.value);
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
                          <span className="ml-2 text-xs text-slate-500">
                            (Unique project costs)
                          </span>
                        </h5>
                        <div className="space-y-4">
                          {additionalCosts.map((cost, index) => (
                            <div
                              key={cost.id}
                              className="bg-slate-50 rounded-lg p-3 border border-slate-200"
                            >
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-2">
                                <div className="flex-1 space-y-2">
                                  <Input
                                    type="text"
                                    placeholder="Cost description"
                                    className="w-full border-slate-300 focus:border-[#27aae1] focus:ring-[#27aae1] rounded-lg"
                                    value={cost.description}
                                    onChange={(e) => {
                                      const newCosts = [...additionalCosts];
                                      newCosts[index].description =
                                        e.target.value;
                                      setAdditionalCosts(newCosts);
                                    }}
                                  />
                                  <Input
                                    type="number"
                                    placeholder="Cost amount"
                                    step="0.01"
                                    min="0"
                                    className="w-full sm:w-32 border-slate-300 focus:border-[#27aae1] focus:ring-[#27aae1] rounded-lg"
                                    value={cost.cost === 0 ? "" : cost.cost}
                                    onChange={(e) => {
                                      const newCosts = [...additionalCosts];
                                      const inputValue = e.target.value;
                                      // Allow empty string for flexible input, convert to 0 only when needed
                                      if (
                                        inputValue === "" ||
                                        inputValue === null ||
                                        inputValue === undefined
                                      ) {
                                        newCosts[index].cost = 0;
                                      } else {
                                        const parsedValue =
                                          parseFloat(inputValue);
                                        newCosts[index].cost = isNaN(
                                          parsedValue
                                        )
                                          ? 0
                                          : parsedValue;
                                      }
                                      setAdditionalCosts(newCosts);
                                    }}
                                    onBlur={(e) => {
                                      // Ensure we have a valid number when the field loses focus
                                      const newCosts = [...additionalCosts];
                                      const inputValue = e.target.value;
                                      if (
                                        inputValue === "" ||
                                        inputValue === null ||
                                        inputValue === undefined
                                      ) {
                                        newCosts[index].cost = 0;
                                      }
                                      setAdditionalCosts(newCosts);
                                    }}
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newCosts = additionalCosts.filter(
                                      (_, i) => i !== index
                                    );
                                    setAdditionalCosts(newCosts);
                                  }}
                                  className="ml-2 p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M6 18L18 6M6 6l12 12"
                                    />
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
                                  description: "",
                                  cost: 0,
                                  comment: "",
                                },
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
                            if (
                              product.finishing &&
                              product.finishing.length > 0
                            ) {
                              product.finishing.forEach(
                                (finishingName: any) => {
                                  allFinishingTypes.add(finishingName);
                                }
                              );
                            }
                          });

                          if (allFinishingTypes.size > 0) {
                            const totalFinishingCost =
                              calculateFinishingCosts();

                            return (
                              <div className="space-y-4 mt-6 pt-4 border-t border-slate-200">
                                {/* Header Section */}
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                  <div className="flex items-center">
                                    <Settings className="w-4 h-4 mr-2 text-[#27aae1]" />
                                    <h5 className="text-md font-semibold text-slate-700">
                                      Finishing Costs
                                    </h5>
                                    <span className="ml-2 text-xs text-slate-500">
                                      (Calculated once at the end)
                                    </span>
                                  </div>
                                </div>

                                {/* Cost and Button Section */}
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                  <div className="flex items-center space-x-3">
                                    <span className="text-xl font-bold text-[#27aae1]">
                                      {fmt(totalFinishingCost)}
                                    </span>
                                    <span className="text-sm text-slate-500">
                                      total cost
                                    </span>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      setShowFinishingDetails(true)
                                    }
                                    className="text-xs border-[#27aae1] text-[#27aae1] hover:bg-[#27aae1] hover:text-white w-full sm:w-auto"
                                  >
                                    View Details
                                  </Button>
                                </div>

                                {/* Summary Section */}
                                <div className="text-sm text-slate-600">
                                  {allFinishingTypes.size} finishing type
                                  {allFinishingTypes.size > 1 ? "s" : ""}{" "}
                                  applied • Total cost includes all finishing
                                  options
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
                    <CardHeader className="pb-3">
                      <CardTitle className="text-xl md:text-2xl font-bold text-slate-800 flex items-center">
                        <Settings className="w-6 h-6 md:w-7 md:h-7 mr-2 md:mr-3 text-red-600" />
                        Cutting Layout Visualization
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 w-full px-2 md:px-4">
                      <div className="space-y-3">
                        <h5 className="text-base md:text-lg font-semibold text-slate-700">
                          How the 100×70cm Input Sheet is Cut for Machine
                          Compatibility
                        </h5>

                        <div className="w-full h-[250px] sm:h-[350px] md:h-[450px] lg:h-[500px] bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-1 shadow-lg overflow-hidden">
                          <div className="relative w-full h-full bg-white rounded-lg shadow-inner overflow-hidden">
                            <canvas
                              id={`cutting-canvas-${productIndex}-${paperIndex}`}
                              className="w-full h-full rounded-lg transition-all duration-500 hover:shadow-md"
                              style={{ maxWidth: "100%", maxHeight: "100%" }}
                              ref={(canvas) => {
                                if (
                                  canvas &&
                                  opPaper?.inputWidth &&
                                  opPaper?.inputHeight &&
                                  outputDimensions[productIndex]?.width &&
                                  outputDimensions[productIndex]?.height
                                ) {
                                  setTimeout(() => {
                                    // Use dynamic press calculation to get optimal cutting dimensions
                                    const productDimensions = {
                                      width:
                                        outputDimensions[productIndex].width,
                                      height:
                                        outputDimensions[productIndex].height,
                                    };

                                    const pressDimension =
                                      calculateVisualizationPressDimensions(
                                        productDimensions,
                                        formData
                                      );

                                    if (
                                      pressDimension &&
                                      opPaper.inputWidth &&
                                      opPaper.inputHeight
                                    ) {
                                      console.log(
                                        "🔧 Using dynamic press dimensions for cutting:",
                                        {
                                          productDimensions,
                                          pressDimension,
                                          inputSheet: {
                                            width: opPaper.inputWidth,
                                            height: opPaper.inputHeight,
                                          },
                                          exactValues: {
                                            inputWidth: opPaper.inputWidth,
                                            inputHeight: opPaper.inputHeight,
                                            pressWidth: pressDimension.width,
                                            pressHeight: pressDimension.height,
                                            is100x70:
                                              opPaper.inputWidth === 100 &&
                                              opPaper.inputHeight === 70,
                                            is23x20:
                                              pressDimension.width === 23 &&
                                              pressDimension.height === 20,
                                            is20x23:
                                              pressDimension.width === 20 &&
                                              pressDimension.height === 23,
                                          },
                                        }
                                      );

                                      drawCuttingLayout(
                                        canvas,
                                        opPaper.inputWidth,
                                        opPaper.inputHeight,
                                        pressDimension.width,
                                        pressDimension.height
                                      );
                                    }
                                  }, 150);
                                }
                              }}
                            />
                            {(!opPaper?.inputWidth ||
                              !opPaper?.inputHeight) && (
                              <div className="absolute inset-0 grid place-items-center text-sm md:text-lg text-slate-500 bg-gradient-to-br from-red-50 to-red-100 rounded-lg">
                                <div className="text-center p-3 md:p-4 lg:p-8 max-w-[90%]">
                                  <div className="text-red-400 mb-2 md:mb-4 text-2xl md:text-3xl lg:text-5xl">
                                    ✂️
                                  </div>
                                  <div className="font-semibold text-slate-600 text-sm md:text-base lg:text-xl">
                                    Input Dimensions Required
                                  </div>
                                  <div className="text-xs md:text-sm text-slate-400 mt-2 md:mt-3">
                                    Set input sheet dimensions to preview
                                    cutting layout
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                          <div className="bg-white rounded-xl p-4 border border-red-200 shadow-sm">
                            <h6 className="font-semibold text-slate-800 mb-3 text-center flex items-center justify-center">
                              <Settings className="w-4 h-4 mr-2 text-red-600" />
                              Cutting Strategy
                            </h6>
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-slate-600">
                                  Input Sheet:
                                </span>
                                <span className="font-semibold text-red-600">
                                  {opPaper?.inputWidth?.toFixed(1) ?? "100"} ×{" "}
                                  {opPaper?.inputHeight?.toFixed(1) ?? "70"} cm
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-600">
                                  Cut Size:
                                </span>
                                <span className="font-semibold text-[#27aae1]">
                                  {(() => {
                                    if (
                                      opPaper?.inputWidth &&
                                      opPaper?.inputHeight &&
                                      outputDimensions[productIndex]?.width &&
                                      outputDimensions[productIndex]?.height
                                    ) {
                                      const productDimensions = {
                                        width:
                                          outputDimensions[productIndex].width,
                                        height:
                                          outputDimensions[productIndex].height,
                                      };
                                      const pressDimension =
                                        calculateVisualizationPressDimensions(
                                          productDimensions,
                                          formData
                                        );
                                      return pressDimension
                                        ? `${pressDimension?.width || 0} × ${
                                            pressDimension?.height || 0
                                          } cm`
                                        : "Calculating...";
                                    }
                                    return "Dimensions required";
                                  })()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-600">
                                  Alternative:
                                </span>
                                <span className="font-semibold text-[#27aae1]">
                                  50 × 35 cm
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-white rounded-xl p-4 border border-red-200 shadow-sm">
                            <h6 className="font-semibold text-slate-800 mb-3 text-center flex items-center justify-center">
                              <Calculator className="w-4 h-4 mr-2 text-red-600" />
                              Cutting Results
                            </h6>
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-slate-600">
                                  Cut Pieces:
                                </span>
                                <span className="font-semibold text-red-600">
                                  {(() => {
                                    if (
                                      opPaper?.inputWidth &&
                                      opPaper?.inputHeight &&
                                      outputDimensions[productIndex]?.width &&
                                      outputDimensions[productIndex]?.height
                                    ) {
                                      const productDimensions = {
                                        width:
                                          outputDimensions[productIndex].width,
                                        height:
                                          outputDimensions[productIndex].height,
                                      };
                                      const pressDimension =
                                        calculateVisualizationPressDimensions(
                                          productDimensions,
                                          formData
                                        );
                                      if (pressDimension) {
                                        const cutPieces = calculateCutPieces(
                                          opPaper.inputWidth!,
                                          opPaper.inputHeight!,
                                          pressDimension?.width || 0,
                                          pressDimension?.height || 0
                                        );
                                        return cutPieces.totalPieces;
                                      }
                                    }
                                    return "–";
                                  })()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-600">Layout:</span>
                                <span className="font-semibold text-[#27aae1]">
                                  {(() => {
                                    if (
                                      opPaper?.inputWidth &&
                                      opPaper?.inputHeight &&
                                      outputDimensions[productIndex]?.width &&
                                      outputDimensions[productIndex]?.height
                                    ) {
                                      const productDimensions = {
                                        width:
                                          outputDimensions[productIndex].width,
                                        height:
                                          outputDimensions[productIndex].height,
                                      };
                                      const pressDimension =
                                        calculateVisualizationPressDimensions(
                                          productDimensions,
                                          formData
                                        );
                                      if (pressDimension) {
                                        const cutPieces = calculateCutPieces(
                                          opPaper.inputWidth!,
                                          opPaper.inputHeight!,
                                          pressDimension?.width || 0,
                                          pressDimension?.height || 0
                                        );
                                        return `${cutPieces.piecesPerRow}×${cutPieces.piecesPerCol}`;
                                      }
                                    }
                                    return "–";
                                  })()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-600">
                                  Efficiency:
                                </span>
                                <span className="font-semibold text-green-600">
                                  {(() => {
                                    if (
                                      opPaper?.inputWidth &&
                                      opPaper?.inputHeight &&
                                      outputDimensions[productIndex]?.width &&
                                      outputDimensions[productIndex]?.height
                                    ) {
                                      const productDimensions = {
                                        width:
                                          outputDimensions[productIndex].width,
                                        height:
                                          outputDimensions[productIndex].height,
                                      };
                                      const pressDimension =
                                        calculateVisualizationPressDimensions(
                                          productDimensions,
                                          formData
                                        );
                                      if (pressDimension) {
                                        const cutPieces = calculateCutPieces(
                                          opPaper.inputWidth!,
                                          opPaper.inputHeight!,
                                          pressDimension?.width || 0,
                                          pressDimension?.height || 0
                                        );
                                        const cutSize =
                                          (pressDimension?.width || 0) *
                                          (pressDimension?.height || 0);
                                        return (
                                          ((cutSize * cutPieces.totalPieces) /
                                            (opPaper.inputWidth! *
                                              opPaper.inputHeight!)) *
                                          100
                                        ).toFixed(1);
                                      }
                                    }
                                    return "–";
                                  })()}
                                  %
                                </span>
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
                        <h5 className="text-base md:text-lg font-semibold text-slate-700">
                          Final Printing on Cut Pieces (e.g., 50×35cm)
                        </h5>

                        <div className="w-full h-[250px] sm:h-[350px] md:h-[450px] lg:h-[500px] bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-1 shadow-lg overflow-hidden">
                          <div className="relative w-full h-full bg-white rounded-lg shadow-inner overflow-hidden">
                            <canvas
                              id={`final-printing-canvas-${productIndex}-${paperIndex}`}
                              className="w-full h-full rounded-lg transition-all duration-500 hover:shadow-md"
                              style={{ maxWidth: "100%", maxHeight: "100%" }}
                              ref={(canvas) => {
                                if (
                                  canvas &&
                                  opPaper?.inputWidth &&
                                  opPaper?.inputHeight &&
                                  outputDimensions[productIndex]?.width &&
                                  outputDimensions[productIndex]?.height
                                ) {
                                  setTimeout(() => {
                                    if (
                                      opPaper.inputWidth &&
                                      opPaper.inputHeight &&
                                      outputDimensions[productIndex]?.width &&
                                      outputDimensions[productIndex]?.height
                                    ) {
                                      // Use dynamic press calculation to get optimal cutting dimensions
                                      const productDimensions = {
                                        width:
                                          outputDimensions[productIndex].width,
                                        height:
                                          outputDimensions[productIndex].height,
                                      };

                                      const pressDimension =
                                        calculateVisualizationPressDimensions(
                                          productDimensions,
                                          formData
                                        );

                                      if (pressDimension) {
                                        console.log(
                                          "🔧 Using dynamic press dimensions for final printing:",
                                          {
                                            productDimensions,
                                            pressDimension,
                                            inputSheet: {
                                              width: opPaper.inputWidth,
                                              height: opPaper.inputHeight,
                                            },
                                          }
                                        );

                                        const cutPieces = calculateCutPieces(
                                          opPaper.inputWidth!,
                                          opPaper.inputHeight!,
                                          pressDimension?.width || 0,
                                          pressDimension?.height || 0
                                        );
                                        drawFinalPrintingLayout(
                                          canvas,
                                          cutPieces,
                                          outputDimensions[productIndex].width,
                                          outputDimensions[productIndex].height
                                        );
                                      }
                                    }
                                  }, 150);
                                }
                              }}
                            />
                            {(!opPaper?.inputWidth ||
                              !opPaper?.inputHeight ||
                              !outputDimensions[productIndex]?.width ||
                              !outputDimensions[productIndex]?.height) && (
                              <div className="absolute inset-0 grid place-items-center text-sm md:text-lg text-slate-500 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                                <div className="text-center p-3 md:p-4 lg:p-8 max-w-[90%]">
                                  <div className="text-green-400 mb-2 md:mb-4 text-2xl md:text-3xl lg:text-5xl">
                                    🎨
                                  </div>
                                  <div className="font-semibold text-slate-600 text-sm md:text-base lg:text-xl">
                                    Complete Data Required
                                  </div>
                                  <div className="text-xs md:text-sm text-slate-400 mt-2 md:mt-3">
                                    Set input dimensions and output dimensions
                                    to preview final printing layout
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Product-Specific Sheet Layout Visualization */}
                <Card className="border-0 shadow-lg w-full mx-0 mt-6">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl md:text-2xl font-bold text-slate-800 flex items-center">
                      <BarChart3 className="w-6 h-6 md:w-7 md:h-7 mr-2 md:mr-3 text-[#27aae1]" />
                      Sheet Layout Visualization -{" "}
                      {product.productName || `Product ${productIndex + 1}`}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 w-full px-2 md:px-4">
                    <div className="space-y-3">
                      <h5 className="text-base md:text-lg font-semibold text-slate-700">
                        Product-Specific Sheet Layout Pattern
                      </h5>

                      {/* Professional Visualization Type Selector */}
                      <div className="flex flex-wrap gap-3 justify-center mb-4">
                        <button
                          onClick={() => setVisualizationType("print")}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                            visualizationType === "print"
                              ? "bg-blue-600 text-white shadow-lg"
                              : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <Printer className="w-4 h-4" />
                          Print Layout
                        </button>
                        <button
                          onClick={() => setVisualizationType("cut")}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                            visualizationType === "cut"
                              ? "bg-red-600 text-white shadow-lg"
                              : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <Scissors className="w-4 h-4" />
                          Cutting Operations
                        </button>
                        <button
                          onClick={() => setVisualizationType("gripper")}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                            visualizationType === "gripper"
                              ? "bg-purple-600 text-white shadow-lg"
                              : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <GripHorizontal className="w-4 h-4" />
                          Gripper Handling
                        </button>
                      </div>

                      {/* Product-Specific Canvas Visualization */}
                      <div className="w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-lg p-1 shadow-lg overflow-hidden">
                        <div className="relative w-full h-full bg-white rounded-lg shadow-inner overflow-hidden">
                          <canvas
                            id={`canvas-visualization-${productIndex}`}
                            className="w-full h-full rounded-lg transition-all duration-500 hover:shadow-md"
                            style={{ maxWidth: "100%", maxHeight: "100%" }}
                            ref={(canvas) => {
                              if (canvas && product.papers.length > 0) {
                                // Get the first paper of this product
                                const productPaper = product.papers[0];
                                let globalPaperIndex = 0;
                                for (let pi = 0; pi < productIndex; pi++) {
                                  globalPaperIndex +=
                                    formData.products[pi].papers.length;
                                }
                                const opPaper =
                                  formData.operational.papers[globalPaperIndex];
                                const productLayout =
                                  perPaperCalc[productIndex]?.[0];

                                // Check if this is digital printing
                                const isDigital =
                                  product?.printingSelection === "Digital";

                                if (isDigital) {
                                  // Use digital visualization for digital printing
                                  if (digitalCostingResults.length > 0) {
                                    setTimeout(() => {
                                      // Get product dimensions for digital visualization
                                      const productName =
                                        product?.productName || "Business Card";
                                      const productConfig =
                                        getProductConfig(productName);

                                      let step3ProductWidth =
                                        product?.flatSize?.width ||
                                        productConfig?.defaultSizes?.width ||
                                        9;
                                      let step3ProductHeight =
                                        product?.flatSize?.height ||
                                        productConfig?.defaultSizes?.height ||
                                        5.5;

                                      // Use outputDimensions if available (from Step 3), otherwise fall back to width/height
                                      if (outputDimensions[productIndex]) {
                                        step3ProductWidth =
                                          outputDimensions[productIndex].width;
                                        step3ProductHeight =
                                          outputDimensions[productIndex].height;
                                      }

                                      drawDigitalLayout(
                                        canvas,
                                        digitalCostingResults,
                                        selectedDigitalOption,
                                        step3ProductWidth,
                                        step3ProductHeight,
                                        visualizationType
                                      );
                                    }, 150);
                                  }
                                } else {
                                  // Use offset visualization for offset printing
                                  if (
                                    productLayout &&
                                    productLayout.layout &&
                                    productLayout.layout.itemsPerSheet > 0 &&
                                    opPaper?.inputWidth &&
                                    opPaper?.inputHeight
                                  ) {
                                    setTimeout(() => {
                                      // Use current product data for visualization
                                      const productName =
                                        product?.productName || "Business Card";
                                      const productConfig =
                                        getProductConfig(productName);

                                      let step3ProductWidth =
                                        product?.flatSize?.width ||
                                        productConfig?.defaultSizes?.width ||
                                        9;
                                      let step3ProductHeight =
                                        product?.flatSize?.height ||
                                        productConfig?.defaultSizes?.height ||
                                        5.5;

                                      // Use outputDimensions if available
                                      if (outputDimensions[productIndex]) {
                                        step3ProductWidth =
                                          outputDimensions[productIndex].width;
                                        step3ProductHeight =
                                          outputDimensions[productIndex].height;
                                      }

                                      const settings = {
                                        type: visualizationType,
                                        showGripper:
                                          visualizationType === "gripper",
                                        showCutLines:
                                          visualizationType === "cut",
                                        showBleed: true,
                                        showGaps: true,
                                        gripperWidth:
                                          product?.gripper ||
                                          productConfig?.defaultGripper ||
                                          0.9,
                                        bleedWidth: 0.3,
                                        gapWidth: 0.5,
                                      };

                                      // For cutting operations, always use 100x70 parent sheet
                                      // For other visualizations, use the selected parent dimensions from offset calculation
                                      const parentWidth =
                                        visualizationType === "cut"
                                          ? 100
                                          : productLayout.layout
                                              ?.selectedParentWidth ||
                                            opPaper.inputWidth ||
                                            100;
                                      const parentHeight =
                                        visualizationType === "cut"
                                          ? 70
                                          : productLayout.layout
                                              ?.selectedParentHeight ||
                                            opPaper.inputHeight ||
                                            70;

                                      drawProfessionalVisualization(
                                        canvas,
                                        productLayout.layout,
                                        visualizationType,
                                        settings,
                                        product,
                                        parentWidth,
                                        parentHeight,
                                        step3ProductWidth,
                                        step3ProductHeight,
                                        formData,
                                        productIndex
                                      );
                                    }, 150);
                                  }
                                }
                              }
                            }}
                          />
                          {(() => {
                            const isDigital =
                              product?.printingSelection === "Digital";

                            if (isDigital) {
                              // Digital printing: show message if no digital results
                              return (
                                !digitalCostingResults.length && (
                                  <div className="absolute inset-0 grid place-items-center text-sm md:text-lg text-slate-500 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg">
                                    <div className="text-center p-3 md:p-4 lg:p-8 max-w-[90%]">
                                      <div className="text-slate-400 mb-2 md:mb-4 text-2xl md:text-3xl lg:text-5xl">
                                        🖨️
                                      </div>
                                      <div className="font-semibold text-slate-600 text-sm md:text-base lg:text-xl">
                                        Digital Layout Preview
                                      </div>
                                      <div className="text-xs md:text-sm text-slate-400 mt-2 md:mt-3">
                                        Configure digital printing to preview
                                        sheet layout
                                      </div>
                                    </div>
                                  </div>
                                )
                              );
                            } else {
                              // Offset printing: show message if no layout data
                              const productLayout =
                                perPaperCalc[productIndex]?.[0];
                              return (
                                (!product.papers.length ||
                                  !productLayout?.layout?.itemsPerSheet) && (
                                  <div className="absolute inset-0 grid place-items-center text-sm md:text-lg text-slate-500 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg">
                                    <div className="text-center p-3 md:p-4 lg:p-8 max-w-[90%]">
                                      <div className="text-slate-400 mb-2 md:mb-4 text-2xl md:text-3xl lg:text-5xl">
                                        📏
                                      </div>
                                      <div className="font-semibold text-slate-600 text-sm md:text-base lg:text-xl">
                                        Configure Product First
                                      </div>
                                      <div className="text-xs md:text-sm text-slate-400 mt-2 md:mt-3">
                                        Complete product configuration to
                                        preview layout visualization
                                      </div>
                                    </div>
                                  </div>
                                )
                              );
                            }
                          })()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Product-Specific Advanced Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 items-start">
                  {/* Advanced Sheet Analysis */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                    <div
                      className={`bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 transition-all duration-300 ${
                        isAdvancedSheetAnalysisCollapsed ? "p-3" : "p-4"
                      }`}
                    >
                      <h6
                        className="font-semibold text-slate-800 flex items-center justify-between cursor-pointer group"
                        onClick={() =>
                          setIsAdvancedSheetAnalysisCollapsed(
                            !isAdvancedSheetAnalysisCollapsed
                          )
                        }
                      >
                        <div className="flex items-center">
                          <div className="p-2 bg-[#27aae1]/10 rounded-lg mr-3 group-hover:bg-[#27aae1]/20 transition-colors duration-200">
                            <Package className="w-4 h-4 text-[#27aae1]" />
                          </div>
                          <span className="group-hover:text-[#27aae1] transition-colors duration-200">
                            Advanced Sheet Analysis
                          </span>
                        </div>
                        <div className="flex items-center">
                          <button className="p-2 hover:bg-slate-200 rounded-lg transition-all duration-200 group-hover:bg-[#27aae1]/10">
                            {isAdvancedSheetAnalysisCollapsed ? (
                              <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-[#27aae1] transition-colors duration-200" />
                            ) : (
                              <ChevronUp className="w-4 h-4 text-slate-500 group-hover:text-[#27aae1] transition-colors duration-200" />
                            )}
                          </button>
                        </div>
                      </h6>
                    </div>
                    {!isAdvancedSheetAnalysisCollapsed && (
                      <div className="p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-blue-700">
                                Input Sheet:
                              </span>
                              <span className="font-semibold text-blue-800">
                                {(() => {
                                  const isDigital =
                                    product?.printingSelection === "Digital";
                                  if (
                                    isDigital &&
                                    perPaperCalc[productIndex]?.[0]?.layout
                                      ?.selectedDigitalOption
                                  ) {
                                    const digitalOption =
                                      perPaperCalc[productIndex][0].layout
                                        .selectedDigitalOption;
                                    const dimensions =
                                      digitalOption.label.match(/(\d+)×(\d+)/);
                                    if (dimensions) {
                                      return `${dimensions[1]}×${dimensions[2]} cm`;
                                    }
                                  }
                                  let globalPaperIndex = 0;
                                  for (let pi = 0; pi < productIndex; pi++) {
                                    globalPaperIndex +=
                                      formData.products[pi].papers.length;
                                  }
                                  const opPaper =
                                    formData.operational.papers[
                                      globalPaperIndex
                                    ];
                                  return `${opPaper?.inputWidth || 100} × ${
                                    opPaper?.inputHeight || 70
                                  } cm`;
                                })()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-blue-700">Sheet Area:</span>
                              <span className="font-semibold text-[#27aae1]">
                                {(() => {
                                  const isDigital =
                                    product?.printingSelection === "Digital";
                                  if (
                                    isDigital &&
                                    perPaperCalc[productIndex]?.[0]?.layout
                                      ?.selectedDigitalOption
                                  ) {
                                    const digitalOption =
                                      perPaperCalc[productIndex][0].layout
                                        .selectedDigitalOption;
                                    const dimensions =
                                      digitalOption.label.match(/(\d+)×(\d+)/);
                                    if (dimensions) {
                                      const width = parseInt(dimensions[1]);
                                      const height = parseInt(dimensions[2]);
                                      return `${(
                                        width * height
                                      ).toLocaleString()} cm²`;
                                    }
                                  }
                                  let globalPaperIndex = 0;
                                  for (let pi = 0; pi < productIndex; pi++) {
                                    globalPaperIndex +=
                                      formData.products[pi].papers.length;
                                  }
                                  const opPaper =
                                    formData.operational.papers[
                                      globalPaperIndex
                                    ];
                                  const area =
                                    (opPaper?.inputWidth || 100) *
                                    (opPaper?.inputHeight || 70);
                                  return `${area.toLocaleString()} cm²`;
                                })()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-blue-700">
                                Items per Sheet:
                              </span>
                              <span className="font-semibold text-blue-800">
                                {perPaperCalc[productIndex]?.[0]?.layout
                                  ?.itemsPerSheet || 0}
                              </span>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-blue-700">Used Area:</span>
                              <span className="font-semibold text-green-600">
                                {(() => {
                                  const isDigital =
                                    product?.printingSelection === "Digital";
                                  if (
                                    isDigital &&
                                    perPaperCalc[productIndex]?.[0]?.layout
                                      ?.selectedDigitalOption &&
                                    outputDimensions[productIndex]?.width &&
                                    outputDimensions[productIndex]?.height
                                  ) {
                                    const digitalOption =
                                      perPaperCalc[productIndex][0].layout
                                        .selectedDigitalOption;
                                    const dimensions =
                                      digitalOption.label.match(/(\d+)×(\d+)/);
                                    if (dimensions) {
                                      const sheetWidth = parseInt(
                                        dimensions[1]
                                      );
                                      const sheetHeight = parseInt(
                                        dimensions[2]
                                      );
                                      const productWidth =
                                        outputDimensions[productIndex].width;
                                      const productHeight =
                                        outputDimensions[productIndex].height;
                                      const itemsPerSheet =
                                        perPaperCalc[productIndex]?.[0]?.layout
                                          ?.itemsPerSheet || 1;
                                      const usedArea =
                                        productWidth *
                                        productHeight *
                                        itemsPerSheet;
                                      return `${usedArea.toLocaleString()} cm²`;
                                    }
                                  }
                                  if (
                                    outputDimensions[productIndex]?.width &&
                                    outputDimensions[productIndex]?.height
                                  ) {
                                    const productWidth =
                                      outputDimensions[productIndex].width;
                                    const productHeight =
                                      outputDimensions[productIndex].height;
                                    const itemsPerSheet =
                                      perPaperCalc[productIndex]?.[0]?.layout
                                        ?.itemsPerSheet || 1;
                                    const usedArea =
                                      productWidth *
                                      productHeight *
                                      itemsPerSheet;
                                    return `${usedArea.toLocaleString()} cm²`;
                                  }
                                  return "N/A";
                                })()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-blue-700">Efficiency:</span>
                              <span className="font-semibold text-green-600">
                                {(() => {
                                  const efficiency =
                                    perPaperCalc[productIndex]?.[0]?.layout
                                      ?.efficiency || 0;
                                  return `${efficiency.toFixed(1)}%`;
                                })()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-blue-700">
                                Orientation:
                              </span>
                              <span className="font-semibold text-blue-800">
                                {perPaperCalc[productIndex]?.[0]?.layout
                                  ?.orientation || "normal"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Production Intelligence */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                    <div
                      className={`bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 transition-all duration-300 ${
                        isProductionIntelligenceCollapsed ? "p-3" : "p-4"
                      }`}
                    >
                      <h6
                        className="font-semibold text-slate-800 flex items-center justify-between cursor-pointer group"
                        onClick={() =>
                          setIsProductionIntelligenceCollapsed(
                            !isProductionIntelligenceCollapsed
                          )
                        }
                      >
                        <div className="flex items-center">
                          <div className="p-2 bg-[#27aae1]/10 rounded-lg mr-3 group-hover:bg-[#27aae1]/20 transition-colors duration-200">
                            <Edit3 className="w-4 h-4 text-[#27aae1]" />
                          </div>
                          <span className="group-hover:text-[#27aae1] transition-colors duration-200">
                            Production Intelligence
                          </span>
                        </div>
                        <div className="flex items-center">
                          <button className="p-2 hover:bg-slate-200 rounded-lg transition-all duration-200 group-hover:bg-[#27aae1]/10">
                            {isProductionIntelligenceCollapsed ? (
                              <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-[#27aae1] transition-colors duration-200" />
                            ) : (
                              <ChevronUp className="w-4 h-4 text-slate-500 group-hover:text-[#27aae1] transition-colors duration-200" />
                            )}
                          </button>
                        </div>
                      </h6>
                    </div>
                    {!isProductionIntelligenceCollapsed && (
                      <div className="p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-green-700">Quantity:</span>
                              <span className="font-semibold text-green-800">
                                {product?.quantity || 0}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-green-700">Sides:</span>
                              <span className="font-semibold text-green-800">
                                {product?.sides || "1"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-green-700">Printing:</span>
                              <span className="font-semibold text-green-800">
                                {product?.printingSelection || "Digital"}
                              </span>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-green-700">
                                Total Sheets:
                              </span>
                              <span className="font-semibold text-green-800">
                                {(() => {
                                  let totalSheets = 0;
                                  product.papers.forEach(
                                    (paper: any, paperIndex: number) => {
                                      let globalPaperIndex = 0;
                                      for (
                                        let pi = 0;
                                        pi < productIndex;
                                        pi++
                                      ) {
                                        globalPaperIndex +=
                                          formData.products[pi].papers.length;
                                      }
                                      globalPaperIndex += paperIndex;
                                      const opPaper =
                                        formData.operational.papers[
                                          globalPaperIndex
                                        ];
                                      const rec =
                                        perPaperCalc[productIndex]?.[paperIndex]
                                          ?.recommendedSheets ?? 0;
                                      const entered =
                                        opPaper?.enteredSheets ?? null;
                                      totalSheets +=
                                        entered != null ? entered : rec;
                                    }
                                  );
                                  return totalSheets;
                                })()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-green-700">Colors:</span>
                              <span className="font-semibold text-green-800">
                                {(() => {
                                  const totalColors = product.papers.reduce(
                                    (total: any, _: any, paperIdx: number) => {
                                      return (
                                        total +
                                        (paperColors[productIndex]?.[paperIdx]
                                          ?.length || 0)
                                      );
                                    },
                                    0
                                  );
                                  return totalColors;
                                })()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-green-700">Papers:</span>
                              <span className="font-semibold text-green-800">
                                {product.papers.length}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Operations Dashboard */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                    <div
                      className={`bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 transition-all duration-300 ${
                        isOperationsDashboardCollapsed ? "p-3" : "p-4"
                      }`}
                    >
                      <h6
                        className="font-semibold text-slate-800 flex items-center justify-between cursor-pointer group"
                        onClick={() =>
                          setIsOperationsDashboardCollapsed(
                            !isOperationsDashboardCollapsed
                          )
                        }
                      >
                        <div className="flex items-center">
                          <div className="p-2 bg-[#27aae1]/10 rounded-lg mr-3 group-hover:bg-[#27aae1]/20 transition-colors duration-200">
                            <BarChart3 className="w-4 h-4 text-[#27aae1]" />
                          </div>
                          <span className="group-hover:text-[#27aae1] transition-colors duration-200">
                            Operations Dashboard
                          </span>
                        </div>
                        <div className="flex items-center">
                          <button className="p-2 hover:bg-slate-200 rounded-lg transition-all duration-200 group-hover:bg-[#27aae1]/10">
                            {isOperationsDashboardCollapsed ? (
                              <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-[#27aae1] transition-colors duration-200" />
                            ) : (
                              <ChevronUp className="w-4 h-4 text-slate-500 group-hover:text-[#27aae1] transition-colors duration-200" />
                            )}
                          </button>
                        </div>
                      </h6>
                    </div>
                    {!isOperationsDashboardCollapsed && (
                      <div className="p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-purple-700">
                                Paper Cost:
                              </span>
                              <span className="font-semibold text-purple-800">
                                {(() => {
                                  let totalCost = 0;
                                  product.papers.forEach(
                                    (paper: any, paperIndex: number) => {
                                      let globalPaperIndex = 0;
                                      for (
                                        let pi = 0;
                                        pi < productIndex;
                                        pi++
                                      ) {
                                        globalPaperIndex +=
                                          formData.products[pi].papers.length;
                                      }
                                      globalPaperIndex += paperIndex;
                                      const opPaper =
                                        formData.operational.papers[
                                          globalPaperIndex
                                        ];
                                      const rec =
                                        perPaperCalc[productIndex]?.[paperIndex]
                                          ?.recommendedSheets ?? 0;
                                      const entered =
                                        opPaper?.enteredSheets ?? null;
                                      const sheets =
                                        entered != null ? entered : rec;
                                      const pricePerSheet =
                                        perPaperCalc[productIndex]?.[paperIndex]
                                          ?.pricePerSheet ?? 0;
                                      totalCost += sheets * pricePerSheet;
                                    }
                                  );
                                  return fmt(totalCost);
                                })()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-purple-700">
                                Finishing:
                              </span>
                              <span className="font-semibold text-purple-800">
                                {(() => {
                                  let finishingCost = 0;
                                  if (
                                    product.finishing &&
                                    product.finishing.length > 0
                                  ) {
                                    product.finishing.forEach(
                                      (finishingName: any) => {
                                        finishingCost +=
                                          calculateIndividualFinishingCost(
                                            finishingName,
                                            product,
                                            productIndex
                                          );
                                      }
                                    );
                                  }
                                  return fmt(finishingCost);
                                })()}
                              </span>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-purple-700">Plates:</span>
                              <span className="font-semibold text-purple-800">
                                {(() => {
                                  if (product?.printingSelection === "Digital")
                                    return "N/A";
                                  const totalColors = product.papers.reduce(
                                    (total: any, _: any, paperIdx: number) => {
                                      return (
                                        total +
                                        (paperColors[productIndex]?.[paperIdx]
                                          ?.length || 0)
                                      );
                                    },
                                    0
                                  );
                                  const plateCost = totalColors * 150; // Assuming 150 AED per plate
                                  return fmt(plateCost);
                                })()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-purple-700">Total:</span>
                              <span className="font-semibold text-purple-800">
                                {(() => {
                                  let totalCost = 0;
                                  // Paper costs
                                  product.papers.forEach(
                                    (paper: any, paperIndex: number) => {
                                      let globalPaperIndex = 0;
                                      for (
                                        let pi = 0;
                                        pi < productIndex;
                                        pi++
                                      ) {
                                        globalPaperIndex +=
                                          formData.products[pi].papers.length;
                                      }
                                      globalPaperIndex += paperIndex;
                                      const opPaper =
                                        formData.operational.papers[
                                          globalPaperIndex
                                        ];
                                      const rec =
                                        perPaperCalc[productIndex]?.[paperIndex]
                                          ?.recommendedSheets ?? 0;
                                      const entered =
                                        opPaper?.enteredSheets ?? null;
                                      const sheets =
                                        entered != null ? entered : rec;
                                      const pricePerSheet =
                                        perPaperCalc[productIndex]?.[paperIndex]
                                          ?.pricePerSheet ?? 0;
                                      totalCost += sheets * pricePerSheet;
                                    }
                                  );
                                  // Finishing costs
                                  if (
                                    product.finishing &&
                                    product.finishing.length > 0
                                  ) {
                                    product.finishing.forEach(
                                      (finishingName: any) => {
                                        totalCost +=
                                          calculateIndividualFinishingCost(
                                            finishingName,
                                            product,
                                            productIndex
                                          );
                                      }
                                    );
                                  }
                                  // Plate costs (offset only)
                                  if (
                                    product?.printingSelection !== "Digital"
                                  ) {
                                    const totalColors = product.papers.reduce(
                                      (
                                        total: any,
                                        _: any,
                                        paperIdx: number
                                      ) => {
                                        return (
                                          total +
                                          (paperColors[productIndex]?.[paperIdx]
                                            ?.length || 0)
                                        );
                                      },
                                      0
                                    );
                                    totalCost += totalColors * 150; // Assuming 150 AED per plate
                                  }
                                  return fmt(totalCost);
                                })()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      <CostBreakdownDialog
        open={showCostBreakdown}
        onOpenChange={setShowCostBreakdown}
        formData={formData}
        pieceSize={effectiveSize}
      />

      {/* Paper Price Details Modal */}
      <Dialog
        open={showPaperPrice !== null}
        onOpenChange={() => setShowPaperPrice(null)}
      >
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-2xl font-bold text-slate-800">
              <Calculator className="w-8 h-8 mr-3 text-blue-600" />
              Paper Price Details
            </DialogTitle>
            <p className="text-slate-600 mt-2">
              Detailed paper pricing breakdown and calculations
            </p>
          </DialogHeader>

          <div className="space-y-6">
            {(() => {
              if (showPaperPrice === null) return null;

              const paperData = formData.operational.papers[showPaperPrice];
              const product = formData.products[showPaperPrice];
              if (!paperData || !product)
                return <div>No paper data available</div>;

              const sheetsRequired =
                (product.quantity || 0) * (paperData?.sheetsPerPacket || 1);
              const hasPricing =
                paperData.pricePerSheet || paperData.pricePerPacket;

              return (
                <div className="space-y-6">
                  {/* Paper Information */}
                  <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                    <h4 className="text-lg font-semibold text-blue-800 mb-4">
                      Paper Details
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-blue-700">Paper Name:</span>
                          <span className="font-semibold text-blue-800">
                            Art Paper 150gsm
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700">Sheets Needed:</span>
                          <span className="font-semibold text-blue-800">
                            {sheetsRequired}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700">Input Size:</span>
                          <span className="font-semibold text-blue-800">
                            {paperData.inputWidth} x {paperData.inputHeight} cm
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Details */}
                  <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                    <h4 className="text-lg font-semibold text-green-800 mb-4">
                      Pricing Details
                    </h4>
                    {hasPricing ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-green-700">
                                Price per Sheet:
                              </span>
                              <span className="font-semibold text-green-800">
                                {paperData.pricePerSheet
                                  ? `${paperData.pricePerSheet} AED`
                                  : "Not set"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-green-700">
                                Price per Packet:
                              </span>
                              <span className="font-semibold text-green-800">
                                {paperData.pricePerPacket
                                  ? `${paperData.pricePerPacket} AED`
                                  : "Not set"}
                              </span>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-green-700">
                                Total Cost:
                              </span>
                              <span className="font-semibold text-green-800">
                                {paperData.pricePerSheet
                                  ? `${(
                                      paperData.pricePerSheet * sheetsRequired
                                    ).toFixed(2)} AED`
                                  : "N/A"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-green-700">
                                Cost per Unit:
                              </span>
                              <span className="font-semibold text-green-800">
                                {product.quantity && paperData.pricePerSheet
                                  ? `${(
                                      (paperData.pricePerSheet *
                                        sheetsRequired) /
                                      product.quantity
                                    ).toFixed(2)} AED`
                                  : "N/A"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <AlertTriangle className="w-8 h-8 text-yellow-600" />
                        </div>
                        <h5 className="text-lg font-semibold text-yellow-800 mb-2">
                          No pricing information available
                        </h5>
                        <p className="text-yellow-700">
                          Please set either price per sheet or price per packet
                          in the paper specifications above.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

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
    </div>
  );
};

export default Step4Operational;
