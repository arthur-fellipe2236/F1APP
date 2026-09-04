import { useEffect, useState } from "react"
import { CalendarDays, Flag, Timer } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useApi } from "@/hooks/use-api"
import { api, type LiveSessionEntry, type NextRace } from "@/lib/api"
import { flagFromCountry } from "@/lib/assets"
import { mediaUrl } from "@/lib/media"
import { cn } from "@/lib/utils"

const SESSION_SHORT: Record<string, string> = {
  "Practice 1": "P1",
  "Practice 2": "P2",
  "Practice 3": "P3",
  "Sprint Qualifying": "SQ",
  "Sprint Shootout": "SQ",
  Sprint: "SP",
  Qualifying: "Q",
  Race: "R",
}

const dateTimeFmt = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
})

const timeFmt = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
})

interface Remaining {
  days: number
  hours: number
  minutes: number
  seconds: number
  done: boolean
}

function remainingUntil(target: string): Remaining {
  const diff = new Date(target).getTime() - Date.now()
  if (diff <= 0) {
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

function CountdownBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex min-w-14 flex-col items-center rounded-lg bg-secondary px-2 py-1.5">
      <span className="text-xl font-bold tabular-nums">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[10px] tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
    </div>
  )
}

function Countdown({ target, doneLabel }: { target: string; doneLabel: string }) {
  const [remaining, setRemaining] = useState(() => remainingUntil(target))

  useEffect(() => {
    const timer = setInterval(
      () => setRemaining(remainingUntil(target)),
      1000,
    )
    return () => clearInterval(timer)
  }, [target])

  if (remaining.done) {
    return (
      <Badge variant="destructive" className="gap-1.5 text-sm">
        <span className="size-1.5 animate-pulse rounded-full bg-current" />
        {doneLabel}
      </Badge>
    )
  }
  return (
    <div className="flex items-end gap-2">
      <CountdownBlock value={remaining.days} label="dias" />
      <CountdownBlock value={remaining.hours} label="horas" />
      <CountdownBlock value={remaining.minutes} label="min" />
      <CountdownBlock value={remaining.seconds} label="seg" />
    </div>
  )
}

function sessionLabel(session: LiveSessionEntry): string {
  return SESSION_SHORT[session.name ?? ""] ?? session.name ?? "Sessão"
}

function SessionPill({
  session,
  next,
}: {
  session: LiveSessionEntry
  next: boolean
}) {
  const finished = session.state === "finished"
  const live = session.state === "live"
  return (
    <span
      title={`${session.name} — ${dateTimeFmt.format(
        new Date(session.date_start),
      )}${live ? " · ao vivo" : ""}`}
      className={cn(
        "flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-semibold tabular-nums",
        finished &&
          "border-transparent bg-secondary text-muted-foreground line-through opacity-60",
        live && "border-emerald-500/40 bg-emerald-500/10 text-emerald-600",
        !finished && !live && next &&
          "border-primary/40 bg-primary/[0.07] ring-1 ring-primary/25",
        !finished && !live && !next && "border-border text-muted-foreground",
      )}
    >
      {sessionLabel(session)}
      <span className="font-normal">{timeFmt.format(new Date(session.date_start))}</span>
    </span>
  )
}

export function NextRaceCard() {
  const query = useApi(() => api.nextRace(), [])
  const data: NextRace | undefined = query.data
  if (query.error || !data) return null

  const sessions = data.sessions ?? []
  const now = Date.now()
  const nextSession =
    sessions.find(
      (session) =>
        session.state === "live" ||
        (session.state !== "finished" &&
          new Date(session.date_start).getTime() > now),
    ) ?? null
  const target = nextSession?.date_start ?? data.race_start
  const targetIsRace = (nextSession?.name ?? "Race") === "Race"
  const flag = mediaUrl(flagFromCountry(data.country, 640), 640)

  return (
    <Card className="relative overflow-hidden border-black/10 bg-card text-card-foreground shadow-md dark:bg-card">
      {flag ? (
        <>
          <img
            src={flag}
            alt=""
            aria-hidden
            className="pointer-events-none absolute inset-0 size-full object-cover opacity-[0.55] dark:opacity-15 dark:brightness-75"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-card/95 via-card/70 to-transparent" />
        </>
      ) : null}
      <CardHeader className="relative z-10">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Flag className="size-4" />
          Próxima corrida
          {data.round ? (
            <Badge variant="outline" className="ml-1">
              Etapa {data.round}
            </Badge>
          ) : null}
          <Badge variant="ghost" className="ml-auto text-[10px]">
            fonte: {data.source}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xl font-semibold tracking-tight">
            {data.name ?? data.circuit ?? "—"}
          </div>
          <div className="text-sm text-muted-foreground">
            {[data.circuit, data.location, data.country]
              .filter(Boolean)
              .join(" · ")}
          </div>
          {nextSession ? (
            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="size-3" />
              {nextSession.name === "Race"
                ? `Largada em ${dateTimeFmt.format(new Date(nextSession.date_start))}`
                : `${nextSession.name} em ${dateTimeFmt.format(new Date(nextSession.date_start))}`}
            </div>
          ) : null}
          {sessions.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {sessions.map((session) => (
                <SessionPill
                  key={session.key}
                  session={session}
                  next={nextSession?.key === session.key}
                />
              ))}
            </div>
          ) : null}
        </div>
        {target ? (
          <div className="flex flex-col items-end gap-1">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Timer className="size-3" />
              {targetIsRace ? "largada em" : "próxima sessão em"}
            </span>
            <Countdown
              target={target}
              doneLabel={targetIsRace ? "Semáforo verde!" : "Sessão começou!"}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
