import { Badge } from "@/components/ui/badge"
import { flagFromNationality } from "@/lib/assets"

export function CodeBadge({
  code,
  nationality,
}: {
  code: string | null
  nationality?: string | null
}) {
  if (!code) return null
  const flag = flagFromNationality(nationality ?? null)
  return (
    <Badge variant="outline" className="gap-1">
      {flag ? (
        <img
          src={flag}
          alt=""
          aria-hidden
          loading="lazy"
          className="h-3 w-[18px] rounded-[1px] object-cover"
        />
      ) : null}
      {code}
    </Badge>
  )
}
