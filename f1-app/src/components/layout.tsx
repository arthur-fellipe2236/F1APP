import { useEffect, useState } from "react"
import { Link, NavLink, Outlet } from "react-router-dom"
import { useTheme } from "next-themes"

import { api } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { UserProfile } from "@/components/user-profile"
import { ModeToggle } from "@/components/mode-toggle"
import { TeamThemeSelector, THEMES } from "@/components/team-theme-selector"
import { Tabs as TabsPrimitive } from "radix-ui"
import { useAppStore } from "@/store"
import { RadioPlayer } from "@/components/radio-player"

const navItems = [
  { to: "/pilotos", label: "Pilotos" },
  { to: "/equipes", label: "Equipes" },
  { to: "/circuitos", label: "Resultados" },
  { to: "/calendario", label: "Calendário" },
  { to: "/live", label: "Ao Vivo" },
  { to: "/bolao", label: "Bolão" },
  { to: "/comparar", label: "Comparar" },
]


function HealthBadge() {
  const [status, setStatus] = useState<"checking" | "online" | "offline">(
    "checking",
  )

  useEffect(() => {
    api
      .health()
      .then(() => setStatus("online"))
      .catch(() => setStatus("offline"))
  }, [])

  if (status === "checking") {
    return <Badge variant="outline" className="text-white/50 border-white/20">API: verificando…</Badge>
  }
  if (status === "online") {
    return (
      <Badge className="gap-1.5 bg-white/10 hover:bg-white/20 text-white border-white/10">
        <span className="size-1.5 rounded-full bg-emerald-500" />
        API online
      </Badge>
    )
  }
  return (
    <Badge variant="destructive" className="gap-1.5">
      <span className="size-1.5 rounded-full bg-current" />
      API offline
    </Badge>
  )
}

function F1Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 80" className={className} fill="currentColor">
      <path d="M45.2583 80L80.7417 45.575H80.7333C94.7167 32.0167 100.392 29.9583 127.058 29.9583H233.408L264.008 0H123.025C87.3333 0 77.2417 3.4 56.3083 24.1167L0 80H45.2583ZM127.7 34.7417H228.842L200.792 62.7917H128.225C114.925 62.7917 111.983 63.4167 105.383 70.0167L95.4 80H53.4333L84.4583 48.975C96.6417 36.8 100.842 34.7417 127.7 34.7417ZM320 0L239.783 80H190.175L270.175 0H320Z" />
    </svg>
  )
}

function F2Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="25 0 475 160" className={className} fill="currentColor">
      <path d="m380.29 156.2c12.981-0.16226 23.042-3.9755 30.506-8.5839 11.213-6.9288 16.389-15.496 17.07-16.535l13.403-20.738h-124.59l5.7118-8.8435h94.585c24.778 0 37.873-12.365 43.195-20.608 3.3264-5.1601 35.098-54.359 35.098-54.359 3.6348-5.6469 7.4967-14.198 1.9472-21.03-1.6551-2.1744-5.1276-5.0952-12.316-5.0952h-136.13c-24.778 0-37.873 12.365-43.195 20.608-3.3265 5.1601-16.34 25.249-16.34 25.249h124.41l-5.7118 8.8435h-93.125c-12.981 0.16227-23.042 3.9755-30.506 8.5839-11.213 6.9288-16.389 15.496-17.07 16.535l-0.0487 0.08113c-0.95735 1.4442-48.923 75.876-48.923 75.876h162.04zm-108.2-109.92 29.597-45.856h-131.26c-41.183 0-61.84 33.622-61.84 33.622l-78.845 122.15h68.882l35.65-55.219h72.565c24.778 0 37.873-12.365 43.195-20.608 3.3265-5.1601 16.34-25.249 16.34-25.249h-102.5l5.7118-8.8435z" />
    </svg>
  )
}

function F3Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="25 0 475 160" className={className} fill="currentColor">
      <path d="m272.09 46.273 29.597-45.856h-131.26c-41.183 0-61.84 33.622-61.84 33.622l-78.845 122.15h68.882l35.65-55.219h72.565c24.778 0 37.873-12.365 43.195-20.608 3.3265-5.1601 16.34-25.249 16.34-25.249h-102.5l5.7118-8.8435zm155.84 84.719c2.1581-3.2615 67.34-104.45 67.34-104.45 3.6348-5.6469 7.4967-14.198 1.9472-21.03-1.6551-2.1744-5.1276-5.0952-12.316-5.0952h-136.13c-24.778 0-37.873 12.365-43.195 20.608-3.3264 5.1601-16.34 25.249-16.34 25.249h124.41l-5.7118 8.8435h-124.41l-29.938 46.392h124.41l-5.7118 8.8435h-124.41l-29.614 45.856h162.02c12.981-0.16226 23.042-3.9755 30.506-8.5839 11.213-6.9288 16.389-15.496 17.07-16.535l0.0487-0.0811z" />
    </svg>
  )
}

export function Layout() {
  const { series, setSeries, teamTheme, user } = useAppStore()
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    const html = document.documentElement
    // Remove old hardcoded team themes if they exist
    html.classList.forEach((cls) => {
      if (cls.startsWith("theme-")) html.classList.remove(cls)
    })

    const themeObj = THEMES.find((t) => t.id === teamTheme)
    
    if (themeObj && themeObj.id !== "default" && themeObj.color) {
      // Accent color powers the primary UI elements (buttons, active states)
      const activeAccent = themeObj.accent || themeObj.color;
      
      html.style.setProperty("--primary", activeAccent);
      html.style.setProperty("--ring", activeAccent);
      
      // Base color powers the ambient background and glowing borders
      const activeBase = resolvedTheme === "dark" ? themeObj.darkColor : themeObj.color;
      const r = parseInt(activeBase.slice(1,3), 16);
      const g = parseInt(activeBase.slice(3,5), 16);
      const b = parseInt(activeBase.slice(5,7), 16);
      
      const bgOpacity = resolvedTheme === "dark" ? "0.15" : "0.08";
      html.style.setProperty("--team-bg-color", `rgba(${r}, ${g}, ${b}, ${bgOpacity})`);
      html.style.setProperty("--team-border-color", activeAccent);
      html.style.setProperty("--team-glow", `rgba(${parseInt(activeAccent.slice(1,3),16)}, ${parseInt(activeAccent.slice(3,5),16)}, ${parseInt(activeAccent.slice(5,7),16)}, 0.4)`);

      html.classList.add("theme-active"); // Flag to activate deep CSS rules
    } else {
      // Reset to default tailwind values from index.css
      html.style.removeProperty("--primary");
      html.style.removeProperty("--ring");
      html.style.removeProperty("--team-bg-color");
      html.style.removeProperty("--team-border-color");
      html.style.removeProperty("--team-glow");
      html.style.removeProperty("--team-text");
      html.classList.remove("theme-active");
    }
  }, [teamTheme, resolvedTheme])

  const themeObj = THEMES.find((t) => t.id === teamTheme);
  const isThemed = themeObj && themeObj.id !== "default";
  
  const bgImage = isThemed 
    ? `url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h24v24H0V0zm12 12h12v12H12V12zM0 12h12v12H0V12zm12-12h12v12H12V0z' fill='%23000000' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E"), radial-gradient(circle at 50% 0%, var(--team-glow, transparent) 0%, transparent 70%)` 
    : "none";

  return (
    <div className="min-h-screen bg-background relative transition-colors duration-700 overflow-hidden flex flex-col">
      {/* Carbon Fiber + Radial Glow Background Overlay */}
      <div 
        className="fixed inset-0 pointer-events-none transition-all duration-1000 z-0 team-bg-layer" 
        style={{ 
          backgroundColor: "var(--team-bg-color, transparent)",
          backgroundSize: "24px 24px, 100% 100%",
          backgroundImage: bgImage
        }} 
      />

      <header 
        className="sticky top-0 z-50 border-b-2 bg-f1-pattern text-white shadow-lg transition-colors duration-700 team-header-layer"
        style={{ 
          borderBottomColor: isThemed ? "var(--team-border-color)" : "hsl(var(--primary)/0.5)",
          boxShadow: isThemed ? "0 4px 30px var(--team-glow)" : "none"
        }}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-4 relative z-10">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/multi-series-logo.png"
              alt="F1 Multi-Series Logo"
              className="h-14 w-auto object-contain drop-shadow-md rounded-full"
            />
          </Link>
          <nav className="flex items-center gap-4 overflow-x-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center px-2 py-4 font-f1 uppercase text-sm tracking-widest font-semibold text-white/70 transition-all hover:text-white",
                    isActive && "text-base font-bold text-white tracking-widest"
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
            
            {user?.is_admin && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  cn(
                    "flex items-center px-2 py-4 font-f1 uppercase text-sm tracking-widest font-semibold text-amber-500/70 transition-all hover:text-amber-500",
                    isActive && "text-base font-bold text-amber-500 tracking-widest"
                  )
                }
              >
                Admin
              </NavLink>
            )}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <HealthBadge />
            <UserProfile />
            <TeamThemeSelector />
            <ModeToggle />
          </div>
        </div>
        <div className="bg-transparent px-4 pb-3.5 pt-1 flex items-center justify-center relative z-10">
          <TabsPrimitive.Root value={series} onValueChange={setSeries} className="w-full max-w-[360px] sm:max-w-[390px]">
            <TabsPrimitive.List className="h-11 grid w-full grid-cols-3 p-1 rounded-xl bg-black/50 border border-white/10 shadow-inner backdrop-blur-md">
              <TabsPrimitive.Trigger
                value="f1"
                className={cn(
                  "h-full flex items-center justify-center rounded-lg transition-all duration-300 font-bold outline-none cursor-pointer",
                  "text-white/50 hover:text-white hover:bg-white/5",
                  "data-[state=active]:bg-[#E10600] data-[state=active]:text-white data-[state=active]:shadow-[0_2px_12px_rgba(225,6,0,0.45)]"
                )}
                title="Formula 1"
              >
                <F1Logo className="h-4 sm:h-4.5 w-auto" />
              </TabsPrimitive.Trigger>
              <TabsPrimitive.Trigger
                value="f2"
                className={cn(
                  "h-full flex items-center justify-center rounded-lg transition-all duration-300 font-bold outline-none cursor-pointer",
                  "text-white/50 hover:text-white hover:bg-white/5",
                  "data-[state=active]:bg-[#0090D0] data-[state=active]:text-white data-[state=active]:shadow-[0_2px_12px_rgba(0,144,208,0.45)]"
                )}
                title="FIA Formula 2"
              >
                <F2Logo className="h-4 sm:h-4.5 w-auto" />
              </TabsPrimitive.Trigger>
              <TabsPrimitive.Trigger
                value="f3"
                className={cn(
                  "h-full flex items-center justify-center rounded-lg transition-all duration-300 font-bold outline-none cursor-pointer",
                  "text-white/50 hover:text-white hover:bg-white/5",
                  "data-[state=active]:bg-[#F9A01B] data-[state=active]:text-white data-[state=active]:shadow-[0_2px_12px_rgba(249,160,27,0.45)]"
                )}
                title="FIA Formula 3"
              >
                <F3Logo className="h-4 sm:h-4.5 w-auto" />
              </TabsPrimitive.Trigger>
            </TabsPrimitive.List>
          </TabsPrimitive.Root>
        </div>
      </header>
      <main className="mx-auto max-w-6xl w-full px-3 sm:px-4 py-4 sm:py-8 relative z-10 flex-1">
        <Outlet />
      </main>
      <RadioPlayer />
      <footer className="mx-auto max-w-6xl w-full px-4 pb-8 relative z-10">
        <p className="text-xs text-muted-foreground">
          Painel conectado à f1-api. Dados provisórios/simulados para temporadas futuras.
        </p>
      </footer>
    </div>
  )
}
