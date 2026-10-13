import { useState, useEffect } from "react"
import { User, LogOut } from "lucide-react"
import { useAppStore } from "@/store"
import { api } from "@/lib/api"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function UserProfile() {
  const { user, setUser, token, setToken } = useAppStore()
  const [isOpen, setIsOpen] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const [drivers, setDrivers] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])

  useEffect(() => {
    if (user && isOpen) {
      api.drivers({ series: "f1", season: 2024 }).then(res => setDrivers(res.data))
      api.teams({ series: "f1", season: 2024 }).then(res => setTeams(res.data))
    }
  }, [user, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    try {
      if (isLogin) {
        const res = await fetch("/api/v1/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message)
        setToken(data.token)
        setUser(data.user)
        setIsOpen(false)
      } else {
        const res = await fetch("/api/v1/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message)
        setIsLogin(true)
        setError("Conta criada! Faça login.")
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleUpdateFavorites = async (driverId?: number, teamId?: number) => {
    try {
      const res = await fetch("/api/v1/auth/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          favorite_driver_id: driverId,
          favorite_team_id: teamId
        })
      })
      const data = await res.json()
      if (res.ok) setUser(data)
    } catch (err) {
      console.error(err)
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
  }

  if (user) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full bg-primary/20 text-primary hover:bg-primary/30 hover:text-primary">
              <User className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Olá, {user.username}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DialogTrigger asChild>
              <DropdownMenuItem>
                Meus Favoritos
              </DropdownMenuItem>
            </DialogTrigger>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive focus:bg-destructive/10">
              <LogOut className="mr-2 h-4 w-4" /> Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Meus Favoritos</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Piloto Favorito</Label>
              <Select 
                value={user.favorite_driver_id?.toString() || "none"} 
                onValueChange={(val) => handleUpdateFavorites(val === "none" ? undefined : parseInt(val), user.favorite_team_id || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um piloto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {drivers.map(d => (
                    <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Equipe Favorita</Label>
              <Select 
                value={user.favorite_team_id?.toString() || "none"} 
                onValueChange={(val) => handleUpdateFavorites(user.favorite_driver_id || undefined, val === "none" ? undefined : parseInt(val))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma equipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {teams.map(t => (
                    <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Login">
          <User className="h-[1.2rem] w-[1.2rem]" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isLogin ? "Entrar" : "Criar Conta"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="username">Usuário</Label>
            <Input id="username" value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit">{isLogin ? "Entrar" : "Registrar"}</Button>
          <Button type="button" variant="link" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Não tem uma conta? Registre-se" : "Já tem conta? Entre"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
