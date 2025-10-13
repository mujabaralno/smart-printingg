"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  Suspense,
} from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Pencil,
  PackageIcon,
  Calendar,
  Edit3Icon,
  Funnel,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// =====================================
// Types (keep original logic intact)
// =====================================
interface MaterialRow {
  id: string;
  materialId: string;
  name: string;
  gsm?: string;
  supplier: {
    id: string;
    name: string;
    contact?: string;
    email?: string;
    phone?: string;
  };
  cost: number;
  unit: string;
  lastUpdated: string;
  status: string;
}

interface SupplierRow {
  id: string;
  name: string;
  contact?: string;
  email?: string;
  phone?: string;
  countryCode?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  status: string;
  materials: MaterialRow[];
}

// =====================================
// Fallback data (unchanged)
// =====================================
const createFallbackData = () => {
  const suppliers: SupplierRow[] = [
    {
      id: "fallback-1",
      name: "Paper Source LLC",
      contact: "Contact Person",
      email: "papersourcellc@example.com",
      phone: "123456789",
      countryCode: "+971",
      country: "UAE",
      status: "Active",
      materials: [],
    },
    {
      id: "fallback-2",
      name: "Apex Papers",
      contact: "Contact Person",
      email: "apexpapers@example.com",
      phone: "123456789",
      countryCode: "+971",
      country: "UAE",
      status: "Active",
      materials: [],
    },
  ];

  const materials: MaterialRow[] = [
    {
      id: "fallback-m-1",
      materialId: "M-001",
      name: "Art Paper",
      gsm: "300",
      supplier: suppliers[0],
      cost: 0.5,
      unit: "per_sheet",
      lastUpdated: "2025-08-20",
      status: "Active",
    },
    {
      id: "fallback-m-2",
      materialId: "M-002",
      name: "Art Paper",
      gsm: "150",
      supplier: suppliers[0],
      cost: 0.18,
      unit: "per_sheet",
      lastUpdated: "2025-08-20",
      status: "Active",
    },
  ];

  suppliers[0].materials = materials;
  suppliers[1].materials = [];

  return { suppliers, materials };
};

// =====================================
// Utils (unchanged)
// =====================================
const currency = new Intl.NumberFormat("en-AE", {
  style: "currency",
  currency: "AED",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const fmtDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "2-digit",
      })
    : "—";

const unitLabel = (unit: string) => {
  switch (unit) {
    case "per_sheet":
      return "Per Sheet";
    case "per_packet":
      return "Per Packet";
    case "per_kg":
      return "Per KG";
    default:
      return unit;
  }
};

// =====================================
// Skeleton rows (match ClientTable style)
// =====================================
function TableSkeletonRow() {
  return (
    <TableRow>
      <TableCell className="py-4">
        <div className="h-6 w-24 rounded bg-slate-200 animate-pulse" />
      </TableCell>
      <TableCell>
        <div className="h-4 w-40 rounded bg-slate-200 animate-pulse" />
      </TableCell>
      <TableCell>
        <div className="h-6 w-14 rounded bg-slate-200 animate-pulse" />
      </TableCell>
      <TableCell>
        <div className="h-4 w-36 rounded bg-slate-200 animate-pulse" />
      </TableCell>
      <TableCell>
        <div className="h-4 w-24 rounded bg-slate-200 animate-pulse" />
      </TableCell>
      <TableCell>
        <div className="h-4 w-20 rounded bg-slate-200 animate-pulse" />
      </TableCell>
      <TableCell>
        <div className="h-4 w-28 rounded bg-slate-200 animate-pulse" />
      </TableCell>
      <TableCell>
        <div className="h-6 w-20 rounded bg-slate-200 animate-pulse" />
      </TableCell>
      <TableCell className="text-right">
        <div className="ml-auto h-8 w-8 rounded-md bg-slate-200 animate-pulse" />
      </TableCell>
    </TableRow>
  );
}

function TableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <TableBody>
      {Array.from({ length: rows }).map((_, i) => (
        <TableSkeletonRow key={i} />
      ))}
    </TableBody>
  );
}

// =====================================
// Main content (keeps original logic, adjusts TABLE + PAGINATION styling)
// =====================================
const DEFAULT_PAGE_SIZE = 10;

type Mode = "add" | "edit";

function SupplierManagementContent() {
  const searchParams = useSearchParams();
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [materials, setMaterials] = useState<MaterialRow[]>([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "Active" | "Inactive"
  >("all");
  const [unitFilter, setUnitFilter] = useState<"all" | string>("all");

  // highlight by URL param (unchanged)
  const [highlightedMaterialId, setHighlightedMaterialId] = useState<
    string | null
  >(null);
  const highlightedMaterialRef = useRef<HTMLTableRowElement>(null);

  // modal
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("add");
  const [draft, setDraft] = useState<Partial<MaterialRow>>({
    materialId: "",
    name: "",
    gsm: "",
    supplier: { id: "", name: "" },
    cost: 0,
    unit: "per_sheet",
    lastUpdated: new Date().toISOString().slice(0, 10),
    status: "Active",
  });

  // ===== pagination state MATCHING ClientTable =====
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_PAGE_SIZE);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const materialId = searchParams.get("materialId");
    if (materialId) {
      setHighlightedMaterialId(materialId);
      setTimeout(() => setHighlightedMaterialId(null), 5000);
      setTimeout(() => {
        if (highlightedMaterialRef.current) {
          highlightedMaterialRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }, 100);
    }
  }, [searchParams]);

  // Load data (unchanged logic)
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const suppliersResponse = await fetch("/api/suppliers");
        if (suppliersResponse.ok) {
          const suppliersData = await suppliersResponse.json();
          setSuppliers(suppliersData);
        } else {
          const { suppliers: fs, materials: fm } = createFallbackData();
          setSuppliers(fs);
          setMaterials(fm);
        }

        const materialsResponse = await fetch("/api/materials");
        if (materialsResponse.ok) {
          const materialsData = await materialsResponse.json();
          setMaterials(materialsData);
        } else {
          const { suppliers: fs, materials: fm } = createFallbackData();
          setSuppliers(fs);
          setMaterials(fm);
        }
      } catch (e) {
        const { suppliers: fs, materials: fm } = createFallbackData();
        setSuppliers(fs);
        setMaterials(fm);
        console.log(e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // filter (unchanged)
  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return materials.filter((r) => {
      const hitSearch =
        s === "" ||
        r.name.toLowerCase().includes(s) ||
        r.supplier.name.toLowerCase().includes(s) ||
        r.materialId.toLowerCase().includes(s);

      const hitStatus = statusFilter === "all" || r.status === statusFilter;
      const hitUnit = unitFilter === "all" || r.unit === unitFilter;
      const hitFrom = from === "" || r.lastUpdated >= from;
      const hitTo = to === "" || r.lastUpdated <= to;

      return hitSearch && hitStatus && hitUnit && hitFrom && hitTo;
    });
  }, [materials, search, from, to, statusFilter, unitFilter]);

  // keep page in range when data/rowsPerPage change
  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  useEffect(() => {
    const newTotal = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
    if (page > newTotal) setPage(1);
  }, [filtered.length, rowsPerPage, page]);

  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, filtered.length);
  const pageData = useMemo(
    () => filtered.slice(startIndex, endIndex),
    [filtered, startIndex, endIndex]
  );

  // helpers (unchanged)
  const newId = useCallback(() => {
    const n = materials.length + 1;
    return `M-${String(n).padStart(3, "0")}`;
  }, [materials.length]);

  const onAdd = () => {
    setMode("add");
    setDraft({
      materialId: newId(),
      name: "",
      supplier: { id: "", name: "" },
      cost: 0,
      unit: "per_sheet",
      lastUpdated: new Date().toISOString().slice(0, 10),
      status: "Active",
    });
    setOpen(true);
  };

  const onEdit = (material: MaterialRow) => {
    setMode("edit");
    setDraft({
      ...material,
      lastUpdated: new Date(material.lastUpdated).toISOString().slice(0, 10),
    });
    setOpen(true);
  };

  const onSubmit = async () => {
    if (!draft.name || !draft.supplier?.id || draft.cost === undefined) {
      alert("Please complete all required fields.");
      return;
    }

    try {
      const materialData = {
        materialId: draft.materialId!,
        name: draft.name!,
        gsm: draft.gsm || undefined,
        supplierId: draft.supplier.id,
        cost: Number(draft.cost),
        unit: draft.unit!,
        status: draft.status!,
      };

      let response;
      if (mode === "add") {
        response = await fetch("/api/materials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(materialData),
        });
      } else {
        response = await fetch(`/api/materials/${draft.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(materialData),
        });
      }

      if (response.ok) {
        const newMaterial = await response.json();
        if (mode === "add") {
          setMaterials((prev) => [...prev, newMaterial]);
        } else {
          setMaterials((prev) =>
            prev.map((m) => (m.id === draft.id ? newMaterial : m))
          );
        }
        setOpen(false);
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || "Failed to save material"}`);
      }
    } catch (error) {
      console.error("Error saving material:", error);
      alert("Error saving material");
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}

        <div className="flex gap-5">
          <div className="md:inline-flex hidden items-center justify-center w-16 h-16 bg-[#27aae1] rounded-full shadow-lg">
            <PackageIcon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Supplier Management
            </h1>
            <p className="text-gray-600 mt-2">
              Manage your suppliers and materials. Track costs, monitor
              inventory, and optimize your supply chain.
            </p>
          </div>
        </div>

        {/* Highlight banner (unchanged) */}
        {highlightedMaterialId && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-yellow-800">🔍</span>
              <span className="text-yellow-800 font-medium">
                Material found from search! The highlighted row will
                automatically scroll into view.
              </span>
              <button
                onClick={() => setHighlightedMaterialId(null)}
                className="ml-auto text-yellow-600 hover:text-yellow-800 text-sm underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <div className="flex w-full md:hidden">
          <div className="flex-1">
            <Input
              placeholder="Search by quote number, client name, or person name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-12 text-base"
            />
          </div>
        </div>

        {/* filter mobile */}
        <div className="w-full md:hidden flex justify-between items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-10  rounded-lg ">
                <Funnel className="h-4 w-4 mr-2" /> Filter
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="md:w-[28rem] w-[20rem] p-4"
            >
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Updated From
                </label>
                {loading ? (
                  <Skeleton className="h-8 w-80" />
                ) : (
                  <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-2">
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
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Status
                </label>
                {loading ? (
                  <Skeleton className="h-8 w-28" />
                ) : (
                  <Select
                    value={statusFilter}
                    onValueChange={(v: "all" | "Active" | "Inactive") =>
                      setStatusFilter(v)
                    }
                  >
                    <SelectTrigger className="w-full border-slate-300 focus:border-[#f89d1d] focus:ring-[#f89d1d] rounded-xl h-10">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Unit
                </label>
                {loading ? (
                  <Skeleton className="h-8 w-28" />
                ) : (
                  <Select
                    value={unitFilter}
                    onValueChange={(v: "all" | string) => setUnitFilter(v)}
                  >
                    <SelectTrigger className="w-full border-slate-300 focus:border-[#f89d1d] focus:ring-[#f89d1d] rounded-xl h-10">
                      <SelectValue placeholder="All Units" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <SelectItem value="all">All Units</SelectItem>
                      <SelectItem value="per_sheet">Per Sheet</SelectItem>
                      <SelectItem value="per_packet">Per Packet</SelectItem>
                      <SelectItem value="per_kg">Per KG</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </PopoverContent>
          </Popover>
          <div className="flex justify-end w-40">
            <Button
              onClick={onAdd}
              className="bg-[#27aae1] hover:bg-[#1e8bc3] text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 h-10 w-full sm:w-auto"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add New Material
            </Button>
          </div>
        </div>

        {/* ====== DESKTOP TABLE — Styled to match ClientTable ====== */}
        <div className="hidden lg:block overflow-hidden p-4 rounded-2xl border border-slate-200 shadow-sm space-y-6 bg-white">
          <div className="grid grid-cols-2 gap-5">
            {/* Filters */}
            <div className="grid grid-cols-1 md:flex md:flex-row md:items-center bg-white p-4  gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Updated From
                </label>
                {loading ? (
                  <Skeleton className="h-8 w-80" />
                ) : (
                  <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-2">
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
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Status
                </label>
                {loading ? (
                  <Skeleton className="h-8 w-28" />
                ) : (
                  <Select
                    value={statusFilter}
                    onValueChange={(v: "all" | "Active" | "Inactive") =>
                      setStatusFilter(v)
                    }
                  >
                    <SelectTrigger className="w-full border-slate-300 focus:border-[#f89d1d] focus:ring-[#f89d1d] rounded-xl h-10">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Unit
                </label>
                {loading ? (
                  <Skeleton className="h-8 w-28" />
                ) : (
                  <Select
                    value={unitFilter}
                    onValueChange={(v: "all" | string) => setUnitFilter(v)}
                  >
                    <SelectTrigger className="w-full border-slate-300 focus:border-[#f89d1d] focus:ring-[#f89d1d] rounded-xl h-10">
                      <SelectValue placeholder="All Units" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <SelectItem value="all">All Units</SelectItem>
                      <SelectItem value="per_sheet">Per Sheet</SelectItem>
                      <SelectItem value="per_packet">Per Packet</SelectItem>
                      <SelectItem value="per_kg">Per KG</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
            {/* Search + Add */}
            <div className="flex flex-col sm:flex-row gap-4 p-4 justify-end items-end">
              <div className="flex-1">
                <Input
                  placeholder="Search suppliers or materials..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full border-slate-300 focus:border-[#f89d1d] focus:ring-[#f89d1d] rounded-xl h-12 text-base"
                />
              </div>
              <Button
                onClick={onAdd}
                className="bg-[#27aae1] hover:bg-[#1e8bc3] text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 h-12 w-full sm:w-auto"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add New Material
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table
              className="w-full table-fixed"
              style={{
                tableLayout: "fixed",
                width: "100%",
                overflow: "hidden",
              }}
            >
              <TableHeader className="bg-[#F8F8FF]">
                <TableRow className="border-slate-200">
                  <TableHead className="text-slate-700 font-semibold p-4 w-24">
                    Material ID
                  </TableHead>
                  <TableHead className="text-slate-700 font-semibold p-4 w-40">
                    Material
                  </TableHead>
                  <TableHead className="text-slate-700 font-semibold p-4 w-20">
                    GSM
                  </TableHead>
                  <TableHead className="text-slate-700 font-semibold p-4 w-44">
                    Supplier
                  </TableHead>
                  <TableHead className="text-slate-700 font-semibold p-4 w-24">
                    Cost
                  </TableHead>
                  <TableHead className="text-slate-700 font-semibold p-4 w-28">
                    Unit
                  </TableHead>
                  <TableHead className="text-slate-700 font-semibold p-4 w-32 ">
                    Last Updated
                  </TableHead>
                  <TableHead className="text-slate-700 font-semibold p-4 w-24 ">
                    Status
                  </TableHead>
                  <TableHead className="text-slate-700 font-semibold p-4 w-24 text-center">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              {loading ? (
                <TableSkeleton rows={rowsPerPage} />
              ) : pageData.length === 0 ? (
                <TableBody>
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="py-14 text-center text-slate-500"
                    >
                      No materials found with current filters.
                    </TableCell>
                  </TableRow>
                </TableBody>
              ) : (
                <TableBody>
                  {pageData.map((r) => (
                    <TableRow
                      key={r.id}
                      ref={
                        highlightedMaterialId === r.id ||
                        highlightedMaterialId === r.materialId
                          ? highlightedMaterialRef
                          : null
                      }
                      className={`hover:bg-slate-50 transition-colors duration-200 border-slate-100 ${
                        highlightedMaterialId === r.id ||
                        highlightedMaterialId === r.materialId
                          ? "bg-yellow-50 border-yellow-200 shadow-md"
                          : ""
                      }`}
                    >
                      <TableCell className="p-4 w-24">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          {r.materialId}
                        </span>
                      </TableCell>
                      <TableCell className="p-4 w-40">
                        <div className="font-medium text-slate-900 truncate">
                          {r.name}
                        </div>
                      </TableCell>
                      <TableCell className="p-4 w-20">
                        {r.gsm ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#27aae1]/20 text-[#27aae1] border border-[#27aae1]/30 whitespace-nowrap">
                            {r.gsm} gsm
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="p-4 w-36">
                        <div className="text-sm text-slate-900 truncate">
                          {r.supplier.name}
                        </div>
                      </TableCell>
                      <TableCell className="p-4 w-24">
                        <div className="text-sm text-slate-900">
                          {currency.format(r.cost)}
                        </div>
                      </TableCell>
                      <TableCell className="p-4 w-20">
                        <div className="text-sm text-slate-900">
                          {unitLabel(r.unit)}
                        </div>
                      </TableCell>
                      <TableCell className="p-4 w-28">
                        <div className="text-sm text-slate-900">
                          {fmtDate(r.lastUpdated)}
                        </div>
                      </TableCell>
                      <TableCell className="p-4 w-24">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                            r.status === "Active"
                              ? "bg-green-100 text-green-700 border border-green-200"
                              : "bg-rose-100 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {r.status}
                        </span>
                      </TableCell>
                      <TableCell className="p-4 w-24 ">
                        <Button
                          title="Edit Material"
                          onClick={() => onEdit(r)}
                          className="border-blue-500 border text-blue-600 hover:bg-blue-50 hover:border-blue-600 rounded-xl px-2 py-1 "
                        >
                          <Edit3Icon className="h-4 w-4 mr-2" />
                          <span className="">Edit</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              )}
            </Table>
          </div>

          {/* ===== Footer Pagination (MATCH ClientTable) ===== */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-200">
            <div className="text-xs sm:text-sm text-slate-600">
              {loading
                ? `Loading ${rowsPerPage} rows…`
                : filtered.length > 0
                ? `${startIndex + 1}–${endIndex} of ${filtered.length} rows`
                : "0 of 0 rows"}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Rows per page</span>
                <select
                  value={rowsPerPage}
                  disabled={loading}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setPage(1);
                  }}
                  className="h-8 rounded-md border border-slate-300 bg-white px-2 text-sm disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#27aae1]/40"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(1)}
                  disabled={loading || page === 1}
                >
                  «
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={loading || page === 1}
                >
                  ‹
                </Button>
                <span className="text-xs sm:text-sm text-slate-600 px-2">
                  Page <b>{page}</b> / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={loading || page === totalPages}
                >
                  ›
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(totalPages)}
                  disabled={loading || page === totalPages}
                >
                  »
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ===== MOBILE CARDS (kept) ===== */}
        <div className="lg:hidden overflow-hidden p-4 rounded-2xl border border-slate-200 shadow-sm space-y-6 bg-white">
          {loading ? (
            <div className="text-center py-16 text-slate-500">
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span>Loading materials...</span>
              </div>
            </div>
          ) : pageData.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              No materials found with current filters.
            </div>
          ) : (
            pageData.map((r) => (
              <Card
                key={r.id}
                className="p-4 border-slate-200 bg-white shadow-sm"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-medium text-slate-900 bg-green-100  px-3 py-2 rounded-lg">
                      {r.materialId}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        r.status === "Active"
                          ? "bg-green-100 text-green-700 border-green-200"
                          : "bg-red-100 text-red-700 border-red-200"
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                      Material
                    </div>
                    <div className="font-semibold text-slate-900">{r.name}</div>
                    {r.gsm && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mt-2">
                        {r.gsm} gsm
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                        Supplier
                      </div>
                      <div className="font-medium text-slate-900">
                        {r.supplier.name}
                      </div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                        Cost
                      </div>
                      <div className="font-semibold text-slate-900">
                        {currency.format(r.cost)}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                        Unit
                      </div>
                      <div className="font-medium text-slate-900">
                        {unitLabel(r.unit)}
                      </div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                        Last Updated
                      </div>
                      <div className="font-medium text-slate-900">
                        {fmtDate(r.lastUpdated)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center pt-3 border-t border-slate-200">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(r)}
                      className="w-full text-green-600 border-green-200 hover:bg-green-50"
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit Material
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* ===== Modal Add/Edit Material (unchanged) ===== */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[520px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">
              {mode === "add" ? "Add New Material" : "Edit Material"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label
                  htmlFor="materialId"
                  className="text-sm font-medium text-slate-700"
                >
                  Material ID
                </Label>
                <Input
                  id="materialId"
                  placeholder="e.g. ART-001"
                  value={draft.materialId}
                  onChange={(e) =>
                    setDraft({ ...draft, materialId: e.target.value })
                  }
                  className="border-slate-300 focus:border-[#f89d1d] focus:ring-[#f89d1d] rounded-xl"
                  disabled={mode === "edit"}
                />
              </div>
              <div>
                <Label
                  htmlFor="name"
                  className="text-sm font-medium text-slate-700"
                >
                  Material Name
                </Label>
                <Input
                  id="name"
                  placeholder="e.g. Art Paper"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  className="border-slate-300 focus:border-[#f89d1d] focus:ring-[#f89d1d] rounded-xl"
                />
              </div>
              <div>
                <Label
                  htmlFor="gsm"
                  className="text-sm font-medium text-slate-700"
                >
                  GSM (Paper Weight)
                </Label>
                <Input
                  id="gsm"
                  placeholder="e.g. 300, 150, 80"
                  value={draft.gsm || ""}
                  onChange={(e) => setDraft({ ...draft, gsm: e.target.value })}
                  className="border-slate-300 focus:border-[#f89d1d] focus:ring-[#f89d1d] rounded-xl"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Leave empty for non-paper materials
                </p>
              </div>
              <div>
                <Label
                  htmlFor="supplier"
                  className="text-sm font-medium text-slate-700"
                >
                  Supplier
                </Label>
                <Select
                  value={draft.supplier?.id}
                  onValueChange={(v: string) => {
                    const selectedSupplier = suppliers.find((s) => s.id === v);
                    setDraft({
                      ...draft,
                      supplier: { id: v, name: selectedSupplier?.name || "" },
                    });
                  }}
                >
                  <SelectTrigger className="border-slate-300 focus:border-[#f89d1d] focus:ring-[#f89d1d] rounded-xl">
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label
                  htmlFor="cost"
                  className="text-sm font-medium text-slate-700"
                >
                  Cost
                </Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={draft.cost}
                  onChange={(e) =>
                    setDraft({ ...draft, cost: Number(e.target.value) })
                  }
                  className="border-slate-300 focus:border-[#f89d1d] focus:ring-[#f89d1d] rounded-xl"
                />
              </div>
              <div>
                <Label
                  htmlFor="unit"
                  className="text-sm font-medium text-slate-700"
                >
                  Unit
                </Label>
                <Select
                  value={draft.unit}
                  onValueChange={(v: string) => setDraft({ ...draft, unit: v })}
                >
                  <SelectTrigger className="border-slate-300 focus:border-[#f89d1d] focus:ring-[#f89d1d] rounded-xl">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_sheet">Per Sheet</SelectItem>
                    <SelectItem value="per_packet">Per Packet</SelectItem>
                    <SelectItem value="per_kg">Per KG</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label
                  htmlFor="lastUpdated"
                  className="text-sm font-medium text-slate-700"
                >
                  Last Updated
                </Label>
                <Input
                  id="lastUpdated"
                  type="date"
                  value={draft.lastUpdated}
                  onChange={(e) =>
                    setDraft({ ...draft, lastUpdated: e.target.value })
                  }
                  className="border-slate-300 focus:border-[#f89d1d] focus:ring-[#f89d1d] rounded-xl"
                />
              </div>
              <div>
                <Label
                  htmlFor="status"
                  className="text-sm font-medium text-slate-700"
                >
                  Status
                </Label>
                <Select
                  value={draft.status}
                  onValueChange={(v: "Active" | "Inactive") =>
                    setDraft({ ...draft, status: v })
                  }
                >
                  <SelectTrigger className="border-slate-300 focus:border-[#f89d1d] focus:ring-[#f89d1d] rounded-xl">
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
              className="bg-[#27aae1] hover:bg-[#1e8bc3] text-white px-6 py-2 rounded-xl"
            >
              {mode === "add" ? "Add Material" : "Update Material"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Main wrapper with Suspense (unchanged)
export default function SupplierManagementPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f89d1d] mx-auto"></div>
            <p className="text-slate-600">Loading supplier management...</p>
          </div>
        </div>
      }
    >
      <SupplierManagementContent />
    </Suspense>
  );
}
