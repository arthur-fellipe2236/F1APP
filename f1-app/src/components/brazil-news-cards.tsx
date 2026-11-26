import { Newspaper } from "lucide-react"

import { NewsCard } from "@/components/race-news-cards"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useApi } from "@/hooks/use-api"
import { api, type NewsItem } from "@/lib/api"
import { flagFromCountry } from "@/lib/assets"

interface BrazilNewsBySeries {
  f1: NewsItem | null
  f2: NewsItem | null
  f3: NewsItem | null
}

const SLOTS: Array<{ series: keyof BrazilNewsBySeries; label: string }> = [
  { series: "f1", label: "F1 · Brasil" },
  { series: "f2", label: "F2 · Brasil" },
  { series: "f3", label: "F3 · Brasil" },
]

function EmptySlot({ label }: { label: string }) {
  return (
    <Card size="sm" className="h-full">
      <CardContent className="flex h-full min-h-28 items-center justify-center py-4 text-center text-xs text-muted-foreground">
        Nenhuma notícia recente sobre brasileiros na {label}
      </CardContent>
    </Card>
  )
}

export function BrazilNewsRow() {
  const query = useApi<BrazilNewsBySeries>(async () => {
    const [f1, f2, f3] = await Promise.all([
      api.brazilianNews("f1", 1),
      api.brazilianNews("f2", 1),
      api.brazilianNews("f3", 1),
    ])
    return {
      f1: f1.data[0] ?? null,
      f2: f2.data[0] ?? null,
      f3: f3.data[0] ?? null,
    }
  }, [], 30000)

  if (query.error) return null
  const flag = flagFromCountry("Brazil", 40)
  const data = query.data

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-card/70 backdrop-blur-md border border-border/40 shadow-xs">
        <div className="flex items-center gap-2.5">
          {flag ? (
            <img
              src={flag}
              alt="Brasil"
              loading="lazy"
              className="h-4.5 w-6.5 rounded-[3px] object-cover shadow-xs border border-white/20 shrink-0"
            />
          ) : (
            <Newspaper className="size-5 text-emerald-500 shrink-0" />
          )}
          <div>
            <h2 className="text-base font-bold font-f1 tracking-wider text-foreground">
              CADERNO BRASIL NO GRID MUNDIAL
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Cobertura especial dos talentos brasileiros: Gabriel Bortoleto (F1), Enzo Fittipaldi (F2) e Rafael Câmara (F3)
            </p>
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {!data
          ? SLOTS.map((slot) => (
              <Card key={slot.series} size="sm" className="overflow-hidden">
                <Skeleton className="h-28 w-full rounded-none" />
                <div className="space-y-2 px-3 pb-3 pt-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </Card>
            ))
          : SLOTS.map((slot) => {
              const item = data[slot.series]
              return item ? (
                <NewsCard
                  key={slot.series}
                  item={item}
                  badgeLabel={slot.label}
                />
              ) : (
                <EmptySlot
                  key={slot.series}
                  label={slot.series.toUpperCase()}
                />
              )
            })}
      </div>
    </section>
  )
}
