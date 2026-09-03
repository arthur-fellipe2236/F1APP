import { useState } from "react"
import type { TableColumn } from "react-data-table-component"

import { F1DataTable } from "@/components/data-table"
import { ErrorState } from "@/components/error-state"
import { Flag } from "@/components/flag"
import { PageHeader } from "@/components/page-header"
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
import { api, fetchAll, type Circuit } from "@/lib/api"
import { flagFromCountry } from "@/lib/assets"
import { formatKm, formatNumber } from "@/lib/format"

const roundColumn: TableColumn<Circuit> = {
  name: "Rodada",
  width: "90px",
  center: true,
  selector: (row) => row.round ?? 0,
  cell: (row) => (
    <span className="font-semibold tabular-nums">{row.round ?? "—"}</span>
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
        <span>{row.winner.name}</span>
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
  {
    name: "Extensão",
    right: true,
    sortable: true,
    selector: (row) => row.length_km ?? 0,
    format: (row) => formatKm(row.length_km),
  },
  {
    name: "Voltas",
    right: true,
    sortable: true,
    selector: (row) => row.laps ?? 0,
    format: (row) => formatNumber(row.laps),
  },
]

export function CircuitsPage() {
  const [season, setSeason] = useState("")

  const seasons = useSeasons()
  const defaultSeason = String(seasons[0] ?? "")
  const seasonParam =
    (season === "all" ? undefined : Number(season || defaultSeason)) ||
    undefined

  const circuits = useApi(
    () =>
      fetchAll((params) => api.circuits({ ...params, season: seasonParam })),
    [seasonParam],
  )

  const visibleColumns = seasonParam
    ? [roundColumn, ...columns]
    : columns

  return (
    <div className="space-y-6">
      <PageHeader
        title="Circuitos"
        description={
          seasonParam
            ? "Autódromos do ano selecionado, em ordem de calendário — sem paginação"
            : "Autódromos presentes no calendário — todos em uma única lista"
        }
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

      {circuits.error ? (
        <ErrorState message={circuits.error} onRetry={circuits.reload} />
      ) : (
        <F1DataTable
          columns={visibleColumns}
          data={circuits.data ?? []}
          keyField="id"
          progressPending={circuits.loading}
          progressSkeleton
          pagination={false}
        />
      )}
    </div>
  )
}
