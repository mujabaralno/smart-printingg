"use client";

export default function StatusChip({ value }: { value: "Active" | "Inactive" | string }) {
  return value === "Active" ? (
    <span className="text-sm text-emerald-700">Active</span>
  ) : (
    <span className="text-sm text-slate-500">Inactive</span>
  );
}