"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import * as React from "react";
import { MetricCard } from "@/types";

function badgeStyle(trend: "up" | "down" | "flat") {
  switch (trend) {
    case "up":   return "bg-[#27AAE1]/10 text-[#27AAE1] ring-1 ring-[#27AAE1]/20";
    case "down": return "bg-[#EA078B]/10 text-[#EA078B] ring-1 ring-[#EA078B]/20";
    default:     return "bg-slate-100 text-slate-600 ring-1 ring-slate-200";
  }
}
function trendIcon(trend: "up" | "down" | "flat") {
  if (trend === "up") return <ArrowUpRight className="h-3.5 w-3.5" />;
  if (trend === "down") return <ArrowDownRight className="h-3.5 w-3.5" />;
  return <Minus className="h-3.5 w-3.5" />;
}

/** one skeleton card: keeps the same height as real card */
function MetricSkeleton() {
  return (
    <Card className="bg-white border border-slate-200/70 shadow-sm rounded-2xl">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <Skeleton className="h-3 w-24" />
            <div className="flex items-baseline gap-3">
              <Skeleton className="h-8 w-20 rounded" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>
          <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl">
            <Skeleton className="h-full w-full rounded-xl" />
          </div>
        </div>

        <div className="my-4 h-px bg-slate-200/60" />

        <div className="space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-64" />
        </div>
      </CardContent>
    </Card>
  );
}

export function MetricsGrid({
  cards,
  statusFilter,
  onClickCard,
  isLoading = false,
  skeletonCount = 4,
}: {
  cards: MetricCard[];
  statusFilter: string;
  onClickCard: (filterValue: string) => void;
  /** show shimmering placeholders */
  isLoading?: boolean;
  /** how many skeletons to show while loading */
  skeletonCount?: number;
  color?: string
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <MetricSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
      {cards.map((m, i) => {
        const Icon = m.icon;
        const isActive = statusFilter === m.filterValue;

        return (
          <Card
            key={i}
            onClick={() => onClickCard(m.filterValue)}
            className={[
              "cursor-pointer bg-white border border-slate-200/70 shadow-sm hover:shadow-md transition-all duration-300",
              "rounded-2xl hover:-translate-y-0.5",
              isActive ? "ring-2 ring-[#27AAE1]/50 border-[#27AAE1]/40" : "ring-0",
            ].join(" ")}
          >
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-[11px] sm:text-xs font-medium text-slate-600">
                    {m.title}
                  </p>
                  <div className="flex flex-col md:flex-row items-baseline gap-2">
                    <p className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                      {m.value}
                    </p>
                    <span
                      className={[
                        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] sm:text-xs font-semibold",
                        badgeStyle(m.trend),
                      ].join(" ")}
                    >
                      {trendIcon(m.trend)}
                      {m.deltaLabel}
                    </span>
                  </div>
                </div>

                <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl bg-slate-50 ring-1 ring-slate-200">
                  <Icon className={`h-6 w-6  ${m.color}`} />
                </div>
              </div>

              <div className="my-4 h-px bg-slate-200/60" />

              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-[#27AAE1]" />
                  {m.highlight}
                </p>
                <p className="text-xs md:flex hidden text-slate-500">{m.caption}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
