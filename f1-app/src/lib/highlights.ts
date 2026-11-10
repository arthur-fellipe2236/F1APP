export interface HighlightVideo {
  id: string
  round: number
  gpName: string
  country: string
  season: number
  date: string
  youtubeId: string | null
  youtubeUrl: string | null
  duration?: string
}

export interface HighlightRaceCandidate {
  id?: number
  round: number
  series?: string
  name: string
  date: string | null
  circuit_country?: string | null
  is_testing?: boolean
}

export interface SelectHighlightsOptions {
  completedRaces?: number | null
  referenceDate?: Date
  registry?: Record<number, { youtubeId: string; duration?: string }>
}

// Registro oficial controlado de vídeos da Temporada 2026 do canal FORMULA 1 (@Formula1)
// Diretrizes da OP-06.54, OP-06.70 e OP-06.53:
// - Somente vídeos oficiais da FOM da temporada 2026 do canal @Formula1 (UCB_qr75-ydFVKSF9Dmo6izg) são cadastrados.
// - IDs confirmados via metadados oficiais do YouTube (@Formula1):
//   - Round 17 (Singapura, 11/10/2026): "ohgEehLtucc" (8:01) — Race Highlights | 2026 Singapore Grand Prix
//   - Round 18 (Estados Unidos, 25/10/2026): "srLm23RUAH0" (8:02) — Race Highlights | 2026 United States Grand Prix
//   - Round 19 (México, 01/11/2026): "tIiRK7hKScU" (8:08) — Race Highlights | 2026 Mexico City Grand Prix
//   - Round 20 (São Paulo, 08/11/2026): "lkb5kqDJYXk" (8:11) — Race Highlights | 2026 Sao Paulo Grand Prix
export const OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY: Record<number, { youtubeId: string; duration?: string }> = {
  17: { youtubeId: "ohgEehLtucc", duration: "8:01" },
  18: { youtubeId: "srLm23RUAH0", duration: "8:02" },
  19: { youtubeId: "tIiRK7hKScU", duration: "8:08" },
  20: { youtubeId: "lkb5kqDJYXk", duration: "8:11" },
}

// Metadados editoriais oficiais curados da Temporada 2026 (formula1.com)
// Isola o pipeline editorial de qualquer discrepância de formatação ou seed interno
export const OFFICIAL_2026_RACE_METADATA: Record<number, { name: string; country: string; dateStr: string }> = {
  17: { name: "Grande Prêmio de Singapura", country: "Singapura", dateStr: "11 de Outubro de 2026" },
  18: { name: "Grande Prêmio dos Estados Unidos", country: "Estados Unidos", dateStr: "25 de Outubro de 2026" },
  19: { name: "Grande Prêmio da Cidade do México", country: "México", dateStr: "01 de Novembro de 2026" },
  20: { name: "Grande Prêmio de São Paulo", country: "Brasil", dateStr: "08 de Novembro de 2026" },
}

export function mapRaceToHighlightVideo(
  race: HighlightRaceCandidate,
  registry: Record<number, { youtubeId: string; duration?: string }> = OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY,
): HighlightVideo {
  const reg = registry[race.round]
  const yId = reg?.youtubeId ?? null
  const meta = OFFICIAL_2026_RACE_METADATA[race.round]

  let dateStr = meta?.dateStr
  if (!dateStr) {
    try {
      if (race.date) {
        const parts = race.date.split("-")
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
        dateStr = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
      }
    } catch {
      dateStr = race.date || "2026"
    }
  }

  return {
    id: `f1-2026-r${race.round}`,
    round: race.round,
    gpName: meta?.name ?? race.name,
    country: meta?.country ?? race.circuit_country ?? "F1",
    season: 2026,
    date: dateStr || "2026",
    youtubeId: yId,
    youtubeUrl: yId ? `https://www.youtube.com/watch?v=${yId}` : null,
    duration: reg?.duration,
  }
}

/**
 * Seleciona os 3 destaques das corridas concluídas da temporada 2026 da Fórmula 1:
 * - Considera apenas corridas principais da F1 efetivamente concluídas (excluindo testes, sprints e etapas futuras).
 * - Prioriza corridas concluídas que possuam vídeo oficial verificável no registro (@Formula1).
 * - Se não houver vídeo oficial verificável para uma corrida concluída, utiliza a próxima corrida concluída
 *   que tenha vídeo oficial disponível, preservando os três destaques e a ordem cronológica decrescente.
 */
export function selectRaceHighlights(
  races: readonly HighlightRaceCandidate[],
  options: SelectHighlightsOptions = {},
): HighlightVideo[] {
  const referenceDate = options.referenceDate ?? new Date()
  const completedRaces = options.completedRaces
  const registry = options.registry ?? OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY

  const seenRounds = new Set<number>()
  const completed: HighlightRaceCandidate[] = []

  for (const r of races) {
    if (!r || !r.date) continue
    if (r.is_testing) continue
    if (typeof r.round !== "number" || r.round <= 0) continue
    if (r.series && r.series !== "f1") continue
    if (typeof completedRaces === "number" && completedRaces > 0 && r.round > completedRaces) {
      continue
    }
    const rDate = new Date(r.date + "T23:59:59Z")
    if (Number.isNaN(rDate.getTime()) || rDate > referenceDate) continue
    if (seenRounds.has(r.round)) continue
    seenRounds.add(r.round)
    completed.push(r)
  }

  // Ordem cronológica decrescente (mais recente para mais antiga)
  completed.sort((a, b) => b.round - a.round)

  const withOfficialVideo = completed.filter((r) => Boolean(registry[r.round]?.youtubeId))

  let selected: HighlightRaceCandidate[]
  if (withOfficialVideo.length >= 3) {
    selected = withOfficialVideo.slice(0, 3)
  } else {
    const selectedRounds = new Set(withOfficialVideo.map((r) => r.round))
    const fallbackRaces = completed.filter((r) => !selectedRounds.has(r.round))
    selected = [...withOfficialVideo, ...fallbackRaces].slice(0, 3)
    selected.sort((a, b) => b.round - a.round)
  }

  return selected.map((r) => mapRaceToHighlightVideo(r, registry))
}

// Três corridas mais recentes efetivamente concluídas da temporada 2026 da Fórmula 1
// com vídeo oficial disponível (Rounds 20, 19 e 18 - Ordem cronológica decrescente)
export const DEFAULT_2026_HIGHLIGHTS: HighlightVideo[] = [
  {
    id: "f1-2026-r20",
    round: 20,
    gpName: "Grande Prêmio de São Paulo",
    country: "Brasil",
    season: 2026,
    date: "08 de Novembro de 2026",
    youtubeId: OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY[20]?.youtubeId ?? null,
    youtubeUrl: OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY[20]?.youtubeId
      ? `https://www.youtube.com/watch?v=${OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY[20].youtubeId}`
      : null,
    duration: OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY[20]?.duration,
  },
  {
    id: "f1-2026-r19",
    round: 19,
    gpName: "Grande Prêmio da Cidade do México",
    country: "México",
    season: 2026,
    date: "01 de Novembro de 2026",
    youtubeId: OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY[19]?.youtubeId ?? null,
    youtubeUrl: OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY[19]?.youtubeId
      ? `https://www.youtube.com/watch?v=${OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY[19].youtubeId}`
      : null,
    duration: OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY[19]?.duration,
  },
  {
    id: "f1-2026-r18",
    round: 18,
    gpName: "Grande Prêmio dos Estados Unidos",
    country: "Estados Unidos",
    season: 2026,
    date: "25 de Outubro de 2026",
    youtubeId: OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY[18]?.youtubeId ?? null,
    youtubeUrl: OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY[18]?.youtubeId
      ? `https://www.youtube.com/watch?v=${OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY[18].youtubeId}`
      : null,
    duration: OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY[18]?.duration,
  },
]
