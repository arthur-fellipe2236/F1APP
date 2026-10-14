import { useState } from "react"
import { teamLogo, displayTeamName } from "@/lib/assets"
import { cn } from "@/lib/utils"

function initials(name: string): string {
  const words = name.split(/\s+/).filter(Boolean)
  const letters =
    words.length > 1 ? words.map((w) => w[0]).join("") : name.slice(0, 2)
  return letters.toUpperCase().slice(0, 3)
}

function getContrastColor(hexColor: string) {
  if (!hexColor) return "#ffffff"
  const hex = hexColor.replace("#", "")
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 128 ? "#000000" : "#ffffff"
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
          className="flex h-6 w-12 shrink-0 items-center justify-center rounded-md text-[9px] font-bold shadow-xs ring-1 ring-black/10 dark:ring-white/10"
          style={{ backgroundColor: bgColor, color: textColor }}
        >
          {initials(name).slice(0, 3)}
        </span>
        {displayTeamName(name, season)}
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1.5">
      <span 
        className={cn(
          "flex h-6 w-12 shrink-0 items-center justify-center rounded-md px-1.5 shadow-xs border border-border/40 overflow-hidden",
          !logo.color && "bg-white dark:bg-zinc-800"
        )}
        style={logo.color ? { backgroundColor: logo.color } : undefined}
      >
        <img
          src={logo.url}
          alt=""
          aria-hidden
          loading="lazy"
          onError={() => setBroken(true)}
          className={cn("h-full w-full object-contain drop-shadow-xs", logo.className)}
        />
      </span>
      {displayTeamName(name, season)}
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
          className="flex h-8 w-14 shrink-0 items-center justify-center rounded-md text-[11px] font-bold shadow-xs border border-border/40 transition-transform duration-300 group-hover:scale-110"
          style={{ backgroundColor: bgColor, color: textColor }}
        >
          {initials(name)}
        </span>
        <span className="font-medium text-foreground">{displayTeamName(name, season)}</span>
      </span>
    )
  }
  
  return (
    <span className="flex items-center gap-3 min-h-9 group">
      <span 
        className={cn(
          "flex h-8 w-14 shrink-0 items-center justify-center rounded-md px-1.5 shadow-xs border border-border/40 transition-transform duration-300 group-hover:scale-110 overflow-hidden",
          !logo.color && "bg-white dark:bg-zinc-800"
        )}
        style={logo.color ? { backgroundColor: logo.color } : undefined}
      >
        <img
          src={logo.url}
          alt=""
          aria-hidden
          loading="lazy"
          onError={() => setBroken(true)}
          className={cn("h-full w-full object-contain drop-shadow-xs", logo.className)}
        />
      </span>
      <span className="font-medium text-foreground">
        {displayTeamName(name, season)}
      </span>
    </span>
  )
}
