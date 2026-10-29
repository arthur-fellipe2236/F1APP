import { resolveCountryIso } from "./assets"

export interface MeetingLike {
  meeting_key?: number
  meeting_name?: string | null
  country?: string | null
  date_start?: string | null
}

export interface RaceLike {
  id?: number | null
  name?: string | null
  circuit_country?: string | null
  date?: string | null
}

const MAX_DATE_DISTANCE_DAYS = 10
const DAY_MS = 86_400_000

function normalize(text: string | null | undefined) {
  return (text ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
}

function sameCountry(a?: string | null, b?: string | null) {
  if (!a || !b) return false
  const isoA = resolveCountryIso(a)
  const isoB = resolveCountryIso(b)
  if (isoA && isoB) return isoA === isoB
  return normalize(a) === normalize(b)
}

/**
 * Encontra o evento (meeting) correspondente a uma corrida do calendário.
 *
 * Países com várias etapas na mesma temporada (EUA, Itália, Espanha) tinham o
 * primeiro evento do país escolhido, exibindo a programação/telemetria de
 * outra corrida. Agora: (1) `meeting_key` idêntico ao id da corrida (F2/F3);
 * (2) mesmo país escolhendo o evento de data mais próxima (até 10 dias);
 * (3) nome idêntico. Sem correspondência confiável retorna `undefined`.
 */
export function findMeetingForRace<T extends MeetingLike>(
  meetings: T[] | null | undefined,
  race: RaceLike,
): T | undefined {
  if (!meetings?.length) return undefined

  if (race.id != null) {
    const byKey = meetings.find((m) => m.meeting_key === race.id)
    if (byKey) return byKey
  }

  const raceTime = race.date ? Date.parse(race.date) : NaN
  const byCountry = meetings.filter((m) =>
    sameCountry(m.country, race.circuit_country),
  )
  if (byCountry.length > 0) {
    if (Number.isNaN(raceTime)) {
      return byCountry.length === 1 ? byCountry[0] : undefined
    }
    let best: T | undefined
    let bestDistance = Infinity
    for (const meeting of byCountry) {
      const start = meeting.date_start ? Date.parse(meeting.date_start) : NaN
      if (Number.isNaN(start)) continue
      const distance = Math.abs(start - raceTime) / DAY_MS
      if (distance < bestDistance) {
        best = meeting
        bestDistance = distance
      }
    }
    if (best && bestDistance <= MAX_DATE_DISTANCE_DAYS) return best
    return byCountry.length === 1 ? byCountry[0] : undefined
  }

  const name = normalize(race.name)
  if (!name) return undefined
  return meetings.find((m) => normalize(m.meeting_name) === name)
}
