import { useState, useEffect } from "react"
import { Trophy, Clock, Target, Shield, AlertCircle, Users, Key } from "lucide-react"
import { useAppStore } from "@/store"
import { api } from "@/lib/api"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function FantasyPage() {
  const { user, token, series, season } = useAppStore()
  const [races, setRaces] = useState<any[]>([])
  const [drivers, setDrivers] = useState<any[]>([])
  const [selectedRaceId, setSelectedRaceId] = useState<number | null>(null)
  
  const [poleId, setPoleId] = useState<string>("")
  const [winnerId, setWinnerId] = useState<string>("")
  const [fastestId, setFastestId] = useState<string>("")
  
  const [predictions, setPredictions] = useState<any[]>([])
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [myLeagues, setMyLeagues] = useState<any[]>([])
  
  const [activeLeague, setActiveLeague] = useState<string>("global")
  const [newLeagueName, setNewLeagueName] = useState("")
  const [joinLeagueCode, setJoinLeagueCode] = useState("")
  
  const [message, setMessage] = useState<{text: string, type: 'success'|'error'} | null>(null)

  const seasonParam = Number(season) || 2026

  useEffect(() => {
    api.races({ series, season: seasonParam, per_page: 30 }).then(res => {
      const fetchedRaces = res?.data || []
      setRaces(fetchedRaces)
      
      const now = new Date()
      // Encontra a proxima corrida
      const upcoming = fetchedRaces.find((r: any) => new Date(r.date) > now)
      if (upcoming) {
        setSelectedRaceId(upcoming.id)
      } else if (fetchedRaces.length > 0) {
        setSelectedRaceId(fetchedRaces[fetchedRaces.length - 1].id)
      }
    }).catch(err => console.error("Fantasy races error:", err))
    api.drivers({ series, season: seasonParam, per_page: 50 }).then(res => setDrivers(res?.data || [])).catch(err => console.error("Fantasy drivers error:", err))
    
    // Load Leaderboard
    const url = activeLeague === "global" 
      ? `/api/v1/fantasy/leaderboard/${seasonParam}?series=${series}` 
      : `/api/v1/fantasy/leaderboard/${seasonParam}?series=${series}&league_id=${activeLeague}`
      
    fetch(url)
      .then(res => res.json())
      .then(data => setLeaderboard(Array.isArray(data) ? data : []))
      .catch(() => setLeaderboard([]))
  }, [series, seasonParam, activeLeague])

  useEffect(() => {
    if (user && token) {
      fetch(`/api/v1/fantasy/predictions/${seasonParam}?series=${series}`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => setPredictions(Array.isArray(data) ? data : []))
      .catch(() => setPredictions([]))

      // Load my leagues
      fetch(`/api/v1/fantasy/leagues`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => setMyLeagues(Array.isArray(data) ? data : []))
      .catch(() => setMyLeagues([]))
    }
  }, [user, token, series, seasonParam])

  useEffect(() => {
    if (selectedRaceId && predictions.length > 0) {
      const pred = predictions.find(p => p.race_id === selectedRaceId)
      if (pred) {
        setPoleId(pred.pole_driver_id?.toString() || "")
        setWinnerId(pred.winner_driver_id?.toString() || "")
        setFastestId(pred.fastest_lap_driver_id?.toString() || "")
      } else {
        setPoleId("")
        setWinnerId("")
        setFastestId("")
      }
    }
  }, [selectedRaceId, predictions])

  const showMessage = (text: string, type: 'success'|'error') => {
    setMessage({text, type})
    setTimeout(() => setMessage(null), 3000)
  }

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRaceId || !token) return
    
    try {
      const res = await fetch("/api/v1/fantasy/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          race_id: selectedRaceId,
          pole_driver_id: poleId ? parseInt(poleId) : null,
          winner_driver_id: winnerId ? parseInt(winnerId) : null,
          fastest_lap_driver_id: fastestId ? parseInt(fastestId) : null
        })
      })
      if (!res.ok) throw new Error("Erro ao salvar palpite")
      showMessage("Palpite salvo com sucesso!", "success")
      
      const pRes = await fetch(`/api/v1/fantasy/predictions/${seasonParam}?series=${series}`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      setPredictions(await pRes.json())
    } catch(err: any) {
      showMessage(err.message, "error")
    }
  }

  const handleCreateLeague = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    try {
      const res = await fetch("/api/v1/fantasy/leagues", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ name: newLeagueName })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setMyLeagues([...myLeagues, data])
      setNewLeagueName("")
      setActiveLeague(data.id.toString())
      showMessage(`Liga criada! Código de convite: ${data.code}`, "success")
    } catch(err: any) {
      showMessage(err.message, "error")
    }
  }

  const handleJoinLeague = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    try {
      const res = await fetch("/api/v1/fantasy/leagues/join", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ code: joinLeagueCode })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setMyLeagues([...myLeagues, data])
      setJoinLeagueCode("")
      setActiveLeague(data.id.toString())
      showMessage(`Entrou na liga ${data.name}!`, "success")
    } catch(err: any) {
      showMessage(err.message, "error")
    }
  }

    const selectedRace = races.find(r => r.id === selectedRaceId)
  
  let isLocked = false
  let deadlineStr = ""
  if (selectedRace && selectedRace.date) {
    const raceDate = new Date(selectedRace.date)
    // Assume race starts at roughly 15:00 UTC. 48h before is 2 days earlier at 15:00.
    const deadline = new Date(raceDate.getTime() + 15 * 60 * 60 * 1000 - 48 * 60 * 60 * 1000)
    isLocked = new Date() > deadline
    deadlineStr = deadline.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
  }


  return (
    <div className="space-y-6">
      <PageHeader title="Bolão (Fantasy League)" />
      
      {!user ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Login Necessário</AlertTitle>
          <AlertDescription>
            Faça login no ícone de perfil (acima) para participar do bolão e competir com seus amigos!
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-6 md:grid-cols-[1fr_350px]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Seus Palpites</CardTitle>
                <CardDescription>Escolha a corrida e defina seus heróis para o final de semana.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Etapa</label>
                    <Select value={selectedRaceId?.toString() || ""} onValueChange={(val) => setSelectedRaceId(parseInt(val))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma Corrida..." />
                      </SelectTrigger>
                      <SelectContent>
                        {races.map(r => (
                          <SelectItem key={r.id} value={r.id.toString()}>
                            Rodada {r.round} - {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {selectedRaceId && (
                    <form onSubmit={handlePredict} className="space-y-4 p-4 border rounded-xl bg-muted/20">
                      <h3 className="font-semibold text-lg">{selectedRace?.name}</h3>
                      
                      <div className="space-y-4">
                        <div className="grid gap-2">
                          <label className="text-sm font-medium flex items-center gap-2">
                            <Clock className="w-4 h-4 text-primary" /> Pole Position
                          </label>
                          <Select value={poleId} onValueChange={setPoleId} disabled={isLocked}>
                            <SelectTrigger><SelectValue placeholder="Quem larga na frente?" /></SelectTrigger>
                            <SelectContent>
                              {drivers.map(d => <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid gap-2">
                          <label className="text-sm font-medium flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-primary" /> Vencedor da Corrida
                          </label>
                          <Select value={winnerId} onValueChange={setWinnerId} disabled={isLocked}>
                            <SelectTrigger><SelectValue placeholder="Quem vence a corrida?" /></SelectTrigger>
                            <SelectContent>
                              {drivers.map(d => <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid gap-2">
                          <label className="text-sm font-medium flex items-center gap-2">
                            <Target className="w-4 h-4 text-primary" /> Volta Mais Rápida
                          </label>
                          <Select value={fastestId} onValueChange={setFastestId} disabled={isLocked}>
                            <SelectTrigger><SelectValue placeholder="Quem crava a volta mais rápida?" /></SelectTrigger>
                            <SelectContent>
                              {drivers.map(d => <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {message && (
                        <div className={`p-3 rounded text-sm ${message.type === 'success' ? 'bg-green-500/10 text-green-600' : 'bg-destructive/10 text-destructive'}`}>
                          {message.text}
                        </div>
                      )}

                      {isLocked && (
                        <div className="p-3 rounded text-sm bg-amber-500/10 text-amber-600 border border-amber-500/20">
                          <p className="font-bold">⚠️ Palpites Encerrados</p>
                          <p>O prazo limite para esta corrida terminou em {deadlineStr}.</p>
                        </div>
                      )}
                      
                      {!isLocked && deadlineStr && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Prazo limite: {deadlineStr}
                        </div>
                      )}
                      
                      <Button type="submit" className="w-full" disabled={isLocked}>
                        {isLocked ? "Palpites Bloqueados" : "Salvar Palpites"}
                      </Button>
                    </form>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-primary" /> Classificação</CardTitle>
                <CardDescription>Compare sua pontuação</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeLeague} onValueChange={setActiveLeague}>
                  <TabsList className="w-full mb-4">
                    <TabsTrigger value="global" className="flex-1">Global</TabsTrigger>
                    {myLeagues.map(l => (
                      <TabsTrigger key={l.id} value={l.id.toString()} className="flex-1 max-w-[100px] truncate" title={l.name}>
                        {l.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  <TabsContent value={activeLeague} className="mt-0">
                    {activeLeague !== "global" && (
                      <div className="mb-4 p-3 bg-muted rounded-lg text-sm flex items-center justify-between">
                        <span className="font-medium text-muted-foreground">Código de Convite:</span>
                        <Badge variant="outline" className="font-mono text-primary bg-background">{myLeagues?.find(l => l.id?.toString() === activeLeague)?.code}</Badge>
                      </div>
                    )}
                    
                    {!Array.isArray(leaderboard) || leaderboard.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Nenhum ponto registrado ainda.</p>
                    ) : (
                      <ul className="space-y-2">
                        {leaderboard.map((u, i) => (
                          <li key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border">
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-muted-foreground w-4 text-center">{i + 1}</span>
                              <span className="font-medium text-sm">{u.username} {user?.username === u.username && <Badge variant="default" className="ml-1 text-[9px] py-0 h-4">VOCÊ</Badge>}</span>
                            </div>
                            <span className="font-bold text-primary text-sm">{u.points} pts</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </TabsContent>
                </Tabs>
                
                <div className="mt-8 space-y-4 border-t pt-4">
                  <h4 className="text-sm font-semibold flex items-center gap-2"><Users className="w-4 h-4" /> Ligas Privadas</h4>
                  
                  <form onSubmit={handleCreateLeague} className="flex gap-2">
                    <Input placeholder="Nome da nova liga..." value={newLeagueName} onChange={e => setNewLeagueName(e.target.value)} required className="h-8 text-sm" />
                    <Button type="submit" size="sm" variant="secondary">Criar</Button>
                  </form>
                  
                  <form onSubmit={handleJoinLeague} className="flex gap-2">
                    <Input placeholder="Código de convite..." value={joinLeagueCode} onChange={e => setJoinLeagueCode(e.target.value)} required className="h-8 text-sm font-mono uppercase" maxLength={6} />
                    <Button type="submit" size="sm" variant="secondary"><Key className="w-3 h-3 mr-1"/> Entrar</Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
