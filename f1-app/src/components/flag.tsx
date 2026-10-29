import { useEffect, useState } from "react"
import { Flag as FlagIcon } from "lucide-react"

import { flagFromCountry } from "@/lib/assets"
import { cn } from "@/lib/utils"

/**
 * Bandeira com fallback consistente: quando não há URL (país sem mapeamento
 * confiável) ou a imagem falha ao carregar, mostra um selo neutro do mesmo
 * tamanho em vez de espaço vazio ou imagem quebrada.
 */
export function FlagImage({
  src,
  title,
  className,
}: {
  src: string | null | undefined
  title?: string | null
  className?: string
}) {
  const [failed, setFailed] = useState(false)

  // Uma nova URL merece uma nova tentativa de carregamento.
  useEffect(() => setFailed(false), [src])

  const size = className ?? "h-3.5 w-5"
  if (!src || failed) {
    return (
      <span
        role="img"
        aria-label={title ? `Bandeira indisponível: ${title}` : "Bandeira indisponível"}
        title={title ?? undefined}
        data-flag-fallback="true"
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-[2px] border border-border/60 bg-muted/60 text-muted-foreground",
          size,
        )}
      >
        <FlagIcon className="size-2.5" aria-hidden />
      </span>
    )
  }
  return (
    <img
      src={src}
      alt=""
      aria-hidden
      title={title ?? undefined}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn("shrink-0 rounded-[2px] object-cover shadow-sm", size)}
    />
  )
}

/** Bandeira de um país de corrida/circuito (usa o mapeamento único de `assets.ts`). */
export function CountryFlag({
  country,
  className,
}: {
  country: string | null | undefined
  className?: string
}) {
  return (
    <FlagImage
      src={flagFromCountry(country)}
      title={country}
      className={className}
    />
  )
}

export function Flag({
  src,
  label,
}: {
  src: string | null
  label?: string | null
}) {
  const text = label || "—"
  if (!src && !label) return <span>{text}</span>
  return (
    <span className="flex items-center gap-2">
      <FlagImage src={src} title={label} />
      {text}
    </span>
  )
}
