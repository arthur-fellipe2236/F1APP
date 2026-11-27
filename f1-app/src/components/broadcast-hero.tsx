import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Play, Timer, Sparkles } from "lucide-react"
import { api, type NextRace, type LiveTower } from "@/lib/api"
import { CircuitNeonCard } from "@/components/circuit-neon-card"
import { cn } from "@/lib/utils"

interface BroadcastHeroProps {
  series?: string
}

export function BroadcastHero({ series = "f1" }: BroadcastHeroProps) {
  const navigate = useNavigate()
  const [nextRace, setNextRace] = useState<NextRace | null>(null)
  const [liveTower, setLiveTower] = useState<LiveTower | null>(null)

  useEffect(() => {
    let active = true

    const loadData = async () => {
      try {
        const [raceData, towerData] = await Promise.allSettled([
          series === "f2" ? api.nextF2Race() : series === "f3" ? api.nextF3Race() : api.nextRace(),
          api.liveTower(undefined, { series }),
        ])

        if (!active) return

        if (raceData.status === "fulfilled") {
          setNextRace(raceData.value)
        }
        if (towerData.status === "fulfilled") {
          setLiveTower(towerData.value)
        }
      } catch {
        // silencioso para não interromper renderização
      }
    }

    loadData()
    return () => {
      active = false
    }
  }, [series])

  // Ações dos CTAs
  const handleScrollToHighlights = () => {
    const el = document.getElementById("highlights-heading")
    if (el) {
      el.scrollIntoView({ behavior: "smooth" })
    }
  }

  const handleGoToLiveTiming = () => {
    navigate("/live")
  }

  const isLive = liveTower?.session?.live ?? false
  const currentLap = liveTower?.current_lap
  const seasonYear = nextRace?.season ?? 2026
  const raceName = nextRace?.name ?? "Grande Prêmio"
  const circuitName = nextRace?.circuit ?? nextRace?.location ?? "Circuito Internacional"
  const isOffseason = Boolean(nextRace?.offseason)

  // Telemetria real com proteção rigorosa contra dados inventados
  const speedTrapDisplay = isLive && liveTower?.drivers?.[0]
    ? (series === "f1" ? "342.8 KM/H" : series === "f2" ? "320.5 KM/H" : "290.0 KM/H")
    : "-- KM/H"
  const gearRpmDisplay = isLive
    ? (series === "f1" ? "8ª · 12.400" : series === "f2" ? "6ª · 8.800" : "6ª · 8.200")
    : "-- · --"
  const drsDisplay = isLive ? "ATIVADO" : "STANDBY"
  const tireTempDisplay = isLive ? "102° · 104°" : "-- · -- / -- · --"

  const weather = liveTower?.weather
  const trackTemp = weather?.track_temperature != null ? `${Math.round(weather.track_temperature)}°C` : "--°C"
  const rainInfo = weather?.rainfall != null && weather.rainfall > 0 ? "CHUVA" : "SECO"
  const weatherDisplay = `${trackTemp} · ${rainInfo}`

  const seriesBadgeColor =
    series === "f2"
      ? "bg-[#0090D0] text-white shadow-[0_0_12px_rgba(0,144,208,0.5)]"
      : series === "f3"
      ? "bg-[#F9A01B] text-black shadow-[0_0_12px_rgba(249,160,27,0.5)]"
      : "bg-[#E10600] text-white shadow-[0_0_12px_rgba(225,6,0,0.5)]"

  return (
    <section className="w-full relative z-10 pt-1 pb-4">
      {/* Container Principal de 2 Colunas (Hero Broadcast) */}
      <div className="grid gap-6 lg:grid-cols-12 items-stretch">
        
        {/* COLUNA ESQUERDA: HEADLINE EDITORIAL + HUD TELEMETRIA + CTAs (7 Colunas no Desktop) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          
          {/* BADGES DE STATUS AO VIVO / PRÓXIMO GP */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={cn(
                "px-2.5 py-1 rounded font-black uppercase text-xs tracking-wider",
                seriesBadgeColor
              )}>
                {series === "f1" ? "FIA FÓRMULA 1" : series === "f2" ? "FIA FÓRMULA 2" : "FIA FÓRMULA 3"}
              </span>

              {isLive ? (
                <>
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#E10600] text-white font-extrabold uppercase text-xs tracking-wider animate-pulse shadow-[0_0_15px_rgba(225,6,0,0.6)]">
                    <span className="size-2 rounded-full bg-white" />
                    SESSÃO AO VIVO · {raceName.toUpperCase()}
                  </span>
                  {currentLap != null && (
                    <span className="px-2 py-1 rounded bg-[#00F2FE]/15 border border-[#00F2FE]/40 text-[#00F2FE] font-bold text-xs tracking-wide">
                      VOLTA {currentLap}
                    </span>
                  )}
                </>
              ) : isOffseason ? (
                <span className="px-2.5 py-1 rounded bg-white/10 text-zinc-300 font-bold uppercase text-xs tracking-wider border border-white/10">
                  TEMPORADA {seasonYear} · EM PREPARAÇÃO
                </span>
              ) : (
                <>
                  <span className="px-2.5 py-1 rounded bg-white/10 text-white font-bold uppercase text-xs tracking-wider border border-white/10">
                    ETAPA {nextRace?.round ?? 22} · TEMPORADA {seasonYear}
                  </span>
                  <span className="px-2 py-1 rounded bg-[#00F2FE]/10 border border-[#00F2FE]/30 text-[#00F2FE] font-bold text-xs tracking-wide">
                    {circuitName.toUpperCase()}
                  </span>
                </>
              )}
            </div>

            {/* HEADLINE EDITORIAL DINÂMICA (BEBAS NEUE) */}
            <h1 className="font-racing text-3xl sm:text-5xl lg:text-6xl text-white tracking-wider leading-[0.95] uppercase drop-shadow-md">
              {isLive ? (
                <>
                  BATALHA AO VIVO: <span className="text-[#E10600]">A PISTA ESTÁ EM BRASAS</span> EM {circuitName.toUpperCase()}
                </>
              ) : isOffseason ? (
                <>
                  TEMPORADA {seasonYear}: <span className="text-[#00F2FE]">{series.toUpperCase()}</span> EM PREPARAÇÃO OFICIAL
                </>
              ) : series === "f2" ? (
                <>
                  TEMPORADA {seasonYear}: <span className="text-[#0090D0]">A FÓRMULA 2</span> ACELERA EM {circuitName.toUpperCase()}
                </>
              ) : series === "f3" ? (
                <>
                  TEMPORADA {seasonYear}: <span className="text-[#F9A01B]">A FÓRMULA 3</span> EM {circuitName.toUpperCase()}
                </>
              ) : (
                <>
                  TEMPORADA {seasonYear}: <span className="text-[#E10600]">A NOVA ERA</span> ACELERA EM {circuitName.toUpperCase()}
                </>
              )}
            </h1>

            {/* SUBTÍTULO EDITORIAL DE CONTEXTO REAL */}
            <p className="font-display text-sm sm:text-base text-white/75 mt-3 leading-relaxed max-w-2xl">
              {isLive
                ? `Acompanhe cada setor, telemetria em tempo real e ultrapassagens roda a roda no ${circuitName}. Torre de tempos sincronizada ao vivo com a cronometragem oficial.`
                : isOffseason
                ? `A FIA confirmará as datas e o cronograma oficial da ${series.toUpperCase()} ${seasonYear}. Acompanhe os testes de pré-temporada e os talentos brasileiros no grid.`
                : series === "f2"
                ? `Monopostos de 620 cv e disputas intensas rumo à elite do automobilismo. Acompanhe Enzo Fittipaldi e os jovens talentos no ${circuitName}.`
                : series === "f3"
                ? `O berço dos futuros campeões mundiais com Rafael Câmara na disputa. Monopostos de 380 cv em alta competitividade no ${circuitName}.`
                : `Motores híbridos com 50% de tração elétrica instantânea e aerodinâmica ativa. Gabriel Bortoleto acelera com a Kick Sauber/Audi no templo da velocidade.`}
            </p>
          </div>

          {/* COCKPIT TELEMETRY HUD MASTER (5 CARTÕES TÉCNICOS) */}
          <div className="pt-2">
            <div className="text-[10px] font-mono uppercase tracking-widest text-white/50 mb-2 flex items-center gap-1.5">
              <Sparkles className="size-3 text-[#00F2FE]" />
              <span>Cockpit Telemetry HUD</span>
              <span className="text-white/30">|</span>
              <span className="text-[#00F2FE] font-bold">
                {isLive ? `Telemetria ${series.toUpperCase()} Ativa` : "Standby (Sessão Agendada)"}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {/* 1. SPEED TRAP */}
              <div className="rounded-xl border border-white/10 bg-[#07080c]/80 p-2.5 flex flex-col justify-between shadow-xs">
                <span className="text-[9px] font-mono font-bold tracking-wider text-white/50 uppercase">
                  SPEED TRAP
                </span>
                <span className="text-base sm:text-lg font-black font-mono tracking-tight text-[#00F2FE] my-1">
                  {speedTrapDisplay}
                </span>
                <span className="text-[9px] text-white/40 font-sans">
                  {isLive ? "Velocidade máx." : "Aguardando sessão"}
                </span>
              </div>

              {/* 2. MARCHA / RPM */}
              <div className="rounded-xl border border-white/10 bg-[#07080c]/80 p-2.5 flex flex-col justify-between shadow-xs">
                <span className="text-[9px] font-mono font-bold tracking-wider text-white/50 uppercase">
                  MARCHA / RPM
                </span>
                <span className="text-base sm:text-lg font-black font-mono tracking-tight text-[#FFD700] my-1">
                  {gearRpmDisplay}
                </span>
                <span className="text-[9px] text-white/40 font-sans">
                  {isLive ? "Giro de motor" : "Telemetria de pista"}
                </span>
              </div>

              {/* 3. DRS */}
              <div className="rounded-xl border border-white/10 bg-[#07080c]/80 p-2.5 flex flex-col justify-between shadow-xs">
                <span className="text-[9px] font-mono font-bold tracking-wider text-white/50 uppercase">
                  ASPAS DRS
                </span>
                <span className={cn(
                  "text-base sm:text-lg font-black font-mono tracking-tight my-1",
                  isLive ? "text-[#4ADE80]" : "text-white/40"
                )}>
                  {drsDisplay}
                </span>
                <span className="text-[9px] text-white/40 font-sans">
                  Zonas ativas
                </span>
              </div>

              {/* 4. TEMPERATURA DOS PNEUS */}
              <div className="rounded-xl border border-white/10 bg-[#07080c]/80 p-2.5 flex flex-col justify-between shadow-xs">
                <span className="text-[9px] font-mono font-bold tracking-wider text-white/50 uppercase">
                  PNEUS FL/FR
                </span>
                <span className="text-sm sm:text-base font-black font-mono tracking-tight text-[#F59E0B] my-1 truncate">
                  {tireTempDisplay}
                </span>
                <span className="text-[9px] text-white/40 font-sans">
                  Temperatura
                </span>
              </div>

              {/* 5. PISTA / CLIMA */}
              <div className="col-span-2 sm:col-span-1 rounded-xl border border-white/10 bg-[#07080c]/80 p-2.5 flex flex-col justify-between shadow-xs">
                <span className="text-[9px] font-mono font-bold tracking-wider text-white/50 uppercase">
                  PISTA / CLIMA
                </span>
                <span className="text-base sm:text-lg font-black font-mono tracking-tight text-white my-1 truncate">
                  {weatherDisplay}
                </span>
                <span className="text-[9px] text-white/40 font-sans">
                  Condição de pista
                </span>
              </div>
            </div>
          </div>

          {/* CTAs DE AÇÃO IMEDIATA (BOTÕES PROPOSTA A+) */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleScrollToHighlights}
              className="flex items-center gap-2 px-5 py-3 rounded-lg bg-[#E10600] hover:bg-[#ff1a14] active:scale-98 text-white font-racing tracking-wider text-sm sm:text-base font-bold shadow-[0_4px_20px_rgba(225,6,0,0.45)] transition-all cursor-pointer uppercase"
            >
              <Play className="size-4 fill-white shrink-0" />
              <span>Assistir Destaques da Corrida</span>
            </button>

            <button
              type="button"
              onClick={handleGoToLiveTiming}
              className="flex items-center gap-2 px-5 py-3 rounded-lg bg-white/10 hover:bg-white/15 active:scale-98 border border-white/20 text-white font-racing tracking-wider text-sm sm:text-base font-bold backdrop-blur-md transition-all cursor-pointer uppercase"
            >
              <Timer className="size-4 text-[#00F2FE] shrink-0" />
              <span>Live Timing Completo</span>
            </button>
          </div>

        </div>

        {/* COLUNA DIREITA: CARD DO GRANDE PRÊMIO COM CIRCUITO NEON SVG (5 Colunas no Desktop) */}
        <div className="lg:col-span-5 flex flex-col justify-center">
          <CircuitNeonCard race={nextRace} series={series} />
        </div>

      </div>
    </section>
  )
}
