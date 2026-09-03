import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function PositionBadge({ position }: { position: number | null }) {
  if (!position) {
    return (
      <Badge variant="destructive" className="w-10 justify-center text-[10px]">
        OUT
      </Badge>
    )
  }

  const style =
    position === 1
      ? "bg-amber-400/20 text-amber-600 dark:text-amber-400"
      : position === 2
        ? "bg-zinc-400/25 text-zinc-600 dark:text-zinc-300"
        : position === 3
          ? "bg-orange-700/15 text-orange-700 dark:text-orange-400"
          : undefined

  return (
    <Badge
      variant={style ? "secondary" : "outline"}
      className={cn("w-8 justify-center tabular-nums", style)}
    >
      {position}
    </Badge>
  )
}
