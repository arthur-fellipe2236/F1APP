import type { QualifyingResponse, QualifyingRow } from "./api"

export type QualifyingKind = QualifyingResponse["info"]["kind"]

export const QUALIFYING_COLUMN_LABELS: Record<"q1" | "q2" | "q3", string> = {
  q1: "Q1",
  q2: "Q2",
  q3: "Q3",
}

/**
 * Colunas de tempo exibidas. Formatos históricos não têm todas as sessões
 * (ex.: 1994 só tem uma sessão), então só aparecem colunas com algum tempo.
 * Para uma única sessão o rótulo é "Tempo" em vez de "Q1".
 */
export function timeColumns(
  info: QualifyingResponse["info"],
): Array<{ key: "q1" | "q2" | "q3"; label: string }> {
  if (info.kind !== "qualifying") return []
  const single = info.columns.length === 1
  return info.columns.map((key) => ({
    key,
    label: single ? "Tempo" : QUALIFYING_COLUMN_LABELS[key],
  }))
}

/** Melhor tempo da linha para o cartão mobile (nunca inventa valores). */
export function bestTime(row: QualifyingRow): string | null {
  return row.q3 || row.q2 || row.q1 || null
}

export function qualifyingTitle(kind: QualifyingKind): string {
  return kind === "starting_grid" ? "Grid de largada" : "Classificação"
}

/** Mensagem de estado vazio quando não há linhas para exibir. */
export function emptyQualifyingMessage(
  info: QualifyingResponse["info"] | undefined,
): string {
  return (
    info?.message ??
    "A fonte não disponibiliza dados de classificação para esta corrida."
  )
}

/** Chave estável por linha (a posição pode se repetir em grids históricos). */
export function qualifyingRowKey(row: QualifyingRow, index: number): string {
  return `${row.position ?? "x"}-${row.driver_code ?? row.driver_name ?? index}-${index}`
}
