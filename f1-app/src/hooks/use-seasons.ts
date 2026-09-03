import { api } from "@/lib/api"
import { useApi } from "@/hooks/use-api"

export function useSeasons(): number[] {
  const query = useApi(() => api.seasons(), [])
  if (query.data && query.data.data.length > 0) {
    return query.data.data
  }
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, index) => currentYear - index)
}
