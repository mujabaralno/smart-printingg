"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle,
  Loader2,
  XCircle,
  MoreHorizontal,
  Pencil,
  Eye,
} from "lucide-react";
import Image from "next/image";

type QuoteRow = {
  id: string;
  quoteId: string;
  customerName: string;
  product?: string;
  createdDate: string;
  totalAmount: number;
  status: "Approved" | "Pending" | "Rejected" | string;
};

function StatusPill({ status }: { status: QuoteRow["status"] }) {
  if (status === "Approved") {
    return (
      <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 border-dashed rounded-full px-2.5 py-1 text-[11px] font-medium">
        <span className="inline-flex items-center gap-1.5">
          <CheckCircle className="h-3.5 w-3.5" />
          Approved
        </span>
      </Badge>
    );
  }
  if (status === "Pending") {
    return (
      <Badge className="bg-amber-50 text-amber-700 border border-amber-200 border-dashed rounded-full px-2.5 py-1 text-[11px] font-medium">
        <span className="inline-flex items-center gap-1.5">
          <Loader2 className="h-3.5 w-3.5 animate-spin-slow" />
          Pending
        </span>
      </Badge>
    );
  }
  if (status === "Rejected") {
    return (
      <Badge className="bg-rose-50 text-rose-700 border border-rose-200 border-dashed rounded-full px-2.5 py-1 text-[11px] font-medium">
        <span className="inline-flex items-center gap-1.5">
          <XCircle className="h-3.5 w-3.5" />
          Rejected
        </span>
      </Badge>
    );
  }
  return (
    <Badge className="bg-slate-100 text-slate-700 border rounded-full px-2.5 py-1 text-[11px] font-medium">
      {status}
    </Badge>
  );
}

/** Skeleton row—for consistent row height while loading */
function TableSkeletonRow() {
  return (
    <TableRow>
      <TableCell className="py-4">
        <Skeleton className="h-6 w-24 rounded-full" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-40" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-36" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-28" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-6 w-20 rounded-full" />
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="ml-auto h-8 w-8 rounded-md" />
      </TableCell>
    </TableRow>
  );
}

/** Table skeleton wrapper */
function TableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <TableBody>
      {Array.from({ length: rows }).map((_, i) => (
        <TableSkeletonRow key={i} />
      ))}
    </TableBody>
  );
}

export function QuotesTable({
  data,
  onView,
  onEdit,
  isLoading = false, // ⬅️ NEW
  defaultPageSize = 10,
  showPagination = true,
}: {
  data: QuoteRow[];
  onView: (row: QuoteRow) => void;
  onEdit: (row: QuoteRow) => void;
  isLoading?: boolean; // ⬅️ NEW
  defaultPageSize?: number;
  showPagination?: boolean;
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
    const newTotalPages = Math.max(1, Math.ceil(data.length / rowsPerPage));
    if (page > newTotalPages) setPage(1);
  }, [data, rowsPerPage, page]);

  const fmtMoney = (n: number) => (isNaN(n) ? "0.00" : (n || 0).toFixed(2));

  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-[#F8F8FF] py-5 px-0">
            <TableRow className="py-5">
              <TableHead className="w-40 text-slate-600 text-md p-4 font-semibold">
                Quote ID
              </TableHead>
              <TableHead className="w-64 text-slate-600 text-md p-4 font-semibold">
                Client Name
              </TableHead>
              <TableHead className="w-64 text-slate-600 text-md p-4 font-semibold">
                Product
              </TableHead>
              <TableHead className="w-32 text-slate-600 text-md p-4 font-semibold">
                Date
              </TableHead>
              <TableHead className="w-32 text-slate-600 text-md p-4 font-semibold">
                Amount
              </TableHead>
              <TableHead className="w-32 text-slate-600 text-md p-4 font-semibold">
                Status
              </TableHead>
              <TableHead className="w-10 text-right text-slate-600 p-4 text-md font-semibold">
                {" "}
              </TableHead>
            </TableRow>
          </TableHeader>

          {/* Loading */}
          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} />
          ) : pageData.length === 0 ? (
            <TableBody>
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-slate-500"
                >
                  <div className="w-full flex flex-col gap-7 justify-center items-center">
                    <Image
                      src="/empty.png"
                      alt="empty"
                      width={150}
                      height={150}
                    />
                    <p className="text-xl font-semibold ">
                      No Quote Found.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          ) : (
            <TableBody>
              {pageData.map((row) => (
                <TableRow key={row.id} className="hover:bg-slate-50">
                  <TableCell>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                      {row.quoteId}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium text-slate-900 truncate">
                    {row.customerName}
                  </TableCell>
                  <TableCell className="text-slate-700 truncate">
                    {row.product || "N/A"}
                  </TableCell>
                  <TableCell className="text-slate-700">
                    {row.createdDate}
                  </TableCell>
                  <TableCell className="text-slate-900 font-semibold">
                    AED {fmtMoney(row.totalAmount)}
                  </TableCell>
                  <TableCell>
                    <StatusPill status={row.status} />
                  </TableCell>
                  <TableCell className="text-right">
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
                          onSelect={(e) => {
                            e.preventDefault();
                            onEdit(row);
                          }}
                        >
                          <Pencil className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault();
                            onView(row);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" /> View
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          )}
        </Table>
      </div>

      {/* footer */}
      {showPagination && (
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
                disabled={isLoading || page === 1}
              >
                «
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={isLoading || page === 1}
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
                disabled={isLoading || page === totalPages}
              >
                ›
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(totalPages)}
                disabled={isLoading || page === totalPages}
              >
                »
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
