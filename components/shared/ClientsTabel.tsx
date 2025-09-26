"use client";

import * as React from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MoreHorizontal, Pencil, Eye } from "lucide-react";
import Link from "next/link";

export type ClientRow = {
  id: string;
  clientType: "Company" | "Individual";
  companyName?: string;
  firstName?: string;
  lastName?: string;
  contactPerson?: string;
  role?: string;
  email?: string;
  phone?: string;
  status: "Active" | "Inactive";
};

type QuoteLite = { id: string; clientId: string };

function StatusPill({ status }: { status: ClientRow["status"] }) {
  return (
    <Badge
      className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
        status === "Active"
          ? "bg-green-100 text-green-700 border border-dashed  border-green-200"
          : "bg-rose-100 text-rose-700 border border-dashed border-rose-200"
      }`}
    >
      {status}
    </Badge>
  );
}

function TableSkeletonRow() {
  return (
    <TableRow>
      <TableCell className="py-4"><Skeleton className="h-6 w-20 rounded" /></TableCell>
      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
      <TableCell><Skeleton className="h-4 w-36" /></TableCell>
      <TableCell><Skeleton className="h-4 w-44" /></TableCell>
      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
      <TableCell><Skeleton className="h-6 w-10 rounded" /></TableCell>
      <TableCell><Skeleton className="h-6 w-16 rounded" /></TableCell>
      <TableCell className="text-right"><Skeleton className="ml-auto h-8 w-8 rounded-md" /></TableCell>
    </TableRow>
  );
}

function TableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <TableBody>
      {Array.from({ length: rows }).map((_, i) => <TableSkeletonRow key={i} />)}
    </TableBody>
  );
}

function getDisplayId(id: string) {
  if (!id) return "CL000";
  if (id.startsWith("CL")) return id;
  const onlyNum = id.replace(/\D/g, "");
  if (onlyNum) return `CL${onlyNum.padStart(3, "0")}`;
  // quick hash for cuid-like
  let h = 0;
  for (let i = 0; i < id.length; i++) { h = (h << 5) - h + id.charCodeAt(i); h |= 0; }
  const n = Math.abs(h) % 999 + 1;
  return `CL${String(n).padStart(3, "0")}`;
}

export function ClientTable({
  data,
  quotes = [],
  onView,
  onEdit,
  isLoading = false,
  defaultPageSize = 20,
}: {
  data: ClientRow[];
  quotes?: QuoteLite[];
  onView: (row: ClientRow) => void;
  onEdit: (row: ClientRow) => void;
  isLoading?: boolean;
  defaultPageSize?: number;
}) {
  const [rowsPerPage, setRowsPerPage] = React.useState(defaultPageSize);
  const [page, setPage] = React.useState(1);

  const totalPages = Math.max(1, Math.ceil(data.length / rowsPerPage));
  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, data.length);
  const pageData = React.useMemo(
    () => data.slice(startIndex, endIndex),
    [data, startIndex, endIndex]
  );

  React.useEffect(() => {
    const newTotal = Math.max(1, Math.ceil(data.length / rowsPerPage));
    if (page > newTotal) setPage(1);
  }, [data, rowsPerPage, page]);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow className="border-slate-200">
              <TableHead className="text-slate-700 font-semibold p-4 w-28">Client ID</TableHead>
              <TableHead className="text-slate-700 font-semibold p-4 w-24">Type</TableHead>
              <TableHead className="text-slate-700 font-semibold p-4 w-40">Company / Name</TableHead>
              <TableHead className="text-slate-700 font-semibold p-4 w-36">Contact / Role</TableHead>
              <TableHead className="text-slate-700 font-semibold p-4 w-40">Email</TableHead>
              <TableHead className="text-slate-700 font-semibold p-4 w-32">Phone</TableHead>
              <TableHead className="text-slate-700 font-semibold p-4 w-24">Quotes</TableHead>
              <TableHead className="text-slate-700 font-semibold p-4 w-24">Status</TableHead>
              <TableHead className="text-slate-700 font-semibold p-4 w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} />
          ) : pageData.length === 0 ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={9} className="py-14 text-center text-slate-500">
                  No clients found.
                </TableCell>
              </TableRow>
            </TableBody>
          ) : (
            <TableBody>
              {pageData.map((c) => {
                const count = quotes.filter(q => q.clientId === c.id).length;
                const displayName =
                  c.clientType === "Company"
                    ? c.companyName
                    : [c.firstName, c.lastName].filter(Boolean).join(" ");
                const contact = c.clientType === "Company" ? (c.contactPerson || c.role) : c.role;

                return (
                  <TableRow key={c.id} className="hover:bg-slate-50 transition-colors">
                    <TableCell className="p-4">
                      <span className="font-mono text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded">
                        {getDisplayId(c.id)}
                      </span>
                    </TableCell>
                    <TableCell className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        c.clientType === "Company"
                          ? "bg-[#27aae1]/20 text-[#27aae1] border border-[#27aae1]/30"
                          : "bg-[#ea078b]/20 text-[#ea078b] border border-[#ea078b]/30"
                      }`}>
                        {c.clientType}
                      </span>
                    </TableCell>
                    <TableCell className="p-4">
                      <div className="font-medium text-slate-900">{displayName || "—"}</div>
                    </TableCell>
                    <TableCell className="p-4">
                      <div className="text-sm text-slate-900">{contact || "—"}</div>
                    </TableCell>
                    <TableCell className="p-4">
                      <div className="text-sm text-slate-900">{c.email || "—"}</div>
                    </TableCell>
                    <TableCell className="p-4">
                      <div className="text-sm text-slate-900">{c.phone || "—"}</div>
                    </TableCell>
                    <TableCell className="p-4">
                      {count > 0 ? (
                        <Link
                          href={`/quote-management?clientId=${c.id}`}
                          className="text-[#27aae1] font-semibold hover:text-[#1e8bc3]"
                        >
                          {count}
                        </Link>
                      ) : (
                        <span className="text-slate-400 font-semibold">{count}</span>
                      )}
                    </TableCell>
                    <TableCell className="p-4">
                      <StatusPill status={c.status} />
                    </TableCell>
                    <TableCell className="p-4 text-right">
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-40 bg-white"
                          onCloseAutoFocus={(e) => e.preventDefault()}
                        >
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onView(c); }}>
                            <Eye className="h-4 w-4 mr-2" /> View
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onEdit(c); }}>
                            <Pencil className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          )}
        </Table>
      </div>

      {/* Footer pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-200">
        <div className="text-xs sm:text-sm text-slate-600">
          {isLoading
            ? `Loading ${rowsPerPage} rows…`
            : data.length > 0
              ? `${startIndex + 1}–${endIndex} of ${data.length} rows`
              : "0 of 0 rows"}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Rows per page</span>
            <select
              value={rowsPerPage}
              disabled={isLoading}
              onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
              className="h-8 rounded-md border border-slate-300 bg-white px-2 text-sm disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#27aae1]/40"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={isLoading || page === 1}>«</Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={isLoading || page === 1}>‹</Button>
            <span className="text-xs sm:text-sm text-slate-600 px-2">
              Page <b>{page}</b> / {totalPages}
            </span>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={isLoading || page === totalPages}>›</Button>
            <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} disabled={isLoading || page === totalPages}>»</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
