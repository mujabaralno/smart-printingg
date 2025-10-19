"use client";
import { Crown } from "lucide-react";

export default function RoleBadge({ role }: { role: "admin" | "user" | "estimator" | string }) {
  if (role === "admin") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border-dashed bg-amber-100 text-amber-800 text-xs px-2 py-1">
        <Crown className="h-3 w-3" /> Admin
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border-dashed border bg-blue-100 text-blue-700 text-xs px-2 py-1">
      <Crown className="h-3 w-3 opacity-60" /> User
    </span>
  );
}
