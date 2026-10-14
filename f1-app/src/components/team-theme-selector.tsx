import { Paintbrush } from "lucide-react"
import { useAppStore } from "@/store"
import { teamLogo } from "@/lib/assets"
import { cn } from "@/lib/utils"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

export const THEMES = [
  { id: "default", name: "Padrão (Sem Tema)", color: "", darkColor: "", accent: "", logo: null },
  { id: "ferrari", name: "Ferrari", color: "#E8002D", darkColor: "#B3001D", accent: "#FFD600", logo: "Ferrari" }, // Red bg, Yellow accent
  { id: "mclaren", name: "McLaren", color: "#FF8000", darkColor: "#CC6600", accent: "#13B4E3", logo: "McLaren" }, // Papaya bg, Gulf Blue accent
  { id: "mercedes", name: "Mercedes", color: "#2E3033", darkColor: "#1A1B1C", accent: "#27F4D2", logo: "Mercedes" }, // Black/Silver bg, Petronas Green accent
  { id: "redbull", name: "Red Bull Racing", color: "#0600EF", darkColor: "#0400A3", accent: "#FF2A2A", logo: "Red Bull Racing" }, // Navy bg, Red accent
  { id: "williams", name: "Williams", color: "#005AFF", darkColor: "#003AAB", accent: "#00E5FF", logo: "Williams" }, // Blue bg, Cyan accent
  { id: "aston", name: "Aston Martin", color: "#229971", darkColor: "#16664B", accent: "#CEF511", logo: "Aston Martin" }, // Green bg, Neon Yellow accent
  { id: "alpine", name: "Alpine", color: "#0050FF", darkColor: "#0036AD", accent: "#FF87BC", logo: "Alpine" }, // Blue bg, BWT Pink accent
  { id: "haas", name: "Haas", color: "#1F1F1F", darkColor: "#0F0F0F", accent: "#B60000", logo: "Haas" }, // Black bg, Red accent
  { id: "audi", name: "Audi", color: "#1A1A1A", darkColor: "#0D0D0D", accent: "#F50537", logo: "Audi" }, // Black bg, Neon Red accent
  { id: "racingbulls", name: "Racing Bulls", color: "#1021C7", darkColor: "#0A1582", accent: "#FFFFFF", logo: "Racing Bulls" }, // Visa Blue bg, White/Silver accent
  { id: "cadillac", name: "Cadillac", color: "#111111", darkColor: "#000000", accent: "#D4AF37", logo: "Cadillac" }, // Black bg, Gold accent
]

export function TeamThemeSelector() {
  const { teamTheme, setTeamTheme } = useAppStore()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" title="Tema da Equipe">
          <Paintbrush className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Tema da Equipe</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-[80vh] overflow-y-auto w-48">
        {THEMES.map((theme) => {
          const logoObj = theme.logo ? teamLogo(theme.logo) : null;
          
          return (
            <DropdownMenuItem
              key={theme.id}
              onClick={() => setTeamTheme(theme.id)}
              className="flex items-center gap-3 cursor-pointer py-2"
            >
              {logoObj ? (
                <div 
                  className={cn(
                    "h-6 w-9 shrink-0 flex items-center justify-center rounded-md p-0.5 shadow-xs border border-border/50 transition-all",
                    (theme.color === "#111111" || theme.color === "#1A1A1A" || theme.color === "#1F1F1F") && "ring-1 ring-white/20 dark:border-white/25"
                  )}
                  style={{ backgroundColor: theme.color || logoObj.color || "var(--muted)" }}
                >
                  <img 
                    src={logoObj.url} 
                    alt={theme.name} 
                    className="h-full w-full object-contain drop-shadow-xs" 
                  />
                </div>
              ) : (
                <div className="h-6 w-9 shrink-0 flex items-center justify-center rounded-md bg-muted border border-border/40">
                  <div className="h-3 w-3 rounded-full border border-border" style={{ backgroundColor: theme.color || "transparent" }} />
                </div>
              )}
              <span className={teamTheme === theme.id ? "font-bold" : ""}>
                {theme.name}
              </span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
