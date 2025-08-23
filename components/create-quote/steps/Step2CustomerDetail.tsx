"use client";

import type { FC, Dispatch, SetStateAction } from "react";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CheckCircle, Building, User } from "lucide-react";
import { useState, useEffect } from "react";
import type { QuoteFormData } from "@/types";

interface Step2Props {
  formData: QuoteFormData;
  setFormData: Dispatch<SetStateAction<QuoteFormData>>;
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
    address: "Sheikh Zayed Road, Office 1205, Business Bay",
    city: "Dubai",
    state: "Dubai",
    postalCode: "00000",
    country: "Dubai",
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
    address: "Marina Walk, Tower 3, Level 15",
    city: "Dubai",
    state: "Dubai",
    postalCode: "00000",
    country: "Dubai",
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
    address: "Al Wasl Road, Villa 25",
    city: "Dubai",
    state: "Dubai",
    postalCode: "00000",
    country: "Dubai",
    additionalInfo: "Individual client, small quantity orders"
  }
];

const Step2CustomerDetail: FC<Step2Props> = ({ formData, setFormData }) => {
  const client = formData.client;
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(true);

  const setClient = (patch: Partial<typeof client>) => {
    console.log('Step2CustomerDetail: Updating client with patch:', patch);
    console.log('Step2CustomerDetail: Current client before update:', client);
    
    setFormData((prev) => {
      const updatedClient = { 
        ...prev.client, 
        ...patch 
      };
      
      // Auto-update contactPerson when firstName or lastName changes
      if (patch.firstName || patch.lastName) {
        const firstName = patch.firstName || prev.client.firstName || '';
        const lastName = patch.lastName || prev.client.lastName || '';
        if (firstName || lastName) {
          updatedClient.contactPerson = `${firstName} ${lastName}`.trim();
        }
      }
      
      const updatedFormData = { 
        ...prev, 
        client: updatedClient
      };
      
      console.log('Step2CustomerDetail: Updated form data sent to parent:', updatedFormData);
      console.log('Step2CustomerDetail: Updated client data:', updatedClient);
      return updatedFormData;
    });
  };

  // Auto-fill functionality
  const handleCompanyNameChange = (value: string) => {
    setClient({ companyName: value });
    setSearchTerm(value);
    
    if (value.length > 0) {
      setShowSuggestions(true);
      const existingCustomer = EXISTING_CUSTOMERS.find(
        customer => customer.companyName.toLowerCase().includes(value.toLowerCase())
      );
      
      if (existingCustomer && value.toLowerCase() === existingCustomer.companyName.toLowerCase()) {
        autoFillCustomerData(existingCustomer);
        setIsNewCustomer(false);
      } else {
        setIsNewCustomer(true);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const handlePersonNameChange = (field: "firstName" | "lastName", value: string) => {
    setClient({ [field]: value });
    
    const currentFirstName = field === "firstName" ? value : (client.firstName || "");
    const currentLastName = field === "lastName" ? value : (client.lastName || "");
    
    if (currentFirstName && currentLastName) {
      const existingCustomer = EXISTING_CUSTOMERS.find(
        customer => 
          customer.firstName.toLowerCase() === currentFirstName.toLowerCase() &&
          customer.lastName.toLowerCase() === currentLastName.toLowerCase()
      );
      
      if (existingCustomer) {
        autoFillCustomerData(existingCustomer);
        setIsNewCustomer(false);
      } else {
        setIsNewCustomer(true);
      }
    }
  };

  const autoFillCustomerData = (customer: typeof EXISTING_CUSTOMERS[0]) => {
    setClient({
      clientType: customer.clientType,
      companyName: customer.companyName,
      firstName: customer.firstName,
      lastName: customer.lastName,
      contactPerson: customer.contactPerson || `${customer.firstName} ${customer.lastName}`.trim(),
      email: customer.email,
      phone: customer.phone,
      countryCode: customer.countryCode,
      role: customer.role,
      address: customer.address,
      city: customer.city,
      state: customer.state,
      postalCode: customer.postalCode,
      country: customer.country,
      additionalInfo: customer.additionalInfo,
    });
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (customer: typeof EXISTING_CUSTOMERS[0]) => {
    autoFillCustomerData(customer);
    setIsNewCustomer(false);
  };

  const filteredSuggestions = EXISTING_CUSTOMERS.filter(customer =>
    customer.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const saveNewCustomer = () => {
    if (isNewCustomer && client.firstName && client.lastName && client.email) {
      const newCustomer = {
        id: `CUST${String(EXISTING_CUSTOMERS.length + 1).padStart(3, '0')}`,
        clientType: client.clientType,
        companyName: client.companyName || "",
        contactPerson: client.contactPerson || `${client.firstName} ${client.lastName}`.trim(),
        email: client.email,
        phone: client.phone || "",
        countryCode: client.countryCode || "+971",
        role: client.role || "",
        address: client.address || "",
        city: client.city || "",
        state: client.state || "",
        postalCode: client.postalCode || "",
        country: client.country || "",
        additionalInfo: client.additionalInfo || "",
      };
      
      console.log("Saving new customer to database:", newCustomer);
    }
  };

  // Only save when form is valid and it's a new customer
  useEffect(() => {
    if (validateForm() && isNewCustomer) {
      saveNewCustomer();
    }
  }, [isNewCustomer]); // Remove client dependency to prevent infinite loop

  const validateForm = () => {
    // Essential required fields for all client types
    const essentialRequired = [
      client.firstName,
      client.lastName,
      client.email,
      client.phone
    ];

    // Additional required fields for company clients
    const companyRequired = client.clientType === "Company" ? [
      client.companyName
    ] : [];

    const allRequired = [...essentialRequired, ...companyRequired];
    return allRequired.every(field => field && field.trim() !== "");
  };

  const isFormValid = validateForm();

  // Initialize form with default values if not set
  useEffect(() => {
    console.log('Step2CustomerDetail: Initializing form with defaults');
    console.log('Step2CustomerDetail: Current client state:', client);
    
    if (!client.countryCode) {
      setClient({ countryCode: "+971" });
    }
    if (!client.country) {
      setClient({ country: "Dubai" });
    }
    
    // Ensure firstName and lastName are initialized if not set
    if (!client.firstName) {
      setClient({ firstName: "" });
    }
    if (!client.lastName) {
      setClient({ lastName: "" });
    }
    
    console.log('Step2CustomerDetail: Form initialized with defaults');
  }, []); // Only run once on mount

  return (
    <div className="space-y-8">
      <h3 className="font-bold text-2xl">Customer Detail</h3>

      {/* Customer Status Indicator */}
      {!isNewCustomer && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <p className="text-green-700 font-medium">
              Existing customer data loaded automatically
            </p>
          </div>
        </div>
      )}

      {/* Client Type - Compact Modern Button Style */}
      <div className="space-y-4">
        <Label className="text-base font-semibold text-gray-700">Client Type</Label>
        <RadioGroup
          value={client.clientType}
          onValueChange={(value) => {
            if (value === "Individual") {
              setClient({ 
                clientType: value as "Individual", 
                companyName: "", 
                role: "" 
              });
            } else {
              setClient({ clientType: value as "Company" });
            }
          }}
          className="flex space-x-4"
        >
          <div className="relative">
            <RadioGroupItem value="Individual" id="r-individual" className="sr-only" />
            <Label 
              htmlFor="r-individual" 
              className={`inline-flex items-center px-6 py-3 rounded-xl font-medium cursor-pointer transition-all duration-200 hover:shadow-md ${
                client.clientType === "Individual"
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:shadow-xl"
                  : "bg-white border-2 border-gray-200 text-gray-600 hover:border-purple-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50"
              }`}
            >
              <User className="w-4 h-4 mr-2" />
              <span>Individual</span>
              {client.clientType === "Individual" && (
                <CheckCircle className="w-4 h-4 ml-2" />
              )}
            </Label>
          </div>
          
          <div className="relative">
            <RadioGroupItem value="Company" id="r-company" className="sr-only" />
            <Label 
              htmlFor="r-company" 
              className={`inline-flex items-center px-6 py-3 rounded-xl font-medium cursor-pointer transition-all duration-200 hover:shadow-md ${
                client.clientType === "Company"
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:shadow-xl"
                  : "bg-white border-2 border-gray-200 text-gray-600 hover:border-purple-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50"
              }`}
            >
              <Building className="w-4 h-4 mr-2" />
              <span>Company</span>
              {client.clientType === "Company" && (
                <CheckCircle className="w-4 h-4 ml-2" />
              )}
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-6">
        {/* Company and Designation (Company only) */}
        {client.clientType === "Company" && (
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="relative">
              <Label htmlFor="companyName" className="mb-2 block">
                Company: <span className="text-red-500">*</span>
              </Label>
              <Input
                id="companyName"
                value={client.companyName || ""}
                onChange={(e) => handleCompanyNameChange(e.target.value)}
                placeholder="Company"
                className={`inputForm ${
                  !client.companyName?.trim()
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : ""
                }`}
              />
              
              {/* Auto-complete suggestions */}
              {showSuggestions && searchTerm && filteredSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredSuggestions.map((customer) => (
                    <div
                      key={customer.id}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      onClick={() => handleSuggestionClick(customer)}
                    >
                      <div className="font-medium text-gray-900">{customer.companyName || `${customer.firstName} ${customer.lastName}`}</div>
                      <div className="text-sm text-gray-500">{customer.email}</div>
                    </div>
                  ))}
                </div>
              )}
              
              {!client.companyName?.trim() && (
                <p className="text-red-500 text-sm mt-1">Company name is required</p>
              )}
            </div>

            <div>
              <Label htmlFor="designation" className="mb-2 block">
                Designation: <span className="text-red-500">*</span>
              </Label>
              <Input
                id="designation"
                value={client.role || ""}
                onChange={(e) => setClient({ role: e.target.value })}
                placeholder="Designation"
                className={`inputForm ${
                  !client.role?.trim()
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : ""
                }`}
              />
              {!client.role?.trim() && (
                <p className="text-red-500 text-sm mt-1">Designation is required</p>
              )}
            </div>
          </div>
        )}

        {/* First Name and Last Name */}
        <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
          <div>
            <Label htmlFor="firstName" className="mb-2 block">
              First Name: <span className="text-red-500">*</span>
            </Label>
            <Input
              id="firstName"
              value={client.firstName || ""}
              onChange={(e) => handlePersonNameChange("firstName", e.target.value)}
              placeholder="First Name"
              className={`inputForm ${
                !client.firstName?.trim()
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                  : ""
              }`}
            />
            {!client.firstName?.trim() && (
              <p className="text-red-500 text-sm mt-1">First name is required</p>
            )}
          </div>

          <div>
            <Label htmlFor="lastName" className="mb-2 block">
              Last Name: <span className="text-red-500">*</span>
            </Label>
            <Input
              id="lastName"
              value={client.lastName || ""}
              onChange={(e) => handlePersonNameChange("lastName", e.target.value)}
              placeholder="Last Name"
              className={`inputForm ${
                !client.lastName?.trim()
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                  : ""
              }`}
            />
            {!client.lastName?.trim() && (
              <p className="text-red-500 text-sm mt-1">Last name is required</p>
            )}
          </div>
        </div>

        {/* Contact Person (Auto-generated) */}
        <div className="grid md:grid-cols-1 gap-y-6">
          <div>
            <Label htmlFor="contactPerson" className="mb-2 block">
              Contact Person:
            </Label>
            <Input
              id="contactPerson"
              value={client.contactPerson || ""}
              onChange={(e) => setClient({ contactPerson: e.target.value })}
              placeholder="Contact Person (auto-generated from first and last name)"
              className="inputForm bg-gray-50"
              readOnly
            />
            <p className="text-sm text-gray-500 mt-1">
              Auto-generated from first and last name
            </p>
          </div>
        </div>

        {/* Email and Phone */}
        <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
          <div>
            <Label htmlFor="email" className="mb-2 block">
              Email: <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={client.email || ""}
              onChange={(e) => setClient({ email: e.target.value })}
              placeholder="Email"
              className={`inputForm ${
                !client.email?.trim()
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                  : ""
              }`}
            />
            {!client.email?.trim() && (
              <p className="text-red-500 text-sm mt-1">Email is required</p>
            )}
          </div>

          <div>
            <Label htmlFor="phoneWithCountry" className="mb-2 block">
              Phone (with Country): <span className="text-red-500">*</span>
            </Label>
            <div className="flex space-x-2">
              <Select
                value={client.countryCode || "+971"}
                onValueChange={(value) => setClient({ countryCode: value })}
              >
                <SelectTrigger className={`w-32 py-5 border border-gray-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                  !client.countryCode
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : ""
                }`}>
                  <SelectValue placeholder="Code" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="+971">+971</SelectItem>
                  <SelectItem value="+62">+62</SelectItem>
                  <SelectItem value="+1">+1</SelectItem>
                </SelectContent>
              </Select>
              <Input
                id="phone"
                inputMode="tel"
                value={client.phone || ""}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^\d]/g, "");
                  setClient({ phone: v });
                }}
                placeholder="Phone Number"
                className={`inputForm flex-1 ${
                  !client.phone?.trim()
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : ""
                }`}
              />
            </div>
            {(!client.countryCode || !client.phone?.trim()) && (
              <p className="text-red-500 text-sm mt-1">Country code and phone number are required</p>
            )}
          </div>
        </div>

        {/* Address Information */}
        <div className="grid md:grid-cols-1 gap-y-6">
          <div>
            <Label htmlFor="address" className="mb-2 block">
              Address: <span className="text-red-500">*</span>
            </Label>
            <Input
              id="address"
              value={client.address || ""}
              onChange={(e) => setClient({ address: e.target.value })}
              placeholder="Street Address, Building, Suite, etc."
              className={`inputForm ${
                !client.address?.trim()
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                  : ""
              }`}
            />
            {!client.address?.trim() && (
              <p className="text-red-500 text-sm mt-1">Address is required</p>
            )}
          </div>
        </div>

        {/* City and State */}
        <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
          <div>
            <Label htmlFor="city" className="mb-2 block">
              City: <span className="text-red-500">*</span>
            </Label>
            <Input
              id="city"
              value={client.city || ""}
              onChange={(e) => setClient({ city: e.target.value })}
              placeholder="City"
              className={`inputForm ${
                !client.city?.trim()
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                  : ""
              }`}
            />
            {!client.city?.trim() && (
              <p className="text-red-500 text-sm mt-1">City is required</p>
            )}
          </div>

          <div>
            <Label htmlFor="state" className="mb-2 block">
              State/Province: <span className="text-red-500">*</span>
            </Label>
            <Input
              id="state"
              value={client.state || ""}
              onChange={(e) => setClient({ state: e.target.value })}
              placeholder="State or Province"
              className={`inputForm ${
                !client.state?.trim()
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                  : ""
              }`}
            />
            {!client.state?.trim() && (
              <p className="text-red-500 text-sm mt-1">State/Province is required</p>
            )}
          </div>
        </div>

        {/* Postal Code and Country */}
        <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
          <div>
            <Label htmlFor="postalCode" className="mb-2 block">
              Postal Code: <span className="text-red-500">*</span>
            </Label>
            <Input
              id="postalCode"
              value={client.postalCode || ""}
              onChange={(e) => setClient({ postalCode: e.target.value })}
              placeholder="Postal/ZIP Code"
              className={`inputForm ${
                !client.postalCode?.trim()
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                  : ""
              }`}
            />
            {!client.postalCode?.trim() && (
              <p className="text-red-500 text-sm mt-1">Postal Code is required</p>
            )}
          </div>

          <div>
            <Label htmlFor="country" className="mb-2 block">
              Country: <span className="text-red-500">*</span>
            </Label>
            <Select
              value={client.country || "Dubai"}
              onValueChange={(value) => setClient({ country: value })}
            >
              <SelectTrigger className={`py-5 border rounded-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                !client.country?.trim()
                  ? "border-red-300"
                  : "border-gray-200"
              }`}>
                <SelectValue placeholder="Select Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Dubai">Dubai</SelectItem>
                <SelectItem value="India">India</SelectItem>
                <SelectItem value="Indonesia">Indonesia</SelectItem>
              </SelectContent>
            </Select>
            {!client.country?.trim() && (
              <p className="text-red-500 text-sm mt-1">Country is required</p>
            )}
          </div>
        </div>

        {/* Additional Information */}
        <div className="grid md:grid-cols-1 gap-y-6">
          <div>
            <Label htmlFor="additionalInfo" className="mb-2 block">
              Additional Information:
            </Label>
            <textarea
              id="additionalInfo"
              value={client.additionalInfo || ""}
              onChange={(e) => setClient({ additionalInfo: e.target.value })}
              placeholder="Any additional notes, special requirements, or comments..."
              className="w-full px-3 py-2 border border-gray-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors min-h-[80px] resize-y"
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Validation Summary */}
      {!isFormValid && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
            <div className="text-red-700">
              <p className="font-medium mb-2">Please fill in the essential fields to proceed:</p>
              <ul className="text-sm space-y-1">
                {!client.firstName?.trim() && <li>• First Name</li>}
                {!client.lastName?.trim() && <li>• Last Name</li>}
                {!client.email?.trim() && <li>• Email</li>}
                {!client.phone?.trim() && <li>• Phone Number</li>}
                {client.clientType === "Company" && !client.companyName?.trim() && <li>• Company Name</li>}
              </ul>
              <p className="text-xs text-red-600 mt-2">
                Address fields are optional but recommended for complete customer information.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Form Complete Indicator */}
      {isFormValid && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">✓</span>
            </div>
            <p className="text-green-700 font-medium">
              Essential customer information is complete. You can now proceed to the next step.
            </p>
          </div>
        </div>
      )}

      {/* New Customer Indicator */}
      {isNewCustomer && client.firstName && client.lastName && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">+</span>
            </div>
            <p className="text-blue-700 font-medium">
              New customer will be added to database
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step2CustomerDetail;