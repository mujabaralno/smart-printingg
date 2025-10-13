/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Calendar,
  Download,
  ChevronDown as ChevronDownIcon,
  FileTextIcon,
  Funnel,
} from "lucide-react";
import CreateQuoteModal from "@/components/create-quote/CreateQuoteModal";
import StatusBadge from "@/components/shared/StatusBadge";
import { quotes as QUOTES, users as USERS } from "@/constants";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadCustomerPdf, downloadOpsPdf } from "@/lib/quote-pdf";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import StatusPill from "@/components/shared/StatusPill";
import { Skeleton } from "@/components/ui/skeleton";
import { QuotesTable } from "@/components/shared/QuotesTable";
import QuotesMobileCards from "@/components/shared/MobileCardQuote";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type Status = "Approved" | "Pending" | "Rejected";
type StatusFilter = "all" | Status;
type MultiStatusFilter = Status[];
type UserFilter = "all" | string;

type Row = (typeof QUOTES)[number] & {
  quoteId?: string;
  productName?: string;
  product?: string; // This field is used in the table display
  quantity?: number;
  totalAmount: number;
  // New Step 3 fields
  printingSelection?: string;
  printing?: string; // Keep for backward compatibility
  sides?: string;
  flatSize?: {
    width: number | null;
    height: number | null;
    spine: number | null;
  };
  closeSize?: {
    width: number | null;
    height: number | null;
    spine: number | null;
  };
  useSameAsFlat?: boolean;
  colors?: {
    front?: string;
    back?: string;
  } | null;
  // Papers and finishing for database operations
  papers?: Array<{ name: string; gsm: string }>;
  finishing?: string[];
  // Client relationship tracking
  originalClientId?: string | null;
};

const currency = new Intl.NumberFormat("en-AE", {
  style: "currency",
  currency: "AED",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });

const PAGE_SIZE = 20; // Increased from 7 to 20 as per requirements

export default function QuoteManagementPage() {
  const [rows, setRows] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showNewQuoteNotification, setShowNewQuoteNotification] =
    React.useState(false);
  const [newQuoteCount, setNewQuoteCount] = React.useState(0);
  const [downloadingPDF, setDownloadingPDF] = React.useState<string | null>(
    null
  );
  const [downloadSuccess, setDownloadSuccess] = React.useState<string | null>(
    null
  );
  const [isCreateQuoteModalOpen, setIsCreateQuoteModalOpen] =
    React.useState(false);

  // ===== filter & paging =====
  const [search, setSearch] = React.useState("");
  const [from, setFrom] = React.useState<string>("");
  const [to, setTo] = React.useState<string>("");
  const [status, setStatus] = React.useState<StatusFilter>("all");
  const [contactPerson, setContactPerson] = React.useState<UserFilter>("all");
  const [minAmount, setMinAmount] = React.useState<string>("");
  const [maxAmount, setMaxAmount] = React.useState<string>("");
  const [keywordFilter, setKeywordFilter] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [showAll, setShowAll] = React.useState(false); // New state for show more option
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  React.useEffect(
    () => setPage(1),
    [
      search,
      from,
      to,
      status,
      contactPerson,
      minAmount,
      maxAmount,
      keywordFilter,
    ]
  );

  // Load contact persons for filter dropdown
  const [filterContactPersons, setFilterContactPersons] = React.useState<
    Array<{ id: string; name: string }>
  >([]);

  React.useEffect(() => {
    const loadContactPersons = async () => {
      try {
        const response = await fetch("/api/clients");
        if (response.ok) {
          const clients = await response.json();
          // Extract unique contact persons
          const contactPersons = clients.reduce((acc: any[], client: any) => {
            if (
              client.contactPerson &&
              !acc.find((cp) => cp.name === client.contactPerson)
            ) {
              acc.push({
                id: client.contactPerson,
                name: client.contactPerson,
              });
            }
            return acc;
          }, []);
          setFilterContactPersons(contactPersons);
        }
      } catch (error) {
        console.error("Error loading contact persons for filter:", error);
        // Fallback to extracting from current rows if API fails
        const contactPersons = rows.reduce((acc: any[], row: any) => {
          if (
            row.contactPerson &&
            !acc.find((cp) => cp.name === row.contactPerson)
          ) {
            acc.push({
              id: row.contactPerson,
              name: row.contactPerson,
            });
          }
          return acc;
        }, []);
        setFilterContactPersons(contactPersons);
      }
    };

    loadContactPersons();
  }, [rows]);

  // Load quotes from database on page load
  React.useEffect(() => {
    const loadQuotes = async () => {
      try {
        setLoading(true);
        // Add cache-busting to ensure fresh data
        const response = await fetch("/api/quotes?t=" + Date.now());
        console.log(
          "🔍 DEBUG: API Response status:",
          response.status,
          response.statusText
        );
        if (response.ok) {
          const quotes = await response.json();
          console.log("Raw quotes from database:", quotes);
          console.log("🔍 DEBUG: First quote client data:", quotes[0]?.client);
          console.log(
            "🔍 DEBUG: First quote clientName should be:",
            quotes[0]?.client?.companyName ||
              quotes[0]?.client?.contactPerson ||
              "N/A"
          );
          // Transform database quotes to match Row format
          const transformedQuotes = quotes.map((quote: any) => ({
            id: quote.id, // Use database ID for operations
            quoteId:
              quote.quoteId ||
              `QT-${new Date(quote.date).getFullYear()}-${String(
                new Date(quote.date).getMonth() + 1
              ).padStart(2, "0")}-${String(
                new Date(quote.date).getDate()
              ).padStart(2, "0")}-${Math.floor(Math.random() * 1000)
                .toString()
                .padStart(3, "0")}`, // Generate quote ID if missing
            clientName:
              quote.client?.companyName &&
              quote.client.companyName.trim() !== ""
                ? quote.client.companyName
                : quote.client?.contactPerson &&
                  quote.client.contactPerson.trim() !== ""
                ? quote.client.contactPerson
                : "N/A",
            contactPerson: quote.client?.contactPerson || "Unknown Contact",
            date: quote.date.split("T")[0], // Convert ISO date to YYYY-MM-DD
            amount: quote.amounts?.total || 0,
            status: quote.status as Status,
            userId: quote.user?.id || "cmejqfk3s0000x5a98slufy9n", // Use real admin user ID as fallback
            product:
              quote.productName ||
              quote.product ||
              (quote.papers && quote.papers.length > 0
                ? quote.papers[0].name
                : "Printing Product"), // Use productName if available
            productName:
              quote.productName ||
              quote.product ||
              (quote.papers && quote.papers.length > 0
                ? quote.papers[0].name
                : "Printing Product"), // Keep for backward compatibility
            quantity: quote.quantity || 0,
            // New Step 3 fields
            sides: quote.sides || "1", // Map the sides field
            printingSelection:
              quote.printingSelection || quote.printing || "Digital",
            flatSize: {
              width: quote.flatSizeWidth,
              height: quote.flatSizeHeight,
              spine: quote.flatSizeSpine,
            },
            closeSize: {
              width: quote.closeSizeWidth,
              height: quote.closeSizeHeight,
              spine: quote.closeSizeSpine,
            },
            useSameAsFlat: quote.useSameAsFlat || false,
            colors: quote.colors
              ? typeof quote.colors === "string"
                ? JSON.parse(quote.colors)
                : quote.colors
              : null,
            // Papers and finishing for database operations
            papers: quote.papers || [],
            finishing: quote.finishing || [],
            // Client relationship tracking
            originalClientId: quote.clientId || null,
          }));
          console.log("Transformed quotes:", transformedQuotes);
          console.log(
            "🔍 DEBUG: First transformed quote clientName:",
            transformedQuotes[0]?.clientName
          );
          setRows(transformedQuotes);
        } else {
          console.error("Failed to load quotes - API returned non-OK status");
          // Don't fallback to dummy data - show empty state instead
          setRows([]);
        }
      } catch (error) {
        console.error("Error loading quotes:", error);
        // Don't fallback to dummy data - show empty state instead
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    loadQuotes();
  }, []);

  // Note: Quotes are now loaded from the database through the main dashboard
  // This page will be updated to use the database service in future iterations

  const filtered = React.useMemo(() => {
    const filteredQuotes = rows.filter((q) => {
      const s = search.trim().toLowerCase();
      const k = keywordFilter.trim().toLowerCase();

      // Enhanced search to include quote number, client name, and person name as per requirements
      const hitSearch =
        s === "" ||
        q.id.toLowerCase().includes(s) ||
        q.clientName.toLowerCase().includes(s) ||
        q.contactPerson.toLowerCase().includes(s);

      // Keyword filter for client, quotation number, product, date, and amount
      const hitKeyword =
        k === "" ||
        q.clientName.toLowerCase().includes(k) ||
        q.contactPerson.toLowerCase().includes(k) ||
        q.quoteId?.toLowerCase().includes(k) ||
        q.productName?.toLowerCase().includes(k) ||
        q.product?.toLowerCase().includes(k) ||
        q.date.toLowerCase().includes(k) ||
        q.amount.toString().includes(k);

      // Status filter
      const hitStatus = status === "all" || q.status === status;

      const hitContactPerson =
        contactPerson === "all" || q.contactPerson === contactPerson;

      // Amount range filter
      const hitMinAmount = minAmount === "" || q.amount >= Number(minAmount);
      const hitMaxAmount = maxAmount === "" || q.amount <= Number(maxAmount);

      const hitFrom = from === "" || q.date >= from;
      const hitTo = to === "" || q.date <= to;

      return (
        hitSearch &&
        hitKeyword &&
        hitStatus &&
        hitContactPerson &&
        hitMinAmount &&
        hitMaxAmount &&
        hitFrom &&
        hitTo
      );
    });

    // Sort by newest first (most recent date first)
    const sorted = [...filteredQuotes].sort((a, b) => {
      const dateA = new Date(a.date || 0);
      const dateB = new Date(b.date || 0);
      return dateB.getTime() - dateA.getTime(); // Newest first
    });

    return sorted;
  }, [
    rows,
    search,
    keywordFilter,
    from,
    to,
    status,
    contactPerson,
    minAmount,
    maxAmount,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil((filtered?.length ?? 0) / rowsPerPage)
  );
  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, filtered?.length ?? 0);

  React.useEffect(() => {
    const tp = Math.max(1, Math.ceil((filtered?.length ?? 0) / rowsPerPage));
    if (page > tp) setPage(1);
  }, [filtered, rowsPerPage, page]);

  const current = React.useMemo(
    () => (filtered ?? []).slice(startIndex, endIndex),
    [filtered, startIndex, endIndex]
  );

  const approvedCount = filtered.filter((q) => q.status === "Approved").length;
  const pendingCount = filtered.filter((q) => q.status === "Pending").length;
  const rejectedCount = filtered.filter((q) => q.status === "Rejected").length;

  const [draft, setDraft] = React.useState<{
    id: string;
    clientName: string;
    contactPerson: string;
    date: string;
    amount: number | "";
    status: Status;
    userId: string;
    productName?: string;
    quantity?: number | "";
    // New Step 3 fields
    printingSelection?: string;
    sides?: string;
    flatSize: {
      width: number | null;
      height: number | null;
      spine: number | null;
    };
    closeSize: {
      width: number | null;
      height: number | null;
      spine: number | null;
    };
    useSameAsFlat?: boolean;
    colors?: { front?: string; back?: string } | null;
    // Papers and finishing for database operations
    papers?: Array<{ name: string; gsm: string }>;
    finishing?: string[];
    originalClientId?: string | null; // Added for client relationship tracking
  }>({
    id: "",
    clientName: "",
    contactPerson: "",
    date: "",
    amount: "",
    status: "Approved",
    userId: "cmejqfk3s0000x5a98slufy9n", // Use real admin user ID instead of dummy data
    productName: "",
    quantity: "",
    // Initialize Step 3 fields
    printingSelection: "Digital",
    sides: "1",
    flatSize: { width: null, height: null, spine: null },
    closeSize: { width: null, height: null, spine: null },
    useSameAsFlat: true,
    colors: { front: "", back: "" },
    // Initialize papers and finishing
    papers: [],
    finishing: [],
    originalClientId: null,
  });

  const [openEdit, setOpenEdit] = React.useState(false);

  const onEdit = (id: string) => {
    const q = rows.find((r) => r.id === id);
    if (!q) return;

    // Get the original quote data from the database to ensure we have all the correct relationships
    const loadQuoteData = async () => {
      try {
        console.log("Loading quote data for editing, quote ID:", id);
        console.log("Current row data:", q);

        const response = await fetch(`/api/quotes/${id}`);
        if (response.ok) {
          const quoteData = await response.json();
          console.log("Raw quote data from API:", quoteData);

          // Parse colors if it's a string
          let parsedColors = { front: "", back: "" };
          if (quoteData.colors) {
            try {
              if (typeof quoteData.colors === "string") {
                parsedColors = JSON.parse(quoteData.colors);
              } else {
                parsedColors = quoteData.colors;
              }
            } catch (e) {
              console.warn("Failed to parse colors:", e);
              parsedColors = { front: "", back: "" };
            }
          }
          console.log("Parsed colors:", parsedColors);

          // Ensure size fields are properly handled
          const flatSize = {
            width: quoteData.flatSizeWidth || q.flatSize?.width || null,
            height: quoteData.flatSizeHeight || q.flatSize?.height || null,
            spine: quoteData.flatSizeSpine || q.flatSize?.spine || null,
          };
          console.log("Flat size data:", flatSize);

          const closeSize = {
            width:
              quoteData.closeSizeWidth || q.closeSize?.width || flatSize.width,
            height:
              quoteData.closeSizeHeight ||
              q.closeSize?.height ||
              flatSize.height,
            spine:
              quoteData.closeSizeSpine || q.closeSize?.spine || flatSize.spine,
          };
          console.log("Close size data:", closeSize);

          // Determine if useSameAsFlat should be true based on whether sizes are the same
          const useSameAsFlat =
            quoteData.useSameAsFlat !== undefined
              ? quoteData.useSameAsFlat
              : flatSize.width === closeSize.width &&
                flatSize.height === closeSize.height &&
                flatSize.spine === closeSize.spine;
          console.log("Use same as flat:", useSameAsFlat);

          const draftData = {
            id: quoteData.id,
            clientName:
              quoteData.client?.companyName ||
              quoteData.client?.contactPerson ||
              q.clientName,
            contactPerson: quoteData.client?.contactPerson || q.contactPerson,
            date: quoteData.date
              ? new Date(quoteData.date).toISOString().split("T")[0]
              : q.date,
            amount: quoteData.amounts?.total || q.amount,
            status: quoteData.status || q.status,
            userId: quoteData.userId || q.userId,
            productName:
              quoteData.product || quoteData.productName || q.productName || "",
            quantity: quoteData.quantity || q.quantity || "",
            // New Step 3 fields
            printingSelection:
              quoteData.printingSelection ||
              quoteData.printing ||
              q.printingSelection ||
              "Digital",
            sides: quoteData.sides || q.sides || "1",
            flatSize,
            closeSize,
            useSameAsFlat,
            colors: parsedColors,
            // Papers and finishing for database operations
            papers: quoteData.papers || [],
            finishing: quoteData.finishing || [],
            // Store the original client ID to prevent foreign key issues
            originalClientId: quoteData.clientId,
          };

          console.log("Setting draft with data:", draftData);
          setDraft(draftData);
        } else {
          // Fallback to row data if API call fails
          console.warn("API call failed, using row data as fallback");
          setDraft({
            id: q.id,
            clientName: q.clientName,
            contactPerson: q.contactPerson,
            date: q.date,
            amount: q.amount,
            status: q.status,
            userId: q.userId,
            productName: q.product ?? q.productName ?? "",
            quantity: typeof q.quantity === "number" ? q.quantity : "",
            // New Step 3 fields
            printingSelection: q.printingSelection || q.printing || "Digital",
            sides: q.sides || "1",
            flatSize: q.flatSize || { width: null, height: null, spine: null },
            closeSize: q.closeSize || {
              width: null,
              height: null,
              spine: null,
            },
            useSameAsFlat: q.useSameAsFlat || false,
            colors: q.colors || { front: "", back: "" },
            // Include papers and finishing from row data
            papers: q.papers || [],
            finishing: q.finishing || [],
            originalClientId: q.originalClientId || null,
          });
        }
      } catch (error) {
        console.error("Error loading quote data for editing:", error);
        // Fallback to row data
        setDraft({
          id: q.id,
          clientName: q.clientName,
          contactPerson: q.contactPerson,
          date: q.date,
          amount: q.amount,
          status: q.status,
          userId: q.userId,
          productName: q.product ?? q.productName ?? "",
          quantity: typeof q.quantity === "number" ? q.quantity : "",
          // New Step 3 fields
          printingSelection: q.printingSelection || q.printing || "Digital",
          sides: q.sides || "1",
          flatSize: q.flatSize || { width: null, height: null, spine: null },
          closeSize: q.closeSize || { width: null, height: null, spine: null },
          useSameAsFlat: q.useSameAsFlat || false,
          colors: q.colors || { front: "", back: "" },
          // Include papers and finishing from row data
          papers: q.papers || [],
          finishing: q.finishing || [],
          originalClientId: q.originalClientId || null,
        });
      }
    };

    loadQuoteData();
    setOpenEdit(true);
  };

  const onSubmitEdit = async () => {
    if (
      !draft.id ||
      !draft.clientName ||
      !draft.contactPerson ||
      !draft.date ||
      draft.amount === ""
    ) {
      alert("Please complete all required fields.");
      return;
    }

    try {
      console.log("Starting quote update for:", draft.id);

      // Get the client ID - this should always exist for existing quotes
      const clientId = draft.originalClientId;

      if (!clientId) {
        throw new Error(
          "Cannot update quote: Client ID not found. Please refresh the page and try again."
        );
      }

      console.log("Using existing client:", clientId);

      // Update quote in database with correct schema mapping
      const updateData = {
        clientId: clientId,
        date: new Date(draft.date + "T00:00:00.000Z"), // Convert to Date object
        status: draft.status,
        userId: draft.userId || null, // Include userId
        product: draft.productName?.trim() || "Printing Product",
        quantity: draft.quantity === "" ? 0 : Number(draft.quantity),
        sides: draft.sides || "1", // Default to 1 side since not in edit form
        printing: draft.printingSelection || "Digital", // Default to Digital printing since not in edit form
        // New Step 3 fields - map to the correct database schema fields
        printingSelection: draft.printingSelection,
        flatSizeWidth: draft.flatSize?.width || null,
        flatSizeHeight: draft.flatSize?.height || null,
        flatSizeSpine: draft.flatSize?.spine || null,
        closeSizeWidth: draft.closeSize?.width || null,
        closeSizeHeight: draft.closeSize?.height || null,
        closeSizeSpine: draft.closeSize?.spine || null,
        useSameAsFlat: draft.useSameAsFlat,
        colors: draft.colors ? JSON.stringify(draft.colors) : null,
        // Handle amounts separately - this will be processed by the API
        amounts: {
          base: Number(draft.amount) * 0.8, // Calculate base amount (80% of total)
          vat: Number(draft.amount) * 0.2, // Calculate VAT (20% of total)
          total: Number(draft.amount), // Total amount from form
        },
      };

      console.log("=== QUOTE UPDATE DEBUG ===");
      console.log("Quote ID:", draft.id);
      console.log("Client ID:", clientId);
      console.log("Draft papers:", draft.papers);
      console.log("Draft finishing:", draft.finishing);
      console.log("Draft userId:", draft.userId);
      console.log("Full update data:", JSON.stringify(updateData, null, 2));
      console.log("=== END DEBUG ===");

      const response = await fetch(`/api/quotes/${draft.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Quote update failed:", response.status, errorData);
        throw new Error(
          errorData.error || `HTTP ${response.status}: Failed to update quote`
        );
      }

      const updatedQuote = await response.json();
      console.log("Quote updated successfully:", updatedQuote);

      // Update local state
      setRows((prev): Row[] =>
        prev.map((r) =>
          r.id === draft.id
            ? {
                ...r,
                clientName: draft.clientName,
                contactPerson: draft.contactPerson,
                date: draft.date,
                amount: Number(draft.amount),
                status: draft.status,
                userId: draft.userId,
                productName: draft.productName?.trim() || r.productName,
                quantity:
                  draft.quantity === "" ? r.quantity : Number(draft.quantity),
                // New Step 3 fields
                printingSelection:
                  draft.printingSelection || r.printingSelection,
                flatSize: draft.flatSize || r.flatSize,
                closeSize: draft.closeSize || r.closeSize,
                useSameAsFlat: draft.useSameAsFlat || r.useSameAsFlat,
                colors: draft.colors || r.colors,
              }
            : r
        )
      );

      setOpenEdit(false);
    } catch (error) {
      console.error("Error updating quote:", error);

      // Show more specific error message
      let errorMessage = "Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;

        // Handle specific error cases
        if (error.message.includes("Client ID not found")) {
          errorMessage =
            "Client information is missing. Please refresh the page and try again.";
        } else if (error.message.includes("Failed to update quote")) {
          errorMessage =
            "Database update failed. Please check your internet connection and try again.";
        } else if (error.message.includes("Foreign key constraint")) {
          errorMessage =
            "Invalid data reference. Please refresh the page and try again.";
        }
      }

      alert(`Error updating quote: ${errorMessage}`);
    }
  };

  // ===== modal VIEW (Eye) =====
  const [openView, setOpenView] = React.useState(false);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [viewRow, setViewRow] = React.useState<Row | null>(null);

  const onView = (row: Row) => {
    setViewRow(row);
    setOpenView(true);
  };

  const viewTotal = (row: Row | null) =>
    row ? currency.format(row.amount) : "—";

  // Function to handle PDF download for approved quotes
  const handleCalculateAmount = async (quoteId: string) => {
    try {
      console.log("🔢 Calculating amount for quote:", quoteId);
      const response = await fetch("/api/quotes/calculate-amounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quoteId }),
      });

      if (response.ok) {
        console.log("✅ Amount calculated successfully");
        // Refresh the quotes to show updated amounts
        window.location.reload();
      } else {
        console.error("❌ Failed to calculate amount");
      }
    } catch (error) {
      console.error("❌ Error calculating amount:", error);
    }
  };

  const handleDownloadPDF = async (
    quote: Row,
    type: "customer" | "operations"
  ) => {
    const downloadId = `${quote.id}-${type}`;

    // Prevent concurrent downloads
    if (downloadingPDF) {
      console.log("Download already in progress, please wait...");
      return;
    }

    setDownloadingPDF(downloadId);

    try {
      // Create a comprehensive QuoteFormData structure for PDF generation
      const mockFormData = {
        client: {
          clientType: "Company" as const,
          companyName: quote.clientName,
          contactPerson: quote.contactPerson,
          email: "customer@example.com", // Default email
          phone: "123456789", // Default phone
          countryCode: "+971",
          role: "Customer",
          address: "Sheikh Zayed Road, Business Bay",
          city: "Dubai",
          state: "Dubai",
          postalCode: "12345",
          country: "UAE",
        },
        products: [
          {
            productName: String(
              quote.product || quote.productName || "Printing Product"
            ),
            paperName: "Premium Paper",
            quantity: Number(quote.quantity) || 100,
            sides: "2" as const,
            printingSelection: "Offset" as const,
            flatSize: { width: 21, height: 29.7, spine: 0 },
            closeSize: { width: 21, height: 29.7, spine: 0 },
            useSameAsFlat: true,
            papers: [{ name: "Premium Paper", gsm: "350" }],
            finishing: ["UV Spot", "Foil Stamping"],
            colors: { front: "4 Colors (CMYK)", back: "2 Colors (CMYK)" },
          },
        ],
        operational: {
          papers: [
            {
              inputWidth: 21,
              inputHeight: 29.7,
              pricePerPacket: 25.5,
              pricePerSheet: 0.85,
              sheetsPerPacket: 30,
              recommendedSheets: 100,
              enteredSheets: 120,
              outputWidth: 21,
              outputHeight: 29.7,
              selectedColors: ["CMYK", "Spot Color"],
            },
          ],
          finishing: [
            {
              name: "UV Spot",
              cost: 0.15,
            },
            {
              name: "Foil Stamping",
              cost: 0.25,
            },
          ],
          plates: 2,
          units: Number(quote.quantity) || 100,
        },
        calculation: {
          basePrice: Number(quote.amount) || 1000,
          marginAmount: 0,
          subtotal: Number(quote.amount) || 1000,
          vatAmount: 0,
          totalPrice: Number(quote.amount) || 1000,
        },
      };

      console.log("Starting PDF download for:", { type, quoteId: quote.id });

      // Call the appropriate PDF generation function
      if (type === "customer") {
        await downloadCustomerPdf(mockFormData, []);
        setDownloadSuccess(
          `${quote.id} - Customer PDF downloaded successfully!`
        );
      } else if (type === "operations") {
        await downloadOpsPdf(mockFormData, []);
        setDownloadSuccess(
          `${quote.id} - Operations PDF downloaded successfully!`
        );
      }

      // Clear success message after 3 seconds
      setTimeout(() => {
        setDownloadSuccess(null);
      }, 3000);
    } catch (error) {
      if (error instanceof Error) {
        console.error("❌ Error downloading PDF:", error.message);
        console.error("Error details:", {
          message: error.message,
          stack: error.stack,
          type: typeof error,
        });
      } else {
        console.error("❌ Unknown error:", error);
      }
    } finally {
      setDownloadingPDF(null);
    }
  };

  const handleCreateQuote = (newQuote: any) => {
    // Add the new quote to the existing quotes
    const updatedRows = [...rows, newQuote];
    setRows(updatedRows);

    // Show success notification
    setNewQuoteCount((prev) => prev + 1);
    setShowNewQuoteNotification(true);

    // Hide notification after 3 seconds
    setTimeout(() => {
      setShowNewQuoteNotification(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen  p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex gap-5">
          <div className="md:inline-flex hidden items-center justify-center md:w-16 md:h-16  bg-[#27aae1] rounded-full shadow-lg">
            <FileTextIcon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Quote Management
            </h1>
            <p className="text-gray-600 mt-2">
              Manage and track all your printing quotations. View, edit, and
              monitor quote statuses.
            </p>
          </div>
        </div>

        {/* Quote Summary */}
        <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 border border-slate-200">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center flex-col flex justify-center items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mx-auto mb-2"></div>
                <div className="text-sm text-slate-600">Total Items</div>
                <div className="text-lg font-bold text-slate-900">
                  <Skeleton className="h-8 rounded-full w-8" />
                </div>
              </div>
              <div className="text-center flex flex-col justify-center items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
                <div className="text-sm text-slate-600">Approved</div>
                <div className="text-lg font-bold text-slate-900">
                  <Skeleton className="h-8 rounded-full w-8" />
                </div>
              </div>
              <div className="text-center flex flex-col justify-center items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mx-auto mb-2"></div>
                <div className="text-sm text-slate-600">Pending</div>
                <div className="text-lg font-bold text-slate-900">
                  <Skeleton className="h-8 rounded-full w-8" />
                </div>
              </div>
              <div className="text-center flex flex-col justify-center items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mx-auto mb-2"></div>
                <div className="text-sm text-slate-600">Rejected</div>
                <div className="text-lg font-bold text-slate-900">
                  <Skeleton className="h-8 rounded-full w-8" />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mx-auto mb-2"></div>
                <div className="text-sm text-slate-600">Total Items</div>
                <div className="text-lg font-bold text-slate-900">
                  {filtered.length}
                </div>
              </div>
              <div className="text-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
                <div className="text-sm text-slate-600">Approved</div>
                <div className="text-lg font-bold text-slate-900">
                  {approvedCount}
                </div>
              </div>
              <div className="text-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mx-auto mb-2"></div>
                <div className="text-sm text-slate-600">Pending</div>
                <div className="text-lg font-bold text-slate-900">
                  {pendingCount}
                </div>
              </div>
              <div className="text-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mx-auto mb-2"></div>
                <div className="text-sm text-slate-600">Rejected</div>
                <div className="text-lg font-bold text-slate-900">
                  {rejectedCount}
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Search and Create Quote */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by quote number, client name, or person name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-12 text-base"
            />
          </div>
          <Button
            onClick={() => setIsCreateQuoteModalOpen(true)}
            className="bg-[#27aae1] hover:bg-[#1e8bc3] md:flex hidden text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 h-12 w-full sm:w-auto"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create a New Quote
          </Button>
        </div>
        {/* filter mobile */}
        <div className="w-full md:hidden flex justify-between items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-10  rounded-lg ">
                <Funnel className="h-4 w-4 mr-2" /> Filter
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="md:w-[28rem] w-[20rem] p-4"
            >
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  From Date - To Date
                </label>
                <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-2">
                  <Calendar className="h-4 w-4 text-slate-500" />
                  <input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="h-9 w-full md:w-[9.5rem] text-sm outline-none"
                  />
                  <span className="text-slate-400">–</span>
                  <input
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="h-9 w-full  md:w-[9.5rem] text-sm outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Status
                  </label>
                  <Select
                    value={status}
                    onValueChange={(v: StatusFilter) => setStatus(v)}
                  >
                    <SelectTrigger className=" w-[9rem] rounded-lg border-slate-300">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Contact Person
                  </label>
                  <Select
                    value={contactPerson}
                    onValueChange={(v: string) => setContactPerson(v)}
                  >
                    <SelectTrigger className="h-10 w-[9rem] rounded-lg border-slate-300">
                      <SelectValue placeholder="Contact" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <SelectItem value="all">Contact Person</SelectItem>
                      {filterContactPersons.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Amount Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Amount Range
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value)}
                      className=""
                    />
                    <span className="text-slate-400">–</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(e.target.value)}
                      className=""
                    />
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <div className="flex justify-end w-36">
            <Button
              onClick={() => setIsCreateQuoteModalOpen(true)}
              className="bg-[#27aae1] hover:bg-[#1e8bc3] text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 h-10 w-full sm:w-auto"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add New Client
            </Button>
          </div>
        </div>

        {/* Quotes Table - Mobile Card */}
        <div className="space-y-6 sm:space-y-5 bg-white p-1 md:p-4 rounded-2xl shadow-sm border border-slate-200 ">
          {/* filter desktop */}
          <div className="w-full md:flex hidden md:flex-row justify-between  p-4 gap-4">
            {/* Date Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                From Date - To Date
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-2">
                <Calendar className="h-4 w-4 text-slate-500" />
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="h-9 w-[9.5rem] text-sm outline-none"
                />
                <span className="text-slate-400">–</span>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="h-9 w-[9.5rem] text-sm outline-none"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Status
              </label>
              <Select
                value={status}
                onValueChange={(v: StatusFilter) => setStatus(v)}
              >
                <SelectTrigger className=" w-[9rem] rounded-lg border-slate-300">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Contact Person */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Contact Person
              </label>
              <Select
                value={contactPerson}
                onValueChange={(v: string) => setContactPerson(v)}
              >
                <SelectTrigger className="h-10 w-[9rem] rounded-lg border-slate-300">
                  <SelectValue placeholder="Contact" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="all">Contact Person</SelectItem>
                  {filterContactPersons.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Amount Range
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  className=""
                />
                <span className="text-slate-400">–</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  className=""
                />
              </div>
            </div>
          </div>

          <div className="p-0">
            {/* Desktop Table */}
            <div className="overflow-hidden ">
              <div className="overflow-x-auto">
                <QuotesTable
                  data={filtered}
                  onView={(row) => onView(row)}
                  onEdit={(row) => onEdit(row.id)}
                  showPagination={true}
                  isLoading={loading}
                  downloadingKey={downloadingPDF}
                  onDownloadCustomer={(row: any) =>
                    handleDownloadPDF(row, "customer")
                  }
                  onDownloadOperations={(row: any) =>
                    handleDownloadPDF(row, "operations")
                  }
                />
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4">
              <QuotesMobileCards
                data={filtered}
                onView={(row) => onView(row)}
                onEdit={(row) => onEdit(row.id)}
                showPagination={true}
                isLoading={loading}
                downloadingKey={downloadingPDF}
                onDownloadCustomer={(row: any) =>
                  handleDownloadPDF(row, "customer")
                }
                onDownloadOperations={(row: any) =>
                  handleDownloadPDF(row, "operations")
                }
              />
            </div>
          </div>
        </div>
        {/* Quotes Table - Mobile */}
      </div>

      {/* ===== Modal View ===== */}

      <Sheet
        open={openView}
        modal={false}
        onOpenChange={(open) => {
          if (!open) {
            setOpenView(false);
          }
        }}
      >
        {openView && (
          <div className="fixed inset-0 bg-black/40 pointer-events-none z-40" />
        )}
        <SheetContent
          side="right"
          className="
      w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl p-0
      flex flex-col h-[100dvh]
      data-[state=open]:animate-in data-[state=closed]:animate-out
      data-[state=open]:duration-300 data-[state=closed]:duration-300
      data-[state=open]:ease-out data-[state=closed]:ease-in
      data-[state=open]:slide-in-from-right-1/2 data-[state=open]:fade-in-0
      data-[state=closed]:slide-out-to-right-1/2 data-[state=closed]:fade-out-0
      motion-reduce:transition-none motion-reduce:animate-none
    "
        >
          {/* HEADER sticky */}
          <div className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
            <SheetHeader className="px-5 py-4">
              <SheetTitle className="text-xl font-bold text-slate-900">
                Quote Details
              </SheetTitle>
              <SheetDescription className="text-slate-500">
                Review full specifications of the selected quote.
              </SheetDescription>
            </SheetHeader>
          </div>

          {/* MAIN scrollable */}
          <div className="flex-1 min-h-0 overflow-y-auto px-5">
            <div className="space-y-6 py-4">
              {/* =================== Basic Information =================== */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">
                  Basic Information
                </h3>
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="grid grid-cols-3 gap-0 text-sm">
                    <div className="col-span-1 px-4 py-3 text-slate-500 border-b border-slate-200 bg-slate-50">
                      Quote ID:
                    </div>
                    <div className="col-span-2 px-4 py-3 border-b border-slate-200 font-semibold text-slate-900">
                      {viewRow?.quoteId ?? "—"}
                    </div>

                    <div className="col-span-1 px-4 py-3 text-slate-500 border-b border-slate-200 bg-slate-50">
                      Client:
                    </div>
                    <div className="col-span-2 px-4 py-3 border-b border-slate-200 font-semibold text-slate-900">
                      {viewRow?.clientName ?? "—"}
                    </div>

                    <div className="col-span-1 px-4 py-3 text-slate-500 border-b border-slate-200 bg-slate-50">
                      Contact Person:
                    </div>
                    <div className="col-span-2 px-4 py-3 border-b border-slate-200 font-semibold text-slate-900">
                      {viewRow?.contactPerson ?? "—"}
                    </div>

                    <div className="col-span-1 px-4 py-3 text-slate-500 border-b border-slate-200 bg-slate-50">
                      Date:
                    </div>
                    <div className="col-span-2 px-4 py-3 border-b border-slate-200 font-semibold text-slate-900">
                      {viewRow?.date ? fmtDate(viewRow.date) : "—"}
                    </div>

                    <div className="col-span-1 px-4 py-3 text-slate-500 border-b border-slate-200 bg-slate-50">
                      Status:
                    </div>
                    <div className="col-span-2 px-4 py-3 border-b border-slate-200 font-semibold text-slate-900">
                      <StatusBadge value={viewRow?.status as Status} />
                    </div>

                    <div className="col-span-1 px-4 py-3 text-slate-500 bg-slate-50">
                      Total Amount:
                    </div>
                    <div className="col-span-2 px-4 py-3 border-slate-200 font-semibold text-slate-900 ">
                      {viewRow?.amount ? currency.format(viewRow.amount) : "—"}
                    </div>
                  </div>
                </div>
              </div>

              {/* =================== Product Specifications =================== */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">
                  Product Specifications
                </h3>
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="grid grid-cols-3 gap-0 text-sm">
                    <div className="col-span-1 px-4 py-3 text-slate-500 border-b border-slate-200 bg-slate-50">
                      Product Name:
                    </div>
                    <div className="col-span-2 px-4 py-3 border-b border-slate-200 font-semibold text-slate-900">
                      {viewRow?.productName ?? viewRow?.product ?? "—"}
                    </div>

                    <div className="col-span-1 px-4 py-3 text-slate-500 border-b border-slate-200 bg-slate-50">
                      Quantity:
                    </div>
                    <div className="col-span-2 px-4 py-3 border-b border-slate-200 font-semibold text-slate-900">
                      {typeof viewRow?.quantity === "number"
                        ? viewRow?.quantity.toLocaleString()
                        : "—"}
                    </div>

                    <div className="col-span-1 px-4 py-3 text-slate-500 border-b border-slate-200 bg-slate-50">
                      Printing Method:
                    </div>
                    <div className="col-span-2 px-4 py-3 border-b border-slate-200 font-semibold text-slate-900">
                      {viewRow?.printingSelection ?? viewRow?.printing ?? "—"}
                    </div>

                    <div className="col-span-1 px-4 py-3 text-slate-500 border-b border-slate-200 bg-slate-50">
                      Sides:
                    </div>
                    <div className="col-span-2 px-4 py-3 border-b border-slate-200 font-semibold text-slate-900">
                      {viewRow?.sides === "1"
                        ? "1 Side"
                        : viewRow?.sides === "2"
                        ? "2 Sides"
                        : "—"}
                    </div>
                  </div>
                </div>
              </div>

              {/* =================== Size Specifications =================== */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">
                  Size Specifications
                </h3>
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="grid grid-cols-3 gap-0 text-sm">
                    <div className="col-span-1 px-4 py-3 text-slate-500 border-b border-slate-200 bg-slate-50">
                      Flat Size (Open):
                    </div>
                    <div className="col-span-2 px-4 py-3 border-b border-slate-200 font-semibold text-slate-900">
                      {viewRow?.flatSize?.width && viewRow?.flatSize?.height
                        ? `${viewRow.flatSize.width}cm × ${
                            viewRow.flatSize.height
                          }cm${
                            viewRow.flatSize.spine
                              ? ` + ${viewRow.flatSize.spine}cm spine`
                              : ""
                          }`
                        : "—"}
                    </div>

                    <div className="col-span-1 px-4 py-3 text-slate-500 border-b border-slate-200 bg-slate-50">
                      Close Size (Closed):
                    </div>
                    <div className="col-span-2 px-4 py-3 border-b border-slate-200 font-semibold text-slate-900">
                      {viewRow?.useSameAsFlat
                        ? "Same as Flat Size"
                        : viewRow?.closeSize?.width &&
                          viewRow?.closeSize?.height
                        ? `${viewRow.closeSize.width}cm × ${
                            viewRow.closeSize.height
                          }cm${
                            viewRow.closeSize.spine
                              ? ` + ${viewRow.closeSize.spine}cm spine`
                              : ""
                          }`
                        : "—"}
                    </div>
                  </div>
                </div>
              </div>

              {/* =================== Color Specifications =================== */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">
                  Color Specifications
                </h3>
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="grid grid-cols-3 gap-0 text-sm">
                    <div className="col-span-1 px-4 py-3 text-slate-500 border-b border-slate-200 bg-slate-50">
                      Front Side:
                    </div>
                    <div className="col-span-2 px-4 py-3 border-b border-slate-200 font-semibold text-slate-900">
                      {viewRow?.colors?.front || "—"}
                    </div>

                    {viewRow?.sides === "2" && (
                      <>
                        <div className="col-span-1 px-4 py-3 text-slate-500 border-b border-slate-200 bg-slate-50">
                          Back Side:
                        </div>
                        <div className="col-span-2 px-4 py-3 border-b border-slate-200 font-semibold text-slate-900">
                          {viewRow?.colors?.back || "—"}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* =================== Additional Details =================== */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">
                  Additional Details
                </h3>
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="grid grid-cols-3 gap-0 text-sm">
                    <div className="col-span-1 px-4 py-3 text-slate-500 border-b border-slate-200 bg-slate-50">
                      User ID:
                    </div>
                    <div className="col-span-2 px-4 py-3 border-b border-slate-200 font-semibold text-slate-900">
                      {viewRow?.userId ?? "—"}
                    </div>

                    <div className="col-span-1 px-4 py-3 text-slate-500 bg-slate-50">
                      Created:
                    </div>
                    <div className="col-span-2 px-4 py-3 border-slate-200 font-semibold text-slate-900">
                      {viewRow?.date
                        ? new Date(viewRow.date).toLocaleDateString()
                        : "—"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER sticky */}
          <div className="sticky bottom-0 z-10 bg-white border-t px-5 py-3">
            <SheetFooter className="flex w-full items-center justify-end">
              <Button
                onClick={() => setOpenView(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl"
              >
                Close
              </Button>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>

      {/* ===== Modal Edit ===== */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="sm:max-w-[800px] rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">
              Edit Quote
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">
                Basic Information
              </h3>
              <div className="grid gap-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right text-sm text-slate-600 font-medium">
                    Quote ID
                  </label>
                  <Input
                    className="col-span-3 bg-slate-100 border-slate-300 rounded-xl"
                    readOnly
                    value={draft.quoteId || draft.id}
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right text-sm font-medium text-slate-700">
                    Client Name
                  </label>
                  <Input
                    className="col-span-3 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                    value={draft.clientName}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, clientName: e.target.value }))
                    }
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right text-sm font-medium text-slate-700">
                    Contact Person
                  </label>
                  <Input
                    className="col-span-3 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                    value={draft.contactPerson}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, contactPerson: e.target.value }))
                    }
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right text-sm font-medium text-slate-700">
                    Date
                  </label>
                  <Input
                    className="col-span-3 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                    type="date"
                    value={draft.date}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, date: e.target.value }))
                    }
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right text-sm font-medium text-slate-700">
                    Amount
                  </label>
                  <Input
                    className="col-span-3 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                    type="number"
                    min={0}
                    step="0.01"
                    value={draft.amount}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        amount:
                          e.target.value === "" ? "" : Number(e.target.value),
                      }))
                    }
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right text-sm font-medium text-slate-700">
                    Status
                  </label>
                  <Select
                    value={draft.status}
                    onValueChange={(v: Status) =>
                      setDraft((d) => ({ ...d, status: v }))
                    }
                  >
                    <SelectTrigger className="col-span-3 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Product Specifications */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">
                Product Specifications
              </h3>
              <div className="grid gap-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right text-sm font-medium text-slate-700">
                    Product Name
                  </label>
                  <Input
                    className="col-span-3 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                    value={draft.productName ?? ""}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, productName: e.target.value }))
                    }
                    placeholder="e.g. Business Card"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right text-sm font-medium text-slate-700">
                    Quantity
                  </label>
                  <Input
                    className="col-span-3 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                    type="number"
                    min={0}
                    value={draft.quantity ?? ""}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        quantity:
                          e.target.value === "" ? "" : Number(e.target.value),
                      }))
                    }
                    placeholder="e.g. 1000"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right text-sm font-medium text-slate-700">
                    Printing Method
                  </label>
                  <Select
                    value={
                      draft.printingSelection ?? draft.printing ?? "Digital"
                    }
                    onValueChange={(v) =>
                      setDraft((d) => ({
                        ...d,
                        printingSelection: v,
                        printing: v,
                      }))
                    }
                  >
                    <SelectTrigger className="col-span-3 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Digital">Digital</SelectItem>
                      <SelectItem value="Offset">Offset</SelectItem>
                      <SelectItem value="Either">Either</SelectItem>
                      <SelectItem value="Both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right text-sm font-medium text-slate-700">
                    Sides
                  </label>
                  <Select
                    value={draft.sides ?? "1"}
                    onValueChange={(v) => setDraft((d) => ({ ...d, sides: v }))}
                  >
                    <SelectTrigger className="col-span-3 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Side</SelectItem>
                      <SelectItem value="2">2 Sides</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Size Specifications */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">
                Size Specifications (cm)
              </h3>
              <div className="grid gap-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right text-sm font-medium text-slate-700">
                    Flat Size Width
                  </label>
                  <Input
                    className="col-span-3 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                    type="number"
                    min={0}
                    step="0.1"
                    value={draft.flatSize?.width ?? ""}
                    onChange={(e) => {
                      const newWidth =
                        e.target.value === "" ? null : Number(e.target.value);
                      setDraft((d) => ({
                        ...d,
                        flatSize: {
                          ...d.flatSize,
                          width: newWidth,
                        },
                      }));

                      // If useSameAsFlat is true, also update close size
                      if (draft.useSameAsFlat) {
                        setDraft((d) => ({
                          ...d,
                          closeSize: {
                            ...d.closeSize,
                            width: newWidth,
                          },
                        }));
                      }
                    }}
                    placeholder="e.g. 9.0"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right text-sm font-medium text-slate-700">
                    Flat Size Height
                  </label>
                  <Input
                    className="col-span-3 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                    type="number"
                    min={0}
                    step="0.1"
                    value={draft.flatSize?.height ?? ""}
                    onChange={(e) => {
                      const newHeight =
                        e.target.value === "" ? null : Number(e.target.value);
                      setDraft((d) => ({
                        ...d,
                        flatSize: {
                          ...d.flatSize,
                          height: newHeight,
                        },
                      }));

                      // If useSameAsFlat is true, also update close size
                      if (draft.useSameAsFlat) {
                        setDraft((d) => ({
                          ...d,
                          closeSize: {
                            ...d.closeSize,
                            height: newHeight,
                          },
                        }));
                      }
                    }}
                    placeholder="e.g. 5.5"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right text-sm font-medium text-slate-700">
                    Flat Size Spine
                  </label>
                  <Input
                    className="col-span-3 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                    type="number"
                    min={0}
                    step="0.1"
                    value={draft.flatSize?.spine ?? ""}
                    onChange={(e) => {
                      const newSpine =
                        e.target.value === "" ? null : Number(e.target.value);
                      setDraft((d) => ({
                        ...d,
                        flatSize: {
                          ...d.flatSize,
                          spine: newSpine,
                        },
                      }));

                      // If useSameAsFlat is true, also update close size
                      if (draft.useSameAsFlat) {
                        setDraft((d) => ({
                          ...d,
                          closeSize: {
                            ...d.closeSize,
                            spine: newSpine,
                          },
                        }));
                      }
                    }}
                    placeholder="e.g. 0.0"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right text-sm font-medium text-slate-700">
                    Use Same as Flat
                  </label>
                  <div className="col-span-3 flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={draft.useSameAsFlat ?? false}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setDraft((d) => ({
                          ...d,
                          useSameAsFlat: checked,
                          // If checking the box, copy flat size to close size
                          closeSize: checked ? d.flatSize : d.closeSize,
                        }));
                      }}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-600">
                      Close size uses same dimensions as flat size
                    </span>
                  </div>
                </div>

                {!draft.useSameAsFlat && (
                  <>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label className="text-right text-sm font-medium text-slate-700">
                        Close Size Width
                      </label>
                      <Input
                        className="col-span-3 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                        type="number"
                        min={0}
                        step="0.1"
                        value={draft.closeSize?.width ?? ""}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            closeSize: {
                              ...d.closeSize,
                              width:
                                e.target.value === ""
                                  ? null
                                  : Number(e.target.value),
                            },
                          }))
                        }
                        placeholder="e.g. 9.0"
                      />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                      <label className="text-right text-sm font-medium text-slate-700">
                        Close Size Height
                      </label>
                      <Input
                        className="col-span-3 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                        type="number"
                        min={0}
                        step="0.1"
                        value={draft.closeSize?.height ?? ""}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            closeSize: {
                              ...d.closeSize,
                              height:
                                e.target.value === ""
                                  ? null
                                  : Number(e.target.value),
                            },
                          }))
                        }
                        placeholder="e.g. 5.5"
                      />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                      <label className="text-right text-sm font-medium text-slate-700">
                        Close Size Spine
                      </label>
                      <Input
                        className="col-span-3 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                        type="number"
                        min={0}
                        step="0.1"
                        value={draft.closeSize?.spine ?? ""}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            closeSize: {
                              ...d.closeSize,
                              spine:
                                e.target.value === ""
                                  ? null
                                  : Number(e.target.value),
                            },
                          }))
                        }
                        placeholder="e.g. 0.0"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Color Specifications */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">
                Color Specifications
              </h3>
              <div className="grid gap-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right text-sm font-medium text-slate-700">
                    Front Side Colors
                  </label>
                  <Select
                    value={draft.colors?.front ?? ""}
                    onValueChange={(v) =>
                      setDraft((d) => ({
                        ...d,
                        colors: { ...d.colors, front: v },
                      }))
                    }
                  >
                    <SelectTrigger className="col-span-3 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
                      <SelectValue placeholder="Select colors" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1 Color">1 Color</SelectItem>
                      <SelectItem value="2 Colors">2 Colors</SelectItem>
                      <SelectItem value="3 Colors">3 Colors</SelectItem>
                      <SelectItem value="4 Colors (CMYK)">
                        4 Colors (CMYK)
                      </SelectItem>
                      <SelectItem value="4+1 Colors">4+1 Colors</SelectItem>
                      <SelectItem value="4+2 Colors">4+2 Colors</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {draft.sides === "2" && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right text-sm font-medium text-slate-700">
                      Back Side Colors
                    </label>
                    <Select
                      value={draft.colors?.back ?? ""}
                      onValueChange={(v) =>
                        setDraft((d) => ({
                          ...d,
                          colors: { ...d.colors, back: v },
                        }))
                      }
                    >
                      <SelectTrigger className="col-span-3 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
                        <SelectValue placeholder="Select colors" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1 Color">1 Color</SelectItem>
                        <SelectItem value="2 Colors">2 Colors</SelectItem>
                        <SelectItem value="3 Colors">3 Colors</SelectItem>
                        <SelectItem value="4 Colors (CMYK)">
                          4 Colors (CMYK)
                        </SelectItem>
                        <SelectItem value="4+1 Colors">4+1 Colors</SelectItem>
                        <SelectItem value="4+2 Colors">4+2 Colors</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setOpenEdit(false)}
              className="border-slate-300 hover:border-slate-400 hover:bg-slate-50 px-6 py-2 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={onSubmitEdit}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Quote Modal */}
      <CreateQuoteModal
        isOpen={isCreateQuoteModalOpen}
        onClose={() => setIsCreateQuoteModalOpen(false)}
        onSubmit={handleCreateQuote}
      />

      {/* Download Success Message */}
      {downloadSuccess && (
        <div className="fixed top-4 left-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2">
          <Download className="w-5 h-5" />
          <span>{downloadSuccess}</span>
        </div>
      )}
    </div>
  );
}
