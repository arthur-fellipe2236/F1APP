import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSeasonsState } from "@/hooks/use-seasons"
import {
  ALL_SEASONS_LABEL,
  ALL_SEASONS_VALUE,
  groupSeasonsByDecade,
  resolveSeasonSelectorValue,
} from "@/lib/season-utils"
import { useAppStore } from "@/store"
import { useMemo } from "react"

export function SeasonSelector({
  value,
  onValueChange,
  className = "w-[140px]",
  series: seriesProp,
  includeAll = false,
}: {
  value: string
  onValueChange: (v: string) => void
  className?: string
  series?: string
  includeAll?: boolean
}) {
  const storeSeries = useAppStore((state) => state.series)
  const series = seriesProp ?? storeSeries
  const { seasons, loading } = useSeasonsState(series)

  const groupedSeasons = useMemo(() => groupSeasonsByDecade(seasons), [seasons])
  const selectedValue = resolveSeasonSelectorValue({
    value,
    seasons,
    loading,
    includeAll,
  })

  return (
    <Select value={selectedValue} onValueChange={onValueChange}>
      <SelectTrigger className={className} id="season-filter">
        <SelectValue placeholder="Temporada" />
      </SelectTrigger>
      <SelectContent>
        {includeAll && (
          <SelectGroup>
            <SelectItem value={ALL_SEASONS_VALUE}>{ALL_SEASONS_LABEL}</SelectItem>
          </SelectGroup>
        )}
        {Object.entries(groupedSeasons).map(([label, years]) => (
          <SelectGroup key={label}>
            <SelectLabel>{label}</SelectLabel>
            {years.map((year) => (
              <SelectItem key={year} value={String(year)}>
                {year}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  )
}
