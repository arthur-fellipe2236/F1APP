import { useState } from "react"
import type { TableColumn } from "react-data-table-component"

import { F1DataTable } from "@/components/data-table"
import { ErrorState } from "@/components/error-state"
import { Flag } from "@/components/flag"
import { PageHeader } from "@/components/page-header"
import { TeamName } from "@/components/team-name"
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
import { api, fetchAll, type Team } from "@/lib/api"
import { engineLogo, flagFromCountry } from "@/lib/assets"
import { formatNumber } from "@/lib/format"

const columns: TableColumn<Team>[] = [
  {
    name: "Equipe",
    sortable: true,
    selector: (row) => row.name,
    minWidth: "220px",
    cell: (row) => <TeamName name={row.name} />,
  },
  {
    name: "Sede",
    sortable: true,
    selector: (row) => row.base_country ?? "",
    cell: (row) => (
      <Flag src={flagFromCountry(row.base_country)} label={row.base_country} />
    ),
  },
  {
    name: "Motor",
    sortable: true,
    selector: (row) => row.engine_manufacturer ?? "",
    width: "90px",
    center: true,
    cell: (row) => {
      const logo = engineLogo(row.engine_manufacturer)
      if (!logo) {
        return <span>{row.engine_manufacturer ?? "—"}</span>
      }
      return (
        <span
          className="flex items-center justify-center"
          title={row.engine_manufacturer ?? ""}
        >
          <img
            src={logo}
            alt={row.engine_manufacturer ?? "motor"}
            loading="lazy"
            className="h-7 w-7 rounded bg-white/95 p-0.5 object-contain shadow-sm ring-1 ring-black/5"
          />
        </span>
      )
    },
  },
  {
    name: "Fundação",
    right: true,
    sortable: true,
    selector: (row) => row.founded_year ?? 0,
    format: (row) => formatNumber(row.founded_year),
  },
]

export function TeamsPage() {
  const [season, setSeason] = useState("")

  const seasons = useSeasons()
  const defaultSeason = String(seasons[0] ?? "")
  const seasonParam =
    (season === "all" ? undefined : Number(season || defaultSeason)) ||
    undefined

  const teams = useApi(
    () => fetchAll((params) => api.teams({ ...params, season: seasonParam })),
    [seasonParam],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipes"
        description="Todas as construtoras da temporada selecionada, em uma única lista — sem paginação"
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
            onValueChange={(value) => setSeason(value)}
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
      </PageHeader>

      {teams.error ? (
        <ErrorState message={teams.error} onRetry={teams.reload} />
      ) : (
        <F1DataTable
          columns={columns}
          data={teams.data ?? []}
          keyField="id"
          progressPending={teams.loading}
          progressSkeleton
          pagination={false}
        />
      )}
    </div>
  )
}
