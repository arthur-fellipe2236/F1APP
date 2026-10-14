import { useEffect, useState } from "react"
import { Link, NavLink, Outlet, useLocation } from "react-router-dom"
import { useTheme } from "next-themes"
import {
  Menu,
  X,
  Users,
  Trophy,
  Flag,
  Calendar,
  Radio,
  Sparkles,
  GitCompare,
  ShieldAlert,
  Home,
} from "lucide-react"

import { api } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { UserProfile } from "@/components/user-profile"
import { ModeToggle } from "@/components/mode-toggle"
import { TeamThemeSelector, THEMES } from "@/components/team-theme-selector"
import { TeamWingLivery } from "@/components/team-wing"
import { Tabs as TabsPrimitive } from "radix-ui"
import { useAppStore } from "@/store"
import { RadioPlayer } from "@/components/radio-player"

const navItems = [
  { to: "/pilotos", label: "Pilotos", icon: Users },
  { to: "/equipes", label: "Equipes", icon: Trophy },
  { to: "/", label: "App", icon: Home },
  { to: "/circuitos", label: "Resultados", icon: Flag },
  { to: "/calendario", label: "Calendário", icon: Calendar },
  { to: "/live", label: "Ao Vivo", icon: Radio, isLive: true },
  { to: "/bolao", label: "Bolão", icon: Sparkles },
  { to: "/comparar", label: "Comparar", icon: GitCompare },
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

function HealthDot() {
  const [status, setStatus] = useState<"checking" | "online" | "offline">(
    "checking",
  )

  useEffect(() => {
    api
      .health()
      .then(() => setStatus("online"))
      .catch(() => setStatus("offline"))
  }, [])

  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/10 border border-white/10 text-xs"
      title={`Status da API: ${status}`}
    >
      <span
        className={cn(
          "size-2 rounded-full",
          status === "online" && "bg-emerald-500 animate-pulse",
          status === "checking" && "bg-amber-500 animate-ping",
          status === "offline" && "bg-rose-500",
        )}
      />
      <span className="text-[10px] uppercase font-bold text-white/70">API</span>
    </div>
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
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Close mobile menu on page navigation
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

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

  const wingImageSrc =
    teamTheme === "ferrari"
      ? "/f1-front-wing-ferrari.png"
      : teamTheme === "mercedes"
      ? "/f1-front-wing-mercedes.png"
      : teamTheme === "mclaren"
      ? "/f1-front-wing-mclaren.png"
      : teamTheme === "redbull"
      ? "/f1-front-wing-redbull.png"
      : "/f1-front-wing.png";

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
        className="sticky top-0 z-50 bg-f1-pattern text-white shadow-lg transition-colors duration-700 team-header-layer"
        style={{ 
          boxShadow: isThemed ? "0 4px 30px var(--team-glow)" : "none"
        }}
      >
        {/* DESKTOP HEADER (MD+) */}
        <div className="mx-auto hidden md:flex flex-col items-center pt-3 pb-2 px-4 relative z-10 w-full">
          {/* LOGO MULTI-SERIES CIRCULAR CENTRALIZADO */}
          <Link to="/" className="mb-2.5 hover:scale-105 transition-transform shrink-0" title="Início">
            <img
              src="/multi-series-logo.png"
              alt="F1 Multi-Series Logo"
              className="h-12 w-12 object-contain drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)] rounded-full border border-white/20"
            />
          </Link>

          {/* CÁPSULA PILL DE NAVEGAÇÃO FLUTUANTE */}
          <div className="w-full max-w-5xl">
            <nav className="w-full h-12 rounded-full bg-[#101015]/85 border border-white/15 backdrop-blur-xl px-5 lg:px-6 flex items-center justify-between shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
              <div className="flex items-center gap-4 lg:gap-6 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center font-f1 uppercase text-xs lg:text-sm tracking-wider font-semibold transition-all hover:text-white shrink-0",
                        isActive ? "text-white font-bold" : "text-white/70"
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
                        "flex items-center font-f1 uppercase text-xs lg:text-sm tracking-wider font-semibold transition-all hover:text-amber-500 shrink-0",
                        isActive ? "text-amber-500 font-bold" : "text-amber-500/70"
                      )
                    }
                  >
                    Admin
                  </NavLink>
                )}
              </div>

              <div className="ml-auto flex items-center gap-2.5 shrink-0 pl-3">
                <HealthBadge />
                <UserProfile />
                <TeamThemeSelector />
                <ModeToggle />
              </div>
            </nav>
          </div>
        </div>

        {/* MOBILE HEADER BAR (< MD) */}
        <div className="mx-auto flex md:hidden h-14 w-full items-center justify-between px-3.5 relative z-10">
          <Link 
            to="/" 
            className="flex items-center gap-2 shrink-0"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <img
              src="/multi-series-logo.png"
              alt="F1 Multi-Series Logo"
              className="h-10 w-auto object-contain drop-shadow-md rounded-full shrink-0"
            />
            <span className="font-f1 text-base font-black tracking-wider text-white">
              F1 APP
            </span>
          </Link>

          <div className="flex items-center gap-1.5 shrink-0">
            <HealthDot />
            <ModeToggle />
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 border cursor-pointer shrink-0",
                isMobileMenuOpen
                  ? "bg-white/20 border-white/40 text-white shadow-inner"
                  : "bg-black/40 border-white/10 text-white/80 hover:text-white hover:bg-white/10 active:scale-95"
              )}
              aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* MOBILE DRAWER / SHEET OVERLAY */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-x-0 top-14 bottom-0 z-50 bg-black/95 backdrop-blur-xl border-t border-white/10 flex flex-col overflow-y-auto animate-in slide-in-from-top-2 duration-200">
            <div className="p-4 flex flex-col gap-2 flex-1 pb-16">
              <span className="text-[11px] font-f1 font-bold uppercase tracking-widest text-white/40 px-2 pb-1">
                Navegação
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                {navItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center justify-between px-4 py-3.5 rounded-xl text-base font-semibold transition-all duration-200",
                          isActive
                            ? "bg-white/15 text-white font-bold border-l-4 border-[hsl(var(--primary))] shadow-sm"
                            : "text-white/70 hover:text-white hover:bg-white/5 active:bg-white/10"
                        )
                      }
                    >
                      <div className="flex items-center gap-3">
                        {Icon && <Icon className="h-5 w-5 opacity-80" />}
                        <span className="font-f1 uppercase tracking-wider text-sm">{item.label}</span>
                      </div>
                      {item.isLive && (
                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-600/30 text-red-400 border border-red-500/40 text-[10px] font-bold uppercase tracking-widest animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          Live
                        </span>
                      )}
                    </NavLink>
                  )
                })}

                {user?.is_admin && (
                  <NavLink
                    to="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-f1 uppercase tracking-wider font-semibold transition-all duration-200 text-amber-400",
                        isActive
                          ? "bg-amber-500/20 text-amber-300 font-bold border-l-4 border-amber-400"
                          : "hover:bg-amber-500/10 active:bg-amber-500/15"
                      )
                    }
                  >
                    <ShieldAlert className="h-5 w-5 opacity-90" />
                    <span>Painel Admin</span>
                  </NavLink>
                )}
              </div>

              {/* SEPARATOR */}
              <div className="my-3 border-t border-white/10" />

              {/* MOBILE SETTINGS & CUSTOMIZATION */}
              <span className="text-[11px] font-f1 font-bold uppercase tracking-widest text-white/40 px-2 pb-1">
                Personalização & Conta
              </span>

              <div className="flex flex-col gap-3 p-3.5 bg-white/5 rounded-2xl border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/70 font-medium">Tema da Equipe:</span>
                  <TeamThemeSelector />
                </div>
                <div className="flex items-center justify-between border-t border-white/10 pt-2.5">
                  <span className="text-xs text-white/70 font-medium">Sua Conta:</span>
                  <UserProfile />
                </div>
                <div className="flex items-center justify-between border-t border-white/10 pt-2.5">
                  <span className="text-xs text-white/70 font-medium">Status do Servidor:</span>
                  <HealthBadge />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DESKTOP (MD+): ASA DIANTEIRA 3D COM SELETOR EMBUTIDO NO CHASSIS */}
        <div className="hidden md:flex w-full max-w-5xl mx-auto relative px-2 items-center justify-center -mt-1 select-none">
          <div className="w-full relative flex items-center justify-center">
            <img
              key={wingImageSrc}
              src={wingImageSrc}
              alt="F1 Front Wing 3D"
              className="w-full h-auto max-h-[120px] lg:max-h-[134px] object-contain select-none pointer-events-none drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)] transition-all duration-300"
            />
            {/* LIVERY OFICIAL DA EQUIPE (OPÇÃO 01: FERRARI / OPÇÃO 02: MERCEDES-AMG) */}
            <TeamWingLivery theme={teamTheme} />

            {/* CÁPSULA FLUTUANTE CENTRAL F1 / F2 / F3 */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ top: "-2px" }}>
              <TabsPrimitive.Root 
                value={series} 
                onValueChange={setSeries} 
                className="w-[430px] sm:w-[460px] pointer-events-auto"
              >
                <TabsPrimitive.List className="h-10 sm:h-11 grid w-full grid-cols-3 p-1 rounded-xl bg-black/60 border border-white/15 shadow-2xl backdrop-blur-md">
                  <TabsPrimitive.Trigger
                    value="f1"
                    className={cn(
                      "h-full flex items-center justify-center rounded-lg transition-all duration-300 font-bold outline-none cursor-pointer",
                      "text-white/50 hover:text-white hover:bg-white/5",
                      "data-[state=active]:bg-[#E10600] data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(225,6,0,0.8)]"
                    )}
                    title="Formula 1"
                  >
                    <F1Logo className="h-3.5 sm:h-4.5 w-auto" />
                  </TabsPrimitive.Trigger>
                  <TabsPrimitive.Trigger
                    value="f2"
                    className={cn(
                      "h-full flex items-center justify-center rounded-lg transition-all duration-300 font-bold outline-none cursor-pointer",
                      "text-white/50 hover:text-white hover:bg-white/5",
                      "data-[state=active]:bg-[#0090D0] data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(0,144,208,0.8)]"
                    )}
                    title="FIA Formula 2"
                  >
                    <F2Logo className="h-3.5 sm:h-4.5 w-auto" />
                  </TabsPrimitive.Trigger>
                  <TabsPrimitive.Trigger
                    value="f3"
                    className={cn(
                      "h-full flex items-center justify-center rounded-lg transition-all duration-300 font-bold outline-none cursor-pointer",
                      "text-white/50 hover:text-white hover:bg-white/5",
                      "data-[state=active]:bg-[#F9A01B] data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(249,160,27,0.8)]"
                    )}
                    title="FIA Formula 3"
                  >
                    <F3Logo className="h-3.5 sm:h-4.5 w-auto" />
                  </TabsPrimitive.Trigger>
                </TabsPrimitive.List>
              </TabsPrimitive.Root>
            </div>
          </div>
        </div>

        {/* MOBILE (< MD): SELETOR COMPACTO ADAPTADO PARA SMARTPHONES */}
        <div className="flex md:hidden w-full bg-transparent px-3 pb-3 pt-1 items-center justify-center relative z-10">
          <TabsPrimitive.Root value={series} onValueChange={setSeries} className="w-full max-w-[340px]">
            <TabsPrimitive.List className="h-10 grid w-full grid-cols-3 p-1 rounded-xl bg-black/50 border border-white/10 shadow-inner backdrop-blur-md">
              <TabsPrimitive.Trigger
                value="f1"
                className={cn(
                  "h-full flex items-center justify-center rounded-lg transition-all duration-300 font-bold outline-none cursor-pointer",
                  "text-white/50 hover:text-white hover:bg-white/5",
                  "data-[state=active]:bg-[#E10600] data-[state=active]:text-white data-[state=active]:shadow-[0_2px_12px_rgba(225,6,0,0.45)]"
                )}
                title="Formula 1"
              >
                <F1Logo className="h-3.5 w-auto" />
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
                <F2Logo className="h-3.5 w-auto" />
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
                <F3Logo className="h-3.5 w-auto" />
              </TabsPrimitive.Trigger>
            </TabsPrimitive.List>
          </TabsPrimitive.Root>
        </div>
      </header>
      <main className="mx-auto max-w-6xl w-full px-3 sm:px-4 py-4 sm:py-8 relative z-10 flex-1 pb-24 md:pb-8">
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
