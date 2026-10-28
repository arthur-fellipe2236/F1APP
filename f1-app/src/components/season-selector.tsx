import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSeasons } from "@/hooks/use-seasons"
import { useAppStore } from "@/store"
import { useMemo } from "react"

export function SeasonSelector({
  value,
  onValueChange,
  className = "w-[140px]",
  series: seriesProp,
}: {
  value: string
  onValueChange: (v: string) => void
  className?: string
  series?: string
}) {
  const storeSeries = useAppStore((state) => state.series)
  const series = seriesProp ?? storeSeries
  const seasons = useSeasons(series)

  const groupedSeasons = useMemo(() => {
    const groups: Record<string, number[]> = {}
    seasons.forEach((year) => {
      const decade = Math.floor(year / 10) * 10
      const label = decade >= 2000 ? `Anos ${decade}` : `Anos ${decade.toString().slice(2)}`
      
      if (!groups[label]) groups[label] = []
      groups[label].push(year)
    })
    return groups
  }, [seasons])

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className} id="season-filter">
        <SelectValue placeholder="Temporada" />
      </SelectTrigger>
      <SelectContent>
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
