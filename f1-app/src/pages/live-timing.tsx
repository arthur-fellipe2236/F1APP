import { useEffect, useState } from "react"
import {
  CalendarClock,
  CircleStop,
  Droplets,
  Flag,
  Pause,
  Play,
  RefreshCw,
  Thermometer,
  Wind,
} from "lucide-react"

import { ErrorState } from "@/components/error-state"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useApi } from "@/hooks/use-api"
import {
  api,
  type LiveDriverRow,
  type LiveMeetingEntry,
  type LiveTower,
} from "@/lib/api"

const FLAG_BADGES: Record<string, string> = {
  GREEN: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  CLEAR: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  YELLOW: "bg-yellow-400/15 text-yellow-600 border-yellow-400/40",
  "DOUBLE YELLOW": "bg-yellow-400/15 text-yellow-600 border-yellow-400/40",
  RED: "bg-red-500/15 text-red-600 border-red-500/30",
  BLUE: "bg-sky-500/15 text-sky-600 border-sky-500/30",
  WHITE: "bg-zinc-500/15 text-zinc-500 border-zinc-500/30",
  CHEQUERED:
    "bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900 dark:border-white",
}

const COMPOUND_BADGES: Record<string, string> = {
  SOFT: "bg-[#DA2F36] text-white",
  MEDIUM: "bg-[#F5C518] text-black",
  HARD: "bg-white text-black ring-1 ring-zinc-400",
  INTERMEDIATES: "bg-[#3F9E00] text-white",
  HEAVYINTERMEDIATES: "bg-[#006E7B] text-white",
}

const timeFmt = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
})

function gapText(row: LiveDriverRow): string {
  if (row.gap_to_leader === null || row.gap_to_leader === undefined) {
    return "—"
  }
  if (typeof row.gap_to_leader === "string") return row.gap_to_leader
  if (row.position === 1) return "Líder"
  return `+${row.gap_to_leader.toFixed(3)}`
}

function intervalText(row: LiveDriverRow): string {
  if (row.interval === null || row.interval === undefined) return "—"
  if (typeof row.interval === "string") return row.interval
  if (row.position === 1) return "—"
  return `+${row.interval.toFixed(3)}`
}

function TowerRow({
  row,
  state,
}: {
  row: LiveDriverRow
  state?: string
}) {
  const compound = row.compound
    ? COMPOUND_BADGES[row.compound.toUpperCase()]
    : undefined
  return (
    <div
      className="flex items-center gap-3 border-b border-l-4 px-3 py-1.5 text-sm last:border-b-0"
      style={{
        borderLeftColor: row.team_colour
          ? `#${row.team_colour}`
          : "var(--border)",
      }}
    >
      <span className="w-8 shrink-0 text-right">
        {row.position != null ? (
          <span className="font-semibold tabular-nums">{row.position}</span>
        ) : state && state !== "live" ? (
          <span className="rounded bg-destructive/10 px-1 text-[10px] font-bold text-destructive">
            OUT
          </span>
        ) : (
          "—"
        )}
      </span>
      <span className="w-8 shrink-0 tabular-nums text-muted-foreground">
        {row.driver_number}
      </span>
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <span className="truncate font-medium">{row.name}</span>
        {row.code ? (
          <span className="shrink-0 rounded border border-border px-1 text-[10px] text-muted-foreground">
            {row.code}
          </span>
        ) : null}
      </span>
      <span className="w-20 shrink-0 text-right tabular-nums">
        {gapText(row)}
      </span>
      <span className="w-20 shrink-0 text-right tabular-nums text-muted-foreground">
        {intervalText(row)}
      </span>
      <span className="w-12 shrink-0 text-right tabular-nums text-muted-foreground">
        {row.lap_number ?? "—"}
      </span>
      <span className="w-9 shrink-0">
        {compound ? (
          <span
            className={`inline-block size-5 rounded-full text-center text-[9px] font-bold leading-5 ${compound}`}
            title={row.compound ?? undefined}
          >
            {(row.compound ?? "")[0]}
          </span>
        ) : null}
      </span>
      <span className="w-8 shrink-0 text-right tabular-nums text-muted-foreground">
        {row.stops}
      </span>
    </div>
  )
}

function pickDefaultMeeting(meetings: LiveMeetingEntry[]): LiveMeetingEntry | undefined {
  return [...meetings]
    .reverse()
    .find((meeting) =>
      meeting.sessions.some((session) => session.state !== "scheduled"),
    )
}

function pickDefaultSession(
  meeting: LiveMeetingEntry,
): LiveMeetingEntry["sessions"][number] | undefined {
  const available = meeting.sessions.filter(
    (session) => session.state !== "scheduled",
  )
  const race = [...available]
    .reverse()
    .find((s) => s.name === "Race")
  return race ?? [...available].pop() ?? meeting.sessions[0]
}

export function LiveTimingPage() {
  const year = new Date().getFullYear()
  const meta = useApi(() => api.liveSessions(year), [year])

  const [meetingKey, setMeetingKey] = useState<number | null>(null)
  const [sessionKey, setSessionKey] = useState<number | null>(null)
  const [data, setData] = useState<LiveTower>()
  const [error, setError] = useState<string>()
  const [loading, setLoading] = useState(true)
  const [auto, setAuto] = useState(true)
  const [reloadTick, setReloadTick] = useState(0)

  const meetings = meta.data?.data ?? []
  const meeting = meetings.find((m) => m.meeting_key === meetingKey)
  const noSessions = Boolean(meeting && meeting.sessions.length === 0)

  useEffect(() => {
    if (meetingKey !== null || !meta.data?.data.length) return
    const meeting =
      pickDefaultMeeting(meta.data.data) ??
      meta.data.data[meta.data.data.length - 1]
    if (!meeting) return
    setMeetingKey(meeting.meeting_key)
    setSessionKey(pickDefaultSession(meeting)?.key ?? null)
  }, [meta.data, meetingKey])

  useEffect(() => {
    if (noSessions) {
      setData(undefined)
      setError(undefined)
      setLoading(false)
      return
    }
    let active = true
    setLoading(true)
    api
      .liveTower(sessionKey)
      .then((next) => {
        if (active) {
          setData(next)
          setError(undefined)
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Erro inesperado")
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [sessionKey, meetingKey, noSessions, reloadTick])

  useEffect(() => {
    if (!auto || data?.session.state !== "live") return
    const timer = setInterval(() => setReloadTick((tick) => tick + 1), 15_000)
    return () => clearInterval(timer)
  }, [auto, data?.session.state])

  const state = data?.session.state

  const handleMeetingChange = (value: string) => {
    const next = meetings.find((m) => String(m.meeting_key) === value)
    if (!next) return
    setMeetingKey(next.meeting_key)
    const preferred =
      next.sessions.find((s) => s.name === "Race" && s.state !== "scheduled") ??
      next.sessions.find((s) => s.state !== "scheduled") ??
      next.sessions[0]
    setSessionKey(preferred?.key ?? null)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live timing"
        description={`Torre de tempos por corrida — temporada ${year} — fonte: OpenF1 (sem mapa)`}
      >
        {data ? (
          <div className="flex flex-wrap items-center gap-2">
            {state === "live" ? (
              <Badge variant="destructive" className="gap-1.5">
                <span className="size-1.5 animate-pulse rounded-full bg-current" />
                AO VIVO
              </Badge>
            ) : state === "scheduled" ? (
              <Badge variant="outline" className="gap-1.5">
                <CalendarClock className="size-3" />
                AGENDADA
              </Badge>
            ) : (
              <Badge variant="outline">SESSÃO ENCERRADA</Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAuto((value) => !value)}
              disabled={state !== "live"}
            >
              {auto && state === "live" ? <Pause /> : <Play />}
              {auto && state === "live" ? "Pausar" : "Auto"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReloadTick((tick) => tick + 1)}
            >
              <RefreshCw className={loading ? "animate-spin" : undefined} />
              Atualizar
            </Button>
          </div>
        ) : null}
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="meeting-filter" className="text-muted-foreground">
            Etapa
          </Label>
          <Select
            value={meetingKey !== null ? String(meetingKey) : undefined}
            onValueChange={handleMeetingChange}
          >
            <SelectTrigger id="meeting-filter" className="min-w-64">
              <SelectValue
                placeholder={
                  meta.loading ? "Carregando…" : "Escolher corrida"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {meetings.map((item) => (
                <SelectItem
                  key={item.meeting_key}
                  value={String(item.meeting_key)}
                >
                  R{item.round} — {item.meeting_name} ({item.circuit})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="session-filter" className="text-muted-foreground">
            Sessão
          </Label>
          <Select
            value={sessionKey !== null ? String(sessionKey) : undefined}
            onValueChange={(value) => setSessionKey(Number(value))}
            disabled={!meeting?.sessions.length}
          >
            <SelectTrigger id="session-filter" className="min-w-44">
              <SelectValue placeholder="Escolher sessão" />
            </SelectTrigger>
            <SelectContent>
              {meeting?.sessions.map((session) => (
                <SelectItem key={session.key} value={String(session.key)}>
                  {session.name}
                  {session.state === "live" ? " • ao vivo" : ""}
                  {session.state === "scheduled" ? " • agendada" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {meta.error ? (
        <ErrorState message={meta.error} onRetry={meta.reload} />
      ) : error && !data ? (
        /Nenhuma sess/i.test(error) ? (
          <Card>
            <CardContent className="flex items-center gap-3 py-8 text-sm text-muted-foreground">
              <CircleStop className="size-5" />
              {error}
            </CardContent>
          </Card>
        ) : (
          <ErrorState
            message={error}
            onRetry={() => setReloadTick((tick) => tick + 1)}
          />
        )
      ) : noSessions ? (
        <Card>
          <CardContent className="flex items-center gap-3 py-8 text-sm text-muted-foreground">
            <CalendarClock className="size-5" />
            As sessões desta etapa ainda não foram publicadas pela OpenF1.
          </CardContent>
        </Card>
      ) : !data ? (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, index) => (
            <Skeleton key={index} className="h-9 w-full" />
          ))}
        </div>
      ) : (
        <>
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base">
                  {data.session.meeting_name ?? "Sessão"} ·{" "}
                  {data.session.name ?? data.session.type}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {[data.session.circuit, data.session.country]
                    .filter(Boolean)
                    .join(" · ")}{" "}
                  — atualizado às {timeFmt.format(new Date(data.updated_at))}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {data.flag ? (
                  <span
                    className={`rounded-md border px-2 py-1 text-xs font-semibold ${FLAG_BADGES[data.flag] ?? FLAG_BADGES.WHITE}`}
                  >
                    <Flag className="mr-1 inline size-3" />
                    {data.flag}
                  </span>
                ) : null}
                {data.current_lap ? (
                  <span className="rounded-md bg-secondary px-2 py-1 text-xs font-semibold tabular-nums">
                    Volta {data.current_lap}
                  </span>
                ) : null}
                <span className="flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs tabular-nums">
                  <Thermometer className="size-3 text-muted-foreground" />
                  Ar {data.weather.air_temperature ?? "—"}° · Pista{" "}
                  {data.weather.track_temperature ?? "—"}°
                </span>
                <span className="flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs tabular-nums">
                  <Wind className="size-3 text-muted-foreground" />
                  {data.weather.wind_speed ?? "—"} km/h
                </span>
                <span className="flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs tabular-nums">
                  <Droplets className="size-3 text-muted-foreground" />
                  {data.weather.humidity ?? "—"}%
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {state === "scheduled" ? (
                <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                  <CalendarClock className="mr-2 inline size-4" />
                  Esta sessão ainda não começou — os tempos aparecem aqui
                  durante o fim de semana do GP.
                </p>
              ) : (
                <>
                  <div className="flex items-center gap-3 border-y border-l-4 border-l-transparent bg-muted/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <span className="w-8 text-right">P</span>
                    <span className="w-8">#</span>
                    <span className="flex-1">Piloto</span>
                    <span className="w-20 text-right">Gap</span>
                    <span className="w-20 text-right">Intervalo</span>
                    <span className="w-12 text-right">Volta</span>
                    <span className="w-9 text-center">Pneu</span>
                    <span className="w-8 text-right">Box</span>
                  </div>
                  {error ? (
                    <p className="border-b bg-destructive/5 px-3 py-2 text-xs text-destructive">
                      Não foi possível atualizar ({error}) — exibindo o último
                      resultado.
                    </p>
                  ) : null}
                  {data.drivers.map((row) => (
                    <TowerRow key={row.driver_number} row={row} state={state} />
                  ))}
                  {data.drivers.length === 0 ? (
                    <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                      Nenhum tempo registrado nesta sessão ainda.
                    </p>
                  ) : null}
                </>
              )}
            </CardContent>
          </Card>

          {data.messages.length > 0 && state !== "scheduled" ? (
            <Card size="sm">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Race control
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {[...data.messages].reverse().map((message, index) => (
                  <p key={index} className="text-sm text-muted-foreground">
                    <span className="mr-2 text-xs tabular-nums">
                      {message.date
                        ? timeFmt.format(new Date(message.date))
                        : ""}
                    </span>
                    {message.message}
                  </p>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </>
      )}
    </div>
  )
}
