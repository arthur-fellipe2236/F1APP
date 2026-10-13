import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSeasons } from "@/hooks/use-seasons"
import { useMemo } from "react"

export function SeasonSelector({ value, onValueChange, className = "w-[140px]" }: { value: string, onValueChange: (v: string) => void, className?: string }) {
  const seasons = useSeasons()

  const groupedSeasons = useMemo(() => {
    const groups: Record<string, number[]> = {}
    seasons.forEach((year) => {
      const decade = Math.floor(year / 10) * 10
      let label = ""
      if (decade >= 2000) {
        label = `Anos ${decade}`
      } else {
        label = `Anos ${decade.toString().slice(2)}`
      }
      
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
