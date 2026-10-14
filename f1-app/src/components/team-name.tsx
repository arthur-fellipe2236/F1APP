import { useState } from "react"
import { teamLogo, displayTeamName } from "@/lib/assets"
import { cn } from "@/lib/utils"

function initials(name: string): string {
  const words = name.split(/\s+/).filter(Boolean)
  const letters =
    words.length > 1 ? words.map((w) => w[0]).join("") : name.slice(0, 2)
  return letters.toUpperCase().slice(0, 3)
}

function getLuminance(hexColor: string): number {
  if (!hexColor) return 0
  const hex = hexColor.replace("#", "")
  if (hex.length !== 6) return 0
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  return (r * 299 + g * 587 + b * 114) / 1000
}

function getContrastColor(hexColor: string) {
  return getLuminance(hexColor) >= 140 ? "#000000" : "#ffffff"
}

export function TeamInline({ name, season }: { name: string | null; season?: number }) {
  const [broken, setBroken] = useState(false)
  if (!name) return <span>—</span>
  const logo = teamLogo(name, season)
  
  if (!logo || broken || !logo.url) {
    const bgColor = logo?.color || "var(--secondary)"
    const textColor = logo?.color ? getContrastColor(logo.color) : "var(--secondary-foreground)"
    
    return (
      <span className="flex items-center gap-1.5">
        <span 
          className="flex h-6 min-w-9 px-1 shrink-0 items-center justify-center rounded-md text-[9px] font-bold shadow-xs border border-border/40"
          style={{ backgroundColor: bgColor, color: textColor }}
        >
          {initials(name).slice(0, 3)}
        </span>
        <span className="truncate">{displayTeamName(name, season)}</span>
      </span>
    )
  }

  const isLightBg = logo.color && !logo.className?.includes("filter-none") ? getLuminance(logo.color) >= 155 : false
  const isDarkBg = logo.color ? getLuminance(logo.color) <= 40 : false
  const isHistorical = !logo.color

  return (
    <span className="flex items-center gap-1.5">
      <span 
        className={cn(
          "flex h-6 w-11 shrink-0 items-center justify-center rounded-md px-1 py-0.5 shadow-xs border border-border/50 transition-all",
          isDarkBg && "ring-1 ring-white/20 dark:border-white/25",
          isHistorical ? "bg-white text-zinc-900 border-border/70" : (!logo.color && "bg-white dark:bg-zinc-800")
        )}
        style={logo.color ? { backgroundColor: logo.color } : undefined}
      >
        <img
          src={logo.url}
          alt=""
          aria-hidden
          loading="lazy"
          onError={() => setBroken(true)}
          className={cn(
            "h-full w-full object-contain drop-shadow-xs",
            isLightBg && "brightness-0",
            logo.className
          )}
        />
      </span>
      <span className="truncate">{displayTeamName(name, season)}</span>
    </span>
  )
}

export function TeamName({ name, season }: { name: string; season?: number }) {
  const [broken, setBroken] = useState(false)
  const logo = teamLogo(name, season)
  
  if (!logo || broken || !logo.url) {
    const bgColor = logo?.color || "var(--secondary)"
    const textColor = logo?.color ? getContrastColor(logo.color) : "var(--secondary-foreground)"
    
    return (
      <span className="flex items-center gap-3 min-h-9 group">
        <span 
          className="flex h-8 min-w-12 px-1.5 shrink-0 items-center justify-center rounded-md text-[11px] font-bold shadow-xs border border-border/40 transition-transform duration-300 group-hover:scale-105"
          style={{ backgroundColor: bgColor, color: textColor }}
        >
          {initials(name)}
        </span>
        <span className="font-medium text-foreground">{displayTeamName(name, season)}</span>
      </span>
    )
  }

  const isLightBg = logo.color && !logo.className?.includes("filter-none") ? getLuminance(logo.color) >= 155 : false
  const isDarkBg = logo.color ? getLuminance(logo.color) <= 40 : false
  const isHistorical = !logo.color
  
  return (
    <span className="flex items-center gap-3 min-h-9 group">
      <span 
        className={cn(
          "flex h-8 w-14 shrink-0 items-center justify-center rounded-md px-1 py-0.5 shadow-xs border border-border/50 transition-transform duration-300 group-hover:scale-105",
          isDarkBg && "ring-1 ring-white/20 dark:border-white/25",
          isHistorical ? "bg-white text-zinc-900 border-border/70" : (!logo.color && "bg-white dark:bg-zinc-800")
        )}
        style={logo.color ? { backgroundColor: logo.color } : undefined}
      >
        <img
          src={logo.url}
          alt=""
          aria-hidden
          loading="lazy"
          onError={() => setBroken(true)}
          className={cn(
            "h-full w-full object-contain drop-shadow-xs",
            isLightBg && "brightness-0",
            logo.className
          )}
        />
      </span>
      <span className="font-medium text-foreground">
        {displayTeamName(name, season)}
      </span>
    </span>
  )
}
