import { useRef, useCallback, type KeyboardEvent } from "react"
import { cn } from "@/lib/utils"
import {
  SERIES_OPTIONS,
  getNextSeriesIndex,
  type SeriesCategory,
  type SeriesOption,
} from "@/lib/series"

export type { SeriesCategory, SeriesOption }
export { SERIES_OPTIONS }

export interface SeriesSelectorProps {
  value: string
  onChange: (series: SeriesCategory) => void
  className?: string
  size?: "default" | "sm"
  disabled?: boolean
}

export function SeriesSelector({
  value,
  onChange,
  className,
  size = "default",
  disabled = false,
}: SeriesSelectorProps) {
  const currentSeries = (value.toLowerCase() as SeriesCategory) || "f1"
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
      const targetIndex = getNextSeriesIndex(index, e.key, SERIES_OPTIONS.length)

      if (targetIndex !== index) {
        e.preventDefault()
        const nextOpt = SERIES_OPTIONS[targetIndex]
        buttonRefs.current[targetIndex]?.focus()
        onChange(nextOpt.id)
      }
    },
    [onChange]
  )

  return (
    <nav
      role="tablist"
      aria-label="Selecionar categoria automobilística"
      className={cn(
        "inline-flex items-center rounded-xl p-1 bg-black/40 border border-white/10 backdrop-blur-md shadow-lg select-none",
        size === "sm" ? "h-9" : "h-11 sm:h-12",
        className
      )}
    >
      {SERIES_OPTIONS.map((opt, idx) => {
        const isActive = currentSeries === opt.id

        return (
          <button
            key={opt.id}
            ref={(el) => {
              buttonRefs.current[idx] = el
            }}
            role="tab"
            type="button"
            id={`series-tab-${opt.id}`}
            aria-selected={isActive}
            aria-controls={`series-panel-${opt.id}`}
            aria-label={opt.ariaLabel}
            tabIndex={isActive ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(opt.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            style={
              isActive
                ? {
                    boxShadow: `0 0 16px ${opt.glowColor}`,
                  }
                : undefined
            }
            className={cn(
              "relative flex items-center justify-center gap-1.5 sm:gap-2 font-bold transition-all duration-200 outline-none rounded-lg cursor-pointer",
              "focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              size === "sm"
                ? "px-2.5 py-1 text-xs"
                : "px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm",
              isActive
                ? cn(opt.activeBg, opt.activeText, "shadow-md scale-[1.02]")
                : "text-zinc-400 hover:text-white hover:bg-white/5 active:scale-95"
            )}
          >
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[10px] sm:text-[11px] font-black tracking-wider uppercase",
                isActive
                  ? "bg-black/25 text-inherit"
                  : cn(opt.badgeBg, opt.id === "f3" ? "text-black" : "text-white")
              )}
            >
              {opt.shortLabel}
            </span>
            <span className="font-semibold tracking-tight">{opt.name}</span>
          </button>
        )
      })}
    </nav>
  )
}
