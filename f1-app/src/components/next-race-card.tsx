import { useEffect, useState } from "react"
import { CalendarDays, Timer, CalendarOff } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useApi } from "@/hooks/use-api"
import { api, type LiveSessionEntry } from "@/lib/api"
import { flagFromCountry } from "@/lib/assets"
import { mediaUrl } from "@/lib/media"
import { cn } from "@/lib/utils"

const SESSION_SHORT: Record<string, string> = {
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
    <div className="flex min-w-[50px] sm:min-w-[54px] flex-col items-center justify-center rounded-lg border border-white/10 bg-black/45 px-2.5 py-1.5 shadow-inner backdrop-blur-md transition-all duration-300 group-hover:border-primary/40">
      <span className="text-xl sm:text-2xl font-black font-mono tracking-tight tabular-nums text-foreground drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase mt-0.5">
        {label}
      </span>
    </div>
  )
}

function Countdown({
  target,
  doneLabel,
}: {
  target: string
  doneLabel: string
}) {
  const [remaining, setRemaining] = useState(() => remainingUntil(target))

  useEffect(() => {
    const timer = setInterval(() => setRemaining(remainingUntil(target)), 1000)
    return () => clearInterval(timer)
  }, [target])

  if (remaining.done) {
    return (
      <Badge variant="destructive" className="gap-1.5 text-sm font-bold tracking-wide uppercase shadow-lg">
        <span className="size-2 animate-pulse rounded-full bg-current" />
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
        "flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold font-mono tracking-tight tabular-nums transition-all duration-200",
        finished &&
          "border-white/5 bg-secondary/40 text-muted-foreground/60 line-through opacity-70",
        live && "border-emerald-500/60 bg-emerald-500/15 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)] animate-pulse",
        !finished &&
          !live &&
          next &&
          "border-primary/60 bg-primary/15 text-foreground ring-1 ring-primary/40 shadow-[0_0_12px_rgba(var(--primary-rgb),0.25)] font-bold",
        !finished && !live && !next && "border-white/10 bg-background/40 text-muted-foreground hover:border-white/20",
      )}
    >
      {live && <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />}
      {sessionLabel(session)}
      <span className="font-normal opacity-85">
        {timeFmt.format(new Date(session.date_start))}
      </span>
    </span>
  )
}

export function NextRaceCard({
  series = "f1",
}: {
  series?: "f1" | "f2" | "f3"
}) {
  const query = useApi(() => {
    if (series === "f2") return api.nextF2Race()
    if (series === "f3") return api.nextF3Race()
    return api.nextRace()
  }, [series])
  const data: any = query.data
  if (query.error || !data) return null

  if (data.offseason) {
    return (
      <Card className="next-race-light group relative overflow-hidden border-black/10 bg-gradient-to-br from-card to-muted/50 text-card-foreground shadow-md h-full flex flex-col transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:border-primary/20">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.02] dark:opacity-[0.04] transition-transform duration-700 group-hover:scale-125 group-hover:opacity-[0.06] dark:group-hover:opacity-[0.08] group-hover:rotate-3">
          <CalendarDays className="size-64" />
        </div>
        <CardHeader className="relative z-10">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors duration-500 group-hover:text-foreground">
            <img
              loading="lazy"
              src={`/logos/${series}-logo.png`}
              alt={`${series.toUpperCase()} Logo`}
              className="h-5 w-auto object-contain rounded-sm"
            />
            <span className="ml-1 font-semibold">
              Fórmula {series === "f1" ? "1" : series === "f2" ? "2" : "3"} — Temporada {data.season}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10 flex flex-col items-center justify-center flex-1 py-8 px-6 text-center gap-4">
          <div className="rounded-full bg-secondary/80 p-4 shadow-sm ring-1 ring-border/50 transition-all duration-500 group-hover:bg-primary/10 group-hover:ring-primary/30 group-hover:scale-110">
            <CalendarOff className="size-8 text-muted-foreground transition-colors duration-500 group-hover:text-primary" />
          </div>
          <div className="text-sm font-medium text-muted-foreground leading-relaxed max-w-[90%] transition-colors duration-500 group-hover:text-foreground">
            {data.message || `Aguardando homologação do calendário oficial de ${data.season} pela FIA.`}
          </div>
        </CardContent>
      </Card>
    )
  }

  const sessions = data.sessions ?? []
  const now = Date.now()
  const nextSession =
    sessions.find(
      (session: LiveSessionEntry) =>
        session.state === "live" ||
        (session.state !== "finished" &&
          new Date(session.date_start).getTime() > now),
    ) ?? null
  const target = nextSession?.date_start ?? data.race_start
  const targetIsRace = (nextSession?.name ?? "Race") === "Race"
  const flag = mediaUrl(flagFromCountry(data.country, 640), 640)

  return (
    <Card className="dark relative overflow-hidden border-white/10 bg-card/90 backdrop-blur-xl text-card-foreground shadow-lg h-full flex flex-col group transition-all duration-500 hover:shadow-2xl hover:border-primary/40">
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent z-20 opacity-80 group-hover:opacity-100 transition-opacity" />
      {flag ? (
        <>
          <img
            src={flag}
            alt=""
            aria-hidden
            className="pointer-events-none absolute inset-0 size-full object-cover opacity-25 dark:opacity-35 scale-100 transition-transform duration-1000 group-hover:scale-105"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-card via-card/90 to-card/25 dark:to-transparent" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-80" />
        </>
      ) : null}
      <CardHeader className="relative z-10">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <img
            loading="lazy"
            src={`/logos/${series}-logo.png`}
            alt={`${series.toUpperCase()} Logo`}
            className="h-5 w-auto object-contain rounded-sm"
          />
          {data.round ? (
            <Badge variant="outline" className="ml-1 font-mono uppercase tracking-wider text-[11px] border-white/20 bg-black/20 backdrop-blur-xs">
              Etapa {data.round}
            </Badge>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10 flex flex-wrap items-stretch justify-between gap-4 flex-1">
        <div>
          <div className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            {data.name ?? data.circuit ?? "—"}
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground mt-0.5 font-medium">
            {[data.circuit, data.location, data.country]
              .filter(Boolean)
              .join(" · ")}
          </div>
          {nextSession ? (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground/90 font-mono">
              <CalendarDays className="size-3.5 text-primary" />
              {nextSession.name === "Race"
                ? `Largada em ${dateTimeFmt.format(new Date(nextSession.date_start))}`
                : `${nextSession.name} em ${dateTimeFmt.format(new Date(nextSession.date_start))}`}
            </div>
          ) : null}
          {sessions.length > 0 ? (
            <div className="mt-3.5 flex flex-wrap gap-1.5">
              {sessions.map((session: LiveSessionEntry) => (
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
          <div className="flex flex-col items-end justify-end mt-auto ml-auto gap-1.5">
            <span className="flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
              <Timer className="size-3 text-primary animate-pulse" />
              {targetIsRace ? "Largada em" : "Próxima sessão em"}
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
