import { useMemo, useState, type ReactNode } from "react"
import type { TableColumn } from "react-data-table-component"
import { Flag, Shield, Trophy } from "lucide-react"

import { CodeBadge } from "@/components/driver-code"
import { F1DataTable } from "@/components/data-table"
import { BrazilNewsRow } from "@/components/brazil-news-cards"
import { ErrorState } from "@/components/error-state"
import { NextRaceCard } from "@/components/next-race-card"
import { PageHeader } from "@/components/page-header"
import { PositionBadge } from "@/components/position-badge"
import { RaceNewsCards } from "@/components/race-news-cards"
import { TeamInline, TeamName } from "@/components/team-name"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useApi } from "@/hooks/use-api"
import { useSeasons } from "@/hooks/use-seasons"
import { api, type DriverStanding, type TeamStanding } from "@/lib/api"
import { teamLogo } from "@/lib/assets"
import { formatPoints } from "@/lib/format"
import { mediaUrl } from "@/lib/media"
import { cn } from "@/lib/utils"

const driverColumns: TableColumn<DriverStanding>[] = [
  {
    name: "Pos",
    width: "72px",
    cell: (row) => <PositionBadge position={row.position} />,
  },
  {
    name: "Piloto",
    sortable: true,
    selector: (row) => row.driver_name,
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
    cell: (row) => <TeamInline name={row.team_name} />,
  },
  { name: "Corridas", right: true, sortable: true, selector: (row) => row.races },
  { name: "Pódios", right: true, sortable: true, selector: (row) => row.podiums },
  { name: "Vitórias", right: true, sortable: true, selector: (row) => row.wins },
  {
    name: "Pontos",
    right: true,
    sortable: true,
    selector: (row) => row.points,
    cell: (row) => (
      <span className="font-semibold tabular-nums">
        {formatPoints(row.points)}
      </span>
    ),
  },
]

const teamColumns: TableColumn<TeamStanding>[] = [
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
    cell: (row) => <TeamName name={row.team_name} />,
  },
  { name: "Corridas", right: true, sortable: true, selector: (row) => row.races },
  { name: "Vitórias", right: true, sortable: true, selector: (row) => row.wins },
  { name: "Pódios", right: true, sortable: true, selector: (row) => row.podiums },
  {
    name: "Pontos",
    right: true,
    sortable: true,
    selector: (row) => row.points,
    cell: (row) => (
      <span className="font-semibold tabular-nums">
        {formatPoints(row.points)}
      </span>
    ),
  },
]

function LeaderAvatar({ driver }: { driver: DriverStanding }) {
  const [broken, setBroken] = useState(false)
  if (!driver.headshot_url || broken) {
    return (
      <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-muted-foreground ring-1 ring-black/10">
        {(
          driver.driver_code ?? driver.driver_name.slice(0, 3)
        ).toUpperCase()}
      </span>
    )
  }
  return (
    <img
      src={mediaUrl(driver.headshot_url, 112) ?? driver.headshot_url}
      alt={driver.driver_name}
      loading="lazy"
      onError={() => setBroken(true)}
      className="size-14 shrink-0 rounded-full bg-secondary object-cover ring-1 ring-black/10"
    />
  )
}

function TeamBadge({ name }: { name: string }) {
  const [broken, setBroken] = useState(false)
  const logo = teamLogo(name)
  if (!logo || broken) {
    const initials = (
      name.split(/\s+/).map((word) => word[0]).join("") || name.slice(0, 2)
    ).toUpperCase().slice(0, 3)
    return (
      <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-muted-foreground ring-1 ring-black/10">
        {initials}
      </span>
    )
  }
  return (
    <img
      src={mediaUrl(logo.url, 160) ?? logo.url}
      alt=""
      aria-hidden
      loading="lazy"
      onError={() => setBroken(true)}
      className={cn(
        "size-14 shrink-0 rounded-full bg-white/95 object-contain p-1.5 ring-1 ring-black/10",
        logo.className,
      )}
    />
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
    <Card className="relative">
      {background ? (
        <img
          src={background.url}
          alt=""
          aria-hidden
          loading="lazy"
          className={cn(
            "pointer-events-none absolute inset-0 size-full object-contain p-3 opacity-15 dark:opacity-20 dark:brightness-90",
            background.className,
          )}
        />
      ) : null}
      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="relative">
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

export function DashboardPage() {
  const [season, setSeason] = useState("all")
  const seasons = useSeasons()
  const seasonParam = season === "all" ? undefined : Number(season)

  const driverStandings = useApi(
    () => api.driverStandings(seasonParam),
    [season],
  )
  const teamStandings = useApi(() => api.teamStandings(seasonParam), [season])
  const races = useApi(
    () => api.races({ page: 1, per_page: 1, season: seasonParam }),
    [season],
  )

  const topDriver = useMemo(
    () => driverStandings.data?.data[0],
    [driverStandings.data],
  )
  const topTeam = useMemo(
    () => teamStandings.data?.data[0],
    [teamStandings.data],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Painel"
        description="Visão geral das classificações da Fórmula 1"
      />

      <NextRaceCard />

      <RaceNewsCards />

      <BrazilNewsRow />

      <div className="flex items-center justify-end gap-2">
        <span className="text-sm text-muted-foreground">Temporada</span>
        <Select value={season} onValueChange={setSeason}>
          <SelectTrigger>
            <SelectValue placeholder="Temporada" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as temporadas</SelectItem>
            {seasons.map((year) => (
              <SelectItem key={year} value={String(year)}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          title="Líder do campeonato"
          icon={<Trophy className="size-4" />}
          loading={driverStandings.loading}
        >
          {topDriver ? (
            <div className="flex items-center gap-3">
              <LeaderAvatar driver={topDriver} />
              <div className="space-y-1">
                <div className="text-lg font-semibold">
                  {topDriver.driver_name}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <TeamInline name={topDriver.team_name} />
                  <span>&nbsp;· {formatPoints(topDriver.points)} pts</span>
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
          background={
            topTeam ? teamLogo(topTeam.team_name) : null
          }
        >
          {topTeam ? (
            <div className="flex items-center gap-3">
              <TeamBadge name={topTeam.team_name} />
              <div className="space-y-1">
                <div className="text-lg font-semibold leading-tight">
                  {topTeam.team_name}
                </div>
                <div className="text-sm text-muted-foreground">
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
            <div className="space-y-1">
              <div className="text-lg font-semibold tabular-nums">
                {races.data?.meta.total ?? 0}
              </div>
              <div className="text-sm text-muted-foreground">
                na temporada selecionada
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
          ) : (
            <F1DataTable
              columns={driverColumns}
              data={driverStandings.data?.data ?? []}
              keyField="driver_id"
              progressPending={driverStandings.loading}
              progressSkeleton
              pagination
              paginationPerPage={20}
              paginationRowsPerPageOptions={[10, 20]}
            />
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
              columns={teamColumns}
              data={teamStandings.data?.data ?? []}
              keyField="team_name"
              progressPending={teamStandings.loading}
              progressSkeleton
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
