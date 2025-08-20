"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { CheckCircle, Building, User, Plus, X } from "lucide-react";
import type { QuoteFormData } from "@/types";

interface CreateQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: QuoteFormData) => void;
}

// Mock existing customers database
const EXISTING_CUSTOMERS = [
  {
    id: "CUST001",
    clientType: "Company" as const,
    companyName: "Eagan Inc.",
    firstName: "John",
    lastName: "Smith",
    contactPerson: "John Smith",
    email: "john.smith@eagan.com",
    phone: "501234567",
    countryCode: "+971",
    role: "Marketing Manager",
    addressLine1: "Sheikh Zayed Road",
    addressLine2: "Office 1205, Business Bay",
    city: "Dubai",
    state: "Dubai",
    postalCode: "00000",
    country: "UAE",
    additionalInfo: "Regular customer, prefers digital communication"
  },
  {
    id: "CUST002",
    clientType: "Company" as const,
    companyName: "Tech Solutions Ltd.",
    firstName: "Sarah",
    lastName: "Johnson",
    contactPerson: "Sarah Johnson",
    email: "sarah.j@techsolutions.com",
    phone: "559876543",
    countryCode: "+971",
    role: "Operations Director",
    addressLine1: "Marina Walk",
    addressLine2: "Tower 3, Level 15",
    city: "Dubai",
    state: "Dubai",
    postalCode: "00000",
    country: "UAE",
    additionalInfo: "Bulk orders, requires detailed quotations"
  },
  {
    id: "CUST003",
    clientType: "Individual" as const,
    companyName: "",
    firstName: "Michael",
    lastName: "Brown",
    contactPerson: "Michael Brown",
    email: "michael.brown@gmail.com",
    phone: "524567890",
    countryCode: "+971",
    role: "",
    addressLine1: "Al Wasl Road",
    addressLine2: "Villa 25",
    city: "Dubai",
    state: "Dubai",
    postalCode: "00000",
    country: "UAE",
    additionalInfo: "Individual client, small quantity orders"
  }
];

const CreateQuoteModal: React.FC<CreateQuoteModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<QuoteFormData>({
    client: {
      clientType: "Company",
      companyName: "",
      contactPerson: "",
      email: "",
      phone: "",
      countryCode: "+971",
      role: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "UAE",
      additionalInfo: ""
    },
    products: [],
    operational: {
      papers: [],
      finishing: [],
      plates: null,
      units: null
    },
    calculation: {
      basePrice: 0,
      marginAmount: 0,
      subtotal: 0,
      vatAmount: 0,
      totalPrice: 0
    }
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const setClient = (patch: Partial<typeof formData.client>) =>
    setFormData((prev) => ({ ...prev, client: { ...prev.client, ...patch } }));

  // Auto-fill functionality
  const handleCompanyNameChange = (value: string) => {
    setClient({ companyName: value });
    setSearchTerm(value);
    
    if (value.length > 0) {
      setShowSuggestions(true);
      const existingCustomer = EXISTING_CUSTOMERS.find(
        customer => customer.companyName.toLowerCase().includes(value.toLowerCase()) ||
                   customer.contactPerson.toLowerCase().includes(value.toLowerCase())
      );
      
      if (existingCustomer) {
        setSelectedCustomer(existingCustomer);
        setIsNewCustomer(false);
      } else {
        setSelectedCustomer(null);
        setIsNewCustomer(true);
      }
    } else {
      setShowSuggestions(false);
      setSelectedCustomer(null);
      setIsNewCustomer(true);
    }
  };

  const handleCustomerSelect = (customer: any) => {
    setSelectedCustomer(customer);
    setIsNewCustomer(false);
    setClient({
      clientType: customer.clientType,
      companyName: customer.companyName,
      contactPerson: customer.contactPerson,
      email: customer.email,
      phone: customer.phone,
      countryCode: customer.countryCode,
      role: customer.role,
      addressLine1: customer.addressLine1,
      addressLine2: customer.addressLine2,
      city: customer.city,
      state: customer.state,
      postalCode: customer.postalCode,
      country: customer.country,
      additionalInfo: customer.additionalInfo
    });
    setShowSuggestions(false);
    setSearchTerm(customer.companyName || customer.contactPerson);
  };

  const handleSubmit = () => {
    // Generate a unique quote number
    const quoteNumber = `QT${Date.now()}`;
    
    // Create the quote object
    const newQuote = {
      id: quoteNumber,
      quoteNumber: quoteNumber,
      customerName: formData.client.companyName || formData.client.contactPerson,
      createdDate: new Date().toISOString(),
      status: "Pending" as const,
      totalAmount: formData.calculation.totalPrice || 0,
      client: formData.client,
      products: formData.products,
      operational: formData.operational,
      calculation: formData.calculation
    };

    onSubmit(newQuote);
    onClose();
    
    // Reset form
    setFormData({
      client: {
        clientType: "Company",
        companyName: "",
        contactPerson: "",
        email: "",
        phone: "",
        countryCode: "+971",
        role: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "UAE",
        additionalInfo: ""
      },
      products: [],
      operational: {
        papers: [],
        finishing: [],
        plates: null,
        units: null
      },
      calculation: {
        basePrice: 0,
        marginAmount: 0,
        subtotal: 0,
        vatAmount: 0,
        totalPrice: 0
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-900">
            Create New Quote
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-8">
          {/* Client Information Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-slate-900">Client Information</h3>
            </div>

            {/* Client Type Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-slate-700">Client Type</Label>
              <RadioGroup
                value={formData.client.clientType}
                onValueChange={(value: "Company" | "Individual") => setClient({ clientType: value })}
                className="flex space-x-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Company" id="company" />
                  <Label htmlFor="company" className="flex items-center space-x-2 cursor-pointer">
                    <Building className="w-4 h-4 text-blue-600" />
                    <span>Company</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Individual" id="individual" />
                  <Label htmlFor="individual" className="flex items-center space-x-2 cursor-pointer">
                    <User className="w-4 h-4 text-green-600" />
                    <span>Individual</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Company Name / Individual Names */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData.client.clientType === "Company" ? (
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-sm font-medium text-slate-700">
                    Company Name *
                  </Label>
                  <div className="relative">
                    <Input
                      id="companyName"
                      value={searchTerm}
                      onChange={(e) => handleCompanyNameChange(e.target.value)}
                      placeholder="Enter company name"
                      className="w-full"
                    />
                    {showSuggestions && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                        {EXISTING_CUSTOMERS.filter(customer => 
                          customer.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          customer.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
                        ).map((customer) => (
                                                      <div
                              key={customer.id}
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100"
                              onClick={() => handleCustomerSelect(customer)}
                            >
                              <div className="font-medium">
                                {customer.clientType === "Company" ? customer.companyName : customer.contactPerson}
                              </div>
                              <div className="text-sm text-gray-600">{customer.email}</div>
                            </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="contactPerson" className="text-sm font-medium text-slate-700">
                    Contact Person *
                  </Label>
                  <Input
                    id="contactPerson"
                    value={formData.client.contactPerson}
                    onChange={(e) => setClient({ contactPerson: e.target.value })}
                    placeholder="Enter contact person name"
                  />
                </div>
              )}
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.client.email}
                  onChange={(e) => setClient({ email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-slate-700">
                  Phone Number *
                </Label>
                <div className="flex space-x-2">
                  <Select value={formData.client.countryCode} onValueChange={(value) => setClient({ countryCode: value })}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="+971">+971</SelectItem>
                      <SelectItem value="+1">+1</SelectItem>
                      <SelectItem value="+44">+44</SelectItem>
                      <SelectItem value="+61">+61</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    id="phone"
                    value={formData.client.phone}
                    onChange={(e) => setClient({ phone: e.target.value })}
                    placeholder="Enter phone number"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Role (for companies) */}
            {formData.client.clientType === "Company" && (
              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm font-medium text-slate-700">
                  Role/Position
                </Label>
                <Input
                  id="role"
                  value={formData.client.role}
                  onChange={(e) => setClient({ role: e.target.value })}
                  placeholder="e.g., Marketing Manager, Operations Director"
                />
              </div>
            )}

            {/* Address Information */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-slate-700">Address Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="addressLine1" className="text-sm font-medium text-slate-700">
                    Address Line 1 *
                  </Label>
                  <Input
                    id="addressLine1"
                    value={formData.client.addressLine1}
                    onChange={(e) => setClient({ addressLine1: e.target.value })}
                    placeholder="Enter street address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addressLine2" className="text-sm font-medium text-slate-700">
                    Address Line 2
                  </Label>
                  <Input
                    id="addressLine2"
                    value={formData.client.addressLine2}
                    onChange={(e) => setClient({ addressLine2: e.target.value })}
                    placeholder="Apartment, suite, etc. (optional)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-medium text-slate-700">
                    City *
                  </Label>
                  <Input
                    id="city"
                    value={formData.client.city}
                    onChange={(e) => setClient({ city: e.target.value })}
                    placeholder="Enter city"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state" className="text-sm font-medium text-slate-700">
                    State/Province *
                  </Label>
                  <Input
                    id="state"
                    value={formData.client.state}
                    onChange={(e) => setClient({ state: e.target.value })}
                    placeholder="Enter state or province"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode" className="text-sm font-medium text-slate-700">
                    Postal Code *
                  </Label>
                  <Input
                    id="postalCode"
                    value={formData.client.postalCode}
                    onChange={(e) => setClient({ postalCode: e.target.value })}
                    placeholder="Enter postal code"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country" className="text-sm font-medium text-slate-700">
                    Country *
                  </Label>
                  <Select value={formData.client.country} onValueChange={(value) => setClient({ country: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UAE">UAE</SelectItem>
                      <SelectItem value="USA">USA</SelectItem>
                      <SelectItem value="UK">UK</SelectItem>
                      <SelectItem value="Canada">Canada</SelectItem>
                      <SelectItem value="Australia">Australia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-2">
              <Label htmlFor="additionalInfo" className="text-sm font-medium text-slate-700">
                Additional Information
              </Label>
              <Textarea
                id="additionalInfo"
                value={formData.client.additionalInfo}
                onChange={(e) => setClient({ additionalInfo: e.target.value })}
                placeholder="Any special requirements, notes, or additional information about the client"
                rows={3}
              />
            </div>
          </div>


        </div>

        <DialogFooter className="flex space-x-3 pt-6">
          <Button
            variant="outline"
            onClick={onClose}
            className="px-6 py-2"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
            disabled={!formData.client.email || !formData.client.phone || 
                     (formData.client.clientType === "Company" && !formData.client.companyName) ||
                     (formData.client.clientType === "Individual" && !formData.client.contactPerson)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Quote
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateQuoteModal;
