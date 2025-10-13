"use client";

import * as React from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import RoleBadge from "@/components/shared/RoleBadge";
import StatusChip from "@/components/shared/StatusChip";
import { Pencil } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export type UserRow = {
  id: string;
  displayId?: string;
  name: string;
  email: string;
  joined: string; // sudah diformat atau yyyy-mm-dd (string)
  role: "admin" | "user" | "estimator" | string;
  status: "Active" | "Inactive" | string;
  profilePicture?: string | null;
};

function TableSkeletonRow() {
  return (
    <TableRow>
      <TableCell className="py-4"><Skeleton className="h-6 w-24 rounded" /></TableCell>
      <TableCell><Skeleton className="h-6 w-40 rounded" /></TableCell>
      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
      <TableCell className="text-center"><Skeleton className="h-8 w-20 mx-auto" /></TableCell>
      <TableCell className="text-center"><Skeleton className="h-6 w-14 mx-auto" /></TableCell>
    </TableRow>
  );
}
function TableSkeleton({ rows = 10 }: { rows?: number }) {
  return <TableBody>{Array.from({ length: rows }).map((_, i) => <TableSkeletonRow key={i} />)}</TableBody>;
}

export default function UsersTable({
  data,
  onEdit,
  onToggleStatus,
  isLoading = false,
  defaultPageSize = 20,
  showPagination = true,
}: {
  data: UserRow[];
  onEdit: (row: UserRow) => void;
  onToggleStatus: (row: UserRow) => void;
  isLoading?: boolean;
  defaultPageSize?: number;
  showPagination?: boolean;
}) {
  const [rowsPerPage, setRowsPerPage] = React.useState(defaultPageSize);
  const [page, setPage] = React.useState(1);

  const totalPages = Math.max(1, Math.ceil(data.length / rowsPerPage));
  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, data.length);
  const pageData = React.useMemo(() => data.slice(startIndex, endIndex), [data, startIndex, endIndex]);

  React.useEffect(() => {
    const newTotal = Math.max(1, Math.ceil(data.length / rowsPerPage));
    if (page > newTotal) setPage(1);
  }, [data, rowsPerPage, page]);

  return (
    <div className="overflow-hidden bg-white">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-[#F8F8FF]">
            <TableRow className="border-slate-200">
              <TableHead className="w-40 text-slate-600 p-4 text-md font-semibold">ID</TableHead>
              <TableHead className="w-64 text-slate-600 text-md p-4 font-semibold">User</TableHead>
              <TableHead className="w-64 text-slate-600 text-md p-4 font-semibold">Joined</TableHead>
              <TableHead className="w-32 text-slate-600 text-md p-4 font-semibold">Role</TableHead>
              <TableHead className="w-32 text-slate-600 text-md p-4 font-semibold">Status</TableHead>
              <TableHead className="w-10 text-slate-600 text-md p-4 font-semibold">Edit</TableHead>
              <TableHead className="w-32 text-center text-slate-600 p-4 text-md font-semibold">Status Toggle</TableHead>
            </TableRow>
          </TableHeader>

          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} />
          ) : pageData.length === 0 ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={7} className="py-14 text-center text-slate-500">No users found.</TableCell>
              </TableRow>
            </TableBody>
          ) : (
            <TableBody>
              {pageData.map((u) => (
                <TableRow key={u.id} className="hover:bg-slate-50 transition-colors duration-200 border-slate-100">
                  {/* ID */}
                  <TableCell className="p-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                      {u.displayId || u.id}
                    </span>
                  </TableCell>

                  {/* User */}
                  <TableCell className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 h-8 w-8 rounded-full bg-gradient-to-br from-[#27aae1] to-[#ea078b] flex items-center justify-center overflow-hidden">
                        {u.profilePicture ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={u.profilePicture}
                            alt={u.name}
                            className="w-full h-full object-cover"
                            onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                          />
                        ) : (
                          <span className="text-white text-xs font-medium">
                            {u.name?.charAt(0)?.toUpperCase() || "U"}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{u.name}</div>
                        <div className="text-xs text-slate-500">{u.email}</div>
                      </div>
                    </div>
                  </TableCell>

                  {/* Joined */}
                  <TableCell className="p-4 text-sm text-slate-700">{u.joined}</TableCell>

                  {/* Role */}
                  <TableCell className="p-4"><RoleBadge role={u.role} /></TableCell>

                  {/* Status */}
                  <TableCell className="p-4"><StatusChip value={u.status} /></TableCell>

                  {/* Edit */}
                  <TableCell className="p-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(u)}
                      className="border-blue-500 text-blue-600 hover:bg-blue-50 hover:border-blue-600 rounded-xl px-4 py-2"
                    >
                      <Pencil className="h-4 w-4 mr-2" /> Edit
                    </Button>
                  </TableCell>

                  {/* Status Toggle */}
                  <TableCell className="p-4 text-center">
                    <div className="flex flex-col items-center space-y-2">
                      <Switch
                        checked={u.status === "Active"}
                        onCheckedChange={() => onToggleStatus(u)}
                        className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-600 data-[state=checked]:to-purple-600"
                      />
                      <span className="text-xs text-slate-500 font-medium">
                        {u.status === "Active" ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          )}
        </Table>
      </div>

      {/* Footer pagination */}
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
      )}
    </div>
  );
}
