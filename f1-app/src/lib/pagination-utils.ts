export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const

export type PageSizeOption = number | "all"

export interface PageSlice<T> {
  items: T[]
  page: number
  perPage: number
  totalRows: number
  totalPages: number
  startIndex: number
  endIndex: number
}

export function parsePageSizeOption(
  raw: string | number,
  fallback = 20,
): PageSizeOption {
  if (raw === "all") return "all"
  const num = typeof raw === "number" ? raw : Number(raw)
  if (Number.isFinite(num) && num > 0) {
    return Math.trunc(num)
  }
  return fallback
}

export function sortRowsBySelector<T>(
  rows: readonly T[],
  selector?: (row: T, rowIndex?: number) => unknown,
  direction: "asc" | "desc" = "asc",
  customSort?: ((a: T, b: T) => number) | null,
): T[] {
  if (!selector && !customSort) {
    return [...rows]
  }
  const factor = direction === "desc" ? -1 : 1
  const indexed = rows.map((row, index) => ({ row, index }))

  indexed.sort((a, b) => {
    if (customSort) {
      const cmp = customSort(a.row, b.row)
      if (cmp !== 0) return cmp * factor
      return a.index - b.index
    }
    const valA = selector!(a.row, a.index)
    const valB = selector!(b.row, b.index)

    if (valA === valB) return a.index - b.index
    if (valA === null || valA === undefined) return 1
    if (valB === null || valB === undefined) return -1

    if (typeof valA === "number" && typeof valB === "number") {
      const diff = valA - valB
      return diff !== 0 ? diff * factor : a.index - b.index
    }

    const strA = String(valA)
    const strB = String(valB)
    const cmp = strA.localeCompare(strB, "pt-BR", { numeric: true, sensitivity: "base" })
    return cmp !== 0 ? cmp * factor : a.index - b.index
  })

  return indexed.map((entry) => entry.row)
}

/**
 * Fatia uma lista de registros para paginação determinística (desktop/mobile),
 * suportando tamanhos numéricos e `"all"` ("Todos") com clamp seguro de página.
 */
export function paginateRows<T>(
  rows: readonly T[],
  requestedPage: number,
  perPage: PageSizeOption,
): PageSlice<T> {
  const totalRows = rows.length
  const safePerPage =
    perPage === "all"
      ? Math.max(1, totalRows)
      : typeof perPage === "number" && Number.isFinite(perPage) && perPage > 0
        ? Math.trunc(perPage)
        : 20
  const totalPages = Math.max(1, Math.ceil(totalRows / safePerPage))
  const normalizedPage = Number.isFinite(requestedPage) ? Math.trunc(requestedPage) : 1
  const page = Math.min(Math.max(1, normalizedPage || 1), totalPages)
  const start = (page - 1) * safePerPage
  const end = Math.min(start + safePerPage, totalRows)

  return {
    items: rows.slice(start, end),
    page,
    perPage: safePerPage,
    totalRows,
    totalPages,
    startIndex: totalRows === 0 ? 0 : start + 1,
    endIndex: end,
  }
}
