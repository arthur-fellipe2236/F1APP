/**
 * Utilitários puros (sem React) usados por `useApi` para evitar que respostas
 * antigas sobrescrevam dados mais recentes e para não duplicar requisições.
 */

export interface RequestGate {
  /** Inicia uma nova requisição e invalida todas as anteriores. */
  begin(): number
  /** `true` somente para a requisição mais recente ainda não invalidada. */
  isCurrent(token: number): boolean
  /** Invalida requisições em voo (troca de parâmetros ou desmontagem). */
  invalidate(): void
}

export function createRequestGate(): RequestGate {
  let latest = 0
  return {
    begin: () => ++latest,
    isCurrent: (token) => token === latest,
    invalidate: () => {
      latest += 1
    },
  }
}

/** Um ciclo de polling só dispara com a aba visível e sem requisição em voo. */
export function shouldPollNow(state: {
  inFlight: boolean
  visible: boolean
}): boolean {
  return state.visible && !state.inFlight
}

/**
 * Ao voltar para a aba, atualiza apenas se os dados já passaram do intervalo
 * de polling (evita requisição imediata duplicada).
 */
export function isStale(
  updatedAt: number | undefined,
  intervalMs: number,
  now: number,
): boolean {
  return updatedAt === undefined || now - updatedAt >= intervalMs
}

/** Chave estável das dependências de uma consulta. */
export function depsKey(deps: readonly unknown[]): string {
  try {
    return JSON.stringify(deps)
  } catch {
    return deps.map(String).join("|")
  }
}

/**
 * Intervalo de polling para resultados de corrida: só enquanto a fonte ainda
 * não publicou o resultado final (`pending`/`in_progress`).
 */
export const RESULTS_POLL_MS = 60_000

/** Card "próxima etapa": basta reconsultar a cada 2 minutos. */
export const NEXT_RACE_POLL_MS = 120_000

export function resultsPollInterval(state?: string | null): number | false {
  return state === "pending" || state === "in_progress"
    ? RESULTS_POLL_MS
    : false
}

export interface SeasonDataUpdateEvent {
  series?: string
  season?: number
  completedRaces?: number
}

type SeasonDataUpdateListener = (event: SeasonDataUpdateEvent) => void

const _seasonUpdateListeners = new Set<SeasonDataUpdateListener>()

/**
 * Notifica componentes montados (ex.: card "Corridas disputadas" e tabelas)
 * quando novos resultados oficiais acabaram de ser importados ou detectados.
 */
export function notifySeasonDataUpdated(event: SeasonDataUpdateEvent = {}): void {
  for (const listener of Array.from(_seasonUpdateListeners)) {
    try {
      listener(event)
    } catch {
      // Listener errors must never break caller
    }
  }
}

export function onSeasonDataUpdated(
  listener: SeasonDataUpdateListener,
): () => void {
  _seasonUpdateListeners.add(listener)
  return () => {
    _seasonUpdateListeners.delete(listener)
  }
}
