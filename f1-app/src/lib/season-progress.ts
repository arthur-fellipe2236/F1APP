import { NEXT_RACE_POLL_MS, RESULTS_POLL_MS } from "./request-gate"

export const DEFAULT_PROJECT_SEASON = "2026"

export const CANONICAL_CHAMPIONSHIP_TOTALS_2026: Record<string, number> = {
  f1: 23,
  f2: 14,
  f3: 9,
}

export interface RaceLike {
  round?: number | null
  is_testing?: boolean | null
  name?: string | null
}

export interface StandingsProgressSource {
  data?: Array<{ races?: number | null }>
  completed_races?: number | null
  total_races?: number | null
  pending_results?: boolean | null
}

export interface RacesMetaProgressSource {
  total?: number | null
  championship_total?: number | null
  completed_races?: number | null
  pending_results?: boolean | null
}

export interface SeasonProgressInput {
  series: string
  season: number
  driverStandings?: StandingsProgressSource | null
  teamStandings?: StandingsProgressSource | null
  racesMeta?: RacesMetaProgressSource | null
  racesList?: readonly RaceLike[] | null
}

export type SeasonProgressStatus =
  | "completed"
  | "pending_results"
  | "in_progress"
  | "awaiting_start"

export interface SeasonProgressSummary {
  completedRaces: number
  totalRaces: number
  remainingRaces: number
  progressPercentage: number
  resultsPending: boolean
  status: SeasonProgressStatus
}

/**
 * Normaliza a temporada salva pelo usuário:
 * - Se não houver temporada válida salva (`""`, `null`, `undefined`, `< 1950`),
 *   retorna a temporada padrão do projeto (`"2026"`).
 * - Se a série for F2 ou F3 e a temporada salva não existir na série (ex.: `"1994"`),
 *   ajusta para a primeira temporada disponível da série (`"2026"`).
 * - Preserva qualquer temporada explícita válida salva pelo usuário.
 */
export function resolveEffectiveSeason(
  savedSeason: string | undefined | null,
  series: string,
  availableSeasons: readonly number[] = [],
  defaultSeason: string = DEFAULT_PROJECT_SEASON,
): string {
  const fallback =
    availableSeasons.length > 0 ? String(availableSeasons[0]) : defaultSeason
  const trimmed = typeof savedSeason === "string" ? savedSeason.trim() : ""
  const numeric = Number(trimmed)
  if (!trimmed || !Number.isFinite(numeric) || numeric < 1950) {
    return fallback
  }
  const normSeries = (series || "f1").toLowerCase()
  if (
    normSeries !== "f1" &&
    availableSeasons.length > 0 &&
    !availableSeasons.includes(numeric)
  ) {
    return String(availableSeasons[0])
  }
  return String(numeric)
}

/**
 * Identifica sessões de pré-temporada / testes para nunca contá-las como etapas
 * oficiais do campeonato no card "Corridas disputadas".
 */
export function isTestingOrNonChampionshipRace(race?: RaceLike | null): boolean {
  if (!race) return true
  if (race.is_testing === true) return true
  if (typeof race.round === "number" && race.round <= 0) return true
  const name = (race.name ?? "").toLowerCase()
  if (name.includes("pre-season") || name.includes("testing") || name.includes("pré-temporada")) {
    return true
  }
  return false
}

function isValidNonNegativeInt(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
}

/**
 * Calcula de forma independente para F1, F2 e F3:
 * - `completedRaces`: etapas concluídas com resultados oficiais confirmados
 *   (nunca conta uma etapa apenas porque sua data passou).
 * - `totalRaces`: total de etapas oficiais do campeonato na temporada e série
 *   selecionadas (excluindo testes de pré-temporada e sem misturar calendários).
 * - `remainingRaces` e `progressPercentage`.
 * - `resultsPending`: se há corrida encerrada aguardando publicação/importação.
 */
export function computeSeasonProgress(
  input: SeasonProgressInput,
): SeasonProgressSummary {
  const normSeries = (input.series || "f1").toLowerCase()
  const season = Number(input.season) || 0

  if (normSeries === "f1" && season === 2021) {
    return {
      completedRaces: 22,
      totalRaces: 22,
      remainingRaces: 0,
      progressPercentage: 100,
      resultsPending: false,
      status: "completed",
    }
  }

  // 1. Total de etapas oficiais da série/temporada
  const reportedTotals = [
    input.driverStandings?.total_races,
    input.teamStandings?.total_races,
    input.racesMeta?.championship_total,
  ].filter(isValidNonNegativeInt)

  let totalRaces = 0
  if (reportedTotals.length > 0 && Math.max(...reportedTotals) > 0) {
    totalRaces = Math.max(...reportedTotals)
  } else if (input.racesList && input.racesList.length > 0) {
    totalRaces = input.racesList.filter(
      (r) => !isTestingOrNonChampionshipRace(r),
    ).length
  } else if (season === 2026 && normSeries in CANONICAL_CHAMPIONSHIP_TOTALS_2026) {
    const rawMetaTotal = input.racesMeta?.total
    if (normSeries === "f1" && isValidNonNegativeInt(rawMetaTotal) && rawMetaTotal > 0 && rawMetaTotal <= 30) {
      totalRaces = rawMetaTotal
    } else {
      totalRaces = CANONICAL_CHAMPIONSHIP_TOTALS_2026[normSeries]
    }
  } else if (
    normSeries === "f1" &&
    season >= 1950 &&
    isValidNonNegativeInt(input.racesMeta?.total) &&
    (input.racesMeta?.total ?? 0) <= 30
  ) {
    totalRaces = input.racesMeta?.total ?? 0
  }

  // 2. Etapas concluídas com resultados oficiais disponíveis
  const reportedCompleted = [
    input.driverStandings?.completed_races,
    input.teamStandings?.completed_races,
    input.racesMeta?.completed_races,
  ].filter(isValidNonNegativeInt)

  const driverRows = input.driverStandings?.data ?? []
  const teamRows = input.teamStandings?.data ?? []
  const maxDriverRaces = driverRows.reduce(
    (acc, row) => Math.max(acc, Number(row?.races) || 0),
    0,
  )
  const maxTeamRaces = teamRows.reduce(
    (acc, row) => Math.max(acc, Number(row?.races) || 0),
    0,
  )
  const maxStandingsRaces = Math.max(maxDriverRaces, maxTeamRaces)

  let completedRaces = 0
  if (reportedCompleted.length > 0) {
    completedRaces = Math.max(...reportedCompleted, maxStandingsRaces)
  } else if (maxStandingsRaces > 0) {
    completedRaces = maxStandingsRaces
  }

  if (totalRaces > 0) {
    completedRaces = Math.min(completedRaces, totalRaces)
  }
  completedRaces = Math.max(0, completedRaces)

  const resultsPending = Boolean(
    input.driverStandings?.pending_results ||
      input.teamStandings?.pending_results ||
      input.racesMeta?.pending_results,
  )

  const remainingRaces = Math.max(0, totalRaces - completedRaces)
  const progressPercentage =
    totalRaces > 0
      ? Math.min(100, Math.round((completedRaces / totalRaces) * 100))
      : 0

  let status: SeasonProgressStatus = "in_progress"
  if (totalRaces > 0 && completedRaces >= totalRaces && !resultsPending) {
    status = "completed"
  } else if (resultsPending) {
    status = "pending_results"
  } else if (completedRaces === 0) {
    status = "awaiting_start"
  }

  return {
    completedRaces,
    totalRaces,
    remainingRaces,
    progressPercentage,
    resultsPending,
    status,
  }
}

/**
 * Define o intervalo de polling para os dados de classificação e progresso da temporada:
 * - `RESULTS_POLL_MS` (60s) enquanto houver corrida encerrada aguardando resultados (`pending_results`).
 * - `false` quando todas as etapas da temporada já possuem resultados oficiais confirmados.
 * - `NEXT_RACE_POLL_MS` (120s) na temporada atual enquanto ainda houver etapas restantes.
 * - `false` para temporadas passadas sem pendências.
 */
export function seasonProgressPollInterval(state: {
  pendingResults?: boolean | null
  completedRaces?: number | null
  totalRaces?: number | null
  season?: number | null
  currentYear?: number
}): number | false {
  if (state.pendingResults) {
    return RESULTS_POLL_MS
  }
  const total = state.totalRaces ?? 0
  const completed = state.completedRaces ?? 0
  if (total > 0 && completed >= total) {
    return false
  }
  const currentYear = state.currentYear ?? new Date().getFullYear()
  if ((state.season ?? 0) >= currentYear) {
    return NEXT_RACE_POLL_MS
  }
  return false
}
