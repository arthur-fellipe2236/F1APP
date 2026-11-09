import { useEffect, useState } from "react"
import { CalendarDays, Timer, CalendarOff, Radio } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useApi } from "@/hooks/use-api"
import { api, type LiveSessionEntry } from "@/lib/api"
import { flagFromCountry } from "@/lib/assets"
import { mediaUrl } from "@/lib/media"
import { cn } from "@/lib/utils"
import { NEXT_RACE_POLL_MS } from "@/lib/request-gate"

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

// Formatadores padronizados no fuso horário oficial de Brasília (America/Sao_Paulo)
const dateTimeFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  weekday: "short",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
})

const timeFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
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
      title={`${session.name} — ${dateTimeFmt.format(
        new Date(session.date_start),
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
  if (query.error || !data) return null

  if (data.offseason) {
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
              Temporada {data.season}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10 flex flex-col items-center justify-center flex-1 py-8 px-6 text-center gap-3">
          <div className="rounded-full bg-secondary/60 p-3.5 shadow-sm ring-1 ring-border/50 transition-all duration-300 group-hover:scale-105">
            <CalendarOff className="size-6 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>
          <p className="text-xs sm:text-sm font-medium text-muted-foreground leading-relaxed max-w-[88%]">
            {data.message || `Aguardando homologação do calendário oficial de ${data.season} pela FIA.`}
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
          new Date(session.date_start).getTime() > now),
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
            {data.round ? (
              <Badge variant="outline" className="font-mono uppercase tracking-wider text-[10px] border-white/15 bg-black/40 backdrop-blur-xs px-2 py-0.5">
                Etapa {data.round}
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
            <div className="mt-2.5 flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
              <CalendarDays className={cn("size-3.5 shrink-0", seriesMeta.accent)} />
              <span className="truncate">
                {nextSession.name === "Race"
                  ? `Largada: ${dateTimeFmt.format(new Date(nextSession.date_start))} (Brasília)`
                  : `${nextSession.name}: ${dateTimeFmt.format(new Date(nextSession.date_start))} (Brasília)`}
              </span>
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
              {targetIsRace ? "Largada em" : "Próxima sessão em"}
            </span>
            <Countdown
              target={target}
              doneLabel={targetIsRace ? "Semáforo verde!" : "Sessão começou!"}
              accentColor={seriesMeta.accent}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
