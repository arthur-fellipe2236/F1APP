import { useEffect, useState, useCallback } from "react"
import { api, type NextRace, type LiveTower } from "@/lib/api"
import { formatSessionDateTime } from "@/lib/datetime"
import { useAppStore } from "@/store"
import { cn } from "@/lib/utils"

export function CockpitTicker() {
  const { series } = useAppStore()
  const [nextRace, setNextRace] = useState<NextRace | null>(null)
  const [liveTower, setLiveTower] = useState<LiveTower | null>(null)
  const [latencyMs, setLatencyMs] = useState<number | null>(null)
  const [apiStatus, setApiStatus] = useState<"healthy" | "unstable" | "offline">("healthy")
  const [isRadioPlaying, setIsRadioPlaying] = useState(false)
  const [isRadioLoading, setIsRadioLoading] = useState(false)

  // Medição da latência real da aplicação (sem valores fictícios)
  const checkLatency = useCallback(async () => {
    const t0 = performance.now()
    try {
      await api.health()
      const diff = Math.round(performance.now() - t0)
      setLatencyMs(diff)
      if (diff < 200) {
        setApiStatus("healthy")
      } else {
        setApiStatus("unstable")
      }
    } catch {
      setLatencyMs(null)
      setApiStatus("offline")
    }
  }, [])

  // Carrega status da sessão e telemetria sincronizados com a categoria selecionada
  useEffect(() => {
    let mounted = true

    const loadData = async () => {
      try {
        const racePromise =
          series === "f2" ? api.nextF2Race() : series === "f3" ? api.nextF3Race() : api.nextRace()

        const [nr, lt] = await Promise.allSettled([
          racePromise,
          api.liveTower(undefined, { series }),
        ])
        if (!mounted) return

        if (nr.status === "fulfilled") {
          setNextRace(nr.value)
        }
        if (lt.status === "fulfilled") {
          setLiveTower(lt.value)
        }
      } catch {
        // silencioso para não interromper navegação
      }
    }

    loadData()
    checkLatency()

    const intervalId = window.setInterval(() => {
      checkLatency()
    }, 45000)

    return () => {
      mounted = false
      window.clearInterval(intervalId)
    }
  }, [checkLatency, series])

  // Escuta o estado da Rádio Mariana emitido pelo radio-player.tsx
  useEffect(() => {
    const handleRadioState = (e: Event) => {
      const custom = e as CustomEvent<{ isPlaying: boolean; isLoading: boolean }>
      if (custom.detail) {
        setIsRadioPlaying(Boolean(custom.detail.isPlaying))
        setIsRadioLoading(Boolean(custom.detail.isLoading))
      }
    }

    window.addEventListener("f1app:radio-state", handleRadioState)
    return () => {
      window.removeEventListener("f1app:radio-state", handleRadioState)
    }
  }, [])

  // Dispara evento para alternar a Rádio Mariana
  const toggleRadio = () => {
    window.dispatchEvent(new CustomEvent("f1app:toggle-radio"))
  }

  const isLive = liveTower?.session?.live ?? false
  const currentLap = liveTower?.current_lap

  // Nome e local da sessão
  const isOffseason = Boolean(nextRace?.offseason)
  const sessionName = isLive
    ? liveTower?.session?.name || `${series.toUpperCase()} EM PISTA`
    : isOffseason
    ? nextRace?.message || `Temporada ${series.toUpperCase()} em Pausa`
    : nextRace?.name || `GP ${series.toUpperCase()}`

  const circuitName = nextRace?.circuit || nextRace?.location || ""

  // Volta mais rápida real vinda da telemetria
  const fastestLapDriver = liveTower?.drivers?.find((d) => d.last_lap && d.last_lap > 0)
  const fastestLapDisplay = fastestLapDriver?.last_lap ? `${fastestLapDriver.code || fastestLapDriver.name.slice(0, 3)} ${fastestLapDriver.last_lap.toFixed(3)}s` : null

  const seriesColor =
    series === "f2"
      ? "bg-[#0090D0] text-white shadow-[0_0_10px_rgba(0,144,208,0.5)]"
      : series === "f3"
      ? "bg-[#F9A01B] text-black shadow-[0_0_10px_rgba(249,160,27,0.5)]"
      : "bg-[#E10600] text-white shadow-[0_0_10px_rgba(225,6,0,0.5)]"

  return (
    <div 
      className="w-full bg-[#07080c]/95 border-b border-white/10 backdrop-blur-md text-white select-none relative z-50 h-7 sm:h-8 flex items-center px-2.5 sm:px-4 text-[10px] sm:text-xs font-mono transition-colors"
      role="region"
      aria-label="Cockpit Live Ticker"
    >
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-2 overflow-hidden">
        {/* BLOCO 1: STATUS DA SESSÃO E BADGE DA CATEGORIA */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 shrink">
          {/* Badge Oficial da Categoria Ativa */}
          <span className={cn(
            "px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-black uppercase tracking-wider shrink-0",
            seriesColor
          )}>
            {series.toUpperCase()}
          </span>

          {isLive ? (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#E10600] text-white font-extrabold uppercase text-[9px] sm:text-[10px] tracking-wider animate-pulse shrink-0">
              <span className="size-1.5 rounded-full bg-white" />
              AO VIVO
            </span>
          ) : isOffseason ? (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/10 text-zinc-400 font-bold uppercase text-[9px] sm:text-[10px] tracking-wider shrink-0">
              STANDBY
            </span>
          ) : (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/10 text-white/80 font-bold uppercase text-[9px] sm:text-[10px] tracking-wider shrink-0">
              PRÓXIMA ETAPA
            </span>
          )}

          <div className="truncate text-white/90 font-medium">
            <span className="font-bold text-white uppercase tracking-wide">
              {sessionName}
            </span>
            {circuitName && !isOffseason && (
              <span className="text-white/50 hidden xs:inline">
                {" "}· {circuitName}
              </span>
            )}
            {isLive && currentLap != null && (
              <span className="text-[#00F2FE] font-bold ml-1.5">
                · VOLTA {currentLap}
              </span>
            )}
            {!isLive && !isOffseason && nextRace?.race_start && (
              <span className="text-white/60 text-[9px] sm:text-[10px] ml-1.5 hidden sm:inline">
                · {formatSessionDateTime(nextRace.race_start)}
              </span>
            )}
          </div>
        </div>

        {/* BLOCO 2: MELHOR VOLTA REAL (DESKTOP) */}
        <div className="hidden lg:flex items-center gap-2 text-white/70 border-x border-white/10 px-3 shrink-0">
          <span className="text-white/40 font-semibold text-[10px]">VOLTA RÁPIDA:</span>
          {fastestLapDisplay ? (
            <span className="font-bold text-[#c084fc] flex items-center gap-1">
              <span>⚡</span> {fastestLapDisplay}
            </span>
          ) : (
            <span className="font-mono text-white/40">--:--.---</span>
          )}
        </div>

        {/* BLOCO 3 & 4: RÁDIO MARIANA ON-AIR & LATÊNCIA DA API */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Rádio Mariana On-Air — Gatilho Integrado */}
          <button
            type="button"
            onClick={toggleRadio}
            className={cn(
              "flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 rounded-full border transition-all cursor-pointer font-sans text-[9px] sm:text-[10px] font-bold tracking-wide",
              isRadioPlaying
                ? "bg-[#E10600]/20 border-[#E10600] text-white shadow-[0_0_10px_rgba(225,6,0,0.5)]"
                : "bg-white/5 border-white/15 text-white/75 hover:text-white hover:bg-white/10 hover:border-white/25"
            )}
            title="Abrir ou controlar a Rádio Mariana Oficial"
            aria-label="Controle da Rádio Mariana Oficial"
          >
            <span 
              className={cn(
                "size-1.5 rounded-full shrink-0",
                isRadioPlaying ? "bg-[#E10600] animate-ping" : isRadioLoading ? "bg-amber-400 animate-spin" : "bg-emerald-400"
              )} 
            />
            <span className="uppercase whitespace-nowrap">
              {isRadioPlaying ? "Mariana On-Air" : "Rádio Mariana"}
            </span>
          </button>

          {/* Indicador Real de Latência da Aplicação */}
          <div 
            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/40 border border-white/10 text-[9px] sm:text-[10px]"
            title={`Latência real com a API: ${latencyMs != null ? `${latencyMs}ms` : "Indisponível"}`}
          >
            <span 
              className={cn(
                "size-1.5 rounded-full",
                apiStatus === "healthy" ? "bg-emerald-400" : apiStatus === "unstable" ? "bg-amber-400" : "bg-rose-500"
              )} 
            />
            <span className="font-mono text-white/80">
              {latencyMs != null ? `${latencyMs}ms` : "OFFLINE"}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
