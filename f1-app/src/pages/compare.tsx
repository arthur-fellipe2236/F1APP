import { useState, useEffect } from "react"
import { useAppStore } from "@/store"
import { api } from "@/lib/api"
import { PageHeader } from "@/components/page-header"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts"

export function ComparePage() {
  const { series, season } = useAppStore()
  const [drivers, setDrivers] = useState<any[]>([])
  const [driverA, setDriverA] = useState<string>("")
  const [driverB, setDriverB] = useState<string>("")
  const [statsA, setStatsA] = useState<any>(null)
  const [statsB, setStatsB] = useState<any>(null)

  useEffect(() => {
    api.drivers({ series, season: Number(season) || 2024, per_page: 50 })
      .then(res => setDrivers(res?.data || []))
      .catch(err => console.error("Compare drivers error:", err))
  }, [series, season])

  useEffect(() => {
    if (driverA) {
      fetch(`/api/v1/drivers/${driverA}/stats`)
        .then(res => res.json())
        .then(data => { if (data?.driver) setStatsA(data) })
        .catch(err => console.error("Error fetching statsA:", err))
    }
  }, [driverA])

  useEffect(() => {
    if (driverB) {
      fetch(`/api/v1/drivers/${driverB}/stats`)
        .then(res => res.json())
        .then(data => { if (data?.driver) setStatsB(data) })
        .catch(err => console.error("Error fetching statsB:", err))
    }
  }, [driverB])

  const chartData = (statsA?.driver?.name && statsB?.driver?.name) ? [
    {
      name: "Corridas",
      [statsA.driver.name]: statsA.total_races,
      [statsB.driver.name]: statsB.total_races
    },
    {
      name: "Vitórias",
      [statsA.driver.name]: statsA.total_wins,
      [statsB.driver.name]: statsB.total_wins
    },
    {
      name: "Pódios",
      [statsA.driver.name]: statsA.total_podiums,
      [statsB.driver.name]: statsB.total_podiums
    },
    {
      name: "Poles",
      [statsA.driver.name]: statsA.total_poles,
      [statsB.driver.name]: statsB.total_poles
    }
  ] : []

  return (
    <div className="space-y-6">
      <PageHeader title="Comparador de Pilotos" />
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Piloto 1</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={driverA} onValueChange={setDriverA}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o primeiro piloto" />
              </SelectTrigger>
              <SelectContent>
                {drivers.map(d => (
                  <SelectItem key={`a-${d.id}`} value={d.id.toString()}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {statsA && (
              <div className="mt-6 flex flex-col items-center text-center">
                <img 
                  src={statsA.driver.headshot_url || "/multi-series-logo.png"} 
                  alt={statsA.driver.name}
                  className="w-32 h-32 object-cover rounded-full border-4 border-primary/20 shadow-md mb-4"
                  onError={(e) => { e.currentTarget.src = "/multi-series-logo.png" }}
                />
                <h3 className="text-xl font-bold">{statsA.driver.name}</h3>
                <p className="text-muted-foreground">{statsA.driver.nationality}</p>
                
                <div className="grid grid-cols-2 gap-4 w-full mt-6">
                  <div className="bg-muted p-3 rounded-lg"><span className="text-2xl font-black">{statsA.total_wins}</span><br/><span className="text-xs uppercase">Vitórias</span></div>
                  <div className="bg-muted p-3 rounded-lg"><span className="text-2xl font-black">{statsA.total_podiums}</span><br/><span className="text-xs uppercase">Pódios</span></div>
                  <div className="bg-muted p-3 rounded-lg"><span className="text-2xl font-black">{statsA.total_poles}</span><br/><span className="text-xs uppercase">Poles</span></div>
                  <div className="bg-muted p-3 rounded-lg"><span className="text-2xl font-black">{statsA.total_races}</span><br/><span className="text-xs uppercase">Corridas</span></div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Piloto 2</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={driverB} onValueChange={setDriverB}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o segundo piloto" />
              </SelectTrigger>
              <SelectContent>
                {drivers.map(d => (
                  <SelectItem key={`b-${d.id}`} value={d.id.toString()}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {statsB && (
              <div className="mt-6 flex flex-col items-center text-center">
                <img 
                  src={statsB.driver.headshot_url || "/multi-series-logo.png"} 
                  alt={statsB.driver.name}
                  className="w-32 h-32 object-cover rounded-full border-4 border-primary/20 shadow-md mb-4"
                  onError={(e) => { e.currentTarget.src = "/multi-series-logo.png" }}
                />
                <h3 className="text-xl font-bold">{statsB.driver.name}</h3>
                <p className="text-muted-foreground">{statsB.driver.nationality}</p>
                
                <div className="grid grid-cols-2 gap-4 w-full mt-6">
                  <div className="bg-muted p-3 rounded-lg"><span className="text-2xl font-black">{statsB.total_wins}</span><br/><span className="text-xs uppercase">Vitórias</span></div>
                  <div className="bg-muted p-3 rounded-lg"><span className="text-2xl font-black">{statsB.total_podiums}</span><br/><span className="text-xs uppercase">Pódios</span></div>
                  <div className="bg-muted p-3 rounded-lg"><span className="text-2xl font-black">{statsB.total_poles}</span><br/><span className="text-xs uppercase">Poles</span></div>
                  <div className="bg-muted p-3 rounded-lg"><span className="text-2xl font-black">{statsB.total_races}</span><br/><span className="text-xs uppercase">Corridas</span></div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {statsA && statsB && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Comparação Direta (Toda a Carreira)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96 w-full hidden md:block">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px'}} />
                  <Legend />
                  <Bar dataKey={statsA.driver.name} fill="var(--primary)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey={statsB.driver.name} fill="#8884d8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="h-[500px] w-full md:hidden">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={65} tick={{ fontSize: 12 }} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px'}} />
                  <Legend verticalAlign="top" />
                  <Bar dataKey={statsA.driver.name} fill="var(--primary)" radius={[0, 4, 4, 0]} />
                  <Bar dataKey={statsB.driver.name} fill="#8884d8" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-8 grid gap-4 md:grid-cols-2">
               <div className="flex flex-col items-center bg-muted/50 p-4 rounded-xl">
                 <span className="text-sm text-muted-foreground mb-1">Pontos na Carreira</span>
                 <div className="flex w-full justify-between items-center mt-2">
                   <div className="text-center w-1/2 border-r">
                     <span className="font-bold text-2xl">{statsA.total_points}</span>
                     <p className="text-xs text-muted-foreground">{statsA.driver.name}</p>
                   </div>
                   <div className="text-center w-1/2">
                     <span className="font-bold text-2xl">{statsB.total_points}</span>
                     <p className="text-xs text-muted-foreground">{statsB.driver.name}</p>
                   </div>
                 </div>
               </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
