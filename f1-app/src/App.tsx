import { lazy, Suspense } from "react"
import { BrowserRouter, Link, Outlet, Route, Routes } from "react-router-dom"
import { Flag } from "lucide-react"

import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"

const CircuitsPage = lazy(() =>
  import("@/pages/circuits").then((m) => ({ default: m.CircuitsPage })),
)
const DashboardPage = lazy(() =>
  import("@/pages/dashboard").then((m) => ({ default: m.DashboardPage })),
)
const DriversPage = lazy(() =>
  import("@/pages/drivers").then((m) => ({ default: m.DriversPage })),
)
const LiveTimingPage = lazy(() =>
  import("@/pages/live-timing").then((m) => ({ default: m.LiveTimingPage })),
)
const RaceDetailPage = lazy(() =>
  import("@/pages/race-detail").then((m) => ({ default: m.RaceDetailPage })),
)
const RacesPage = lazy(() =>
  import("@/pages/races").then((m) => ({ default: m.RacesPage })),
)
const TeamsPage = lazy(() =>
  import("@/pages/teams").then((m) => ({ default: m.TeamsPage })),
)
const FantasyPage = lazy(() =>
  import("@/pages/fantasy").then((m) => ({ default: m.FantasyPage })),
)
const AdminPage = lazy(() =>
  import("@/pages/admin").then((m) => ({ default: m.AdminPage })),
)
const ComparePage = lazy(() =>
  import("@/pages/compare").then((m) => ({ default: m.ComparePage })),
)
const NovatosPage = lazy(() =>
  import("@/pages/novatos").then((m) => ({ default: m.NovatosPage })),
)

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

function SuspenseLayout() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
          Carregando…
        </div>
      }
    >
      <Outlet />
    </Suspense>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route element={<SuspenseLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="pilotos" element={<DriversPage />} />
            <Route path="equipes" element={<TeamsPage />} />
            <Route path="circuitos" element={<CircuitsPage />} />
            <Route path="calendario" element={<RacesPage />} />
            <Route path="calendario/:raceId" element={<RaceDetailPage />} />
            <Route path="live" element={<LiveTimingPage />} />
            <Route path="bolao" element={<FantasyPage />} />
            <Route path="comparar" element={<ComparePage />} />
            <Route path="novatos" element={<NovatosPage />} />
            <Route path="admin" element={<AdminPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
