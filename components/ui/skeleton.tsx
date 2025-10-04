import { cn } from "@/lib/utils"
import * as React from "react"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-slate-200/60",
        // efek blink halus pada kontainer
        "animate-blink",
        // pseudo-element untuk shimmer
        "before:absolute before:inset-0 before:-translate-x-full",
        // garis terang berjalan
        "before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent",
        "before:animate-shimmer",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
