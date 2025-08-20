"use client";

import type { FC, Dispatch, SetStateAction } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Eye, Search, X, Edit, FileText, Calendar, DollarSign } from "lucide-react";
import { useState, useEffect } from "react";
import type { QuoteFormData } from "@/types";

interface Step2Props {
  formData: QuoteFormData;
  setFormData: Dispatch<SetStateAction<QuoteFormData>>;
  onCustomerSelect?: (customer: Customer) => void; // Add callback for customer selection
  onQuoteSelect?: (quote: Quote) => void; // Add callback for quote selection
}

// Real customer interface matching database structure
interface Customer {
  id: string;
  clientType: string;
  companyName?: string;
  contactPerson: string;
  email: string;
  phone: string;
  countryCode: string;
  role?: string;
}

// Real quote interface matching database structure
interface Quote {
  id: string;
  quoteId: string;
  date: string;
  status: string;
  product: string;
  quantity: number;
  sides: "1" | "2";
  printing: string;
  papers: Array<{ id: string; name: string; gsm: string; quoteId: string }>;
  finishing: Array<{ id: string; name: string; quoteId: string }>;
  client: {
    id: string;
    clientType: string;
    companyName?: string;
    contactPerson: string;
    email: string;
    phone: string;
    countryCode: string;
    role?: string;
  };
  amounts?: {
    total: number;
  };
}

const Step2CustomerChoose: FC<Step2Props> = ({ formData, setFormData, onCustomerSelect, onQuoteSelect }) => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [showQuoteDetails, setShowQuoteDetails] = useState(false);
  const [selectedQuoteForDetails, setSelectedQuoteForDetails] = useState<Quote | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const quotesPerPage = 10;

  // Fetch real quotes from database
  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/quotes');
        if (response.ok) {
          const data = await response.json();
          console.log('Fetched quotes from database:', data);
          setQuotes(data);
        } else {
          console.error('Failed to fetch quotes');
          setQuotes([]);
        }
      } catch (error) {
        console.error('Error fetching quotes:', error);
        setQuotes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchQuotes();
  }, []);

  const filteredQuotes = quotes.filter(quote =>
    quote.client.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.client.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.quoteId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.product.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination calculations
  const totalPages = Math.ceil(filteredQuotes.length / quotesPerPage);
  const startIndex = (currentPage - 1) * quotesPerPage;
  const endIndex = startIndex + quotesPerPage;
  const currentQuotes = showAll ? filteredQuotes : filteredQuotes.slice(startIndex, endIndex);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleQuoteSelect = (quoteId: string) => {
    const selected = quotes.find(q => q.id === quoteId);
    if (selected) {
      setSelectedQuote(selected);
      
      // Call the quote selection callback to inform parent about the selected quote
      if (onQuoteSelect) {
        console.log('Calling onQuoteSelect with quote:', selected);
        onQuoteSelect(selected);
      }
      
      // Also call the customer selection callback for backward compatibility
      if (onCustomerSelect) {
        console.log('Calling onCustomerSelect with:', selected.client);
        onCustomerSelect(selected.client);
      }
    }
  };

  const handleViewQuote = (quote: Quote, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedQuote(quote);
    setShowQuoteDetails(true);
  };

  const handleEditQuote = (quote: Quote, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedQuote(quote);
    setShowQuoteDetails(true);
  };

  const isSelectionValid = selectedQuote !== null;

  return (
    <div className="space-y-6">
      {/* Page Title - Changed to "Select Quote" as per revision */}
      <div className="text-center">
        <h2 className="font-bold text-3xl text-gray-900">Select Quote</h2>
        <p className="text-gray-600 mt-2">Review and modify customer details from the selected template</p>
      </div>

      {/* Select Existing Customer Section - White card container */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-lg font-semibold text-gray-900">Select Existing Quote</h4>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {loading ? 'Loading...' : `${quotes.length} quotes available`}
            </span>
            {!loading && totalPages > 1 && !showAll && (
              <span className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </span>
            )}
            {!loading && totalPages > 1 && (
              <button
                onClick={() => {
                  setShowAll(!showAll);
                  if (!showAll) {
                    setCurrentPage(1); // Reset to first page when switching to paged mode
                  }
                }}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1 rounded-md text-sm font-medium transition-colors"
              >
                {showAll ? 'Show Paged' : `Show All (${filteredQuotes.length})`}
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading quotes...</p>
          </div>
        ) : quotes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No quotes found in the database.</p>
            <p className="text-sm mt-2">Please ensure the database is properly seeded.</p>
          </div>
        ) : (
          <>
            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by quote ID, product, or customer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quote Table - Similar style to quote management */}
            <div className="overflow-hidden border border-slate-200 rounded-2xl">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr className="border-slate-200">
                    <th className="text-slate-700 font-semibold p-6 text-left">Quote ID</th>
                    <th className="text-slate-700 font-semibold p-6 text-left">Product</th>
                    <th className="text-slate-700 font-semibold p-6 text-left">Customer</th>
                    <th className="text-slate-700 font-semibold p-6 text-left">Date</th>
                    <th className="text-slate-700 font-semibold p-6 text-left">Status</th>
                    <th className="text-slate-700 font-semibold p-6 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentQuotes.map((quote) => (
                    <tr 
                      key={quote.id} 
                      className={`hover:bg-slate-50/80 transition-colors duration-200 border-slate-100 cursor-pointer ${
                        selectedQuote?.id === quote.id ? 'bg-blue-50 ring-2 ring-blue-200' : ''
                      }`}
                      onClick={() => handleQuoteSelect(quote.id)}
                    >
                      <td className="font-medium text-slate-900 p-6">{quote.quoteId}</td>
                      <td className="text-slate-700 p-6">{quote.product}</td>
                      <td className="text-slate-700 p-6">{quote.client.companyName || quote.client.contactPerson}</td>
                      <td className="text-slate-700 p-6">{new Date(quote.date).toISOString().slice(0, 10)}</td>
                      <td className="text-slate-700 p-6">{quote.status}</td>
                      <td className="p-6">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => handleViewQuote(quote, e)}
                            className="w-8 h-8 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200 p-2 rounded-md"
                            title="View Quote Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => handleEditQuote(quote, e)}
                            className="w-8 h-8 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200 p-2 rounded-md"
                            title="Edit Quote"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && !showAll && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredQuotes.length)} of {filteredQuotes.length} quotes
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Previous
                  </button>
                  
                  {/* Page Numbers */}
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* No Results Message */}
            {filteredQuotes.length === 0 && searchTerm && (
              <div className="text-center py-8 text-gray-500">
                <p>No quotes found matching your search criteria.</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Selection Status */}
      {isSelectionValid && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">✓</span>
            </div>
            <div className="text-green-700">
              <p className="font-medium mb-1">Quote selected successfully!</p>
              <p className="text-sm">
                <strong>Quote ID:</strong> {selectedQuote?.quoteId} | 
                <strong> Product:</strong> {selectedQuote?.product} | 
                <strong> Customer:</strong> {selectedQuote?.client.companyName || selectedQuote?.client.contactPerson}
              </p>
              <p className="text-sm mt-1">You can now proceed to the next step.</p>
            </div>
          </div>
        </div>
      )}

      {/* No Selection Warning */}
      {!isSelectionValid && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
            <div className="text-yellow-700">
              <p className="font-medium mb-1">Please select a quote to continue</p>
              <p className="text-sm">Click on any quote row in the table above to select it for your new quote.</p>
            </div>
          </div>
        </div>
      )}

      {/* View Quote Modal */}
      <Dialog open={showQuoteDetails} onOpenChange={setShowQuoteDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2 text-blue-600" />
              Quote Details - {selectedQuote?.quoteId}
            </DialogTitle>
          </DialogHeader>
          
          {selectedQuote && (
            <div className="space-y-6">
              {/* Quote Header */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Quote ID:</span>
                    <span className="font-medium text-gray-900">{selectedQuote.quoteId}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Quote Date:</span>
                    <span className="font-medium text-gray-900">{new Date(selectedQuote.date).toISOString().slice(0, 10)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Total Amount:</span>
                    <span className="font-bold text-lg text-blue-600">${selectedQuote.amounts?.total || 0.00}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                      {selectedQuote.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-sm">
                    <span className="text-gray-600">Company:</span>
                    <span className="font-medium text-gray-900 ml-2">{selectedQuote.client.companyName || 'Individual'}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">Contact Person:</span>
                    <span className="font-medium text-gray-900 ml-2">{selectedQuote.client.contactPerson}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium text-gray-900 ml-2">{selectedQuote.client.email}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium text-gray-900 ml-2">{selectedQuote.client.phone}</span>
                  </div>
                  {selectedQuote.client.role && (
                    <div className="text-sm">
                      <span className="text-gray-600">Role:</span>
                      <span className="font-medium text-gray-900 ml-2">{selectedQuote.client.role}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quote Items */}
              <div>
                <h5 className="text-md font-semibold text-gray-900 mb-3">Quote Items</h5>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-2">
                    {/* Mock items for now */}
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-700">Business Cards</span>
                      <div className="flex items-center space-x-4">
                        <span className="text-gray-600">Qty: {selectedQuote.quantity}</span>
                        <span className="font-medium text-gray-900">${selectedQuote.amounts?.total || 0.00}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-700">Letterheads</span>
                      <div className="flex items-center space-x-4">
                        <span className="text-gray-600">Qty: 500</span>
                        <span className="font-medium text-gray-900">$600.00</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-700">Envelopes</span>
                      <div className="flex items-center space-x-4">
                        <span className="text-gray-600">Qty: 1000</span>
                        <span className="font-medium text-gray-900">$1,100.00</span>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Total:</span>
                    <span className="font-bold text-lg text-blue-600">${selectedQuote.amounts?.total || 0.00}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Quote Modal */}
      <Dialog open={showQuoteDetails} onOpenChange={setShowQuoteDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Edit className="w-5 h-5 mr-2 text-blue-600" />
              Edit Quote - {selectedQuote?.quoteId}
            </DialogTitle>
          </DialogHeader>
          
          {selectedQuote && (
            <div className="space-y-6">
              {/* Customer Information Section */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Customer Information</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                    <Input
                      value={selectedQuote.client.companyName || ''}
                      onChange={(e) => {
                        // In a real app, you'd update the state here
                        console.log("Company updated:", e.target.value);
                      }}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                    <Input
                      value={selectedQuote.client.contactPerson}
                      onChange={(e) => {
                        console.log("Contact updated:", e.target.value);
                      }}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <Input
                      type="email"
                      value={selectedQuote.client.email}
                      onChange={(e) => {
                        console.log("Email updated:", e.target.value);
                      }}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <Input
                      value={selectedQuote.client.phone}
                      onChange={(e) => {
                        console.log("Phone updated:", e.target.value);
                      }}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Quote Details Section */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Quote Details</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quote Date</label>
                    <Input
                      type="date"
                      value={new Date(selectedQuote.date).toISOString().slice(0, 10)}
                      onChange={(e) => {
                        console.log("Date updated:", e.target.value);
                      }}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={selectedQuote.status}
                      onChange={(e) => {
                        console.log("Status updated:", e.target.value);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="New">New</option>
                      <option value="Sent">Sent</option>
                      <option value="Accepted">Accepted</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
                    <Input
                      value={`$${selectedQuote.amounts?.total || 0.00}`}
                      onChange={(e) => {
                        console.log("Amount updated:", e.target.value);
                      }}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Quote Items Section */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">Quote Items</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // In a real app, you'd add a new item here
                      console.log("Add new item clicked");
                    }}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    + Add Item
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {/* Mock items for now */}
                  <div className="bg-white p-3 rounded border border-gray-200">
                    <div className="grid md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Item</label>
                        <Input
                          value="Business Cards"
                          onChange={(e) => {
                            console.log(`Item updated:`, e.target.value);
                          }}
                          className="w-full text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Quantity</label>
                        <Input
                          value={selectedQuote.quantity}
                          onChange={(e) => {
                            console.log(`Quantity updated:`, e.target.value);
                          }}
                          className="w-full text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Price</label>
                        <Input
                          value={`$${selectedQuote.amounts?.total || 0.00}`}
                          onChange={(e) => {
                            console.log(`Price updated:`, e.target.value);
                          }}
                          className="w-full text-sm"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            console.log(`Remove item`);
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded border border-gray-200">
                    <div className="grid md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Item</label>
                        <Input
                          value="Letterheads"
                          onChange={(e) => {
                            console.log(`Item updated:`, e.target.value);
                          }}
                          className="w-full text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Quantity</label>
                        <Input
                          value="500"
                          onChange={(e) => {
                            console.log(`Quantity updated:`, e.target.value);
                          }}
                          className="w-full text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Price</label>
                        <Input
                          value="$600.00"
                          onChange={(e) => {
                            console.log(`Price updated:`, e.target.value);
                          }}
                          className="w-full text-sm"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            console.log(`Remove item`);
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded border border-gray-200">
                    <div className="grid md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Item</label>
                        <Input
                          value="Envelopes"
                          onChange={(e) => {
                            console.log(`Item updated:`, e.target.value);
                          }}
                          className="w-full text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Quantity</label>
                        <Input
                          value="1000"
                          onChange={(e) => {
                            console.log(`Quantity updated:`, e.target.value);
                          }}
                          className="w-full text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Price</label>
                        <Input
                          value="$1,100.00"
                          onChange={(e) => {
                            console.log(`Price updated:`, e.target.value);
                          }}
                          className="w-full text-sm"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            console.log(`Remove item`);
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Notes Section */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Additional Notes</h4>
                <textarea
                  placeholder="Add any additional notes, special requirements, or comments..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  onChange={(e) => {
                    console.log("Notes updated:", e.target.value);
                  }}
                />
              </div>
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button
              variant="outline"
              onClick={() => setShowQuoteDetails(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                // In a real app, you'd save the changes here
                console.log("Saving changes...");
                setShowQuoteDetails(false);
              }}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Step2CustomerChoose;