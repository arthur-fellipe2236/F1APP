import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { RaceResult } from '@/lib/api'

interface TrackDominanceChartProps {
  season: number
  country: string
  results: RaceResult[]
}

export function TrackDominanceChart({ season, country, results }: TrackDominanceChartProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!season || !country || results.length === 0) return

    setLoading(true)
    fetch(`/api/v1/live/sessions?year=${season}`)
      .then(r => r.json())
      .then(res => {
        const meeting = res.data.find((m: any) => m.country === country)
        if (!meeting) throw new Error("Corrida não encontrada")
        const raceSession = meeting.sessions.find((s: any) => s.name === "Race")
        if (!raceSession) throw new Error("Sessão Race não encontrada")
        
        return fetch(`/api/v1/live/practice/${raceSession.key}`)
      })
      .then(res => res.json())
      .then(json => {
        const { laps, drivers } = json.data
        
        const colorMap: Record<number, string> = {}
        const nameMap: Record<number, string> = {}
        const driverNumbers: number[] = []
        
        drivers.forEach((d: any) => {
          if (results.some(r => r.driver_code === d.name_acronym)) {
            driverNumbers.push(d.driver_number)
            colorMap[d.driver_number] = '#' + (d.team_colour || 'FFFFFF')
            nameMap[d.driver_number] = d.name_acronym
          }
        })

        const lapsByDriver: Record<number, any[]> = {}
        driverNumbers.forEach(n => lapsByDriver[n] = [])
        let maxLap = 0

        laps.forEach((lap: any) => {
          if (!lapsByDriver[lap.driver_number]) return
          lapsByDriver[lap.driver_number].push(lap)
          if (lap.lap_number > maxLap) maxLap = lap.lap_number
        })

        driverNumbers.forEach(n => {
          lapsByDriver[n].sort((a, b) => a.lap_number - b.lap_number)
        })

        const chartData = []
        let cumulativeTimes: Record<number, number> = {}
        driverNumbers.forEach(n => cumulativeTimes[n] = 0)
        
        const activeDrivers = new Set(driverNumbers)

        for (let lapNum = 1; lapNum <= maxLap; lapNum++) {
          const lapStandings = []
          
          for (const dNum of Array.from(activeDrivers)) {
            const lap = lapsByDriver[dNum].find(l => l.lap_number === lapNum)
            if (!lap || !lap.lap_duration) {
              activeDrivers.delete(dNum)
              continue
            }
            cumulativeTimes[dNum] += lap.lap_duration
            lapStandings.push({ driver: dNum, time: cumulativeTimes[dNum] })
          }
          
          lapStandings.sort((a, b) => a.time - b.time)
          
          const row: any = { lap: lapNum }
          lapStandings.forEach((st, idx) => {
            const acronym = nameMap[st.driver]
            row[acronym] = idx + 1
          })
          
          chartData.push(row)
        }
        
        setData({ chartData, colorMap, nameMap })
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [season, country, results])

  if (loading) return <div className="p-8 text-center animate-pulse">Calculando evolução de posições...</div>
  if (!data || !data.chartData || data.chartData.length === 0) return null

  const { chartData, colorMap, nameMap } = data

  return (
    <Card className="mt-6 border-border/50">
      <CardHeader>
        <CardTitle className="text-lg">Evolução de Posições (Lap Chart)</CardTitle>
        <CardDescription>
          Acompanhe como as posições de todos os pilotos mudaram volta a volta.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[500px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis 
                dataKey="lap" 
                stroke="#888" 
                tick={{ fill: '#888' }} 
                tickFormatter={(val) => `V${val}`}
              />
              <YAxis 
                reversed={true} 
                domain={[1, 20]} 
                stroke="#888" 
                tick={{ fill: '#888' }}
                tickCount={20}
                interval={0}
                tickFormatter={(val) => `${val}º`}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#111', borderColor: '#333', color: '#fff', borderRadius: '8px' }}
                labelFormatter={(label) => `Volta ${label}`}
              />
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
                    activeDot={{ r: 4 }}
                    isAnimationActive={false}
                    connectNulls={false}
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
