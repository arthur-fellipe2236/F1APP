import { useAppStore } from "@/store"
import { SeasonSelector } from "@/components/season-selector"
import { useState, useMemo, useEffect } from "react"
import type { TableColumn } from "react-data-table-component"

import { VirtualDataTable } from "@/components/virtual-table"
import { ErrorState } from "@/components/error-state"
import { Flag } from "@/components/flag"
import { PageHeader } from "@/components/page-header"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useApi } from "@/hooks/use-api"
import { useSeasonsState } from "@/hooks/use-seasons"
import { resolveSeasonReset } from "@/lib/season-utils"
import { api, fetchAll, type Circuit } from "@/lib/api"
import { driverPhoto, flagFromCountry } from "@/lib/assets"
import { RESULTS_POLL_MS } from "@/lib/request-gate"

function WinnerAvatar({ name, headshotUrl }: { name: string; headshotUrl?: string | null }) {
  const src = driverPhoto(name, undefined, headshotUrl)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [src])

  if (!src || failed) {
    const parts = name.trim().split(/\s+/).filter(Boolean)
    const initials =
      parts.length > 1
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`
        : name.slice(0, 2)
    return (
      <span
        aria-hidden
        data-driver-avatar-fallback="true"
        className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border/60 bg-muted text-[10px] font-semibold uppercase text-muted-foreground"
      >
        {initials}
      </span>
    )
  }

  return (
    <img
      loading="lazy"
      src={src}
      alt={name}
      onError={() => setFailed(true)}
      className={`size-8 shrink-0 rounded-full bg-muted object-cover ${
        src.includes("wikimedia") ? "object-center" : "object-top"
      }`}
    />
  )
}

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
          <WinnerAvatar name={row.winner.name} headshotUrl={row.winner.headshot_url} />
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
        <WinnerAvatar name={row.sprint_winner.name} headshotUrl={row.sprint_winner.headshot_url} />
        <span>{row.sprint_winner.name}</span>
      </div>
    ) : (
      <span className="text-muted-foreground">—</span>
    ),
}

export function CircuitsPage() {
  
  const { series, season, setSeason } = useAppStore()
  const [raceType, setRaceType] = useState("feature")

  const { seasons, loading: seasonsLoading } = useSeasonsState(series)
  const defaultSeason = String(seasons[0] ?? "")

  useEffect(() => {
    const nextSeason = resolveSeasonReset({
      series,
      season,
      seasons,
      loading: seasonsLoading,
      includeAll: true,
    })
    if (nextSeason !== null) {
      setSeason(nextSeason)
    }
  }, [series, seasons, seasonsLoading, season, setSeason])

  const seasonParam =
    (season === "all" ? undefined : Number(season || defaultSeason)) ||
    undefined

  const currentYear = new Date().getFullYear()
  const circuits = useApi(
    () =>
      fetchAll((params) => api.circuits({ ...params, season: seasonParam, series, race_type: raceType })),
    [seasonParam, series, raceType],
    (data) =>
      seasonParam && seasonParam >= currentYear && (!data || data.some((c) => !c.winner))
        ? RESULTS_POLL_MS
        : false,
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
          <SeasonSelector
            value={String(season || defaultSeason)}
            onValueChange={handleSeasonChange}
            series={series}
            includeAll
            className="w-[180px]"
          />
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
