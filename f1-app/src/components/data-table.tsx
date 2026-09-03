import DataTable, { type TableProps } from "react-data-table-component"
import { ptBR } from "react-data-table-component/locales"
import "react-data-table-component/css"

const paginationComponentOptions = {
  rowsPerPageText: "Linhas por página:",
  rangeSeparatorText: "de",
}

export function F1DataTable<T>(props: TableProps<T>) {
  return (
    <div
      className="
        overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm
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
      "
    >
      <DataTable
        localization={ptBR}
        paginationComponentOptions={paginationComponentOptions}
        highlightOnHover
        responsive
        {...props}
      />
    </div>
  )
}
