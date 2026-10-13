import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { RaceResult } from '@/lib/api'

interface RacePaceChartProps {
  season: number
  country: string
  results: RaceResult[]
}

export function RacePaceChart({ season, country, results }: RacePaceChartProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!season || !country || results.length === 0) return

    setLoading(true)
    fetch(`/api/v1/live/sessions?year=${season}`)
      .then(r => r.json())
      .then(res => {
        const meeting = res.data.find((m: any) => m.country === country)
        if (!meeting) throw new Error("Corrida não encontrada na OpenF1")
        const raceSession = meeting.sessions.find((s: any) => s.name === "Race")
        if (!raceSession) throw new Error("Sessão Race não encontrada")
        
        return fetch(`/api/v1/live/practice/${raceSession.key}`)
      })
      .then(res => {
        if (!res.ok) throw new Error('Erro ao buscar voltas')
        return res.json()
      })
      .then(json => {
        const { laps, drivers } = json.data
        
        // Pega os 3 primeiros colocados (ou menos se não tiver 3)
        const top3 = results.slice(0, 3)
        const top3Codes = top3.map(r => r.driver_code)
        
        const top3Numbers = new Set<number>()
        const colorMap: Record<number, string> = {}
        const nameMap: Record<number, string> = {}
        
        drivers.forEach((d: any) => {
          if (top3Codes.includes(d.name_acronym)) {
            top3Numbers.add(d.driver_number)
            colorMap[d.driver_number] = '#' + (d.team_colour || 'FFFFFF')
            nameMap[d.driver_number] = d.name_acronym
          }
        })

        const lapDataMap = new Map<number, any>()

        laps.forEach((lap: any) => {
          if (!top3Numbers.has(lap.driver_number)) return
          if (!lap.lap_duration) return 
          
          const lapNum = lap.lap_number
          if (!lapDataMap.has(lapNum)) {
            lapDataMap.set(lapNum, { lap: lapNum })
          }
          
          const entry = lapDataMap.get(lapNum)
          const driverAcronym = nameMap[lap.driver_number]
          entry[driverAcronym] = lap.lap_duration
        })

        const chartData = Array.from(lapDataMap.values()).sort((a, b) => a.lap - b.lap)
        
        setData({ chartData, top3Codes, colorMap, nameMap })
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [season, country, results])

  if (loading) return <div className="p-8 text-center animate-pulse">Calculando telemetria de ritmo...</div>
  if (!data || !data.chartData || data.chartData.length === 0) return null

  const { chartData, colorMap, nameMap } = data

  return (
    <Card className="mt-6 border-border/50">
      <CardHeader>
        <CardTitle className="text-lg">Ritmo de Corrida (Top 3)</CardTitle>
        <CardDescription>
          Comparativo de tempo de volta ao longo da corrida. Picos altos geralmente indicam voltas de Pit Stop ou Safety Car.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis 
                dataKey="lap" 
                stroke="#888" 
                tick={{ fill: '#888' }} 
                tickFormatter={(val) => `V${val}`}
              />
              <YAxis 
                stroke="#888" 
                tick={{ fill: '#888' }}
                domain={['auto', 'auto']}
                tickFormatter={(val) => {
                  const m = Math.floor(val / 60)
                  const s = Math.floor(val % 60).toString().padStart(2, '0')
                  return `${m}:${s}`
                }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#111', borderColor: '#333', color: '#fff', borderRadius: '8px' }}
                formatter={(value: any, name: any) => {
                  const numVal = Number(value)
                  if (isNaN(numVal)) return [String(value), String(name)]
                  const m = Math.floor(numVal / 60)
                  const s = Math.floor(numVal % 60).toString().padStart(2, '0')
                  const ms = Math.floor((numVal % 1) * 1000).toString().padStart(3, '0')
                  return [`${m}:${s}.${ms}`, String(name)]
                }}
                labelFormatter={(label) => `Volta ${label}`}
              />
              <Legend />
              {(Object.entries(colorMap) as [string, string][]).map(([driverNumber, color]) => {
                const acronym = nameMap[Number(driverNumber)]
                return (
                  <Line 
                    key={acronym}
                    type={"monotone" as any} 
                    dataKey={acronym} 
                    stroke={color} 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                    isAnimationActive={false}
                    connectNulls={true}
                  />
                )
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
