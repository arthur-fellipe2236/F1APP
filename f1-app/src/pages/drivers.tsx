import { useMemo, useState } from "react"
import type { TableColumn } from "react-data-table-component"

import { F1DataTable } from "@/components/data-table"
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
import { flagFromNationality } from "@/lib/assets"

async function fetchAllDrivers(params: {
  team_id?: number
  season?: number
}) {
  const first = await api.drivers({ ...params, page: 1, per_page: 50 })
  const all = [...first.data]
  for (let page = 2; page <= first.meta.pages; page += 1) {
    const next = await api.drivers({ ...params, page, per_page: 50 })
    all.push(...next.data)
  }
  return { data: all, meta: first.meta }
}

export function DriversPage() {
  const [teamId, setTeamId] = useState("all")
  const [season, setSeason] = useState("")

  const seasons = useSeasons()
  const defaultSeason = String(seasons[0] ?? "")
  const seasonParam =
    (season === "all" ? undefined : Number(season || defaultSeason)) ||
    undefined

  const teams = useApi(
    () => api.teams({ page: 1, per_page: 50, season: seasonParam }),
    [seasonParam],
  )

  const teamFilter = teamId === "all" ? undefined : Number(teamId)
  const drivers = useApi(
    () => fetchAllDrivers({ team_id: teamFilter, season: seasonParam }),
    [teamFilter, seasonParam],
  )

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
        selector: (row) => row.permanent_number ?? 0,
        cell: (row) => (
          <span className="font-semibold tabular-nums">
            {row.permanent_number ?? "—"}
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
            label={row.nationality}
          />
        ),
      },
      {
        name: "Equipe",
        sortable: true,
        selector: (row) =>
          row.team_name
          ?? (row.team_id ? (teamNames.get(row.team_id) ?? "") : ""),
        cell: (row) => (
          <TeamInline
            name={
              row.team_name
              ?? (row.team_id ? (teamNames.get(row.team_id) ?? null) : null)
            }
          />
        ),
      },
    ],
    [teamNames],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pilotos"
        description="Todos os pilotos que participaram da temporada, em uma única lista — sem paginação"
      >
        <div className="flex items-center gap-2">
          <Label
            htmlFor="season-filter"
            className="text-muted-foreground"
          >
            Temporada
          </Label>
          <Select
            value={season || defaultSeason || "all"}
            onValueChange={(value) => {
              setSeason(value)
              setTeamId("all")
            }}
          >
            <SelectTrigger id="season-filter">
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
        <F1DataTable
          columns={columns}
          data={drivers.data?.data ?? []}
          keyField="id"
          progressPending={drivers.loading}
          progressSkeleton
          pagination={false}
        />
      )}
    </div>
  )
}
