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

export function formatStatus(status: string | null | undefined): string {
  if (!status) return "—"
  const labels: Record<string, string> = {
    finished: "Completou",
    dnf: "Abandonou",
    dns: "Não largou",
    disqualified: "Desclassificado",
  }
  return labels[status.toLowerCase()] ?? status
}
