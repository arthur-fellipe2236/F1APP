import { BrowserRouter, Link, Route, Routes } from "react-router-dom"
import { Flag } from "lucide-react"

import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { CircuitsPage } from "@/pages/circuits"
import { DashboardPage } from "@/pages/dashboard"
import { DriversPage } from "@/pages/drivers"
import { LiveTimingPage } from "@/pages/live-timing"
import { RaceDetailPage } from "@/pages/race-detail"
import { RacesPage } from "@/pages/races"
import { TeamsPage } from "@/pages/teams"

function NotFoundPage() {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <span className="flex size-12 items-center justify-center rounded-xl bg-foreground text-background">
        <Flag className="size-6" />
      </span>
      <div>
        <h1 className="text-xl font-semibold">Página não encontrada</h1>
        <p className="text-sm text-muted-foreground">
          O endereço acessado não existe.
        </p>
      </div>
      <Button asChild>
        <Link to="/">Voltar para o painel</Link>
      </Button>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="pilotos" element={<DriversPage />} />
          <Route path="equipes" element={<TeamsPage />} />
          <Route path="circuitos" element={<CircuitsPage />} />
          <Route path="calendario" element={<RacesPage />} />
          <Route path="calendario/:raceId" element={<RaceDetailPage />} />
          <Route path="live" element={<LiveTimingPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
