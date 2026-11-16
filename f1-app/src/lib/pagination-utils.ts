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
      : perPage > 0
        ? perPage
        : 20
  const totalPages = Math.max(1, Math.ceil(totalRows / safePerPage))
  const page = Math.min(Math.max(1, Math.trunc(requestedPage) || 1), totalPages)
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
