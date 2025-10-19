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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Crown, User, Calculator, UsersIcon, Funnel } from "lucide-react";
import { getDisplayId } from "@/lib/auth";
import UsersTable, { UserRow } from "@/components/shared/UsersTable";
import UsersMobileCards from "@/components/shared/UsersMobileCards";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

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
  const DEFAULT_PAGE_SIZE = 10;
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

  const tableData: UserRow[] = pageData.map((u) => ({
    id: u.id,
    displayId: u.displayId,
    name: u.name,
    email: u.email,
    joined: fmt(u.joined), // kamu sudah punya helper fmt
    role: u.role,
    status: u.status,
    profilePicture: u.profilePicture ?? null,
  }));

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
          <div className="md:inline-flex hidden items-center justify-center w-16 h-16 bg-[#27aae1] rounded-full shadow-lg">
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

        {/* mobile search */}

        <div className="md:hidden w-full">
          <div className="flex-1">
            <Input
              placeholder="Search users by name, email, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border-slate-300 focus:border-[#ea078b] focus:ring-[#ea078b] rounded-xl h-12 text-base"
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
              {/* Filters */}
              <div className="client-management-filters flex items-center justify-between">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Role
                  </label>
                  <Select
                    value={roleFilter}
                    onValueChange={(
                      v: "all" | "admin" | "user" | "estimator"
                    ) => setRoleFilter(v)}
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
            </PopoverContent>
          </Popover>
          <div className="flex justify-end w-36">
            <Button
              onClick={() => setOpen(true)}
              className="bg-[#27aae1] hover:bg-[#1e8bc3] text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 h-10 w-full sm:w-auto"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add New User
            </Button>
          </div>
        </div>

        <div className="w-full bg-white border  border-slate-200 shadow-sm p-1 md:p-4 rounded-2xl space-y-5">
          <div className="p-0 space-y-6">
            <div className="grid grid-cols-2 w-full gap-5">
              {/* Filters */}
              <div className="client-management-filters   hidden md:flex md:flex-row md:items-center md:gap-5  gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Role
                  </label>
                  <Select
                    value={roleFilter}
                    onValueChange={(
                      v: "all" | "admin" | "user" | "estimator"
                    ) => setRoleFilter(v)}
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
              {/* Search + Add */}
              <div className="md:flex hidden flex-col items-end gap-4 justify-end sm:flex-row">
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
            </div>

            {/* desktop table */}
            <div className="hidden md:block">
              <UsersTable
                data={tableData}
                onEdit={(row) => editUser(users.find((x) => x.id === row.id)!)}
                onToggleStatus={(row) => toggleStatus(row.id)}
                isLoading={loading}
                defaultPageSize={10}
                showPagination={true}
              />
            </div>

            {/* Mobile */}
            <div className="md:hidden">
              <UsersMobileCards
                data={tableData}
                onEdit={(row) => editUser(users.find((x) => x.id === row.id)!)}
                onToggleStatus={(row) => toggleStatus(row.id)}
                isLoading={loading}
                defaultPageSize={10}
                showPagination={true}
              />
            </div>
          </div>
        </div>

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
