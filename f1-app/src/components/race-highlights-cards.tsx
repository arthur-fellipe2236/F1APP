import { useState, useEffect } from "react"
import { Play, ExternalLink, VideoOff, Calendar, Flame } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/page-header"
import { api } from "@/lib/api"
import {
  type HighlightVideo,
  OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY,
  OFFICIAL_2026_RACE_METADATA,
  DEFAULT_2026_HIGHLIGHTS,
  selectRaceHighlights,
} from "@/lib/highlights"

export type { HighlightVideo }
export {
  OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY,
  OFFICIAL_2026_RACE_METADATA,
  DEFAULT_2026_HIGHLIGHTS,
  selectRaceHighlights,
}

type ThumbQuality = "maxresdefault" | "hqdefault"

function HighlightCardItem({ item }: { item: HighlightVideo }) {
  const [thumbQuality, setThumbQuality] = useState<ThumbQuality>("maxresdefault")
  const [imgError, setImgError] = useState(false)

  const hasVideo = Boolean(item.youtubeId && item.youtubeUrl)
  const thumbUrl = item.youtubeId
    ? `https://img.youtube.com/vi/${item.youtubeId}/${thumbQuality}.jpg`
    : null

  return (
    <Card className="group relative overflow-hidden rounded-xl border border-border/50 bg-card/85 backdrop-blur-md hover:border-red-600/50 hover:shadow-xl hover:shadow-red-950/15 transition-all duration-300 flex flex-col">
      {/* Top red accent racing line on hover */}
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-red-600/70 via-red-500 to-transparent z-20 opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Container de Vídeo / Miniatura com Aspect Ratio 16:9 estrito */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted/80">
        {hasVideo && thumbUrl && !imgError ? (
          <>
            <img
              src={thumbUrl}
              alt={`Melhores Momentos do ${item.gpName} - Temporada ${item.season}`}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => {
                if (thumbQuality === "maxresdefault") {
                  setThumbQuality("hqdefault")
                } else {
                  setImgError(true)
                }
              }}
            />
            {/* Dark gradient mask */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2.5 p-4 text-center text-muted-foreground bg-secondary/30">
            <div className="size-10 rounded-full bg-background/80 flex items-center justify-center shadow-inner border border-border/50">
              <VideoOff className="size-5 opacity-60 text-muted-foreground" />
            </div>
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-foreground/90 block">
                Vídeo oficial ainda não disponível
              </span>
              <span className="text-[11px] text-muted-foreground block">
                Aguardando publicação no canal oficial da F1
              </span>
            </div>
          </div>
        )}

        {/* Badge de Temporada Oficial */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <Badge
            variant="outline"
            className="bg-black/75 backdrop-blur-md text-[10px] font-bold tracking-wider px-2 py-0.5 border-white/20 text-white shadow-sm font-mono"
          >
            F1 • 2026
          </Badge>
          <Badge
            variant="secondary"
            className="bg-red-950/80 text-red-400 border border-red-500/30 text-[10px] font-semibold tracking-wider px-1.5 py-0.5 uppercase"
          >
            Etapa {item.round}
          </Badge>
        </div>

        {/* Duração do Vídeo Oficial quando disponível */}
        {hasVideo && item.duration && (
          <div className="absolute bottom-2.5 right-2.5">
            <Badge
              variant="secondary"
              className="bg-black/90 backdrop-blur-md text-[10px] font-mono font-medium text-white px-2 py-0.5 shadow-md border border-white/10"
            >
              {item.duration}
            </Badge>
          </div>
        )}

        {/* Botão de Play Overlay para Ação Direta */}
        {hasVideo && (
          <a
            href={item.youtubeUrl!}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Assistir aos melhores momentos do ${item.gpName} no canal oficial da Formula 1`}
            className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-90 group-hover:opacity-100 group-hover:bg-black/35 transition-all duration-300"
          >
            <div className="flex size-12 items-center justify-center rounded-full bg-red-600 text-white shadow-lg shadow-red-950/60 transition-transform duration-300 group-hover:scale-110">
              <Play className="size-5 fill-current ml-0.5 text-white" />
            </div>
          </a>
        )}
      </div>

      {/* Conteúdo do Card */}
      <CardContent className="p-4 flex flex-col justify-between flex-1 gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <span>{item.country}</span>
            <span>•</span>
            <span>Fórmula 1</span>
          </div>
          <h3 className="font-bold text-base text-foreground leading-snug group-hover:text-red-500 transition-colors line-clamp-1 mt-0.5">
            {item.gpName}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5 font-mono">
            <Calendar className="size-3.5 opacity-70 text-red-500" />
            <span>{item.date}</span>
          </p>
        </div>

        {/* Botão de Ação Externo em conformidade com as diretrizes FOM */}
        {hasVideo ? (
          <a
            href={item.youtubeUrl!}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-between w-full text-xs font-semibold text-muted-foreground hover:text-red-400 pt-2.5 border-t border-border/40 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Flame className="size-3 text-red-500" />
              <span>Canal Oficial Formula 1</span>
            </span>
            <ExternalLink className="size-3.5" />
          </a>
        ) : (
          <div className="pt-2.5 border-t border-border/40 text-[11px] text-muted-foreground flex items-center justify-between">
            <span className="font-medium">Vídeo oficial ainda não disponível</span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border/40">
              Indisponível
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function RaceHighlightsCards({ highlights }: { highlights?: HighlightVideo[] }) {
  const [items, setItems] = useState<HighlightVideo[]>(highlights || DEFAULT_2026_HIGHLIGHTS)

  useEffect(() => {
    if (highlights) {
      setItems(highlights.slice(0, 3))
      return
    }

    let isMounted = true

    // Atualização dinâmica: consultar corridas concluídas da temporada 2026 da Fórmula 1
    api
      .races({ season: 2026, series: "f1", per_page: 50 })
      .then((response) => {
        if (!isMounted || !response?.data?.length) return

        const mapped = selectRaceHighlights(response.data, {
          completedRaces: response.meta?.completed_races,
        })

        if (mapped.length === 3 && isMounted) {
          setItems(mapped)
        }
      })
      .catch(() => {
        // Fallback resiliente mantém DEFAULT_2026_HIGHLIGHTS
      })

    return () => {
      isMounted = false
    }
  }, [highlights])

  return (
    <section aria-labelledby="highlights-heading" className="space-y-4">
      <div id="highlights-heading">
        <PageHeader
          title="Melhores Momentos das Últimas Corridas"
          description="Assista aos resumos oficiais da temporada 2026 da Fórmula 1 no canal oficial (@Formula1)"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {items.map((item) => (
          <HighlightCardItem key={item.id} item={item} />
        ))}
      </div>
    </section>
  )
}
