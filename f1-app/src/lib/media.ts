function apiOrigin(): string | null {
  const base = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "")
  if (base) return base
  // Em build de produção sem API configurada nao existe backend para o proxy.
  if (import.meta.env.PROD) return null
  return "" // dev: proxy do Vite encaminha /api -> f1-api
}

export function mediaUrl(
  url: string | null | undefined,
  width: number,
): string | null {
  if (!url) return null
  const origin = apiOrigin()
  if (origin === null) return url
  return `${origin}/api/v1/media/proxy?url=${encodeURIComponent(url)}&w=${width}`
}
