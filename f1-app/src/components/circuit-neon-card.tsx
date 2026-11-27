import { useEffect, useState, useMemo } from "react"
import { type NextRace, type LiveSessionEntry } from "@/lib/api"
import { instantMs, formatSessionDateTime } from "@/lib/datetime"
import { cn } from "@/lib/utils"

interface CircuitNeonCardProps {
  race: NextRace | null
  series?: string
}

interface RemainingTime {
  days: number
  hours: number
  minutes: number
  seconds: number
  done: boolean
}

function calculateRemaining(targetIso: string | null | undefined): RemainingTime {
  if (!targetIso) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true }
  }
  const targetMs = instantMs(targetIso)
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

export function CircuitNeonCard({ race, series = "f1" }: CircuitNeonCardProps) {
  const isOffseason = Boolean(race?.offseason)

  // Próxima sessão alvo para contagem regressiva
  const nextSession = useMemo(() => {
    if (isOffseason) {
      return { name: "Temporada em Preparação", date: null }
    }
    if (!race?.sessions || race.sessions.length === 0) {
      return { name: "Corrida Principal", date: race?.race_start }
    }
    const now = Date.now()
    const upcoming = race.sessions.find((s) => {
      const ms = instantMs(s.date_start)
      return ms != null && ms > now
    })
    if (upcoming) {
      return { name: upcoming.name || upcoming.session_name || "Próxima Sessão", date: upcoming.date_start }
    }
    return { name: "Corrida", date: race.race_start }
  }, [race, isOffseason])

  // Contagem regressiva em tempo real (1s interval)
  const [countdown, setCountdown] = useState<RemainingTime>(() => calculateRemaining(nextSession.date))

  useEffect(() => {
    setCountdown(calculateRemaining(nextSession.date))
    if (!nextSession.date) return

    const timer = setInterval(() => {
      setCountdown(calculateRemaining(nextSession.date))
    }, 1000)
    return () => clearInterval(timer)
  }, [nextSession.date])

  const circuitKey = (race?.circuit || race?.location || race?.name || "").toLowerCase()
  const isLusail = circuitKey.includes("lusail") || circuitKey.includes("qatar") || circuitKey.includes("catar")
  const isInterlagos = circuitKey.includes("interlagos") || circuitKey.includes("são paulo") || circuitKey.includes("brazil") || circuitKey.includes("brasil")

  const roundNum = race?.round ?? (series === "f2" ? 13 : 22)
  const eventName = isOffseason
    ? `FIA ${series.toUpperCase()} · TEMPORADA 2026`
    : race?.name ?? `Grande Prêmio de ${series.toUpperCase()}`

  const trackLocation = isOffseason
    ? "Calendário oficial FIA em definição"
    : race?.circuit ? `${race.circuit} · ${race.location || ""}` : (race?.location || "Circuito Internacional")

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-[#10121a]/95 p-4 sm:p-5 shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-xl relative overflow-hidden flex flex-col justify-between">
      {/* Glow ciano no topo do card */}
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#00F2FE]/70 to-transparent pointer-events-none" />

      {/* CABEÇALHO DO CARD */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase bg-white/10 text-white/90 border border-white/10">
            {isOffseason ? "Off-Season FIA" : countdown.done ? "Grande Prêmio em Curso" : "Próxima Etapa"}
          </span>
          <span className="font-racing text-base sm:text-lg text-[#FFD700] tracking-wider font-bold">
            {isOffseason ? "2026" : `ETAPA ${roundNum} · ${series.toUpperCase()}`}
          </span>
        </div>

        <h2 className="font-racing text-2xl sm:text-3xl lg:text-4xl text-white tracking-wide leading-none uppercase">
          {eventName}
        </h2>
        <div className="text-xs text-white/60 font-sans mt-1">
          {trackLocation}
          {isLusail && !isOffseason && " · 5.380 km · 16 Curvas"}
          {isInterlagos && !isOffseason && " · 4.309 km · 15 Curvas"}
        </div>
      </div>

      {/* TRAÇADO VETORIAL OFICIAL SVG (NEON BROADCAST) */}
      <div className="my-3 sm:my-4 relative rounded-xl border border-white/10 bg-[#07080c]/90 overflow-hidden p-2 sm:p-3">
        {/* Traçado oficial de Lusail (GP do Catar / Lusail F2) */}
        {isLusail && !isOffseason ? (
          <svg className="w-full h-36 sm:h-44" viewBox="0 0 480 200" fill="none" aria-label="Traçado oficial do Circuito de Lusail">
            <defs>
              <pattern id="gridPatternLusail" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="480" height="200" fill="url(#gridPatternLusail)" rx="6" />

            {/* Traçado da pista em Ciano Neon com Glow */}
            <path
              d="M 60,165 L 290,165 C 330,165 350,150 360,130 C 370,110 360,90 340,80 C 320,70 300,75 280,65 C 260,55 230,65 210,85 C 190,105 170,95 150,75 C 130,55 160,35 220,35 C 270,35 320,40 370,50 C 420,60 445,80 440,115 C 435,150 400,160 360,165 Z"
              stroke="#00F2FE"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: "drop-shadow(0 0 6px #00F2FE)" }}
            />

            {/* Zona DRS Reta Principal (Verde Vibrante) */}
            <path
              d="M 60,165 L 290,165"
              stroke="#10B981"
              strokeWidth="5"
              strokeLinecap="round"
              aria-label="Zona DRS - Reta Principal (1.068 km)"
            />

            {/* Linha de largada e chegada */}
            <line x1="80" y1="158" x2="80" y2="172" stroke="#FFFFFF" strokeWidth="3" />
            <polygon points="80,155 86,158 80,161" fill="#E10600" />

            {/* Curvas estratégicas sinalizadas */}
            <circle cx="360" cy="130" r="3.5" fill="#E10600" />
            <text x="370" y="134" fill="#FFFFFF" fontSize="9" fontWeight="700" fontFamily="sans-serif">T1</text>

            <circle cx="280" cy="65" r="3.5" fill="#FFD700" />
            <text x="270" y="58" fill="#FFD700" fontSize="8" fontWeight="700" fontFamily="sans-serif">T6 Hairpin</text>

            <circle cx="440" cy="115" r="3.5" fill="#10B981" />
            <text x="385" y="112" fill="#86efac" fontSize="8" fontWeight="700" fontFamily="sans-serif">Triple Apex</text>

            {/* Informações técnicas do circuito */}
            <text x="12" y="20" fill="rgba(255,255,255,0.7)" fontSize="9" fontFamily="monospace">
              LUSAIL INTERNATIONAL CIRCUIT · {series.toUpperCase()} OFICIAL
            </text>
            <text x="12" y="190" fill="#10B981" fontSize="9" fontWeight="700" fontFamily="sans-serif">
              ● ZONA DRS: 1 (1.068 KM) · CURVAS: 16 · SENTIDO HORÁRIO
            </text>
          </svg>
        ) : isInterlagos && !isOffseason ? (
          /* Traçado oficial de Interlagos */
          <svg className="w-full h-36 sm:h-44" viewBox="0 0 480 200" fill="none" aria-label="Traçado oficial do Autódromo de Interlagos">
            <defs>
              <pattern id="gridPatternInterlagos" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="480" height="200" fill="url(#gridPatternInterlagos)" rx="6" />

            <path
              d="M 70,165 L 150,165 C 190,165 210,155 240,140 C 260,130 280,105 320,100 C 370,95 410,120 440,110 C 460,100 465,65 440,45 C 410,25 360,30 330,45 C 300,60 270,70 230,65 C 190,60 160,35 120,40 C 80,45 50,70 50,110 C 50,135 55,165 70,165 Z"
              stroke="#00F2FE"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: "drop-shadow(0 0 6px #00F2FE)" }}
            />

            <path d="M 120,40 C 80,45 50,70 50,110" stroke="#10B981" strokeWidth="5" strokeLinecap="round" />
            <path d="M 330,45 C 300,60 270,70 230,65" stroke="#10B981" strokeWidth="5" strokeLinecap="round" />

            <line x1="68" y1="158" x2="68" y2="172" stroke="#FFFFFF" strokeWidth="3" />
            <polygon points="68,155 74,158 68,161" fill="#E10600" />

            <circle cx="150" cy="165" r="4" fill="#E10600" />
            <text x="140" y="185" fill="#FFF" fontSize="9" fontWeight="700">S do Senna</text>

            <circle cx="240" cy="140" r="4" fill="#FFD700" />
            <text x="235" y="132" fill="#FFD700" fontSize="8" fontWeight="700">Curva do Sol</text>

            <circle cx="330" cy="45" r="4" fill="#10B981" />
            <text x="315" y="34" fill="#86efac" fontSize="8" fontWeight="700">Junção</text>

            <text x="12" y="20" fill="rgba(255,255,255,0.7)" fontSize="9" fontFamily="monospace">
              AUTÓDROMO DE INTERLAGOS · RECORDE: 1:10.540 (BOTTAS)
            </text>
            <text x="12" y="190" fill="#10B981" fontSize="9" fontWeight="700">
              ● ZONAS DRS: 2 · CURVAS: 15 · SENTIDO ANTI-HORÁRIO
            </text>
          </svg>
        ) : (
          /* Estado com suporte a Offseason ou circuito sem vetor */
          <div className="w-full h-36 sm:h-44 flex flex-col items-center justify-center text-center p-4">
            <div className="text-xs font-mono uppercase text-[#00F2FE] tracking-widest mb-1">
              {isOffseason ? `FIA ${series.toUpperCase()} · OFF-SEASON` : "Traçado Técnico Oficial"}
            </div>
            <div className="text-base font-bold text-white uppercase tracking-wide">
              {isOffseason ? "Aguardando Publicação de Etapas" : race?.circuit || "Circuito Homologado FIA"}
            </div>
            <div className="text-xs text-white/50 mt-1 max-w-xs">
              {isOffseason
                ? "As etapas oficiais da Fórmula 3 serão anunciadas pela FIA. Dados e telemetria sincronizados em tempo real."
                : `Extensão: ${race?.circuit || "Padrão FIA"} · Telemetria ativa durante as sessões oficiais.`}
            </div>
          </div>
        )}
      </div>

      {/* CONTAGEM REGRESSIVA SEGMENTADA DIGITAL */}
      <div className="mb-3">
        <div className="text-[10px] font-mono text-white/50 uppercase tracking-widest mb-1 text-center sm:text-left">
          {isOffseason ? (
            <span className="text-[#00F2FE]">TEMPORADA EM PREPARAÇÃO TÉCNICA</span>
          ) : (
            <>Contagem regressiva para: <span className="text-white font-bold">{nextSession.name}</span></>
          )}
        </div>
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
          <div className="rounded-lg bg-black/60 border border-white/10 p-1.5 sm:p-2 text-center shadow-inner">
            <div className="font-mono text-lg sm:text-2xl font-black text-white tracking-tight tabular-nums">
              {isOffseason ? "--" : String(countdown.days).padStart(2, "0")}
            </div>
            <div className="text-[8px] sm:text-[9px] font-bold text-white/50 uppercase tracking-widest mt-0.5">
              Dias
            </div>
          </div>
          <div className="rounded-lg bg-black/60 border border-white/10 p-1.5 sm:p-2 text-center shadow-inner">
            <div className="font-mono text-lg sm:text-2xl font-black text-white tracking-tight tabular-nums">
              {isOffseason ? "--" : String(countdown.hours).padStart(2, "0")}
            </div>
            <div className="text-[8px] sm:text-[9px] font-bold text-white/50 uppercase tracking-widest mt-0.5">
              Horas
            </div>
          </div>
          <div className="rounded-lg bg-black/60 border border-white/10 p-1.5 sm:p-2 text-center shadow-inner">
            <div className="font-mono text-lg sm:text-2xl font-black text-white tracking-tight tabular-nums">
              {isOffseason ? "--" : String(countdown.minutes).padStart(2, "0")}
            </div>
            <div className="text-[8px] sm:text-[9px] font-bold text-white/50 uppercase tracking-widest mt-0.5">
              Minutos
            </div>
          </div>
          <div className="rounded-lg bg-black/60 border border-white/10 p-1.5 sm:p-2 text-center shadow-inner">
            <div className="font-mono text-lg sm:text-2xl font-black text-[#E10600] tracking-tight tabular-nums">
              {isOffseason ? "--" : String(countdown.seconds).padStart(2, "0")}
            </div>
            <div className="text-[8px] sm:text-[9px] font-bold text-white/50 uppercase tracking-widest mt-0.5">
              Segundos
            </div>
          </div>
        </div>
      </div>

      {/* CRONOGRAMA DAS SESSÕES OFICIAIS */}
      <div className="space-y-1.5 border-t border-white/10 pt-2.5 text-xs">
        {race?.sessions && race.sessions.length > 0 ? (
          race.sessions.slice(0, 4).map((session: LiveSessionEntry) => {
            const isSessionLive = session.state === "live"
            const isFinished = session.state === "finished"
            const formattedTime = formatSessionDateTime(session.date_start)

            return (
              <div
                key={session.key || session.name}
                className={cn(
                  "flex items-center justify-between py-1 px-1.5 rounded transition-colors",
                  isSessionLive
                    ? "bg-[#E10600]/20 border border-[#E10600]/40 text-white font-bold"
                    : "hover:bg-white/5 text-white/80"
                )}
              >
                <span className="font-medium truncate max-w-[170px] sm:max-w-none">
                  {session.name || session.session_name}
                </span>
                <span className="font-mono text-[11px] tabular-nums shrink-0">
                  {isSessionLive ? (
                    <span className="text-[#E10600] font-black uppercase flex items-center gap-1 animate-pulse">
                      <span className="size-1.5 rounded-full bg-[#E10600]" />
                      AO VIVO NA PISTA
                    </span>
                  ) : isFinished ? (
                    <span className="text-white/40">Encerrado</span>
                  ) : (
                    <span className="text-white/70">{formattedTime}</span>
                  )}
                </span>
              </div>
            )
          })
        ) : (
          <div className="flex items-center justify-between py-1 text-white/60">
            <span>{isOffseason ? "Calendário 2026" : "Grande Prêmio"}</span>
            <span className="font-mono">{isOffseason ? "Aguardando confirmação FIA" : race?.race_start ? formatSessionDateTime(race.race_start) : "Horário a confirmar"}</span>
          </div>
        )}
      </div>
    </div>
  )
}
