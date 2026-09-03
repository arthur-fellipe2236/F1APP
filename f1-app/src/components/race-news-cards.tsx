import { Newspaper } from "lucide-react"

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

const newsDate = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
})

function CardImage({
  item,
  className,
}: {
  item: NewsItem
  className: string
}) {
  if (item.image) {
    return (
      <img
        src={item.image}
        alt=""
        aria-hidden
        loading="lazy"
        className={className}
      />
    )
  }
  return (
    <div
      className={`${className} flex items-center justify-center bg-muted`}
    >
      <Newspaper className="size-6 text-muted-foreground" />
    </div>
  )
}

function ArticleSummary({ url }: { url: string }) {
  const query = useApi(() => api.newsArticle(url), [url])

  if (query.loading || !query.data) {
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
  if (query.error) {
    return (
      <p className="text-xs text-muted-foreground">
        Não foi possível carregar o resumo da matéria.
      </p>
    )
  }
  return (
    <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
      {query.data.summary.map((line, index) => (
        <li
          key={index}
          className="flex gap-2 text-sm leading-relaxed text-card-foreground"
        >
          <span className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground/60" />
          <span>{line}</span>
        </li>
      ))}
    </ul>
  )
}

export function NewsCard({
  item,
  badgeLabel,
}: {
  item: NewsItem
  badgeLabel?: string
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="block w-full text-left outline-none"
        >
          <Card
            size="sm"
            className="h-full overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <CardImage item={item} className="h-28 w-full object-cover" />
            <div className="flex flex-col gap-2 px-3 pb-3">
              <div className="flex items-center gap-2">
                <Badge
                  variant={badgeLabel || item.matched ? "default" : "secondary"}
                >
                  {badgeLabel
                    || (item.matched ? "GP do fim de semana" : item.article_type)}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {newsDate.format(new Date(item.updated_at))}
                </span>
              </div>
              <h3 className="line-clamp-2 text-sm font-medium leading-snug">
                {item.title}
              </h3>
              {item.meta_description ? (
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {item.meta_description}
                </p>
              ) : null}
            </div>
          </Card>
        </button>
      </DialogTrigger>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-xl">
        <CardImage
          item={item}
          className="h-56 w-full shrink-0 object-cover"
        />
        <div className="flex flex-col gap-4 p-6">
          <DialogHeader className="gap-2 text-left">
            <div className="flex items-center gap-2">
              <Badge variant={item.matched ? "default" : "secondary"}>
                {item.matched ? "GP do fim de semana" : item.article_type}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {newsDate.format(new Date(item.updated_at))}
              </span>
            </div>
            <DialogTitle className="text-lg leading-snug">
              {item.title}
            </DialogTitle>
            <ArticleSummary url={item.url} />
            {item.title_en && item.title_en !== item.title ? (
              <p className="text-xs text-muted-foreground/80 italic">
                Original: {item.title_en}
              </p>
            ) : null}
          </DialogHeader>
          <DialogFooter className="sm:justify-between">
            <span className="text-xs text-muted-foreground">
              Fonte: formula1.com — tradução automática para pt-BR
            </span>
            <Button asChild size="sm" variant="outline">
              <a href={item.url} target="_blank" rel="noopener noreferrer">
                Ler matéria completa
              </a>
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function RaceNewsCards() {
  const query = useApi(() => api.latestNews(), [])
  if (query.error) return null

  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Newspaper className="size-4" />
        Últimas notícias — fonte: formula1.com
      </h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {query.loading || !query.data
          ? [0, 1, 2].map((i) => (
              <Card key={i} size="sm" className="overflow-hidden">
                <Skeleton className="h-28 w-full rounded-none" />
                <div className="space-y-2 px-3 pb-3 pt-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </Card>
            ))
          : query.data.data.map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
      </div>
    </section>
  )
}
