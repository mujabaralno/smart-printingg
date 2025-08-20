"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Eye, Pencil, Calendar, DollarSign, ChevronDown, ChevronUp, Download, ChevronDown as ChevronDownIcon, User } from "lucide-react";
import { getQuotes } from "@/lib/dummy-data";
import Link from "next/link";
import CreateQuoteModal from "@/components/create-quote/CreateQuoteModal";
import StatusBadge from "@/components/shared/StatusBadge";
import { quotes as QUOTES, users as USERS } from "@/constants";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadCustomerPdf, downloadOpsPdf } from "@/lib/quote-pdf";


type Status = "Approved" | "Pending" | "Rejected";
type StatusFilter = "all" | Status;
type UserFilter = "all" | string;


type Row = (typeof QUOTES)[number] & {
  quoteId?: string; // Add formatted quote ID for display
  productName?: string;
  product?: string; // This field is used in the table display
  quantity?: number;
};

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "2-digit" });

const PAGE_SIZE = 20; // Increased from 7 to 20 as per requirements

export default function QuoteManagementPage() {
  const [rows, setRows] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showNewQuoteNotification, setShowNewQuoteNotification] = React.useState(false);
  const [newQuoteCount, setNewQuoteCount] = React.useState(0);
  const [downloadingPDF, setDownloadingPDF] = React.useState<string | null>(null);
  const [isCreateQuoteModalOpen, setIsCreateQuoteModalOpen] = React.useState(false);

  // ===== filter & paging =====
  const [search, setSearch] = React.useState("");
  const [from, setFrom] = React.useState<string>("");
  const [to, setTo] = React.useState<string>("");
  const [status, setStatus] = React.useState<StatusFilter>("all");
  const [contactPerson, setContactPerson] = React.useState<UserFilter>("all");
  const [minAmount, setMinAmount] = React.useState<string>("");
  const [page, setPage] = React.useState(1);
  const [showAll, setShowAll] = React.useState(false); // New state for show more option

  React.useEffect(() => setPage(1), [search, from, to, status, contactPerson, minAmount]);

  // Load contact persons for filter dropdown
  const [filterContactPersons, setFilterContactPersons] = React.useState<Array<{id: string, name: string}>>([]);

  React.useEffect(() => {
    const loadContactPersons = async () => {
      try {
        const response = await fetch('/api/clients');
        if (response.ok) {
          const clients = await response.json();
          // Extract unique contact persons
          const contactPersons = clients.reduce((acc: any[], client: any) => {
            if (client.contactPerson && !acc.find(cp => cp.name === client.contactPerson)) {
              acc.push({
                id: client.contactPerson,
                name: client.contactPerson
              });
            }
            return acc;
          }, []);
          setFilterContactPersons(contactPersons);
        }
      } catch (error) {
        console.error('Error loading contact persons for filter:', error);
        // Fallback to extracting from current rows if API fails
        const contactPersons = rows.reduce((acc: any[], row: any) => {
          if (row.contactPerson && !acc.find(cp => cp.name === row.contactPerson)) {
            acc.push({
              id: row.contactPerson,
              name: row.contactPerson
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
        const response = await fetch('/api/quotes');
        if (response.ok) {
          const quotes = await response.json();
          // Transform database quotes to match Row format
          const transformedQuotes = quotes.map((quote: any) => ({
            id: quote.id, // Use database ID for operations
            quoteId: quote.quoteId, // Keep formatted quote ID for display
            clientName: quote.client?.companyName || quote.client?.contactPerson || "Unknown Client",
            contactPerson: quote.client?.contactPerson || "Unknown Contact",
            date: quote.date.split('T')[0], // Convert ISO date to YYYY-MM-DD
            amount: quote.amounts?.total || 0,
            status: quote.status as Status,
            userId: quote.user?.id || "cmejqfk3s0000x5a98slufy9n", // Use real admin user ID as fallback
            product: quote.product || "Printing Product", // Map to product field for table display
            productName: quote.product || "Printing Product", // Keep for backward compatibility
            quantity: quote.quantity || 0,
          }));
          setRows(transformedQuotes);
        } else {
          console.error('Failed to load quotes');
          // Fallback to dummy data if API fails
          setRows(QUOTES);
        }
      } catch (error) {
        console.error('Error loading quotes:', error);
        // Fallback to dummy data if API fails
        setRows(QUOTES);
      } finally {
        setLoading(false);
      }
    };

    loadQuotes();
  }, []);

  // Note: Quotes are now loaded from the database through the main dashboard
  // This page will be updated to use the database service in future iterations

  const filtered = React.useMemo(() => {
    return rows.filter((q) => {
      const s = search.trim().toLowerCase();
      // Enhanced search to include quote number, client name, and person name as per requirements
      const hitSearch =
        s === "" || 
        q.id.toLowerCase().includes(s) || 
        q.clientName.toLowerCase().includes(s) ||
        q.contactPerson.toLowerCase().includes(s);

      const hitStatus = status === "all" || q.status === status;
      const hitContactPerson = contactPerson === "all" || q.contactPerson === contactPerson;
      const hitAmount = minAmount === "" || q.amount >= Number(minAmount);

      const hitFrom = from === "" || q.date >= from;
      const hitTo = to === "" || q.date <= to;

      return hitSearch && hitStatus && hitContactPerson && hitAmount && hitFrom && hitTo;
    });
      }, [rows, search, from, to, status, contactPerson, minAmount]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const current = showAll ? filtered : filtered.slice(start, start + PAGE_SIZE);


  const [openEdit, setOpenEdit] = React.useState(false);
  const [draft, setDraft] = React.useState<{
    id: string;
    clientName: string;
    contactPerson: string;
    date: string; // YYYY-MM-DD
    amount: number | "";
    status: Status;
    userId: string;
    productName?: string;
    quantity?: number | "";
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
  });

  const onEdit = (id: string) => {
    const q = rows.find((r) => r.id === id);
    if (!q) return;
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
    });
    setOpenEdit(true);
  };

  const onSubmitEdit = async () => {
    if (!draft.id || !draft.clientName || !draft.contactPerson || !draft.date || draft.amount === "") {
      alert("Please complete all required fields.");
      return;
    }

    try {
      console.log('Starting quote update for:', draft.id);
      
      // First, we need to find or create the client
      let clientId = "";
      
      // Try to find existing client by email (using a default email since we don't have it in the form)
      console.log('Searching for existing client...');
      const clientResponse = await fetch('/api/clients');
      if (clientResponse.ok) {
        const clients = await clientResponse.json();
        console.log('Found clients:', clients.length);
        const existingClient = clients.find((c: any) => 
          c.contactPerson === draft.contactPerson || 
          c.companyName === draft.clientName
        );
        if (existingClient) {
          clientId = existingClient.id;
          console.log('Using existing client:', clientId);
        }
      }

      // If no existing client found, create a new one
      if (!clientId) {
        console.log('Creating new client...');
        const createClientResponse = await fetch('/api/clients', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clientType: "Company",
            companyName: draft.clientName,
            contactPerson: draft.contactPerson,
            email: "customer@example.com", // Default email since not in form
            phone: "123456789", // Default phone since not in form
            countryCode: "+971",
            role: "Customer"
          }),
        });

        if (createClientResponse.ok) {
          const newClient = await createClientResponse.json();
          clientId = newClient.id;
          console.log('Created new client:', clientId);
        } else {
          const errorData = await createClientResponse.json();
          throw new Error(`Failed to create client: ${errorData.error || 'Unknown error'}`);
        }
      }

      // Update quote in database with correct schema mapping
      const updateData = {
        clientId: clientId,
        date: new Date(draft.date + 'T00:00:00.000Z').toISOString(), // Ensure proper date format
        status: draft.status,
        userId: draft.userId || null, // Allow null if no user assigned
        product: draft.productName?.trim() || "Printing Product",
        quantity: draft.quantity === "" ? 0 : Number(draft.quantity),
        amount: Number(draft.amount), // This will be handled by the database service
      };
      
      console.log('Updating quote with data:', updateData);
      
      const response = await fetch(`/api/quotes/${draft.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Quote update failed:', response.status, errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to update quote`);
      }

      const updatedQuote = await response.json();
      console.log('Quote updated successfully:', updatedQuote);

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
              }
            : r
        )
      );

      setOpenEdit(false);
    } catch (error) {
      console.error('Error updating quote:', error);
      alert(`Error updating quote: ${error instanceof Error ? error.message : 'Please try again.'}`);
    }
  };

  // ===== modal VIEW (Eye) =====
  const [openView, setOpenView] = React.useState(false);
  const [viewRow, setViewRow] = React.useState<Row | null>(null);

  const onView = (row: Row) => {
    setViewRow(row);
    setOpenView(true);
  };

  const viewTotal = (row: Row | null) => (row ? currency.format(row.amount) : "—");

  // Function to handle PDF download for approved quotes
  const handleDownloadPDF = async (quote: Row, type: 'customer' | 'operations') => {
    const downloadId = `${quote.id}-${type}`;
    setDownloadingPDF(downloadId);
    
    try {
      // Create a mock QuoteFormData structure for PDF generation
      const mockFormData = {
        client: {
          clientType: "Company" as const,
          companyName: quote.clientName,
          contactPerson: quote.contactPerson,
          email: "customer@example.com", // Default email
          phone: "123456789", // Default phone
          countryCode: "+971",
          role: "Customer"
        },
        products: [{
          productName: quote.product || quote.productName || "Printing Product",
          paperName: "Standard Paper",
          quantity: quote.quantity || 0,
          sides: "1" as const,
          printingSelection: "Digital" as const,
          flatSize: { width: 10, height: 15, spine: 0 },
          closeSize: { width: 10, height: 15, spine: 0 },
          useSameAsFlat: true,
          papers: [{ name: "Standard", gsm: "150" }],
          finishing: []
        }],
        operational: {
          papers: [],
          finishing: [],
          plates: null,
          units: null
        },
        calculation: {
          basePrice: quote.amount,
          marginAmount: 0,
          subtotal: quote.amount,
          vatAmount: 0,
          totalPrice: quote.amount
        }
      };

      if (type === 'customer') {
        await downloadCustomerPdf(mockFormData, []);
      } else {
        await downloadOpsPdf(mockFormData, []);
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setDownloadingPDF(null);
    }
  };

  const handleCreateQuote = (newQuote: any) => {
    // Add the new quote to the existing quotes
    const updatedRows = [...rows, newQuote];
    setRows(updatedRows);
    
    // Show success notification
    setNewQuoteCount(prev => prev + 1);
    setShowNewQuoteNotification(true);
    
    // Hide notification after 3 seconds
    setTimeout(() => {
      setShowNewQuoteNotification(false);
    }, 3000);
  };

  return (
    <div className="space-y-12">
      {/* New Quote Notification */}
      {showNewQuoteNotification && (
        <div className="fixed top-4 right-4 bg-green-50 border border-green-200 rounded-xl p-4 shadow-lg z-50 max-w-sm">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
            <div className="text-sm text-green-800">
              <p className="font-medium mb-1">New Quote Added!</p>
              <p className="text-green-700">
                {newQuoteCount} new quote{newQuoteCount > 1 ? 's' : ''} {newQuoteCount > 1 ? 'have' : 'has'} been added to your quote list.
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNewQuoteNotification(false)}
              className="w-6 h-6 h-auto p-1 text-green-600 hover:bg-green-100"
            >
              ×
            </Button>
          </div>
        </div>
      )}

      {/* Welcome Header */}
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Quote Management
        </h1>
        <p className="text-lg text-slate-600">Manage and track all your printing quotes. View, edit, and monitor the status of customer quotations.</p>
      </div>
      
      {/* Main Content Card */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-10 space-y-8">
          {/* Search and Create Button */}
          <div className="flex items-center gap-6">
            <div className="flex flex-col gap-2 flex-1">
              <label className="text-sm font-medium text-slate-700">Search</label>
              <Input
                placeholder="Search by quote number, client name, or person name"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-10 w-full"
              />
            </div>

            <Button 
              onClick={() => setIsCreateQuoteModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 h-10 gap-2 flex items-center"
            >
              <Plus className="h-4 w-4" />
              Create a New Quote
            </Button>
          </div>

          {/* Filters with proper titles as per requirements */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-8 border border-slate-200 rounded-2xl bg-slate-50/50">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">From</label>
              <Input 
                type="date" 
                value={from} 
                onChange={(e) => setFrom(e.target.value)}
                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">To</label>
              <Input 
                type="date" 
                value={to} 
                onChange={(e) => setTo(e.target.value)}
                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Status</label>
              <Select value={status} onValueChange={(v: StatusFilter) => setStatus(v)}>
                <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Contact Person</label>
              <Select value={contactPerson} onValueChange={(v: UserFilter) => setContactPerson(v)}>
                <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
                  <SelectValue placeholder="All Contact Persons" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Contact Persons</SelectItem>
                  {filterContactPersons.map((cp) => (
                    <SelectItem key={cp.id} value={cp.id}>{cp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Minimum Amount</label>
              <Input
                type="number"
                placeholder="$0.00"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
              />
            </div>
          </div>

          {/* Item Counts Summary */}
          <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <span>Showing {current.length} of {filtered.length} quotes</span>
              {filtered.length > PAGE_SIZE && (
                <Button
                  variant="ghost"
                  onClick={() => setShowAll(!showAll)}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 px-3 text-xs"
                >
                  {showAll ? (
                    <>
                      <ChevronUp className="h-3 w-3 mr-1" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" />
                      Show All ({filtered.length})
                    </>
                  )}
                </Button>
              )}
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-slate-600">
                  Approved: <span className="font-semibold text-slate-900">{filtered.filter(q => q.status === "Approved").length}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-slate-600">
                  Pending: <span className="font-semibold text-slate-900">{filtered.filter(q => q.status === "Pending").length}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm text-slate-600">
                  Rejected: <span className="font-semibold text-slate-900">{filtered.filter(q => q.status === "Rejected").length}</span>
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span>Total Items:</span>
                <span className="font-semibold text-slate-900">{filtered.length}</span>
              </div>
            </div>
          </div>



          {/* Table */}
          <div className="overflow-hidden border border-slate-200 rounded-2xl">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="border-slate-200">
                  <TableHead className="text-slate-700 font-semibold p-6">Quote ID</TableHead>
                  <TableHead className="text-slate-700 font-semibold p-6">Client Details</TableHead>
                  <TableHead className="text-slate-700 font-semibold p-6">Date</TableHead>
                  <TableHead className="text-slate-700 font-semibold p-6">Product</TableHead>
                  <TableHead className="text-slate-700 font-semibold p-6">Quantity</TableHead>
                  <TableHead className="text-slate-700 font-semibold p-6">Amount</TableHead>
                  <TableHead className="text-slate-700 font-semibold p-6">Status</TableHead>
                  <TableHead className="text-slate-700 font-semibold p-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-16 text-slate-500">
                      Loading quotes...
                    </TableCell>
                  </TableRow>
                ) : current.map((q) => (
                  <TableRow key={q.id} className="hover:bg-slate-50/80 transition-colors duration-200 border-slate-100">
                    <TableCell className="font-medium text-slate-900 p-6">{q.quoteId}</TableCell>
                    <TableCell className="text-slate-700 p-6">
                      <div className="space-y-1">
                        <div className="font-medium text-slate-900">{q.clientName}</div>
                        <div className="text-sm text-slate-600">{q.contactPerson}</div>
                        <Link 
                          href="/client-management" 
                          className="text-xs text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
                        >
                          <User className="w-3 h-3" />
                          View Client
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-700 p-6">{fmtDate(q.date)}</TableCell>
                    <TableCell className="text-slate-700 p-6">{q.product || 'N/A'}</TableCell>
                    <TableCell className="text-slate-700 p-6">{q.quantity || 'N/A'}</TableCell>
                    <TableCell className="tabular-nums font-semibold text-slate-900 p-6">{currency.format(q.amount)}</TableCell>
                    <TableCell className="p-6"><StatusBadge value={q.status} /></TableCell>
                    <TableCell className="p-6">
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          title="View Details" 
                          onClick={() => onView(q)}
                          className="w-8 h-8 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          title="Edit Quote" 
                          onClick={() => onEdit(q.id)}
                          className="w-8 h-8 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {q.status === "Approved" && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                title="Download PDF" 
                                disabled={downloadingPDF?.startsWith(q.id)}
                                className="w-8 h-8 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200 border border-blue-200 text-blue-700 disabled:opacity-50"
                              >
                                {downloadingPDF?.startsWith(q.id) ? (
                                  <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Download className="h-4 w-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem 
                                onClick={() => handleDownloadPDF(q, 'customer')}
                                disabled={downloadingPDF === `${q.id}-customer`}
                                className="text-green-700 hover:text-green-800 hover:bg-green-50"
                              >
                                <Download className="h-3 w-3 mr-2" />
                                Customer PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDownloadPDF(q, 'operations')}
                                disabled={downloadingPDF === `${q.id}-operations`}
                                className="text-orange-700 hover:text-orange-800 hover:bg-orange-50"
                              >
                                <Download className="h-3 w-3 mr-2" />
                                Operations PDF
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {current.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-16 text-slate-500">
                      No quotes found with current filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination - Only show when not showing all */}
          {!showAll && pageCount > 1 && (
            <div className="flex items-center justify-center gap-2 pb-6">
              <Button
                variant="ghost"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="w-10 h-10 rounded-xl hover:bg-slate-100"
              >
                ‹
              </Button>

              {Array.from({ length: pageCount }).slice(0, 5).map((_, i) => {
                const n = i + 1;
                if (pageCount > 5 && n === 4) {
                  return (
                    <React.Fragment key="dots">
                      <span className="px-3 text-slate-500">…</span>
                      <Button
                        variant={page === pageCount ? "default" : "ghost"}
                        onClick={() => setPage(pageCount)}
                        className="w-10 h-10 rounded-xl"
                      >
                        {pageCount}
                      </Button>
                    </React.Fragment>
                  );
                }
                if (pageCount > 5 && n > 3) return null;
                return (
                  <Button
                    key={n}
                    variant={page === n ? "default" : "ghost"}
                    onClick={() => setPage(n)}
                    className="w-10 h-10 rounded-xl"
                  >
                    {n}
                  </Button>
                );
              })}

              <Button
                variant="ghost"
                disabled={page >= pageCount}
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                className="w-10 h-10 rounded-xl hover:bg-slate-100"
              >
                ›
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== Modal View (Eye) ===== */}
      <Dialog open={openView} onOpenChange={setOpenView}>
        <DialogContent className="sm:max-w-[560px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">
              {viewRow ? `Details for ${viewRow.id}` : "Details"}
            </DialogTitle>
          </DialogHeader>

          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="grid grid-cols-3 gap-0 text-sm">
              <div className="col-span-1 px-4 py-3 text-slate-500 border-b border-slate-200 bg-slate-50">Client:</div>
              <div className="col-span-2 px-4 py-3 border-b border-slate-200 font-semibold text-slate-900">{viewRow?.clientName ?? "—"}</div>

              <div className="col-span-1 px-4 py-3 text-slate-500 border-b border-slate-200 bg-slate-50">Date:</div>
              <div className="col-span-2 px-4 py-3 border-b border-slate-200 font-semibold text-slate-900">
                {viewRow?.date ? fmtDate(viewRow.date) : "—"}
              </div>

              <div className="col-span-1 px-4 py-3 text-slate-500 border-b border-slate-200 bg-slate-50">Product:</div>
              <div className="col-span-2 px-4 py-3 border-b border-slate-200 font-semibold text-slate-900">
                {viewRow?.product ?? viewRow?.productName ?? "—"}
              </div>

              <div className="col-span-1 px-4 py-3 text-slate-500 border-b border-slate-200 bg-slate-50">Quantity:</div>
              <div className="col-span-2 px-4 py-3 border-b border-slate-200 font-semibold text-slate-900">
                {typeof viewRow?.quantity === "number" ? viewRow?.quantity : "—"}
              </div>

              <div className="col-span-1 px-4 py-3 text-slate-500 bg-slate-50">Total:</div>
              <div className="col-span-2 px-4 py-3 border-slate-200 font-semibold text-slate-900">
                {viewRow?.amount ? currency.format(viewRow.amount) : "—"}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              onClick={() => setOpenView(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Modal Edit ===== */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="sm:max-w-[640px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">Edit Quote</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm text-slate-600 font-medium">Quote ID</label>
              <Input className="col-span-3 bg-slate-100 border-slate-300 rounded-xl" readOnly value={draft.id} />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium text-slate-700">Client Name</label>
              <Input
                className="col-span-3 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                value={draft.clientName}
                onChange={(e) => setDraft((d) => ({ ...d, clientName: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium text-slate-700">Contact Person</label>
              <Input
                className="col-span-3 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                value={draft.contactPerson}
                onChange={(e) => setDraft((d) => ({ ...d, contactPerson: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium text-slate-700">Date</label>
              <Input
                className="col-span-3 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                type="date"
                value={draft.date}
                onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium text-slate-700">Amount</label>
              <Input
                className="col-span-3 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                type="number"
                min={0}
                step="0.01"
                value={draft.amount}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, amount: e.target.value === "" ? "" : Number(e.target.value) }))
                }
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium text-slate-700">Status</label>
              <Select
                value={draft.status}
                onValueChange={(v: Status) => setDraft((d) => ({ ...d, status: v }))}
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

            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium text-slate-700">User</label>
              <Select
                value={draft.userId}
                onValueChange={(v) => setDraft((d) => ({ ...d, userId: v }))}
              >
                <SelectTrigger className="col-span-3 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {filterContactPersons.map((cp) => (
                    <SelectItem key={cp.id} value={cp.id}>{cp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Optional fields agar View modal punya data */}
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium text-slate-700">Product</label>
              <Input
                className="col-span-3 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                value={draft.productName ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, productName: e.target.value }))}
                placeholder="e.g. Business Card"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium text-slate-700">Quantity</label>
              <Input
                className="col-span-3 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                type="number"
                min={0}
                value={draft.quantity ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, quantity: e.target.value === "" ? "" : Number(e.target.value) }))
                }
                placeholder="e.g. 1000"
              />
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
    </div>
  );
}
