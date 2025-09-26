import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-slate-200/50",
        // Efek kedip-kedip utama
        "animate-[blink_1.4s_ease-in-out_infinite]",
        // Shimmer effect yang bergerak
        "before:absolute before:inset-0 before:-translate-x-full",
        "before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r",
        "before:from-transparent before:via-white/60 before:to-transparent",
        // Overlay kedip tambahan
        "after:absolute after:inset-0 after:bg-slate-300/30",
        "after:animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
