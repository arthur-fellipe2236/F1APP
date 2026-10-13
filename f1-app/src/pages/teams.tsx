import { useAppStore } from "@/store"
import { SeasonSelector } from "@/components/season-selector"
import { TeamInline } from "@/components/team-name"

import { VirtualDataTable } from "@/components/virtual-table"
import { ErrorState } from "@/components/error-state"
import type { TableColumn } from "react-data-table-component"
import { Flag } from "@/components/flag"
import { TeamName } from "@/components/team-name"
import { PageHeader } from "@/components/page-header"
import { Label } from "@/components/ui/label"
import { useApi } from "@/hooks/use-api"
import { useSeasons } from "@/hooks/use-seasons"
import { api, fetchAll, type Team } from "@/lib/api"
import { engineLogo, flagFromCountry, formatCountry , teamLogo, flagFromNationality, formatNationality } from "@/lib/assets"
import { formatNumber } from "@/lib/format"

const getColumns = (seasonParam?: number): TableColumn<Team>[] => [
  {
    name: "Equipe",
    sortable: true,
    selector: (row) => row.name,
    minWidth: "220px",
    cell: (row) => <TeamName name={row.name} season={seasonParam} />,
  },
  {
    name: "Sede",
    sortable: true,
    selector: (row) => row.base_country ?? "",
    cell: (row) => (
      <Flag src={flagFromCountry(row.base_country)} label={formatCountry(row.base_country)} />
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
  const { series, season, setSeason } = useAppStore()
  

  const seasons = useSeasons()
  const defaultSeason = String(seasons[0] ?? "")
  const seasonParam =
    (season === "all" ? undefined : Number(season || defaultSeason)) ||
    undefined

  const teams = useApi(
    () => fetchAll((params) => api.teams({ ...params, season: seasonParam, series })),
    [seasonParam, series],
  )

  return (
    <div className="space-y-6">
      
      <PageHeader
        title="Equipes"
      >
        <div className="flex items-center gap-2">
          <Label htmlFor="season-filter" className="text-muted-foreground">
            Temporada
          </Label>
          <SeasonSelector value={String(season || defaultSeason)} onValueChange={(value) => setSeason(value)} className="w-[180px]" />
        </div>
      </PageHeader>

      {teams.error ? (
        <ErrorState message={teams.error} onRetry={teams.reload} />
      ) : (
        <VirtualDataTable
          columns={getColumns(seasonParam)}
          data={teams.data ?? []}
          getRowColor={(row) => teamLogo(row.name, seasonParam)?.color || undefined}
          renderMobileCard={(row) => (
            <>
              <div className="flex items-center justify-between mb-2">
                <TeamInline season={seasonParam} name={row.name} />
                {row.base_country && (
                  <Flag
                    src={flagFromNationality(row.base_country)}
                    label={formatNationality(row.base_country)}
                  />
                )}
              </div>
              <div className="flex flex-col gap-1 mt-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Motor:</span>
                  <span className="font-medium text-foreground">{row.engine_manufacturer || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Fundação:</span>
                  <span className="font-medium text-foreground">{row.founded_year || "—"}</span>
                </div>
              </div>
            </>
          )}
        />
      )}
    </div>
  )
}
