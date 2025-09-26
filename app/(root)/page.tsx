/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { getCurrentUser } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Edit,
  Download,
  Calendar,
  Funnel,
} from "lucide-react";
import Link from "next/link";
import { MetricCard } from "@/types";
import { MetricsGrid } from "@/components/shared/MetricsGrid";
import { QuotesTable } from "@/components/shared/QuotesTable";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function DashboardPage() {
  const [allQuotes, setAllQuotes] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [contactPerson, setContactPerson] = useState<string>("all");
  const [minAmount, setMinAmount] = useState<string>("");
  const [maxAmount, setMaxAmount] = useState<string>("");
  const [keywordFilter, setKeywordFilter] = useState("");
  const [filterContactPersons, setFilterContactPersons] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updateStatusValue, setUpdateStatusValue] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ name: string; role: string } | null>({
    name: "Demo User",
    role: "admin",
  });

  // Check authentication
  useEffect(() => {
    // Remove authentication requirement - allow access without login
    const currentUser = getCurrentUser();

    if (currentUser) {
      setUser({ name: currentUser.name, role: currentUser.role });
    } else {
      // Set a default user for demo purposes
      setUser({ name: "Demo User", role: "admin" });
    }
  }, []); // Remove router dependency to run immediately

  // Cleanup effect for update modal
  useEffect(() => {
    if (!isUpdateModalOpen) {
      // Reset states when modal is closed
      const timer = setTimeout(() => {
        setUpdateStatusValue("");
        setSelectedQuote(null);
        setIsUpdating(false);
      }, 100); // Small delay to ensure modal animation completes

      return () => clearTimeout(timer);
    }
  }, [isUpdateModalOpen]);

  // Load quotes from database on page load
  useEffect(() => {
    const loadQuotes = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/quotes");
        if (response.ok) {
          const quotesData = await response.json();

          // Transform database quotes to match QuoteRow format
          const transformedQuotes = quotesData.map((quote: any) => {
            // Get proper client name - use the displayName from API or fallback logic
            let customerName = "Unknown Client";
            if (quote.client) {
              // First try to use the displayName that the API provides
              if (
                quote.client.displayName &&
                quote.client.displayName !== "N/A" &&
                quote.client.displayName.trim() !== ""
              ) {
                customerName = quote.client.displayName;
              } else if (
                quote.client.companyName &&
                quote.client.companyName.trim() !== ""
              ) {
                customerName = quote.client.companyName;
              } else if (
                quote.client.firstName &&
                quote.client.lastName &&
                quote.client.firstName.trim() !== "" &&
                quote.client.lastName.trim() !== ""
              ) {
                customerName = `${quote.client.firstName} ${quote.client.lastName}`;
              } else if (
                quote.client.contactPerson &&
                quote.client.contactPerson.trim() !== ""
              ) {
                customerName = quote.client.contactPerson;
              } else if (
                quote.client.email &&
                quote.client.email.trim() !== ""
              ) {
                customerName = quote.client.email;
              } else {
                customerName = `Client ${quote.quoteId}`;
              }
            } else {
              // If no client data at all, use quote ID as fallback
              customerName = `Client ${quote.quoteId}`;
            }

            // Calculate amount - handle both array and object formats from API
            let totalAmount = 0;

            if (quote.amounts) {
              if (Array.isArray(quote.amounts) && quote.amounts.length > 0) {
                // amounts is an array, get the first one
                const amount = quote.amounts[0];

                if (amount && amount.total && amount.total > 0) {
                  totalAmount = amount.total;
                } else if (amount && amount.base && amount.base > 0) {
                  // If total is missing but base exists, calculate total
                  totalAmount = amount.base + (amount.vat || 0);
                }
              } else if (
                typeof quote.amounts === "object" &&
                quote.amounts.total &&
                quote.amounts.total > 0
              ) {
                // Single amount object with total
                totalAmount = quote.amounts.total;
              } else if (
                typeof quote.amounts === "object" &&
                quote.amounts.base &&
                quote.amounts.base > 0
              ) {
                // Single amount object with base, calculate total
                totalAmount = quote.amounts.base + (quote.amounts.vat || 0);
              }
            }

            // Debug logging for amounts
            console.log("Quote amounts debug:", {
              quoteId: quote.quoteId,
              amounts: quote.amounts,
              amountsType: typeof quote.amounts,
              isArray: Array.isArray(quote.amounts),
              calculatedTotal: totalAmount,
            });

            return {
              id: quote.id,
              quoteId: quote.quoteId, // This should be the proper quote ID
              customerName: customerName,
              createdDate: quote.date.split("T")[0], // Convert ISO date to YYYY-MM-DD
              status: quote.status,
              totalAmount: totalAmount,
              userId: quote.user?.id || "u1",
              // Preserve original data for view modal
              client: quote.client,
              amounts: quote.amounts,
              date: quote.date,
              product: quote.product,
              quantity: quote.quantity,
            };
          });
          setAllQuotes(transformedQuotes);
        } else {
          console.error("Failed to load quotes");
          // Fallback to dummy data if API fails
          setAllQuotes([]);
        }
      } catch (error) {
        console.error("Error loading quotes:", error);
        // Fallback to dummy data if API fails
        setAllQuotes([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadQuotes();
  }, []);

  // Cleanup function for modals
  useEffect(() => {
    return () => {
      // Cleanup modal states when component unmounts
      setIsViewModalOpen(false);
      setIsUpdateModalOpen(false);
      setSelectedQuote(null);
      setUpdateStatusValue("");
      setIsUpdating(false);
    };
  }, []);

  // Load contact persons for filter dropdown
  useEffect(() => {
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
        // Fallback to extracting from current quotes if API fails
        const contactPersons = allQuotes.reduce((acc: any[], quote: any) => {
          if (
            quote.client?.contactPerson &&
            !acc.find((cp) => cp.name === quote.client.contactPerson)
          ) {
            acc.push({
              id: quote.client.contactPerson,
              name: quote.client.contactPerson,
            });
          }
          return acc;
        }, []);
        setFilterContactPersons(contactPersons);
      }
    };

    loadContactPersons();
  }, [allQuotes]);

  // Filter quotes based on all filters - use useMemo for better performance
  const filteredQuotes = useMemo(() => {
    const filtered = allQuotes.filter((q) => {
      const k = keywordFilter.trim().toLowerCase();

      // Keyword filter for client, quotation number, product, date, and amount
      const hitKeyword =
        k === "" ||
        q.customerName?.toLowerCase().includes(k) ||
        q.client?.contactPerson?.toLowerCase().includes(k) ||
        q.quoteId?.toLowerCase().includes(k) ||
        q.product?.toLowerCase().includes(k) ||
        q.createdDate?.toLowerCase().includes(k) ||
        q.totalAmount?.toString().includes(k);

      // Status filter
      const hitStatus = statusFilter === "All" || q.status === statusFilter;

      const hitContactPerson =
        contactPerson === "all" || q.client?.contactPerson === contactPerson;

      // Amount range filter
      const hitMinAmount =
        minAmount === "" ||
        (q.totalAmount && q.totalAmount >= Number(minAmount));
      const hitMaxAmount =
        maxAmount === "" ||
        (q.totalAmount && q.totalAmount <= Number(maxAmount));

      const hitFrom = from === "" || (q.createdDate && q.createdDate >= from);
      const hitTo = to === "" || (q.createdDate && q.createdDate <= to);

      return (
        hitKeyword &&
        hitStatus &&
        hitContactPerson &&
        hitMinAmount &&
        hitMaxAmount &&
        hitFrom &&
        hitTo
      );
    });

    // Sort by newest first (most recent createdDate first)
    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(a.createdDate || a.date || 0);
      const dateB = new Date(b.createdDate || b.date || 0);
      return dateB.getTime() - dateA.getTime(); // Newest first
    });

    return sorted;
  }, [
    allQuotes,
    statusFilter,
    keywordFilter,
    contactPerson,
    minAmount,
    maxAmount,
    from,
    to,
  ]);

  // derive paginated data
  const totalPages = Math.max(
    1,
    Math.ceil(filteredQuotes.length / rowsPerPage)
  );
  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, filteredQuotes.length);

  const pageData = useMemo(
    () => filteredQuotes.slice(startIndex, endIndex),
    [filteredQuotes, startIndex, endIndex]
  );

  // reset page if filters shrink the list
  useEffect(() => {
    const newTotalPages = Math.max(
      1,
      Math.ceil(filteredQuotes.length / rowsPerPage)
    );
    if (page > newTotalPages) setPage(1);
  }, [filteredQuotes, rowsPerPage, page]);

  // pagination handlers
  const goFirst = () => setPage(1);
  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));
  const goLast = () => setPage(totalPages);

  // Calculate metrics - these will now update automatically when allQuotes changes
  const totalQuotes = useMemo(() => allQuotes.length, [allQuotes]);
  const approvedQuotes = useMemo(
    () => allQuotes.filter((q) => q.status === "Approved").length,
    [allQuotes]
  );
  const pendingQuotes = useMemo(
    () => allQuotes.filter((q) => q.status === "Pending").length,
    [allQuotes]
  );
  const rejectedQuotes = useMemo(
    () => allQuotes.filter((q) => q.status === "Rejected").length,
    [allQuotes]
  );

  // percentage helper (share of total)
  const pct = (value: number, total: number) =>
    total === 0 ? 0 : (value / total) * 100;

  // distribution percentages
  const totalPct = 100; // total is always 100%
  const approvedPct = pct(approvedQuotes, totalQuotes);
  const pendingPct = pct(pendingQuotes, totalQuotes);
  const rejectedPct = pct(rejectedQuotes, totalQuotes);

  // dashboard cards (distribution, not growth)
  const metricCards: MetricCard[] = [
    {
      title: "Total Quotes",
      value: totalQuotes.toLocaleString(),
      icon: FileText,
      trend: "flat", // neutral badge style in your MetricsGrid
      deltaLabel: `${totalPct.toFixed(1)}%`,
      highlight: "All-time total",
      caption: "All quotes count (100%)",
      filterValue: "All",
    },
    {
      title: "Approved",
      value: approvedQuotes.toLocaleString(),
      icon: CheckCircle,
      trend: "flat",
      deltaLabel: `${approvedPct.toFixed(1)}%`,
      highlight: "Share of total",
      caption: "Approved vs overall",
      filterValue: "Approved",
    },
    {
      title: "Pending",
      value: pendingQuotes.toLocaleString(),
      icon: Clock,
      trend: "flat",
      deltaLabel: `${pendingPct.toFixed(1)}%`,
      highlight: "Share of total",
      caption: "Pending vs overall",
      filterValue: "Pending",
    },
    {
      title: "Rejected",
      value: rejectedQuotes.toLocaleString(),
      icon: XCircle,
      trend: "flat",
      deltaLabel: `${rejectedPct.toFixed(1)}%`,
      highlight: "Share of total",
      caption: "Rejected vs overall",
      filterValue: "Rejected",
    },
  ];

  // Show loading while checking authentication (this should rarely be needed now)
  if (!user) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-slate-200 rounded-full"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-[#27aae1] rounded-full animate-spin"></div>
            <div
              className="absolute top-2 left-2 w-12 h-12 border-4 border-transparent border-t-[#ea078b] rounded-full animate-spin"
              style={{
                animationDirection: "reverse",
                animationDuration: "0.8s",
              }}
            ></div>
          </div>
          <div className="flex space-x-1">
            <span className="text-slate-600 animate-pulse">
              Checking authentication
            </span>
            <span className="text-[#27aae1] animate-bounce">.</span>
            <span
              className="text-[#ea078b] animate-bounce"
              style={{ animationDelay: "0.1s" }}
            >
              .
            </span>
            <span
              className="text-[#f89d1d] animate-bounce"
              style={{ animationDelay: "0.2s" }}
            >
              .
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Format date function to match image format
  const formatDate = (dateInput: string | Date) => {
    try {
      const date = new Date(dateInput);
      if (isNaN(date.getTime())) {
        return "Invalid Date";
      }
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const day = date.getDate();
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } catch (error) {
      console.error("Error formatting date:", error, dateInput);
      return "Invalid Date";
    }
  };

  const handleCardClick = (filterValue: string) => {
    setStatusFilter(filterValue);
  };

  const handleViewQuote = (quote: any) => {
    if (!quote || !quote.id) {
      console.error("Invalid quote data provided to view modal");
      alert("Invalid quote data. Please try again.");
      return;
    }

    console.log("Opening view modal for quote:", quote);
    setSelectedQuote(quote);
    setIsViewModalOpen(true);
  };

  const handleUpdateQuote = (quote: any) => {
    if (!quote || !quote.id) {
      console.error("Invalid quote data provided to update modal");
      alert("Invalid quote data. Please try again.");
      return;
    }

    console.log("Opening update modal for quote:", quote);
    console.log("Quote status:", quote.status);

    // Set both states together to ensure consistency
    setSelectedQuote(quote);
    setUpdateStatusValue(quote.status || "");

    console.log("Set updateStatusValue to:", quote.status || "");

    // Open the modal
    setIsUpdateModalOpen(true);
  };

  const handleStatusUpdate = async (newStatus: string) => {
    // Validate input data
    if (!selectedQuote || !selectedQuote.id) {
      alert("No quote selected for update");
      return;
    }

    if (!updateStatusValue || !newStatus) {
      alert("Please select a valid status before updating.");
      return;
    }

    if (updateStatusValue === selectedQuote.status) {
      alert("Quote already has this status. No changes needed.");
      return;
    }

    try {
      setIsUpdating(true);

      // Update the quote status in the database
      const response = await fetch(`/api/quotes/${selectedQuote.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update quote status");
      }

      const updatedQuote = await response.json();

      // Update the quote in local state
      const updatedQuotes = allQuotes.map((quote) =>
        quote.id === selectedQuote.id ? updatedQuote : quote
      );

      // Update the quotes state
      setAllQuotes(updatedQuotes);

      // Show success message
      setSuccessMessage(`Quote status updated to ${newStatus} successfully!`);
      setShowSuccessMessage(true);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
        setSuccessMessage("");
      }, 3000);

      // Force close modal by resetting all states
      setIsUpdateModalOpen(false);
      setUpdateStatusValue("");
      setSelectedQuote(null);
      setIsUpdating(false);
    } catch (error) {
      console.error("Error updating quote status:", error);
      alert("Error updating quote status. Please try again.");

      // Reset states on error too
      setIsUpdateModalOpen(false);
      setUpdateStatusValue("");
      setSelectedQuote(null);
      setIsUpdating(false);
    }
  };

  const handleDownloadPDF = async (quote: any) => {
    try {
      console.log(`Generating PDF for quote ${quote.quoteId}`);

      // Show loading state
      const downloadBtn = document.querySelector(
        `[data-quote-id="${quote.id}"] .download-btn`
      );
      if (downloadBtn) {
        downloadBtn.innerHTML = "Generating...";
        downloadBtn.setAttribute("disabled", "true");
      }

      // Call the PDF generation API
      const response = await fetch(`/api/quotes/${quote.id}/pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "customer", // or 'operations' based on your needs
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      // Get the PDF blob
      const pdfBlob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Quote-${quote.quoteId}-${
        new Date().toISOString().split("T")[0]
      }.pdf`;

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      window.URL.revokeObjectURL(url);

      console.log(`PDF downloaded successfully for quote ${quote.quoteId}`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      // Reset button state
      const downloadBtn = document.querySelector(
        `[data-quote-id="${quote.id}"] .download-btn`
      );
      if (downloadBtn) {
        downloadBtn.innerHTML = '<Download className="w-4 h-4" />';
        downloadBtn.removeAttribute("disabled");
      }
    }
  };

  const ViewQuoteModal = () => {
    // Only render if modal should be open
    if (!isViewModalOpen) return null;

    return (
      <Sheet
        open={isViewModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsViewModalOpen(false);
            setSelectedQuote(null);
          }
        }}
      >
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
          {/* HEADER (sticky) */}
          <div className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
            <SheetHeader className="px-5 py-4">
              <SheetTitle className="text-2xl font-bold text-slate-900">
                Quote Details
                {selectedQuote?.quoteId ? ` - ${selectedQuote.quoteId}` : ""}
              </SheetTitle>
              <SheetDescription className="text-slate-500">
                Review client, product, finishing & pricing information.
              </SheetDescription>
            </SheetHeader>
          </div>

          {/* MAIN SCROLL AREA */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="space-y-6 p-5">
              {/* ===== Client Information ===== */}
              <section className="bg-slate-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">
                  Client Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-600">
                      Company Name
                    </label>
                    <p className="text-base font-semibold text-slate-900">
                      {selectedQuote?.client?.companyName ||
                        selectedQuote?.client?.contactPerson ||
                        "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">
                      Contact Person
                    </label>
                    <p className="text-base font-semibold text-slate-900">
                      {selectedQuote?.client?.contactPerson || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">
                      Email
                    </label>
                    <p className="text-base text-slate-700">
                      {selectedQuote?.client?.email || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">
                      Phone
                    </label>
                    <p className="text-base text-slate-700">
                      {selectedQuote?.client?.phone || "N/A"}
                    </p>
                  </div>
                </div>
              </section>

              {/* ===== Quote Information ===== */}
              <section className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">
                  Quote Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-600">
                      Quote ID
                    </label>
                    <p className="text-base font-semibold text-slate-900">
                      {selectedQuote?.quoteId}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">
                      Status
                    </label>
                    <div className="mt-1">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          selectedQuote?.status === "Approved"
                            ? "bg-emerald-100 text-emerald-700"
                            : selectedQuote?.status === "Pending"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {selectedQuote?.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">
                      Date Created
                    </label>
                    <p className="text-base font-semibold text-slate-900">
                      {selectedQuote?.createdDate
                        ? formatDate(selectedQuote.createdDate)
                        : selectedQuote?.date
                        ? formatDate(selectedQuote.date)
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </section>

              {/* ===== Product Details ===== */}
              <section className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">
                  Product Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-600">
                      Product
                    </label>
                    <p className="text-base font-semibold text-slate-900">
                      {selectedQuote?.product ||
                        selectedQuote?.productName ||
                        "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">
                      Quantity
                    </label>
                    <p className="text-base font-semibold text-slate-900">
                      {selectedQuote?.quantity || "N/A"} units
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">
                      Printing Type
                    </label>
                    <p className="text-base text-slate-700">
                      {selectedQuote?.printing || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">
                      Sides
                    </label>
                    <p className="text-base text-slate-700">
                      {selectedQuote?.sides || "N/A"}
                    </p>
                  </div>
                </div>
              </section>

              {/* ===== Paper Details ===== */}
              {selectedQuote?.papers?.length > 0 && (
                <section className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">
                    Paper Specifications
                  </h3>
                  <div className="space-y-3">
                    {selectedQuote.papers.map((paper: any, index: number) => (
                      <div key={index} className="bg-white p-3 rounded border">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="text-sm font-medium text-slate-600">
                              Paper Type
                            </label>
                            <p className="text-sm text-slate-900">
                              {paper.name || "N/A"}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-slate-600">
                              GSM
                            </label>
                            <p className="text-sm text-slate-900">
                              {paper.gsm || "N/A"}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-slate-600">
                              Price per Sheet
                            </label>
                            <p className="text-sm text-slate-900">
                              AED {paper.pricePerSheet || "0.00"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* ===== Finishing Details ===== */}
              {selectedQuote?.finishing?.length > 0 && (
                <section className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">
                    Finishing Options
                  </h3>
                  <div className="space-y-2">
                    {selectedQuote.finishing.map(
                      (finish: any, index: number) => (
                        <div
                          key={index}
                          className="bg-white p-3 rounded border flex justify-between items-center"
                        >
                          <span className="text-sm font-medium text-slate-900">
                            {finish.name || "Standard Finishing"}
                          </span>
                          <span className="text-sm text-slate-700">
                            AED {finish.cost || "0.00"}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </section>
              )}

              {/* ===== Pricing Information ===== */}
              <section className="bg-emerald-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">
                  Pricing Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-600">
                      Base Amount
                    </label>
                    <p className="text-lg font-semibold text-slate-900">
                      AED{" "}
                      {(() => {
                        if (
                          Array.isArray(selectedQuote?.amounts) &&
                          selectedQuote?.amounts?.length
                        ) {
                          return (
                            selectedQuote?.amounts[0]?.base?.toFixed(2) ||
                            "0.00"
                          );
                        } else if (selectedQuote?.amounts?.base) {
                          return selectedQuote.amounts.base.toFixed(2);
                        }
                        return "0.00";
                      })()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">
                      VAT (5%)
                    </label>
                    <p className="text-lg font-semibold text-slate-900">
                      AED{" "}
                      {(() => {
                        if (
                          Array.isArray(selectedQuote?.amounts) &&
                          selectedQuote?.amounts?.length
                        ) {
                          return (
                            selectedQuote?.amounts[0]?.vat?.toFixed(2) || "0.00"
                          );
                        } else if (selectedQuote?.amounts?.vat) {
                          return selectedQuote.amounts.vat.toFixed(2);
                        }
                        return "0.00";
                      })()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">
                      Total Amount
                    </label>
                    <p className="text-xl font-bold text-emerald-700">
                      AED{" "}
                      {(() => {
                        if (
                          Array.isArray(selectedQuote?.amounts) &&
                          selectedQuote?.amounts?.length
                        ) {
                          return (
                            selectedQuote?.amounts[0]?.total?.toFixed(2) ||
                            "0.00"
                          );
                        } else if (selectedQuote?.amounts?.total) {
                          return selectedQuote.amounts.total.toFixed(2);
                        }
                        return "0.00";
                      })()}
                    </p>
                  </div>
                </div>
              </section>

              {/* ===== Staff Information ===== */}
              <section className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">
                  Staff Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-600">
                      Created By
                    </label>
                    <p className="text-base text-slate-700">
                      {selectedQuote?.user?.firstName &&
                      selectedQuote?.user?.lastName
                        ? `${selectedQuote.user.firstName} ${selectedQuote.user.lastName}`
                        : selectedQuote?.user?.email || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">
                      Sales Person
                    </label>
                    <p className="text-base text-slate-700">
                      {selectedQuote?.user?.firstName &&
                      selectedQuote?.user?.lastName
                        ? `${selectedQuote.user.firstName} ${selectedQuote.user.lastName}`
                        : selectedQuote?.user?.email || "N/A"}
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* FOOTER (sticky) */}
          <div className="sticky bottom-0 z-10 bg-white border-t px-5 py-3 flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                const quoteToEdit = selectedQuote;
                setIsViewModalOpen(false);
                handleUpdateQuote(quoteToEdit);
              }}
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Quote</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => handleDownloadPDF(selectedQuote)}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  };

  const UpdateQuoteModal = () => {
    return (
      <Dialog
        open={isUpdateModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            // Only reset states when actually closing the modal
            setIsUpdateModalOpen(false);
            // Don't reset other states immediately to avoid race conditions
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Update Quote - {selectedQuote?.quoteId}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-gray-600">
                Update Status
              </label>
              <Select
                value={updateStatusValue}
                onValueChange={(value) => {
                  console.log("Select value changed to:", value);
                  setUpdateStatusValue(value);
                }}
              >
                <SelectTrigger className="w-full mt-2">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => handleStatusUpdate(updateStatusValue)}
                disabled={!updateStatusValue || isUpdating}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating
                  ? "Updating Status..."
                  : updateStatusValue
                  ? "Apply Status Change"
                  : "Select Status First"}
              </Button>

              <Button
                onClick={() => {
                  // Force close and reset all states
                  setIsUpdateModalOpen(false);
                  setUpdateStatusValue("");
                  setSelectedQuote(null);
                  setIsUpdating(false);

                  // Navigate to step 2 customer detail choose
                  window.location.href = `/create-quote?step=2&edit=${selectedQuote?.quoteId}`;
                }}
                variant="outline"
                className="w-full flex items-center justify-center space-x-2 py-3"
                disabled={isUpdating}
              >
                <Edit className="w-4 h-4" />
                <span>Edit Quote Details</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="min-h-screen  p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 lg:space-y-12">
        {/* Success Message */}
        {showSuccessMessage && (
          <div className="fixed top-4 right-4 z-[9999] bg-green-500 text-white px-4 sm:px-6 py-3 rounded-lg shadow-lg max-w-sm sm:max-w-md">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm sm:text-base">{successMessage}</span>
            </div>
          </div>
        )}

        {/* Metric Cards - Now Clickable */}
        <MetricsGrid
          cards={metricCards}
          statusFilter={statusFilter}
          onClickCard={handleCardClick}
          isLoading={isLoading}
          skeletonCount={4}
        />

        {/* Filters and Create Quote Button */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          {/* left: inline controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Date range (From–To dalam satu blok) */}
            <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-2 h-10">
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

            {/* Status */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 w-[9rem] rounded-lg border-slate-300">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            {/* Contact */}
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

            {/* Extra filters in popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-10 rounded-lg">
                  <Funnel className="h-4 w-4 mr-2" /> Filter
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-[28rem] p-4">
                <div className="grid grid-cols-1 gap-4">
                  {/* Keyword */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500">
                      Keyword
                    </label>
                    <Input
                      placeholder="Search by client, quote ID, product…"
                      value={keywordFilter}
                      onChange={(e) => setKeywordFilter(e.target.value)}
                      className="h-10"
                    />
                  </div>

                  {/* Amount range */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500">
                      Amount range
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={minAmount}
                        onChange={(e) => setMinAmount(e.target.value)}
                        className="h-10"
                      />
                      <span className="text-slate-400">–</span>
                      <Input
                        type="number"
                        placeholder="Max"
                        value={maxAmount}
                        onChange={(e) => setMaxAmount(e.target.value)}
                        className="h-10"
                      />
                    </div>
                  </div>

                  {/* actions */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setKeywordFilter("");
                        setFrom("");
                        setTo("");
                        setStatusFilter("All");
                        setContactPerson("all");
                        setMinAmount("");
                        setMaxAmount("");
                      }}
                    >
                      Reset
                    </Button>
                    <Button
                      onClick={() => {
                        /* no-op: popover auto closes saat click luar */
                      }}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* right: CTA */}
          <div className="flex-shrink-0">
            <Link href="/create-quote">
              <Button className="h-10 px-5 bg-[#27aae1] hover:bg-[#1e8bc3] text-white rounded-lg font-medium shadow-sm">
                <span className="mr-2">+</span> Create New Quote
              </Button>
            </Link>
          </div>
        </div>

        {/* Recent Quotations Section */}
        <div className="space-y-6 sm:space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">
              Recent Quotations
            </h2>
          </div>

          {/* Quotations Table - Mobile Responsive */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-0">
              <div className="hidden lg:block">
                <QuotesTable
                  data={filteredQuotes} // data hasil filter kamu
                  onView={(row) => handleViewQuote(row)}
                  onEdit={(row) => handleUpdateQuote(row)}
                  defaultPageSize={10}
                  isLoading={isLoading}
                />
              </div>

              {/* Mobile list boleh tetap card-mu, atau kalau mau seragam:
        render QuotesTable juga (akan responsif secara horizontal). */}
              <div className="lg:hidden">
                <QuotesTable
                  data={filteredQuotes}
                  onView={handleViewQuote}
                  onEdit={handleUpdateQuote}
                  defaultPageSize={10}
                  isLoading={isLoading}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <ViewQuoteModal />
      <UpdateQuoteModal />
    </div>
  );
}
