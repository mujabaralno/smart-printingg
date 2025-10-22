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

export type SalesRow = {
  id: string;
  salesPersonId?: string;   
  name: string;
  email?: string;
  phone?: string;
  designation?: string;      
  department?: string;
  status: "Active" | "Inactive";
  profilePicture?: string;
};

function StatusPill({ status }: { status: SalesRow["status"] }) {
  return (
    <Badge
      className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
        status === "Active"
          ? "bg-green-100 text-green-700 border border-dashed border-green-200"
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
      <TableCell>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </TableCell>
      <TableCell><Skeleton className="h-4 w-44" /></TableCell>
      <TableCell><Skeleton className="h-4 w-36" /></TableCell>
      <TableCell>
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-24" />
        </div>
      </TableCell>
      <TableCell><Skeleton className="h-6 w-20 rounded" /></TableCell>
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

// Format ID jadi SPxxx atau pakai value asli kalau sudah benar
function getDisplaySalesId(spId?: string, fallback?: string) {
  const base = spId || fallback || "";
  if (!base) return "SP000";
  if (base.startsWith("SP") || base.startsWith("SL") || base.startsWith("SALES")) return base;

  // kalau numeric → SP###
  const onlyNum = base.replace(/\D/g, "");
  if (onlyNum) return `SP${onlyNum.padStart(3, "0")}`;

  // quick hash → SP###
  let h = 0;
  for (let i = 0; i < base.length; i++) { h = (h << 5) - h + base.charCodeAt(i); h |= 0; }
  const n = Math.abs(h) % 999 + 1;
  return `SP${String(n).padStart(3, "0")}`;
}

export function SalesTable({
  data,
  onView,
  onEdit,
  isLoading = false,
  defaultPageSize = 20,
}: {
  data: SalesRow[];
  onView: (row: SalesRow) => void;
  onEdit: (row: SalesRow) => void;
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
    <div className="overflow-hidden  bg-white">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-[#F8F8FF]">
            <TableRow className="border-slate-200">
              <TableHead className="text-slate-700 font-semibold p-4  w-28">ID</TableHead>
              <TableHead className="text-slate-700 font-semibold p-4 w-[320px]">Sales Person</TableHead>
              <TableHead className="text-slate-700 font-semibold p-4 w-48">Email</TableHead>
              <TableHead className="text-slate-700 font-semibold  p-4 w-40">Phone</TableHead>
              <TableHead className="text-slate-700 font-semibold p-4 w-52">Department & Role</TableHead>
              <TableHead className="text-slate-700 font-semibold p-4 w-28">Status</TableHead>
              <TableHead className="text-slate-700 font-semibold p-4 w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} />
          ) : pageData.length === 0 ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={7} className="py-14 text-center text-slate-500">
                  No sales persons found.
                </TableCell>
              </TableRow>
            </TableBody>
          ) : (
            <TableBody>
              {pageData.map((sp) => {
                const displayId = getDisplaySalesId(sp.salesPersonId, sp.id);

                return (
                  <TableRow key={sp.id} className="hover:bg-slate-50 transition-colors">
                    {/* ID */}
                    <TableCell className="p-4">
                      <span className="font-mono text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded">
                        {displayId}
                      </span>
                    </TableCell>

                    {/* Sales Person (avatar + name + small designation) */}
                    <TableCell className="p-4">
                      <div className="flex items-center gap-3">
                        {sp.profilePicture ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={sp.profilePicture}
                            alt={sp.name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-[#27aae1]/20 text-[#27aae1] flex items-center justify-center font-semibold">
                            {sp.name?.charAt(0)?.toUpperCase() || "S"}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-medium text-slate-900 truncate">{sp.name}</div>
                          <div className="text-xs text-slate-500 truncate">{sp.designation || "—"}</div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Email */}
                    <TableCell className="p-4">
                      <div className="text-sm text-slate-900 truncate">{sp.email || "—"}</div>
                    </TableCell>

                    {/* Phone */}
                    <TableCell className="p-4">
                      <div className="text-sm text-slate-900">{sp.phone || "—"}</div>
                    </TableCell>

                    {/* Department & Role */}
                    <TableCell className="p-4">
                      <div className="space-y-1">
                        <div className="text-sm text-slate-900">{sp.department || "—"}</div>
                        <div className="text-xs text-slate-500">{sp.designation || "—"}</div>
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="p-4">
                      <StatusPill status={sp.status} />
                    </TableCell>

                    {/* Actions */}
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
                          <DropdownMenuItem
                            onSelect={(e) => { e.preventDefault(); onView(sp); }}
                          >
                            <Eye className="h-4 w-4 mr-2" /> View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={(e) => { e.preventDefault(); onEdit(sp); }}
                          >
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
