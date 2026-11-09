import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function PositionBadge({ position }: { position: number | null }) {
  if (!position) {
    return (
      <Badge variant="destructive" className="w-9 justify-center text-[10px] font-mono font-bold">
        OUT
      </Badge>
    )
  }

  // Estilização diferenciada inspirada na transmissão esportiva oficial
  const style =
    position === 1
      ? "bg-amber-500/25 text-amber-400 dark:text-amber-300 border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.25)] font-black"
      : position === 2
        ? "bg-zinc-400/20 text-zinc-300 dark:text-zinc-200 border-zinc-400/40 shadow-[0_0_8px_rgba(212,212,216,0.15)] font-bold"
        : position === 3
          ? "bg-amber-700/25 text-amber-500 dark:text-amber-400 border-amber-600/40 shadow-[0_0_8px_rgba(217,119,6,0.2)] font-bold"
          : position <= 10
            ? "bg-white/5 text-foreground/90 border-white/10 font-semibold"
            : "bg-transparent text-muted-foreground border-transparent font-normal opacity-75"

  return (
    <Badge
      variant="outline"
      className={cn(
        "w-8.5 h-6 justify-center rounded-md text-xs font-mono tracking-tight tabular-nums transition-colors",
        style
      )}
    >
      {position}
    </Badge>
  )
}
