import { teamLogo } from "@/lib/assets"

function initials(name: string): string {
  const words = name.split(/\s+/).filter(Boolean)
  const letters =
    words.length > 1
      ? words.map((w) => w[0]).join("")
      : name.slice(0, 2)
  return letters.toUpperCase().slice(0, 3)
}

import { cn } from "@/lib/utils"

export function TeamInline({ name }: { name: string | null }) {
  if (!name) return <span>—</span>
  const logo = teamLogo(name)
  if (!logo) {
    return (
      <span className="flex items-center gap-1.5">
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[7px] font-bold text-secondary-foreground">
          {initials(name).slice(0, 2)}
        </span>
        {name}
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1.5">
      <img
        src={logo.url}
        alt=""
        aria-hidden
        loading="lazy"
        className={cn(
          "h-4 w-8 shrink-0 object-contain",
          logo.className,
        )}
      />
      {name}
    </span>
  )
}

export function TeamName({ name }: { name: string }) {
  const logo = teamLogo(name)
  if (!logo) {
    return (
      <span className="flex items-center gap-2">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-[9px] font-bold text-secondary-foreground">
          {initials(name)}
        </span>
        <span className="font-medium">{name}</span>
      </span>
    )
  }
  return (
    <span className="relative flex min-h-9 items-center pl-11">
      <img
        src={logo.url}
        alt=""
        aria-hidden
        loading="lazy"
        className={cn(
          "pointer-events-none absolute left-0 top-1/2 size-10 -translate-y-1/2 object-contain opacity-30 dark:opacity-45",
          logo.className,
        )}
      />
      <span className="relative z-10 font-medium">{name}</span>
    </span>
  )
}
