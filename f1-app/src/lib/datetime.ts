/**
 * Política única de data/hora das sessões (Etapa 1.11).
 *
 * A API entrega instantes em ISO 8601 UTC com offset explícito. Toda
 * apresentação é convertida AQUI, sempre para America/Sao_Paulo, sem depender
 * do fuso do navegador e sem somar offsets manualmente.
 * Contagens regressivas usam o epoch (instantMs), nunca strings formatadas.
 */

export const DISPLAY_TIME_ZONE = "America/Sao_Paulo"
export const DISPLAY_TIME_ZONE_LABEL = "Horário de Brasília"
export const TIME_PLACEHOLDER = "--:--"

// Exige data+hora com fuso explícito (Z ou ±HH:MM). Sem fuso => inválido.
const EXPLICIT_OFFSET = /T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}(?::?\d{2})?)$/i

export function parseInstant(value: string | null | undefined): Date | null {
  if (typeof value !== "string") return null
  const text = value.trim()
  if (!text || !EXPLICIT_OFFSET.test(text)) return null
  const parsed = new Date(text)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function instantMs(value: string | null | undefined): number | null {
  const parsed = parseInstant(value)
  return parsed ? parsed.getTime() : null
}

const make = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("pt-BR", { timeZone: DISPLAY_TIME_ZONE, ...options })

const timeFmt = make({ hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
const timeSecondsFmt = make({ hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" })
const weekdayDateFmt = make({ weekday: "short", day: "numeric", month: "short" })
const weekdayFmt = make({ weekday: "short" })
const dayMonthFmt = make({ day: "2-digit", month: "2-digit" })
const dateTimeShortFmt = make({
  weekday: "short",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
})
const dateTimeLongFmt = make({
  weekday: "long",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
})

function withDate(value: string | null | undefined, fmt: Intl.DateTimeFormat, fallback: string): string {
  const parsed = parseInstant(value)
  return parsed ? fmt.format(parsed) : fallback
}

/** HH:mm em Brasília. */
export const formatSessionTime = (value: string | null | undefined) =>
  withDate(value, timeFmt, TIME_PLACEHOLDER)

/** HH:mm:ss em Brasília. */
export const formatSessionTimeSeconds = (value: string | null | undefined) =>
  withDate(value, timeSecondsFmt, TIME_PLACEHOLDER)

/** "sáb., 21 de nov." em Brasília. */
export const formatSessionWeekdayDate = (value: string | null | undefined) =>
  withDate(value, weekdayDateFmt, "—")

/** "sáb." em Brasília. */
export const formatSessionWeekday = (value: string | null | undefined) =>
  withDate(value, weekdayFmt, "—")

/** "21/11" em Brasília. */
export const formatSessionDayMonth = (value: string | null | undefined) =>
  withDate(value, dayMonthFmt, "—")

/** "sáb., 21 de nov., 20:00" em Brasília. */
export const formatSessionDateTime = (value: string | null | undefined) =>
  withDate(value, dateTimeShortFmt, "Horário a confirmar")

/** "sábado, 21/11/2026 às 20:00" em Brasília. */
export const formatSessionDateTimeLong = (value: string | null | undefined) =>
  withDate(value, dateTimeLongFmt, "Horário a confirmar")
