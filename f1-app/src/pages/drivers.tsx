import { useAppStore } from "@/store"
import { SeasonSelector } from "@/components/season-selector"
import { useMemo, useState } from "react"
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
import { flagFromNationality, formatNationality, teamLogo } from "@/lib/assets"

async function fetchAllDrivers(params: { team_id?: number; season?: number; series?: string }) {
  const first = await api.drivers({ ...params, page: 1, per_page: 50 })
  const all = [...first.data]
  for (let page = 2; page <= first.meta.pages; page += 1) {
    const next = await api.drivers({ ...params, page, per_page: 50 })
    all.push(...next.data)
  }
  return { data: all, meta: first.meta }
}

export function DriversPage() {
  const { series, season, setSeason } = useAppStore()
  const [teamId, setTeamId] = useState("all")
  

  const seasons = useSeasons()
  const defaultSeason = String(seasons[0] ?? "")
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

  const driversData = useMemo(() => {
    let d = drivers.data?.data ?? []
    if ((series === "f2" || series === "f3") && seasonParam === 2026) {
      d = [...d].sort((a, b) => (a.permanent_number ?? 0) - (b.permanent_number ?? 0))
    }
    return d
  }, [drivers.data, series, seasonParam])

  const teamNames = useMemo(() => {
    const map = new Map<number, string>()
    for (const team of teams.data?.data ?? []) {
      map.set(team.id, team.name)
    }
    return map
  }, [teams.data])

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
        <div className="flex items-center gap-2">
          <Label htmlFor="season-filter" className="text-muted-foreground">
            Temporada
          </Label>
          <SeasonSelector value={String(season || defaultSeason)} onValueChange={(value) => {
              setSeason(value)
              setTeamId("all")
            }} className="w-[180px]" />
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
            <SelectTrigger id="team-filter">
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
