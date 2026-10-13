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
      />
    </div>
  )
}
