import { useState, useEffect } from "react"
import { useAppStore } from "@/store"
import { api } from "@/lib/api"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Save } from "lucide-react"

export function AdminPage() {
  const { user, token } = useAppStore()
  const [series, setAdminSeries] = useState("f2")
  const [season] = useState(2026)
  const [races, setRaces] = useState<any[]>([])
  const [drivers, setDrivers] = useState<any[]>([])
  
  const [selectedRaceId, setSelectedRaceId] = useState<number | null>(null)
  
  // Array of 10 rows for points
  const [results, setResults] = useState<any[]>(Array.from({length: 10}).map((_, i) => ({
    position: i + 1,
    driver_id: "",
    points: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1][i] || 0,
    fastest_lap: false
  })))

  const [message, setMessage] = useState<{text: string, type: 'success'|'error'} | null>(null)

  useEffect(() => {
    api.races({ series, season, per_page: 30 }).then(res => setRaces(res.data))
    api.drivers({ series, season, per_page: 50 }).then(res => setDrivers(res.data))
    setSelectedRaceId(null)
  }, [series, season])

  if (!user?.is_admin) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Acesso Negado</AlertTitle>
        <AlertDescription>Você não tem permissões de administrador para visualizar esta página.</AlertDescription>
      </Alert>
    )
  }

  const showMessage = (text: string, type: 'success'|'error') => {
    setMessage({text, type})
    setTimeout(() => setMessage(null), 3000)
  }

  const handleUpdateResult = (index: number, field: string, value: any) => {
    const newResults = [...results]
    newResults[index] = { ...newResults[index], [field]: value }
    setResults(newResults)
  }

  const handleSubmit = async () => {
    if (!selectedRaceId || !token) return
    
    const validResults = results.filter(r => r.driver_id !== "").map(r => ({
      ...r,
      driver_id: parseInt(r.driver_id),
      points: parseFloat(r.points)
    }))

    try {
      const res = await fetch("/api/v1/admin/results", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          race_id: selectedRaceId,
          results: validResults
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      showMessage("Resultados injetados com sucesso!", "success")
    } catch(err: any) {
      showMessage(err.message, "error")
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Painel Admin - Inserção Manual" />
      
      <Card>
        <CardHeader>
          <CardTitle>Resultados das Séries de Base (F2 / F3)</CardTitle>
          <CardDescription>Sobrescreva ou adicione manualmente os resultados caso o scraper falhe.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">Série</label>
              <Select value={series} onValueChange={setAdminSeries}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="f2">Fórmula 2</SelectItem>
                  <SelectItem value="f3">Fórmula 3</SelectItem>
                  <SelectItem value="f1">Fórmula 1</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">Corrida</label>
              <Select value={selectedRaceId?.toString() || ""} onValueChange={(val) => setSelectedRaceId(parseInt(val))}>
                <SelectTrigger><SelectValue placeholder="Selecione a corrida" /></SelectTrigger>
                <SelectContent>
                  {races.map(r => (
                    <SelectItem key={r.id} value={r.id.toString()}>Round {r.round} - {r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedRaceId && (
            <div className="space-y-4 pt-4 border-t border-border/50">
              <h3 className="font-semibold">Top 10 - Pontuadores</h3>
              
              <div className="hidden md:grid grid-cols-[80px_1fr_100px_100px] gap-4 text-sm font-medium text-muted-foreground pb-2 border-b">
                <div>Posição</div>
                <div>Piloto</div>
                <div>Pontos</div>
                <div>Volta Rápida</div>
              </div>

              {results.map((row, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-[80px_1fr_100px_100px] gap-4 items-center bg-muted/20 p-2 rounded">
                  <div className="font-bold text-lg hidden md:block">{row.position}º</div>
                  
                  <div>
                    <label className="md:hidden text-xs mb-1 block">Piloto {row.position}º</label>
                    <Select value={row.driver_id} onValueChange={(val) => handleUpdateResult(i, 'driver_id', val)}>
                      <SelectTrigger><SelectValue placeholder="Selecionar Piloto" /></SelectTrigger>
                      <SelectContent>
                        {drivers.map(d => <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="md:hidden text-xs mb-1 block">Pontos</label>
                    <Input type="number" value={row.points} onChange={(e) => handleUpdateResult(i, 'points', e.target.value)} />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={row.fastest_lap} 
                      onChange={(e) => handleUpdateResult(i, 'fastest_lap', e.target.checked)} 
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <label className="md:hidden text-xs">Volta Rápida?</label>
                  </div>
                </div>
              ))}

              {message && (
                <div className={`p-3 rounded text-sm ${message.type === 'success' ? 'bg-green-500/10 text-green-600' : 'bg-destructive/10 text-destructive'}`}>
                  {message.text}
                </div>
              )}

              <Button onClick={handleSubmit} className="w-full md:w-auto"><Save className="w-4 h-4 mr-2" /> Salvar Resultados no Banco</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
