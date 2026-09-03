import { useCallback, useEffect, useRef, useState } from "react"

export interface ApiState<T> {
  data: T | undefined
  loading: boolean
  error: string | undefined
  reload: () => void
}

export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: readonly unknown[],
): ApiState<T> {
  const [data, setData] = useState<T>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [tick, setTick] = useState(0)

  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(undefined)
    fetcherRef
      .current()
      .then((result) => {
        if (active) setData(result)
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Erro inesperado")
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])

  const reload = useCallback(() => setTick((current) => current + 1), [])

  return { data, loading, error, reload }
}
