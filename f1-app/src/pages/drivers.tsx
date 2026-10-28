import { useAppStore } from "@/store"
import { SeasonSelector } from "@/components/season-selector"
import { SeriesSelector } from "@/components/series-selector"
import { useMemo, useState, useEffect } from "react"
import type { TableColumn } from "react-data-table-component"

import { VirtualDataTable } from "@/components/virtual-table"
import { ErrorState } from "@/components/error-state"
import { Flag } from "@/components/flag"
import { PageHeader } from "@/components/page-header"
import { TeamInline } from "@/components/team-name"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useApi } from "@/hooks/use-api"
import { useSeasons } from "@/hooks/use-seasons"
import { api, type Driver } from "@/lib/api"
import { flagFromNationality, formatNationality, getTeamStandingsOrder, teamLogo } from "@/lib/assets"

async function fetchAllDrivers(params: { team_id?: number; season?: number; series?: string }) {
  const first = await api.drivers({ ...params, page: 1, per_page: 50 })
  const all = [...first.data]
  for (let page = 2; page <= first.meta.pages; page += 1) {
    const next = await api.drivers({ ...params, page, per_page: 50 })
    all.push(...next.data)
  }
  return { data: all, meta: first.meta }
}

const F1_2026_GRID_DRIVER_ORDER: Record<number, number> = {
  34: 1, 39: 2,     // McLaren: Norris, Piastri
  36: 3, 238: 4,    // Mercedes: Russell, Antonelli
  13: 5, 46: 6,     // Red Bull Racing: Verstappen, Hadjar
  32: 7, 1: 8,      // Ferrari: Leclerc, Hamilton
  35: 9, 9: 10,     // Williams: Albon, Sainz
  20: 11, 29: 12,   // Aston Martin: Alonso, Stroll
  31: 13, 49: 14,   // Alpine: Gasly, Colapinto
  27: 15, 43: 16,   // Haas: Ocon, Bearman
  236: 17, 47: 18,  // Audi: Hulkenberg, Bortoleto
  45: 19, 48: 20,   // Racing Bulls: Lawson, Lindblad
  237: 21, 18: 22,  // Cadillac: Perez, Bottas
}

const F1_2026_TEAM_ORDER: Record<string, number> = {
  "McLaren": 1,
  "Mercedes": 2,
  "Red Bull Racing": 3,
  "Ferrari": 4,
  "Williams": 5,
  "Aston Martin": 6,
  "Alpine": 7,
  "Haas": 8,
  "Audi": 9,
  "Racing Bulls": 10,
  "Cadillac": 11,
}

export function DriversPage() {
  const { series, setSeries, season, setSeason } = useAppStore()
  const [teamId, setTeamId] = useState("all")

  // Reset team filter when series changes
  useEffect(() => {
    setTeamId("all")
  }, [series])

  const seasons = useSeasons(series)
  const defaultSeason = String(seasons[0] ?? "")

  // Clamp season when series changes to F2/F3
  useEffect(() => {
    if (series !== "f1" && seasons.length > 0) {
      if (!seasons.includes(Number(season))) {
        setSeason(String(seasons[0]))
      }
    }
  }, [series, seasons, season, setSeason])

  const seasonParam =
    (season === "all" ? undefined : Number(season || defaultSeason)) ||
    undefined

  const teams = useApi(
    () => api.teams({ page: 1, per_page: 50, season: seasonParam, series }),
    [seasonParam, series],
  )

  const drivers = useApi(
    () =>
      fetchAllDrivers({
        series,
        team_id: teamId === "all" ? undefined : Number(teamId),
        season: seasonParam,
      }),
    [teamId, seasonParam, series],
  )

  const teamNames = useMemo(() => {
    const map = new Map<number, string>()
    for (const team of teams.data?.data ?? []) {
      map.set(team.id, team.name)
    }
    return map
  }, [teams.data])

  const driversData = useMemo(() => {
    let d = drivers.data?.data ?? []
    if (series === "f1" && seasonParam === 2026) {
      d = [...d].sort((a, b) => {
        const orderA = F1_2026_GRID_DRIVER_ORDER[a.id]
        const orderB = F1_2026_GRID_DRIVER_ORDER[b.id]
        if (orderA !== undefined && orderB !== undefined) {
          return orderA - orderB
        }
        if (orderA !== undefined) return -1
        if (orderB !== undefined) return 1

        const teamA = a.team_name ?? (a.team_id ? (teamNames.get(a.team_id) ?? "") : "")
        const teamB = b.team_name ?? (b.team_id ? (teamNames.get(b.team_id) ?? "") : "")
        const tOrderA = F1_2026_TEAM_ORDER[teamA] ?? 999
        const tOrderB = F1_2026_TEAM_ORDER[teamB] ?? 999
        if (tOrderA !== tOrderB) return tOrderA - tOrderB

        return (a.permanent_number ?? a.season_number ?? 0) - (b.permanent_number ?? b.season_number ?? 0)
      })
    } else if (series === "f1") {
      d = [...d].sort((a, b) => {
        const teamA = a.team_name ?? (a.team_id ? (teamNames.get(a.team_id) ?? "") : "")
        const teamB = b.team_name ?? (b.team_id ? (teamNames.get(b.team_id) ?? "") : "")
        if (teamA !== teamB) {
          const tOrderA = getTeamStandingsOrder(teamA, seasonParam)
          const tOrderB = getTeamStandingsOrder(teamB, seasonParam)
          if (tOrderA !== tOrderB) return tOrderA - tOrderB
          return teamA.localeCompare(teamB)
        }
        return (a.permanent_number ?? a.season_number ?? 0) - (b.permanent_number ?? b.season_number ?? 0)
      })
    } else if (series === "f2" || series === "f3") {
      d = [...d].sort((a, b) => {
        const teamA = a.team_name ?? (a.team_id ? (teamNames.get(a.team_id) ?? "") : "")
        const teamB = b.team_name ?? (b.team_id ? (teamNames.get(b.team_id) ?? "") : "")
        if (teamA !== teamB) return teamA.localeCompare(teamB)
        return (a.name || "").localeCompare(b.name || "")
      })
    }
    return d
  }, [drivers.data, series, seasonParam, teamNames])

  const columns = useMemo<TableColumn<Driver>[]>(
    () => [
      {
        name: "Nº",
        width: "80px",
        center: true,
        selector: (row) => row.permanent_number ?? row.season_number ?? 0,
        cell: (row) => (
          <span className="font-semibold font-mono tracking-tight tabular-nums">
            {row.permanent_number ?? row.season_number ?? "—"}
          </span>
        ),
      },
      {
        name: "Piloto",
        sortable: true,
        selector: (row) => row.name,
        cell: (row) => <span className="font-medium">{row.name}</span>,
      },
      {
        name: "Nacionalidade",
        sortable: true,
        selector: (row) => row.nationality ?? "",
        cell: (row) => (
          <Flag
            src={flagFromNationality(row.nationality)}
            label={formatNationality(row.nationality)}
          />
        ),
      },
      {
        name: "Equipe",
        sortable: true,
        selector: (row) =>
          row.team_name ??
          (row.team_id ? (teamNames.get(row.team_id) ?? "") : ""),
        cell: (row) => (
          <TeamInline
            season={seasonParam}
            name={
              row.team_name ??
              (row.team_id ? (teamNames.get(row.team_id) ?? null) : null)
            }
          />
        ),
      },
    ],
    [teamNames],
  )

  return (
    <div className="space-y-6">
      
      <PageHeader title="Tabelas de Pilotos">
        <div className="flex flex-wrap items-center gap-3">
          <SeriesSelector
            value={series}
            onChange={(s) => setSeries(s)}
            size="sm"
          />
          <div className="flex items-center gap-2">
            <Label htmlFor="season-filter" className="text-muted-foreground">
              Temporada
            </Label>
            <SeasonSelector
              value={String(season || defaultSeason)}
              onValueChange={(value) => {
                setSeason(value)
                setTeamId("all")
              }}
              series={series}
              className="w-[180px]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="team-filter" className="text-muted-foreground">
              Equipe
            </Label>
            <Select
              value={teamId}
              onValueChange={(value) => {
                setTeamId(value)
              }}
            >
              <SelectTrigger id="team-filter" className="w-[180px] sm:w-[200px]">
                <SelectValue placeholder="Filtrar por equipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as equipes</SelectItem>
                {(teams.data?.data ?? []).map((team) => (
                  <SelectItem key={team.id} value={String(team.id)}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </PageHeader>

      {drivers.error ? (
        <ErrorState message={drivers.error} onRetry={drivers.reload} />
      ) : (
        <VirtualDataTable
          columns={columns}
          data={driversData}
          getRowColor={(row) => {
            const tName = row.team_name ?? (row.team_id ? (teamNames.get(row.team_id) ?? null) : null);
            if (tName) {
              const logo = teamLogo(tName, seasonParam);
              return logo?.color || undefined;
            }
            return undefined;
          }}
          renderMobileCard={(row) => (
            <>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-3xl font-black text-muted-foreground/30 tabular-nums leading-none tracking-tighter">
                    {row.permanent_number ?? row.season_number ?? "0"}
                  </span>
                  <span className="text-lg font-bold leading-none">{row.name}</span>
                </div>
                {row.nationality && (
                  <Flag
                    src={flagFromNationality(row.nationality)}
                    label={formatNationality(row.nationality)}
                  />
                )}
              </div>
              <div className="flex items-center justify-between mt-2 pt-3 border-t border-border/50">
                <TeamInline
                  season={seasonParam}
                  name={
                    row.team_name ??
                    (row.team_id ? (teamNames.get(row.team_id) ?? null) : null)
                  }
                />
              </div>
            </>
          )}
        />
      )}
    </div>
  )
}
