import { Link, useParams } from "react-router-dom"
import type { TableColumn } from "react-data-table-component"
import { ArrowLeft, MapPin, Zap } from "lucide-react"

import { CodeBadge } from "@/components/driver-code"
import { F1DataTable } from "@/components/data-table"
import { ErrorState } from "@/components/error-state"
import { PositionBadge } from "@/components/position-badge"
import { TeamInline } from "@/components/team-name"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useApi } from "@/hooks/use-api"
import { api, type RaceResult } from "@/lib/api"
import { formatDate, formatPoints, formatStatus } from "@/lib/format"

const resultColumns: TableColumn<RaceResult>[] = [
  {
    name: "Pos",
    width: "72px",
    cell: (row) => <PositionBadge position={row.position} />,
  },
  {
    name: "Piloto",
    sortable: true,
    selector: (row) => row.driver_name ?? "",
    cell: (row) => (
      <div className="flex items-center gap-2">
        <span className="font-medium">{row.driver_name ?? "—"}</span>
        <CodeBadge
          code={row.driver_code}
          nationality={row.driver_nationality}
        />
      </div>
    ),
  },
  {
    name: "Equipe",
    sortable: true,
    selector: (row) => row.team_name ?? "",
    cell: (row) => <TeamInline name={row.team_name} />,
  },
  {
    name: "Largada",
    width: "100px",
    center: true,
    sortable: true,
    selector: (row) => row.grid ?? 0,
    format: (row) => row.grid ?? "—",
  },
  {
    name: "Voltas",
    width: "100px",
    center: true,
    selector: (row) => row.laps ?? 0,
    format: (row) => row.laps ?? "—",
  },
  {
    name: "Status",
    sortable: true,
    selector: (row) => row.status ?? "",
    cell: (row) => (
      <Badge
        variant={row.status === "finished" ? "secondary" : "destructive"}
      >
        {formatStatus(row.status)}
      </Badge>
    ),
  },
  {
    name: "Volta rápida",
    width: "130px",
    center: true,
    selector: (row) => row.fastest_lap,
    cell: (row) =>
      row.fastest_lap ? <Zap className="size-4 text-amber-500" /> : null,
  },
  {
    name: "Pontos",
    width: "110px",
    right: true,
    sortable: true,
    selector: (row) => row.points + row.sprint_points,
    cell: (row) => (
      <div className="flex flex-col items-end">
        <span className="font-semibold tabular-nums">
          {formatPoints(row.points)}
        </span>
        {row.sprint_points > 0 ? (
          <span className="text-xs text-muted-foreground">
            +{formatPoints(row.sprint_points)} sprint
          </span>
        ) : null}
      </div>
    ),
  },
]

export function RaceDetailPage() {
  const { raceId } = useParams()
  const id = Number(raceId)
  const valid = Number.isInteger(id) && id > 0

  const race = useApi(() => {
    if (!valid) return Promise.reject(new Error("Corrida inválida"))
    return api.race(id)
  }, [id])

  const results = useApi(() => {
    if (!valid) return Promise.reject(new Error("Corrida inválida"))
    return api.raceResults(id, { page: 1, per_page: 50 })
  }, [id])

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/calendario">
          <ArrowLeft />
          Voltar para o calendário
        </Link>
      </Button>

      {race.loading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-6 w-72" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
        </Card>
      ) : race.error ? (
        <ErrorState message={race.error} onRetry={race.reload} />
      ) : race.data ? (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Temporada {race.data.season}</Badge>
              <Badge variant="outline">Rodada {race.data.round}</Badge>
            </div>
            <CardTitle className="text-2xl">{race.data.name}</CardTitle>
            <CardDescription className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>{formatDate(race.data.date)}</span>
              {race.data.circuit_name ? (
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5" />
                  {race.data.circuit_name}
                  {race.data.circuit_country
                    ? ` · ${race.data.circuit_country}`
                    : ""}
                </span>
              ) : null}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Resultado oficial da corrida, ordenado por posição de chegada.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {results.error ? (
        <ErrorState message={results.error} onRetry={results.reload} />
      ) : (
        <F1DataTable
          title="Resultado"
          columns={resultColumns}
          data={results.data?.data ?? []}
          keyField="id"
          progressPending={results.loading}
          progressSkeleton
        />
      )}
    </div>
  )
}
