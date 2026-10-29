import { useMemo } from "react"
import type { TableColumn } from "react-data-table-component"
import { Info } from "lucide-react"

import { F1DataTable } from "./data-table"
import { ErrorState } from "./error-state"
import { TeamInline } from "./team-name"
import { useApi } from "@/hooks/use-api"
import { api, type QualifyingRow } from "@/lib/api"
import {
  bestTime,
  emptyQualifyingMessage,
  qualifyingRowKey,
  qualifyingTitle,
  timeColumns,
} from "@/lib/qualifying"

type Row = QualifyingRow & { rowKey: string }

function driverCell(row: Row, season: number) {
  return (
    <div className="flex flex-col py-2">
      <span className="font-semibold">{row.driver_name ?? "—"}</span>
      <div className="scale-90 origin-left text-muted-foreground mt-0.5">
        <TeamInline name={row.team_name} season={season} />
      </div>
    </div>
  )
}

/**
 * Classificação de uma corrida. Os dados vêm do backend (`/races/:id/qualifying`),
 * que resolve temporada/rodada a partir da corrida e informa o tipo de dado:
 * tempos (`qualifying`), apenas grid de largada (`starting_grid`, quando a fonte
 * não registra tempos — ex.: 1950–1993) ou nenhum dado (`none`).
 */
export function QualyResults({
  raceId,
  season,
}: {
  raceId: number
  season: number
}) {
  const query = useApi(() => api.raceQualifying(raceId), [raceId])
  const info = query.data?.info

  const rows = useMemo<Row[]>(
    () =>
      (query.data?.data ?? []).map((row, index) => ({
        ...row,
        rowKey: qualifyingRowKey(row, index),
      })),
    [query.data],
  )

  const columns = useMemo<TableColumn<Row>[]>(() => {
    const base: TableColumn<Row>[] = [
      {
        name: info?.kind === "starting_grid" ? "Grid" : "Pos",
        selector: (row) => row.position ?? 0,
        format: (row) => row.position ?? "—",
        sortable: true,
        width: "80px",
      },
      {
        name: "Piloto",
        cell: (row) => driverCell(row, season),
        sortable: true,
        sortFunction: (a, b) =>
          (a.driver_name ?? "").localeCompare(b.driver_name ?? ""),
      },
    ]
    if (!info) return base
    return [
      ...base,
      ...timeColumns(info).map<TableColumn<Row>>((col) => ({
        name: col.label,
        selector: (row) => row[col.key] || "—",
        sortable: true,
      })),
    ]
  }, [info, season])

  if (query.error) {
    return <ErrorState message={query.error} onRetry={query.reload} />
  }

  if (!query.loading && rows.length === 0) {
    return (
      <div
        role="status"
        className="flex items-start gap-3 rounded-xl border border-dashed border-border/70 bg-card/60 p-5 text-sm text-muted-foreground"
      >
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        <p className="min-w-0 break-words">{emptyQualifyingMessage(info)}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {info?.kind === "starting_grid" && info.message ? (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200/90"
        >
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p className="min-w-0 break-words">{info.message}</p>
        </div>
      ) : null}
      <F1DataTable
        title={qualifyingTitle(info?.kind ?? "qualifying")}
        columns={columns}
        data={rows}
        keyField="rowKey"
        progressPending={query.loading}
        progressSkeleton
        renderMobileCard={(row) => {
          const best = bestTime(row)
          return (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono text-xl font-black text-muted-foreground/40 tabular-nums w-7 text-center shrink-0">
                  {row.position ?? "—"}º
                </span>
                <div className="min-w-0">
                  <div className="font-bold text-sm leading-tight truncate">
                    {row.driver_name ?? "—"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    <TeamInline name={row.team_name} season={season} />
                  </div>
                </div>
              </div>
              {info?.kind === "qualifying" ? (
                <div className="text-right shrink-0">
                  <div className="font-mono font-bold text-sm text-primary tabular-nums">
                    {best ?? "—"}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono flex gap-1.5 justify-end mt-0.5">
                    {row.q1 && info.columns.length > 1 && <span>Q1: {row.q1}</span>}
                    {row.q2 && info.columns.length > 1 && <span>Q2: {row.q2}</span>}
                  </div>
                </div>
              ) : null}
            </div>
          )
        }}
      />
    </div>
  )
}
