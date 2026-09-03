export interface Meta {
  page: number
  per_page: number
  total: number
  pages: number
}

export interface Paginated<T> {
  data: T[]
  meta: Meta
}

export interface Team {
  id: number
  name: string
  base_country: string | null
  engine_manufacturer: string | null
  founded_year: number | null
}

export interface Driver {
  id: number
  first_name: string
  last_name: string
  name: string
  code: string | null
  permanent_number: number | null
  nationality: string | null
  team_id: number | null
  team_name?: string | null
}

export interface DriverDetail extends Driver {
  team: Team | null
}

export interface RaceWinner {
  name: string
  code: string | null
  nationality: string | null
}

export interface Circuit {
  id: number
  name: string
  city: string | null
  country: string | null
  length_km: number | null
  laps: number | null
  round?: number | null
  winner?: RaceWinner | null
}

export interface Race {
  id: number
  season: number
  round: number
  name: string
  date: string | null
  circuit_id: number | null
  circuit_name: string | null
  circuit_country: string | null
}

export interface RaceResult {
  id: number
  race_id: number
  driver_id: number
  driver_name: string | null
  driver_code: string | null
  driver_nationality: string | null
  team_id: number | null
  team_name: string | null
  position: number | null
  points: number
  sprint_points: number
  grid: number | null
  laps: number | null
  status: string | null
  fastest_lap: boolean
}

export interface DriverStanding {
  position: number
  driver_id: number
  driver_name: string
  driver_code: string | null
  nationality: string | null
  headshot_url?: string | null
  team_name: string | null
  points: number
  wins: number
  podiums: number
  races: number
}

export interface TeamStanding {
  position: number
  team_id: number | null
  team_name: string
  points: number
  wins: number
  podiums: number
  races: number
}

export interface Standings<T> {
  season: number | null
  data: T[]
}

export interface NextRace {
  source: string
  round: number | null
  name: string | null
  country: string | null
  location: string | null
  circuit: string | null
  weekend_start: string
  weekend_end: string
  race_start: string | null
  sessions?: LiveSessionEntry[] | null
}

export interface NewsItem {
  id: string
  title: string
  slug: string
  url: string
  article_type: string
  updated_at: string
  meta_description: string | null
  image: string | null
  matched: boolean
  title_en?: string
  meta_description_en?: string | null
}

export interface NewsArticleSummary {
  title: string | null
  url: string
  sentences: number
  summary: string[]
  summary_en: string[]
}

export interface LiveSession {
  key: number
  name: string | null
  type: string | null
  year: number
  circuit: string | null
  country: string | null
  location: string | null
  meeting_name: string | null
  date_start: string
  date_end: string
  state: "scheduled" | "live" | "finished"
  live: boolean
}

export interface LiveSessionEntry {
  key: number
  name: string | null
  type: string | null
  date_start: string
  date_end: string
  state: "scheduled" | "live" | "finished"
}

export interface LiveMeetingEntry {
  meeting_key: number
  round: number
  meeting_name: string
  circuit: string | null
  country: string | null
  location: string | null
  date_start: string
  date_end: string
  sessions: LiveSessionEntry[]
}

export interface LiveDriverRow {
  driver_number: number
  name: string
  code: string | null
  team: string | null
  team_colour: string | null
  position: number | null
  gap_to_leader: number | string | null
  interval: number | string | null
  lap_number: number | null
  compound: string | null
  stops: number
  last_lap: number | null
}

export interface LiveWeather {
  air_temperature: number | null
  track_temperature: number | null
  wind_speed: number | null
  humidity: number | null
  rainfall: number | null
}

export interface LiveMessage {
  date: string | null
  message: string | null
  flag: string | null
}

export interface LiveTower {
  session: LiveSession
  flag: string | null
  current_lap: number | null
  drivers: LiveDriverRow[]
  weather: LiveWeather
  messages: LiveMessage[]
  updated_at: string
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

const BASE_URL = `${import.meta.env.VITE_API_URL ?? ""}/api/v1`

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`)
  const body = (await res.json().catch(() => null)) as
    | (T & { error?: string })
    | null
  if (!res.ok) {
    throw new ApiError(body?.error ?? `Erro HTTP ${res.status}`, res.status)
  }
  return body as T
}

function qs(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      search.set(key, String(value))
    }
  }
  const query = search.toString()
  return query ? `?${query}` : ""
}

export async function fetchAll<T>(
  fn: (params: { page: number; per_page: number }) => Promise<Paginated<T>>,
): Promise<T[]> {
  const first = await fn({ page: 1, per_page: 50 })
  const all = [...first.data]
  for (let page = 2; page <= first.meta.pages; page += 1) {
    const next = await fn({ page, per_page: 50 })
    all.push(...next.data)
  }
  return all
}

export type ListParams = {
  page?: number
  per_page?: number
}

export const api = {
  health: () => request<{ status: string; service: string }>("/health"),

  seasons: () => request<{ data: number[] }>("/seasons"),

  drivers: (
    params: ListParams & { team_id?: number; season?: number } = {},
  ) => request<Paginated<Driver>>(`/drivers${qs(params)}`),

  teams: (params: ListParams & { season?: number } = {}) =>
    request<Paginated<Team>>(`/teams${qs(params)}`),

  circuits: (params: ListParams & { season?: number } = {}) =>
    request<Paginated<Circuit>>(`/circuits${qs(params)}`),

  races: (params: ListParams & { season?: number } = {}) =>
    request<Paginated<Race>>(`/races${qs(params)}`),

  race: (raceId: number) => request<Race>(`/races/${raceId}`),

  nextRace: () => request<NextRace>("/next-race"),

  latestNews: () =>
    request<{ data: NewsItem[] }>("/news?upcoming=1&limit=3&lang=pt-BR"),

  brazilianNews: (series: "f1" | "f2" | "f3" = "f1", limit = 3) =>
    request<{ data: NewsItem[] }>(
      `/news?br_drivers=1&series=${series}&limit=${limit}&lang=pt-BR`,
    ),

  newsArticle: (url: string) =>
    request<NewsArticleSummary>(
      `/news/article?url=${encodeURIComponent(url)}&lang=pt-BR`,
    ),

  liveTower: (sessionKey?: number | null) =>
    request<LiveTower>(
      `/live/tower${sessionKey ? `?session_key=${sessionKey}` : ""}`,
    ),

  liveSessions: (year?: number) =>
    request<{ year: number; data: LiveMeetingEntry[] }>(
      `/live/sessions${qs({ year })}`,
    ),

  raceResults: (raceId: number, params: ListParams = {}) =>
    request<Paginated<RaceResult>>(`/races/${raceId}/results${qs(params)}`),

  driverStandings: (season?: number) =>
    request<Standings<DriverStanding>>(`/standings/drivers${qs({ season })}`),

  teamStandings: (season?: number) =>
    request<Standings<TeamStanding>>(`/standings/teams${qs({ season })}`),
}
