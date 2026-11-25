export const ALL_SEASONS_VALUE = "all"
export const ALL_SEASONS_LABEL = "Todas as temporadas"

/**
 * Agrupa anos de temporada por década para exibição no seletor.
 */
export function groupSeasonsByDecade(seasons: readonly number[]): Record<string, number[]> {
  const groups: Record<string, number[]> = {}
  seasons.forEach((year) => {
    const decade = Math.floor(year / 10) * 10
    const label = decade >= 2000 ? `Anos ${decade}` : `Anos ${decade.toString().slice(2)}`
    if (!groups[label]) groups[label] = []
    groups[label].push(year)
  })
  return groups
}

/**
 * Determina se a temporada atual precisa ser redefinida após troca de categoria,
 * evitando reset prematuro enquanto a lista real ainda está carregando.
 */
export function resolveSeasonReset({
  series,
  season,
  seasons,
  loading,
  includeAll = false,
}: {
  series: string
  season: string
  seasons: readonly number[]
  loading: boolean
  includeAll?: boolean
}): string | null {
  if (loading || seasons.length === 0) return null
  if (includeAll && season === ALL_SEASONS_VALUE) return null
  if (series !== "f1" && !seasons.includes(Number(season))) {
    return String(seasons[0])
  }
  return null
}

/**
 * Garante que o valor exibido no SeasonSelector seja sempre consistente
 * com as opções disponíveis e com a habilitação de `includeAll`.
 */
export function resolveSeasonSelectorValue({
  value,
  seasons,
  loading,
  includeAll = false,
}: {
  value: string
  seasons: readonly number[]
  loading: boolean
  includeAll?: boolean
}): string {
  const fallback = seasons[0] !== undefined ? String(seasons[0]) : ""
  if (value === ALL_SEASONS_VALUE) {
    return includeAll ? ALL_SEASONS_VALUE : fallback
  }
  if (!value) {
    return fallback
  }
  if (seasons.includes(Number(value))) {
    return value
  }
  if (!loading && seasons.length > 0) {
    return fallback
  }
  return value
}
