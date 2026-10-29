import { ErrorBoundary } from "@/components/error-boundary"
import { useState, useEffect, useMemo } from "react"
import { Link, useParams } from "react-router-dom"
import type { TableColumn } from "react-data-table-component"
import { ArrowLeft, MapPin, Zap, CircleDashed, CalendarDays, Clock, Info } from "lucide-react"

import { CodeBadge } from "@/components/driver-code"
import { F1DataTable } from "@/components/data-table"
import { ErrorState } from "@/components/error-state"
import { PositionBadge } from "@/components/position-badge"
import { TeamInline } from "@/components/team-name"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useApi } from "@/hooks/use-api"
import { api, type RaceResult, type ResultsState, findRaceSession } from "@/lib/api"
import { formatDate, formatPoints, formatStatus } from "@/lib/format"
import { QualyResults } from "@/components/qualy-results"
import { CountryFlag } from "@/components/flag"
import { findMeetingForRace } from "@/lib/meeting-match"
import { notifySeasonDataUpdated, resultsPollInterval } from "@/lib/request-gate"
import { PracticeResults } from "@/components/practice-results"
import { RacePaceChart } from "@/components/race-pace-chart"
import { TrackDominanceChart } from "@/components/track-dominance-chart"

// --- COMPONENTE DE ESTRATÉGIA DE PNEUS (DATAVIZ) ---
function TyreStrategy({ season, country, raceName, raceDate, results }: { season: number, country: string, raceName?: string | null, raceDate?: string | null, results: RaceResult[] }) {
  const [stints, setStints] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Achar a session_key correta na OpenF1 via nosso proxy
    fetch(`/api/v1/live/sessions?year=${season}`)
      .then(r => r.json())
      .then(res => {
        const meeting = findMeetingForRace<any>(res?.data, { name: raceName, circuit_country: country, date: raceDate })
        if (!meeting) throw new Error("Corrida não encontrada na OpenF1")
        const raceSession = findRaceSession(meeting.sessions)
        if (!raceSession) throw new Error("Sessão Race não encontrada")
        
        // 2. Buscar stints e drivers do nosso proxy
        return fetch(`/api/v1/live/tyres/${raceSession.key}`)
      })
      .then(async r => {
        if (!r.ok) throw new Error("Erro ao buscar dados de pneus")
        return r.json()
      })
      .then(json => {
        if (!json?.data) {
          setStints([])
          setLoading(false)
          return
        }
        const stintsData = Array.isArray(json.data.stints) ? json.data.stints : []
        const drivers = Array.isArray(json.data.drivers) ? json.data.drivers : []
        
        // Mapa de acrônimos dos pilotos
        const driverAcronyms: Record<number, string> = {}
        drivers.forEach((d: any) => {
          if (d?.driver_number) {
            driverAcronyms[d.driver_number] = d.name_acronym || ""
          }
        })

        // Agrupar stints por driver
        const grouped: Record<number, any[]> = {}
        stintsData.forEach((s: any) => {
          if (s?.driver_number) {
            if (!grouped[s.driver_number]) grouped[s.driver_number] = []
            grouped[s.driver_number].push(s)
          }
        })
        
        // Formatar para o gráfico
        const chartData = Object.values(grouped).filter(driverStints => driverStints.length > 0).map(driverStints => {
          driverStints.sort((a, b) => (a.lap_start || 0) - (b.lap_start || 0))
          const driverNumber = driverStints[0]?.driver_number
          const lastStint = driverStints[driverStints.length - 1]
          return {
            driver_number: driverNumber,
            acronym: driverAcronyms[driverNumber] || String(driverNumber),
            total_laps: lastStint?.lap_end || 0,
            stints: driverStints
          }
        }).sort((a, b) => b.total_laps - a.total_laps)
        
        setStints(chartData)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [season, country, raceName, raceDate])

  const sortedStints = [...stints].map(driver => {
    // Cruzar a sigla da OpenF1 com o nosso banco de resultados
    const resultRow = results.find(r => r.driver_code === driver.acronym)
    // Se não achou ou não tem position final (DNF), joga pro final da lista (999)
    const position = resultRow?.position ?? 999 
    return { ...driver, position }
  }).sort((a, b) => {
    if (a.position !== b.position) return a.position - b.position
    return b.total_laps - a.total_laps // desempate por voltas
  })

  if (loading) return <div className="p-8 text-center animate-pulse">Carregando telemetria de pneus...</div>
  if (stints.length === 0) return <div className="p-8 text-center text-muted-foreground">Dados de pneus indisponíveis para esta corrida.</div>

  const maxLaps = Math.max(...stints.map(d => d.total_laps))

  const getCompoundColor = (compound: string) => {
    if (compound === "SOFT") return "bg-red-500 text-white"
    if (compound === "MEDIUM") return "bg-yellow-400 text-black"
    if (compound === "HARD") return "bg-gray-100 text-black"
    if (compound === "INTERMEDIATE") return "bg-green-500 text-white"
    if (compound === "WET") return "bg-blue-600 text-white"
    return "bg-gray-700 text-white"
  }

  return (
    <Card className="mt-6 border-border/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CircleDashed className="size-5 text-muted-foreground" />
          Estratégia de Pneus (Pit Stops)
        </CardTitle>
        <CardDescription>
          Ciclos de vida dos compostos ao longo das {maxLaps} voltas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          {sortedStints.map((driver) => (
            <div key={driver.driver_number} className="flex items-center gap-3 text-sm">
              <div className="w-14 shrink-0 flex items-center justify-end gap-1.5 font-mono">
                <span className="text-muted-foreground">{driver.position === 999 ? "DNF" : `${driver.position}º`}</span>
                <span className="font-bold text-white">{driver.acronym}</span>
              </div>
              <div className="flex-1 h-6 bg-black/20 rounded-sm flex overflow-hidden border border-white/5 relative">
                {driver.stints.map((stint: any, idx: number) => {
                  const widthPct = ((stint.lap_end - stint.lap_start) / maxLaps) * 100
                  return (
                    <div 
                      key={idx} 
                      className={`h-full ${getCompoundColor(stint.compound)} flex items-center justify-center font-black text-[10px] tracking-tighter border-r border-black/20 hover:brightness-110 transition-all cursor-crosshair`}
                      style={{ width: `${widthPct}%` }}
                      title={`${stint.compound || "Desconhecido"} (Volta ${stint.lap_start} a ${stint.lap_end})`}
                    >
                      {widthPct > 5 && stint.compound ? stint.compound.substring(0, 1) : ""}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
          <div className="text-xs text-muted-foreground mt-4 italic text-right">
            * Dados fornecidos via telemetria oficial (OpenF1).
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
// ----------------------------------------------------

const getResultColumns = (season?: number): TableColumn<RaceResult>[] => [
  {
    name: "Pos",
    width: "72px",
    cell: (row) => <PositionBadge position={row.position} />,
  },
  {
    name: "Piloto",
    sortable: true,
    selector: (row) => row.driver_name ?? "",
    cell: (row) => (
      <div className="flex items-center gap-2">
        <span className="font-medium">{row.driver_name ?? "—"}</span>
        <CodeBadge
          code={row.driver_code}
          nationality={row.driver_nationality}
        />
      </div>
    ),
  },
  {
    name: "Equipe",
    sortable: true,
    selector: (row) => row.team_name ?? "",
    cell: (row) => <TeamInline name={row.team_name} season={season} />,
  },
  {
    name: "Largada",
    width: "100px",
    center: true,
    sortable: true,
    selector: (row) => row.grid ?? 0,
    format: (row) => row.grid ?? "—",
  },
  {
    name: "Voltas",
    width: "100px",
    center: true,
    selector: (row) => row.laps ?? 0,
    format: (row) => row.laps ?? "—",
  },
  {
    name: "Status",
    sortable: true,
    selector: (row) => row.status ?? "",
    cell: (row) => (
      <Badge variant={row.status === "finished" ? "secondary" : "destructive"}>
        {formatStatus(row.status)}
      </Badge>
    ),
  },
  {
    name: "Volta rápida",
    width: "130px",
    center: true,
    selector: (row) => row.fastest_lap,
    cell: (row) =>
      row.fastest_lap ? <Zap className="size-4 text-amber-500" /> : null,
  },
  {
    name: "Pontos",
    width: "110px",
    right: true,
    sortable: true,
    selector: (row) => row.points + row.sprint_points,
    cell: (row) => (
      <div className="flex flex-col items-end">
        <span className="font-semibold font-mono tracking-tight tabular-nums">
          {formatPoints(row.points)}
        </span>
        {row.sprint_points > 0 ? (
          <span className="text-xs text-muted-foreground">
            +{formatPoints(row.sprint_points)} sprint
          </span>
        ) : null}
      </div>
    ),
  },
]

function ResultsNotice({ state }: { state?: ResultsState }) {
  const pending = state?.state === "pending" || state?.state === "in_progress"
  const message =
    state?.message ?? "Nenhum resultado disponível para esta corrida."
  return (
    <div
      role="status"
      className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
        pending
          ? "border-amber-500/30 bg-amber-500/10 text-amber-100"
          : "border-dashed border-border/70 bg-card/60 text-muted-foreground"
      }`}
    >
      {pending ? (
        <Clock className="mt-0.5 size-4 shrink-0 animate-pulse" aria-hidden />
      ) : (
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
      )}
      <div className="min-w-0 break-words">
        <p className="font-semibold text-foreground">
          {pending
            ? "Resultado ainda não publicado"
            : state?.state === "upcoming"
              ? "Corrida ainda não realizada"
              : "Resultado indisponível"}
        </p>
        <p className="mt-1">{message}</p>
      </div>
    </div>
  )
}

export function RaceDetailPage() {
  return (
    <ErrorBoundary>
      <RaceDetailPageInner />
    </ErrorBoundary>
  )
}

function RaceDetailPageInner() {
  const { raceId } = useParams()
  const id = Number(raceId)
  const valid = Number.isInteger(id) && id > 0

  const race = useApi(() => {
    if (!valid) return Promise.reject(new Error("Corrida inválida"))
    return api.race(id)
  }, [id])

  // Enquanto a fonte ainda não publicou o resultado final (corrida encerrada ou
  // em andamento), reconsulta a cada minuto — só com a aba visível e sem
  // requisições duplicadas — e para assim que o resultado estiver disponível.
  const results = useApi(
    () => {
      if (!valid) return Promise.reject(new Error("Corrida inválida"))
      return api.raceResults(id, { page: 1, per_page: 50 })
    },
    [id],
    (data) => resultsPollInterval(data?.results_state?.state),
  )
  const resultsState = results.data?.results_state
  const hasResults = (results.data?.data.length ?? 0) > 0

  const [meetingSessions, setMeetingSessions] = useState<any[] | null>(null)
  const raceSeries = race.data?.series || "f1"

  useEffect(() => {
    if (resultsState?.final && hasResults) {
      notifySeasonDataUpdated({
        series: raceSeries,
        season: race.data?.season,
      })
    }
  }, [resultsState?.final, hasResults, raceSeries, race.data?.season])

  useEffect(() => {
    setMeetingSessions(null)
    if (!race.data?.season) return
    let active = true
    api.liveSessions(race.data.season, raceSeries)
      .then(res => {
        if (!active || !res?.data) return
        const m = findMeetingForRace(res.data, {
          // Em F1 o id da corrida é do banco local e pode colidir com um
          // meeting_key da OpenF1; só F2/F3 usam o meeting_key como id.
          id: raceSeries === "f1" ? null : race.data?.id,
          name: race.data?.name,
          circuit_country: race.data?.circuit_country,
          date: race.data?.date,
        })
        if (m?.sessions && m.sessions.length > 0) {
          setMeetingSessions(m.sessions)
        }
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [race.data?.season, race.data?.circuit_country, race.data?.name, race.data?.date, raceSeries, race.data?.id])

  const columns = useMemo(() => getResultColumns(race.data?.season), [race.data?.season])

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/calendario">
          <ArrowLeft />
          Voltar para o calendário
        </Link>
      </Button>

      {race.loading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-6 w-72" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
        </Card>
      ) : race.error ? (
        <ErrorState message={race.error} onRetry={race.reload} />
      ) : race.data ? (
        <Card className="overflow-hidden">
          <div className="absolute right-0 top-0 opacity-5 pointer-events-none translate-x-1/4 -translate-y-1/4">
             <MapPin className="size-64" />
          </div>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              {raceSeries !== "f1" && (
                <Badge variant="default" className="font-bold uppercase tracking-wider bg-red-600">
                  {raceSeries.toUpperCase()}
                </Badge>
              )}
              <Badge variant="secondary">Temporada {race.data.season}</Badge>
              <Badge variant="outline">Rodada {race.data.round}</Badge>
            </div>
            <CardTitle className="text-3xl font-black mt-1">{race.data.name}</CardTitle>
            <CardDescription className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-base">
              <span>{formatDate(race.data.date)}</span>
              {race.data.circuit_name ? (
                <span className="flex items-center gap-1 text-primary">
                  <MapPin className="size-4" />
                  {race.data.circuit_name}
                  {race.data.circuit_country
                    ? ` · ${race.data.circuit_country}`
                    : ""}
                  <CountryFlag country={race.data.circuit_country} className="ml-1 h-4 w-6" />
                </span>
              ) : null}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {meetingSessions && meetingSessions.length > 0 && (
        <Card className="border-red-500/20 bg-gradient-to-br from-red-950/20 to-black/40 overflow-hidden relative">
          <CardHeader className="pb-3">
            <CardDescription className="text-red-400 font-bold tracking-widest uppercase text-xs flex items-center gap-1.5">
              <CalendarDays className="size-4" />
              Programação Oficial do Fim de Semana
            </CardDescription>
            <CardTitle className="text-xl font-bold flex items-center justify-between">
              <span>Dias e Horários das Sessões (Horário de Brasília)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {meetingSessions.map((s: any) => {
                const sDate = new Date(s.date_start)
                const isLive = s.state === "live"
                return (
                  <div
                    key={s.key}
                    className={`p-3.5 rounded-lg border transition-all ${
                      isLive 
                        ? "bg-red-500/20 border-red-500/50 text-white shadow-md shadow-red-950/50" 
                        : "bg-white/5 border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-red-400">
                        {sDate.toLocaleDateString("pt-BR", { weekday: "short" })} ({sDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })})
                      </span>
                      {isLive && (
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-sm text-foreground mb-2 truncate" title={s.name}>
                      {s.name}
                    </div>
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Clock className="size-3" /> Início:
                      </span>
                      <span className="font-mono font-bold text-sm text-white">
                        {sDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="race" className="w-full">
        <TabsList className="mb-4">
          {raceSeries === "f1" && (
            <>
              <TabsTrigger value="fp">Treinos Livres</TabsTrigger>
              <TabsTrigger value="qualy">Qualificação</TabsTrigger>
            </>
          )}
          <TabsTrigger value="race">Resultado Final</TabsTrigger>
          {raceSeries === "f1" && race.data && race.data.season >= 2023 && (
            <TabsTrigger value="telemetry" className="flex items-center gap-2">
              <Zap className="size-4" /> Telemetria
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="fp">
          {race.data && (
            <PracticeResults season={race.data.season} countryName={race.data.circuit_country} />
          )}
        </TabsContent>

        <TabsContent value="qualy">
          {race.data && (
            <QualyResults raceId={race.data.id} season={race.data.season} />
          )}
        </TabsContent>

        <TabsContent value="telemetry">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-card border-border/50">
                <CardContent className="p-6 flex flex-col justify-center items-center text-center">
                  <span className="text-sm text-muted-foreground mb-2">Pilotos na Pista</span>
                  <span className="text-3xl font-bold font-mono">
                    {results.data?.data.filter(r => r.position).length ?? 0}
                    <span className="text-sm text-muted-foreground ml-1">/ {results.data?.data.length ?? 20}</span>
                  </span>
                </CardContent>
              </Card>
              <Card className="bg-card border-border/50">
                <CardContent className="p-6 flex flex-col justify-center items-center text-center">
                  <span className="text-sm text-muted-foreground mb-2">Vencedor</span>
                  <span className="text-3xl font-bold font-mono text-primary">
                    {results.data?.data.find(r => r.position === 1)?.driver_code ?? "-"}
                  </span>
                </CardContent>
              </Card>
              <Card className="bg-card border-border/50">
                <CardContent className="p-6 flex flex-col justify-center items-center text-center">
                  <span className="text-sm text-muted-foreground mb-2">Volta Mais Rápida</span>
                  <span className="text-3xl font-bold font-mono text-purple-400">
                    {results.data?.data.find(r => r.fastest_lap)?.driver_code ?? "-"}
                  </span>
                </CardContent>
              </Card>
            </div>

            {race.data && race.data.season >= 2023 && race.data.circuit_country && (
              <div className="flex flex-col gap-6">
                <TyreStrategy 
                  season={race.data.season} 
                  country={race.data.circuit_country} 
                  raceName={race.data.name}
                  raceDate={race.data.date}
                  results={results.data?.data ?? []}
                />
                <RacePaceChart 
                  season={race.data.season} 
                  country={race.data.circuit_country} 
                  results={results.data?.data ?? []}
                />
                <TrackDominanceChart 
                  season={race.data.season} 
                  country={race.data.circuit_country} 
                  results={results.data?.data ?? []}
                />
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="race">
          {results.error ? (
            <ErrorState message={results.error} onRetry={results.reload} />
          ) : (
            <div className="space-y-6">
              {!results.loading && results.data && !hasResults ? (
                <ResultsNotice state={resultsState} />
              ) : null}

              {results.loading || hasResults ? (
              <F1DataTable
                title={resultsState && !resultsState.final ? "Resultado" : "Resultado Final"}
                columns={columns}
                data={results.data?.data ?? []}
                keyField="id"
                progressPending={results.loading}
                progressSkeleton
                renderMobileCard={(row) => (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <PositionBadge position={row.position} />
                      <div className="min-w-0">
                        <div className="font-bold text-sm leading-tight flex items-center gap-2 truncate">
                          <span>{row.driver_name ?? "—"}</span>
                          {row.fastest_lap && (
                            <span title="Volta mais rápida">
                              <Zap className="size-3.5 text-amber-500 shrink-0" />
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          <TeamInline name={row.team_name} season={race.data?.season} />
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono font-black text-sm text-primary tabular-nums">
                        {formatPoints(row.points + (row.sprint_points || 0))} <span className="text-[10px] text-muted-foreground">pts</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {row.laps ? `${row.laps} voltas` : formatStatus(row.status)}
                      </div>
                    </div>
                  </div>
                )}
              />
              ) : null}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
