import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Radio, ChevronRight, Activity } from "lucide-react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface LiveStatePayload {
  active: boolean
  state: string
  session_name?: string
  meeting_name?: string
}

export function LiveContextBanner({ series = "f1" }: { series?: string }) {
  const [liveInfo, setLiveInfo] = useState<LiveStatePayload | null>(null)

  useEffect(() => {
    let isMounted = true

    api
      .liveState(null, series)
      .then((data) => {
        if (!isMounted) return
        if (data && data.active && (data.state === "live" || data.state === "active")) {
          setLiveInfo(data)
        } else {
          setLiveInfo(null)
        }
      })
      .catch(() => {
        if (isMounted) setLiveInfo(null)
      })

    return () => {
      isMounted = false
    }
  }, [series])

  // Se não houver sessão ativa confirmada, não apresentar falsa indicação de transmissão ao vivo
  if (!liveInfo) {
    return null
  }

  return (
    <aside aria-label="Sessão ao vivo em andamento" className="relative overflow-hidden rounded-xl border border-red-500/40 bg-gradient-to-r from-red-950/50 via-background to-background p-4 shadow-lg backdrop-blur-md">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="relative flex size-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex size-3 rounded-full bg-red-500" />
          </span>
          <Badge variant="destructive" className="bg-red-600 text-white font-bold uppercase tracking-wider text-xs px-2 py-0.5">
            Ao Vivo Agora
          </Badge>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5 truncate">
              <Activity className="size-4 text-red-400 shrink-0" />
              {liveInfo.meeting_name ? `${liveInfo.meeting_name} — ` : ""}
              {liveInfo.session_name || "Sessão Oficial"}
            </h2>
            <p className="text-xs text-muted-foreground">
              Acompanhe a torre de classificação, intervalos e telemetria em tempo real
            </p>
          </div>
        </div>

        <Button asChild size="sm" className="bg-red-600 hover:bg-red-700 text-white font-medium shrink-0 shadow-md">
          <Link to="/live" className="flex items-center gap-1.5">
            <Radio className="size-3.5" />
            <span>Acessar Central Ao Vivo</span>
            <ChevronRight className="size-3.5" />
          </Link>
        </Button>
      </div>
    </aside>
  )
}
