import { api } from "@/lib/api"
import { useApi } from "@/hooks/use-api"

export function useSeasonsState(series?: string): {
  seasons: number[]
  loading: boolean
  isFallback: boolean
} {
  const query = useApi(() => api.seasons(series), [series])
  const hasData = Boolean(query.data && query.data.data.length > 0)
  const currentYear = new Date().getFullYear()
  const seasons = hasData
    ? query.data!.data
    : Array.from({ length: 5 }, (_, index) => currentYear - index)

  return {
    seasons,
    loading: query.loading,
    isFallback: !hasData,
  }
}

export function useSeasons(series?: string): number[] {
  return useSeasonsState(series).seasons
}
