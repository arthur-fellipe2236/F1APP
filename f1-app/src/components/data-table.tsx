import * as React from "react"
import DataTable, {
  createTheme,
  type TableProps,
} from "react-data-table-component"
import { ptBR } from "react-data-table-component/locales"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

createTheme(
  "f1-dark",
  {
    text: {
      primary: "#ffffff",
      secondary: "#a1a1aa",
      disabled: "#52525b",
    },
    background: {
      default: "#1c1c24",
    },
    context: {
      background: "#cb4b16",
      text: "#FFFFFF",
    },
    divider: {
      default: "#3f3f46",
    },
  },
  "dark",
)

const paginationComponentOptions = {
  rowsPerPageText: "Linhas por página:",
  rangeSeparatorText: "de",
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
  renderMobileCard?: (row: T) => React.ReactNode;
}

export function F1DataTable<T>(props: F1DataTableProps<T>) {
  const { renderMobileCard, data, ...tableProps } = props
  
  return (
    <>
      {renderMobileCard && data && (
        <div className="md:hidden flex flex-col gap-3 w-full mb-6">
          {data.map((row, idx) => (
            <div key={idx} className="relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm hover:border-primary/50 transition-colors">
              <div className="p-4 flex flex-col gap-2">
                {renderMobileCard(row)}
              </div>
            </div>
          ))}
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
          theme="f1-dark"
          localization={ptBR}
          paginationComponentOptions={paginationComponentOptions}
          highlightOnHover
          responsive
          progressComponent={props.progressComponent || <TableSkeleton />}
          data={data}
          {...tableProps}
        />
      </div>
    </>
  )
}
