"use client";

import React, { useState, useEffect, Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Sparkles, Copy, FileText, Eye, Edit, Search } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import StepIndicator from "@/components/create-quote/StepIndicator";
import Step2CustomerChoose from "@/components/create-quote/steps/Step2CustomerChoose";
import Step2CustomerDetail from "@/components/create-quote/steps/Step2CustomerDetail";
import Step3ProductSpec from "@/components/create-quote/steps/Step3ProductSpec";
import Step4Operational from "@/components/create-quote/steps/Step4Operational";
import Step5Quotation from "@/components/create-quote/steps/Step5Quotation";
import { QuoteFormData } from "@/types";
import { downloadCustomerPdf, downloadOpsPdf, OtherQty } from "@/lib/quote-pdf";
import { QUOTE_DETAILS } from "@/lib/dummy-data";
import { detailToForm } from "@/lib/detail-to-form";
import { PreviousQuote } from "@/types";

const EMPTY_CLIENT: QuoteFormData["client"] = {
  clientType: "Company",
  companyName: "",
  contactPerson: "",
  email: "",
  phone: "",
  countryCode: "+971",
  role: "",
};

// Synthetic customer data
const SYNTHETIC_CUSTOMERS: {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  countryCode: string;
  role: string;
  clientType: 'Individual' | 'Company';
}[] = [
  {
    id: "CUST001",
    companyName: "Eagan Inc.",
    contactPerson: "John Smith",
    email: "john.smith@eagan.com",
    phone: "+971-50-123-4567",
    countryCode: "+971",
    role: "Marketing Manager",
    clientType: "Company"
  },
  {
    id: "CUST002",
    companyName: "Tech Solutions Ltd.",
    contactPerson: "Sarah Johnson",
    email: "sarah.j@techsolutions.com",
    phone: "+971-55-987-6543",
    countryCode: "+971",
    role: "Operations Director",
    clientType: "Company"
  },
  {
    id: "CUST003",
    companyName: "Global Print Corp.",
    contactPerson: "Michael Brown",
    email: "michael.b@globalprint.com",
    phone: "+971-52-456-7890",
    countryCode: "+971",
    role: "Procurement Manager",
    clientType: "Company"
  },
  {
    id: "CUST004",
    companyName: "Creative Agency",
    contactPerson: "Lisa Wilson",
    email: "lisa.w@creativeagency.com",
    phone: "+971-54-321-0987",
    countryCode: "+971",
    role: "Creative Director",
    clientType: "Company"
  },
  {
    id: "CUST005",
    companyName: "Marketing Pro",
    contactPerson: "David Lee",
    email: "david.lee@marketingpro.com",
    phone: "+971-56-789-0123",
    countryCode: "+971",
    role: "Marketing Specialist",
    clientType: "Company"
  }
];

// Create a separate component that uses useSearchParams
function CreateQuoteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [quoteMode, setQuoteMode] = useState<"new" | "existing" | null>(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<{
    id?: string; // Add optional ID field for existing customers
    clientType: 'Individual' | 'Company';
    companyName: string | null;
    contactPerson: string;
    email: string;
    phone: string;
    countryCode: string;
    role: string | null;
  } | null>(null);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerList, setShowCustomerList] = useState(false);

  const [formData, setFormData] = useState<QuoteFormData>({
    client: { ...EMPTY_CLIENT },
    products: [
      {
        productName: "Business Card",
        quantity: 1000,
        sides: "1",
        printingSelection: "Digital",
        flatSize: { width: 9, height: 5.5, spine: null },
        closeSize: { width: 9, height: 5.5, spine: null },
        useSameAsFlat: false,
        papers: [{ name: "Art Paper", gsm: "300" }],
        finishing: ["UV Spot", "Lamination"],
        paperName: "Book",
      },
    ],
    operational: {
      papers: [
        {
          inputWidth: 65,
          inputHeight: 90,
          pricePerPacket: 240,
          sheetsPerPacket: 500,
          recommendedSheets: 125,
          enteredSheets: 130,
          outputWidth: null,
          outputHeight: null,
        },
      ],
      finishing: [
        { name: "UV Spot", cost: 20 },
        { name: "Lamination", cost: 15 },
      ],
      plates: 4,
      units: 5000,
    },
    calculation: {
      basePrice: 0,
      marginAmount: 0,
      subtotal: 0,
      vatAmount: 0,
      totalPrice: 0,
    },
  });

  // ===== NEW: state untuk Other Quantities di parent
  const mainProduct = formData.products[0];
  const [otherQuantities, setOtherQuantities] = useState<OtherQty[]>([
    {
      productName: mainProduct?.productName ?? "Business Card",
      quantity: 500,
      price: 115,
    },
  ]);

  useEffect(() => {
    setOtherQuantities((prev) =>
      prev.length === 0
        ? prev
        : [
            {
              ...prev[0],
              productName: mainProduct?.productName ?? prev[0].productName,
            },
            ...prev.slice(1),
          ]
    );
  }, [mainProduct?.productName]);

  // Handle URL parameters for step and edit mode
  useEffect(() => {
    const stepParam = searchParams.get('step');
    const editParam = searchParams.get('edit');
    
    if (stepParam) {
      const stepNumber = parseInt(stepParam);
      if (stepNumber >= 1 && stepNumber <= 5) {
        setCurrentStep(stepNumber);
      }
    }
    
    if (editParam) {
      setQuoteMode("existing");
      setSelectedQuoteId(null); // Will be set when a specific quote is selected
      // You can load existing quote data here if needed
    }
  }, [searchParams]);

  // Memoize the products finishing check to prevent unnecessary re-renders
  const productsFinishingCheck = React.useMemo(() => {
    return formData.products.map(product => ({
      productName: product.productName,
      finishing: product.finishing
    }));
  }, [formData.products]);

  useEffect(() => {
    const MARGIN_PERCENTAGE = 0.3;
    const VAT_PERCENTAGE = 0.05;

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
    const actualUnitsNeeded = formData.operational.units || formData.products[0]?.quantity || 0;
    const finishingCost = formData.operational.finishing.reduce((total, f) => {
      // Check if this finishing is used by any product using memoized check
      const isUsedByAnyProduct = productsFinishingCheck.some(product => 
        product.finishing.includes(f.name)
      );
      if (isUsedByAnyProduct) {
        return total + ((f.cost || 0) * actualUnitsNeeded);
      }
      return total;
    }, 0);

    // 4. Calculate total costs
    const basePrice = paperCost + platesCost + finishingCost;
    const marginAmount = basePrice * MARGIN_PERCENTAGE;
    const subtotal = basePrice + marginAmount;
    const vatAmount = subtotal * VAT_PERCENTAGE;
    const totalPrice = subtotal + vatAmount;

    console.log("Calculation triggered:", {
      paperCost,
      platesCost,
      finishingCost,
      basePrice,
      marginAmount,
      subtotal,
      vatAmount,
      totalPrice,
      productsFinishingCheck,
      actualUnitsNeeded
    });

    setFormData((prev) => ({
      ...prev,
      calculation: { basePrice, marginAmount, subtotal, vatAmount, totalPrice },
    }));
  }, [
    formData.operational.papers,
    formData.operational.plates,
    formData.operational.units,
    formData.operational.finishing,
    productsFinishingCheck,
    formData.products
  ]);

  const nextStep = () => setCurrentStep((s) => Math.min(5, s + 1));
  const prevStep = () => setCurrentStep((s) => Math.max(1, s - 1));

  // Add validation functions for Next button
  const canProceedFromStep1 = () => {
    return quoteMode !== null; // User must select either new or existing quote mode
  };

  const canProceedFromStep2 = () => {
    if (quoteMode === "new") {
      // For new quote mode, validate required fields
      const client = formData.client;
      const requiredFields = [
        client.email,
        client.firstName, // Check firstName instead of contactPerson
        client.lastName,  // Check lastName
        client.countryCode,
        client.phone
      ];
      
      // Add company-specific required fields
      if (client.clientType === "Company") {
        requiredFields.push(client.companyName, client.role);
      }
      
      return requiredFields.every(field => field && field.trim() !== "");
    } else if (quoteMode === "existing") {
      // For existing quote mode, we need to select an actual existing quote
      // This will be handled in Step2CustomerChoose when they select a specific quote
      return selectedQuoteId !== null; // Must have selected a specific quote to edit
    }
    
    return false;
  };

  const isNextButtonDisabled = () => {
    if (currentStep === 1) {
      return !canProceedFromStep1();
    } else if (currentStep === 2) {
      return !canProceedFromStep2();
    }
    return false;
  };

  const handleStartNew = () => {
    setFormData((prev) => ({ 
      ...prev, 
      client: { ...EMPTY_CLIENT },
      // Reset to default product for new quotes
      products: [
        {
          productName: "Business Card",
          quantity: 1000,
          sides: "1",
          printingSelection: "Digital",
          flatSize: { width: 9, height: 5.5, spine: null },
          closeSize: { width: 9, height: 5.5, spine: null },
          useSameAsFlat: false,
          papers: [{ name: "Art Paper", gsm: "300" }],
          finishing: ["UV Spot", "Lamination"],
          paperName: "Book",
        },
      ]
    }));
    setQuoteMode("new");
    setSelectedQuoteId(null); // Reset selected quote ID for new quotes
    setCurrentStep(2);
    setSelectedCustomer(null);
  };

  const handleSelectQuote = (q: PreviousQuote) => {
    const detail = QUOTE_DETAILS[q.id];
    if (!detail) return;
    setFormData((prev) => detailToForm(detail, prev));
    setQuoteMode("existing");
    setSelectedQuoteId(q.id); // Set the selected quote ID for updating
    setCurrentStep(2);
  };

  const handleSelectCustomer = (customer: {
    id?: string; // Add optional ID field for existing customers
    clientType: 'Individual' | 'Company';
    companyName: string;
    contactPerson: string;
    email: string;
    phone: string;
    countryCode: string;
    role: string;
  }) => {
    setSelectedCustomer(customer);
    setFormData((prev) => ({
      ...prev,
      client: {
        clientType: customer.clientType as 'Individual' | 'Company',
        companyName: customer.companyName || '',
        contactPerson: customer.contactPerson,
        email: customer.email,
        phone: customer.phone,
        countryCode: customer.countryCode,
        role: customer.role || '',
      }
    }));
  };

  const handleEditCustomer = (customer: {
    clientType: 'Individual' | 'Company';
    companyName: string;
    contactPerson: string;
    email: string;
    phone: string;
    countryCode: string;
    role: string;
  }) => {
    // Handle editing customer - for now just select it
    handleSelectCustomer(customer);
  };

  const handleCustomerSelect = (customer: {
    id: string;
    clientType: string;
    companyName?: string;
    contactPerson: string;
    email: string;
    phone: string;
    countryCode: string;
    role?: string;
  }) => {
    setSelectedCustomer({
      id: customer.id,
      clientType: customer.clientType as 'Individual' | 'Company',
      companyName: customer.companyName || null,
      contactPerson: customer.contactPerson,
      email: customer.email,
      phone: customer.phone,
      countryCode: customer.countryCode,
      role: customer.role || null,
    });
    setFormData((prev) => ({
      ...prev,
      client: {
        clientType: customer.clientType as 'Individual' | 'Company',
        companyName: customer.companyName || '',
        contactPerson: customer.contactPerson,
        email: customer.email,
        phone: customer.phone,
        countryCode: customer.countryCode,
        role: customer.role || '',
      }
    }));
  };

  // Handle quote selection for editing existing quotes
  const handleQuoteSelect = (quote: any) => {
    console.log('Quote selected for editing:', quote);
    
    // Set the selected quote ID for editing
    setSelectedQuoteId(quote.id);
    
    // Also set the customer data
    handleCustomerSelect(quote.client);
    
    // Update form data with the quote's product information
    if (quote.product) {
      setFormData(prev => ({
        ...prev,
        products: [{
          productName: quote.product || "Printing Product",
          paperName: "Standard Paper",
          quantity: quote.quantity || 100,
          sides: (quote.sides as "1" | "2") || "1",
          printingSelection: (quote.printing as "Digital" | "Offset" | "Either" | "Both") || "Digital",
          flatSize: { width: 9, height: 5.5, spine: 0 },
          closeSize: { width: 9, height: 5.5, spine: 0 },
          useSameAsFlat: true,
          papers: quote.papers && quote.papers.length > 0 
            ? quote.papers.map((p: any) => ({ name: p.name, gsm: p.gsm }))
            : [{ name: "Standard Paper", gsm: "150" }],
          finishing: quote.finishing && quote.finishing.length > 0
            ? quote.finishing.map((f: any) => f.name)
            : [],
          colors: { front: "", back: "" }
        }]
      }));
    }
  };

  // Get current user ID - use default for demo purposes
  const getCurrentUserId = async () => {
    // Use a default user ID for demo purposes
    return 'demo-user-001';
  };

  // Validate form data before allowing save
  const validateFormData = () => {
    const errors: string[] = [];

    // Check if client information is complete
    if (!formData.client.email || !formData.client.phone) {
      errors.push("Client email and phone are required");
    }

    if (formData.client.clientType === "Company" && !formData.client.companyName) {
      errors.push("Company name is required for company clients");
    }

    if (!formData.client.contactPerson && (!formData.client.firstName || !formData.client.lastName)) {
      errors.push("Contact person name is required");
    }

    // Check if products exist and have required information
    if (formData.products.length === 0) {
      errors.push("At least one product must be added");
    }

    formData.products.forEach((product, index) => {
      if (!product.productName || !product.quantity) {
        errors.push(`Product ${index + 1} must have a name and quantity`);
      }
    });

    if (errors.length > 0) {
      alert(`Please fix the following issues:\n${errors.join('\n')}`);
      return false;
    }

    return true;
  };

  const handleSaveQuote = async (isUpdate: boolean = false) => {
    setIsSaving(true);
    try {
      // First, save the client if it's a new client
      let clientId = selectedCustomer?.id;
      
      if (!clientId) {
        // Create new client - Fix the data mapping
        const clientData = {
          clientType: formData.client.clientType,
          companyName: formData.client.clientType === "Company" ? formData.client.companyName : null,
          contactPerson: formData.client.contactPerson || `${formData.client.firstName || ''} ${formData.client.lastName || ''}`.trim(),
          email: formData.client.email,
          phone: formData.client.phone,
          countryCode: formData.client.countryCode,
          role: formData.client.clientType === "Company" ? formData.client.role : null,
        };

        // Validate client data before sending to API
        if (!clientData.contactPerson || !clientData.email || !clientData.phone) {
          throw new Error('Missing required client information: contact person, email, or phone');
        }

        if (clientData.clientType === "Company" && !clientData.companyName) {
          throw new Error('Company name is required for company clients');
        }

        console.log('Creating new client with data:', clientData);

        const clientResponse = await fetch('/api/clients', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(clientData),
        });

        if (!clientResponse.ok) {
          const errorText = await clientResponse.text();
          console.error('Client creation failed:', clientResponse.status, errorText);
          throw new Error(`Failed to create client: ${clientResponse.status} - ${errorText}`);
        }

        const newClient = await clientResponse.json();
        clientId = newClient.id;
        console.log('Client created successfully:', newClient);
      }

      // Get current user ID
      const currentUserId = await getCurrentUserId();

      // Prepare quote data for API - Fix the data structure to match DatabaseService expectations
      const quoteData = {
        date: new Date(),
        status: "Pending",
        clientId: clientId,
        userId: currentUserId,
        product: formData.products[0]?.productName || "Printing Product",
        quantity: formData.products[0]?.quantity || 0,
        sides: formData.products[0]?.sides || "1",
        printing: formData.products[0]?.printingSelection || "Digital",
      };

      let quoteResponse;
      let savedQuote;

      // Check if we're actually editing an existing quote (has selectedQuoteId)
      if (selectedQuoteId) {
        // Update existing quote - we have a specific quote ID to edit
        console.log('Updating existing quote:', selectedQuoteId);
        console.log('Quote data being sent:', quoteData);
        
        // For updates, we can include additional data like papers, finishing, amounts
        const updateData = {
          ...quoteData,
          papers: formData.products[0]?.papers || [],
          finishing: formData.products[0]?.finishing || [],
          amounts: {
            base: formData.calculation.basePrice || 0,
            vat: formData.calculation.vatAmount || 0,
            total: formData.calculation.totalPrice || 0
          }
        };
        
        quoteResponse = await fetch(`/api/quotes/${selectedQuoteId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        });

        if (!quoteResponse.ok) {
          const errorText = await quoteResponse.text();
          console.error('Quote update failed:', quoteResponse.status, errorText);
          throw new Error(`Failed to update quote: ${quoteResponse.status} - ${errorText}`);
        }

        savedQuote = await quoteResponse.json();
        console.log('Quote updated successfully:', savedQuote);
      } else {
        // Create new quote - even if using existing customer, this is a new quote
        console.log('Creating new quote with complete details');
        
        // Generate a unique quote ID in proper format: QT-YYYY-MMDD-XXX
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const randomNum = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
        const quoteId = `QT-${year}-${month}${day}-${randomNum}`;
        
        // Prepare complete quote data with all details
        const completeQuoteData = {
          ...quoteData,
          quoteId: quoteId,
          papers: formData.products[0]?.papers || [],
          finishing: formData.products[0]?.finishing || [],
          amounts: {
            base: formData.calculation.basePrice || 0,
            vat: formData.calculation.vatAmount || 0,
            total: formData.calculation.totalPrice || 0
          }
        };
        
        console.log('Complete quote data being sent:', completeQuoteData);
        
        quoteResponse = await fetch('/api/quotes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(completeQuoteData),
        });

        if (!quoteResponse.ok) {
          const errorText = await quoteResponse.text();
          console.error('Quote creation failed:', quoteResponse.status, errorText);
          throw new Error(`Failed to create quote: ${quoteResponse.status} - ${errorText}`);
        }

        savedQuote = await quoteResponse.json();
        console.log('Quote created successfully with all details:', savedQuote);
      }

      // Show success modal
      setSaveModalOpen(true);
    } catch (error) {
      console.error('Error saving quote:', error);
      // Use a more user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const action = selectedQuoteId ? 'updating' : 'creating';
      alert(`Error ${action} quote: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadCustomerFromModal = async () => {
    await downloadCustomerPdf(formData, otherQuantities);
    setSaveModalOpen(false);
  };

  const handleDownloadOpsFromModal = async () => {
    await downloadOpsPdf(formData, otherQuantities);
    setSaveModalOpen(false);
  };

  const handleCloseAndGoHome = () => {
    setSaveModalOpen(false);
    router.push("/");
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-8">
            {/* Step 1 Header */}
            <div className="text-center space-y-3">
              <h3 className="text-2xl font-bold text-slate-900">Create A Quote</h3>
              <p className="text-lg text-slate-600">Choose how you&apos;d like to create your printing quote</p>
            </div>

            {/* Quote Mode Selection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Create New Quote Card */}
              <Card 
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
                onClick={handleStartNew}
              >
                <CardContent className="p-8 text-center space-y-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold text-slate-900">Create New Quote</h3>
                    <p className="text-slate-600 leading-relaxed">
                      Start a fresh quotation from scratch. Perfect for new projects, custom requirements, or when you need complete control over the quote details.
                    </p>
                  </div>
                  <div className="pt-4">
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                      onClick={handleStartNew}
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Start New Quote
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Existing Quote Card */}
              <Card 
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
                onClick={() => {
                  // Clear default product data when entering existing quote mode
                  setFormData((prev) => ({ 
                    ...prev, 
                    products: [] // Clear products array - will be populated from selected quote
                  }));
                  setQuoteMode("existing");
                  setSelectedQuoteId(null); // Will be set when a specific quote is selected
                  setCurrentStep(2);
                  setSelectedCustomer(null);
                }}
              >
                <CardContent className="p-8 text-center space-y-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                    <Copy className="w-10 h-10 text-white" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold text-slate-900">Based on Previous Quote</h3>
                    <p className="text-slate-600 leading-relaxed">
                      Use an existing quote as a template. Save time by modifying previous specifications, pricing, and customer details for similar projects.
                    </p>
                  </div>
                  <div className="pt-4">
                    <Button 
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                      onClick={() => {
                        // Clear default product data when entering existing quote mode
                        setFormData((prev) => ({ 
                          ...prev, 
                          products: [] // Clear products array - will be populated from selected quote
                        }));
                        setQuoteMode("existing");
                        setSelectedQuoteId(null); // Will be set when a specific quote is selected
                        setCurrentStep(2);
                        setSelectedCustomer(null);
                      }}
                    >
                      <FileText className="w-5 h-5 mr-2" />
                      Use Existing Quote
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Additional Info */}
            <div className="text-center text-slate-500 max-w-2xl mx-auto">
              <p className="text-sm">
                Both options will guide you through the same comprehensive quote creation process, 
                ensuring accuracy and consistency in your printing estimates.
              </p>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            {quoteMode === "new" && (
              <div className="text-center space-y-3">
                <h3 className="text-2xl font-bold text-slate-900">Customer Details</h3>
                <p className="text-slate-600">
                  Fill in the customer information for your new quote
                </p>
              </div>
            )}
            
            {quoteMode === "existing" ? (
              // Use Step2CustomerChoose component for existing quote mode
              <Step2CustomerChoose 
                formData={formData} 
                setFormData={setFormData} 
                onCustomerSelect={handleCustomerSelect}
                onQuoteSelect={handleQuoteSelect} // Pass the new handler
              />
            ) : (
              // Show empty customer detail form for new quote
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  New Customer Details
                </h4>
                <Step2CustomerDetail formData={formData} setFormData={setFormData} />
              </div>
            )}
          </div>
        );
      case 3:
        return (
          <Step3ProductSpec formData={formData} setFormData={setFormData} />
        );
      case 4:
        return (
          <Step4Operational formData={formData} setFormData={setFormData} />
        );
      case 5:
        return (
          <Step5Quotation
            formData={formData}
            setFormData={setFormData}
            otherQuantities={otherQuantities}
            setOtherQuantities={setOtherQuantities}
            onOpenSave={() => {
              // Validate form data before opening save modal
              if (validateFormData()) {
                setSaveModalOpen(true);
              }
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-12">
      {/* Main Content Card */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-10 space-y-10">
          <StepIndicator
            activeStep={currentStep}
          />
          
          <div className="mt-8">{renderStepContent()}</div>

          {/* Validation Status Indicators */}
          {currentStep === 1 && (
            <div className="mt-6">
              {!canProceedFromStep1() ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <p className="text-yellow-700 font-medium">
                      Please select either "Create New Quote" or "Based on Previous Quote" to continue
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                    <p className="text-green-700 font-medium">
                      {quoteMode === "new" ? "New quote mode selected. You can proceed to the next step." : "Existing quote mode selected. You can proceed to the next step."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div className="mt-6">
              {!canProceedFromStep2() ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <p className="text-yellow-700 font-medium">
                      {quoteMode === "new" 
                        ? "Please fill in all required customer information fields to continue" 
                        : "Please select an existing quote to continue"
                      }
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                    <p className="text-green-700 font-medium">
                      {quoteMode === "new" 
                        ? "All required customer information is complete. You can proceed to the next step." 
                        : "Quote selected successfully. You can proceed to the next step."
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-12 pt-8 border-t border-slate-200 flex justify-between items-center">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="border-slate-300 hover:border-slate-400 hover:bg-slate-50 px-8 py-3 rounded-xl transition-all duration-300"
            >
              Previous
            </Button>
            {currentStep < 5 ? (
              <div className="relative">
                <Button
                  onClick={nextStep}
                  disabled={isNextButtonDisabled()}
                  className={`px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ${
                    isNextButtonDisabled() 
                      ? "bg-gray-400 cursor-not-allowed" 
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                  title={
                    isNextButtonDisabled() 
                      ? currentStep === 1 
                        ? "Please select a quote mode to continue"
                        : currentStep === 2 && quoteMode === "existing"
                        ? "Please select a specific quote to edit"
                        : "Please complete the required information to continue"
                      : "Click to proceed to the next step"
                  }
                >
                  Next
                </Button>
                {isNextButtonDisabled() && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg whitespace-nowrap z-10">
                    {currentStep === 1 
                      ? "Select a quote mode first"
                      : currentStep === 2 && quoteMode === "existing"
                      ? "Select a specific quote to edit first"
                      : "Complete required fields first"
                    }
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                  </div>
                )}
              </div>
            ) : (
              <Button
                onClick={() => handleSaveQuote(!!selectedQuoteId)}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {selectedQuoteId ? "Update Quote" : "Save Quote"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {saveModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md text-center shadow-2xl">
            <h3 className="text-2xl font-bold text-slate-900 mb-3">
              {selectedQuoteId ? "Quote Updated Successfully!" : "Quote Saved Successfully!"}
            </h3>
            <p className="text-slate-600 mb-6">
              {selectedQuoteId 
                ? "Your quote has been updated and will appear in the Quote Management page."
                : "Your quote has been saved and will appear in the Quote Management page."
              }
            </p>
            <div className="space-y-4">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                <Link href={`mailto:${formData.client.email}`}>
                  Send to Customer
                </Link>
              </Button>
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={handleDownloadCustomerFromModal}
              >
                Download for Customer
              </Button>
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={handleDownloadOpsFromModal}
              >
                Download Operations Copy
              </Button>
                              <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={() => {
                    setSaveModalOpen(false);
                    router.push("/quote-management");
                  }}
                >
                  {selectedQuoteId ? "View Updated Quote" : "View in Quote Management"}
                </Button>
              <Button
                variant="outline"
                onClick={handleCloseAndGoHome}
                className="w-full py-3 rounded-xl border-slate-300 hover:border-slate-400 hover:bg-slate-400 transition-all duration-300"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Main component with Suspense boundary
export default function CreateQuotePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-slate-600">Loading quote creation...</p>
        </div>
      </div>
    }>
      <CreateQuoteContent />
    </Suspense>
  );
}
