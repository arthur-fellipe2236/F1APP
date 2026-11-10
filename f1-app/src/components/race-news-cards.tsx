import { useAppStore } from "@/store"
import { Newspaper, ExternalLink, Calendar, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { useApi } from "@/hooks/use-api"
import { api, type NewsItem } from "@/lib/api"
import { mediaUrl } from "@/lib/media"

const newsDate = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
})

function CardImage({ item, className }: { item: NewsItem; className: string }) {
  if (item.image) {
    return (
      <img
        src={mediaUrl(item.image, 640) ?? item.image}
        alt=""
        aria-hidden
        loading="lazy"
        className={className}
        onError={(e) => {
          e.currentTarget.src = "/multi-series-logo.png"
        }}
      />
    )
  }
  return (
    <div className={`${className} flex items-center justify-center bg-muted/60`}>
      <Newspaper className="size-6 text-muted-foreground/60" />
    </div>
  )
}

function ArticleSummary({
  url,
  title,
  fallbackText,
  articleType,
}: {
  url: string
  title?: string
  fallbackText?: string
  articleType?: string
}) {
  const query = useApi(
    () =>
      api.newsArticle(url, {
        title,
        meta_description: fallbackText,
        article_type: articleType,
      }),
    [url, title, fallbackText, articleType],
  )

  if (query.loading) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          Lendo a matéria completa no site oficial…
        </p>
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    )
  }

  if (query.error || !query.data) {
    const fallbackBullets = [fallbackText, title].filter(
      (v, idx, arr): v is string => Boolean(v && v.trim()) && arr.indexOf(v) === idx,
    )
    if (fallbackBullets.length > 0) {
      return (
        <div className="space-y-3">
          <ul className="max-h-64 space-y-2.5 overflow-y-auto pr-1">
            {fallbackBullets.map((line, index) => (
              <li
                key={index}
                className="flex gap-2.5 text-sm leading-relaxed text-card-foreground"
              >
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-red-500" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-300">
            Resumo gerado a partir dos metadados editoriais disponíveis (conteúdo sem parágrafos convencionais ou temporariamente indisponível para extração completa). Utilize &ldquo;Ler na íntegra&rdquo; para abrir a matéria original.
          </p>
        </div>
      )
    }
    return (
      <p className="text-xs text-muted-foreground">
        Não foi possível carregar o resumo da matéria. Utilize &ldquo;Ler na íntegra&rdquo; para abrir a fonte original.
      </p>
    )
  }

  const isMetadataSummary =
    query.data.summary_source === "metadata" || Boolean(query.data.limitation_note)

  return (
    <div className="space-y-3">
      <ul className="max-h-64 space-y-2.5 overflow-y-auto pr-1">
        {query.data.summary.map((line, index) => (
          <li
            key={index}
            className="flex gap-2.5 text-sm leading-relaxed text-card-foreground"
          >
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-red-500" />
            <span>{line}</span>
          </li>
        ))}
      </ul>
      {isMetadataSummary ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-300">
          {query.data.limitation_note ??
            "Resumo gerado a partir dos metadados editoriais disponíveis, pois o conteúdo original não possui parágrafos convencionais no corpo da matéria."}
        </p>
      ) : null}
    </div>
  )
}

export function NewsCard({
  item,
  badgeLabel,
}: {
  item: NewsItem
  badgeLabel?: string
}) {
  const isFavorite = badgeLabel?.includes("Favorito")
  const isWeekendGP = item.matched || badgeLabel?.includes("fim de semana")

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className="group block w-full text-left outline-none">
          <Card
            size="sm"
            className="h-full overflow-hidden rounded-xl border border-border/50 bg-card/85 backdrop-blur-md transition-all duration-300 hover:border-red-600/40 hover:shadow-xl hover:shadow-red-950/10 flex flex-col justify-between"
          >
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted/80">
              <CardImage
                item={item}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                <Badge
                  variant={isFavorite ? "default" : isWeekendGP ? "destructive" : "secondary"}
                  className="text-[10px] font-bold tracking-wider px-2 py-0.5 shadow-sm uppercase font-mono"
                >
                  {isFavorite && <Sparkles className="size-2.5 mr-1 inline" />}
                  {badgeLabel || (item.matched ? "GP do fim de semana" : item.article_type)}
                </Badge>
              </div>

              <div className="absolute bottom-2 left-2.5 flex items-center gap-1 text-[10px] text-white/80 font-mono">
                <Calendar className="size-3 text-red-400" />
                <span>{newsDate.format(new Date(item.updated_at))}</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 p-3.5 flex-1 justify-between">
              <div>
                <h3 className="line-clamp-2 text-sm font-bold leading-snug group-hover:text-red-500 transition-colors">
                  {item.title}
                </h3>
                {item.meta_description ? (
                  <p className="line-clamp-2 text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    {item.meta_description}
                  </p>
                ) : null}
              </div>

              <div className="pt-2 mt-auto border-t border-border/30 flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                <span className="group-hover:text-foreground transition-colors">Ver resumo da matéria</span>
                <span className="text-red-500">→</span>
              </div>
            </div>
          </Card>
        </button>
      </DialogTrigger>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-xl rounded-2xl border-border/60 bg-card/95 backdrop-blur-xl">
        <div className="relative h-60 w-full overflow-hidden bg-muted">
          <CardImage item={item} className="h-full w-full object-cover" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        </div>
        <div className="flex flex-col gap-4 p-6">
          <DialogHeader className="gap-2.5 text-left">
            <div className="flex items-center gap-2">
              <Badge variant={isFavorite ? "default" : isWeekendGP ? "destructive" : "secondary"}>
                {isFavorite && <Sparkles className="size-3 mr-1 inline" />}
                {item.matched ? "GP do fim de semana" : item.article_type}
              </Badge>
              <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                <Calendar className="size-3 text-red-500" />
                {newsDate.format(new Date(item.updated_at))} (Brasília)
              </span>
            </div>
            <DialogTitle className="text-lg font-bold leading-snug text-foreground">
              {item.title}
            </DialogTitle>
            <ArticleSummary
              url={item.url}
              title={item.title}
              fallbackText={item.meta_description ?? undefined}
              articleType={item.article_type}
            />
            {item.title_en && item.title_en !== item.title ? (
              <p className="text-xs text-muted-foreground/80 italic pt-1 border-t border-border/40">
                Original em inglês: {item.title_en}
              </p>
            ) : null}
          </DialogHeader>
          <DialogFooter className="sm:justify-between items-center pt-2 border-t border-border/40">
            <span className="text-xs text-muted-foreground">
              Tradução e síntese editorial em pt-BR
            </span>
            <Button asChild size="sm" variant="default" className="bg-red-600 hover:bg-red-700 text-white gap-1.5 font-semibold">
              <a href={item.url} target="_blank" rel="noopener noreferrer">
                <span>Ler na íntegra</span>
                <ExternalLink className="size-3.5" />
              </a>
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function RaceNewsCards({ series }: { series?: string }) {
  const { user } = useAppStore()

  const query = useApi(() => api.latestNews(series), [series])
  if (query.error) return null

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-4 w-1 rounded-full bg-red-600" />
          <h2 className="flex items-center gap-2 text-base font-bold tracking-tight text-foreground uppercase">
            <Newspaper className="size-4 text-red-500" />
            Últimas Notícias da Pista
          </h2>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {query.loading || !query.data
          ? [0, 1, 2].map((i) => (
              <Card key={i} size="sm" className="overflow-hidden rounded-xl border border-border/40">
                <Skeleton className="aspect-[16/10] w-full rounded-none" />
                <div className="space-y-2 p-3.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </Card>
            ))
          : (() => {
            let newsItems = query.data.data;
            if (user && (user.favorite_driver || user.favorite_team)) {
              const terms = [user.favorite_driver?.toLowerCase(), user.favorite_team?.toLowerCase()].filter(Boolean) as string[];
              const matched = [];
              const others = [];
              for (const item of newsItems) {
                const title = item.title.toLowerCase();
                const desc = (item.meta_description || '').toLowerCase();
                if (terms.some(t => title.includes(t) || desc.includes(t))) {
                  matched.push({...item, badgeLabel: "⭐️ Favorito"});
                } else {
                  others.push(item);
                }
              }
              newsItems = [...matched, ...others];
            }
            return newsItems.slice(0, 3).map((item: any) => (
              <NewsCard key={item.id} item={item} badgeLabel={item.badgeLabel} />
            ))
          })()}
      </div>
    </section>
  )
}
