import { useMemo } from "react"
import { useAppStore } from "@/store"
import { SeasonSelector } from "@/components/season-selector"
import { TeamInline } from "@/components/team-name"

import { VirtualDataTable } from "@/components/virtual-table"
import { ErrorState } from "@/components/error-state"
import type { TableColumn } from "react-data-table-component"
import { TeamName } from "@/components/team-name"
import { PageHeader } from "@/components/page-header"
import { Label } from "@/components/ui/label"
import { useApi } from "@/hooks/use-api"
import { useSeasons } from "@/hooks/use-seasons"
import { api, fetchAll, type Team } from "@/lib/api"
import { engineLogo, flagFromCountry, formatCountry, getTeamEngine, getTeamMetadata, getTeamStandingsOrder, teamLogo } from "@/lib/assets"
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
    minWidth: "190px",
    selector: (row) => {
      const meta = getTeamMetadata(row.name)
      return row.base_country || meta?.country || ""
    },
    cell: (row) => {
      const meta = getTeamMetadata(row.name)
      const city = row.base_city || meta?.city
      const country = row.base_country || meta?.country
      const flagUrl = flagFromCountry(country)
      const locationText = city && country ? `${city}, ${formatCountry(country)}` : (formatCountry(country) || "—")
      
      return (
        <span className="flex items-center gap-2 font-medium text-xs sm:text-sm">
          {flagUrl && (
            <img
              src={flagUrl}
              alt=""
              aria-hidden
              loading="lazy"
              className="h-3.5 w-5 shrink-0 rounded-[2px] object-cover shadow-xs"
            />
          )}
          <span className="truncate" title={locationText}>
            {locationText}
          </span>
        </span>
      )
    },
  },
  {
    name: "Motor",
    sortable: true,
    minWidth: "160px",
    selector: (row) => getTeamEngine(row.name, seasonParam, row.engine_manufacturer),
    cell: (row) => {
      const engineName = getTeamEngine(row.name, seasonParam, row.engine_manufacturer)
      const logo = engineLogo(engineName)
      
      return (
        <span
          className="flex items-center gap-2 font-medium text-xs sm:text-sm"
          title={`Motor: ${engineName}`}
        >
          {logo ? (
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-white/10 dark:bg-white/5 border border-white/20 p-1 shadow-xs">
              <img
                src={logo}
                alt={engineName}
                loading="lazy"
                referrerPolicy="no-referrer"
                className="max-h-full max-w-full object-contain"
              />
            </span>
          ) : (
            <span className="size-2 rounded-full bg-muted-foreground/40 shrink-0" />
          )}
          <span className="truncate">{engineName}</span>
        </span>
      )
    },
  },
  {
    name: "Fundação",
    right: true,
    sortable: true,
    width: "110px",
    selector: (row) => row.founded_year || getTeamMetadata(row.name)?.founded || 0,
    format: (row) => {
      const year = row.founded_year || getTeamMetadata(row.name)?.founded
      return year ? formatNumber(year) : "—"
    },
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

  const sortedTeams = useMemo(() => {
    const list = teams.data ?? []
    return [...list].sort((a, b) => {
      const orderA = getTeamStandingsOrder(a.name, seasonParam)
      const orderB = getTeamStandingsOrder(b.name, seasonParam)
      if (orderA !== orderB) return orderA - orderB
      return a.name.localeCompare(b.name)
    })
  }, [teams.data, seasonParam])

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
          data={sortedTeams}
          getRowColor={(row) => teamLogo(row.name, seasonParam)?.color || undefined}
          renderMobileCard={(row) => {
            const meta = getTeamMetadata(row.name)
            const city = row.base_city || meta?.city
            const country = row.base_country || meta?.country
            const flagUrl = flagFromCountry(country)
            const locationText = city && country ? `${city}, ${formatCountry(country)}` : (formatCountry(country) || "—")
            const engineName = getTeamEngine(row.name, seasonParam, row.engine_manufacturer)
            const engineSvg = engineLogo(engineName)
            const founded = row.founded_year || meta?.founded

            return (
              <>
                <div className="flex items-center justify-between mb-2">
                  <TeamInline season={seasonParam} name={row.name} />
                  {country && (
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                      {flagUrl && (
                        <img
                          src={flagUrl}
                          alt=""
                          aria-hidden
                          loading="lazy"
                          className="h-3 w-4.5 rounded-[2px] object-cover shadow-xs"
                        />
                      )}
                      <span>{locationText}</span>
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 mt-2 text-sm text-muted-foreground pt-1.5 border-t border-border/40">
                  <div className="flex items-center justify-between">
                    <span>Motor:</span>
                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                      {engineSvg && (
                        <span className="flex size-5.5 shrink-0 items-center justify-center rounded bg-white/10 dark:bg-white/5 border border-white/20 p-0.5 shadow-2xs">
                          <img src={engineSvg} alt="" className="max-h-full max-w-full object-contain" />
                        </span>
                      )}
                      <span>{engineName}</span>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fundação:</span>
                    <span className="font-medium text-foreground">{founded || "—"}</span>
                  </div>
                </div>
              </>
            )
          }}
        />
      )}
    </div>
  )
}
