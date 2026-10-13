import { useAppStore } from "@/store"
import { SeasonSelector } from "@/components/season-selector"
import { useState, useMemo } from "react"
import type { TableColumn } from "react-data-table-component"

import { VirtualDataTable } from "@/components/virtual-table"
import { ErrorState } from "@/components/error-state"
import { Flag } from "@/components/flag"
import { PageHeader } from "@/components/page-header"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useApi } from "@/hooks/use-api"
import { useSeasons } from "@/hooks/use-seasons"
import { api, fetchAll, type Circuit } from "@/lib/api"
import { flagFromCountry } from "@/lib/assets"

const FALLBACK_AVATAR = "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/A/ANDANT01_Andrea%20Kimi_Antonelli/andant01.png.transform/1col/image.png"

const roundColumn: TableColumn<Circuit> = {
  name: "Rodada",
  width: "90px",
  center: true,
  selector: (row) => row.round ?? 0,
  cell: (row) => (
    <span className="font-semibold font-mono tracking-tight tabular-nums">{row.round ?? "—"}</span>
  ),
}

const columns: TableColumn<Circuit>[] = [
  {
    name: "Circuito",
    sortable: true,
    selector: (row) => row.name,
    cell: (row) => <span className="font-medium">{row.name}</span>,
  },
  {
    name: "Vencedor",
    sortable: true,
    selector: (row) => row.winner?.name ?? "",
    cell: (row) =>
      row.winner ? (
        <div className="flex items-center gap-2">
          <img
            loading="lazy"
            src={row.winner.headshot_url || FALLBACK_AVATAR}
            alt={row.winner.name}
            className={`size-8 object-cover rounded-full bg-muted ${(row.winner.headshot_url || "").includes('wikimedia') ? 'object-center' : 'object-top'}`}
          />
          <span>{row.winner.name}</span>
        </div>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    name: "País",
    sortable: true,
    selector: (row) => row.country ?? "",
    cell: (row) => (
      <Flag src={flagFromCountry(row.country)} label={row.country} />
    ),
  },
]

const sprintWinnerColumn: TableColumn<Circuit> = {
  name: "Vencedor Sprint",
  sortable: false,
  selector: (row) => row.sprint_winner?.name ?? "",
  cell: (row) =>
    row.sprint_winner ? (
      <div className="flex items-center gap-2">
        <img
          loading="lazy"
          src={row.sprint_winner.headshot_url || FALLBACK_AVATAR}
          alt={row.sprint_winner.name}
          className={`size-8 object-cover rounded-full bg-muted ${(row.sprint_winner.headshot_url || "").includes('wikimedia') ? 'object-center' : 'object-top'}`}
        />
        <span>{row.sprint_winner.name}</span>
      </div>
    ) : (
      <span className="text-muted-foreground">—</span>
    ),
}

export function CircuitsPage() {
  
  const { series, season, setSeason } = useAppStore()
  const [raceType, setRaceType] = useState("feature")

  const seasons = useSeasons()
  const defaultSeason = String(seasons[0] ?? "")
  const seasonParam =
    (season === "all" ? undefined : Number(season || defaultSeason)) ||
    undefined

  const circuits = useApi(
    () =>
      fetchAll((params) => api.circuits({ ...params, season: seasonParam, series, race_type: raceType })),
    [seasonParam, series, raceType],
  )

  const mappedCircuits = useMemo(() => {
    if (!circuits.data) return []
    return circuits.data.map((c, i) => ({ ...c, round: i + 1 }))
  }, [circuits.data])

  const visibleColumns = useMemo(() => {
    let cols = seasonParam ? [roundColumn, ...columns] : columns
    if (seasonParam === 2021 && series === "f1" && raceType === "feature") {
      // Insert sprint winner column before Country
      cols = [
        ...cols.slice(0, -1),
        sprintWinnerColumn,
        cols[cols.length - 1]
      ]
    }
    // Formato do Fim de Semana was completely removed for F2 and F3, keeping it clean
    return cols
  }, [seasonParam, series, raceType])

  const handleSeasonChange = (value: string) => {
    setSeason(value)
    if (value === "2021" && raceType === "sprint") {
      if (series === "f1") setRaceType("feature")
      else setRaceType("sprint1")
    } else if (value !== "2021" && (raceType === "sprint1" || raceType === "sprint2")) {
      setRaceType("sprint")
    }
  }

  return (
    <div className="space-y-6">
      
      
      {(series === "f1" || series === "f2" || series === "f3") && (
        <Tabs value={raceType} onValueChange={setRaceType} className="w-auto inline-flex">
          <TabsList>
            <TabsTrigger value="feature">Corrida Principal</TabsTrigger>
            {(seasonParam === 2021 && (series === "f2" || series === "f3")) ? (
              <>
                <TabsTrigger value="sprint1">Corrida Sprint 1</TabsTrigger>
                <TabsTrigger value="sprint2">Corrida Sprint 2</TabsTrigger>
              </>
            ) : (seasonParam === 2021 && series === "f1") ? null : (
              <TabsTrigger value="sprint">Corrida Sprint</TabsTrigger>
            )}
          </TabsList>
        </Tabs>
      )}

      <PageHeader
        title="Resultados"
      >
        <div className="flex items-center gap-2">
          <Label htmlFor="season-filter" className="text-muted-foreground">
            Temporada
          </Label>
          <SeasonSelector value={String(season || defaultSeason)} onValueChange={handleSeasonChange} className="w-[180px]" />
        </div>
      </PageHeader>

      {circuits.error ? (
        <ErrorState message={circuits.error} onRetry={circuits.reload} />
      ) : (
        <VirtualDataTable
          columns={visibleColumns}
          data={mappedCircuits}
          renderMobileCard={(row) => (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-bold">{row.name}</span>
                {row.country && (
                  <Flag src={flagFromCountry(row.country)} label={row.country} />
                )}
              </div>
              <div className="text-sm text-muted-foreground border-b border-border/50 pb-2 mb-1">
                {row.laps} voltas • {row.length_km} km
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Vencedor ({raceType === "feature" ? "Principal" : "Sprint"}):</span>
                <span className="font-medium text-foreground text-right leading-tight">
                  {raceType === "feature" ? (row.winner?.name || "—") : ((row as any).sprint_winner?.name || "—")}
                </span>
              </div>
            </div>
          )}
        />
      )}
    </div>
  )
}
