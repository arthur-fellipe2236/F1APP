import { create } from "zustand"
import { persist } from "zustand/middleware"

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

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      series: "f1",
      setSeries: (series) => set({ series }),
      season: "",
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
    }
  )
)
