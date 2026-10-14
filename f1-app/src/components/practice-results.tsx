import { useState, useEffect, useMemo } from "react"
import type { TableColumn } from "react-data-table-component"
import { F1DataTable } from "./data-table"
import { ErrorState } from "./error-state"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

import { TeamInline } from "./team-name"

interface Session {
  session_key: number
  session_name: string
  date_start: string
}

interface PracticeRow {
  driver_number: number
  driver_name: string
  team_name: string
  time: number
  gap: string
  position: number
}

function formatLapTime(seconds: number | null) {
  if (!seconds) return "—"
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 1000)
  if (m > 0) {
    return `${m}:${s.toString().padStart(2, "0")}.${ms.toString().padStart(3, "0")}`
  }
  return `${s}.${ms.toString().padStart(3, "0")}`
}

const getColumns = (season: number): TableColumn<PracticeRow>[] => [
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
          {row.driver_name} <span className="text-muted-foreground ml-1">#{row.driver_number}</span>
        </span>
        <div className="scale-90 origin-left text-muted-foreground mt-0.5">
          <TeamInline name={row.team_name} season={season} />
        </div>
      </div>
    ),
    sortable: true,
    sortFunction: (a, b) => a.driver_name.localeCompare(b.driver_name),
  },
  {
    name: "Tempo",
    selector: (row) => row.time,
    sortable: true,
    cell: (row) => <span className="font-mono text-sm">{formatLapTime(row.time)}</span>,
  },
  {
    name: "Diferença",
    selector: (row) => row.gap,
    cell: (row) => <span className="font-mono text-sm text-muted-foreground">{row.gap}</span>,
  },
]

export function PracticeResults({ season, countryName }: { season: number; countryName: string | null }) {
  const columns = useMemo(() => getColumns(season), [season])
  const [sessions, setSessions] = useState<Session[]>([])
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [selectedSessionKey, setSelectedSessionKey] = useState<number | null>(null)
  
  const [data, setData] = useState<PracticeRow[]>([])
  const [loadingLaps, setLoadingLaps] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!countryName || season < 2023) {
      setLoadingSessions(false)
      return
    }

    setLoadingSessions(true)
    fetch(`https://api.openf1.org/v1/sessions?year=${season}&country_name=${encodeURIComponent(countryName)}`)
      .then((res) => res.json())
      .then((json) => {
        const practiceSessions = json.filter((s: any) => s.session_type === "Practice")
        practiceSessions.sort((a: any, b: any) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime())
        setSessions(practiceSessions)
        if (practiceSessions.length > 0) {
          setSelectedSessionKey(practiceSessions[0].session_key)
        }
      })
      .catch(() => setError("Erro ao carregar sessões de treino."))
      .finally(() => setLoadingSessions(false))
  }, [season, countryName])

  useEffect(() => {
    if (!selectedSessionKey) return

    setLoadingLaps(true)
    fetch(`/api/v1/live/practice/${selectedSessionKey}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Proxy API HTTP ${res.status}`)
        const json = await res.json()
        return [json.data.laps, json.data.drivers]
      })
      .then(([laps, drivers]) => {
        if (!Array.isArray(laps)) throw new Error("Laps payload is not an array")
        if (!Array.isArray(drivers)) throw new Error("Drivers payload is not an array")
        const driverMap = new Map<number, any>()
        for (const d of drivers) {
          driverMap.set(d.driver_number, d)
        }

        const driverFastestLaps = new Map<number, number>()
        for (const lap of laps) {
          if (lap.lap_duration && (!driverFastestLaps.has(lap.driver_number) || lap.lap_duration < driverFastestLaps.get(lap.driver_number)!)) {
            driverFastestLaps.set(lap.driver_number, lap.lap_duration)
          }
        }

        const sorted = Array.from(driverFastestLaps.entries())
          .map(([driver_number, time]) => ({ driver_number, time }))
          .sort((a, b) => a.time - b.time)

        const bestTime = sorted.length > 0 ? sorted[0].time : 0

        const finalData: PracticeRow[] = sorted.map((row, idx) => {
          const driver = driverMap.get(row.driver_number)
          return {
            position: idx + 1,
            driver_number: row.driver_number,
            driver_name: driver ? driver.full_name : `Piloto ${row.driver_number}`,
            team_name: driver ? driver.team_name : "Desconhecido",
            time: row.time,
            gap: idx === 0 ? "-" : `+${(row.time - bestTime).toFixed(3)}s`
          }
        })

        setData(finalData)
      })
      .catch((err) => {
        console.error("Error fetching laps/drivers:", err)
        setError("Erro ao calcular tempos de volta: " + String(err))
      })
      .finally(() => setLoadingLaps(false))
  }, [selectedSessionKey])

  if (season < 2023) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-muted-foreground">
          Telemetria indisponível para temporadas antes de 2023.
        </CardContent>
      </Card>
    )
  }

  if (loadingSessions) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Skeleton className="h-4 w-48 mx-auto" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />
  }

  if (!sessions || sessions.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-muted-foreground">
          Treinos livres não encontrados para esta corrida.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Resultados dos Treinos</h3>
        <Select
          value={selectedSessionKey?.toString()}
          onValueChange={(val) => setSelectedSessionKey(Number(val))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Selecione o treino" />
          </SelectTrigger>
          <SelectContent>
            {sessions.map((s) => (
              <SelectItem key={s.session_key} value={s.session_key.toString()}>
                {s.session_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <F1DataTable
        title="Melhores Voltas"
        columns={columns}
        data={data}
        keyField="driver_number"
        progressPending={loadingLaps}
        progressSkeleton
        renderMobileCard={(row) => (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <span className="font-mono text-xl font-black text-muted-foreground/40 tabular-nums w-7 text-center shrink-0">
                {row.position}º
              </span>
              <div className="min-w-0">
                <div className="font-bold text-sm leading-tight truncate">
                  {row.driver_name} <span className="text-xs text-muted-foreground font-normal">#{row.driver_number}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  <TeamInline name={row.team_name} season={season} />
                </div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="font-mono font-bold text-sm text-primary tabular-nums">
                {formatLapTime(row.time)}
              </div>
              <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                {row.gap || "+0.000s"}
              </div>
            </div>
          </div>
        )}
      />
    </div>
  )
}
