export function formatDate(value: string | null | undefined): string {
  if (!value) return "—"
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date)
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—"
  return new Intl.NumberFormat("pt-BR").format(value)
}

export function formatPoints(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—"
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value)
}

export function formatKm(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—"
  return `${new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  }).format(value)} km`
}

const LAP_DEFICIT_RE = /^\+?\s*(\d+)\s*(?:lap|laps|volta|voltas)\b/i

export interface FormatResultStatusOptions {
  laps?: number | null
  winnerLaps?: number | null
  position?: number | null
  statusLabel?: string | null
  gap?: string | null
  lapDeficit?: number | null
}

export function formatLapDeficit(deficit: number | null | undefined): string | null {
  if (typeof deficit !== "number" || !Number.isFinite(deficit) || deficit <= 0) {
    return null
  }
  const count = Math.trunc(deficit)
  return count === 1 ? "+1 volta" : `+${count} voltas`
}

export function formatStatus(
  status: string | null | undefined,
  options?: FormatResultStatusOptions,
): string {
  const raw = (status ?? "").trim()
  const lowered = raw.toLowerCase()

  if (options?.statusLabel && lowered === "finished") {
    return options.statusLabel
  }
  if (options?.gap && lowered === "finished") {
    return options.gap
  }
  const explicitDeficitLabel = formatLapDeficit(options?.lapDeficit)
  if (explicitDeficitLabel && (lowered === "finished" || lowered === "lapped" || !raw)) {
    return explicitDeficitLabel
  }

  const lapMatch = raw.match(LAP_DEFICIT_RE)
  if (lapMatch) {
    return formatLapDeficit(Number(lapMatch[1])) ?? raw
  }

  if (
    (lowered === "finished" || lowered === "running" || lowered === "lapped" || lowered === "completou") &&
    typeof options?.laps === "number" &&
    typeof options?.winnerLaps === "number" &&
    options.winnerLaps > options.laps &&
    options.laps > 0
  ) {
    return formatLapDeficit(options.winnerLaps - options.laps) ?? "Completou"
  }

  if (lowered === "lapped") {
    return "+1 volta"
  }

  if (!raw) {
    if (
      typeof options?.position === "number" &&
      options.position > 0 &&
      typeof options?.laps === "number" &&
      options.laps > 0
    ) {
      if (typeof options.winnerLaps === "number" && options.winnerLaps > options.laps) {
        return formatLapDeficit(options.winnerLaps - options.laps) ?? "Completou"
      }
      return "Completou"
    }
    return "—"
  }

  const labels: Record<string, string> = {
    finished: "Completou",
    running: "Completou",
    classified: "Completou",
    classificado: "Completou",
    dnf: "Abandonou",
    retired: "Abandonou",
    ret: "Abandonou",
    abandonou: "Abandonou",
    dns: "Não largou",
    "did not start": "Não largou",
    withdrew: "Não largou",
    "not restarted": "Não largou",
    disqualified: "Desclassificado",
    dsq: "Desclassificado",
    excluded: "Desclassificado",
    underweight: "Desclassificado",
    not_classified: "Não classificado",
    "not classified": "Não classificado",
    nc: "Não classificado",
    dnq: "Não qualificou",
    "did not qualify": "Não qualificou",
    "failed qualification": "Não qualificou",
    "107% rule": "Não qualificou",
    dnpq: "Não pré-qualificou",
    "did not prequalify": "Não pré-qualificou",
    needs_review: "Em revisão",
  }
  return labels[lowered] ?? options?.statusLabel ?? raw
}

export function formatShortUnclassifiedStatus(status: string | null | undefined): string {
  const lowered = (status ?? "").trim().toLowerCase()
  if (lowered === "disqualified" || lowered === "dsq" || lowered === "excluded") return "DSQ"
  if (lowered === "dns" || lowered === "did not start" || lowered === "withdrew") return "DNS"
  if (lowered === "not_classified" || lowered === "not classified" || lowered === "nc") return "NC"
  if (lowered === "dnq" || lowered === "did not qualify") return "DNQ"
  if (lowered === "dnpq" || lowered === "did not prequalify") return "DNPQ"
  return "DNF"
}
