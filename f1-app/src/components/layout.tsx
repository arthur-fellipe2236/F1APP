import { useEffect, useState } from "react"
import { Link, NavLink, Outlet } from "react-router-dom"
import { Flag, LayoutDashboard, Map, Radio, Shield, Users } from "lucide-react"

import { api } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const navItems = [
  { to: "/", label: "Painel", icon: LayoutDashboard, end: true },
  { to: "/pilotos", label: "Pilotos", icon: Users },
  { to: "/equipes", label: "Equipes", icon: Shield },
  { to: "/circuitos", label: "Circuitos", icon: Map },
  { to: "/calendario", label: "Calendário", icon: Flag },
  { to: "/live", label: "Ao Vivo", icon: Radio },
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
    return <Badge variant="outline">API: verificando…</Badge>
  }
  if (status === "online") {
    return (
      <Badge variant="secondary" className="gap-1.5">
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
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <span className="flex size-7 items-center justify-center rounded-md bg-foreground text-background">
              <Flag className="size-4" />
            </span>
            F1 App
          </Link>
          <nav className="flex items-center gap-1 overflow-x-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                    isActive && "bg-muted text-foreground",
                  )
                }
              >
                <item.icon className="size-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto hidden sm:block">
            <HealthBadge />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
      <footer className="mx-auto max-w-6xl px-4 pb-8">
        <p className="text-xs text-muted-foreground">
          Dados demonstrativos da temporada 2024 fornecidos pela f1-api.
        </p>
      </footer>
    </div>
  )
}
