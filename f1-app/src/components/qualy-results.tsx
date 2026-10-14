import { useState, useEffect, useMemo } from "react"
import type { TableColumn } from "react-data-table-component"
import { F1DataTable } from "./data-table"
import { ErrorState } from "./error-state"
import { TeamInline } from "./team-name"

interface QualyRow {
  position: string
  Driver: {
    givenName: string
    familyName: string
  }
  Constructor: {
    name: string
  }
  Q1: string
  Q2: string
  Q3: string
}

const getColumns = (season: number): TableColumn<QualyRow>[] => [
  {
    name: "Pos",
    selector: (row) => row.position,
    sortable: true,
    width: "80px",
  },
  {
    name: "Piloto",
    cell: (row) => (
      <div className="flex flex-col py-2">
        <span className="font-semibold">
          {row.Driver.givenName} {row.Driver.familyName}
        </span>
        <div className="scale-90 origin-left text-muted-foreground mt-0.5">
          <TeamInline name={row.Constructor.name} season={season} />
        </div>
      </div>
    ),
    sortable: true,
    sortFunction: (a, b) => a.Driver.familyName.localeCompare(b.Driver.familyName),
  },
  {
    name: "Q1",
    selector: (row) => row.Q1 || "—",
    sortable: true,
  },
  {
    name: "Q2",
    selector: (row) => row.Q2 || "—",
    sortable: true,
  },
  {
    name: "Q3",
    selector: (row) => row.Q3 || "—",
    sortable: true,
  },
]

export function QualyResults({ season, round }: { season: number; round: number }) {
  const columns = useMemo(() => getColumns(season), [season])
  const [data, setData] = useState<QualyRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = () => {
    setLoading(true)
    setError(null)
    fetch(`https://api.jolpi.ca/ergast/f1/${season}/${round}/qualifying.json`)
      .then((res) => {
        if (!res.ok) throw new Error("Falha ao carregar classificação")
        return res.json()
      })
      .then((json) => {
        const results = json.MRData.RaceTable.Races[0]?.QualifyingResults || []
        setData(results)
      })
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    loadData()
  }, [season, round])

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />
  }

  return (
    <div className="space-y-4">
      <F1DataTable
        title="Classificação"
        columns={columns}
        data={data}
        keyField="position"
        progressPending={loading}
        progressSkeleton
        renderMobileCard={(row) => {
          const bestTime = row.Q3 || row.Q2 || row.Q1 || "—"
          return (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono text-xl font-black text-muted-foreground/40 tabular-nums w-7 text-center shrink-0">
                  {row.position}º
                </span>
                <div className="min-w-0">
                  <div className="font-bold text-sm leading-tight truncate">
                    {row.Driver.givenName} {row.Driver.familyName}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    <TeamInline name={row.Constructor.name} season={season} />
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-mono font-bold text-sm text-primary tabular-nums">
                  {bestTime}
                </div>
                <div className="text-[10px] text-muted-foreground font-mono flex gap-1.5 justify-end mt-0.5">
                  {row.Q1 && <span>Q1: {row.Q1}</span>}
                  {row.Q2 && <span>Q2: {row.Q2}</span>}
                </div>
              </div>
            </div>
          )
        }}
      />
    </div>
  )
}
