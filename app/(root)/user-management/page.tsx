/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import {
  seedUsers,
  type AppUser,
  type AppUserRole,
} from "@/constants/dummyusers";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
import { Plus, Edit3, Crown, User, Calculator, UsersIcon } from "lucide-react";
import RoleBadge from "@/components/shared/RoleBadge";
import StatusChip from "@/components/shared/StatusChip";
import { Card, CardContent } from "@/components/ui/card";
import { getDisplayId } from "@/lib/auth";

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

// ===== Skeleton matching ClientTable style =====
function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`bg-slate-200 animate-pulse rounded ${className}`} />;
}
function TableSkeletonRow() {
  return (
    <TableRow>
      <TableCell className="py-4">
        <SkeletonBlock className="h-6 w-24" />
      </TableCell>
      <TableCell>
        <SkeletonBlock className="h-6 w-40" />
      </TableCell>
      <TableCell>
        <SkeletonBlock className="h-4 w-28" />
      </TableCell>
      <TableCell>
        <SkeletonBlock className="h-6 w-24" />
      </TableCell>
      <TableCell>
        <SkeletonBlock className="h-6 w-24" />
      </TableCell>
      <TableCell className="text-center">
        <SkeletonBlock className="h-8 w-20 mx-auto" />
      </TableCell>
      <TableCell className="text-center">
        <SkeletonBlock className="h-6 w-14 mx-auto" />
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

export default function UserManagementPage() {
  // ===== Original state & logic (kept) =====
  const [users, setUsers] = React.useState<AppUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [editingUserId, setEditingUserId] = React.useState<string | null>(null);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [role, setRole] = React.useState<AppUserRole>("user");
  const [active, setActive] = React.useState(true);
  const [error, setError] = React.useState("");
  const [profilePictureData, setProfilePictureData] = React.useState<
    string | null
  >(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<"all" | AppUserRole>(
    "all"
  );
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | "Active" | "Inactive"
  >("all");

  // ===== New: ClientTable-style pagination state =====
  const DEFAULT_PAGE_SIZE = 20;
  const [rowsPerPage, setRowsPerPage] = React.useState(DEFAULT_PAGE_SIZE);
  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/users");
        if (response.ok) {
          const usersData = await response.json();
          if (usersData.length > 0) {
            const transformedUsers = usersData.map((user: any) => ({
              id: user.id,
              displayId: getDisplayId(user.id),
              name: user.name,
              email: user.email,
              joined: user.createdAt
                ? user.createdAt.split("T")[0]
                : new Date().toISOString().slice(0, 10),
              role: user.role as AppUserRole,
              status: "Active" as const,
              password: "",
              profilePicture: user.profilePicture || null,
            }));
            setUsers(transformedUsers);
          } else {
            const seedUsersWithDisplayIds = seedUsers.map((user) => ({
              ...user,
              displayId: getDisplayId(user.id),
            }));
            setUsers(seedUsersWithDisplayIds);
          }
        } else {
          const seedUsersWithDisplayIds = seedUsers.map((user) => ({
            ...user,
            displayId: getDisplayId(user.id),
          }));
          setUsers(seedUsersWithDisplayIds);
        }
      } catch (error) {
        const seedUsersWithDisplayIds = seedUsers.map((user) => ({
          ...user,
          displayId: getDisplayId(user.id),
        }));
        setUsers(seedUsersWithDisplayIds);
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, []);

  // ===== Filtering (kept) =====
  const filtered = users.filter((u) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.displayId || u.id).toLowerCase().includes(q);
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesStatus = statusFilter === "all" || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // ===== Pagination derived data =====
  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  React.useEffect(() => {
    // Reset page if out of range when filters or rowsPerPage change
    const newTotal = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
    if (page > newTotal) setPage(1);
  }, [filtered.length, rowsPerPage, page]);

  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, filtered.length);
  const pageData = React.useMemo(
    () => filtered.slice(startIndex, endIndex),
    [filtered, startIndex, endIndex]
  );

  // ===== Helpers / Actions (kept) =====
  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setRole("user");
    setActive(true);
    setError("");
    setProfilePictureData(null);
    setEditingUserId(null);
  };

  const addUser = async () => {
    if (!name || !email || (!editingUserId && !password)) {
      setError("Please fill in all required fields");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    try {
      const userData = {
        name,
        email,
        password: password || undefined,
        role,
        status: active ? "Active" : "Inactive",
        profilePicture: profilePictureData,
      };
      if (editingUserId) {
        const response = await fetch(`/api/users/${editingUserId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData),
        });
        if (response.ok) {
          const updatedUser = await response.json();
          setUsers((prev) =>
            prev.map((u) =>
              u.id === editingUserId
                ? {
                    ...u,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    role: updatedUser.role,
                    status: updatedUser.status,
                    profilePicture: updatedUser.profilePicture,
                  }
                : u
            )
          );
          setOpen(false);
          resetForm();
        } else {
          setError("Failed to update user");
        }
      } else {
        const response = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData),
        });
        if (response.ok) {
          const newUser = await response.json();
          const userWithDisplayId = {
            ...newUser,
            displayId: getDisplayId(newUser.id),
            joined: new Date().toISOString().slice(0, 10),
            password: "",
            status: newUser.status,
          };
          setUsers((prev) => [userWithDisplayId, ...prev]);
          setOpen(false);
          resetForm();
        } else {
          setError("Failed to create user");
        }
      }
    } catch (e) {
      console.error("Error saving user:", e);
      setError("An error occurred while saving the user");
    }
  };

  const editUser = (user: AppUser) => {
    setEditingUserId(user.id);
    setName(user.name);
    setEmail(user.email);
    setPassword("");
    setConfirmPassword("");
    setRole(user.role);
    setActive(user.status === "Active");
    setError("");
    setProfilePictureData(user.profilePicture || null);
    setOpen(true);
  };

  const toggleStatus = async (userId: string) => {
    try {
      const user = users.find((u) => u.id === userId);
      if (!user) return;
      const newStatus = user.status === "Active" ? "Inactive" : "Active";
      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
        );
      } else {
        console.error("Failed to update user status");
      }
    } catch (e) {
      console.error("Error updating user status:", e);
    }
  };

  // ===== UI =====
  return (
    <div className="min-h-screen  p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex gap-5">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#27aae1] rounded-full shadow-lg">
            <UsersIcon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              User Management
            </h1>
            <p className="text-gray-600 mt-2">
              Manage your team members, their roles, and access permissions.
            </p>
          </div>
        </div>
        <div>
          {/* Search + Add */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1">
                <Input
                  placeholder="Search users by name, email, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full border-slate-300 focus:border-[#ea078b] focus:ring-[#ea078b] rounded-xl h-12 text-base"
                />
              </div>
              <Button
                onClick={() => setOpen(true)}
                className="bg-[#27aae1] hover:bg-[#1e8bc3] text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 h-12"
              >
                <Plus className="h-5 w-5 mr-2" /> Add New User
              </Button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 md:flex md:flex-row md:items-center gap-4 mb-4 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Role
                </label>
                <Select
                  value={roleFilter}
                  onValueChange={(v: "all" | "admin" | "user" | "estimator") =>
                    setRoleFilter(v)
                  }
                >
                  <SelectTrigger className="border-slate-300 focus:border-[#ea078b] focus:ring-[#ea078b] rounded-xl h-12">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="estimator">Estimator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Status
                </label>
                <Select
                  value={statusFilter}
                  onValueChange={(v: "all" | "Active" | "Inactive") =>
                    setStatusFilter(v)
                  }
                >
                  <SelectTrigger className="border-slate-300 focus:border-[#ea078b] focus:ring-[#ea078b] rounded-xl h-12">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
        </div>

        <Card className="w-full">
          <CardContent className="p-0">
            

            {/* ===== TABLE (ClientTable styling) ===== */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow className="border-slate-200">
                      <TableHead className="w-40 text-slate-600 text-md font-semibold">
                        ID
                      </TableHead>
                      <TableHead className="w-64 text-slate-600 text-md font-semibold">
                        User
                      </TableHead>
                      <TableHead className="w-64 text-slate-600 text-md font-semibold">
                        Joined
                      </TableHead>
                      <TableHead className="w-32 text-slate-600 text-md font-semibold">
                        Role
                      </TableHead>
                      <TableHead className="w-32 text-slate-600 text-md font-semibold">
                        Status
                      </TableHead>
                      <TableHead className="w-10 text-slate-600 text-md font-semibold">
                        Edit
                      </TableHead>
                      <TableHead className="w-32 text-center  text-slate-600 text-md font-semibold">
                        Status Toggle
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  {loading ? (
                    <TableSkeleton rows={rowsPerPage} />
                  ) : pageData.length === 0 ? (
                    <TableBody>
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="py-14 text-center text-slate-500"
                        >
                          No users found.
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  ) : (
                    <TableBody>
                      {pageData.map((u) => (
                        <TableRow
                          key={u.id}
                          className="hover:bg-slate-50 transition-colors duration-200 border-slate-100"
                        >
                          {/* ID */}
                          <TableCell className="">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                              {u.displayId || u.id}
                            </span>
                          </TableCell>
                          {/* User */}
                          <TableCell className="">
                            <div className="flex items-start gap-3">
                              <div className="mt-1 h-8 w-8 rounded-full bg-gradient-to-br from-[#27aae1] to-[#ea078b] flex items-center justify-center overflow-hidden">
                                {u.profilePicture ? (
                                  <img
                                    src={u.profilePicture}
                                    alt={`${u.name}'s profile`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (
                                        e.target as HTMLImageElement
                                      ).style.display = "none";
                                    }}
                                  />
                                ) : (
                                  <span className="text-white text-xs font-medium">
                                    {u.name.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div>
                                <div className="font-medium text-slate-900">
                                  {u.name}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {u.email}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          {/* Joined */}
                          <TableCell className="text-sm text-slate-700 p-4">
                            {fmt(u.joined)}
                          </TableCell>
                          {/* Role */}
                          <TableCell className="">
                            <div className="flex items-center gap-2">
                              <RoleBadge role={u.role} />
                            </div>
                          </TableCell>
                          {/* Status */}
                          <TableCell className="">
                            <StatusChip value={u.status} />
                          </TableCell>
                          {/* Edit */}
                          <TableCell className="">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => editUser(u)}
                              className="border-blue-500 text-blue-600 hover:bg-blue-50 hover:border-blue-600 rounded-xl px-4 py-2"
                            >
                              <Edit3 className="h-4 w-4 mr-2" /> Edit
                            </Button>
                          </TableCell>
                          {/* Toggle */}
                          <TableCell className="">
                            <div className="flex flex-col items-center space-y-2">
                              <Switch
                                checked={u.status === "Active"}
                                onCheckedChange={() => toggleStatus(u.id)}
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

              {/* ===== Footer pagination (ClientTable style) ===== */}
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
                    <span className="text-xs text-slate-500">
                      Rows per page
                    </span>
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
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
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
          </CardContent>
        </Card>

        {/* ===== Modal (logic kept) ===== */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-[520px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-900">
                {editingUserId ? "Edit User" : "Add New User"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Full Name
                  </label>
                  <Input
                    placeholder="e.g. John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="border-slate-300 focus:border-[#ea078b] focus:ring-[#ea078b] rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Email
                  </label>
                  <Input
                    type="email"
                    placeholder="user@mail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border-slate-300 focus:border-[#ea078b] focus:ring-[#ea078b] rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Profile Picture
                  </label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 2 * 1024 * 1024) {
                          alert("Profile picture must be < 2MB");
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = (ev) =>
                          setProfilePictureData(ev.target?.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Password{" "}
                    {editingUserId && (
                      <span className="text-slate-400 font-normal">
                        (leave blank to keep current)
                      </span>
                    )}
                  </label>
                  <Input
                    type="password"
                    placeholder={
                      editingUserId ? "Leave blank to keep current" : "********"
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-slate-300 focus:border-[#ea078b] focus:ring-[#ea078b] rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Confirm Password{" "}
                    {editingUserId && (
                      <span className="text-slate-400 font-normal">
                        (leave blank to keep current)
                      </span>
                    )}
                  </label>
                  <Input
                    type="password"
                    placeholder={
                      editingUserId ? "Leave blank to keep current" : "********"
                    }
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="border-slate-300 focus:border-[#ea078b] focus:ring-[#ea078b] rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Role
                  </label>
                  <Select
                    value={role}
                    onValueChange={(v) => setRole(v as AppUserRole)}
                  >
                    <SelectTrigger className="border-slate-300 focus:border-[#ea078b] focus:ring-[#ea078b] rounded-xl">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4 text-yellow-600" />
                          Admin
                        </div>
                      </SelectItem>
                      <SelectItem value="user">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-[#27aae1]" />
                          User
                        </div>
                      </SelectItem>
                      <SelectItem value="estimator">
                        <div className="flex items-center gap-2">
                          <Calculator className="h-4 w-4 text-[#f89d1d]" />
                          Estimator
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4 bg-slate-50">
                  <div>
                    <div className="text-sm text-slate-600">Status</div>
                    <div className="text-sm font-medium text-slate-900">
                      {active ? "Active" : "Inactive"}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {editingUserId
                        ? "Toggle user status"
                        : "New users are Active by default"}
                    </div>
                  </div>
                  <Switch
                    checked={active}
                    onCheckedChange={setActive}
                    className="data-[state=checked]:bg-[#ea078b]"
                  />
                </div>
                {error && (
                  <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                    {error}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => {
                  setOpen(false);
                  resetForm();
                }}
                className="border-slate-300 hover:border-slate-400 hover:bg-slate-50 px-6 py-2 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={addUser}
                className="bg-[#27aae1] hover:bg-[#1e8bc3] text-white px-6 py-2 rounded-xl"
              >
                {editingUserId ? "Update User" : "Add User"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
