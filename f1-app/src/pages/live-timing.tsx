import { useEffect, useState, useRef, useCallback } from "react"
import { CalendarClock, CloudRain, Wind, Thermometer, Flag, MonitorPlay, AlertTriangle, WifiOff, RefreshCw } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/lib/api"

export interface LiveData {
  session?: {
    name: string
    state: string
    date_start?: string
    date_end?: string
    circuit?: string
    country?: string
    location?: string
    meeting_name?: string
    year?: number
    live?: boolean
  }
  flag?: string | null
  weather?: {
    air_temperature?: number | null
    track_temperature?: number | null
    wind_speed?: number | null
    humidity?: number | null
    rainfall?: number | null
  }
  messages?: Array<{
    date?: string
    message: string
    flag?: string | null
  }>
  drivers?: Array<{
    driver_number: number
    name: string
    code: string
    team: string
    team_colour: string
    position: number | null
    gap_to_leader: number | null
    interval: number | null
    lap_number: number | null
    compound: string | null
    in_pit?: boolean
  }>
  data_status?: "live" | "cached" | "scheduled" | "finished" | "unavailable"
  source_status?: {
    available: boolean
    status_code?: number | null
    reason?: string | null
    message?: string | null
  }
  is_stale?: boolean
  last_valid_update?: string | null
  updated_at?: string
}

const COMPOUND_COLORS: Record<string, string> = {
  SOFT: "bg-red-500 text-white",
  MEDIUM: "bg-yellow-400 text-black",
  HARD: "bg-white text-black",
  INTERMEDIATE: "bg-green-500 text-white",
  WET: "bg-blue-500 text-white"
}

function formatSessionDate(dateStr?: string | null): string {
  if (!dateStr) return "Horário a confirmar"
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return "Horário a confirmar"
  return `${d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })} (horário local)`
}

function formatLocalTime(dateStr?: string | null): string {
  if (!dateStr) return "--:--"
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return "--:--"
  return `${d.toLocaleTimeString("pt-BR")} (horário local)`
}

const LIVE_POLL_INTERVAL_MS = 15_000
const SCHEDULED_POLL_INTERVAL_MS = 60_000
const FINISHED_POLL_INTERVAL_MS = 120_000
const BACKOFF_INTERVALS_MS = [15_000, 30_000, 60_000, 120_000]

export function LiveTimingPage() {
  const [liveData, setLiveData] = useState<LiveData | null>(null)
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null)
  const [fetchStatus, setFetchStatus] = useState<"loading" | "success" | "error">("loading")
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pollIntervalMs, setPollIntervalMs] = useState<number>(LIVE_POLL_INTERVAL_MS)

  const inFlightRef = useRef(false)
  const isMountedRef = useRef(true)
  const abortControllerRef = useRef<AbortController | null>(null)
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const failuresRef = useRef(0)

  const scheduleNextPoll = useCallback((delayMs: number) => {
    if (!isMountedRef.current) return
    if (pollTimerRef.current !== null) {
      clearTimeout(pollTimerRef.current)
      pollTimerRef.current = null
    }
    pollTimerRef.current = setTimeout(() => {
      fetchLiveData(false)
    }, delayMs)
  }, [])

  const fetchLiveData = useCallback(async (isManual = false) => {
    if (inFlightRef.current) {
      return
    }

    if (pollTimerRef.current !== null) {
      clearTimeout(pollTimerRef.current)
      pollTimerRef.current = null
    }

    if (isManual) {
      setIsRefreshing(true)
    }

    inFlightRef.current = true
    const controller = new AbortController()
    abortControllerRef.current = controller

    let nextInterval = LIVE_POLL_INTERVAL_MS

    try {
      const data = await api.liveTower(null, { signal: controller.signal })
      if (!isMountedRef.current) return

      setLastCheckTime(new Date())

      if (data && data.session) {
        setLiveData(data as any)
        setFetchStatus("success")
        setErrorMessage(null)

        const isStaleData = Boolean(
          data.is_stale || (data.source_status && !data.source_status.available)
        )

        if (isStaleData) {
          failuresRef.current += 1
          const backoffIdx = Math.min(failuresRef.current - 1, BACKOFF_INTERVALS_MS.length - 1)
          nextInterval = BACKOFF_INTERVALS_MS[backoffIdx]
        } else {
          failuresRef.current = 0
          const sessionState = data.session.state
          const dataStatus = data.data_status
          if (sessionState === "live" && dataStatus === "live") {
            nextInterval = LIVE_POLL_INTERVAL_MS
          } else if (sessionState === "finished" || dataStatus === "finished") {
            nextInterval = FINISHED_POLL_INTERVAL_MS
          } else {
            nextInterval = SCHEDULED_POLL_INTERVAL_MS
          }
        }
      }
    } catch (error: any) {
      if (error?.name === "AbortError") {
        return
      }
      if (!isMountedRef.current) return

      setLastCheckTime(new Date())
      console.warn("Live telemetry check:", error)
      setFetchStatus("error")
      const msg =
        error?.details?.message ||
        error?.message ||
        "Não foi possível conectar aos servidores de telemetria da F1."
      setErrorMessage(msg)

      failuresRef.current += 1
      const backoffIdx = Math.min(failuresRef.current - 1, BACKOFF_INTERVALS_MS.length - 1)
      nextInterval = BACKOFF_INTERVALS_MS[backoffIdx]
    } finally {
      inFlightRef.current = false
      abortControllerRef.current = null

      if (isMountedRef.current) {
        if (isManual) setIsRefreshing(false)
        setPollIntervalMs(nextInterval)
        scheduleNextPoll(nextInterval)
      }
    }
  }, [scheduleNextPoll])

  useEffect(() => {
    isMountedRef.current = true
    fetchLiveData(false)

    return () => {
      isMountedRef.current = false
      if (pollTimerRef.current !== null) {
        clearTimeout(pollTimerRef.current)
        pollTimerRef.current = null
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
    }
  }, [fetchLiveData])

  useEffect(() => {
    const session = liveData?.session
    if (!session) return

    const targetDate =
      session.state === "scheduled"
        ? session.date_start
        : session.state === "live"
        ? session.date_end
        : null

    if (targetDate) {
      const interval = setInterval(() => {
        const target = new Date(targetDate).getTime()
        const now = new Date().getTime()
        const distance = target - now

        if (distance < 0) {
          setTimeLeft(null)
          clearInterval(interval)
        } else {
          setTimeLeft({
            days: Math.floor(distance / (1000 * 60 * 60 * 24)),
            hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((distance % (1000 * 60)) / 1000),
          })
        }
      }, 1000)
      return () => clearInterval(interval)
    } else {
      setTimeLeft(null)
    }
  }, [liveData?.session?.state, liveData?.session?.date_start, liveData?.session?.date_end])

  const getFlagColor = (flag?: string | null) => {
    if (!flag) return "bg-gray-500/20 text-gray-400 border-gray-500/50"
    const f = flag.toUpperCase()
    if (f === "CLEAR" || f === "GREEN") return "bg-green-500/20 text-green-400 border-green-500/50"
    if (f.includes("YELLOW")) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
    if (f.includes("RED")) return "bg-red-500/20 text-red-400 border-red-500/50"
    if (f.includes("AGENDADA") || f.includes("PRE-SESSION")) return "bg-blue-500/20 text-blue-400 border-blue-500/50"
    return "bg-blue-500/20 text-blue-400 border-blue-500/50"
  }

  const isStale = Boolean(liveData?.is_stale || (fetchStatus === "error" && liveData !== null))
  const isFinished = liveData?.session?.state === "finished" || liveData?.data_status === "finished"
  const isLiveConfirmed = Boolean(
    !isStale &&
    fetchStatus === "success" &&
    liveData?.session?.state === "live" &&
    liveData?.data_status === "live" &&
    (liveData?.source_status ? liveData.source_status.available : true)
  )
  const isLive = isLiveConfirmed

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <PageHeader
        title="Ao Vivo"
        description="Central de telemetria integrada e dados do circuito em tempo real."
      />

      {/* STATUS DA CONEXÃO / AVISO DE DADOS DESATUALIZADOS */}
      {isStale && (
        <div className="mx-auto w-full max-w-6xl mb-2 animate-in fade-in duration-300">
          <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs sm:text-sm backdrop-blur-md">
            <div className="flex items-center gap-2.5 min-w-0">
              <AlertTriangle className="size-4 shrink-0 text-amber-400 animate-pulse" />
              <div className="truncate">
                <strong className="font-bold">Dados desatualizados:</strong>{" "}
                <span>
                  {liveData?.source_status?.message || errorMessage || "Fonte de telemetria externa temporariamente restrita ou indisponível."}{" "}
                </span>
                {liveData?.last_valid_update && (
                  <span className="text-zinc-400 hidden sm:inline">
                    (Última medição válida: {formatLocalTime(liveData.last_valid_update)})
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => fetchLiveData(true)}
              disabled={isRefreshing}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
            >
              <RefreshCw className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Reconectar</span>
            </button>
          </div>
        </div>
      )}

      {/* BARRA DE STATUS NORMAL */}
      {liveData && !isStale && fetchStatus === "success" && (
        <div className="mx-auto w-full max-w-6xl -mt-2 mb-2 flex items-center justify-between text-xs text-muted-foreground px-1">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              {isLiveConfirmed && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-emerald-400" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isLiveConfirmed
                    ? "bg-emerald-500"
                    : isFinished
                    ? "bg-zinc-500"
                    : "bg-blue-500"
                }`}
              />
            </span>
            <span>
              {isLiveConfirmed
                ? "Telemetria ao vivo conectada"
                : isFinished
                ? "Sessão encerrada"
                : "Sessão agendada"} • Última verificação:{" "}
              {lastCheckTime ? lastCheckTime.toLocaleTimeString("pt-BR") : "--:--:--"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-zinc-500">
              {pollIntervalMs >= 60_000
                ? `Atualização a cada ${Math.round(pollIntervalMs / 60_000)} min`
                : `Atualização a cada ${Math.round(pollIntervalMs / 1000)}s`}
            </span>
            <button
              type="button"
              onClick={() => fetchLiveData(true)}
              disabled={isRefreshing}
              className="text-zinc-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
              title="Atualizar agora"
            >
              <RefreshCw className={`size-3 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      )}

      {/* ESTADO VAZIO INFORMATIVO: FONTE INDISPONÍVEL E SEM DADOS EM MEMÓRIA */}
      {fetchStatus === "error" && !liveData && (
        <div className="mx-auto w-full max-w-6xl mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="border-amber-500/40 bg-card/60 backdrop-blur-md p-8 sm:p-12 text-center shadow-2xl">
            <div className="flex flex-col items-center justify-center max-w-xl mx-auto gap-4">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <WifiOff className="size-10 sm:size-12" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Telemetria Ao Vivo Temporariamente Indisponível
                </h2>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  {errorMessage || "Não foi possível estabelecer conexão com os servidores externos de telemetria da F1."}
                </p>
                <p className="text-xs text-muted-foreground">
                  A fonte comunitária (OpenF1) restringe chamadas durante certas sessões oficiais ou pode estar temporariamente inoperante. O aplicativo continuará tentando a conexão automaticamente a cada 15 segundos.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => fetchLiveData(true)}
                  disabled={isRefreshing}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm flex items-center gap-2 transition-all shadow-lg active:scale-95 cursor-pointer"
                >
                  <RefreshCw className={`size-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  {isRefreshing ? "Tentando reconectar..." : "Tentar novamente agora"}
                </button>
                <a
                  href="/calendario"
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm transition-all border border-white/10"
                >
                  Ver Calendário
                </a>
                <a
                  href="/circuitos"
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm transition-all border border-white/10"
                >
                  Resultados Históricos
                </a>
              </div>

              {lastCheckTime && (
                <div className="text-[11px] text-zinc-500 mt-2">
                  Última tentativa realizada às {lastCheckTime.toLocaleTimeString("pt-BR")}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* CARREGAMENTO INICIAL */}
      {fetchStatus === "loading" && !liveData && (
        <div className="mx-auto w-full max-w-6xl py-16 text-center text-muted-foreground animate-pulse">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="size-8 animate-spin text-blue-400 opacity-75" />
            <span className="text-sm font-medium">Carregando telemetria da Fórmula 1...</span>
          </div>
        </div>
      )}

      {/* RACE WEEK / PROXIMA SESSAO BANNER */}
      {!isLive && liveData?.session && (
        <div className="mx-auto w-full max-w-6xl mb-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-zinc-900/60 to-blue-950/40 border border-blue-500/30 backdrop-blur-md shadow-lg">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
                <CalendarClock className="size-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    {liveData.session.meeting_name
                      ? `Próxima Race Week • ${liveData.session.meeting_name}`
                      : "Próxima Sessão Agendada"}
                  </span>
                </div>
                <h3 className="text-xl md:text-2xl font-black text-white mt-1">
                  {liveData.session.name}
                  {liveData.session.circuit ? ` — ${liveData.session.circuit}` : ""}
                </h3>
                <p className="text-sm text-zinc-400 mt-0.5">
                  {formatSessionDate(liveData.session.date_start)}
                </p>
              </div>
            </div>
            {(liveData.session.location || liveData.session.country) && (
              <div className="text-right hidden md:block">
                <div className="text-xs text-zinc-400 font-medium">Circuito</div>
                <div className="text-base font-bold text-zinc-200">
                  {[liveData.session.location, liveData.session.country].filter(Boolean).join(", ")}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CLOCK SECTION */}
      {timeLeft && (
        <div className="mx-auto w-full max-w-6xl mb-4">
          <Card
            className={`border-border/50 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-700 ${
              isLive
                ? "bg-red-950/20 shadow-[0_0_30px_-5px_rgba(239,68,68,0.3)] border-red-500/30"
                : "bg-blue-950/20 shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)] border-blue-500/50"
            }`}
          >
            <CardHeader className="text-center pb-2">
              <CardTitle
                className={`text-2xl flex justify-center items-center gap-2 ${
                  isLive ? "text-red-400" : "text-blue-400"
                }`}
              >
                <CalendarClock className={`size-6 ${isLive ? "animate-pulse" : ""}`} />
                {isLive
                  ? "Sessão Termina Em:"
                  : liveData?.session?.name
                  ? `Próxima Sessão (${liveData.session.name}) Começa Em:`
                  : "Próxima Sessão Começa Em:"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center items-center gap-1.5 sm:gap-4 md:gap-8 flex-nowrap">
                {timeLeft.days > 0 && (
                  <>
                    <div className="flex flex-col items-center">
                      <span className="text-4xl sm:text-5xl md:text-7xl font-black tabular-nums tracking-tighter text-white drop-shadow-md">
                        {timeLeft.days.toString().padStart(2, "0")}
                      </span>
                      <span
                        className={`text-xs sm:text-sm ${
                          isLive ? "text-red-400" : "text-blue-400"
                        } font-medium uppercase tracking-widest mt-2`}
                      >
                        Dias
                      </span>
                    </div>
                    <span
                      className={`text-3xl sm:text-5xl md:text-7xl font-black mb-4 sm:mb-6 ${
                        isLive ? "text-red-500/50" : "text-blue-500/50"
                      }`}
                    >
                      :
                    </span>
                  </>
                )}
                <div className="flex flex-col items-center">
                  <span className="text-4xl sm:text-5xl md:text-7xl font-black tabular-nums tracking-tighter text-white drop-shadow-md">
                    {timeLeft.hours.toString().padStart(2, "0")}
                  </span>
                  <span
                    className={`text-xs sm:text-sm ${
                      isLive ? "text-red-400" : "text-blue-400"
                    } font-medium uppercase tracking-widest mt-2`}
                  >
                    Horas
                  </span>
                </div>
                <span
                  className={`text-3xl sm:text-5xl md:text-7xl font-black mb-4 sm:mb-6 ${
                    isLive ? "text-red-500/50" : "text-blue-500/50"
                  }`}
                >
                  :
                </span>
                <div className="flex flex-col items-center">
                  <span className="text-4xl sm:text-5xl md:text-7xl font-black tabular-nums tracking-tighter text-white drop-shadow-md">
                    {timeLeft.minutes.toString().padStart(2, "0")}
                  </span>
                  <span
                    className={`text-xs sm:text-sm ${
                      isLive ? "text-red-400" : "text-blue-400"
                    } font-medium uppercase tracking-widest mt-2`}
                  >
                    Minutos
                  </span>
                </div>
                <span
                  className={`text-3xl sm:text-5xl md:text-7xl font-black mb-4 sm:mb-6 ${
                    isLive ? "text-red-500/50" : "text-blue-500/50"
                  }`}
                >
                  :
                </span>
                <div className="flex flex-col items-center">
                  <span className="text-4xl sm:text-5xl md:text-7xl font-black tabular-nums tracking-tighter text-white drop-shadow-md">
                    {timeLeft.seconds.toString().padStart(2, "0")}
                  </span>
                  <span
                    className={`text-xs sm:text-sm ${
                      isLive ? "text-red-400" : "text-blue-400"
                    } font-medium uppercase tracking-widest mt-2`}
                  >
                    Segundos
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* NATIVE WIDGETS SECTION */}
      {liveData && (
        <div className="mx-auto mt-4 grid w-full max-w-6xl grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <Card className="border-border/50 bg-card/40 backdrop-blur-sm shadow-xl flex flex-col h-full">
            <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
              <CardTitle className="text-lg flex items-center gap-2">
                <Flag className="size-5 text-muted-foreground" />
                Status da Pista
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center items-center py-8">
              <div
                className={`px-8 py-3 rounded-xl border-2 font-black text-2xl tracking-widest shadow-lg ${getFlagColor(
                  liveData?.flag
                )}`}
              >
                {liveData?.flag || "AGENDADA"}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/40 backdrop-blur-sm shadow-xl flex flex-col h-full">
            <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
              <CardTitle className="text-lg flex items-center gap-2">
                <CloudRain className="size-5 text-muted-foreground" />
                Condições Climáticas
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 py-6">
              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Thermometer className="size-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground font-medium">Ar</div>
                    <div className="text-lg font-bold tabular-nums">
                      {liveData?.weather?.air_temperature !== null && liveData?.weather?.air_temperature !== undefined
                        ? `${liveData.weather.air_temperature}°C`
                        : "-- °C"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/10 rounded-lg">
                    <Thermometer className="size-5 text-orange-400" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground font-medium">Pista</div>
                    <div className="text-lg font-bold tabular-nums">
                      {liveData?.weather?.track_temperature !== null && liveData?.weather?.track_temperature !== undefined
                        ? `${liveData.weather.track_temperature}°C`
                        : "-- °C"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-500/10 rounded-lg">
                    <Wind className="size-5 text-slate-400" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground font-medium">Vento</div>
                    <div className="text-lg font-bold tabular-nums">
                      {liveData?.weather?.wind_speed !== null && liveData?.weather?.wind_speed !== undefined
                        ? `${liveData.weather.wind_speed} km/h`
                        : "-- km/h"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-500/10 rounded-lg">
                    <CloudRain className="size-5 text-cyan-400" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground font-medium">Umidade</div>
                    <div className="text-lg font-bold tabular-nums">
                      {liveData?.weather?.humidity !== null && liveData?.weather?.humidity !== undefined
                        ? `${liveData.weather.humidity}%`
                        : "-- %"}
                    </div>
                  </div>
                </div>
              </div>

              {(!liveData?.weather ||
                (liveData.weather.air_temperature === null &&
                  liveData.weather.track_temperature === null &&
                  liveData.weather.wind_speed === null &&
                  liveData.weather.humidity === null)) && (
                <div className="text-center text-xs text-muted-foreground italic mt-5 pt-3 border-t border-border/40">
                  Aguardando dados meteorológicos da sessão
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/40 backdrop-blur-sm shadow-xl flex flex-col h-full">
            <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
              <CardTitle className="text-lg flex items-center gap-2">
                <MonitorPlay className="size-5 text-muted-foreground" />
                Race Control
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto max-h-[220px] py-4 pr-2 custom-scrollbar">
              <div className="flex flex-col gap-3">
                {(!liveData?.messages || liveData.messages.length === 0) && (
                  <div className="text-center text-muted-foreground text-sm italic mt-8">
                    Nenhuma mensagem oficial da Direção de Prova ainda.
                  </div>
                )}
                {liveData?.messages?.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg text-sm font-medium border-l-4 ${
                      msg.flag === "RED"
                        ? "bg-red-500/10 border-red-500 text-red-200"
                        : msg.flag === "YELLOW"
                        ? "bg-yellow-500/10 border-yellow-500 text-yellow-200"
                        : "bg-muted/50 border-blue-500 text-zinc-300"
                    }`}
                  >
                    {msg.message}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TIMING TOWER / STANDBY BANNER */}
      {liveData && (liveData.drivers && liveData.drivers.length > 0 ? (
        <div className="mx-auto w-full max-w-6xl mt-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <Card className="border-border/50 bg-card/40 backdrop-blur-md shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 p-3 text-center text-sm font-bold border-b border-border/50 tracking-widest text-zinc-300">
              TORRE DE TEMPOS OFICIAL
            </div>
            <div className="w-full overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="text-xs uppercase bg-white/5 text-muted-foreground">
                  <tr>
                    <th className="px-3 sm:px-4 py-3 font-semibold w-12 text-center sticky left-0 z-20 bg-muted/95 backdrop-blur-xs border-r border-border/40">
                      Pos
                    </th>
                    <th className="px-3 sm:px-4 py-3 font-semibold sticky left-12 z-20 bg-muted/95 backdrop-blur-xs border-r border-border/40 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.15)]">
                      Piloto
                    </th>
                    <th className="px-4 py-3 font-semibold text-center">Pneu</th>
                    <th className="px-4 py-3 font-semibold text-right">Gap</th>
                    <th className="px-4 py-3 font-semibold text-right">Intervalo</th>
                    <th className="px-4 py-3 font-semibold text-center w-16">Volta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {liveData.drivers.map((driver) => (
                    <tr key={driver.driver_number} className="hover:bg-muted/40 transition-colors group">
                      <td className="px-3 sm:px-4 py-2 text-center font-bold sticky left-0 z-10 bg-card group-hover:bg-muted border-r border-border/40 transition-colors">
                        {driver.position || "-"}
                      </td>
                      <td className="px-3 sm:px-4 py-2 font-medium flex items-center gap-2 sm:gap-3 sticky left-12 z-10 bg-card group-hover:bg-muted border-r border-border/40 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.15)] transition-colors">
                        <span
                          className="w-1 h-4 rounded-full shrink-0"
                          style={{ backgroundColor: `#${driver.team_colour}` }}
                        ></span>
                        <span className="w-5 sm:w-6 text-muted-foreground font-mono text-xs sm:text-sm shrink-0">
                          {driver.driver_number}
                        </span>
                        <span className="font-bold flex items-center gap-1.5 truncate max-w-[130px] sm:max-w-none">
                          {driver.name}
                          {driver.in_pit && (
                            <span
                              className="bg-white text-black px-1 rounded-sm text-[9px] font-black tracking-widest leading-none py-0.5"
                              title="No Pitlane"
                            >
                              P
                            </span>
                          )}
                        </span>
                        <span className="text-[11px] sm:text-xs text-muted-foreground uppercase hidden sm:inline">
                          {driver.team}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        {driver.compound ? (
                          <span
                            className={`px-2 py-0.5 rounded-sm text-[10px] font-black tracking-widest uppercase ${
                              COMPOUND_COLORS[driver.compound] || "bg-zinc-700 text-white"
                            }`}
                          >
                            {driver.compound}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right font-mono tabular-nums">
                        {driver.gap_to_leader !== null && driver.gap_to_leader !== undefined
                          ? typeof driver.gap_to_leader === "number"
                            ? `+${driver.gap_to_leader.toFixed(3)}s`
                            : String(driver.gap_to_leader)
                          : "PIT"}
                      </td>
                      <td className="px-4 py-2 text-right font-mono tabular-nums text-muted-foreground">
                        {driver.interval !== null && driver.interval !== undefined
                          ? typeof driver.interval === "number"
                            ? `+${driver.interval.toFixed(3)}s`
                            : String(driver.interval)
                          : "-"}
                      </td>
                      <td className="px-4 py-2 text-center font-mono tabular-nums">
                        {driver.lap_number || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : (
        <div className="mx-auto w-full max-w-6xl mt-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <Card className="border-border/50 bg-card/40 backdrop-blur-md p-8 text-center shadow-xl">
            <div className="flex flex-col items-center justify-center gap-2">
              {isStale ? (
                <>
                  <AlertTriangle className="size-8 text-amber-400 opacity-90 mb-1 animate-pulse" />
                  <div className="text-base font-semibold text-amber-200">
                    Modo de contingência — dados em cache
                  </div>
                  <p className="text-sm text-zinc-400 max-w-lg">
                    {liveData?.source_status?.message || "A fonte de telemetria externa está temporariamente indisponível. Exibindo última leitura válida em cache."}
                  </p>
                </>
              ) : liveData?.source_status && !liveData.source_status.available ? (
                <>
                  <AlertTriangle className="size-8 text-amber-400 opacity-90 mb-1" />
                  <div className="text-base font-semibold text-amber-200">
                    Telemetria externa temporariamente indisponível
                  </div>
                  <p className="text-sm text-zinc-400 max-w-lg">
                    {liveData?.source_status?.message || "Acesso à telemetria externa restrito durante a sessão oficial. Aguardando restabelecimento da conexão."}
                  </p>
                </>
              ) : isLive ? (
                <>
                  <MonitorPlay className="size-8 text-emerald-400 opacity-90 mb-1 animate-pulse" />
                  <div className="text-base font-semibold text-zinc-100">
                    Sessão no período oficial — aguardando voltas registradas na telemetria
                  </div>
                  <p className="text-sm text-zinc-400 max-w-lg">
                    A sessão encontra-se no período oficial programado. A torre de tempos será atualizada assim que os tempos de volta forem registrados na telemetria.
                  </p>
                </>
              ) : isFinished ? (
                <>
                  <Flag className="size-8 text-zinc-400 opacity-80 mb-1" />
                  <div className="text-base font-semibold text-zinc-200">
                    Sessão encerrada
                  </div>
                  <p className="text-sm text-muted-foreground max-w-lg">
                    As atividades de pista desta sessão foram finalizadas.
                  </p>
                </>
              ) : (
                <>
                  <CalendarClock className="size-8 text-blue-400 opacity-80 mb-1" />
                  <div className="text-base font-semibold text-zinc-200">
                    {liveData?.session?.name
                      ? `Sessão agendada: ${liveData.session.name}`
                      : "Sessão agendada"}
                  </div>
                  <p className="text-sm text-muted-foreground max-w-lg">
                    {(() => {
                      const formattedDate = formatSessionDate(liveData?.session?.date_start)
                      if (formattedDate === "Horário a confirmar") {
                        return "Aguardando confirmação do horário de início das atividades oficiais da sessão."
                      }
                      return `As atividades de pista para o ${liveData?.session?.meeting_name || "evento"}${liveData?.session?.circuit ? ` no circuito ${liveData.session.circuit}` : ""} estão programadas para iniciar em ${formattedDate}.`
                    })()}
                  </p>
                </>
              )}
            </div>
          </Card>
        </div>
      ))}
    </div>
  )
}