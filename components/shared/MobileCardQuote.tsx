"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Pencil, Download } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// ===== Types =====
export type QuoteRow = {
  id: string;
  quoteId: string;
  customerName: string;
  contactPerson?: string;
  product?: string;
  productName?: string;
  quantity?: number;
  createdDate: string; // ISO or yyyy-mm-dd
  totalAmount: number;
  status: "Approved" | "Pending" | "Rejected" | string;
};

// ===== Utils =====
function fmtMoney(n: number) {
  if (isNaN(n)) return "0.00";
  return (n || 0).toFixed(2);
}

function formatDate(input: string) {
  const d = new Date(input);
  if (isNaN(d.getTime())) return input;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

// ===== Status Pill =====
export function StatusPill({ status }: { status: QuoteRow["status"] }) {
  if (status === "Approved") {
    return (
      <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 border-dashed rounded-full px-3 py-1 text-[11px] font-medium">
        Approved
      </Badge>
    );
  }
  if (status === "Pending") {
    return (
      <Badge className="bg-amber-50 text-amber-700 border border-amber-200 border-dashed rounded-full px-3 py-1 text-[11px] font-medium">
        Pending
      </Badge>
    );
  }
  if (status === "Rejected") {
    return (
      <Badge className="bg-rose-50 text-rose-700 border border-rose-200 border-dashed rounded-full px-3 py-1 text-[11px] font-medium">
        Rejected
      </Badge>
    );
  }
  return (
    <Badge className="bg-slate-100 text-slate-700 border rounded-full px-3 py-1 text-[11px] font-medium">
      {status}
    </Badge>
  );
}

// ===== Skeletons =====
function MobileCardSkeleton() {
  return (
    <Card className="p-4 border-slate-200">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-24 rounded" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-4 w-24" />
          <div className="space-y-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        </div>
      </div>
    </Card>
  );
}

function MobileCardsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-3 xs:space-y-4 p-3 xs:p-4">
      {Array.from({ length: count }).map((_, i) => (
        <MobileCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ===== Component =====
export default function QuotesMobileCards({
  data,
  onView,
  onEdit,
  isLoading = false,
  defaultPageSize = 10,
  showPagination = true,
  className,
  downloadingKey,
  onDownloadCustomer,
  onDownloadOperations,
}: {
  data: QuoteRow[];
  onView: (row: QuoteRow) => void;
  onEdit: (row: QuoteRow) => void;
  isLoading?: boolean;
  defaultPageSize?: number;
  showPagination?: boolean;
  className?: string;
  downloadingKey?: string;
  onDownloadCustomer?: (row: QuoteRow) => void;
  onDownloadOperations?: (row: QuoteRow) => void;
}) {
  const [itemsPerPage, setItemsPerPage] = React.useState(defaultPageSize);
  const [currentPage, setCurrentPage] = React.useState(1);

  const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, data.length);

  React.useEffect(() => {
    const nextTotal = Math.max(1, Math.ceil(data.length / itemsPerPage));
    if (currentPage > nextTotal) setCurrentPage(1);
  }, [data, itemsPerPage, currentPage]);

  const pageData = React.useMemo(
    () => data.slice(startIndex, endIndex),
    [data, startIndex, endIndex]
  );

  return (
    <div className={cn("lg:hidden space-y-3 xs:space-y-4", className)}>
      {isLoading ? (
        <MobileCardsSkeleton count={itemsPerPage} />
      ) : pageData.length === 0 ? (
        <div className="text-center py-16 text-slate-500">No quotes found.</div>
      ) : (
        <div className="space-y-3 xs:space-y-4 p-3 xs:p-4">
          {pageData.map((quote) => (
            <Card
              key={`${quote.id}-${quote.status}`}
              className="p-4 border-slate-200"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-medium text-slate-900 bg-slate-100 px-2 py-1 rounded">
                    {quote.quoteId}
                  </span>
                  <StatusPill status={quote.status} />
                </div>

                <div className="space-y-1">
                  <div className="font-medium text-slate-900">
                    {quote.customerName}
                  </div>
                  <div className="text-sm text-slate-500">
                    {quote.contactPerson || "N/A"}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-slate-500">Product:</span>
                    <div className="text-sm text-slate-700">
                      {quote.productName || quote.product || "N/A"}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-slate-500">Quantity:</span>
                    <div className="text-sm text-slate-700">
                      {quote.quantity || 0}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-slate-500">Date:</span>
                    <div className="text-sm text-slate-700">
                      {formatDate(quote.createdDate)}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-slate-500">Amount:</span>
                    <div className="font-semibold text-slate-900">
                      AED {fmtMoney(quote.totalAmount)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 pt-3 border-t border-slate-100">
                  <div className="flex gap-2 w-full">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onView(quote)}
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(quote)}
                      className="text-green-600 border-green-200 hover:bg-green-50"
                    >
                      <Pencil className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                  {quote.status === "Approved" && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-purple-600 border-purple-200 hover:bg-purple-50"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          PDF
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 bg-white">
                        <DropdownMenuItem
                          onClick={() => onDownloadCustomer?.(quote)}
                          disabled={downloadingKey === `${quote.id}-customer`}
                          className="text-green-700 hover:text-green-800 hover:bg-green-50"
                        >
                          {downloadingKey === `${quote.id}-customer` ? (
                            <>
                              <div className="h-3 w-3 mr-2 border-2 border-green-700 border-t-transparent rounded-full animate-spin" />
                              Downloading...
                            </>
                          ) : (
                            <>
                              <Download className="h-3 w-3 mr-2" />
                              Customer PDF
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDownloadOperations?.(quote)}
                          disabled={downloadingKey === `${quote.id}-operations`}
                          className="text-orange-700 hover:text-orange-800 hover:bg-orange-50"
                        >
                          {downloadingKey === `${quote.id}-operations` ? (
                            <>
                              <div className="h-3 w-3 mr-2 border-2 border-orange-700 border-t-transparent rounded-full animate-spin" />
                              Downloading...
                            </>
                          ) : (
                            <>
                              <Download className="h-3 w-3 mr-2" />
                              Operations PDF
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showPagination && data.length > itemsPerPage && (
        <div className="flex items-center justify-between mt-4 px-4">
          <div className="text-sm text-slate-600">
            Showing {startIndex + 1} to {Math.min(endIndex, data.length)} of{" "}
            {data.length} quotes
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="text-sm text-slate-700">
              Page <b>{currentPage}</b> of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {showPagination && (
        <div className="flex items-center justify-end gap-2 px-4 mt-2">
          <span className="text-xs text-slate-500">Rows per page</span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="h-8 rounded-md border border-slate-300 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#27aae1]/40"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      )}
    </div>
  );
}
