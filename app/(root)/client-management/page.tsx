"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Eye, Pencil, Calendar, DollarSign, Copy, ChevronDown, ChevronUp } from "lucide-react";
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
import { clients as CLIENTS, ClientRow } from "@/constants";

const PAGE_SIZE = 20;

type Mode = "add" | "edit";

export default function ClientManagementPage() {
  // data lokal (mulai dari dummy)
  const [rows, setRows] = React.useState<ClientRow[]>(CLIENTS);
  
  // ===== filter & paging =====
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "Active" | "Inactive">("all");
  const [page, setPage] = React.useState(1);
  const [showAll, setShowAll] = React.useState(false);

  // modal state
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<Mode>("add");
  const [draft, setDraft] = React.useState<ClientRow>({
    id: "",
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
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
        r.id.toLowerCase().includes(s);

      const hitStatus = statusFilter === "all" || r.status === statusFilter;

      return hitSearch && hitStatus;
    });
  }, [rows, search, statusFilter]);

  // pagination
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const current = showAll ? filtered : filtered.slice(start, start + PAGE_SIZE);
  
  React.useEffect(() => setPage(1), [search, statusFilter]); // reset page saat search berubah

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
      companyName: "",
      contactPerson: "",
      email: "",
      phone: "",
      status: "Active",
    });
    setOpen(true);
  };

  // open Edit
  const onEdit = (r: ClientRow) => {
    setMode("edit");
    setDraft({ ...r });
    setOpen(true);
  };

  // submit modal
  const onSubmit = () => {
    if (!draft.companyName || !draft.contactPerson || !draft.email) {
      // validasi minimal (simple)
      return alert("Please fill Company Name, Contact Person, and Email.");
    }
    if (mode === "add") {
      setRows((prev) => [{ ...draft }, ...prev]);
    } else {
      setRows((prev) =>
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
          Client Management
        </h1>
        <p className="text-lg text-slate-600">Manage your client relationships, contact information, and business partnerships for the Smart Printing System.</p>
      </div>
      
      {/* Main Content Card */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-10 space-y-8">
          {/* Search and Create Button */}
          <div className="flex items-center gap-6">
            <Input
              placeholder="Search by company name, contact person, email, or ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
            />

            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300" 
              onClick={onAdd}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Client
            </Button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-8 border border-slate-200 rounded-2xl bg-slate-50/50">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Search</label>
              <Input
                placeholder="Search by company, contact, or email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>Showing {current.length} of {filtered.length} clients</span>
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
                  <TableHead className="text-slate-700 font-semibold p-6">Client ID</TableHead>
                  <TableHead className="text-slate-700 font-semibold p-6">Company Name</TableHead>
                  <TableHead className="text-slate-700 font-semibold p-6">Contact Person</TableHead>
                  <TableHead className="text-slate-700 font-semibold p-6">Email</TableHead>
                  <TableHead className="text-slate-700 font-semibold p-6">Phone</TableHead>
                  <TableHead className="text-slate-700 font-semibold p-6">Status</TableHead>
                  <TableHead className="text-slate-700 font-semibold p-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {current.map((r) => (
                  <TableRow key={r.id} className="hover:bg-slate-50/80 transition-colors duration-200 border-slate-100">
                    <TableCell className="font-medium text-slate-900 p-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {r.id}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-700 p-6">{r.companyName}</TableCell>
                    <TableCell className="text-slate-700 p-6">{r.contactPerson}</TableCell>
                    <TableCell className="text-slate-700 p-6">{r.email}</TableCell>
                    <TableCell className="text-slate-700 p-6">{r.phone}</TableCell>
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
                      colSpan={7}
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
        <DialogContent className="sm:max-w-[520px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">
              {mode === "add" ? "Add New Client" : "Edit Client"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="companyName" className="text-sm font-medium text-slate-700">Company Name</Label>
                <Input
                  id="companyName"
                  placeholder="Enter company name"
                  value={draft.companyName}
                  onChange={(e) => setDraft({ ...draft, companyName: e.target.value })}
                  className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="contactPerson" className="text-sm font-medium text-slate-700">Contact Person</Label>
                <Input
                  id="contactPerson"
                  placeholder="Enter contact person name"
                  value={draft.contactPerson}
                  onChange={(e) => setDraft({ ...draft, contactPerson: e.target.value })}
                  className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={draft.email}
                  onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                  className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-sm font-medium text-slate-700">Phone</Label>
                <Input
                  id="phone"
                  placeholder="Enter phone number"
                  value={draft.phone}
                  onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
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
              {mode === "add" ? "Add Client" : "Update Client"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
