export type SeriesCategory = "f1" | "f2" | "f3"

export interface SeriesOption {
  id: SeriesCategory
  name: string
  shortLabel: string
  ariaLabel: string
  description: string
  badgeBg: string
  activeBg: string
  activeBorder: string
  activeText: string
  glowColor: string
}

export const SERIES_OPTIONS: SeriesOption[] = [
  {
    id: "f1",
    name: "Fórmula 1",
    shortLabel: "F1",
    ariaLabel: "Fórmula 1 (F1)",
    description: "FIA Formula One World Championship",
    badgeBg: "bg-[#E10600]",
    activeBg: "bg-[#E10600]",
    activeBorder: "border-[#E10600]",
    activeText: "text-white",
    glowColor: "rgba(225, 6, 0, 0.4)",
  },
  {
    id: "f2",
    name: "Fórmula 2",
    shortLabel: "F2",
    ariaLabel: "FIA Fórmula 2 (F2)",
    description: "FIA Formula 2 Championship",
    badgeBg: "bg-[#0090D0]",
    activeBg: "bg-[#0090D0]",
    activeBorder: "border-[#0090D0]",
    activeText: "text-white",
    glowColor: "rgba(0, 144, 208, 0.4)",
  },
  {
    id: "f3",
    name: "Fórmula 3",
    shortLabel: "F3",
    ariaLabel: "FIA Fórmula 3 (F3)",
    description: "FIA Formula 3 Championship",
    badgeBg: "bg-[#F9A01B]",
    activeBg: "bg-[#F9A01B]",
    activeBorder: "border-[#F9A01B]",
    activeText: "text-black",
    glowColor: "rgba(249, 160, 27, 0.4)",
  },
]

export const SERIES_NAMES: Record<string, string> = {
  f1: "Fórmula 1",
  f2: "Fórmula 2",
  f3: "Fórmula 3",
}

export function isEstimatedSessionTime(session?: {
  time_status?: string | null
  is_time_confirmed?: boolean | null
} | null): boolean {
  if (!session) return false
  return session.time_status === "estimated" || session.is_time_confirmed === false
}

export function getNextSeriesIndex(
  currentIndex: number,
  key: string,
  total = SERIES_OPTIONS.length
): number {
  if (key === "ArrowRight" || key === "ArrowDown") {
    return (currentIndex + 1) % total
  }
  if (key === "ArrowLeft" || key === "ArrowUp") {
    return (currentIndex - 1 + total) % total
  }
  if (key === "Home") {
    return 0
  }
  if (key === "End") {
    return total - 1
  }
  return currentIndex
}
