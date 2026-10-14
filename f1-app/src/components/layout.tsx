import { useEffect, useState } from "react"
import { Link, NavLink, Outlet } from "react-router-dom"
import { useTheme } from "next-themes"

import { api } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { UserProfile } from "@/components/user-profile"
import { ModeToggle } from "@/components/mode-toggle"
import { TeamThemeSelector, THEMES } from "@/components/team-theme-selector"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
        <div className="bg-transparent px-4 pb-3 pt-1 flex items-center justify-center relative z-10">
          <Tabs value={series} onValueChange={setSeries} className="w-[400px]">
            <TabsList className="h-14 grid w-full grid-cols-3 bg-black/40 text-white/70 border border-white/10 shadow-inner backdrop-blur-xs">
              <TabsTrigger value="f1" className="group data-[state=active]:bg-[#E10600] h-12 flex justify-center items-center rounded-sm transition-all duration-300">
                <div className="h-5 w-20 transition-colors duration-300 bg-[#E10600] group-data-[state=active]:bg-white" style={{ maskImage: "url('https://upload.wikimedia.org/wikipedia/commons/3/33/F1.svg')", WebkitMaskImage: "url('https://upload.wikimedia.org/wikipedia/commons/3/33/F1.svg')", maskSize: "contain", WebkitMaskSize: "contain", maskRepeat: "no-repeat", WebkitMaskRepeat: "no-repeat", maskPosition: "center", WebkitMaskPosition: "center" }}></div>
              </TabsTrigger>
              <TabsTrigger value="f2" className="group data-[state=active]:bg-[#0090D0] h-12 flex justify-center items-center rounded-sm transition-all duration-300">
                <div className="h-6 w-20 mb-1 transition-colors duration-300 bg-[#0090D0] group-data-[state=active]:bg-white" style={{ maskImage: "url('https://upload.wikimedia.org/wikipedia/commons/6/64/FIA_Formula_2_Championship_logo_%282026%29.svg')", WebkitMaskImage: "url('https://upload.wikimedia.org/wikipedia/commons/6/64/FIA_Formula_2_Championship_logo_%282026%29.svg')", maskSize: "contain", WebkitMaskSize: "contain", maskRepeat: "no-repeat", WebkitMaskRepeat: "no-repeat", maskPosition: "center", WebkitMaskPosition: "center" }}></div>
              </TabsTrigger>
              <TabsTrigger value="f3" className="group data-[state=active]:bg-[#F9A01B] h-12 flex justify-center items-center rounded-sm transition-all duration-300">
                <div className="h-6 w-20 mb-1 transition-colors duration-300 bg-[#F9A01B] group-data-[state=active]:bg-white" style={{ maskImage: "url('https://upload.wikimedia.org/wikipedia/commons/d/d9/FIA_Formula_3_Championship_logo_%282026%29.svg')", WebkitMaskImage: "url('https://upload.wikimedia.org/wikipedia/commons/d/d9/FIA_Formula_3_Championship_logo_%282026%29.svg')", maskSize: "contain", WebkitMaskSize: "contain", maskRepeat: "no-repeat", WebkitMaskRepeat: "no-repeat", maskPosition: "center", WebkitMaskPosition: "center" }}></div>
              </TabsTrigger>
            </TabsList>
          </Tabs>
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
