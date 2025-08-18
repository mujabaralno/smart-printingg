"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, ChevronDown, ChevronUp } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { materials as SUPPLIERS, MaterialRow, CostUnit, unitLabel } from "@/constants";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});
const fmtDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "2-digit",
      })
    : "—";

const PAGE_SIZE = 20;
type Mode = "add" | "edit";

export default function SupplierManagementPage() {
  const [suppliers, setSuppliers] = useState<MaterialRow[]>(SUPPLIERS);
  
  // ===== filter & paging =====
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "Active" | "Inactive">("all");
  const [unitFilter, setUnitFilter] = useState<"all" | CostUnit>("all");
  const [page, setPage] = useState(1);
  const [showAll, setShowAll] = useState(false);

  // modal
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("add");
  const [draft, setDraft] = useState<MaterialRow>({
    id: "",
    material: "",
    supplier: "",
    cost: 0,
    unit: "per_sheet",
    lastUpdated: new Date().toISOString().slice(0, 10),
    status: "Active",
  });

  // filter
  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return suppliers.filter((r) => {
      const hitSearch =
        s === "" || 
        r.material.toLowerCase().includes(s) ||
        r.supplier.toLowerCase().includes(s) ||
        r.id.toLowerCase().includes(s);

      const hitStatus = statusFilter === "all" || r.status === statusFilter;
      const hitUnit = unitFilter === "all" || r.unit === unitFilter;

      const hitFrom = from === "" || r.lastUpdated >= from;
      const hitTo = to === "" || r.lastUpdated <= to;

      return hitSearch && hitStatus && hitUnit && hitFrom && hitTo;
    });
  }, [suppliers, search, from, to, statusFilter, unitFilter]);

  // pagination
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  useEffect(() => setPage(1), [search, from, to, statusFilter, unitFilter]);
  const start = (page - 1) * PAGE_SIZE;
  const current = showAll ? filtered : filtered.slice(start, start + PAGE_SIZE);

  // helpers
  const newId = useCallback(() => {
    const n = suppliers.length + 1;
    return `M-${String(n).padStart(3, "0")}`;
  }, [suppliers.length]);

  const onAdd = () => {
    setMode("add");
    setDraft({
      id: newId(),
      material: "",
      supplier: "",
      cost: 0,
      unit: "per_sheet",
      lastUpdated: new Date().toISOString().slice(0, 10),
      status: "Active",
    });
    setOpen(true);
  };

  const onEdit = (r: MaterialRow) => {
    setMode("edit");
    setDraft({ ...r });
    setOpen(true);
  };

  const onSubmit = () => {
    if (!draft.material || !draft.supplier || draft.cost <= 0) {
      return alert("Please fill Material, Supplier, and Cost (must be > 0).");
    }
    if (mode === "add") {
      setSuppliers((prev) => [{ ...draft }, ...prev]);
    } else {
      setSuppliers((prev) =>
        prev.map((r) => (r.id === draft.id ? { ...draft } : r))
      );
    }
    setOpen(false);
  };



  return (
    <div className="space-y-12">
      {/* Welcome Header */}
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Supplier Management
        </h1>
        <p className="text-lg text-slate-600">Manage your material suppliers, costs, and inventory. Track pricing updates and maintain supplier relationships for the Smart Printing System.</p>
      </div>
      
      {/* Main Content Card */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-10 space-y-8">
          {/* Search and Create Button */}
          <div className="flex items-center gap-6">
            <Input
              placeholder="Search by material name, supplier, or ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
            />

            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300" 
              onClick={onAdd}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Material
            </Button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-8 border border-slate-200 rounded-2xl bg-slate-50/50">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Updated From</label>
              <Input 
                type="date" 
                value={from} 
                onChange={(e) => setFrom(e.target.value)}
                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Updated To</label>
              <Input 
                type="date" 
                value={to} 
                onChange={(e) => setTo(e.target.value)}
                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Status</label>
              <Select value={statusFilter} onValueChange={(v: "all" | "Active" | "Inactive") => setStatusFilter(v)}>
                <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Unit</label>
              <Select value={unitFilter} onValueChange={(v: "all" | CostUnit) => setUnitFilter(v)}>
                <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
                  <SelectValue placeholder="All Units" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Units</SelectItem>
                  <SelectItem value="per_sheet">Per Sheet</SelectItem>
                  <SelectItem value="per_packet">Per Packet</SelectItem>
                  <SelectItem value="per_kg">Per KG</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>Showing {current.length} of {filtered.length} materials</span>
            {filtered.length > PAGE_SIZE && (
              <Button
                variant="ghost"
                onClick={() => setShowAll(!showAll)}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
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
                  <TableHead className="text-slate-700 font-semibold p-6">Material ID</TableHead>
                  <TableHead className="text-slate-700 font-semibold p-6">Material</TableHead>
                  <TableHead className="text-slate-700 font-semibold p-6">Supplier</TableHead>
                  <TableHead className="text-slate-700 font-semibold p-6">Cost</TableHead>
                  <TableHead className="text-slate-700 font-semibold p-6">Unit</TableHead>
                  <TableHead className="text-slate-700 font-semibold p-6">Last Updated</TableHead>
                  <TableHead className="text-slate-700 font-semibold p-6">Status</TableHead>
                  <TableHead className="text-slate-700 font-semibold p-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {current.map((r) => (
                  <TableRow key={r.id} className="hover:bg-slate-50/80 transition-colors duration-200 border-slate-100">
                    <TableCell className="font-medium text-slate-900 p-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        {r.id}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-700 p-6">{r.material}</TableCell>
                    <TableCell className="text-slate-700 p-6">{r.supplier}</TableCell>
                    <TableCell className="text-slate-700 p-6">{currency.format(r.cost)}</TableCell>
                    <TableCell className="text-slate-700 p-6">{unitLabel(r.unit)}</TableCell>
                    <TableCell className="text-slate-700 p-6">{fmtDate(r.lastUpdated)}</TableCell>
                    <TableCell className="p-6">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        r.status === "Active" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      }`}>
                        {r.status}
                      </span>
                    </TableCell>
                    <TableCell className="p-6">
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => onEdit(r)}
                          className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
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
                      colSpan={8}
                      className="text-center py-16 text-slate-500"
                    >
                      {filtered.length === 0 ? "No materials found matching your filters." : "No materials to display."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-2 pb-6">
            <Button
              variant="ghost"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="w-10 h-10 rounded-xl hover:bg-slate-100"
            >
              ‹
            </Button>

            {Array.from({ length: Math.min(pageCount, 5) }).map((_, i) => {
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
        </CardContent>
      </Card>

      {/* ===== Modal Add/Edit Material ===== */}
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
                <Label htmlFor="material" className="text-sm font-medium text-slate-700">Material</Label>
                <Input
                  id="material"
                  placeholder="e.g. Art Paper 300gsm"
                  value={draft.material}
                  onChange={(e) => setDraft({ ...draft, material: e.target.value })}
                  className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="supplier" className="text-sm font-medium text-slate-700">Supplier</Label>
                <Input
                  id="supplier"
                  placeholder="e.g. Paper Source LLC"
                  value={draft.supplier}
                  onChange={(e) => setDraft({ ...draft, supplier: e.target.value })}
                  className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="cost" className="text-sm font-medium text-slate-700">Cost</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={draft.cost}
                  onChange={(e) => setDraft({ ...draft, cost: Number(e.target.value) })}
                  className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="unit" className="text-sm font-medium text-slate-700">Unit</Label>
                <Select value={draft.unit} onValueChange={(v: CostUnit) => setDraft({ ...draft, unit: v })}>
                  <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
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
                <Label htmlFor="lastUpdated" className="text-sm font-medium text-slate-700">Last Updated</Label>
                <Input
                  id="lastUpdated"
                  type="date"
                  value={draft.lastUpdated}
                  onChange={(e) => setDraft({ ...draft, lastUpdated: e.target.value })}
                  className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                />
              </div>
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
              {mode === "add" ? "Add Material" : "Update Material"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
