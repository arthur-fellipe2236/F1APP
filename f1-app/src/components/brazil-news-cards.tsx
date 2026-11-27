import { Newspaper } from "lucide-react"

import { NewsCard } from "@/components/race-news-cards"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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

// Talentos brasileiros confirmados no ecossistema de monopostos da FIA
const BRAZILIAN_TALENTS = [
  {
    name: "Gabriel Bortoleto",
    category: "Fórmula 1",
    team: "Kick Sauber / Audi",
    status: "Titular 2026",
    number: "5",
  },
  {
    name: "Enzo Fittipaldi",
    category: "Fórmula 2",
    team: "Grid Oficial F2",
    status: "Piloto F2",
    number: "14",
  },
  {
    name: "Rafael Câmara",
    category: "Fórmula 3",
    team: "Ferrari Driver Academy",
    status: "Campeão FRECA / F3",
    number: "7",
  },
  {
    name: "Pedro Clerot",
    category: "F. Regional",
    team: "Fórmula Regional",
    status: "Monopostos Europa",
    number: "",
  },
]

function EmptySlot({ label }: { label: string }) {
  return (
    <Card size="sm" className="h-full bg-white/[0.02] border-white/10">
      <CardContent className="flex h-full min-h-28 items-center justify-center py-4 text-center text-xs text-muted-foreground font-tech">
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
      {/* Cabeçalho Esmeralda com Identidade Escuderia Brasil */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#064e3b]/40 via-[#07080c]/90 to-[#07080c]/90 backdrop-blur-md border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {flag ? (
              <img
                src={flag}
                alt="Brasil"
                loading="lazy"
                className="h-5 w-7.5 rounded-[3px] object-cover shadow-sm border border-emerald-400/40 shrink-0"
              />
            ) : (
              <Newspaper className="size-5 text-emerald-400 shrink-0" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-racing tracking-wider text-white">
                  ESCUDERIA BRASIL NO GRID MUNDIAL
                </h2>
                <Badge variant="outline" className="text-[10px] font-mono-num uppercase px-2 py-0 border-emerald-500/40 text-emerald-400 bg-emerald-950/50">
                  COBERTURA OFICIAL
                </Badge>
              </div>
              <p className="text-xs text-emerald-200/70 mt-0.5 font-tech">
                Acompanhamento contínuo dos pilotos brasileiros nas categorias internacionais de monopostos
              </p>
            </div>
          </div>

          {/* Chips dos pilotos brasileiros */}
          <div className="flex flex-wrap items-center gap-2">
            {BRAZILIAN_TALENTS.map((talent) => (
              <div
                key={talent.name}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 border border-emerald-500/20 text-xs font-tech text-zinc-300"
              >
                <span className="size-1.5 rounded-full bg-emerald-400" />
                <span className="font-bold text-white">{talent.name}</span>
                <span className="text-[10px] text-emerald-400/80 font-mono-num">
                  ({talent.category})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid de notícias das 3 categorias (F1, F2, F3) */}
      <div className="grid gap-4 sm:grid-cols-3">
        {!data
          ? SLOTS.map((slot) => (
              <Card key={slot.series} size="sm" className="overflow-hidden bg-[#07080c]/80 border-white/10">
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
