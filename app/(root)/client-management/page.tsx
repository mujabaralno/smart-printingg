"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Eye, Pencil, Calendar, DollarSign, Copy, ChevronDown, ChevronUp, Search, User, Building, CheckCircle } from "lucide-react";
import { getQuotes } from "@/lib/dummy-data";
import Link from "next/link";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { clients as CLIENTS, ClientRow } from "@/constants";

const PAGE_SIZE = 20;

type Mode = "add" | "edit";

export default function ClientManagementPage() {
  // data lokal (mulai dari dummy)
  const [rows, setRows] = React.useState<ClientRow[]>([]);
  const [quotes, setQuotes] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  // Load clients from database on page load
  React.useEffect(() => {
    const loadClients = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/clients');
        if (response.ok) {
          const clientsData = await response.json();
          if (clientsData.length > 0) {
            // Transform database clients to match ClientRow format
            const transformedClients = clientsData.map((client: any, index: number) => ({
              id: client.id, // Keep database ID for operations
              displayId: `C-${String(index + 1).padStart(3, "0")}`, // Display ID for UI
              clientType: client.clientType as "Individual" | "Company",
              companyName: client.companyName || "",
              contactPerson: client.contactPerson,
              firstName: client.clientType === "Individual" ? client.contactPerson.split(" ")[0] || "" : "",
              lastName: client.clientType === "Individual" ? client.contactPerson.split(" ").slice(1).join(" ") || "" : "",
              email: client.email,
              phone: client.phone,
              countryCode: client.countryCode,
              role: client.role || "",
              addressLine1: "",
              addressLine2: "",
              city: "",
              state: "",
              postalCode: "",
              country: "",
              additionalInfo: "",
              status: "Active" as const,
              createdAt: client.createdAt,
              updatedAt: client.updatedAt,
            }));
            setRows(transformedClients);
            
            // Load quotes for these clients
            try {
              const quotesResponse = await fetch('/api/quotes');
              if (quotesResponse.ok) {
                const quotesData = await quotesResponse.json();
                setQuotes(quotesData);
              }
            } catch (error) {
              console.error('Error loading quotes:', error);
            }
          } else {
            // If no clients in database, use seed clients
            console.log('No clients in database, using seed clients');
            setRows(CLIENTS);
          }
        } else {
          console.error('Failed to load clients');
          // Fallback to dummy data if API fails
          setRows(CLIENTS);
        }
      } catch (error) {
        console.error('Error loading clients:', error);
        // Fallback to dummy data if API fails
        setRows(CLIENTS);
      } finally {
        setLoading(false);
      }
    };

    loadClients();
  }, []);
  
  // ===== filter & paging =====
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "Active" | "Inactive">("all");
  const [clientTypeFilter, setClientTypeFilter] = React.useState<"all" | "Individual" | "Company">("all");
  const [page, setPage] = React.useState(1);
  const [showAll, setShowAll] = React.useState(false);

  // modal state
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<Mode>("add");
  const [draft, setDraft] = React.useState<ClientRow>({
    id: "",
    clientType: "Company",
    companyName: "",
    contactPerson: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    countryCode: "+971",
    role: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    additionalInfo: "",
    status: "Active",
  });

  // filtering
  const filtered = React.useMemo(() => {
    const s = search.trim().toLowerCase();
    return rows.filter((r) => {
      const hitSearch =
        s === "" || 
        r.companyName.toLowerCase().includes(s) ||
        r.contactPerson.toLowerCase().includes(s) ||
        r.email.toLowerCase().includes(s) ||
        r.id.toLowerCase().includes(s) ||
        (r.firstName && r.firstName.toLowerCase().includes(s)) ||
        (r.lastName && r.lastName.toLowerCase().includes(s));

      const hitStatus = statusFilter === "all" || r.status === statusFilter;
      const hitClientType = clientTypeFilter === "all" || r.clientType === clientTypeFilter;

      return hitSearch && hitStatus && hitClientType;
    });
  }, [rows, search, statusFilter, clientTypeFilter]);

  // pagination
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const current = showAll ? filtered : filtered.slice(start, start + PAGE_SIZE);
  
  React.useEffect(() => setPage(1), [search, statusFilter, clientTypeFilter]); // reset page saat search berubah

  // helpers
  const newId = React.useCallback(() => {
    const n = rows.length + 1;
    return `C-${String(n).padStart(3, "0")}`;
  }, [rows.length]);

  // open Add
  const onAdd = () => {
    setMode("add");
    setDraft({
      id: newId(),
      clientType: "Company",
      companyName: "",
      contactPerson: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      countryCode: "+971",
      role: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
      additionalInfo: "",
      status: "Active",
    });
    setOpen(true);
  };

  // open Edit
  const onEdit = (r: ClientRow) => {
    setMode("edit");
    // Ensure all required fields are present
    setDraft({
      ...r,
      clientType: r.clientType || "Company",
      firstName: r.firstName || "",
      lastName: r.lastName || "",
      countryCode: r.countryCode || "+971",
      role: r.role || "",
      addressLine1: r.addressLine1 || "",
      addressLine2: r.addressLine2 || "",
      city: r.city || "",
      state: r.state || "",
      postalCode: r.postalCode || "",
      country: r.country || "",
      additionalInfo: r.additionalInfo || "",
    });
    setOpen(true);
  };

  // submit modal
  const onSubmit = async () => {
    // Validation based on client type
    if (draft.clientType === "Company") {
      if (!draft.companyName || !draft.contactPerson || !draft.email || !draft.role) {
        return alert("Please fill Company Name, Contact Person, Email, and Role for Company clients.");
      }
    } else {
      if (!draft.firstName || !draft.lastName || !draft.email) {
        return alert("Please fill First Name, Last Name, and Email for Individual clients.");
      }
    }

    try {
      if (mode === "add") {
        // Prepare client data for API
        const clientData = {
          clientType: draft.clientType,
          companyName: draft.clientType === "Company" ? draft.companyName : "",
          contactPerson: draft.contactPerson,
          email: draft.email,
          phone: draft.phone,
          countryCode: draft.countryCode,
          role: draft.role || "",
        };

        // Save to database
        const response = await fetch('/api/clients', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(clientData),
        });

        if (!response.ok) {
          throw new Error('Failed to create client');
        }

        const newClient = await response.json();
        
        // Add to local state for immediate UI update
        const newClientRow: ClientRow = {
          ...draft,
          id: newClient.id,
          displayId: newId(), // Use the formatted display ID
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setRows((prev) => [newClientRow, ...prev]);
      } else {
        // Update existing client - use the database ID, not the display ID
        const databaseId = draft.id; // This should be the database ID
        
        const response = await fetch(`/api/clients/${databaseId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clientType: draft.clientType,
            companyName: draft.companyName,
            contactPerson: draft.contactPerson,
            email: draft.email,
            phone: draft.phone,
            countryCode: draft.countryCode,
            role: draft.role,
            // Don't send displayId, createdAt, updatedAt to the API
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update client');
        }

        // Update local state
        setRows((prev) =>
          prev.map((r) => (r.id === databaseId ? { ...draft } : r))
        );
      }
      
      setOpen(false);
    } catch (error) {
      console.error('Error saving client:', error);
      alert('Error saving client. Please try again.');
    }
  };

  // Update contact person when firstName/lastName or companyName changes
  const updateContactPerson = (field: keyof ClientRow, value: string) => {
    const newDraft = { ...draft, [field]: value };
    
    if (field === 'firstName' || field === 'lastName') {
      newDraft.contactPerson = `${newDraft.firstName || ''} ${newDraft.lastName || ''}`.trim();
    } else if (field === 'companyName') {
      newDraft.contactPerson = value;
    }
    
    setDraft(newDraft);
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Client Management
        </h1>
        <p className="text-lg text-slate-600">Manage your client relationships, contact information, and business partnerships for the Smart Printing System.</p>
      </div>
      
      {/* Main Content Card */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-8 space-y-6">
          {/* Search and Create Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex flex-col gap-2 flex-1">
              <Label htmlFor="search-input" className="text-sm font-medium text-slate-700">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  id="search-input"
                  placeholder="Search by company name, contact person, email, or ID"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-10 w-full"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="client-type-filter" className="text-sm font-medium text-slate-700">Client Type</Label>
                <Select value={clientTypeFilter} onValueChange={(v: "all" | "Individual" | "Company") => setClientTypeFilter(v)}>
                  <SelectTrigger id="client-type-filter" className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-10 w-32">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Individual">Individual</SelectItem>
                    <SelectItem value="Company">Company</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="status-filter" className="text-sm font-medium text-slate-700">Status</Label>
                <Select value={statusFilter} onValueChange={(v: "all" | "Active" | "Inactive") => setStatusFilter(v)}>
                  <SelectTrigger id="status-filter" className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-10 w-32">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 h-10" 
                onClick={onAdd}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Client
              </Button>
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm text-slate-600">
            <span className="font-medium">Showing {current.length} of {filtered.length} clients</span>
            {filtered.length > PAGE_SIZE && (
              <Button
                variant="ghost"
                onClick={() => setShowAll(!showAll)}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-lg"
              >
                {showAll ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-2" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Show All ({filtered.length})
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Table */}
          <div className="overflow-hidden border border-slate-200 rounded-2xl">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="border-slate-200">
                  <TableHead className="text-slate-700 font-semibold p-4">Client ID</TableHead>
                  <TableHead className="text-slate-700 font-semibold p-4">Type</TableHead>
                  <TableHead className="text-slate-700 font-semibold p-4">Company Name</TableHead>
                  <TableHead className="text-slate-700 font-semibold p-4">Contact Person</TableHead>
                  <TableHead className="text-slate-700 font-semibold p-4">Email</TableHead>
                  <TableHead className="text-slate-700 font-semibold p-4">Phone</TableHead>
                  <TableHead className="text-slate-700 font-semibold p-4">Quotes</TableHead>
                  <TableHead className="text-slate-700 font-semibold p-4">Status</TableHead>
                  <TableHead className="text-slate-700 font-semibold p-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-16 text-slate-500">
                      Loading clients...
                    </TableCell>
                  </TableRow>
                ) : current.map((r) => (
                  <TableRow key={r.id} className="hover:bg-slate-50/80 transition-colors duration-200 border-slate-100">
                    <TableCell className="font-medium text-slate-900 p-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {r.displayId}
                      </span>
                    </TableCell>
                    <TableCell className="p-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        r.clientType === "Company" 
                          ? "bg-purple-100 text-purple-800" 
                          : "bg-green-100 text-green-800"
                      }`}>
                        {r.clientType === "Company" ? (
                          <>
                            <Building className="w-3 h-3 mr-1" />
                            Company
                          </>
                        ) : (
                          <>
                            <User className="w-3 h-3 mr-1" />
                            Individual
                          </>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-700 p-4 font-medium">
                      {r.clientType === "Company" ? r.companyName : "-"}
                    </TableCell>
                    <TableCell className="text-slate-700 p-4">{r.contactPerson}</TableCell>
                    <TableCell className="text-slate-700 p-4">
                      <a href={`mailto:${r.email}`} className="text-blue-600 hover:text-blue-700 hover:underline">
                        {r.email}
                      </a>
                    </TableCell>
                    <TableCell className="text-slate-700 p-4">
                      <a href={`tel:${r.countryCode}${r.phone}`} className="text-slate-600 hover:text-slate-800">
                        {r.countryCode} {r.phone}
                      </a>
                    </TableCell>
                    <TableCell className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {quotes.filter(q => q.clientId === r.id).length}
                        </span>
                        <Link 
                          href="/quote-management" 
                          className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          View Quotes
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell className="p-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        r.status === "Active" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      }`}>
                        {r.status}
                      </span>
                    </TableCell>
                    <TableCell className="p-4">
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => onEdit(r)}
                          className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          title="Edit client"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {current.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center py-16 text-slate-500"
                    >
                      {filtered.length === 0 ? "No clients found matching your filters." : "No clients to display."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ===== Modal Add/Edit Client ===== */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">
              {mode === "add" ? "Add New Client" : "Edit Client"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Client Type Selection */}
            <div className="space-y-4">
              <Label className="text-base font-semibold text-gray-700">Client Type</Label>
              <RadioGroup
                value={draft.clientType}
                onValueChange={(value) => {
                  if (value === "Individual") {
                    setDraft({ 
                      ...draft, 
                      clientType: value as "Individual", 
                      companyName: "", 
                      role: "" 
                    });
                  } else {
                    setDraft({ ...draft, clientType: value as "Company" });
                  }
                }}
                className="flex space-x-4"
              >
                <div className="relative">
                  <RadioGroupItem value="Individual" id="r-individual" className="sr-only" />
                  <Label 
                    htmlFor="r-individual" 
                    className={`inline-flex items-center px-6 py-3 rounded-xl font-medium cursor-pointer transition-all duration-200 hover:shadow-md ${
                      draft.clientType === "Individual"
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:shadow-xl"
                        : "bg-white border-2 border-gray-200 text-gray-600 hover:border-purple-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50"
                    }`}
                  >
                    <User className="w-4 h-4 mr-2" />
                    <span>Individual</span>
                    {draft.clientType === "Individual" && (
                      <CheckCircle className="w-4 h-4 ml-2" />
                    )}
                  </Label>
                </div>
                
                <div className="relative">
                  <RadioGroupItem value="Company" id="r-company" className="sr-only" />
                  <Label 
                    htmlFor="r-company" 
                    className={`inline-flex items-center px-6 py-3 rounded-xl font-medium cursor-pointer transition-all duration-200 hover:shadow-md ${
                      draft.clientType === "Company"
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:shadow-xl"
                        : "bg-white border-2 border-gray-200 text-gray-600 hover:border-purple-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50"
                    }`}
                  >
                    <Building className="w-4 h-4 mr-2" />
                    <span>Company</span>
                    {draft.clientType === "Company" && (
                      <CheckCircle className="w-4 h-4 ml-2" />
                    )}
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {/* Company Name and Role (Company only) */}
              {draft.clientType === "Company" && (
                <>
                  <div>
                    <Label htmlFor="companyName" className="text-sm font-medium text-slate-700">Company Name *</Label>
                    <Input
                      id="companyName"
                      placeholder="Enter company name"
                      value={draft.companyName}
                      onChange={(e) => updateContactPerson("companyName", e.target.value)}
                      className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="role" className="text-sm font-medium text-slate-700">Role/Designation *</Label>
                    <Input
                      id="role"
                      placeholder="Enter role or designation"
                      value={draft.role}
                      onChange={(e) => setDraft({ ...draft, role: e.target.value })}
                      className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                    />
                  </div>
                </>
              )}

              {/* First Name and Last Name (Individual only) */}
              {draft.clientType === "Individual" && (
                <>
                  <div>
                    <Label htmlFor="firstName" className="text-sm font-medium text-slate-700">First Name *</Label>
                    <Input
                      id="firstName"
                      placeholder="Enter first name"
                      value={draft.firstName}
                      onChange={(e) => updateContactPerson("firstName", e.target.value)}
                      className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-sm font-medium text-slate-700">Last Name *</Label>
                    <Input
                      id="lastName"
                      placeholder="Enter last name"
                      value={draft.lastName}
                      onChange={(e) => updateContactPerson("lastName", e.target.value)}
                      className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                    />
                  </div>
                </>
              )}

              {/* Contact Person (auto-generated) */}
              <div>
                <Label htmlFor="contactPerson" className="text-sm font-medium text-slate-700">Contact Person *</Label>
                <Input
                  id="contactPerson"
                  placeholder="Contact person name"
                  value={draft.contactPerson}
                  onChange={(e) => setDraft({ ...draft, contactPerson: e.target.value })}
                  className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                />
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={draft.email}
                  onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                  className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                />
              </div>

              {/* Phone with Country Code */}
              <div>
                <Label htmlFor="phone" className="text-sm font-medium text-slate-700">Phone *</Label>
                <div className="flex space-x-2">
                  <Select
                    value={draft.countryCode}
                    onValueChange={(value) => setDraft({ ...draft, countryCode: value })}
                  >
                    <SelectTrigger className="w-32 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
                      <SelectValue placeholder="Code" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="+971">+971</SelectItem>
                      <SelectItem value="+62">+62</SelectItem>
                      <SelectItem value="+1">+1</SelectItem>
                      <SelectItem value="+44">+44</SelectItem>
                      <SelectItem value="+49">+49</SelectItem>
                      <SelectItem value="+31">+31</SelectItem>
                      <SelectItem value="+65">+65</SelectItem>
                      <SelectItem value="+60">+60</SelectItem>
                      <SelectItem value="+852">+852</SelectItem>
                      <SelectItem value="+34">+34</SelectItem>
                      <SelectItem value="+82">+82</SelectItem>
                      <SelectItem value="+33">+33</SelectItem>
                      <SelectItem value="+46">+46</SelectItem>
                      <SelectItem value="+358">+358</SelectItem>
                      <SelectItem value="+61">+61</SelectItem>
                      <SelectItem value="+32">+32</SelectItem>
                      <SelectItem value="+81">+81</SelectItem>
                      <SelectItem value="+353">+353</SelectItem>
                      <SelectItem value="+39">+39</SelectItem>
                      <SelectItem value="+41">+41</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    id="phone"
                    placeholder="Enter phone number"
                    value={draft.phone}
                    onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                    className="flex-1 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <Label htmlFor="status" className="text-sm font-medium text-slate-700">Status</Label>
                <Select value={draft.status} onValueChange={(v: "Active" | "Inactive") => setDraft({ ...draft, status: v })}>
                  <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="ghost" 
              onClick={() => setOpen(false)}
              className="border-slate-300 hover:border-slate-400 hover:bg-slate-50 px-6 py-2 rounded-xl"
            >
              Cancel
            </Button>
            <Button 
              onClick={onSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl"
            >
              {mode === "add" ? "Add Client" : "Update Client"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
