import { useState, useMemo } from "react"
import { Trophy, Users, Shield, ArrowDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useApi } from "@/hooks/use-api"
import { api } from "@/lib/api"
import { driverPhoto, teamLogo, flagFromCountry } from "@/lib/assets"
import { cn } from "@/lib/utils"

interface Top5StandingsProps {
  series?: string
  season?: string | number
  className?: string
}

export function Top5Standings({
  series = "f1",
  season,
  className,
}: Top5StandingsProps) {
  const [tab, setTab] = useState<"drivers" | "teams">("drivers")
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

  const maxTeamPoints = top5Teams[0]?.points || 1
  const isLoading = (tab === "drivers" ? driversQuery.loading : teamsQuery.loading) && !top5Drivers.length

  const scrollToFullStandings = () => {
    const el = document.getElementById("standings-heading")
    if (el) {
      el.scrollIntoView({ behavior: "smooth" })
    }
  }

  const seriesLabel = series.toUpperCase()

  return (
    <Card className={cn("border-border/50 bg-card/60 backdrop-blur-md shadow-xl overflow-hidden", className)}>
      <CardHeader className="pb-3 border-b border-border/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500 border border-amber-500/30">
              <Trophy className="size-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold font-f1 tracking-wider text-foreground">
                  TOP 5 OFICIAL DO CAMPEONATO
                </CardTitle>
                <Badge variant="outline" className="text-[10px] font-mono uppercase px-1.5 py-0 border-white/20">
                  {seriesLabel} · {currentSeason}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Classificação consolidada com fotos oficiais, logos e pontuação FIA
              </p>
            </div>
          </div>

          {/* Abas Interativas Pilotos / Equipes */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border/40 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setTab("drivers")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer",
                tab === "drivers"
                  ? "bg-foreground text-background shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Users className="size-3.5" />
              <span>Pilotos</span>
            </button>
            <button
              type="button"
              onClick={() => setTab("teams")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer",
                tab === "teams"
                  ? "bg-foreground text-background shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Shield className="size-3.5" />
              <span>Equipes</span>
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/40 animate-pulse">
                <Skeleton className="size-7 rounded-full" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20 ml-auto" />
              </div>
            ))}
          </div>
        ) : tab === "drivers" ? (
          /* LISTA TOP 5 PILOTOS */
          <div className="space-y-2">
            {top5Drivers.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                Classificação de pilotos indisponível para {seriesLabel} {currentSeason}.
              </div>
            ) : (
              top5Drivers.map((driver) => {
                const photoUrl = driver.headshot_url || driverPhoto(driver.driver_name, currentSeason)
                const logoAsset = driver.team_name ? teamLogo(driver.team_name, currentSeason) : null
                const flagUrl = driver.nationality ? flagFromCountry(driver.nationality) : null

                return (
                  <div
                    key={driver.driver_id ?? `${driver.position}-${driver.driver_name}`}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/30 hover:bg-secondary/60 border border-border/30 hover:border-border/60 transition-colors"
                  >
                    {/* Badge da Posição */}
                    <span
                      className={cn(
                        "font-mono font-bold text-xs size-6 rounded-md flex items-center justify-center shrink-0",
                        driver.position === 1
                          ? "bg-amber-500/25 text-amber-800 dark:text-amber-300 border border-amber-500/50 shadow-xs ring-1 ring-amber-500/20 font-black"
                          : driver.position === 2
                          ? "bg-slate-300/25 text-zinc-700 dark:text-slate-200 border border-slate-300/50"
                          : driver.position === 3
                          ? "bg-amber-700/25 text-amber-900 dark:text-amber-400 border border-amber-700/50"
                          : "bg-background/80 text-muted-foreground border border-border/40"
                      )}
                    >
                      {driver.position}
                    </span>

                    {/* Foto do Piloto em Miniatura */}
                    <div className="relative size-8 shrink-0 rounded-full overflow-hidden bg-muted/80 border border-border/40 flex items-center justify-center">
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
                      <span className={cn("avatar-fallback text-[10px] font-bold font-mono text-muted-foreground", photoUrl ? "hidden" : "")}>
                        {driver.driver_code || driver.driver_name.slice(0, 2).toUpperCase()}
                      </span>
                    </div>

                    {/* Nome, Nacionalidade e Equipe */}
                    <div className="min-w-0 flex-1 flex flex-col justify-center">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-foreground truncate">
                          {driver.driver_name}
                        </span>
                        {flagUrl && (
                          <img
                            src={flagUrl}
                            alt=""
                            className="h-3 w-4.5 rounded-[2px] object-cover shrink-0"
                            loading="lazy"
                          />
                        )}
                        {driver.driver_code && (
                          <span className="text-[10px] font-mono text-muted-foreground hidden xs:inline">
                            {driver.driver_code}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                        <span className="truncate">{driver.team_name || "—"}</span>
                      </div>
                    </div>

                    {/* Logo da Equipe e Pontuação */}
                    <div className="flex items-center gap-3 shrink-0 ml-auto">
                      {logoAsset?.url && (
                        <img
                          src={logoAsset.url}
                          alt=""
                          className="h-4 max-w-[40px] object-contain shrink-0 opacity-80 hidden sm:inline"
                          onError={(e) => (e.currentTarget.style.display = "none")}
                        />
                      )}
                      <div className="text-right">
                        <span className="font-mono text-sm font-bold text-foreground tabular-nums">
                          {driver.points}
                        </span>
                        <span className="text-[10px] text-muted-foreground ml-1">pts</span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        ) : (
          /* LISTA TOP 5 CONSTRUTORES COM BARRAS DE DOMINÂNCIA */
          <div className="space-y-2.5">
            {top5Teams.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                Classificação de construtores indisponível para {seriesLabel} {currentSeason}.
              </div>
            ) : (
              top5Teams.map((team) => {
                const logoAsset = team.team_name ? teamLogo(team.team_name, currentSeason) : null
                const dominancePct = Math.max(8, Math.min(100, Math.round((team.points / maxTeamPoints) * 100)))

                return (
                  <div
                    key={team.team_id ?? `${team.position}-${team.team_name}`}
                    className="p-2.5 rounded-lg bg-secondary/30 hover:bg-secondary/60 border border-border/30 hover:border-border/60 transition-colors flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Posição */}
                        <span
                          className={cn(
                            "font-mono font-bold text-xs size-6 rounded-md flex items-center justify-center shrink-0",
                            team.position === 1
                              ? "bg-amber-500/25 text-amber-800 dark:text-amber-300 border border-amber-500/50 shadow-xs ring-1 ring-amber-500/20 font-black"
                              : team.position === 2
                              ? "bg-slate-300/25 text-zinc-700 dark:text-slate-200 border border-slate-300/50"
                              : team.position === 3
                              ? "bg-amber-700/25 text-amber-900 dark:text-amber-400 border border-amber-700/50"
                              : "bg-background/80 text-muted-foreground border border-border/40"
                          )}
                        >
                          {team.position}
                        </span>

                        {/* Logo da Equipe */}
                        {logoAsset?.url && (
                          <img
                            src={logoAsset.url}
                            alt=""
                            className="h-4.5 max-w-[45px] object-contain shrink-0"
                            onError={(e) => (e.currentTarget.style.display = "none")}
                          />
                        )}

                        <span className="truncate text-sm font-bold text-foreground">
                          {team.team_name}
                        </span>
                      </div>

                      {/* Pontos */}
                      <div className="text-right shrink-0">
                        <span className="font-mono text-sm font-bold text-foreground tabular-nums">
                          {team.points}
                        </span>
                        <span className="text-[10px] text-muted-foreground ml-1">pts</span>
                      </div>
                    </div>

                    {/* Barra de dominância relativa */}
                    <div className="w-full h-1.5 rounded-full bg-muted/80 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400 transition-all duration-700"
                        style={{ width: `${dominancePct}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Rodapé com link para classificação completa */}
        <div className="mt-4 pt-3 border-t border-border/30 flex items-center justify-between text-xs text-muted-foreground">
          <span className="text-[11px]">
            Critério oficial de pontuação FIA ({seriesLabel})
          </span>
          <button
            type="button"
            onClick={scrollToFullStandings}
            className="flex items-center gap-1 font-semibold text-primary hover:underline cursor-pointer text-xs"
          >
            <span>Ver tabela completa</span>
            <ArrowDown className="size-3" />
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
