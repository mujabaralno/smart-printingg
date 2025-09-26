"use client";

import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar"; // shadcn wrapper for react-day-picker

type Props = {
  from: string;              // "YYYY-MM-DD" or ""
  to: string;                // "YYYY-MM-DD" or ""
  setFrom: (v: string) => void;
  setTo: (v: string) => void;
  className?: string;
};

const toDate = (s?: string) => (s ? new Date(s) : undefined);
const toISO = (d?: Date) =>
  d ? new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10) : "";

export function DateRangeFilter({ from, to, setFrom, setTo, className }: Props) {
  const [open, setOpen] = React.useState(false);

  const selected: DateRange = {
    from: toDate(from),
    to: toDate(to),
  };

  const label =
    selected.from && selected.to
      ? `${format(selected.from, "dd MMM yyyy")} – ${format(selected.to, "dd MMM yyyy")}`
      : "Select date range";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`h-9 gap-2 rounded-lg border-slate-300 bg-white text-left font-normal ${className || ""}`}
        >
          <CalendarIcon className="h-4 w-4 text-slate-500" />
          <span className="truncate">{label}</span>
        </Button>
      </PopoverTrigger>

      {/* POPOVER: 1 calendar, jelas warnanya */}
      <PopoverContent align="start" className="w-auto p-2 rounded-xl">
        <Calendar
          mode="range"
          numberOfMonths={1}             // <- hanya SATU kalender
          selected={selected}
          onSelect={(r) => {
            setFrom(toISO(r?.from));
            setTo(toISO(r?.to));
          }}
          initialFocus
          className="rounded-xl"
          // pastikan layout rapih tanpa bergantung theme luar
          classNames={{
            months: "flex",
            month: "space-y-3 p-2",
            caption: "flex items-center justify-between px-2 pt-2",
            caption_label: "text-base font-semibold",
            nav: "flex items-center gap-1",
            nav_button: "h-8 w-8 rounded-md hover:bg-slate-100",
            table: "w-full border-collapse",
            head_row: "grid grid-cols-7 text-sm text-slate-500",
            head_cell: "h-8 w-8 grid place-items-center font-medium",
            row: "grid grid-cols-7",
            cell: "h-10 w-10 p-0 relative",
            day: "h-10 w-10 grid place-items-center rounded-md hover:bg-slate-100",
            day_outside: "text-slate-300",
            day_disabled: "opacity-40",
            day_selected: "text-white", // bakal di-override oleh styles di bawah
          }}
          // warna dijamin tampil (tanpa tergantung tailwind theme)
          styles={{
            day: { borderRadius: 10 },
            day_selected: { backgroundColor: "#27aae1", color: "white" },
            day_range_start: { backgroundColor: "#27aae1", color: "white" },
            day_range_end: { backgroundColor: "#27aae1", color: "white" },
            day_range_middle: { backgroundColor: "rgba(39,170,225,0.22)", color: "#0f172a" }, // slate-900
          }}
        />

        <div className="flex items-center justify-between gap-2 px-2 pb-2 pt-1">
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-600"
            onClick={() => {
              setFrom("");
              setTo("");
            }}
          >
            Clear
          </Button>
          <Button size="sm" onClick={() => setOpen(false)} className="bg-[#27aae1] hover:bg-[#1e8bc3]">
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
