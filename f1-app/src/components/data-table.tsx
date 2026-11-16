import * as React from "react"
import DataTable, {
  createTheme,
  type TableProps,
} from "react-data-table-component"
import { ptBR } from "react-data-table-component/locales"
import { useTheme } from "next-themes"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DEFAULT_PAGE_SIZE_OPTIONS,
  paginateRows,
  type PageSizeOption,
} from "@/lib/pagination-utils"
import { cn } from "@/lib/utils"

createTheme(
  "f1-dark",
  {
    text: {
      primary: "#f4f4f5",
      secondary: "#a1a1aa",
      disabled: "#71717a",
    },
    background: {
      default: "transparent",
    },
    context: {
      background: "#dc2626",
      text: "#ffffff",
    },
    divider: {
      default: "rgba(255, 255, 255, 0.08)",
    },
  },
  "dark",
)

createTheme(
  "f1-light",
  {
    text: {
      primary: "#09090b",
      secondary: "#71717a",
      disabled: "#a1a1aa",
    },
    background: {
      default: "#ffffff",
    },
    context: {
      background: "#e11d48",
      text: "#ffffff",
    },
    divider: {
      default: "#e4e4e7",
    },
  },
  "light",
)

export const paginationComponentOptions = {
  rowsPerPageText: "Linhas por página:",
  rangeSeparatorText: "de",
  selectAllRowsItem: true,
  selectAllRowsItemText: "Todos",
}

export function TableSkeleton() {
  return (
    <div className="w-full flex flex-col gap-2 p-4">
      {[...Array(10)].map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  )
}

export interface F1DataTableProps<T> extends TableProps<T> {
  renderMobileCard?: (row: T) => React.ReactNode
  progressSkeleton?: boolean
}

function TablePaginationBar({
  testId,
  perPage,
  options,
  page,
  totalPages,
  startIndex,
  endIndex,
  totalRows,
  onPerPageChange,
  onPageChange,
}: {
  testId: string
  perPage: PageSizeOption
  options: readonly number[]
  page: number
  totalPages: number
  startIndex: number
  endIndex: number
  totalRows: number
  onPerPageChange: (next: PageSizeOption) => void
  onPageChange: (nextPage: number) => void
}) {
  return (
    <div
      data-testid={testId}
      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 bg-card/90 px-3 py-2.5 text-xs text-muted-foreground"
    >
      <label className="flex items-center gap-1.5">
        <span>Linhas por página:</span>
        <select
          aria-label="Linhas por página"
          value={String(perPage)}
          onChange={(e) => {
            const val = e.target.value
            onPerPageChange(val === "all" ? "all" : Number(val))
          }}
          className="h-9 rounded-md border border-border/70 bg-background px-2 text-xs font-medium text-foreground dark:[color-scheme:dark]"
        >
          {options.map((opt) => (
            <option key={opt} value={String(opt)}>
              {opt}
            </option>
          ))}
          <option value="all">Todos</option>
        </select>
      </label>
      <div className="flex items-center gap-1.5 ml-auto">
        <span className="font-mono tabular-nums text-foreground/90 mr-1" data-testid={`${testId}-range`}>
          {startIndex}–{endIndex} de {totalRows}
        </span>
        <button
          type="button"
          aria-label="Primeira página"
          disabled={page <= 1}
          onClick={() => onPageChange(1)}
          className="inline-flex size-9 items-center justify-center rounded-md border border-border/70 bg-background text-foreground disabled:opacity-40 hover:bg-accent"
        >
          <ChevronsLeft className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          aria-label="Página anterior"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          className="inline-flex size-9 items-center justify-center rounded-md border border-border/70 bg-background text-foreground disabled:opacity-40 hover:bg-accent"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          aria-label="Próxima página"
          disabled={page >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          className="inline-flex size-9 items-center justify-center rounded-md border border-border/70 bg-background text-foreground disabled:opacity-40 hover:bg-accent"
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          aria-label="Última página"
          disabled={page >= totalPages}
          onClick={() => onPageChange(totalPages)}
          className="inline-flex size-9 items-center justify-center rounded-md border border-border/70 bg-background text-foreground disabled:opacity-40 hover:bg-accent"
        >
          <ChevronsRight className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  )
}

export function F1DataTable<T>(props: F1DataTableProps<T>) {
  const {
    renderMobileCard,
    data,
    pagination,
    paginationPerPage = 20,
    paginationRowsPerPageOptions = [...DEFAULT_PAGE_SIZE_OPTIONS],
    paginationResetDefaultPage,
    progressPending,
    progressSkeleton,
    ...tableProps
  } = props
  const { resolvedTheme } = useTheme()
  const activeTableTheme = resolvedTheme === "light" ? "f1-light" : "f1-dark"

  const [currentPage, setCurrentPage] = React.useState(1)
  const [perPage, setPerPage] = React.useState<PageSizeOption>(paginationPerPage)

  React.useEffect(() => {
    setPerPage(paginationPerPage)
  }, [paginationPerPage])

  React.useEffect(() => {
    setCurrentPage(1)
  }, [paginationResetDefaultPage])

  const pageSlice = React.useMemo(() => {
    const rows = data ?? []
    if (!pagination) {
      return {
        items: rows,
        page: 1,
        perPage: rows.length || (perPage === "all" ? rows.length : perPage),
        totalRows: rows.length,
        totalPages: 1,
        startIndex: rows.length === 0 ? 0 : 1,
        endIndex: rows.length,
      }
    }
    return paginateRows(rows, currentPage, perPage)
  }, [data, pagination, currentPage, perPage])

  const handlePerPageChange = React.useCallback((next: PageSizeOption) => {
    setPerPage(next)
    setCurrentPage(1)
  }, [])

  return (
    <>
      {renderMobileCard && (
        <div className="md:hidden flex flex-col gap-3.5 w-full mb-6">
          {progressPending && progressSkeleton && (!data || data.length === 0) ? (
            <TableSkeleton />
          ) : (
            <>
              {pageSlice.items.map((row, idx) => (
                <div
                  key={idx}
                  className="relative overflow-hidden rounded-xl border border-white/10 bg-card/90 backdrop-blur-md text-card-foreground shadow-sm hover:border-primary/50 transition-all duration-300 hover:shadow-md"
                >
                  <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />
                  <div className="p-4 flex flex-col gap-2 relative z-10">
                    {renderMobileCard(row)}
                  </div>
                </div>
              ))}
              {pagination && pageSlice.totalRows > 0 && (
                <TablePaginationBar
                  testId="mobile-pagination"
                  perPage={perPage}
                  options={paginationRowsPerPageOptions}
                  page={pageSlice.page}
                  totalPages={pageSlice.totalPages}
                  startIndex={pageSlice.startIndex}
                  endIndex={pageSlice.endIndex}
                  totalRows={pageSlice.totalRows}
                  onPerPageChange={handlePerPageChange}
                  onPageChange={setCurrentPage}
                />
              )}
            </>
          )}
        </div>
      )}

      <div
        className={cn(
          "overflow-x-auto rounded-xl border bg-card text-card-foreground shadow-sm",
          renderMobileCard ? "hidden md:block" : "block",
          `
          [--rdt-color-bg:var(--card)]
          [--rdt-color-header-bg:var(--muted)]
          [--rdt-color-footer-bg:var(--card)]
          [--rdt-color-text-primary:var(--card-foreground)]
          [--rdt-color-text-secondary:var(--muted-foreground)]
          [--rdt-color-divider:var(--border)]
          [--rdt-color-primary:var(--foreground)]
          [--rdt-color-btn:var(--muted-foreground)]
          [--rdt-color-btn-hover:var(--accent)]
          [--rdt-color-btn-disabled:var(--muted-foreground)]
          [--rdt-color-selected:var(--accent)]
          [--rdt-color-selected-text:var(--accent-foreground)]
          [--rdt-color-highlight:var(--accent)]
          [--rdt-color-highlight-text:var(--accent-foreground)]
          [--rdt-color-striped:var(--muted)]
          [--rdt-color-striped-text:var(--foreground)]
          [--rdt-color-scrollbar-thumb:var(--border)]
          [--rdt-font-family:inherit]
          [--rdt-font-size:0.875rem]
          [--rdt-font-size-header:0.75rem]
          [--rdt-border-radius:0.75rem]
          [--rdt-header-height:44px]
          `
        )}
      >
        <DataTable
          theme={activeTableTheme}
          localization={ptBR}
          paginationComponentOptions={paginationComponentOptions}
          highlightOnHover
          responsive
          progressComponent={props.progressComponent || <TableSkeleton />}
          data={pageSlice.items}
          pagination={false}
          progressPending={progressPending}
          {...tableProps}
        />
        {pagination && pageSlice.totalRows > 0 && (
          <div className="border-t border-border/60 p-2 bg-card">
            <TablePaginationBar
              testId="desktop-pagination"
              perPage={perPage}
              options={paginationRowsPerPageOptions}
              page={pageSlice.page}
              totalPages={pageSlice.totalPages}
              startIndex={pageSlice.startIndex}
              endIndex={pageSlice.endIndex}
              totalRows={pageSlice.totalRows}
              onPerPageChange={handlePerPageChange}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </>
  )
}
