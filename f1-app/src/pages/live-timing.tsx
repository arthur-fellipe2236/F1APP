import { useEffect, useState } from "react"
import { CalendarClock, CloudRain, Wind, Thermometer, Flag, MonitorPlay } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/lib/api"

export interface LiveData {
  session?: {
    name: string
    state: string
    date_start?: string
    date_end?: string
  }
  flag?: string | null
  weather?: {
    air_temperature?: number | null
    track_temperature?: number | null
    wind_speed?: number | null
    humidity?: number | null
  }
  messages?: Array<{
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
}

const COMPOUND_COLORS: Record<string, string> = {
  SOFT: "bg-red-500 text-white",
  MEDIUM: "bg-yellow-400 text-black",
  HARD: "bg-white text-black",
  INTERMEDIATE: "bg-green-500 text-white",
  WET: "bg-blue-500 text-white"
}

export function LiveTimingPage() {
  const [liveData, setLiveData] = useState<LiveData | null>(null)
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null)
  

  useEffect(() => {
    const fetchLiveData = async () => {
      try {
        const data = await api.liveTower()
        if (data && data.session) {
          setLiveData(data as any)
        }
      } catch (error) {
        console.error("Failed to fetch live data:", error)
      }
    }

    fetchLiveData()
    const interval = setInterval(fetchLiveData, 15000) // Poll faster for dynamic telemetry
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!liveData?.session) return;
    
    const targetDate = liveData.session.state === "scheduled" ? liveData.session.date_start : 
                       liveData.session.state === "live" ? liveData.session.date_end : null;
                       
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
            hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((distance % (1000 * 60)) / 1000)
          })
        }
      }, 1000)
      return () => clearInterval(interval)
    } else {
      setTimeLeft(null)
    }
  }, [liveData])

  const getFlagColor = (flag?: string | null) => {
    if (!flag) return "bg-gray-500/20 text-gray-400 border-gray-500/50"
    const f = flag.toUpperCase()
    if (f === "CLEAR" || f === "GREEN") return "bg-green-500/20 text-green-400 border-green-500/50"
    if (f.includes("YELLOW")) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
    if (f.includes("RED")) return "bg-red-500/20 text-red-400 border-red-500/50"
    return "bg-blue-500/20 text-blue-400 border-blue-500/50"
  }

  const isLive = liveData?.session?.state === "live"

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Ao Vivo"
        description="Central de telemetria integrada e dados do circuito em tempo real."
      />

      {/* CLOCK SECTION */}
      {timeLeft && (
        <div className="mx-auto w-full max-w-6xl mb-4">
          <Card className={`border-border/50 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-700 ${isLive ? "bg-red-950/20 shadow-[0_0_30px_-5px_rgba(239,68,68,0.3)] border-red-500/30" : "bg-blue-950/20 shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)] border-blue-500/50"}`}>
            <CardHeader className="text-center pb-2">
              <CardTitle className={`text-2xl flex justify-center items-center gap-2 ${isLive ? "text-red-400" : "text-blue-400"}`}>
                <CalendarClock className="size-6 animate-pulse" />
                {isLive ? "Sessão Termina Em:" : "Sessão Começa Em:"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center items-center gap-4 md:gap-8">
                <div className="flex flex-col">
                  <span className="text-5xl md:text-7xl font-black tabular-nums tracking-tighter text-white drop-shadow-md">
                    {timeLeft.hours.toString().padStart(2, '0')}
                  </span>
                  <span className={`text-sm ${isLive ? "text-red-400" : "text-blue-400"} font-medium uppercase tracking-widest mt-2`}>Horas</span>
                </div>
                <span className={`text-5xl md:text-7xl font-black mb-6 ${isLive ? "text-red-500/50" : "text-blue-500/50"}`}>:</span>
                <div className="flex flex-col">
                  <span className="text-5xl md:text-7xl font-black tabular-nums tracking-tighter text-white drop-shadow-md">
                    {timeLeft.minutes.toString().padStart(2, '0')}
                  </span>
                  <span className={`text-sm ${isLive ? "text-red-400" : "text-blue-400"} font-medium uppercase tracking-widest mt-2`}>Minutos</span>
                </div>
                <span className={`text-5xl md:text-7xl font-black mb-6 ${isLive ? "text-red-500/50" : "text-blue-500/50"}`}>:</span>
                <div className="flex flex-col">
                  <span className="text-5xl md:text-7xl font-black tabular-nums tracking-tighter text-white drop-shadow-md">
                    {timeLeft.seconds.toString().padStart(2, '0')}
                  </span>
                  <span className={`text-sm ${isLive ? "text-red-400" : "text-blue-400"} font-medium uppercase tracking-widest mt-2`}>Segundos</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* NATIVE WIDGETS SECTION */}
      <div className="mx-auto mt-4 grid w-full max-w-6xl grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
        
        <Card className="border-border/50 bg-card/40 backdrop-blur-sm shadow-xl flex flex-col h-full">
          <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
            <CardTitle className="text-lg flex items-center gap-2">
              <Flag className="size-5 text-muted-foreground" />
              Status da Pista
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center items-center py-8">
            <div className={`px-8 py-3 rounded-xl border-2 font-black text-2xl tracking-widest shadow-lg ${getFlagColor(liveData?.flag)}`}>
              {liveData?.flag || "CLEAR"}
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
                <div className="p-2 bg-blue-500/10 rounded-lg"><Thermometer className="size-5 text-blue-400" /></div>
                <div>
                  <div className="text-sm text-muted-foreground font-medium">Ar</div>
                  <div className="text-lg font-bold tabular-nums">{liveData?.weather?.air_temperature ?? "--"}°C</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg"><Thermometer className="size-5 text-orange-400" /></div>
                <div>
                  <div className="text-sm text-muted-foreground font-medium">Pista</div>
                  <div className="text-lg font-bold tabular-nums">{liveData?.weather?.track_temperature ?? "--"}°C</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-500/10 rounded-lg"><Wind className="size-5 text-slate-400" /></div>
                <div>
                  <div className="text-sm text-muted-foreground font-medium">Vento</div>
                  <div className="text-lg font-bold tabular-nums">{liveData?.weather?.wind_speed ?? "--"} km/h</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/10 rounded-lg"><CloudRain className="size-5 text-cyan-400" /></div>
                <div>
                  <div className="text-sm text-muted-foreground font-medium">Umidade</div>
                  <div className="text-lg font-bold tabular-nums">{liveData?.weather?.humidity ?? "--"}%</div>
                </div>
              </div>
            </div>
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
                <div className="text-center text-muted-foreground text-sm italic mt-8">Nenhuma mensagem oficial da Direção de Prova ainda.</div>
              )}
              {liveData?.messages?.map((msg, idx) => (
                <div key={idx} className={`p-3 rounded-lg text-sm font-medium border-l-4 ${msg.flag === 'RED' ? 'bg-red-500/10 border-red-500 text-red-200' : msg.flag === 'YELLOW' ? 'bg-yellow-500/10 border-yellow-500 text-yellow-200' : 'bg-muted/50 border-blue-500 text-zinc-300'}`}>
                  {msg.message}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TIMING TOWER */}
      {liveData && liveData.drivers && liveData.drivers.length > 0 && (
         <div className="mx-auto w-full max-w-6xl mt-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <Card className="border-border/50 bg-card/40 backdrop-blur-md shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 p-3 text-center text-sm font-bold border-b border-border/50 tracking-widest text-zinc-300">
              TORRE DE TEMPOS OFICIAL
            </div>
            <div className="w-full overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="text-xs uppercase bg-white/5 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold w-12 text-center">Pos</th>
                    <th className="px-4 py-3 font-semibold">Piloto</th>
                    <th className="px-4 py-3 font-semibold text-center">Pneu</th>
                    <th className="px-4 py-3 font-semibold text-right">Gap</th>
                    <th className="px-4 py-3 font-semibold text-right">Intervalo</th>
                    <th className="px-4 py-3 font-semibold text-center w-16">Volta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {liveData.drivers.map((driver) => (
                    <tr key={driver.driver_number} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-2 text-center font-bold">{driver.position || "-"}</td>
                      <td className="px-4 py-2 font-medium flex items-center gap-3">
                        <span className="w-1 h-4 rounded-full" style={{ backgroundColor: `#${driver.team_colour}` }}></span>
                        <span className="w-6 text-muted-foreground font-mono">{driver.driver_number}</span>
                        <span className="font-bold flex items-center gap-2">
                          {driver.name}
                          {driver.in_pit && <span className="bg-white text-black px-1.5 rounded-sm text-[10px] font-black tracking-widest leading-none py-0.5" title="No Pitlane">P</span>}
                        </span>
                        <span className="text-xs text-muted-foreground uppercase">{driver.team}</span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        {driver.compound ? (
                           <span className={`px-2 py-0.5 rounded-sm text-[10px] font-black tracking-widest uppercase ${COMPOUND_COLORS[driver.compound] || "bg-zinc-700 text-white"}`}>
                             {driver.compound}
                           </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right font-mono tabular-nums">{driver.gap_to_leader !== null ? `+${driver.gap_to_leader.toFixed(3)}s` : "PIT"}</td>
                      <td className="px-4 py-2 text-right font-mono tabular-nums text-muted-foreground">{driver.interval !== null ? `+${driver.interval.toFixed(3)}s` : "-"}</td>
                      <td className="px-4 py-2 text-center font-mono tabular-nums">{driver.lap_number || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
         </div>
      )}
    </div>
  )
}
