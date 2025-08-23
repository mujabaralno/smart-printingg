// lib/quote-pdf.ts
import type { QuoteFormData } from "@/types";

export interface OtherQty {
  productName: string;
  quantity: number | "";
  price: number | "";
}

const currency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

type JsPDFModule = typeof import("jspdf");
type AutoTableModule = typeof import("jspdf-autotable");
type JsPDFInstance = InstanceType<JsPDFModule["jsPDF"]>;
type JsPdfWithAutoTable = JsPDFInstance & {
  lastAutoTable?: { finalY: number };
};

const getFinalY = (doc: JsPdfWithAutoTable, fallback: number): number =>
  typeof doc.lastAutoTable?.finalY === "number" ? doc.lastAutoTable.finalY : fallback;

// Helper function to calculate price for other quantities
const calculateOtherQtyPrice = (formData: QuoteFormData, otherQty: OtherQty) => {
  const baseProduct = formData.products.find(p => p.productName === otherQty.productName);
  if (!baseProduct || !baseProduct.quantity || !otherQty.quantity) return { base: 0, vat: 0, total: 0 };

  // Use the calculation from formData if available, otherwise calculate
  if (formData.calculation && formData.calculation.totalPrice > 0) {
    const quantityRatio = (otherQty.quantity as number) / (baseProduct.quantity || 1);
    const basePrice = formData.calculation.subtotal * quantityRatio;
    const vat = basePrice * 0.05;
    const total = basePrice + vat;
    return { base: basePrice, vat, total };
  }

  // Fallback calculation if formData.calculation is not available
  const quantityRatio = (otherQty.quantity as number) / baseProduct.quantity;
  
  // 1. Paper Costs (price per sheet × entered sheets)
  const paperCost = formData.operational.papers.reduce((total, p) => {
    const pricePerSheet = (p.pricePerPacket || 0) / (p.sheetsPerPacket || 1);
    const actualSheetsNeeded = p.enteredSheets || 0;
    return total + (pricePerSheet * actualSheetsNeeded);
  }, 0) * quantityRatio;

  // 2. Plates Cost (per plate, typically $25-50 per plate)
  const PLATE_COST_PER_PLATE = 35; // Standard plate cost
  const platesCost = (formData.operational.plates || 0) * PLATE_COST_PER_PLATE * quantityRatio;

  // 3. Finishing Costs (cost per unit × actual units needed)
  const actualUnitsNeeded = (formData.operational.units || baseProduct.quantity || 0) * quantityRatio;
  const finishingCost = formData.operational.finishing.reduce((total, f) => {
    if (baseProduct.finishing.includes(f.name)) {
      return total + ((f.cost || 0) * actualUnitsNeeded);
    }
    return total;
  }, 0);

  // 4. Calculate base price and add margin (30% like in UI)
  const MARGIN_PERCENTAGE = 0.3;
  const basePrice = paperCost + platesCost + finishingCost;
  const marginAmount = basePrice * MARGIN_PERCENTAGE;
  const subtotal = basePrice + marginAmount;
  
  // 5. Calculate VAT on subtotal (5% like in UI)
  const vat = subtotal * 0.05;
  const total = subtotal + vat;
  
  return { base: subtotal, vat, total };
};

// Helper function to calculate main product price
const calculateMainProductPrice = (formData: QuoteFormData, product: QuoteFormData["products"][0]) => {
  if (!product || !product.quantity) {
    return { base: 0, vat: 0, total: 0 };
  }

  // Use the calculation from formData if available, otherwise calculate
  if (formData.calculation && formData.calculation.totalPrice > 0) {
    // Distribute the total calculation proportionally among products
    const totalProducts = formData.products.length;
    const basePrice = formData.calculation.subtotal / totalProducts;
    const vat = basePrice * 0.05;
    const total = basePrice + vat;
    return { base: basePrice, vat, total };
  }

  // Fallback calculation if formData.calculation is not available
  // 1. Paper Costs (price per sheet × entered sheets)
  const paperCost = formData.operational.papers.reduce((total, p) => {
    const pricePerSheet = (p.pricePerPacket || 0) / (p.sheetsPerPacket || 1);
    const actualSheetsNeeded = p.enteredSheets || 0;
    return total + (pricePerSheet * actualSheetsNeeded);
  }, 0);

  // 2. Plates Cost (per plate, typically $25-50 per plate)
  const PLATE_COST_PER_PLATE = 35; // Standard plate cost
  const platesCost = (formData.operational.plates || 0) * PLATE_COST_PER_PLATE;

  // 3. Finishing Costs (cost per unit × actual units needed)
  const actualUnitsNeeded = formData.operational.units || product.quantity || 0;
  const finishingCost = formData.operational.finishing.reduce((total, f) => {
    if (product.finishing.includes(f.name)) {
      return total + ((f.cost || 0) * actualUnitsNeeded);
    }
    return total;
  }, 0);

  // 4. Calculate base price and add margin (30% like in UI)
  const MARGIN_PERCENTAGE = 0.3;
  const basePrice = paperCost + platesCost + finishingCost;
  const marginAmount = basePrice * MARGIN_PERCENTAGE;
  const subtotal = basePrice + marginAmount;
  
  // 5. Calculate VAT on subtotal (5% like in UI)
  const vat = subtotal * 0.05;
  const total = subtotal + vat;
  
  return { base: subtotal, vat, total };
};

export async function downloadCustomerPdf(
  formData: QuoteFormData,
  otherQuantities: OtherQty[]
) {
  try {
    const { jsPDF } = (await import("jspdf")) as JsPDFModule;
    const autoTable = (await import("jspdf-autotable")).default as AutoTableModule["default"];

    const doc: JsPdfWithAutoTable = new jsPDF();

    // Validate form data
    if (!formData.products || formData.products.length === 0) {
      throw new Error("No products found in form data");
    }

    // Format date to match the image format (M/D/YYYY)
    const today = new Date();
    const formattedDate = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;

    // Set document properties
    doc.setProperties({
      title: "Quotation - Customer Copy",
      subject: "Printing Services Quotation",
      author: "Smart Printing Solutions",
      creator: "Smart Printing Quotation System"
    });

    // Header Section with Company Branding
    doc.setFillColor(41, 128, 185); // Professional blue
    doc.rect(0, 0, 210, 30, 'F');
    
    // Company Logo/Name (centered)
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text("SMART PRINTING SOLUTIONS", 105, 15, { align: 'center' });
    
    // Tagline
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text("Professional Printing & Design Services", 105, 23, { align: 'center' });

    // Document Title
    doc.setTextColor(41, 128, 185);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text("QUOTATION - CUSTOMER COPY", 105, 38, { align: 'center' });

    // Date and Quote Number
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${formattedDate}`, 20, 50);
    
    // Generate quote number
    const quoteNumber = `QT-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
    doc.text(`Quote #: ${quoteNumber}`, 120, 50);

    // Client Information Section
    doc.setFillColor(248, 249, 250); // Light gray background
    doc.rect(20, 58, 170, 35, 'F'); // Increased height for more details
    
    doc.setTextColor(52, 73, 94); // Dark text
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text("CLIENT INFORMATION", 25, 67);
    
    const c = formData.client;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    // Basic client info
    doc.text(`Company: ${c.clientType === "Company" ? c.companyName : "Individual Client"}`, 25, 75);
    doc.text(`Contact Person: ${c.contactPerson || "-"}`, 25, 82);
    doc.text(`Email: ${c.email || "-"}`, 120, 75);
    doc.text(`Phone: ${c.countryCode} ${c.phone || "-"}`, 120, 82);
    
    // Additional client details
    if (c.clientType === "Company") {
      doc.text(`Company Name: ${c.companyName || "-"}`, 25, 89);
    } else {
      doc.text(`First Name: ${c.firstName || "-"}`, 25, 89);
      doc.text(`Last Name: ${c.lastName || "-"}`, 120, 89);
    }
    
    doc.text(`Role: ${c.role || "-"}`, 25, 96);
    
    // Address information if available
    if (c.address || c.city || c.state || c.postalCode || c.country) {
      doc.text(`Address: ${c.address || "-"}`, 25, 103);
      const locationParts = [c.city, c.state, c.postalCode, c.country].filter(Boolean);
      if (locationParts.length > 0) {
        doc.text(`Location: ${locationParts.join(", ")}`, 120, 103);
      }
    }
    
    // Additional information if available
    if (c.additionalInfo) {
      doc.text(`Notes: ${c.additionalInfo}`, 25, 110);
    }

    // Product Specifications Section - Enhanced with Step 3 data
    doc.setFillColor(240, 248, 255); // Light blue background
    doc.rect(20, 103, 170, 45, 'F'); // Increased height for more details
    
    doc.setTextColor(52, 73, 94);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text("PRODUCT SPECIFICATIONS", 25, 112);

    // Enhanced product details table with comprehensive information
    const productSpecsBody = formData.products.flatMap((product, index) => [
      [`Product ${index + 1} Name`, product.productName || "—"],
      [`Product ${index + 1} Quantity`, String(product.quantity || 0)],
      [`Product ${index + 1} Printing Method`, product.printingSelection || "—"],
      [`Product ${index + 1} Sides`, product.sides || "—"],
      [
        `Product ${index + 1} Flat Size (Open)`,
        `${product.flatSize?.width ?? "—"} × ${product.flatSize?.height ?? "—"} cm (spine: ${product.flatSize?.spine ?? 0} cm)`,
      ],
      [
        `Product ${index + 1} Close Size (Closed)`,
        product.useSameAsFlat ? "Same as Flat Size" : `${product.closeSize?.width ?? "—"} × ${product.closeSize?.height ?? "—"} cm (spine: ${product.closeSize?.spine ?? 0} cm)`,
      ],
      [`Product ${index + 1} Colors - Front`, product.colors?.front || "—"],
      [`Product ${index + 1} Colors - Back`, product.colors?.back || "—"],
      [`Product ${index + 1} Paper Type`, product.paperName || "—"],
      [`Product ${index + 1} Finishing`, product.finishing?.length ? product.finishing.join(", ") : "—"],
    ]);

    autoTable(doc, {
      startY: 158, // Adjusted start position
      head: [["Specification", "Value"]],
      body: productSpecsBody,
      styles: { 
        fontSize: 8,
        cellPadding: 3,
        lineColor: [41, 128, 185],
        lineWidth: 0.1
      },
      headStyles: { 
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      },
      margin: { left: 20, right: 20 },
      columnStyles: {
        0: { cellWidth: 70, halign: 'left' },
        1: { cellWidth: 90, halign: 'left' }
      }
    });

    // Main Products Pricing Table
    const mainProductsBody = formData.products.map(product => {
      try {
        const prices = calculateMainProductPrice(formData, product);
        return [
          product.productName || "—",
          String(product.quantity || 0),
          currency(prices.base),
          currency(prices.vat),
          currency(prices.total),
        ];
      } catch (error) {
        console.error("Error calculating price for product:", product, error);
        return [
          product.productName || "—",
          String(product.quantity || 0),
          "Error",
          "Error",
          "Error",
        ];
      }
    });

    autoTable(doc, {
      startY: getFinalY(doc, 158) + 8, // Adjusted start position
      head: [["Product Name", "Quantity", "Base Price", "VAT (5%)", "Total"]],
      body: mainProductsBody,
      styles: { 
        fontSize: 8,
        cellPadding: 4,
        lineColor: [41, 128, 185],
        lineWidth: 0.1
      },
      headStyles: { 
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      },
      margin: { left: 20, right: 20 },
      columnStyles: {
        0: { cellWidth: 45 }, // Product Name
        1: { cellWidth: 22, halign: 'center' }, // Quantity
        2: { cellWidth: 28, halign: 'right' }, // Base Price
        3: { cellWidth: 22, halign: 'right' }, // VAT
        4: { cellWidth: 28, halign: 'right' }  // Total
      }
    });

    // Paper Specifications Section - Added for customer PDF
    if (formData.operational.papers?.length) {
      const paperY = getFinalY(doc, 158) + 8;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(52, 152, 219);
      doc.text("PAPER SPECIFICATIONS", 20, paperY + 15);

      autoTable(doc, {
        startY: paperY + 20,
        head: [["Paper #", "Type", "Dimensions", "Sheets/Packet", "Price/Packet", "Required Sheets", "Output Size"]],
        body: formData.operational.papers.map((pp, i) => [
          String(i + 1),
          // Get paper name from product's papers array if available
          formData.products[0]?.papers[i]?.name || "Standard Paper",
          `${pp.inputWidth ?? "—"} × ${pp.inputHeight ?? "—"} cm`,
          String(pp.sheetsPerPacket ?? "—"),
          typeof pp.pricePerPacket === "number"
            ? currency(pp.pricePerPacket)
            : "—",
          String(pp.enteredSheets ?? "—"),
          `${pp.outputWidth ?? "—"} × ${pp.outputHeight ?? "—"} cm`,
        ]),
        styles: { 
          fontSize: 8,
          cellPadding: 3,
          lineColor: [52, 152, 219],
          lineWidth: 0.1
        },
        headStyles: { 
          fillColor: [52, 152, 219],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9
        },
        alternateRowStyles: {
          fillColor: [240, 248, 255]
        },
        margin: { left: 20, right: 20 },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center' }, // Paper #
          1: { cellWidth: 25, halign: 'left' },   // Type
          2: { cellWidth: 30, halign: 'center' }, // Dimensions
          3: { cellWidth: 25, halign: 'center' }, // Sheets/Packet
          4: { cellWidth: 25, halign: 'right' },  // Price/Packet
          5: { cellWidth: 25, halign: 'center' }, // Required Sheets
          6: { cellWidth: 30, halign: 'center' }  // Output Size
        }
      });
    }

    // Finishing Specifications Section - Added for customer PDF
    if (formData.operational.finishing?.length) {
      const finishingY = getFinalY(doc, 158) + 8;
      const selectedFin = formData.operational.finishing.filter((f) => 
        formData.products.some(product => product.finishing.includes(f.name))
      );
      
      if (selectedFin.length) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(155, 89, 182);
        doc.text("FINISHING SPECIFICATIONS", 20, finishingY + 15);

        autoTable(doc, {
          startY: finishingY + 20,
          head: [["Finishing Process", "Cost per Unit", "Total Cost"]],
          body: selectedFin.map((f) => [
            f.name,
            typeof f.cost === "number" ? currency(f.cost) : "—",
            typeof f.cost === "number" && formData.operational.units
              ? currency(f.cost * formData.operational.units)
              : "—"
          ]),
          styles: { 
            fontSize: 8,
            cellPadding: 4,
            lineColor: [155, 89, 182],
            lineWidth: 0.1
          },
          headStyles: { 
            fillColor: [155, 89, 182],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 9
          },
          alternateRowStyles: {
            fillColor: [248, 240, 255]
          },
          margin: { left: 20, right: 20 },
          columnStyles: {
            0: { cellWidth: 55, halign: 'left' },   // Finishing Process
            1: { cellWidth: 37, halign: 'right' },  // Cost per Unit
            2: { cellWidth: 37, halign: 'right' }   // Total Cost
          }
        });
      }
    }

    // Other Quantities Table
    if (otherQuantities.length > 0) {
      autoTable(doc, {
        startY: getFinalY(doc, getFinalY(doc, 158) + 8) + 8,
        head: [["Additional Quantities", "Quantity", "Base Price", "VAT (5%)", "Total"]],
        body: otherQuantities.map((o) => {
          try {
            const prices = calculateOtherQtyPrice(formData, o);
            return [
              o.productName || "—",
              String(o.quantity || 0),
              currency(prices.base),
              currency(prices.vat),
              currency(prices.total),
            ];
          } catch (error) {
            console.error("Error calculating price for other quantity:", o, error);
            return [
              o.productName || "—",
              String(o.quantity || 0),
              "Error",
              "Error",
              "Error",
            ];
          }
        }),
        styles: { 
          fontSize: 8,
          cellPadding: 4,
          lineColor: [52, 152, 219],
          lineWidth: 0.1
        },
        headStyles: { 
          fillColor: [52, 152, 219],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9
        },
        alternateRowStyles: {
          fillColor: [240, 248, 255]
        },
        margin: { left: 20, right: 20 },
        columnStyles: {
          0: { cellWidth: 45 }, // Additional Quantities
          1: { cellWidth: 22, halign: 'center' }, // Quantity
          2: { cellWidth: 28, halign: 'right' }, // Base Price
          3: { cellWidth: 22, halign: 'right' }, // VAT
          4: { cellWidth: 28, halign: 'right' }  // Total
        }
      });
    }

    // Summary Section
    let mainProductsTotal = 0;
    let otherQuantitiesTotal = 0;
    let grandTotal = 0;

    // Use formData.calculation if available, otherwise calculate from individual products
    if (formData.calculation && formData.calculation.totalPrice > 0) {
      mainProductsTotal = formData.calculation.totalPrice;
      
      // Calculate other quantities based on the main calculation
      otherQuantitiesTotal = otherQuantities.reduce((total, o) => {
        try {
          const prices = calculateOtherQtyPrice(formData, o);
          return total + prices.total;
        } catch (error) {
          console.error("Error calculating total for other quantity:", o, error);
          return total;
        }
      }, 0);
      
      grandTotal = mainProductsTotal + otherQuantitiesTotal;
    } else {
      // Fallback to individual product calculations
      mainProductsTotal = formData.products.reduce((total, product) => {
        try {
          const prices = calculateMainProductPrice(formData, product);
          return total + prices.total;
        } catch (error) {
          console.error("Error calculating total for product:", product, error);
          return total;
        }
      }, 0);

      otherQuantitiesTotal = otherQuantities.reduce((total, o) => {
        try {
          const prices = calculateOtherQtyPrice(formData, o);
          return total + prices.total;
        } catch (error) {
          console.error("Error calculating total for other quantity:", o, error);
          return total;
        }
      }, 0);

      grandTotal = mainProductsTotal + otherQuantitiesTotal;
    }

    // Summary table with professional styling
    const summaryStartY = getFinalY(doc, getFinalY(doc, getFinalY(doc, 158) + 8) + 8) + 8;
    autoTable(doc, {
      startY: summaryStartY,
      head: [["Description", "Amount"]],
      body: [
        ["Subtotal", currency(mainProductsTotal)],
        ["VAT (5%)", currency(mainProductsTotal * 0.05)],
        ["Total", currency(mainProductsTotal)],
        ...(otherQuantities.length > 0 ? [
          ["Additional Quantities", currency(otherQuantitiesTotal)],
          ["Grand Total", currency(grandTotal)]
        ] : [])
      ],
      styles: { 
        fontSize: 10,
        cellPadding: 6,
        lineColor: [41, 128, 185],
        lineWidth: 0.2
      },
      headStyles: { 
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 11
      },
      margin: { left: 20, right: 20 },
      columnStyles: {
        0: { cellWidth: 120, halign: 'left' },
        1: { cellWidth: 50, halign: 'right' }
      }
    });

    // Additional Information Section
    const additionalY = getFinalY(doc, summaryStartY) + 15;
    doc.setFillColor(248, 249, 250);
    doc.rect(20, additionalY + 10, 170, 40, 'F');
    
    doc.setTextColor(52, 73, 94);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text("ADDITIONAL INFORMATION", 25, additionalY + 20);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text("• Production Time: 5-7 business days", 25, additionalY + 27);
    doc.text("• Rush Orders: 2-3 business days (+25% cost)", 25, additionalY + 32);
    doc.text("• Express Orders: 1 business day (+50% cost)", 25, additionalY + 37);
    doc.text("• Quality Guarantee: 100% satisfaction or reprint", 120, additionalY + 27);
    doc.text("• Proof Copy: Available upon request", 120, additionalY + 32);
    doc.text("• Payment Terms: 50% upfront, 50% before delivery", 120, additionalY + 37);

    // Terms and Conditions Section
    const termsY = additionalY + 60;
    doc.setFillColor(255, 248, 220);
    doc.rect(20, termsY + 10, 170, 25, 'F');
    
    doc.setTextColor(52, 73, 94);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text("TERMS & CONDITIONS:", 25, termsY + 20);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text("• Quote valid for 30 days from date of issue", 25, termsY + 27);
    doc.text("• Changes to specifications may affect pricing", 25, termsY + 32);
    doc.text("• Delivery included within Dubai city limits", 120, termsY + 27);
    doc.text("• Additional charges for rush/express orders", 120, termsY + 32);

    // Contact Information in Footer
    const footerY = termsY + 45;
    doc.setFillColor(41, 128, 185);
    doc.rect(20, footerY + 10, 170, 15, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text("Smart Printing Solutions | +971 50-123-4567 | info@smartprinting.ae | www.smartprinting.ae", 105, footerY + 18, { align: 'center' });

    doc.save("quotation-customer.pdf");
    console.log("Customer PDF generated successfully");
  } catch (error) {
    console.error("Error generating customer PDF:", error);
    alert("Error generating PDF. Please check the console for details.");
  }
}

export async function downloadOpsPdf(
  formData: QuoteFormData,
  otherQuantities: OtherQty[]
) {
  try {
    const { jsPDF } = (await import("jspdf")) as JsPDFModule;
    const autoTable = (await import("jspdf-autotable")).default as AutoTableModule["default"];

    const doc: JsPdfWithAutoTable = new jsPDF();

    const op = formData.operational;

    // Validate form data
    if (!formData.products || formData.products.length === 0) {
      throw new Error("No products found in form data");
    }

    // Format date to match the image format (M/D/YYYY)
    const today = new Date();
    const formattedDate = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;

    // Set document properties
    doc.setProperties({
      title: "Quotation - Operations Copy",
      subject: "Printing Operations Specifications",
      author: "Smart Printing Solutions",
      creator: "Smart Printing Quotation System"
    });

    // Header Section with Company Branding
    doc.setFillColor(46, 204, 113); // Professional green for operations
    doc.rect(0, 0, 210, 30, 'F');
    
    // Company Logo/Name (centered)
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text("SMART PRINTING SOLUTIONS", 105, 15, { align: 'center' });
    
    // Tagline
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text("Operations & Production Specifications", 105, 23, { align: 'center' });

    // Document Title
    doc.setTextColor(46, 204, 113);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text("QUOTATION - OPERATIONS COPY", 105, 38, { align: 'center' });

    // Date and Quote Number
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${formattedDate}`, 20, 50);
    
    // Generate quote number
    const quoteNumber = `QT-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
    doc.text(`Quote #: ${quoteNumber}`, 120, 50);

    // Client Information Section
    doc.setFillColor(240, 248, 240); // Light green background
    doc.rect(20, 58, 170, 35, 'F'); // Increased height for more details
    
    doc.setTextColor(52, 73, 94);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text("CLIENT INFORMATION", 25, 67);
    
    const c = formData.client;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    // Basic client info
    doc.text(`Company: ${c.clientType === "Company" ? c.companyName : "Individual Client"}`, 25, 75);
    doc.text(`Contact Person: ${c.contactPerson || "-"}`, 25, 82);
    doc.text(`Email: ${c.email || "-"}`, 120, 75);
    doc.text(`Phone: ${c.countryCode} ${c.phone || "-"}`, 120, 82);
    
    // Additional client details
    if (c.clientType === "Company") {
      doc.text(`Company Name: ${c.companyName || "-"}`, 25, 89);
    } else {
      doc.text(`First Name: ${c.firstName || "-"}`, 25, 89);
      doc.text(`Last Name: ${c.lastName || "-"}`, 120, 89);
    }
    
    doc.text(`Role: ${c.role || "-"}`, 25, 96);
    
    // Address information if available
    if (c.address || c.city || c.state || c.postalCode || c.country) {
      doc.text(`Address: ${c.address || "-"}`, 25, 103);
      const locationParts = [c.city, c.state, c.postalCode, c.country].filter(Boolean);
      if (locationParts.length > 0) {
        doc.text(`Location: ${locationParts.join(", ")}`, 120, 103);
      }
    }
    
    // Additional information if available
    if (c.additionalInfo) {
      doc.text(`Notes: ${c.additionalInfo}`, 25, 110);
    }

    // Product Specifications Section - Enhanced with all Step 3 data
    doc.setFillColor(248, 249, 250);
    doc.rect(20, 103, 170, 35, 'F'); // Increased height for more details
    
    doc.setTextColor(52, 73, 94);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text("PRODUCT SPECIFICATIONS", 25, 112);

    // Enhanced product details table - show all Step 3 fields
    const productDetailsBody = formData.products.flatMap((product, index) => [
      [`Product ${index + 1} Name`, product.productName || "—"],
      [`Product ${index + 1} Quantity`, String(product.quantity || 0)],
      [`Product ${index + 1} Printing Method`, product.printingSelection || "—"],
      [`Product ${index + 1} Sides`, product.sides || "—"],
      [
        `Product ${index + 1} Flat Size (Open)`,
        `${product.flatSize?.width ?? "—"} × ${product.flatSize?.height ?? "—"} cm (spine: ${product.flatSize?.spine ?? 0} cm)`,
      ],
      [
        `Product ${index + 1} Close Size (Closed)`,
        product.useSameAsFlat ? "Same as Flat Size" : `${product.closeSize?.width ?? "—"} × ${product.closeSize?.height ?? "—"} cm (spine: ${product.closeSize?.spine ?? 0} cm)`,
      ],
      [`Product ${index + 1} Colors - Front`, product.colors?.front || "—"],
      [`Product ${index + 1} Colors - Back`, product.colors?.back || "—"],
      [`Product ${index + 1} Paper Type`, product.paperName || "—"],
      [`Product ${index + 1} Finishing`, product.finishing?.length ? product.finishing.join(", ") : "—"],
    ]);

    autoTable(doc, {
      startY: 138, // Adjusted start position
      head: [["Field", "Value"]],
      body: productDetailsBody,
      styles: { 
        fontSize: 8,
        cellPadding: 3,
        lineColor: [46, 204, 113],
        lineWidth: 0.1
      },
      headStyles: { 
        fillColor: [46, 204, 113],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      alternateRowStyles: {
        fillColor: [240, 248, 240]
      },
      margin: { left: 20, right: 20 },
      columnStyles: {
        0: { cellWidth: 65, halign: 'left' },
        1: { cellWidth: 95, halign: 'left' }
      }
    });

    // Paper Specifications Section
    if (op.papers?.length) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(46, 204, 113);
      doc.text("PAPER SPECIFICATIONS", 20, getFinalY(doc, 138) + 10);

      autoTable(doc, {
        startY: getFinalY(doc, 138) + 15,
        head: [["Paper #", "Input Dimensions", "Sheets/Packet", "Price/Packet", "Required Sheets"]],
        body: op.papers.map((pp, i) => [
          String(i + 1),
          `${pp.inputWidth ?? "—"} × ${pp.inputHeight ?? "—"} cm`,
          String(pp.sheetsPerPacket ?? "—"),
          typeof pp.pricePerPacket === "number"
            ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
                pp.pricePerPacket
              )
            : "—",
          String(pp.enteredSheets ?? "—"),
        ]),
        styles: { 
          fontSize: 8,
          cellPadding: 4,
          lineColor: [52, 152, 219],
          lineWidth: 0.1
        },
        headStyles: { 
          fillColor: [52, 152, 219],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9
        },
        alternateRowStyles: {
          fillColor: [240, 248, 255]
        },
        margin: { left: 20, right: 20 },
        columnStyles: {
          0: { cellWidth: 18, halign: 'center' }, // Paper #
          1: { cellWidth: 42, halign: 'center' }, // Input Dimensions
          2: { cellWidth: 32, halign: 'center' }, // Sheets/Packet
          3: { cellWidth: 32, halign: 'right' },  // Price/Packet
          4: { cellWidth: 32, halign: 'center' }  // Required Sheets
        }
      });
    }

    // Finishing Specifications Section
    const selectedFin = op.finishing.filter((f) => 
      formData.products.some(product => product.finishing.includes(f.name))
    );
    if (selectedFin.length) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(46, 204, 113);
      doc.text("FINISHING SPECIFICATIONS", 20, getFinalY(doc, 138) + 15);

      autoTable(doc, {
        startY: getFinalY(doc, 138) + 20,
        head: [["Finishing Process", "Cost per Unit", "Total Cost"]],
        body: selectedFin.map((f) => [
          f.name,
          typeof f.cost === "number"
            ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(f.cost)
            : "—",
          typeof f.cost === "number" && formData.operational.units
            ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(f.cost * formData.operational.units)
            : "—"
        ]),
        styles: { 
          fontSize: 8,
          cellPadding: 4,
          lineColor: [155, 89, 182],
          lineWidth: 0.1
        },
        headStyles: { 
          fillColor: [155, 89, 182],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9
        },
        alternateRowStyles: {
          fillColor: [248, 240, 255]
        },
        margin: { left: 20, right: 20 },
        columnStyles: {
          0: { cellWidth: 55, halign: 'left' },   // Finishing Process
          1: { cellWidth: 37, halign: 'right' },  // Cost per Unit
          2: { cellWidth: 37, halign: 'right' }   // Total Cost
        }
      });
    }

    // Production Specifications Section
    const productionY = getFinalY(doc, 138) + 20;
    doc.setFillColor(248, 249, 250);
    doc.rect(20, productionY + 10, 170, 25, 'F');
    
    doc.setTextColor(52, 73, 94);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text("PRODUCTION SPECIFICATIONS:", 25, productionY + 20);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`• Plates Required: ${op.plates || 0}`, 25, productionY + 27);
    doc.text(`• Production Units: ${op.units || formData.products.reduce((sum, p) => sum + (p.quantity || 0), 0)}`, 25, productionY + 32);
    doc.text(`• Standard production time: 5-7 business days`, 120, productionY + 27);
    doc.text(`• Rush orders: 2-3 business days (additional 25% cost)`, 120, productionY + 32);

    // Production Notes Section
    const notesY = productionY + 40;
    doc.setFillColor(240, 248, 240);
    doc.rect(20, notesY + 10, 170, 20, 'F');
    
    doc.setTextColor(52, 73, 94);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text("PRODUCTION NOTES:", 25, notesY + 20);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text("• Quality control checkpoints at each production stage", 25, notesY + 27);
    doc.text("• Final approval required before delivery", 25, notesY + 32);
    doc.text("• Color matching to client specifications", 120, notesY + 27);
    doc.text("• Proof copy available upon request", 120, notesY + 32);

    // Production Timeline Section
    const timelineY = notesY + 40;
    doc.setFillColor(255, 248, 220); // Light yellow background
    doc.rect(20, timelineY + 10, 170, 30, 'F');
    
    doc.setTextColor(52, 73, 94);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text("PRODUCTION TIMELINE:", 25, timelineY + 20);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text("• Pre-press & Setup: 1-2 business days", 25, timelineY + 27);
    doc.text("• Printing & Production: 3-5 business days", 25, timelineY + 32);
    doc.text("• Finishing & Quality Check: 1-2 business days", 25, timelineY + 37);
    doc.text("• Rush Orders: 2-3 business days (+25% cost)", 120, timelineY + 27);
    doc.text("• Express Orders: 1 business day (+50% cost)", 120, timelineY + 32);

    // Quality Assurance Section
    const qualityY = timelineY + 50;
    doc.setFillColor(240, 255, 240); // Light green background
    doc.rect(20, qualityY + 10, 170, 25, 'F');
    
    doc.setTextColor(52, 73, 94);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text("QUALITY ASSURANCE:", 25, qualityY + 20);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text("• Color accuracy within ±2% tolerance", 25, qualityY + 27);
    doc.text("• Dimensional accuracy ±0.5mm", 25, qualityY + 32);
    doc.text("• Material quality verification", 120, qualityY + 27);
    doc.text("• Final inspection & packaging", 120, qualityY + 32);

    // Technical Specifications Section
    const technicalY = qualityY + 45;
    doc.setFillColor(248, 240, 255); // Light purple background
    doc.rect(20, technicalY + 10, 170, 25, 'F');
    
    doc.setTextColor(52, 73, 94);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text("TECHNICAL SPECIFICATIONS:", 25, technicalY + 20);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`• Printing Resolution: ${formData.products[0]?.printingSelection === 'Digital' ? '1200 DPI' : '2400 DPI'}`, 25, technicalY + 27);
    doc.text(`• Color Mode: ${formData.products[0]?.colors?.front?.includes('CMYK') ? 'CMYK + Spot Colors' : 'CMYK'}`, 25, technicalY + 32);
    doc.text(`• Paper Weight Range: 80-400 GSM`, 120, technicalY + 27);
    doc.text(`• Finishing Options: ${formData.operational.finishing.map(f => f.name).join(', ')}`, 120, technicalY + 32);

    // Operational Cost Breakdown Section
    const costY = technicalY + 45;
    doc.setFillColor(255, 240, 245); // Light pink background
    doc.rect(20, costY + 10, 170, 30, 'F');
    
    doc.setTextColor(52, 73, 94);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text("OPERATIONAL COST BREAKDOWN:", 25, costY + 20);
    
    // Calculate operational costs
    const paperCosts = formData.operational.papers.reduce((total, p) => {
      const pricePerSheet = (p.pricePerPacket || 0) / (p.sheetsPerPacket || 1);
      const actualSheetsNeeded = p.enteredSheets || 0;
      return total + (pricePerSheet * actualSheetsNeeded);
    }, 0);
    
    const platesCost = (formData.operational.plates || 0) * 35; // $35 per plate
    const finishingCosts = formData.operational.finishing.reduce((total, f) => {
      if (formData.products.some(product => product.finishing.includes(f.name))) {
        return total + ((f.cost || 0) * (formData.operational.units || 0));
      }
      return total;
    }, 0);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`• Paper Costs: ${currency(paperCosts)}`, 25, costY + 27);
    doc.text(`• Plates Cost: ${currency(platesCost)}`, 25, costY + 32);
    doc.text(`• Finishing Costs: ${currency(finishingCosts)}`, 25, costY + 37);
    doc.text(`• Total Material Cost: ${currency(paperCosts + platesCost + finishingCosts)}`, 120, costY + 27);
    doc.text(`• Production Units: ${formData.operational.units || formData.products.reduce((sum, p) => sum + (p.quantity || 0), 0)}`, 120, costY + 32);
    doc.text(`• Cost per Unit: ${currency((paperCosts + platesCost + finishingCosts) / (formData.operational.units || 1))}`, 120, costY + 37);

    // Production Workflow Section
    const workflowY = costY + 50;
    doc.setFillColor(240, 248, 255); // Light blue background
    doc.rect(20, workflowY + 10, 170, 25, 'F');
    
    doc.setTextColor(52, 73, 94);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text("PRODUCTION WORKFLOW:", 25, workflowY + 20);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text("1. File Preparation & Pre-press", 25, workflowY + 27);
    doc.text("2. Plate Making (if offset)", 25, workflowY + 32);
    doc.text("3. Printing & Quality Check", 120, workflowY + 27);
    doc.text("4. Finishing & Final Inspection", 120, workflowY + 32);

    // Footer
    doc.setFillColor(52, 73, 94);
    doc.rect(20, workflowY + 40, 170, 12, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text("Operations Team: +971 50-123-4567 | Email: ops@smartprinting.ae", 105, workflowY + 47, { align: 'center' });

    doc.save("quotation-operations.pdf");
    console.log("Operations PDF generated successfully");
  } catch (error) {
    console.error("Error generating operations PDF:", error);
    alert("Error generating PDF. Please check the console for details.");
  }
}
