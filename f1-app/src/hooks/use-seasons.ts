import { api } from "@/lib/api"
import { useApi } from "@/hooks/use-api"

export function useSeasons(series?: string): number[] {
  const query = useApi(() => api.seasons(series), [series])
  if (query.data && query.data.data.length > 0) {
    return query.data.data
  }
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, index) => currentYear - index)
}
