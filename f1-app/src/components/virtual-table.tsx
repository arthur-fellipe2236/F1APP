import * as React from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import type { TableColumn } from "react-data-table-component"
import { cn } from "@/lib/utils"

interface VirtualTableProps<T> {
  data: T[]
  columns: TableColumn<T>[]
  rowHeight?: number
  getRowColor?: (row: T) => string | undefined
  renderMobileCard?: (row: T) => React.ReactNode
  onRowClicked?: (row: T) => void
}

export function VirtualDataTable<T>({ data, columns, rowHeight = 60, getRowColor, renderMobileCard, onRowClicked }: VirtualTableProps<T>) {
  const parentRef = React.useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 5,
  })

  // We need a minimum width so horizontal scroll activates on dense tables
  const minTableWidth = columns.reduce((acc, col) => acc + (parseInt(col.width as string) || 150), 0)

  return (
    <>
      {/* MOBILE LIST */}
      {renderMobileCard && (
        <div className="md:hidden flex flex-col gap-3.5 w-full">
          {data.map((row, idx) => {
            const accentColor = getRowColor ? getRowColor(row) : undefined
            return (
              <div
                key={idx}
                onClick={() => onRowClicked?.(row)}
                className={cn(
                  "relative overflow-hidden rounded-xl border border-white/10 bg-card/90 backdrop-blur-md text-card-foreground shadow-sm hover:border-primary/50 transition-all duration-300 hover:shadow-md",
                  onRowClicked && "cursor-pointer active:scale-[0.99]"
                )}
              >
                {/* Aero Accent / Team Ribbon */}
                {accentColor ? (
                  <>
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 z-10 rounded-l" style={{ backgroundColor: accentColor }} />
                    <div
                      className="absolute inset-y-0 left-0 w-28 opacity-15 pointer-events-none"
                      style={{ background: `linear-gradient(to right, ${accentColor}, transparent)` }}
                    />
                  </>
                ) : (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/40 z-10" />
                )}

                {/* Top subtle highlight */}
                <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

                <div className="p-4 pl-5 flex flex-col gap-2 relative z-10">
                  {renderMobileCard(row)}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* DESKTOP TABLE */}
      <div className={cn("overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm flex-col w-full", renderMobileCard ? "hidden md:flex" : "flex")}>

      <div
        ref={parentRef}
        className="overflow-auto max-h-[600px] w-full"
        style={{ height: "600px" }}
      >
        <div style={{ minWidth: `${minTableWidth}px`, position: "relative", height: `${rowVirtualizer.getTotalSize() + 40}px` }}>
          {/* Header */}
          <div className="sticky top-0 z-20 flex bg-muted border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider w-full shadow-sm">
            {columns.map((col, idx) => {
              const isSticky = idx === 1 // Usually the "Name" or second column is sticky
              return (
                <div
                  key={idx}
                  className={cn("flex items-center px-4 py-3 bg-muted", isSticky && "sticky left-0 z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]")}
                  style={{
                    width: col.width || "150px",
                    flex: col.width ? "0 0 auto" : 1,
                    justifyContent: col.center ? "center" : "flex-start",
                  }}
                >
                  {col.name}
                </div>
              )
            })}
          </div>

          {/* Body */}
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const row = data[virtualRow.index]
            const accentColor = getRowColor ? getRowColor(row) : undefined
            
            return (
              <div
                key={virtualRow.index}
                onClick={() => onRowClicked?.(row)}
                className={cn(
                  "absolute left-0 w-full flex border-b border-border/50 hover:bg-muted/50 transition-colors group",
                  onRowClicked && "cursor-pointer"
                )}
                style={{
                  height: `${virtualRow.size}px`,
                  top: `40px`, // Offset by header height
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {/* Accent Line */}
                {accentColor && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 z-40" style={{ backgroundColor: accentColor }} />
                )}
                
                {columns.map((col, idx) => {
                  const isSticky = idx === 1
                  let content: React.ReactNode = null
                  if (col.cell) {
                    content = col.cell(row, virtualRow.index, col, virtualRow.index)
                  } else if (col.selector) {
                    content = col.selector(row, virtualRow.index) as React.ReactNode
                  }
                  
                  return (
                    <div
                      key={idx}
                      className={cn(
                        "flex items-center px-4 bg-card group-hover:bg-muted/50 transition-colors", 
                        isSticky && "sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"
                      )}
                      style={{
                        width: col.width || "150px",
                        flex: col.width ? "0 0 auto" : 1,
                        justifyContent: col.center ? "center" : "flex-start",
                      }}
                    >
                      {content}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
    </>
  )
}
