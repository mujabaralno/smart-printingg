"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import RoleBadge from "@/components/shared/RoleBadge";
import StatusChip from "@/components/shared/StatusChip";
import { Switch } from "@/components/ui/switch";
import type { UserRow } from "./UsersTable";

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
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-6 w-12 rounded-md" />
        </div>
      </div>
    </Card>
  );
}

function MobileCardsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-3 xs:space-y-4 p-3 xs:p-4">
      {Array.from({ length: count }).map((_, i) => <MobileCardSkeleton key={i} />)}
    </div>
  );
}

export default function UsersMobileCards({
  data,
  onEdit,
  onToggleStatus,
  isLoading = false,
  defaultPageSize = 10,
  showPagination = true,
  className,
}: {
  data: UserRow[];
  onEdit: (row: UserRow) => void;
  onToggleStatus: (row: UserRow) => void;
  isLoading?: boolean;
  defaultPageSize?: number;
  showPagination?: boolean;
  className?: string;
}) {
  const [itemsPerPage, setItemsPerPage] = React.useState(defaultPageSize);
  const [currentPage, setCurrentPage] = React.useState(1);

  const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, data.length);
  const pageData = React.useMemo(() => data.slice(startIndex, endIndex), [data, startIndex, endIndex]);

  React.useEffect(() => {
    const nextTotal = Math.max(1, Math.ceil(data.length / itemsPerPage));
    if (currentPage > nextTotal) setCurrentPage(1);
  }, [data, itemsPerPage, currentPage]);

  return (
    <div className={cn("lg:hidden space-y-3 xs:space-y-4", className)}>
      {isLoading ? (
        <MobileCardsSkeleton count={itemsPerPage} />
      ) : pageData.length === 0 ? (
        <div className="text-center py-16 text-slate-500">No users found.</div>
      ) : (
        <div className="space-y-3 xs:space-y-4 p-3 xs:p-4">
          {pageData.map((u) => (
            <Card key={`${u.id}-${u.status}`} className="p-4 border-slate-200">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-medium text-slate-900 bg-slate-100 px-2 py-1 rounded">
                    {u.displayId || u.id}
                  </span>
                  <StatusChip value={u.status} />
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 h-10 w-10 rounded-full bg-gradient-to-br from-[#27aae1] to-[#ea078b] flex items-center justify-center overflow-hidden">
                    {u.profilePicture ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={u.profilePicture}
                        alt={u.name}
                        className="w-full h-full object-cover"
                        onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                      />
                    ) : (
                      <span className="text-white text-sm font-medium">
                        {u.name?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="font-medium text-slate-900">{u.name}</div>
                    <div className="text-sm text-slate-500">{u.email}</div>
                    <div className="mt-1"><RoleBadge role={u.role} /></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-slate-500">Joined:</span>
                    <div className="text-sm text-slate-700">{u.joined}</div>
                  </div>
                  <div>
                    <span className="text-sm text-slate-500">Status:</span>
                    <div className="text-sm text-slate-700">{u.status}</div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(u)}
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <Pencil className="w-4 h-4 mr-1" />
                    Edit
                  </Button>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={u.status === "Active"}
                      onCheckedChange={() => onToggleStatus(u)}
                      className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-600 data-[state=checked]:to-purple-600"
                    />
                    <span className="text-xs text-slate-500 font-medium">
                      {u.status === "Active" ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showPagination && data.length > itemsPerPage && (
        <div className="flex items-center justify-between mt-4 px-4">
          <div className="text-sm text-slate-600">
            Showing {startIndex + 1} to {Math.min(endIndex, data.length)} of {data.length} users
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
            onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
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
