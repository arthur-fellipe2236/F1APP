import { useCallback, useEffect, useRef, useState } from "react"

import {
  createRequestGate,
  depsKey,
  isStale,
  shouldPollNow,
} from "@/lib/request-gate"

export interface ApiState<T> {
  data: T | undefined
  loading: boolean
  error: string | undefined
  reload: () => void
}

interface Snapshot<T> {
  key: string
  data: T | undefined
  error: string | undefined
  loading: boolean
  updatedAt: number | undefined
}

export type PollingInterval<T> =
  | number
  | false
  | null
  | undefined
  | ((data: T | undefined) => number | false | null | undefined)

/**
 * Consulta de API com:
 * - descarte de respostas antigas (troca de parâmetros ou requisição mais nova);
 * - dados de outra consulta (ex.: outra temporada/categoria) nunca são
 *   exibidos para os parâmetros atuais;
 * - polling opcional (`pollingInterval` em ms, `false` desliga, ou função dos
 *   dados atuais) que só dispara com a aba visível e sem requisição em
 *   andamento, e que mantém os dados anteriores se uma atualização em segundo
 *   plano falhar.
 */
export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: readonly unknown[],
  pollingInterval?: PollingInterval<T>,
): ApiState<T> {
  const key = depsKey(deps)
  const [snapshot, setSnapshot] = useState<Snapshot<T>>({
    key,
    data: undefined,
    error: undefined,
    loading: true,
    updatedAt: undefined,
  })

  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher
  const keyRef = useRef(key)
  keyRef.current = key
  const gateRef = useRef(createRequestGate())
  const inFlightRef = useRef(false)
  const updatedAtRef = useRef<number | undefined>(undefined)

  const run = useCallback((background: boolean) => {
    const gate = gateRef.current
    const token = gate.begin()
    const requestKey = keyRef.current
    inFlightRef.current = true
    if (!background) {
      setSnapshot((prev) => ({
        key: requestKey,
        data: prev.key === requestKey ? prev.data : undefined,
        error: undefined,
        loading: prev.key !== requestKey || prev.data === undefined,
        updatedAt: prev.key === requestKey ? prev.updatedAt : undefined,
      }))
    }
    fetcherRef
      .current()
      .then((result) => {
        if (!gate.isCurrent(token)) return
        updatedAtRef.current = Date.now()
        setSnapshot({
          key: requestKey,
          data: result,
          error: undefined,
          loading: false,
          updatedAt: updatedAtRef.current,
        })
      })
      .catch((err: unknown) => {
        if (!gate.isCurrent(token)) return
        const message = err instanceof Error ? err.message : "Erro inesperado"
        setSnapshot((prev) => ({
          key: requestKey,
          data: prev.key === requestKey ? prev.data : undefined,
          // Falha de atualização em segundo plano não derruba dados já exibidos.
          error:
            background && prev.key === requestKey && prev.data !== undefined
              ? undefined
              : message,
          loading: false,
          updatedAt: prev.updatedAt,
        }))
      })
      .finally(() => {
        if (gate.isCurrent(token)) inFlightRef.current = false
      })
  }, [])

  // Nova consulta sempre que os parâmetros mudam.
  useEffect(() => {
    updatedAtRef.current = undefined
    run(false)
    const gate = gateRef.current
    return () => {
      gate.invalidate()
      inFlightRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const current = snapshot.key === key
  const data = current ? snapshot.data : undefined
  const loading = current ? snapshot.loading : true
  const error = current ? snapshot.error : undefined

  // O intervalo pode depender dos dados (ex.: poll só enquanto o resultado
  // ainda está pendente) e é recalculado a cada resposta.
  const interval =
    typeof pollingInterval === "function"
      ? pollingInterval(data)
      : pollingInterval
  const pollingMs = interval || 0

  useEffect(() => {
    if (!pollingMs) return
    const visible = () =>
      typeof document === "undefined" || document.visibilityState === "visible"
    const timer = setInterval(() => {
      if (shouldPollNow({ inFlight: inFlightRef.current, visible: visible() })) {
        run(true)
      }
    }, pollingMs)
    const onVisible = () => {
      if (
        visible() &&
        shouldPollNow({ inFlight: inFlightRef.current, visible: true }) &&
        isStale(updatedAtRef.current, pollingMs, Date.now())
      ) {
        run(true)
      }
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      clearInterval(timer)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [pollingMs, run])

  const reload = useCallback(() => run(false), [run])

  return { data, loading, error, reload }
}
