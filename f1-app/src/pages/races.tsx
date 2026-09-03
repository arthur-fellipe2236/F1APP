import { useState } from "react"
import { useNavigate } from "react-router-dom"
import type { TableColumn } from "react-data-table-component"
import { CalendarDays } from "lucide-react"

import { F1DataTable } from "@/components/data-table"
import { ErrorState } from "@/components/error-state"
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
import { api, fetchAll, type Race } from "@/lib/api"
import { flagFromCountry } from "@/lib/assets"
import { formatDate } from "@/lib/format"

export function RacesPage() {
  const navigate = useNavigate()
  const [season, setSeason] = useState("")
  const seasons = useSeasons()
  const defaultSeason = String(seasons[0] ?? "")
  const seasonParam =
    (season === "all" ? undefined : Number(season || defaultSeason)) ||
    undefined

  const races = useApi(
    () => fetchAll((params) => api.races({ ...params, season: seasonParam })),
    [seasonParam],
  )

  const columns: TableColumn<Race>[] = [
    {
      name: "Rodada",
      width: "96px",
      center: true,
      sortable: true,
      selector: (row) => row.round,
      cell: (row) => (
        <span className="font-semibold tabular-nums">{row.round}</span>
      ),
    },
    {
      name: "Grande Prêmio",
      sortable: true,
      minWidth: "240px",
      selector: (row) => row.name,
      cell: (row) => {
        const flag = flagFromCountry(row.circuit_country)
        return (
          <span className="flex items-center gap-2">
            {flag ? (
              <img
                src={flag}
                alt=""
                aria-hidden
                title={row.circuit_country ?? undefined}
                loading="lazy"
                className="h-4 w-6 shrink-0 rounded-[2px] object-cover shadow-sm"
              />
            ) : null}
            <span className="font-medium">{row.name}</span>
          </span>
        )
      },
    },
    {
      name: "Data",
      width: "160px",
      sortable: true,
      selector: (row) => row.date ?? "",
      cell: (row) => (
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <CalendarDays className="size-3.5" />
          {formatDate(row.date)}
        </span>
      ),
    },
    {
      name: "Circuito",
      selector: (row) => row.circuit_name ?? "—",
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendário"
        description="Calendário por temporada, em ordem de rodada e sem paginação — clique em uma linha para ver o resultado"
      >
        <div className="flex items-center gap-2">
          <Label htmlFor="season-filter" className="text-muted-foreground">
            Temporada
          </Label>
          <Select
            value={season || defaultSeason || "all"}
            onValueChange={setSeason}
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

      {races.error ? (
        <ErrorState message={races.error} onRetry={races.reload} />
      ) : (
        <F1DataTable
          columns={columns}
          data={races.data ?? []}
          keyField="id"
          progressPending={races.loading}
          progressSkeleton
          pointerOnHover
          onRowClicked={(row) => navigate(`/calendario/${row.id}`)}
          pagination={false}
        />
      )}
    </div>
  )
}
