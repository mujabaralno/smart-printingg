"use client";

import { Badge } from "lucide-react";

export default function StatusChip({ value }: { value: "Active" | "Inactive" | string }) {
  return (
    <Badge
      className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
        value === "Active"
          ? "bg-green-100 text-green-700 border border-dashed border-green-200"
          : "bg-rose-100 text-rose-700 border border-dashed border-rose-200"
      }`}
    >
      {value}
    </Badge>
  )
}