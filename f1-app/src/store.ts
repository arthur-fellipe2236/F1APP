import { create } from "zustand"
import { persist } from "zustand/middleware"
import { DEFAULT_PROJECT_SEASON } from "./lib/season-progress"

export interface User {
  id: number
  username: string
  favorite_driver_id?: number | null
  favorite_team_id?: number | null
  favorite_driver?: string | null
  favorite_team?: string | null
  is_admin?: boolean
}

interface AppState {
  series: string
  setSeries: (series: string) => void
  season: string
  setSeason: (season: string) => void
  teamTheme: string
  setTeamTheme: (theme: string) => void
  user: User | null
  setUser: (user: User | null) => void
  token: string | null
  setToken: (token: string | null) => void
}

export function normalizePersistedSeason(savedSeason: unknown): string {
  if (typeof savedSeason !== "string") return DEFAULT_PROJECT_SEASON
  const trimmed = savedSeason.trim()
  if (!trimmed) return DEFAULT_PROJECT_SEASON
  if (trimmed === "all") return "all"
  const yr = Number(trimmed)
  if (Number.isFinite(yr) && yr >= 1950 && yr <= 2100) {
    return String(yr)
  }
  return DEFAULT_PROJECT_SEASON
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      series: "f1",
      setSeries: (series) => set({ series }),
      season: DEFAULT_PROJECT_SEASON,
      setSeason: (season) => set({ season }),
      teamTheme: "default",
      setTeamTheme: (teamTheme) => set({ teamTheme }),
      user: null,
      setUser: (user) => set({ user }),
      token: null,
      setToken: (token) => set({ token }),
    }),
    {
      name: "f1-app-storage",
      merge: (persistedState, currentState) => {
        const persisted = (persistedState ?? {}) as Partial<AppState>
        return {
          ...currentState,
          ...persisted,
          season: normalizePersistedSeason(persisted.season),
        }
      },
    }
  )
)
