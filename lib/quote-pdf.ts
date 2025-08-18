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

export async function downloadCustomerPdf(
  formData: QuoteFormData,
  otherQuantities: OtherQty[]
) {
  const { jsPDF } = (await import("jspdf")) as JsPDFModule;
  const autoTable = (await import("jspdf-autotable")).default as AutoTableModule["default"];

  const doc: JsPdfWithAutoTable = new jsPDF();

  const mainProduct = formData.products[0];

  // kalkulasi dummy contoh (silakan ganti pakai formData.calculation)
  const unitBase = 0.195;
  const base = (mainProduct?.quantity ?? 0) * unitBase;
  const vat = base * 0.05;
  const total = base + vat;

  doc.setFontSize(16);
  doc.text("Quotation - Customer Copy", 14, 18);
  doc.setFontSize(10);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 24);

  const c = formData.client;
  doc.text(
    `Client: ${c.clientType === "Company" ? c.companyName : c.contactPerson}`,
    14,
    30
  );
  doc.text(`Contact: ${c.contactPerson || "-"}`, 14, 35);
  doc.text(`Email: ${c.email || "-"}`, 14, 40);
  doc.text(`Phone: ${c.countryCode} ${c.phone || "-"}`, 14, 45);

  autoTable(doc, {
    startY: 52,
    head: [["Product Name", "Quantity", "Price", "VAT (5%)", "Total"]],
    body: [
      [
        mainProduct?.productName ?? "—",
        String(mainProduct?.quantity ?? 0),
        currency(base),
        currency(vat),
        currency(total),
      ],
    ],
    styles: { fontSize: 10 },
    headStyles: { fillColor: [240, 240, 240] },
  });

  if (otherQuantities.length) {
    autoTable(doc, {
      startY: getFinalY(doc, 52) + 8,
      head: [["Other Quantities", "Quantity", "Price", "VAT (5%)", "Total"]],
      body: otherQuantities.map((o) => {
        const b = typeof o.price === "number" ? o.price : 0;
        const v = b * 0.05;
        const t = b + v;
        return [
          o.productName || "—",
          String(o.quantity || 0),
          currency(b),
          currency(v),
          currency(t),
        ];
      }),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [240, 240, 240] },
    });
  }

  doc.save("quotation-customer.pdf");
}

export async function downloadOpsPdf(
  formData: QuoteFormData,
  otherQuantities: OtherQty[]
) {
  const { jsPDF } = (await import("jspdf")) as JsPDFModule;
  const autoTable = (await import("jspdf-autotable")).default as AutoTableModule["default"];

  const doc: JsPdfWithAutoTable = new jsPDF();

  const p = formData.products[0];
  const op = formData.operational;

  doc.setFontSize(16);
  doc.text("Quotation - Operations Copy", 14, 18);
  doc.setFontSize(10);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 24);

  autoTable(doc, {
    startY: 30,
    head: [["Field", "Value"]],
    body: [
      ["Product Name", p?.productName ?? "—"],
      ["Quantity", String(p?.quantity ?? 0)],
      ["Sides", p?.sides ?? "—"],
      ["Printing", p?.printingSelection ?? "—"],
      [
        "Size (Close)",
        `${p?.closeSize?.width ?? "—"} × ${p?.closeSize?.height ?? "—"} cm (spine ${
          p?.closeSize?.spine ?? 0
        })`,
      ],
      ["Finishing", p?.finishing?.length ? p.finishing.join(", ") : "—"],
    ],
    styles: { fontSize: 10 },
    headStyles: { fillColor: [240, 240, 240] },
  });

  if (op.papers?.length) {
    autoTable(doc, {
      startY: getFinalY(doc, 30) + 8,
      head: [["Paper #", "Input WxH (cm)", "Sheets/Packet", "Price/Packet", "Entered Sheets"]],
      body: op.papers.map((pp, i) => [
        String(i + 1),
        `${pp.inputWidth ?? "—"} × ${pp.inputHeight ?? "—"}`,
        String(pp.sheetsPerPacket ?? "—"),
        typeof pp.pricePerPacket === "number"
          ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
              pp.pricePerPacket
            )
          : "—",
        String(pp.enteredSheets ?? "—"),
      ]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [240, 240, 240] },
    });
  }

  const selectedFin = op.finishing.filter((f) => (p?.finishing ?? []).includes(f.name));
  if (selectedFin.length) {
    autoTable(doc, {
      startY: getFinalY(doc, 30) + 8,
      head: [["Finishing", "Cost"]],
      body: selectedFin.map((f) => [
        f.name,
        typeof f.cost === "number"
          ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(f.cost)
          : "—",
      ]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [240, 240, 240] },
    });
  }

  if (otherQuantities.length) {
    autoTable(doc, {
      startY: getFinalY(doc, 30) + 8,
      head: [["Other Quantities", "Quantity", "Price", "VAT (5%)", "Total"]],
      body: otherQuantities.map((o) => {
        const b = typeof o.price === "number" ? o.price : 0;
        const v = b * 0.05;
        const t = b + v;
        return [
          o.productName || "—",
          String(o.quantity || 0),
          currency(b),
          currency(v),
          currency(t),
        ];
      }),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [240, 240, 240] },
    });
  }

  doc.save("quotation-operations.pdf");
}
