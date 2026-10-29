import { useAppStore } from "@/store"
import { SeasonSelector } from "@/components/season-selector"
import { SeriesSelector } from "@/components/series-selector"
import { useState, useMemo, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import type { TableColumn } from "react-data-table-component"
import { CalendarDays, Clock, MapPin, Flag } from "lucide-react"

import { VirtualDataTable } from "@/components/virtual-table"
import { ErrorState } from "@/components/error-state"
import { PageHeader } from "@/components/page-header"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useApi } from "@/hooks/use-api"
import { useSeasons } from "@/hooks/use-seasons"
import { api, fetchAll, type Race } from "@/lib/api"
import { CountryFlag } from "@/components/flag"
import { formatDate } from "@/lib/format"
import { NEXT_RACE_POLL_MS } from "@/lib/request-gate"

function NextRaceHero({ season, series }: { season: number | undefined, series: string }) {
  const [countdown, setCountdown] = useState<string>("")
  const [nowMs, setNowMs] = useState<number>(() => Date.now())

  const sessionsQuery = useApi(
    () => (season ? api.liveSessions(season, series) : Promise.resolve({ year: 0, data: [] })),
    [season, series],
    season ? NEXT_RACE_POLL_MS : false,
  )

  const { nextMeeting, nextSession } = useMemo(() => {
    const meetings = sessionsQuery.data?.data ?? []
    if (meetings.length === 0) return { nextMeeting: null, nextSession: null }
    const upcoming = meetings.find((m: any) => new Date(m.date_end).getTime() > nowMs)
    if (!upcoming) return { nextMeeting: null, nextSession: null }
    const nextS = upcoming.sessions?.find(
      (s: any) => new Date(s.date_end || s.date_start).getTime() > nowMs,
    )
    return {
      nextMeeting: upcoming,
      nextSession: nextS || upcoming.sessions?.[upcoming.sessions.length - 1] || null,
    }
  }, [sessionsQuery.data, nowMs])

  useEffect(() => {
    if (!nextSession) return
    const target = new Date(nextSession.date_start).getTime()
    const endTarget = new Date(nextSession.date_end || nextSession.date_start).getTime()

    const tick = () => {
      const current = Date.now()
      if (current >= endTarget) {
        setNowMs(current)
        return
      }
      const distance = target - current
      if (distance < 0) {
        setCountdown("Sessão em andamento!")
        return
      }
      const days = Math.floor(distance / (1000 * 60 * 60 * 24))
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((distance % (1000 * 60)) / 1000)

      const d = days > 0 ? `${days}d ` : ""
      const h = hours.toString().padStart(2, "0")
      const m = minutes.toString().padStart(2, "0")
      const s = seconds.toString().padStart(2, "0")
      setCountdown(`${d}${h}:${m}:${s}`)
    }

    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [nextSession])

  if (!nextMeeting) return null

  return (
    <Card className="mb-6 border-red-500/20 bg-gradient-to-br from-red-950/40 to-black/40 overflow-hidden relative">
      <div className="absolute right-0 top-0 opacity-10 pointer-events-none translate-x-1/4 -translate-y-1/4">
        <Flag className="size-64" />
      </div>
      <CardHeader className="pb-2">
        <CardDescription className="text-red-400 font-bold tracking-widest uppercase text-xs">
          Próxima Etapa {series !== "f1" ? `(${series.toUpperCase()})` : ""}
        </CardDescription>
        <CardTitle className="text-3xl font-black flex items-center gap-3">
          <CountryFlag country={nextMeeting.country} className="h-6 w-9 rounded-sm" />
          {nextMeeting.meeting_name}
        </CardTitle>
        <div className="flex items-center gap-2 text-muted-foreground mt-1 text-sm">
          <MapPin className="size-4" />
          {nextMeeting.circuit}, {nextMeeting.country}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mt-4">
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <CalendarDays className="size-4" /> 
              Horários (Seu Fuso Local)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {nextMeeting.sessions?.map((s: any) => {
                const sKey = s.key || s.session_key
                return (
                  <div key={sKey} className={`text-xs p-2 rounded border ${sKey === (nextSession?.key || nextSession?.session_key) ? 'bg-red-500/20 border-red-500/50 text-white' : 'bg-white/5 border-white/10 text-muted-foreground'}`}>
                    <div className="font-bold mb-1">{s.name || s.session_name}</div>
                    <div>
                      {new Date(s.date_start).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                    </div>
                    <div>
                      {new Date(s.date_start).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          
          <div className="bg-black/60 border border-white/10 rounded-lg p-4 min-w-[220px] text-center flex flex-col justify-center items-center backdrop-blur-md">
            <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
              <Clock className="size-3" /> Faltam para {nextSession?.name || nextSession?.session_name}
            </span>
            <span className="text-3xl font-mono font-bold text-red-500">
              {countdown || "..."}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function RacesPage() {
  const navigate = useNavigate()
  
  const { series, setSeries, season, setSeason } = useAppStore()
  
  const seasons = useSeasons(series)
  const defaultSeason = String(seasons[0] ?? "")

  useEffect(() => {
    if (series !== "f1" && seasons.length > 0) {
      if (!seasons.includes(Number(season))) {
        setSeason(String(seasons[0]))
      }
    }
  }, [series, seasons, season, setSeason])

  const seasonParam =
    (season === "all" ? undefined : Number(season || defaultSeason)) ||
    undefined

  const races = useApi(
    () => fetchAll((params) => api.races({ ...params, season: seasonParam, series })),
    [seasonParam, series],
  )
  
  const displayData = useMemo(() => {
    if (!races.data) return []
    // Se estiver filtrado por uma temporada específica, numera sequencialmente
    // apenas as etapas oficiais do campeonato (mantendo round 0 para pré-temporada).
    if (seasonParam) {
      let champRound = 0
      return races.data.map((race) => {
        if (race.is_testing || race.round === 0) {
          return { ...race, round: 0 }
        }
        champRound += 1
        return {
          ...race,
          round: champRound,
        }
      })
    }
    return races.data
  }, [races.data, seasonParam])

  const columns: TableColumn<Race>[] = [
    {
      name: "Rodada",
      width: "96px",
      center: true,
      sortable: true,
      selector: (row) => row.round,
      cell: (row) => (
        <span className="font-semibold font-mono tracking-tight tabular-nums">
          {row.is_testing || row.round === 0 ? "Teste" : row.round}
        </span>
      ),
    },
    {
      name: "Grande Prêmio",
      sortable: true,
      minWidth: "240px",
      selector: (row) => row.name,
      cell: (row) => (
        <span className="flex items-center gap-2">
          <CountryFlag country={row.circuit_country} className="h-4 w-6" />
          <span className="font-medium">{row.name}</span>
        </span>
      ),
    },
    {
      name: "Data",
      width: "160px",
      sortable: true,
      selector: (row) => row.date ?? "",
      cell: (row) => (
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <CalendarDays className="size-3.5" />
          {formatDate(row.date)}
        </span>
      ),
    },
    {
      name: "Circuito",
      selector: (row) => row.circuit_name ?? "—",
    },
  ]

  return (
    <div className="space-y-6">
      
      <PageHeader
        title="Calendário"
      >
        <div className="flex flex-wrap items-center gap-3">
          <SeriesSelector
            value={series}
            onChange={(s) => setSeries(s)}
            size="sm"
          />
          <div className="flex items-center gap-2">
            <Label htmlFor="season-filter" className="text-muted-foreground">
              Temporada
            </Label>
            <SeasonSelector
              value={String(season || defaultSeason)}
              onValueChange={setSeason}
              series={series}
              className="w-[180px]"
            />
          </div>
        </div>
      </PageHeader>

      {/* Hero Card da Próxima Corrida com Countdown */}
      <NextRaceHero season={seasonParam} series={series} />

      {races.error ? (
        <ErrorState message={races.error} onRetry={races.reload} />
      ) : (
        <VirtualDataTable
          columns={columns}
          data={displayData}
          onRowClicked={(row) => navigate(`/calendario/${row.id}`)}
          renderMobileCard={(row) => (
            <div onClick={() => navigate(`/calendario/${row.id}`)} className="flex flex-col gap-2 cursor-pointer">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Rodada {row.round}</span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="size-3.5" />
                  {formatDate(row.date)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">{row.name}</span>
                <CountryFlag country={row.circuit_country} className="h-5 w-7" />
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {row.circuit_name ?? "—"}
              </div>
            </div>
          )}
        />
      )}
    </div>
  )
}
