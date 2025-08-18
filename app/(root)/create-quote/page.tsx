"use client";

import React, { useState, useEffect } from "react";
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

export default function CreateQuotePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [quoteMode, setQuoteMode] = useState<"new" | "existing" | null>(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<{
    clientType: 'Individual' | 'Company';
    companyName: string;
    contactPerson: string;
    email: string;
    phone: string;
    countryCode: string;
    role: string;
  } | null>(null);
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

    setFormData((prev) => ({
      ...prev,
      calculation: { basePrice, marginAmount, subtotal, vatAmount, totalPrice },
    }));
  }, [
    formData.operational.papers,
    formData.operational.plates,
    formData.operational.units,
    formData.operational.finishing,
    productsFinishingCheck
  ]);

  const nextStep = () => setCurrentStep((s) => Math.min(5, s + 1));
  const prevStep = () => setCurrentStep((s) => Math.max(1, s - 1));

  const handleStartNew = () => {
    setFormData((prev) => ({ ...prev, client: { ...EMPTY_CLIENT } }));
    setQuoteMode("new");
    setCurrentStep(2);
    setSelectedCustomer(null);
    setShowCustomerList(false);
  };

  const handleSelectQuote = (q: PreviousQuote) => {
    const detail = QUOTE_DETAILS[q.id];
    if (!detail) return;
    setFormData((prev) => detailToForm(detail, prev));
    setQuoteMode("existing");
    setCurrentStep(2);
  };

  const handleSelectCustomer = (customer: {
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
        companyName: customer.companyName,
        contactPerson: customer.contactPerson,
        email: customer.email,
        phone: customer.phone,
        countryCode: customer.countryCode,
        role: customer.role,
      }
    }));
    setShowCustomerList(false);
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

  const handleSaveQuote = () => {
    setSaveModalOpen(true);
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
                  setQuoteMode("existing");
                  setCurrentStep(2);
                  setShowCustomerList(true);
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
                        setQuoteMode("existing");
                        setCurrentStep(2);
                        setShowCustomerList(true);
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
              <Step2CustomerChoose formData={formData} setFormData={setFormData} />
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
            onOpenSave={() => setSaveModalOpen(true)}
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
              <Button
                onClick={nextStep}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={quoteMode === "existing" && currentStep === 1}
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSaveQuote}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Save Quote
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {saveModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md text-center shadow-2xl">
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Quote Saved!</h3>
            <p className="text-slate-600 mb-8">What do you want to do next?</p>
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
                variant="outline"
                onClick={handleCloseAndGoHome}
                className="w-full py-3 rounded-xl border-slate-300 hover:border-slate-400 hover:bg-slate-50 transition-all duration-300"
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
