"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Edit3, Search, UserCheckIcon } from "lucide-react";
import StatusChip from "@/components/shared/StatusChip";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toastSuccess, toastError } from "@/components/ui/Toast";
import { Skeleton } from "@/components/ui/skeleton";
import { SalesTable, type SalesRow } from "@/components/shared/SalesTable";

// Sales Person type definition
interface SalesPerson {
  id: string;
  salesPersonId: string;
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  designation: string;
  department: string;
  hireDate: string;
  status: "Active" | "Inactive";
  profilePicture?: string;
  address?: string;
  city: string;
  state: string;
  postalCode?: string;
  country: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function SalesPersonManagementPage() {
  const [salesPersons, setSalesPersons] = React.useState<SalesPerson[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | "Active" | "Inactive"
  >("all");
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [editingPerson, setEditingPerson] = React.useState<SalesPerson | null>(
    null
  );
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);

  // Load sales persons from database on page load
  React.useEffect(() => {
    const loadSalesPersons = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/sales-persons");
        if (response.ok) {
          const data = await response.json();
          console.log("Loaded sales persons:", data);
          setSalesPersons(data);
        } else {
          console.error("Failed to load sales persons");
          // Fallback to sample data if API fails
          const sampleData: SalesPerson[] = [
            {
              id: "1",
              salesPersonId: "SL-001",
              name: "John Doe",
              email: "john.doe@example.com",
              phone: "123456789",
              countryCode: "+971",
              designation: "Sales Representative",
              department: "Sales",
              hireDate: "2024-01-01",
              status: "Active" as const,
              city: "Dubai",
              state: "Dubai",
              country: "UAE",
              createdAt: "2024-01-01",
              updatedAt: "2024-01-01",
            },
          ];
          console.log("Using sample data:", sampleData);
          setSalesPersons(sampleData);
        }
      } catch (error) {
        console.error("Error loading sales persons:", error);
        // Fallback to sample data if API fails
        const sampleData: SalesPerson[] = [
          {
            id: "1",
            salesPersonId: "SL-001",
            name: "John Doe",
            email: "john.doe@example.com",
            phone: "123456789",
            countryCode: "+971",
            designation: "Sales Representative",
            department: "Sales",
            hireDate: "2024-01-01",
            status: "Active" as const,
            city: "Dubai",
            state: "Dubai",
            country: "UAE",
            createdAt: "2024-01-01",
            updatedAt: "2024-01-01",
          },
        ];
        console.log("Using sample data due to error:", sampleData);
        setSalesPersons(sampleData);
      } finally {
        setLoading(false);
      }
    };

    loadSalesPersons();
  }, []);

  // Filter sales persons based on search and status
  const filteredSalesPersons = React.useMemo(() => {
    console.log("🔍 Sales Person Search:", {
      search,
      totalPersons: salesPersons.length,
    });

    return salesPersons.filter((person) => {
      const searchTerm = search.toLowerCase().trim();

      const matchesSearch =
        search === "" ||
        (person.name && person.name.toLowerCase().includes(searchTerm)) ||
        (person.email && person.email.toLowerCase().includes(searchTerm)) ||
        (person.salesPersonId &&
          person.salesPersonId.toLowerCase().includes(searchTerm)) ||
        (person.phone && person.phone.toLowerCase().includes(searchTerm)) ||
        (person.designation &&
          person.designation.toLowerCase().includes(searchTerm)) ||
        (person.department &&
          person.department.toLowerCase().includes(searchTerm)) ||
        (person.city && person.city.toLowerCase().includes(searchTerm)) ||
        (person.state && person.state.toLowerCase().includes(searchTerm)) ||
        (person.country && person.country.toLowerCase().includes(searchTerm));

      const matchesStatus =
        statusFilter === "all" || person.status === statusFilter;

      if (search !== "" && !matchesSearch) {
        console.log("❌ Sales Person did not match search:", {
          name: person.name,
          search: searchTerm,
          email: person.email,
          phone: person.phone,
          designation: person.designation,
          department: person.department,
        });
      }

      return matchesSearch && matchesStatus;
    });
  }, [salesPersons, search, statusFilter]);

  // Add new sales person
  const handleAddSalesPerson = async (
    formData: Omit<
      SalesPerson,
      "id" | "salesPersonId" | "createdAt" | "updatedAt"
    >
  ) => {
    try {
      console.log("🔄 Adding new sales person with data:", formData);

      // Remove manual salesPersonId generation - now handled by backend
      const salesPersonData = {
        ...formData,
      };

      console.log("📤 Sending sales person data to API:", salesPersonData);

      const response = await fetch("/api/sales-persons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(salesPersonData),
      });

      console.log("📡 Response status:", response.status);

      if (response.ok) {
        const newPerson = await response.json();
        console.log("✅ Sales person created successfully:", newPerson);
        setSalesPersons((prev) => [...prev, newPerson]);
        setShowAddModal(false);

        // Show success feedback
        toastSuccess("Sales person added successfully!");
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error(
          "❌ Failed to add sales person:",
          response.status,
          errorData
        );
        toastError(
          `Failed to add sales person: ${response.status} - ${
            errorData.error || "Unknown error"
          }`
        );
      }
    } catch (error) {
      console.error("❌ Error adding sales person:", error);
      toastError(
        `Error adding sales person: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  // Update existing sales person
  const handleUpdateSalesPerson = async (
    id: string,
    formData: Partial<SalesPerson>
  ) => {
    try {
      console.log("🔄 Updating sales person with ID:", id, "Data:", formData);

      const response = await fetch(`/api/sales-persons/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      console.log("📡 Response status:", response.status);

      if (response.ok) {
        const updatedPerson = await response.json();
        console.log("✅ Sales person updated successfully:", updatedPerson);
        setSalesPersons((prev) =>
          prev.map((p) => (p.id === id ? updatedPerson : p))
        );
        setIsEditModalOpen(false);
        setEditingPerson(null);

        // Show success feedback
        toastSuccess("Sales person updated successfully!");
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error(
          "❌ Failed to update sales person:",
          response.status,
          errorData
        );
        toastError(
          `Failed to update sales person: ${response.status} - ${
            errorData.error || "Unknown error"
          }`
        );
      }
    } catch (error) {
      console.error("❌ Error updating sales person:", error);
      toastError(
        `Error updating sales person: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  // Delete sales person
  const handleDeleteSalesPerson = async (id: string) => {
    if (!confirm("Are you sure you want to delete this sales person?")) return;

    try {
      const response = await fetch(`/api/sales-persons/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSalesPersons((prev) => prev.filter((p) => p.id !== id));
      } else {
        console.error("Failed to delete sales person");
      }
    } catch (error) {
      console.error("Error deleting sales person:", error);
    }
  };

  const handleEditPerson = (person: SalesPerson) => {
    console.log(
      "🔄 Opening edit modal for sales person:",
      person.id,
      person.name
    );
    setEditingPerson(person);
    setIsEditModalOpen(true);
    console.log("✅ Edit modal state set to open");
  };

  return (
    <div className="min-h-screen  p-4 sm:p-6 lg:p-8">
      <style
        dangerouslySetInnerHTML={{
          __html: `
          /* Tablet Orientation-based Responsive Design */
          @media (min-width: 768px) and (max-width: 1024px) {
            /* Portrait mode - use EXACT mobile layout */
            @media (orientation: portrait) {
              .tablet-landscape\\:lg\\:hidden {
                display: block !important;
              }
              .tablet-landscape\\:lg\\:block {
                display: none !important;
              }
            }
            
            /* iPad Mini Portrait (768px × 1024px) - fix header overlap */
            @media (orientation: portrait) and (min-width: 768px) and (max-width: 768px) {
              .min-h-screen {
                padding-top: 3rem !important;
              }
            }
            
            /* iPad Air Portrait (820px × 1180px) - fix header overlap */
            @media (orientation: portrait) and (min-width: 820px) and (max-width: 820px) {
              .min-h-screen {
                padding-top: 3rem !important;
              }
            }
            
            /* iPad Mini Landscape (1024px × 768px) - use mobile layout */
            @media (orientation: landscape) and (min-width: 1024px) and (max-width: 1024px) {
              .tablet-landscape\\:lg\\:hidden {
                display: block !important;
              }
              .tablet-landscape\\:lg\\:block {
                display: none !important;
              }
            }
            
            /* iPad Air and larger tablets landscape - use desktop layout */
            @media (orientation: landscape) and (min-width: 1025px) {
              .tablet-landscape\\:lg\\:hidden {
                display: none !important;
              }
              .tablet-landscape\\:lg\\:block {
                display: block !important;
              }
            }
            
            /* General Tablet Landscape - horizontal scrollable table layout */
            @media (orientation: landscape) and (min-width: 1024px) and (max-width: 1366px) {
              /* Compact but readable table column widths */
              .w-32 { width: 80px !important; min-width: 80px !important; }
              .w-40 { width: 100px !important; min-width: 100px !important; }
              .w-48 { width: 120px !important; min-width: 120px !important; }
              .w-36 { width: 90px !important; min-width: 90px !important; }
              .w-28 { width: 70px !important; min-width: 70px !important; }
              .w-24 { width: 60px !important; min-width: 60px !important; }
              
              /* Compact table padding */
              .p-4 { padding: 0.5rem !important; }
              .px-4 { padding-left: 0.5rem !important; padding-right: 0.5rem !important; }
              .py-4 { padding-top: 0.5rem !important; padding-bottom: 0.5rem !important; }
              
              /* Readable text sizes */
              .text-sm { font-size: 0.75rem !important; }
              .text-base { font-size: 0.75rem !important; }
              .text-xs { font-size: 0.65rem !important; }
              
              /* Force horizontal scroll for table container */
              .overflow-x-auto { 
                overflow-x: auto !important; 
                overflow-y: visible !important;
                -webkit-overflow-scrolling: touch !important;
              }
              
              /* Table width and scroll behavior */
              table { 
                width: 100% !important; 
                min-width: 700px !important; 
                table-layout: fixed !important; 
              }
              
              /* Enhanced scroll indicators */
              .overflow-x-auto::-webkit-scrollbar {
                height: 8px !important;
              }
              .overflow-x-auto::-webkit-scrollbar-track {
                background: #f1f5f9 !important;
                border-radius: 4px !important;
              }
              .overflow-x-auto::-webkit-scrollbar-thumb {
                background: #cbd5e1 !important;
                border-radius: 4px !important;
                border: 1px solid #e2e8f0 !important;
              }
              .overflow-x-auto::-webkit-scrollbar-thumb:hover {
                background: #94a3b8 !important;
              }
              
              /* Ensure sticky action column works with scroll */
              .sticky.right-0 {
                position: sticky !important;
                right: 0 !important;
                z-index: 10 !important;
                background: white !important;
                box-shadow: -2px 0 4px rgba(0,0,0,0.1) !important;
              }
            }
            
            /* iPad Air Landscape (1180px × 820px) - horizontal scrollable table layout */
            @media (orientation: landscape) and (min-width: 1180px) and (max-width: 1180px) {
              /* Compact but readable table column widths */
              .w-32 { width: 80px !important; min-width: 80px !important; }
              .w-40 { width: 100px !important; min-width: 100px !important; }
              .w-48 { width: 120px !important; min-width: 120px !important; }
              .w-36 { width: 90px !important; min-width: 90px !important; }
              .w-28 { width: 70px !important; min-width: 70px !important; }
              .w-24 { width: 60px !important; min-width: 60px !important; }
              
              /* Compact table padding */
              .p-4 { padding: 0.5rem !important; }
              .px-4 { padding-left: 0.5rem !important; padding-right: 0.5rem !important; }
              .py-4 { padding-top: 0.5rem !important; padding-bottom: 0.5rem !important; }
              
              /* Readable text sizes */
              .text-sm { font-size: 0.75rem !important; }
              .text-base { font-size: 0.75rem !important; }
              .text-xs { font-size: 0.65rem !important; }
              
              /* Force horizontal scroll for table container */
              .overflow-x-auto { 
                overflow-x: auto !important; 
                overflow-y: visible !important;
                -webkit-overflow-scrolling: touch !important;
              }
              
              /* Table width and scroll behavior */
              table { 
                width: 100% !important; 
                min-width: 700px !important; 
                table-layout: fixed !important; 
              }
              
              /* Enhanced scroll indicators */
              .overflow-x-auto::-webkit-scrollbar {
                height: 8px !important;
              }
              .overflow-x-auto::-webkit-scrollbar-track {
                background: #f1f5f9 !important;
                border-radius: 4px !important;
              }
              .overflow-x-auto::-webkit-scrollbar-thumb {
                background: #cbd5e1 !important;
                border-radius: 4px !important;
                border: 1px solid #e2e8f0 !important;
              }
              .overflow-x-auto::-webkit-scrollbar-thumb:hover {
                background: #94a3b8 !important;
              }
              
              /* Ensure sticky action column works with scroll */
              .sticky.right-0 {
                position: sticky !important;
                right: 0 !important;
                z-index: 10 !important;
                background: white !important;
                box-shadow: -2px 0 4px rgba(0,0,0,0.1) !important;
              }
            }
          }
        `,
        }}
      />
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex gap-5">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#27aae1] rounded-full shadow-lg">
            <UserCheckIcon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Sales Person Management
            </h1>
            <p className="text-gray-600 mt-2">
              Manage your sales team. Add new sales persons, track performance,
              and maintain contact information.
            </p>
          </div>
        </div>

        {/* Sales Person Summary */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-3 h-3 bg-[#27aae1] rounded-full mx-auto mb-2"></div>
              <div className="text-sm text-slate-600">Total Sales Persons</div>
              {loading ? (
                <div className="flex justify-center">
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              ) : (
                <div className="text-lg font-bold text-slate-900">
                  {salesPersons.length}
                </div>
              )}
            </div>
            <div className="text-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
              <div className="text-sm text-slate-600">Active</div>
              <div className="text-lg font-bold text-slate-900">
                {loading ? (
                  <div className="flex justify-center">
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                ) : (
                  <div className="text-lg font-bold text-slate-900">
                    {salesPersons.filter((sp) => sp.status === "Active").length}
                  </div>
                )}
              </div>
            </div>
            <div className="text-center">
              <div className="w-3 h-3 bg-[#ea078b] rounded-full mx-auto mb-2"></div>
              <div className="text-sm text-slate-600">Managers</div>
              <div className="text-lg font-bold text-slate-900">
                {loading ? (
                  <div className="flex justify-center">
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                ) : (
                  <div className="text-lg font-bold text-slate-900">
                    {salesPersons.filter((sp) => sp.status === "Active").length}
                  </div>
                )}
              </div>
            </div>
            <div className="text-center">
              <div className="w-3 h-3 bg-orange-500 rounded-full mx-auto mb-2"></div>
              <div className="text-sm text-slate-600">Representatives</div>
              <div className="text-lg font-bold text-slate-900">
                {loading ? (
                  <div className="flex justify-center">
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                ) : (
                  <div className="text-lg font-bold text-slate-900">
                    {
                      salesPersons.filter((sp) =>
                        sp.designation.includes("Representative")
                      ).length
                    }
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sales Persons Table - Mobile Responsive */}
        <div className="shadow-sm rounded-2xl p-4 space-y-6 bg-white border border-slate-200">
          {/* Search, Status Filter, and Add Sales Person */}
          <div className="grid grid-cols-1 md:flex md:flex-row md:items-center  gap-4">
            {/* Search Bar - Full Width on Mobile */}
            <div className="w-full space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                <Input
                  placeholder="Search by name, email, ID, phone, or department..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-9 text-base"
                />
              </div>
            </div>

            {/* Status Filter and Add Button - Same Line on Mobile */}
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-end">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Status
                </label>
                {loading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <Select
                    value={statusFilter}
                    onValueChange={(value: "all" | "Active" | "Inactive") =>
                      setStatusFilter(value)
                    }
                  >
                    <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-12 w-full">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-[#27aae1] hover:bg-[#1e8bc3] text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 h-12 w-full sm:w-auto"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add New Sales Person
              </Button>
            </div>
          </div>
          <div className="p-0">
            {/* Desktop Table */}
            <SalesTable
              data={filteredSalesPersons as SalesRow[]}
              isLoading={loading}
              onView={(row) => handleEditPerson(row as any)} // atau bikin modal View sendiri
              onEdit={(row) => handleEditPerson(row as any)}
            />

            {/* Mobile Cards */}
            <div className="lg:hidden tablet-landscape:lg:hidden space-y-4 p-4">
              {loading ? (
                <div className="text-center py-16 text-slate-500">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#f89d1d]"></div>
                    <span>Loading sales persons...</span>
                  </div>
                </div>
              ) : filteredSalesPersons.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                  {salesPersons.length === 0
                    ? "No sales persons found."
                    : `No sales persons found matching "${search}".`}
                </div>
              ) : (
                filteredSalesPersons.map((person) => (
                  <Card
                    key={person.id}
                    className="p-4 border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="space-y-4">
                      {/* Header with Sales Person ID and Status */}
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm font-medium text-slate-900 bg-orange-100 text-orange-800 px-3 py-1.5 rounded-lg">
                          {person.salesPersonId}
                        </span>
                        <StatusChip value={person.status} />
                      </div>

                      {/* Sales Person Info */}
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          {person.profilePicture ? (
                            <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                              <img
                                src={person.profilePicture}
                                alt={`${person.name}'s profile`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-sm font-medium">
                                {person.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                              Sales Person
                            </div>
                            <div className="font-semibold text-slate-900 text-base">
                              {person.name}
                            </div>
                            <div className="text-sm text-slate-600">
                              {person.designation}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Contact Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                            Email
                          </div>
                          <div className="font-medium text-slate-900 text-sm break-all">
                            {person.email}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                            Phone
                          </div>
                          <div className="font-medium text-slate-900">
                            {person.phone}
                          </div>
                        </div>
                      </div>

                      {/* Department and Hire Date */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                            Department
                          </div>
                          <div className="font-medium text-slate-900">
                            {person.department}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                            Hire Date
                          </div>
                          <div className="font-medium text-slate-900">
                            {person.hireDate}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-center pt-4 border-t border-slate-100">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditPerson(person)}
                          className="w-full sm:w-auto text-[#f89d1d] border-[#f89d1d]/30 hover:bg-[#f89d1d]/10"
                        >
                          <Edit3 className="w-4 h-4 mr-2" />
                          Edit Sales Person
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Sales Person Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-2xl font-bold text-gray-800">
              <Plus className="w-8 h-8 mr-3 text-blue-600" />
              Add New Sales Person
            </DialogTitle>
          </DialogHeader>

          <AddSalesPersonForm
            onSubmit={handleAddSalesPerson}
            onCancel={() => setShowAddModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Sales Person Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-2xl font-bold text-gray-800">
              <Edit3 className="w-8 h-8 mr-3 text-blue-600" />
              Edit Sales Person
            </DialogTitle>
          </DialogHeader>

          {editingPerson && (
            <EditSalesPersonForm
              salesPerson={editingPerson}
              onSubmit={(formData) =>
                handleUpdateSalesPerson(editingPerson.id, formData)
              }
              onCancel={() => {
                setIsEditModalOpen(false);
                setEditingPerson(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Add Sales Person Form Component
function AddSalesPersonForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (
    data: Omit<SalesPerson, "id" | "salesPersonId" | "createdAt" | "updatedAt">
  ) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    phone: "",
    countryCode: "+971",
    designation: "Sales Representative",
    department: "Sales",
    hireDate: new Date().toISOString().split("T")[0],
    status: "Active" as "Active" | "Inactive",
    address: "",
    city: "Dubai",
    state: "Dubai",
    postalCode: "",
    country: "UAE",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Convert date to ISO string for database compatibility
    const submitData = {
      ...formData,
      hireDate: new Date(formData.hireDate).toISOString(),
    };

    console.log("📝 AddSalesPersonForm: Form submitted with data:", submitData);
    console.log("📝 AddSalesPersonForm: Form data type:", typeof submitData);
    console.log(
      "📝 AddSalesPersonForm: Form data keys:",
      Object.keys(submitData)
    );
    console.log("📝 AddSalesPersonForm: Required fields check:", {
      name: !!submitData.name,
      email: !!submitData.email,
      phone: !!submitData.phone,
    });
    console.log(
      "📝 AddSalesPersonForm: Hire date converted:",
      submitData.hireDate
    );

    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label
            htmlFor="name"
            className="text-sm font-medium text-gray-700 mb-2 block"
          >
            Full Name *
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Enter full name"
            required
          />
        </div>
        <div>
          <Label
            htmlFor="email"
            className="text-sm font-medium text-gray-700 mb-2 block"
          >
            Email *
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, email: e.target.value }))
            }
            placeholder="Enter email address"
            required
          />
        </div>
        <div>
          <Label
            htmlFor="phone"
            className="text-sm font-medium text-gray-700 mb-2 block"
          >
            Phone *
          </Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, phone: e.target.value }))
            }
            placeholder="Enter phone number"
            required
          />
        </div>
        <div>
          <Label
            htmlFor="countryCode"
            className="text-sm font-medium text-gray-700 mb-2 block"
          >
            Country Code
          </Label>
          <Input
            id="countryCode"
            value={formData.countryCode}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, countryCode: e.target.value }))
            }
            placeholder="+971"
          />
        </div>
        <div>
          <Label
            htmlFor="designation"
            className="text-sm font-medium text-gray-700 mb-2 block"
          >
            Designation
          </Label>
          <Input
            id="designation"
            value={formData.designation}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, designation: e.target.value }))
            }
            placeholder="e.g., Sales Representative"
          />
        </div>
        <div>
          <Label
            htmlFor="department"
            className="text-sm font-medium text-gray-700 mb-2 block"
          >
            Department
          </Label>
          <Input
            id="department"
            value={formData.department}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, department: e.target.value }))
            }
            placeholder="e.g., Sales"
          />
        </div>
        <div>
          <Label
            htmlFor="hireDate"
            className="text-sm font-medium text-gray-700 mb-2 block"
          >
            Hire Date
          </Label>
          <Input
            id="hireDate"
            type="date"
            value={formData.hireDate}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, hireDate: e.target.value }))
            }
          />
        </div>
        <div>
          <Label
            htmlFor="status"
            className="text-sm font-medium text-gray-700 mb-2 block"
          >
            Status
          </Label>
          <Select
            value={formData.status}
            onValueChange={(value: "Active" | "Inactive") => {
              console.log(
                "🔄 AddSalesPersonForm: Status changed from:",
                formData.status,
                "to:",
                value
              );
              setFormData((prev) => ({ ...prev, status: value }));
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label
            htmlFor="city"
            className="text-sm font-medium text-gray-700 mb-2 block"
          >
            City
          </Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, city: e.target.value }))
            }
            placeholder="Enter city"
          />
        </div>
        <div>
          <Label
            htmlFor="state"
            className="text-sm font-medium text-gray-700 mb-2 block"
          >
            State
          </Label>
          <Input
            id="state"
            value={formData.state}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, state: e.target.value }))
            }
            placeholder="Enter state"
          />
        </div>
        <div>
          <Label
            htmlFor="country"
            className="text-sm font-medium text-gray-700 mb-2 block"
          >
            Country
          </Label>
          <Input
            id="country"
            value={formData.country}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, country: e.target.value }))
            }
            placeholder="Enter country"
          />
        </div>
        <div>
          <Label
            htmlFor="postalCode"
            className="text-sm font-medium text-gray-700 mb-2 block"
          >
            Postal Code
          </Label>
          <Input
            id="postalCode"
            value={formData.postalCode}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, postalCode: e.target.value }))
            }
            placeholder="Enter postal code"
          />
        </div>
      </div>

      <div>
        <Label
          htmlFor="address"
          className="text-sm font-medium text-gray-700 mb-2 block"
        >
          Address
        </Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, address: e.target.value }))
          }
          placeholder="Enter full address"
        />
      </div>

      <div>
        <Label
          htmlFor="notes"
          className="text-sm font-medium text-gray-700 mb-2 block"
        >
          Notes
        </Label>
        <Input
          id="notes"
          value={formData.notes}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, notes: e.target.value }))
          }
          placeholder="Enter any additional notes"
        />
      </div>

      <DialogFooter className="pt-6">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-[#27aae1] hover:bg-[#1e8bc3]">
          Add Sales Person
        </Button>
      </DialogFooter>
    </form>
  );
}

// Edit Sales Person Form Component
function EditSalesPersonForm({
  salesPerson,
  onSubmit,
  onCancel,
}: {
  salesPerson: SalesPerson;
  onSubmit: (data: Partial<SalesPerson>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = React.useState({
    name: salesPerson.name,
    email: salesPerson.email,
    phone: salesPerson.phone,
    countryCode: salesPerson.countryCode,
    designation: salesPerson.designation,
    department: salesPerson.department,
    hireDate: salesPerson.hireDate.split("T")[0],
    status: salesPerson.status,
    address: salesPerson.address || "",
    city: salesPerson.city,
    state: salesPerson.state,
    postalCode: salesPerson.postalCode || "",
    country: salesPerson.country,
    notes: salesPerson.notes || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Convert date to ISO string for database compatibility
    const submitData = {
      ...formData,
      hireDate: new Date(formData.hireDate).toISOString(),
    };

    console.log(
      "📝 EditSalesPersonForm: Form submitted with data:",
      submitData
    );
    console.log("📝 EditSalesPersonForm: Form data type:", typeof submitData);
    console.log(
      "📝 EditSalesPersonForm: Form data keys:",
      Object.keys(submitData)
    );
    console.log("📝 EditSalesPersonForm: Status value:", submitData.status);
    console.log(
      "📝 EditSalesPersonForm: Hire date converted:",
      submitData.hireDate
    );

    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label
            htmlFor="edit-name"
            className="text-sm font-medium text-gray-700 mb-2 block"
          >
            Full Name *
          </Label>
          <Input
            id="edit-name"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Enter full name"
            required
          />
        </div>
        <div>
          <Label
            htmlFor="edit-email"
            className="text-sm font-medium text-gray-700 mb-2 block"
          >
            Email *
          </Label>
          <Input
            id="edit-email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, email: e.target.value }))
            }
            placeholder="Enter email address"
            required
          />
        </div>
        <div>
          <Label
            htmlFor="edit-phone"
            className="text-sm font-medium text-gray-700 mb-2 block"
          >
            Phone *
          </Label>
          <Input
            id="edit-phone"
            value={formData.phone}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, phone: e.target.value }))
            }
            placeholder="Enter phone number"
            required
          />
        </div>
        <div>
          <Label
            htmlFor="edit-countryCode"
            className="text-sm font-medium text-gray-700 mb-2 block"
          >
            Country Code
          </Label>
          <Input
            id="edit-countryCode"
            value={formData.countryCode}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, countryCode: e.target.value }))
            }
            placeholder="+971"
          />
        </div>
        <div>
          <Label
            htmlFor="edit-designation"
            className="text-sm font-medium text-gray-700 mb-2 block"
          >
            Designation
          </Label>
          <Input
            id="edit-designation"
            value={formData.designation}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, designation: e.target.value }))
            }
            placeholder="e.g., Sales Representative"
          />
        </div>
        <div>
          <Label
            htmlFor="edit-department"
            className="text-sm font-medium text-gray-700 mb-2 block"
          >
            Department
          </Label>
          <Input
            id="edit-department"
            value={formData.department}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, department: e.target.value }))
            }
            placeholder="e.g., Sales"
          />
        </div>
        <div>
          <Label
            htmlFor="edit-hireDate"
            className="text-sm font-medium text-gray-700 mb-2 block"
          >
            Hire Date
          </Label>
          <Input
            id="edit-hireDate"
            type="date"
            value={formData.hireDate}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, hireDate: e.target.value }))
            }
          />
        </div>
        <div>
          <Label
            htmlFor="edit-status"
            className="text-sm font-medium text-gray-700 mb-2 block"
          >
            Status
          </Label>
          <Select
            value={formData.status}
            onValueChange={(value: "Active" | "Inactive") => {
              console.log(
                "🔄 EditSalesPersonForm: Status changed from:",
                formData.status,
                "to:",
                value
              );
              setFormData((prev) => ({ ...prev, status: value }));
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label
            htmlFor="edit-city"
            className="text-sm font-medium text-gray-700 mb-2 block"
          >
            City
          </Label>
          <Input
            id="edit-city"
            value={formData.city}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, city: e.target.value }))
            }
            placeholder="Enter city"
          />
        </div>
        <div>
          <Label
            htmlFor="edit-state"
            className="text-sm font-medium text-gray-700 mb-2 block"
          >
            State
          </Label>
          <Input
            id="edit-state"
            value={formData.state}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, state: e.target.value }))
            }
            placeholder="Enter state"
          />
        </div>
        <div>
          <Label
            htmlFor="edit-country"
            className="text-sm font-medium text-gray-700 mb-2 block"
          >
            Country
          </Label>
          <Input
            id="edit-country"
            value={formData.country}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, country: e.target.value }))
            }
            placeholder="Enter country"
          />
        </div>
        <div>
          <Label
            htmlFor="edit-postalCode"
            className="text-sm font-medium text-gray-700 mb-2 block"
          >
            Postal Code
          </Label>
          <Input
            id="edit-postalCode"
            value={formData.postalCode}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, postalCode: e.target.value }))
            }
            placeholder="Enter postal code"
          />
        </div>
      </div>

      <div>
        <Label
          htmlFor="edit-address"
          className="text-sm font-medium text-gray-700 mb-2 block"
        >
          Address
        </Label>
        <Input
          id="edit-address"
          value={formData.address}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, address: e.target.value }))
          }
          placeholder="Enter full address"
        />
      </div>

      <div>
        <Label
          htmlFor="edit-notes"
          className="text-sm font-medium text-gray-700 mb-2 block"
        >
          Notes
        </Label>
        <Input
          id="edit-notes"
          value={formData.notes}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, notes: e.target.value }))
          }
          placeholder="Enter any additional notes"
        />
      </div>

      <DialogFooter className="pt-6">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-[#27aae1] hover:bg-[#1e8bc3]">
          Update Sales Person
        </Button>
      </DialogFooter>
    </form>
  );
}
