import { useEffect, useState } from "react"
import { CalendarDays, Timer, CalendarOff, Radio, Trophy } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useApi } from "@/hooks/use-api"
import { api, type LiveSessionEntry, type NextRace, type DriverStanding, type TeamStanding } from "@/lib/api"
import { flagFromCountry, driverPhoto, teamLogo } from "@/lib/assets"
import { mediaUrl } from "@/lib/media"
import { cn } from "@/lib/utils"
import { formatSessionDateTime, formatSessionTime, instantMs } from "@/lib/datetime"
import { NEXT_RACE_POLL_MS } from "@/lib/request-gate"

export interface NextEventResolution {
  type: "race" | "test" | "top5" | "empty"
  race?: NextRace | null
  standings?: DriverStanding[]
  teamStandings?: TeamStanding[]
  season?: number
  isTest?: boolean
}

/**
 * Seleciona os até 5 melhores pilotos da classificação oficial, preservando
 * a ordem de desempate e critérios oficiais providos pelo backend.
 */
export function selectTop5Drivers(standings: DriverStanding[] | null | undefined): DriverStanding[] {
  if (!standings || !Array.isArray(standings)) return []
  return [...standings]
    .sort((a, b) => {
      const posA = a.position ?? 999
      const posB = b.position ?? 999
      if (posA !== posB) return posA - posB
      return (b.points ?? 0) - (a.points ?? 0)
    })
    .slice(0, 5)
}

/**
 * Seleciona os até 5 melhores construtores da classificação oficial, preservando
 * a ordem de desempate e pontuação oficial providos pelo backend.
 */
export function selectTop5Teams(standings: TeamStanding[] | null | undefined): TeamStanding[] {
  if (!standings || !Array.isArray(standings)) return []
  return [...standings]
    .sort((a, b) => {
      const posA = a.position ?? 999
      const posB = b.position ?? 999
      if (posA !== posB) return posA - posB
      return (b.points ?? 0) - (a.points ?? 0)
    })
    .slice(0, 5)
}

/**
 * Avalia a prioridade funcional mandatória (OP-06.54):
 * 1. Se houver corridas futuras, mostrar a próxima corrida.
 * 2. Se não houver corridas futuras, mas houver testes futuros, mostrar o próximo teste.
 * 3. Se não houver corridas nem testes futuros, mostrar o TOP 5 de pilotos da temporada encerrada.
 */
export function resolveNextRaceCardState(params: {
  nextRaceData?: NextRace | null
  driverStandings?: DriverStanding[] | null
  teamStandings?: TeamStanding[] | null
  isError?: boolean
  referenceDate?: Date
}): NextEventResolution {
  const { nextRaceData, driverStandings, teamStandings, isError } = params

  if (isError && (!driverStandings || driverStandings.length === 0)) {
    return { type: "empty" }
  }

  // 1 e 2: Evento futuro retornado (corrida ou teste)
  if (nextRaceData && !nextRaceData.offseason) {
    const isTest = Boolean(
      nextRaceData.is_testing ||
      nextRaceData.event_type === "test" ||
      (nextRaceData.name && /testing|testes|pre-season|pós-temporada/i.test(nextRaceData.name))
    )

    if (isTest) {
      return {
        type: "test",
        race: nextRaceData,
        season: nextRaceData.season ?? undefined,
        isTest: true,
      }
    }

    return {
      type: "race",
      race: nextRaceData,
      season: nextRaceData.season ?? undefined,
      isTest: false,
    }
  }

  // 3: Temporada encerrada / sem eventos futuros -> Top 5 oficial
  const top5 = selectTop5Drivers(driverStandings)
  const top5Teams = selectTop5Teams(teamStandings)
  if (top5.length > 0 || top5Teams.length > 0) {
    return {
      type: "top5",
      standings: top5,
      teamStandings: top5Teams,
      season: nextRaceData?.season,
    }
  }

  return {
    type: "empty",
    season: nextRaceData?.season,
  }
}

const SESSION_SHORT: Record<string, string> = {
  // Canônicos em inglês (OpenF1)
  "Practice 1": "P1",
  "Practice 2": "P2",
  "Practice 3": "P3",
  "Free Practice": "FP",
  "Sprint Qualifying": "SQ",
  "Sprint Shootout": "SQ",
  Sprint: "SP",
  Qualifying: "Q",
  "Qualifying 1": "Q1",
  "Qualifying 2": "Q2",
  "Sprint Race": "SR",
  "Feature Race": "FR",
  "Feature Race 1": "FR1",
  "Feature Race 2": "FR2",
  Race: "R",

  // Localizados em português
  "Treino Livre 1": "P1",
  "Treino Livre 2": "P2",
  "Treino Livre 3": "P3",
  "Treino Livre": "FP",
  "Classificação": "Q",
  "Classificação Principal": "Q",
  "Classificação Sprint": "SQ",
  "Corrida Sprint": "SP",
  "Corrida Principal": "R",
  "Corrida": "R",
}

interface Remaining {
  days: number
  hours: number
  minutes: number
  seconds: number
  done: boolean
}

function remainingUntil(target: string): Remaining {
  const targetMs = instantMs(target)
  const diff = (targetMs ?? Number.NaN) - Date.now()
  if (!Number.isFinite(diff) || diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true }
  }
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor(diff / 3_600_000) % 24,
    minutes: Math.floor(diff / 60_000) % 60,
    seconds: Math.floor(diff / 1_000) % 60,
    done: false,
  }
}

function CountdownBlock({
  value,
  label,
  accentColor,
}: {
  value: number
  label: string
  accentColor?: string
}) {
  return (
    <div className="flex min-w-[48px] sm:min-w-[54px] flex-col items-center justify-center rounded-lg border border-white/10 bg-black/60 px-2 sm:px-2.5 py-1.5 shadow-inner backdrop-blur-md transition-all duration-300">
      <span
        className={cn(
          "text-lg sm:text-xl md:text-2xl font-black font-mono tracking-tight tabular-nums text-foreground drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]",
          accentColor
        )}
      >
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[8px] sm:text-[9px] font-bold tracking-widest text-muted-foreground uppercase mt-0.5">
        {label}
      </span>
    </div>
  )
}

function Countdown({
  target,
  doneLabel,
  accentColor,
}: {
  target: string
  doneLabel: string
  accentColor?: string
}) {
  const [remaining, setRemaining] = useState(() => remainingUntil(target))

  useEffect(() => {
    const timer = setInterval(() => setRemaining(remainingUntil(target)), 1000)
    return () => clearInterval(timer)
  }, [target])

  if (remaining.done) {
    return (
      <Badge variant="destructive" className="gap-1.5 text-xs sm:text-sm font-bold tracking-wide uppercase shadow-lg px-2.5 py-1">
        <span className="size-2 animate-ping rounded-full bg-current" />
        {doneLabel}
      </Badge>
    )
  }
  return (
    <div className="flex items-end gap-1.5 sm:gap-2">
      <CountdownBlock value={remaining.days} label="dias" accentColor={accentColor} />
      <CountdownBlock value={remaining.hours} label="horas" accentColor={accentColor} />
      <CountdownBlock value={remaining.minutes} label="min" accentColor={accentColor} />
      <CountdownBlock value={remaining.seconds} label="seg" accentColor={accentColor} />
    </div>
  )
}

function sessionLabel(session: LiveSessionEntry): string {
  // 1. Tenta pelo session_name canônico
  if (session.session_name && SESSION_SHORT[session.session_name]) {
    return SESSION_SHORT[session.session_name]
  }
  // 2. Tenta pelo name (localizado ou original)
  if (session.name && SESSION_SHORT[session.name]) {
    return SESSION_SHORT[session.name]
  }
  // 3. Fallback inteligente baseado em type
  if (session.type === "Race") return "R"
  if (session.type === "Qualifying") return "Q"
  if (session.type === "Practice") return "FP"

  // 4. Fallback compacto e legível para valores desconhecidos
  const raw = session.name ?? session.session_name ?? "Sessão"
  return raw.length > 6 ? raw.slice(0, 4) + "…" : raw
}

function SessionPill({
  session,
  next,
  accentBorder,
}: {
  session: LiveSessionEntry
  next: boolean
  accentBorder?: string
}) {
  const finished = session.state === "finished"
  const live = session.state === "live"
  return (
    <span
      title={`${session.name} — ${formatSessionDateTime(
        session.date_start,
      )} (Horário de Brasília)${live ? " · ao vivo" : ""}`}
      className={cn(
        "flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold font-mono tracking-tight tabular-nums transition-all duration-200",
        finished &&
          "border-white/5 bg-secondary/30 text-muted-foreground/50 line-through opacity-60",
        live && "border-emerald-500/70 bg-emerald-500/20 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.35)] animate-pulse",
        !finished &&
          !live &&
          next &&
          cn(
            "bg-primary/15 text-foreground ring-1 shadow-sm font-bold",
            accentBorder || "border-primary/60 ring-primary/40"
          ),
        !finished && !live && !next && "border-white/10 bg-background/50 text-muted-foreground hover:border-white/25",
      )}
    >
      {live && <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />}
      <span>{sessionLabel(session)}</span>
      <span className="font-normal opacity-85">
        {formatSessionTime(session.date_start)}
      </span>
    </span>
  )
}

export function NextRaceCard({
  series = "f1",
}: {
  series?: "f1" | "f2" | "f3"
}) {
  // Reconsulta periodicamente (apenas com a aba visível) para que, ao término
  // do fim de semana, o card avance para a próxima etapa sem recarregar a página.
  const query = useApi(() => {
    if (series === "f2") return api.nextF2Race()
    if (series === "f3") return api.nextF3Race()
    return api.nextRace()
  }, [series], NEXT_RACE_POLL_MS)
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(timer)
  }, [])

  const seriesMeta = {
    f1: {
      name: "FÓRMULA 1",
      accent: "text-red-500",
      topGradient: "from-red-600 via-red-500 to-transparent",
      badgeBorder: "border-red-500/30 text-red-400 bg-red-950/20",
      hoverBorder: "hover:border-red-500/50",
      accentPill: "border-red-500/60 ring-red-500/30",
    },
    f2: {
      name: "FÓRMULA 2",
      accent: "text-blue-500",
      topGradient: "from-blue-600 via-blue-500 to-transparent",
      badgeBorder: "border-blue-500/30 text-blue-400 bg-blue-950/20",
      hoverBorder: "hover:border-blue-500/50",
      accentPill: "border-blue-500/60 ring-blue-500/30",
    },
    f3: {
      name: "FÓRMULA 3",
      accent: "text-emerald-500",
      topGradient: "from-emerald-600 via-emerald-500 to-transparent",
      badgeBorder: "border-emerald-500/30 text-emerald-400 bg-emerald-950/20",
      hoverBorder: "hover:border-emerald-500/50",
      accentPill: "border-emerald-500/60 ring-emerald-500/30",
    },
  }[series]

  const data: any = query.data
  const isOffseason = Boolean(data?.offseason || (query.error && !query.loading))
  const targetSeason = data?.season ?? new Date().getFullYear()

  const [top5Tab, setTop5Tab] = useState<"drivers" | "teams">("drivers")

  // Consulta classificação oficial de pilotos quando não há corridas futuras (OP-06.54)
  const standingsQuery = useApi(
    () => {
      if (!isOffseason) return Promise.resolve({ data: [] as DriverStanding[] })
      return api.driverStandings(targetSeason, series)
    },
    [isOffseason, targetSeason, series],
  )

  // Consulta classificação oficial de construtores da temporada (Frente 7)
  const teamStandingsQuery = useApi(
    () => {
      if (!isOffseason) return Promise.resolve({ data: [] as TeamStanding[] })
      return api.teamStandings(targetSeason, series)
    },
    [isOffseason, targetSeason, series],
  )

  const resolution = resolveNextRaceCardState({
    nextRaceData: data,
    driverStandings: standingsQuery.data?.data,
    teamStandings: teamStandingsQuery.data?.data,
    isError: Boolean(query.error),
  })

  if (query.loading && !data) {
    return (
      <Card className="rounded-xl border border-border/50 bg-card/85 backdrop-blur-xl h-full flex flex-col p-6 animate-pulse">
        <div className="h-4 bg-muted/50 rounded w-1/3 mb-4" />
        <div className="h-8 bg-muted/40 rounded w-2/3 mb-2" />
        <div className="h-4 bg-muted/30 rounded w-1/2 mt-auto" />
      </Card>
    )
  }

  if (resolution.type === "empty" && !data) return null

  // Prioridade 3: Se não houver corridas nem testes futuros, exibe Top 5 oficial de pilotos e construtores da temporada
  if (resolution.type === "top5") {
    const top5 = resolution.standings ?? []
    const top5Teams = resolution.teamStandings ?? []
    const seasonLabel = resolution.season ?? targetSeason
    const maxTeamPoints = top5Teams[0]?.points || 1

    return (
      <Card className={cn(
        "group relative overflow-hidden rounded-xl border border-border/50 bg-card/85 backdrop-blur-xl text-card-foreground shadow-md h-full flex flex-col transition-all duration-300 hover:shadow-xl",
        seriesMeta.hoverBorder
      )}>
        <div className={cn("absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r z-20 opacity-80 group-hover:opacity-100 transition-opacity", seriesMeta.topGradient)} />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.02] dark:opacity-[0.04] transition-transform duration-700 group-hover:scale-110">
          <Trophy className="size-56" />
        </div>

        <CardHeader className="relative z-10 pb-2">
          <CardTitle className="flex items-center justify-between text-xs font-semibold tracking-wider uppercase text-muted-foreground">
            <div className="flex items-center gap-2">
              <img
                loading="lazy"
                src={`/logos/${series}-logo.png`}
                alt={`${series.toUpperCase()} Logo`}
                className="h-4.5 w-auto object-contain rounded-xs"
              />
              <span className={cn("font-bold", seriesMeta.accent)}>{seriesMeta.name}</span>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono border-white/10 bg-black/30">
              Temporada {seasonLabel}
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="relative z-10 flex flex-col justify-between flex-1 gap-3 pt-1">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-bold tracking-tight text-foreground flex items-center gap-1.5">
                <Trophy className={cn("size-4", seriesMeta.accent)} />
                <span>Top 5 {top5Tab === "drivers" ? "Pilotos" : "Construtores"} · Final</span>
              </div>
              <div className="flex items-center gap-1.5">
                {top5Teams.length > 0 && (
                  <div className="flex items-center bg-muted/60 p-0.5 rounded-md border border-white/5 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setTop5Tab("drivers")}
                      className={cn(
                        "px-2 py-0.5 rounded transition-all cursor-pointer",
                        top5Tab === "drivers"
                          ? "bg-primary text-primary-foreground shadow-xs font-extrabold"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Pilotos
                    </button>
                    <button
                      type="button"
                      onClick={() => setTop5Tab("teams")}
                      className={cn(
                        "px-2 py-0.5 rounded transition-all cursor-pointer",
                        top5Tab === "teams"
                          ? "bg-primary text-primary-foreground shadow-xs font-extrabold"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Equipes
                    </button>
                  </div>
                )}
                <Badge variant="outline" className={cn("text-[9px] uppercase tracking-wider font-semibold border-white/10", seriesMeta.badgeBorder)}>
                  Encerrada
                </Badge>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Classificação oficial de {top5Tab === "drivers" ? "pilotos" : "construtores"} homologada pela FIA
            </p>

            {/* TAB PILOTOS */}
            {top5Tab === "drivers" ? (
              <div className="mt-2.5 space-y-1.5">
                {top5.map((driver) => {
                  const photoUrl = driverPhoto(driver.driver_name, seasonLabel)
                  const logoAsset = driver.team_name ? teamLogo(driver.team_name, seasonLabel) : null
                  return (
                    <div
                      key={driver.driver_id ?? `${driver.position}-${driver.driver_name}`}
                      className="flex items-center justify-between py-1 px-2 rounded-md bg-secondary/40 border border-white/5 hover:border-white/15 transition-colors gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={cn(
                            "font-mono font-bold text-[10px] size-4.5 rounded flex items-center justify-center shrink-0",
                            driver.position === 1
                              ? "bg-amber-500/25 text-amber-800 dark:text-amber-300 border border-amber-500/50 shadow-xs"
                              : driver.position === 2
                              ? "bg-slate-300/20 text-zinc-700 dark:text-slate-200 border border-slate-300/40"
                              : driver.position === 3
                              ? "bg-amber-700/25 text-amber-900 dark:text-amber-400 border border-amber-700/40"
                              : "bg-background/80 text-muted-foreground border border-white/5",
                          )}
                        >
                          {driver.position}
                        </span>

                        {photoUrl && (
                          <img
                            src={photoUrl}
                            alt=""
                            className="size-6 rounded-full object-cover border border-white/10 shrink-0 bg-muted/40"
                            onError={(e) => (e.currentTarget.style.display = "none")}
                          />
                        )}

                        <span className="truncate text-xs font-semibold text-foreground flex items-center gap-1.5">
                          {driver.driver_name}
                          {driver.team_name ? (
                            <span className="text-[10px] text-muted-foreground ml-1 font-normal opacity-80 truncate hidden sm:inline">
                              · {driver.team_name}
                            </span>
                          ) : null}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-auto">
                        {logoAsset?.url && (
                          <img
                            src={logoAsset.url}
                            alt=""
                            className="h-3.5 max-w-[36px] object-contain shrink-0 opacity-80 hidden xs:inline"
                            onError={(e) => (e.currentTarget.style.display = "none")}
                          />
                        )}
                        <span className="font-mono text-xs font-bold text-foreground tabular-nums">
                          {driver.points}{" "}
                          <span className="text-[9px] text-muted-foreground font-normal">pts</span>
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              /* TAB CONSTRUTORES (Barras de dominância e logos oficiais) */
              <div className="mt-2.5 space-y-2">
                {top5Teams.map((team) => {
                  const logoAsset = team.team_name ? teamLogo(team.team_name, seasonLabel) : null
                  const dominancePct = Math.max(8, Math.min(100, Math.round((team.points / maxTeamPoints) * 100)))
                  return (
                    <div
                      key={team.team_id ?? `${team.position}-${team.team_name}`}
                      className="py-1 px-2 rounded-md bg-secondary/40 border border-white/5 hover:border-white/15 transition-colors flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={cn(
                              "font-mono font-bold text-[10px] size-4.5 rounded flex items-center justify-center shrink-0",
                              team.position === 1
                                ? "bg-amber-500/25 text-amber-800 dark:text-amber-300 border border-amber-500/50 shadow-xs"
                                : team.position === 2
                                ? "bg-slate-300/20 text-zinc-700 dark:text-slate-200 border border-slate-300/40"
                                : team.position === 3
                                ? "bg-amber-700/25 text-amber-900 dark:text-amber-400 border border-amber-700/40"
                                : "bg-background/80 text-muted-foreground border border-white/5",
                            )}
                          >
                            {team.position}
                          </span>

                          {logoAsset?.url && (
                            <img
                              src={logoAsset.url}
                              alt=""
                              className="h-3.5 max-w-[36px] object-contain shrink-0"
                              onError={(e) => (e.currentTarget.style.display = "none")}
                            />
                          )}

                          <span className="truncate text-xs font-bold text-foreground">
                            {team.team_name}
                          </span>
                        </div>

                        <span className="font-mono text-xs font-bold text-foreground tabular-nums shrink-0">
                          {team.points}{" "}
                          <span className="text-[9px] text-muted-foreground font-normal">pts</span>
                        </span>
                      </div>

                      {/* Barra de dominância relativa */}
                      <div className="w-full h-1.5 rounded-full bg-muted/60 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400 transition-all duration-500"
                          style={{ width: `${dominancePct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border/30 text-[10px] text-muted-foreground">
            <span>Classificação oficial de {top5Tab === "drivers" ? "pilotos" : "construtores"}</span>
            <span className="font-mono text-[9px] opacity-75">FIA {series.toUpperCase()}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (resolution.type === "empty") {
    return (
      <Card className={cn(
        "group relative overflow-hidden rounded-xl border border-border/50 bg-card/80 backdrop-blur-xl text-card-foreground shadow-md h-full flex flex-col transition-all duration-300 hover:shadow-xl",
        seriesMeta.hoverBorder
      )}>
        <div className={cn("absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r z-20 opacity-70 group-hover:opacity-100 transition-opacity", seriesMeta.topGradient)} />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.02] dark:opacity-[0.04] transition-transform duration-700 group-hover:scale-110">
          <CalendarDays className="size-56" />
        </div>
        <CardHeader className="relative z-10 pb-2">
          <CardTitle className="flex items-center justify-between text-xs font-semibold tracking-wider uppercase text-muted-foreground">
            <div className="flex items-center gap-2">
              <img
                loading="lazy"
                src={`/logos/${series}-logo.png`}
                alt={`${series.toUpperCase()} Logo`}
                className="h-4.5 w-auto object-contain rounded-xs"
              />
              <span className={cn("font-bold", seriesMeta.accent)}>{seriesMeta.name}</span>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono border-white/10 bg-black/30">
              Temporada {data?.season ?? targetSeason}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10 flex flex-col items-center justify-center flex-1 py-8 px-6 text-center gap-3">
          <div className="rounded-full bg-secondary/60 p-3.5 shadow-sm ring-1 ring-border/50 transition-all duration-300 group-hover:scale-105">
            <CalendarOff className="size-6 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>
          <p className="text-xs sm:text-sm font-medium text-muted-foreground leading-relaxed max-w-[88%]">
            {data?.message || `Aguardando homologação do calendário oficial de ${data?.season ?? targetSeason} pela FIA.`}
          </p>
        </CardContent>
      </Card>
    )
  }

  const sessions = data.sessions ?? []
  const nextSession =
    sessions.find(
      (session: LiveSessionEntry) =>
        session.state === "live" ||
        (session.state !== "finished" &&
          (instantMs(session.date_start) ?? 0) > now),
    ) ?? null
  const target = nextSession?.date_start ?? data.race_start
  const targetIsRace = (nextSession?.name ?? "Race") === "Race"
  const isLive = nextSession?.state === "live"
  const flag = mediaUrl(flagFromCountry(data.country, 640), 640)

  return (
    <Card className={cn(
      "dark relative overflow-hidden rounded-xl border border-border/50 bg-card/85 backdrop-blur-xl text-card-foreground shadow-lg h-full flex flex-col group transition-all duration-300 hover:shadow-2xl",
      seriesMeta.hoverBorder
    )}>
      {/* Top subtle series accent neon line */}
      <div className={cn("absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r z-20 opacity-80 group-hover:opacity-100 transition-opacity", seriesMeta.topGradient)} />
      
      {/* Flag / circuit backdrop */}
      {flag ? (
        <>
          <img
            src={flag}
            alt=""
            aria-hidden
            className="pointer-events-none absolute inset-0 size-full object-cover opacity-20 dark:opacity-25 scale-100 transition-transform duration-700 group-hover:scale-105"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-card via-card/90 to-card/40 dark:to-card/20" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
        </>
      ) : null}

      <CardHeader className="relative z-10 pb-2">
        <CardTitle className="flex items-center justify-between gap-2 text-xs font-semibold tracking-wider uppercase text-muted-foreground">
          <div className="flex items-center gap-2">
            <img
              loading="lazy"
              src={`/logos/${series}-logo.png`}
              alt={`${series.toUpperCase()} Logo`}
              className="h-4.5 w-auto object-contain rounded-xs"
            />
            <span className={cn("font-bold tracking-wider", seriesMeta.accent)}>
              {seriesMeta.name}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {isLive ? (
              <Badge variant="default" className="bg-emerald-600 text-white gap-1 text-[10px] font-bold tracking-wider uppercase animate-pulse px-2 py-0.5">
                <Radio className="size-3 animate-ping" />
                AO VIVO
              </Badge>
            ) : null}
            {data.round && !resolution.isTest ? (
              <Badge variant="outline" className="font-mono uppercase tracking-wider text-[10px] border-white/15 bg-black/40 backdrop-blur-xs px-2 py-0.5">
                Etapa {data.round}
              </Badge>
            ) : null}
            {resolution.isTest ? (
              <Badge variant="outline" className="font-mono uppercase tracking-wider text-[10px] border-amber-500/30 text-amber-300 bg-amber-950/30 px-2 py-0.5">
                Testes Oficiais
              </Badge>
            ) : null}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="relative z-10 flex flex-col justify-between gap-4 flex-1 pt-1">
        <div>
          <div className="text-lg sm:text-xl md:text-2xl font-black tracking-tight text-foreground line-clamp-1">
            {data.name ?? data.circuit ?? "—"}
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground mt-0.5 font-medium flex items-center gap-1.5">
            <span className="truncate">
              {[data.circuit, data.location, data.country].filter(Boolean).join(" · ")}
            </span>
          </div>

          {nextSession ? (
            <div className="mt-2.5 flex items-start gap-1.5 text-xs text-muted-foreground font-mono">
              <CalendarDays className={cn("size-3.5 shrink-0 mt-0.5", seriesMeta.accent)} />
              <span className="whitespace-normal break-words leading-snug">
                {nextSession.name === "Race" || nextSession.name === "Corrida Principal" || nextSession.name === "Corrida"
                  ? `Largada: ${formatSessionDateTime(nextSession.date_start)} (Brasília)`
                  : `${nextSession.name}: ${formatSessionDateTime(nextSession.date_start)} (Brasília)`}
              </span>
            </div>
          ) : null}

          {data.schedule?.stale ? (
            <div className="mt-1 text-[10px] text-amber-400/90" data-testid="schedule-stale">
              Horários podem estar desatualizados (fonte temporariamente indisponível)
            </div>
          ) : null}

          {sessions.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1 sm:gap-1.5">
              {sessions.map((session: LiveSessionEntry) => (
                <SessionPill
                  key={session.key}
                  session={session}
                  next={nextSession?.key === session.key}
                  accentBorder={seriesMeta.accentPill}
                />
              ))}
            </div>
          ) : null}
        </div>

        {target ? (
          <div className="flex flex-col items-end justify-end mt-auto pt-2 gap-1 border-t border-border/30">
            <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
              <Timer className={cn("size-3", seriesMeta.accent, "animate-pulse")} />
              {resolution.isTest ? "Início dos testes em" : targetIsRace ? "Largada em" : "Próxima sessão em"}
            </span>
            <Countdown
              target={target}
              doneLabel={resolution.isTest ? "Testes iniciados!" : targetIsRace ? "Semáforo verde!" : "Sessão começou!"}
              accentColor={seriesMeta.accent}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
