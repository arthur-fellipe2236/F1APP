import { useAppStore } from "@/store"
import { SeasonSelector } from "@/components/season-selector"
import { useMemo, useState, type ReactNode } from "react"
import type { TableColumn } from "react-data-table-component"
import { Flag, Shield, Trophy } from "lucide-react"

import { CodeBadge } from "@/components/driver-code"
import { F1DataTable } from "@/components/data-table"
import { VirtualDataTable } from "@/components/virtual-table"
import { ErrorState } from "@/components/error-state"
import { NextRaceCard } from "@/components/next-race-card"
import { PageHeader } from "@/components/page-header"
import { PositionBadge } from "@/components/position-badge"
import { RaceNewsCards } from "@/components/race-news-cards"
import { TeamInline, TeamName } from "@/components/team-name"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useApi } from "@/hooks/use-api"
import { api, type DriverStanding, type TeamStanding } from "@/lib/api"
import { teamLogo, displayTeamName } from "@/lib/assets"
import { formatPoints } from "@/lib/format"
import { mediaUrl } from "@/lib/media"
import { cn } from "@/lib/utils"

const getDriverColumns = (seasonParam?: number): TableColumn<DriverStanding>[] => [
  {
    name: "Pos",
    width: "72px",
    cell: (row) => <PositionBadge position={row.position} />,
  },
  {
    name: "Piloto",
    sortable: true,
    selector: (row) => row.driver_name,
    minWidth: "220px",
    cell: (row) => (
      <div className="flex items-center gap-2">
        <span className="font-medium">{row.driver_name}</span>
        <CodeBadge code={row.driver_code} nationality={row.nationality} />
      </div>
    ),
  },
  {
    name: "Equipe",
    sortable: true,
    selector: (row) => row.team_name ?? "",
    minWidth: "180px",
    cell: (row) => <TeamInline name={row.team_name} season={seasonParam} />,
  },
  {
    name: "Corridas",
    right: true,
    sortable: true,
    selector: (row) => row.races,
  },
  {
    name: "Pódios",
    right: true,
    sortable: true,
    selector: (row) => row.podiums,
  },
  {
    name: "Vitórias",
    right: true,
    sortable: true,
    selector: (row) => row.wins,
  },
  {
    name: "Pontos",
    right: true,
    sortable: true,
    selector: (row) => row.points,
    cell: (row) => (
      <span className="font-semibold font-mono tracking-tight tabular-nums">
        {formatPoints(row.points)}
      </span>
    ),
  },
]

const getTeamColumns = (seasonParam?: number): TableColumn<TeamStanding>[] => [
  {
    name: "Pos",
    width: "72px",
    cell: (row) => <PositionBadge position={row.position} />,
  },
  {
    name: "Equipe",
    sortable: true,
    selector: (row) => row.team_name,
    minWidth: "220px",
    cell: (row) => <TeamName name={row.team_name} season={seasonParam} />,
  },
  {
    name: "Corridas",
    right: true,
    sortable: true,
    selector: (row) => row.races,
  },
  {
    name: "Vitórias",
    right: true,
    sortable: true,
    selector: (row) => row.wins,
  },
  {
    name: "Pódios",
    right: true,
    sortable: true,
    selector: (row) => row.podiums,
  },
  {
    name: "Pontos",
    right: true,
    sortable: true,
    selector: (row) => row.points,
    cell: (row) => (
      <span className="font-semibold font-mono tracking-tight tabular-nums">
        {formatPoints(row.points)}
      </span>
    ),
  },
]

function LeaderAvatar({ driver }: { driver: DriverStanding }) {
  const [broken, setBroken] = useState(false)
  if (!driver.headshot_url || broken) {
    return (
      <span className="flex size-20 md:size-24 shrink-0 items-center justify-center rounded-full bg-secondary text-2xl font-bold text-muted-foreground ring-4 ring-background shadow-md">
        {(driver.driver_code ?? driver.driver_name.slice(0, 3)).toUpperCase()}
      </span>
    )
  }
  const isWiki = driver.headshot_url.includes('wikimedia');
  return (
    <img
      src={mediaUrl(driver.headshot_url, 160) ?? driver.headshot_url}
      alt={driver.driver_name}
      loading="lazy"
      onError={() => setBroken(true)}
      className={`size-20 md:size-24 shrink-0 rounded-full bg-secondary object-cover ring-4 ring-background shadow-md ${isWiki ? 'object-center' : 'object-top'}`}
    />
  )
}

function TeamBadge({ name, season }: { name: string; season?: number }) {
  const [broken, setBroken] = useState(false)
  const logo = teamLogo(name, season)
  
  if (!logo || broken || !logo.url) {
    const initials = (
      name
        .split(/\s+/)
        .map((word) => word[0])
        .join("") || name.slice(0, 2)
    )
      .toUpperCase()
      .slice(0, 3)
      
    let bgColor = "var(--secondary)"
    let textColor = "var(--secondary-foreground)"
    if (logo?.color) {
      bgColor = logo.color
      const hex = logo.color.replace("#", "")
      if (hex.length === 6) {
        const r = parseInt(hex.substr(0, 2), 16)
        const g = parseInt(hex.substr(2, 2), 16)
        const b = parseInt(hex.substr(4, 2), 16)
        const yiq = (r * 299 + g * 587 + b * 114) / 1000
        textColor = yiq >= 140 ? "#000000" : "#ffffff"
      }
    }
    
    return (
      <span 
        className="flex h-16 w-32 md:h-20 md:w-40 shrink-0 items-center justify-center rounded-xl text-2xl font-bold ring-4 ring-background shadow-md"
        style={{ backgroundColor: bgColor, color: textColor }}
      >
        {initials}
      </span>
    )
  }
  
  let isLightBg = false
  let isDarkBg = false
  if (logo.color) {
    const hex = logo.color.replace("#", "")
    if (hex.length === 6) {
      const r = parseInt(hex.substr(0, 2), 16)
      const g = parseInt(hex.substr(2, 2), 16)
      const b = parseInt(hex.substr(4, 2), 16)
      const yiq = (r * 299 + g * 587 + b * 114) / 1000
      isLightBg = yiq >= 155
      isDarkBg = yiq <= 40
    }
  }

  return (
    <span 
      className={cn(
        "flex h-16 w-32 md:h-20 md:w-40 shrink-0 items-center justify-center rounded-xl p-2.5 shadow-md border border-border/50 transition-all",
        isDarkBg && "ring-1 ring-white/20 dark:border-white/25",
        !logo.color ? "bg-white text-zinc-900 border-border/70" : undefined
      )}
      style={logo.color ? { backgroundColor: logo.color } : undefined}
    >
      <img
        src={logo.url}
        alt=""
        aria-hidden
        loading="lazy"
        onError={() => setBroken(true)}
        className={cn(
          "h-full w-full object-contain drop-shadow-xs",
          isLightBg && "brightness-0",
          logo.className
        )}
      />
    </span>
  )
}

function SummaryCard({
  title,
  icon,
  loading,
  children,
  background,
}: {
  title: string
  icon: ReactNode
  loading: boolean
  children: ReactNode
  background?: { url: string; className?: string } | null
}) {
  return (
    <Card className="relative flex h-full flex-col group overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/20 hover:border-primary/30">
      {background ? (
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-xl">
          <img
            src={background.url}
            alt=""
            aria-hidden
            loading="lazy"
            className={cn(
              "size-full object-contain p-3 opacity-20 dark:opacity-25 transition-transform duration-700 group-hover:scale-105 group-hover:opacity-35",
              background.className,
            )}
          />
        </div>
      ) : null}
      <CardHeader className="relative z-10">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10 flex-1">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-24" />
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  )
}

const F1_2021_DRIVERS = [
  { position: 1, driver_id: 202101, driver_name: "Max Verstappen", driver_code: "VER", nationality: "Neerlandês", team_name: "Red Bull Racing", points: 395.5, races: 22, podiums: 18, wins: 10, headshot_url: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/M/MAXVER01_Max_Verstappen/maxver01.png" },
  { position: 2, driver_id: 202102, driver_name: "Lewis Hamilton", driver_code: "HAM", nationality: "Britânico", team_name: "Mercedes", points: 387.5, races: 22, podiums: 17, wins: 8 },
  { position: 3, driver_id: 202103, driver_name: "Valtteri Bottas", driver_code: "BOT", nationality: "Finlandês", team_name: "Mercedes", points: 226, races: 22, podiums: 11, wins: 1 },
  { position: 4, driver_id: 202104, driver_name: "Sergio Pérez", driver_code: "PÉR", nationality: "Mexicano", team_name: "Red Bull Racing", points: 190, races: 22, podiums: 5, wins: 1 },
  { position: 5, driver_id: 202105, driver_name: "Carlos Sainz", driver_code: "SAI", nationality: "Espanhol", team_name: "Ferrari", points: 164.5, races: 22, podiums: 4, wins: 0 },
  { position: 6, driver_id: 202106, driver_name: "Lando Norris", driver_code: "NOR", nationality: "Britânico", team_name: "McLaren", points: 160, races: 22, podiums: 4, wins: 0 },
  { position: 7, driver_id: 202107, driver_name: "Charles Leclerc", driver_code: "LEC", nationality: "Monegasco", team_name: "Ferrari", points: 159, races: 22, podiums: 1, wins: 0 },
  { position: 8, driver_id: 202108, driver_name: "Daniel Ricciardo", driver_code: "RIC", nationality: "Australiano", team_name: "McLaren", points: 115, races: 22, podiums: 1, wins: 1 },
  { position: 9, driver_id: 202109, driver_name: "Pierre Gasly", driver_code: "GAS", nationality: "Francês", team_name: "AlphaTauri", points: 110, races: 22, podiums: 1, wins: 0 },
  { position: 10, driver_id: 202110, driver_name: "Fernando Alonso", driver_code: "ALO", nationality: "Espanhol", team_name: "Alpine", points: 81, races: 22, podiums: 1, wins: 0 },
  { position: 11, driver_id: 202111, driver_name: "Esteban Ocon", driver_code: "OCO", nationality: "Francês", team_name: "Alpine", points: 74, races: 22, podiums: 1, wins: 1 },
  { position: 12, driver_id: 202112, driver_name: "Sebastian Vettel", driver_code: "VET", nationality: "Alemão", team_name: "Aston Martin", points: 43, races: 22, podiums: 1, wins: 0 },
  { position: 13, driver_id: 202113, driver_name: "Lance Stroll", driver_code: "STR", nationality: "Canadense", team_name: "Aston Martin", points: 34, races: 22, podiums: 0, wins: 0 },
  { position: 14, driver_id: 202114, driver_name: "Yuki Tsunoda", driver_code: "TSU", nationality: "Japonês", team_name: "AlphaTauri", points: 32, races: 22, podiums: 0, wins: 0 },
  { position: 15, driver_id: 202115, driver_name: "George Russell", driver_code: "RUS", nationality: "Britânico", team_name: "Williams", points: 16, races: 22, podiums: 1, wins: 0 },
  { position: 16, driver_id: 202116, driver_name: "Kimi Räikkönen", driver_code: "RAI", nationality: "Finlandês", team_name: "Alfa Romeo", points: 10, races: 22, podiums: 0, wins: 0 },
  { position: 17, driver_id: 202117, driver_name: "Nicholas Latifi", driver_code: "LAT", nationality: "Canadense", team_name: "Williams", points: 7, races: 22, podiums: 0, wins: 0 },
  { position: 18, driver_id: 202118, driver_name: "Antonio Giovinazzi", driver_code: "GIO", nationality: "Italiano", team_name: "Alfa Romeo", points: 3, races: 22, podiums: 0, wins: 0 },
  { position: 19, driver_id: 202119, driver_name: "Mick Schumacher", driver_code: "MSC", nationality: "Alemão", team_name: "Haas", points: 0, races: 22, podiums: 0, wins: 0 },
  { position: 20, driver_id: 202120, driver_name: "Robert Kubica", driver_code: "KUB", nationality: "Polonês", team_name: "Alfa Romeo", points: 0, races: 2, podiums: 0, wins: 0 },
  { position: 21, driver_id: 202121, driver_name: "Nikita Mazepin", driver_code: "MAZ", nationality: "Russo", team_name: "Haas", points: 0, races: 22, podiums: 0, wins: 0 },
]

const F1_2021_TEAMS = [
  { position: 1, team_id: 20211, team_name: "Mercedes", points: 613.5, races: 22, podiums: 28, wins: 9 },
  { position: 2, team_id: 20212, team_name: "Red Bull Racing", points: 585.5, races: 22, podiums: 23, wins: 11 },
  { position: 3, team_id: 20213, team_name: "Ferrari", points: 323.5, races: 22, podiums: 5, wins: 0 },
  { position: 4, team_id: 20214, team_name: "McLaren", points: 275, races: 22, podiums: 5, wins: 1 },
  { position: 5, team_id: 20215, team_name: "Alpine", points: 155, races: 22, podiums: 2, wins: 1 },
  { position: 6, team_id: 20216, team_name: "AlphaTauri", points: 142, races: 22, podiums: 1, wins: 0 },
  { position: 7, team_id: 20217, team_name: "Aston Martin", points: 77, races: 22, podiums: 1, wins: 0 },
  { position: 8, team_id: 20218, team_name: "Williams", points: 23, races: 22, podiums: 1, wins: 0 },
  { position: 9, team_id: 20219, team_name: "Alfa Romeo", points: 13, races: 22, podiums: 0, wins: 0 },
  { position: 10, team_id: 202110, team_name: "Haas", points: 0, races: 22, podiums: 0, wins: 0 },
]





export function DashboardPage() {
  
  const { series, season, setSeason } = useAppStore()
  
  const seasonParam = Number(season)

  const driverStandings = useApi(
    () => api.driverStandings(seasonParam, series),
    [seasonParam, series],
  )
  const teamStandings = useApi(() => api.teamStandings(seasonParam, series), [seasonParam, series])
  const races = useApi(
    () => api.races({ page: 1, per_page: 1, season: seasonParam, series }),
    [seasonParam, series],
  )

  const isF22026 = series === "f2" && seasonParam === 2026
  const isF32026 = series === "f3" && seasonParam === 2026
  const isF12021 = series === "f1" && seasonParam === 2021
  
  let driverStandingsData = isF12021 ? (F1_2021_DRIVERS as any[]) : (driverStandings.data?.data ?? [])
  const { user } = useAppStore()
  
  if (user?.favorite_driver_id && driverStandingsData.length > 0) {
    const favIndex = driverStandingsData.findIndex(d => d.driver_id === user.favorite_driver_id)
    if (favIndex > -1) {
      const fav = driverStandingsData.splice(favIndex, 1)[0]
      driverStandingsData = [fav, ...driverStandingsData]
    }
  }
  let teamStandingsData = isF12021 ? (F1_2021_TEAMS as any[]) : (teamStandings.data?.data ?? [])
  if (user?.favorite_team_id && teamStandingsData.length > 0) {
    const favIndex = teamStandingsData.findIndex(t => t.team_id === user.favorite_team_id)
    if (favIndex > -1) {
      const fav = teamStandingsData.splice(favIndex, 1)[0]
      teamStandingsData = [fav, ...teamStandingsData]
    }
  }
  const totalRaces = (seasonParam === 2026 && series === 'f1') ? 18 : isF12021 ? 22 : isF22026 ? 22 : isF32026 ? 19 : (races.data?.meta.total ?? 0)

  const topDriver = useMemo(
    () => driverStandingsData[0],
    [driverStandingsData],
  )
  const topTeam = useMemo(
    () => teamStandingsData[0],
    [teamStandingsData],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Próximas Corridas"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <NextRaceCard series="f1" />
        <NextRaceCard series="f2" />
        <NextRaceCard series="f3" />
      </div>

      <RaceNewsCards series={series} />

      <div className="flex items-center justify-end gap-2">
        <span className="text-sm text-muted-foreground">Temporada</span>
          <div className="flex items-center gap-4">
            
            <SeasonSelector value={season} onValueChange={setSeason} />
          </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          title="Líder do campeonato"
          icon={<Trophy className="size-4" />}
          loading={driverStandings.loading}
        >
          {topDriver ? (
            <div className="flex items-center gap-4 py-2">
              <div className="transition-transform duration-500 group-hover:scale-105"><LeaderAvatar driver={topDriver} /></div>
              <div className="space-y-1">
                <div className="text-2xl md:text-3xl font-bold tracking-tight">
                  {topDriver.driver_name}
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-sm md:text-base text-muted-foreground mt-1">
                  <TeamInline name={topDriver.team_name} season={seasonParam} />
                  <span className="font-medium whitespace-nowrap hidden xs:inline">·</span>
                  <span className="font-medium whitespace-nowrap">{formatPoints(topDriver.points)} pts</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">Sem dados</p>
          )}
        </SummaryCard>

        <SummaryCard
          title="Líder dos construtores"
          icon={<Shield className="size-4" />}
          loading={teamStandings.loading}
        >
          {topTeam ? (
            <div className="flex items-center gap-4 py-2">
              <div className="transition-transform duration-500 group-hover:scale-105"><TeamBadge name={topTeam.team_name} season={seasonParam} /></div>
              <div className="space-y-1">
                <div className="text-2xl md:text-3xl font-bold tracking-tight">{displayTeamName(topTeam.team_name, seasonParam)}</div>
                <div className="text-sm md:text-base text-muted-foreground font-medium mt-1">
                  {formatPoints(topTeam.points)} pts · {topTeam.wins}{" "}
                  {topTeam.wins === 1 ? "vitória" : "vitórias"}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">Sem dados</p>
          )}
        </SummaryCard>

        <SummaryCard
          title="Corridas disputadas"
          icon={<Flag className="size-4" />}
          loading={races.loading}
        >
          {races.error ? (
            <p className="text-muted-foreground">Indisponível</p>
          ) : (
            <div className="flex h-14 items-center gap-3">
              <div className="space-y-1">
                <div className="text-lg font-semibold font-mono tracking-tight tabular-nums">
                  {totalRaces}
                </div>
                <div className="text-sm text-muted-foreground">
                  na temporada selecionada
                </div>
              </div>
            </div>
          )}
        </SummaryCard>
      </div>

      <Tabs defaultValue="drivers">
        <TabsList>
          <TabsTrigger value="drivers">Classificação de pilotos</TabsTrigger>
          <TabsTrigger value="teams">Classificação de equipes</TabsTrigger>
        </TabsList>
        <TabsContent value="drivers">
          {driverStandings.error ? (
            <ErrorState
              message={driverStandings.error}
              onRetry={driverStandings.reload}
            />
          ) : (isF22026 || isF32026) ? (
            <VirtualDataTable
              columns={getDriverColumns(seasonParam)}
              data={driverStandingsData}
              renderMobileCard={(row) => (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-2xl font-black text-muted-foreground/30 tabular-nums">
                        {row.position}º
                      </span>
                      <span className="font-bold text-lg leading-tight">{row.driver_name}</span>
                    </div>
                    <span className="font-bold text-lg tabular-nums">
                      {formatPoints(row.points)} pts
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <TeamInline season={seasonParam} name={row.team_name ?? null} />
                  </div>
                </div>
              )}
            getRowColor={(row) => {
                const logo = teamLogo(row.team_name ?? "", seasonParam);
                return logo?.color || undefined;
              }}
            />
          ) : (
            <div
              className={isF12021 ? "f1-2021-isolated-standings" : ""}
              style={isF12021 ? { maxHeight: "280px", overflowY: "auto" } : {}}
            >
              <F1DataTable
                columns={getDriverColumns(seasonParam)}
                data={driverStandingsData}
                keyField="driver_id"
                progressPending={driverStandings.loading}
                progressSkeleton
                pagination={!isF12021}
                fixedHeader={isF12021}
                fixedHeaderScrollHeight={isF12021 ? "280px" : undefined}
                paginationPerPage={20}
                paginationRowsPerPageOptions={[10, 20]}
                renderMobileCard={(row) => (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-2xl font-black text-muted-foreground/40 tabular-nums w-8 text-center shrink-0">
                        {row.position}º
                      </span>
                      <div className="min-w-0">
                        <div className="font-bold text-base leading-tight truncate">
                          {row.driver_name}
                        </div>
                        <div className="mt-1">
                          <TeamInline season={seasonParam} name={row.team_name ?? null} />
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-black text-lg text-primary tabular-nums">
                        {formatPoints(row.points)} <span className="text-xs font-semibold text-muted-foreground">pts</span>
                      </div>
                      <div className="text-xs text-muted-foreground font-medium">
                        {row.wins > 0 ? `${row.wins} vit.` : `${row.races} corr.`}
                      </div>
                    </div>
                  </div>
                )}
              />
            </div>
          )}
        </TabsContent>
        <TabsContent value="teams">
          {teamStandings.error ? (
            <ErrorState
              message={teamStandings.error}
              onRetry={teamStandings.reload}
            />
          ) : (
            <F1DataTable
              columns={getTeamColumns(seasonParam)}
              data={teamStandingsData}
              keyField="team_name"
              progressPending={teamStandings.loading}
              progressSkeleton
              renderMobileCard={(row) => (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-2xl font-black text-muted-foreground/40 tabular-nums w-8 text-center shrink-0">
                      {row.position}º
                    </span>
                    <div className="min-w-0">
                      <TeamName name={row.team_name} season={seasonParam} />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-black text-lg text-primary tabular-nums">
                      {formatPoints(row.points)} <span className="text-xs font-semibold text-muted-foreground">pts</span>
                    </div>
                    <div className="text-xs text-muted-foreground font-medium">
                      {row.wins > 0 ? `${row.wins} vitórias` : `${row.podiums} pódios`}
                    </div>
                  </div>
                </div>
              )}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
