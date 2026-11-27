import { useState, useMemo } from "react"
import { Trophy, Users, Shield, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useApi } from "@/hooks/use-api"
import { api } from "@/lib/api"
import { driverPhoto, teamLogo, flagFromCountry } from "@/lib/assets"
import { formatPoints } from "@/lib/format"
import { cn } from "@/lib/utils"

interface WorldStandingsEnrichedProps {
  series?: string
  season?: string | number
  className?: string
}

export function WorldStandingsEnriched({
  series = "f1",
  season,
  className,
}: WorldStandingsEnrichedProps) {
  const [activeTab, setActiveTab] = useState<"drivers" | "teams">("drivers")
  const currentSeason = season ? Number(season) : new Date().getFullYear()

  // Consulta de classificação de pilotos
  const driversQuery = useApi(
    () => api.driverStandings(currentSeason, series),
    [currentSeason, series]
  )

  // Consulta de classificação de construtores
  const teamsQuery = useApi(
    () => api.teamStandings(currentSeason, series),
    [currentSeason, series]
  )

  const top5Drivers = useMemo(() => {
    const list = driversQuery.data?.data ?? []
    return [...list]
      .sort((a, b) => {
        const posA = a.position ?? 999
        const posB = b.position ?? 999
        if (posA !== posB) return posA - posB
        return (b.points ?? 0) - (a.points ?? 0)
      })
      .slice(0, 5)
  }, [driversQuery.data?.data])

  const top5Teams = useMemo(() => {
    const list = teamsQuery.data?.data ?? []
    return [...list]
      .sort((a, b) => {
        const posA = a.position ?? 999
        const posB = b.position ?? 999
        if (posA !== posB) return posA - posB
        return (b.points ?? 0) - (a.points ?? 0)
      })
      .slice(0, 5)
  }, [teamsQuery.data?.data])

  const leaderPoints = top5Drivers[0]?.points ?? 0
  const maxTeamPoints = top5Teams[0]?.points || 1

  const isLoading = (activeTab === "drivers" ? driversQuery.loading : teamsQuery.loading) && !top5Drivers.length

  const scrollToFullStandings = () => {
    const el = document.getElementById("standings-heading")
    if (el) {
      el.scrollIntoView({ behavior: "smooth" })
    }
  }

  const seriesLabel = series.toUpperCase()
  const teamTabLabel = series === "f1" ? "Construtores" : "Equipes"

  const seriesColorBadge =
    series === "f2"
      ? "text-[#0090D0] bg-[#0090D0]/10 border-[#0090D0]/40"
      : series === "f3"
      ? "text-[#F9A01B] bg-[#F9A01B]/10 border-[#F9A01B]/40"
      : "text-[#00F2FE] bg-[#00F2FE]/10 border-[#00F2FE]/30"

  const tabActiveColor =
    series === "f2"
      ? "bg-[#0090D0] text-white shadow-[0_0_10px_rgba(0,144,208,0.4)]"
      : series === "f3"
      ? "bg-[#F9A01B] text-black shadow-[0_0_10px_rgba(249,160,27,0.4)]"
      : "bg-[#E10600] text-white shadow-[0_0_10px_rgba(225,6,0,0.4)]"

  return (
    <Card className={cn(
      "border-border/50 bg-[#07080c]/90 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden relative",
      "before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-[#00F2FE]/50 before:to-transparent",
      className
    )}>
      {/* Header com identidade Broadcast Master */}
      <CardHeader className="pb-3 pt-5 px-5 border-b border-border/30 bg-white/[0.02]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-lg bg-[#FFD700]/15 text-[#FFD700] border border-[#FFD700]/30 shadow-[0_0_12px_rgba(255,215,0,0.2)]">
              <Trophy className="size-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-racing tracking-wider text-white">
                  CLASSIFICAÇÃO MUNDIAL
                </CardTitle>
                <Badge variant="outline" className={cn("text-[10px] font-mono-num uppercase px-1.5 py-0 border", seriesColorBadge)}>
                  {seriesLabel} · {currentSeason}
                </Badge>
              </div>
            </div>
          </div>

          {/* Seletor de Abas */}
          <div className="flex items-center p-0.5 rounded-lg bg-black/50 border border-white/10 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("drivers")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-tech font-bold transition-all cursor-pointer",
                activeTab === "drivers"
                  ? tabActiveColor
                  : "text-zinc-400 hover:text-white"
              )}
            >
              <Users className="size-3" />
              <span>Pilotos Top 5</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("teams")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-tech font-bold transition-all cursor-pointer",
                activeTab === "teams"
                  ? tabActiveColor
                  : "text-zinc-400 hover:text-white"
              )}
            >
              <Shield className="size-3" />
              <span>{teamTabLabel}</span>
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 animate-pulse">
                <Skeleton className="size-8 rounded-full" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20 ml-auto" />
              </div>
            ))}
          </div>
        ) : activeTab === "drivers" ? (
          /* LISTA DE PILOTOS ENRIQUECIDA */
          <div className="space-y-2.5">
            {top5Drivers.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground font-tech">
                Classificação oficial de pilotos indisponível para {seriesLabel} {currentSeason}.
              </div>
            ) : (
              top5Drivers.map((driver) => {
                const photoUrl = driver.headshot_url || driverPhoto(driver.driver_name, currentSeason)
                const teamAsset = driver.team_name ? teamLogo(driver.team_name, currentSeason) : null
                const flagUrl = driver.nationality ? flagFromCountry(driver.nationality) : null
                const teamColor = teamAsset?.color || "#555555"
                const isLeader = driver.position === 1
                const diffPoints = isLeader ? 0 : leaderPoints - (driver.points ?? 0)
                const driverNum = (driver as any).permanent_number || (driver as any).number || null

                return (
                  <div
                    key={driver.driver_id ?? `${driver.position}-${driver.driver_name}`}
                    className={cn(
                      "group relative flex items-center gap-3 p-2.5 sm:p-3 rounded-xl transition-all duration-200 border",
                      isLeader
                        ? "bg-gradient-to-r from-[#FFD700]/10 via-black/40 to-transparent border-[#FFD700]/40 shadow-[0_0_15px_rgba(255,215,0,0.1)]"
                        : "bg-white/[0.02] hover:bg-white/[0.05] border-white/10 hover:border-white/20"
                    )}
                  >
                    {/* Borda lateral colorida com a cor oficial da escuderia */}
                    <div
                      className="absolute left-0 inset-y-2 w-1 rounded-r-full transition-transform group-hover:scale-y-110"
                      style={{ backgroundColor: teamColor }}
                    />

                    {/* Badge da Posição */}
                    <span
                      className={cn(
                        "font-mono-num font-black text-xs size-7 rounded-lg flex items-center justify-center shrink-0 ml-1.5 shadow-sm",
                        driver.position === 1
                          ? "bg-[#FFD700] text-black ring-2 ring-[#FFD700]/50 shadow-[0_0_10px_rgba(255,215,0,0.4)]"
                          : driver.position === 2
                          ? "bg-slate-300 text-black border border-white/40"
                          : driver.position === 3
                          ? "bg-amber-600 text-white border border-amber-500/40"
                          : "bg-black/60 text-zinc-300 border border-white/10"
                      )}
                    >
                      P{driver.position}
                    </span>

                    {/* Fotografia Oficial com Anel da Equipe */}
                    <div
                      className="relative size-10 shrink-0 rounded-full overflow-hidden bg-black/80 flex items-center justify-center border-2 transition-transform duration-300 group-hover:scale-105"
                      style={{ borderColor: teamColor }}
                    >
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt={driver.driver_name}
                          className="size-full object-cover object-top"
                          onError={(e) => {
                            e.currentTarget.style.display = "none"
                            const fallback = e.currentTarget.parentElement?.querySelector(".avatar-fallback")
                            if (fallback) fallback.classList.remove("hidden")
                          }}
                        />
                      ) : null}
                      <span className={cn("avatar-fallback text-[10px] font-bold font-mono-num text-zinc-400", photoUrl ? "hidden" : "")}>
                        {driver.driver_code || driver.driver_name.slice(0, 2).toUpperCase()}
                      </span>
                    </div>

                    {/* Dados do Piloto */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {driverNum && (
                          <span className="font-mono-num font-black text-xs text-[#00F2FE]">
                            #{driverNum}
                          </span>
                        )}
                        <span className="font-bold text-sm text-white truncate group-hover:text-[#00F2FE] transition-colors">
                          {driver.driver_name}
                        </span>
                        {flagUrl && (
                          <img
                            src={flagUrl}
                            alt=""
                            className="h-3 w-4.5 rounded-[2px] object-cover shrink-0 ml-0.5 opacity-90"
                            loading="lazy"
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-400 truncate mt-0.5 font-tech">
                        <span className="truncate">{driver.team_name || "—"}</span>
                      </div>
                    </div>

                    {/* Pontuação e Diferença */}
                    <div className="text-right shrink-0">
                      <div className="flex items-baseline justify-end gap-1">
                        <span className="font-mono-num font-black text-base text-white tabular-nums">
                          {formatPoints(driver.points)}
                        </span>
                        <span className="text-[10px] font-tech text-zinc-400 uppercase">pts</span>
                      </div>
                      <div className="text-[10px] font-mono-num tabular-nums mt-0.5">
                        {isLeader ? (
                          <span className="text-[#FFD700] font-bold tracking-wider">LÍDER</span>
                        ) : (
                          <span className="text-zinc-500">-{diffPoints} pts</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        ) : (
          /* LISTA DE CONSTRUTORES ENRIQUECIDA */
          <div className="space-y-3">
            {top5Teams.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground font-tech">
                Classificação oficial de construtores indisponível para {seriesLabel} {currentSeason}.
              </div>
            ) : (
              top5Teams.map((team) => {
                const teamAsset = team.team_name ? teamLogo(team.team_name, currentSeason) : null
                const teamColor = teamAsset?.color || "#555555"
                const dominancePct = Math.max(8, Math.min(100, Math.round((team.points / maxTeamPoints) * 100)))
                const isLeader = team.position === 1

                return (
                  <div
                    key={team.team_id ?? `${team.position}-${team.team_name}`}
                    className={cn(
                      "p-3 rounded-xl border transition-all duration-200 flex flex-col gap-2 relative overflow-hidden",
                      isLeader
                        ? "bg-gradient-to-r from-[#FFD700]/10 via-black/40 to-transparent border-[#FFD700]/40 shadow-[0_0_15px_rgba(255,215,0,0.1)]"
                        : "bg-white/[0.02] hover:bg-white/[0.05] border-white/10 hover:border-white/20"
                    )}
                  >
                    {/* Borda lateral com cor da equipe */}
                    <div
                      className="absolute left-0 inset-y-0 w-1"
                      style={{ backgroundColor: teamColor }}
                    />

                    <div className="flex items-center justify-between gap-2 pl-1.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Posição */}
                        <span
                          className={cn(
                            "font-mono-num font-black text-xs size-6 rounded-md flex items-center justify-center shrink-0",
                            team.position === 1
                              ? "bg-[#FFD700] text-black ring-1 ring-[#FFD700]/50"
                              : team.position === 2
                              ? "bg-slate-300 text-black"
                              : team.position === 3
                              ? "bg-amber-600 text-white"
                              : "bg-black/60 text-zinc-300 border border-white/10"
                          )}
                        >
                          P{team.position}
                        </span>

                        {/* Logo da Equipe */}
                        {teamAsset?.url && (
                          <img
                            src={teamAsset.url}
                            alt=""
                            className="h-5 max-w-[50px] object-contain shrink-0"
                            onError={(e) => (e.currentTarget.style.display = "none")}
                          />
                        )}

                        <span className="truncate text-sm font-bold text-white font-tech">
                          {team.team_name}
                        </span>
                      </div>

                      {/* Pontos */}
                      <div className="text-right shrink-0">
                        <span className="font-mono-num text-sm font-black text-white tabular-nums">
                          {formatPoints(team.points)}
                        </span>
                        <span className="text-[10px] font-tech text-zinc-400 ml-1">pts</span>
                      </div>
                    </div>

                    {/* Barra de dominância proporcional ao líder */}
                    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden pl-1.5">
                      <div
                        className="h-full rounded-full transition-all duration-700 shadow-sm"
                        style={{
                          width: `${dominancePct}%`,
                          backgroundColor: teamColor,
                        }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Rodapé com CTA suave para a tabela completa */}
        <div className="mt-4 pt-3.5 border-t border-border/30 flex items-center justify-between text-xs text-zinc-400">
          <span className="text-[11px] font-tech">
            Critério oficial FIA ({seriesLabel})
          </span>
          <button
            type="button"
            onClick={scrollToFullStandings}
            className="flex items-center gap-1 font-tech font-bold text-[#00F2FE] hover:text-white transition-colors cursor-pointer group"
          >
            <span>Ver tabela completa</span>
            <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
