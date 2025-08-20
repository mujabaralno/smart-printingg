"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Users, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar,
  Plus,
  Eye,
  Edit,
  Download,
  MoreVertical,
  Filter
} from "lucide-react";
import { getQuotes } from "@/lib/dummy-data";
import Link from "next/link";
import CreateQuoteModal from "@/components/create-quote/CreateQuoteModal";

// Motivational quotes collection
const motivationalQuotes = [
  "Success is not final, failure is not fatal: it is the courage to continue that counts. - Winston Churchill",
  "The only way to do great work is to love what you do. - Steve Jobs",
  "Innovation distinguishes between a leader and a follower. - Steve Jobs",
  "Quality is not an act, it is a habit. - Aristotle",
  "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt",
  "Excellence is never an accident. It is always the result of high intention, sincere effort, and intelligent execution. - Aristotle",
  "Success usually comes to those who are too busy to be looking for it. - Henry David Thoreau",
  "The only limit to our realization of tomorrow will be our doubts of today. - Franklin D. Roosevelt",
  "What you get by achieving your goals is not as important as what you become by achieving your goals. - Zig Ziglar",
  "The way to get started is to quit talking and begin doing. - Walt Disney",
  "Don't watch the clock; do what it does. Keep going. - Sam Levenson",
  "The best way to predict the future is to create it. - Peter Drucker",
  "Success is walking from failure to failure with no loss of enthusiasm. - Winston Churchill",
  "Your work is going to fill a large part of your life, and the only way to be truly satisfied is to do what you believe is great work. - Steve Jobs",
  "The difference between ordinary and extraordinary is that little extra. - Jimmy Johnson"
];

export default function DashboardPage() {
  const [allQuotes, setAllQuotes] = useState(() => {
    // Try to load from localStorage first, fallback to dummy data
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('smartPrintingQuotes');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.log('Failed to parse saved quotes, using default data');
        }
      }
    }
    return getQuotes();
  });
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [currentMotivationalQuote, setCurrentMotivationalQuote] = useState("");
  const [updateStatusValue, setUpdateStatusValue] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isCreateQuoteModalOpen, setIsCreateQuoteModalOpen] = useState(false);
  
  const user = { name: "John", role: "admin" }; // Mock user data

  // Function to get a random motivational quote
  const getRandomQuote = () => {
    const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
    return motivationalQuotes[randomIndex];
  };

  // Set initial quote and change it periodically
  useEffect(() => {
    setCurrentMotivationalQuote(getRandomQuote());
    
    // Change quote every 45 seconds for variety
    const quoteInterval = setInterval(() => {
      setCurrentMotivationalQuote(getRandomQuote());
    }, 45000);
    
    return () => clearInterval(quoteInterval);
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

  // Save quotes to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && allQuotes.length > 0) {
      localStorage.setItem('smartPrintingQuotes', JSON.stringify(allQuotes));
    }
  }, [allQuotes]);

  // Filter quotes based on selected status - use useMemo for better performance
  const filteredQuotes = useMemo(() => {
    const filtered = statusFilter === "All" 
      ? allQuotes 
      : allQuotes.filter(q => q.status === statusFilter);
    
    console.log('filteredQuotes recalculated:', filtered);
    return filtered;
  }, [allQuotes, statusFilter]);

  // Calculate metrics - these will now update automatically when allQuotes changes
  const totalQuotes = allQuotes.length;
  const approvedQuotes = allQuotes.filter(q => q.status === "Approved").length;
  const pendingQuotes = allQuotes.filter(q => q.status === "Pending").length;
  const rejectedQuotes = allQuotes.filter(q => q.status === "Rejected").length;

  const metricCards = [
    {
      title: "Total Quotes",
      value: totalQuotes.toLocaleString(),
      icon: FileText,
      color: "bg-blue-50 text-blue-700 border-blue-200",
      iconColor: "text-blue-600",
      filterValue: "All"
    },
    {
      title: "Approved",
      value: approvedQuotes.toLocaleString(),
      icon: CheckCircle,
      color: "bg-green-50 text-green-700 border-green-200",
      iconColor: "text-green-600",
      filterValue: "Approved"
    },
    {
      title: "Pending",
      value: pendingQuotes.toLocaleString(),
      icon: Clock,
      color: "bg-yellow-50 text-yellow-700 border-yellow-200",
      iconColor: "text-yellow-600",
      filterValue: "Pending"
    },
    {
      title: "Rejected",
      value: rejectedQuotes.toLocaleString(),
      icon: XCircle,
      color: "bg-red-50 text-red-700 border-red-200",
      iconColor: "text-red-600",
      filterValue: "Rejected"
    }
  ];

  // Format date function to match image format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const handleCardClick = (filterValue: string) => {
    setStatusFilter(filterValue);
  };

  const handleViewQuote = (quote: any) => {
    if (!quote || !quote.quoteNumber) {
      console.error('Invalid quote data provided to view modal');
      alert('Invalid quote data. Please try again.');
      return;
    }
    
    console.log('Opening view modal for quote:', quote);
    setSelectedQuote(quote);
    setIsViewModalOpen(true);
  };

  const handleUpdateQuote = (quote: any) => {
    if (!quote || !quote.quoteNumber) {
      console.error('Invalid quote data provided to update modal');
      alert('Invalid quote data. Please try again.');
      return;
    }
    
    console.log('Opening update modal for quote:', quote);
    setSelectedQuote(quote);
    setUpdateStatusValue(quote.status || "");
    setIsUpdateModalOpen(true);
  };

  const handleStatusUpdate = (newStatus: string) => {
    // Validate input data
    if (!selectedQuote || !selectedQuote.quoteNumber) {
      alert('No quote selected for update');
      return;
    }

    if (!updateStatusValue || !newStatus) {
      alert('Please select a valid status before updating.');
      return;
    }

    if (updateStatusValue === selectedQuote.status) {
      alert('Quote already has this status. No changes needed.');
      return;
    }

    try {
      // Store the quote number for reference
      const quoteNumber = selectedQuote.quoteNumber;
      
      // Update the quote status in local state
      const updatedQuotes = allQuotes.map(quote => 
        quote.quoteNumber === quoteNumber 
          ? { ...quote, status: newStatus as any }
          : quote
      );
      
      // Update the quotes state
      setAllQuotes(updatedQuotes);
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('smartPrintingQuotes', JSON.stringify(updatedQuotes));
      }
      
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
      console.error('Error updating quote status:', error);
      alert('Error updating quote status. Please try again.');
      
      // Reset states on error too
      setIsUpdateModalOpen(false);
      setUpdateStatusValue("");
      setSelectedQuote(null);
      setIsUpdating(false);
    }
  };

  const handleDownloadPDF = (quote: any) => {
    // PDF download logic here
    console.log(`Downloading PDF for quote ${quote.quoteNumber}`);
  };

  const handleCreateQuote = (newQuote: any) => {
    // Add the new quote to the existing quotes
    const updatedQuotes = [...allQuotes, newQuote];
    setAllQuotes(updatedQuotes);
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('smartPrintingQuotes', JSON.stringify(updatedQuotes));
    }
    
    // Show success message
    setSuccessMessage(`New quote ${newQuote.quoteNumber} created successfully!`);
    setShowSuccessMessage(true);
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      setShowSuccessMessage(false);
      setSuccessMessage("");
    }, 3000);
  };

  const ViewQuoteModal = () => {
    // Only render if modal should be open
    if (!isViewModalOpen) return null;
    
    return (
      <Dialog 
        open={isViewModalOpen} 
        onOpenChange={(open) => {
          if (!open) {
            // Force close and reset all states
            setIsViewModalOpen(false);
            setSelectedQuote(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Quote Details - {selectedQuote?.quoteNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Client Name</label>
                <p className="text-lg font-semibold">{selectedQuote?.customerName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Amount</label>
                <p className="text-lg font-semibold">${selectedQuote?.totalAmount}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Date Created</label>
                <p className="text-lg font-semibold">{selectedQuote && formatDate(selectedQuote.createdDate)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Status</label>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  selectedQuote?.status === "Approved" 
                    ? "bg-blue-100 text-blue-700"
                    : selectedQuote?.status === "Pending"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
                }`}>
                  {selectedQuote?.status}
                </span>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">Products & Services</label>
              <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  • Business Cards - 1000 units<br/>
                  • Brochures - 500 units<br/>
                  • Custom Design Services
                </p>
              </div>
            </div>

            <div className="flex space-x-4">
              <Button 
                onClick={() => handleDownloadPDF(selectedQuote)}
                className="flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  // Close view modal first
                  setIsViewModalOpen(false);
                  setSelectedQuote(null);
                  
                  // Then open update modal
                  handleUpdateQuote(selectedQuote);
                }}
              >
                Edit Quote
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const UpdateQuoteModal = () => {
    // Only render if modal should be open
    if (!isUpdateModalOpen) return null;
    
    return (
      <Dialog 
        open={isUpdateModalOpen} 
        onOpenChange={(open) => {
          if (!open) {
            // Force close and reset all states
            setIsUpdateModalOpen(false);
            setUpdateStatusValue("");
            setSelectedQuote(null);
            setIsUpdating(false);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Quote - {selectedQuote?.quoteNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-gray-600">Update Status</label>
              <Select value={updateStatusValue} onValueChange={setUpdateStatusValue}>
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
            
            <div className="flex space-x-4">
              <Button 
                onClick={() => handleStatusUpdate(updateStatusValue)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={!updateStatusValue}
              >
                Apply Status Change
              </Button>
              <Button 
                onClick={() => {
                  // Force close and reset all states
                  setIsUpdateModalOpen(false);
                  setUpdateStatusValue("");
                  setSelectedQuote(null);
                  setIsUpdating(false);
                  
                  // Navigate to step 2 customer detail choose
                  window.location.href = `/create-quote?step=2&edit=${selectedQuote?.quoteNumber}`;
                }}
                variant="outline"
                className="flex items-center space-x-2"
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
    <div className="space-y-12">
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-[9999] bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5" />
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {/* Welcome Header */}
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Welcome, {user.name}
        </h1>
        <div className="max-w-4xl mx-auto">
          <p className="text-lg text-slate-600 italic leading-relaxed">
            "{currentMotivationalQuote.split(' - ')[0]}"
          </p>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            — {currentMotivationalQuote.split(' - ')[1]}
          </p>
        </div>
      </div>

      {/* Metric Cards - Now Clickable */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {metricCards.map((metric, index) => {
          const IconComponent = metric.icon;
          const isActive = statusFilter === metric.filterValue;
          return (
            <Card 
              key={index} 
              className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer ${
                isActive ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => handleCardClick(metric.filterValue)}
            >
              <CardContent className="p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-2">{metric.title}</p>
                    <p className="text-3xl font-bold text-slate-900">{metric.value}</p>
                  </div>
                  <div className={`w-14 h-14 rounded-xl ${metric.color} flex items-center justify-center`}>
                    <IconComponent className={`w-7 h-7 ${metric.iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Quotations Section */}
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Recent Quotations</h2>
          <div className="flex items-center space-x-4">
            {/* Status Filter Dropdown */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              onClick={() => setIsCreateQuoteModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create a New Quote
            </Button>
          </div>
        </div>

        {/* Quotations Table */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left p-4 font-semibold text-slate-700">Quote ID</th>
                    <th className="text-left p-4 font-semibold text-slate-700">Client Name</th>
                    <th className="text-left p-4 font-semibold text-slate-700">Date</th>
                    <th className="text-left p-4 font-semibold text-slate-700">Amount</th>
                    <th className="text-left p-4 font-semibold text-slate-700">Status</th>
                    <th className="text-left p-4 font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuotes.map((quote: any, index: number) => (
                    <tr key={`${quote.quoteNumber}-${quote.status}`} className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-200">
                      <td className="p-4">
                        <span className="font-mono text-sm text-slate-900">{quote.quoteNumber}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <Users className="w-4 h-4 text-white" />
                          </div>
                          <span className="font-medium text-slate-900">{quote.customerName}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-slate-500" />
                          <span className="text-slate-700">{formatDate(quote.createdDate)}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-slate-900">${quote.totalAmount}</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          quote.status === "Approved" 
                            ? "bg-blue-100 text-blue-700 border-blue-200"
                            : quote.status === "Pending"
                            ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                            : "bg-red-100 text-red-700 border-red-200"
                        }`}>
                          {quote.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewQuote(quote)}
                            className="h-8 px-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all duration-200 rounded-lg border-0 font-medium text-xs"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            <span>View</span>
                          </Button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all duration-200 rounded-lg border-0 font-medium text-xs"
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                <span>Update</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-48">
                              <DropdownMenuItem 
                                onClick={() => handleUpdateQuote(quote)}
                                className="flex items-center space-x-2 p-3 hover:bg-blue-50 cursor-pointer"
                              >
                                <CheckCircle className="w-4 h-4 text-blue-600" />
                                <span>Change Status</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => {
                                  // Navigate to step 2 customer detail choose
                                  window.location.href = `/create-quote?step=2&edit=${quote.quoteNumber}`;
                                }}
                                className="flex items-center space-x-2 p-3 hover:bg-green-50 cursor-pointer"
                              >
                                <Edit className="w-4 h-4 text-green-600" />
                                <span>Edit Details</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <ViewQuoteModal />
      <UpdateQuoteModal />
      <CreateQuoteModal 
        isOpen={isCreateQuoteModalOpen}
        onClose={() => setIsCreateQuoteModalOpen(false)}
        onSubmit={handleCreateQuote}
      />
    </div>
  );
}