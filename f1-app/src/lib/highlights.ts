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
  circuit_city?: string | null
  is_testing?: boolean
  is_cancelled?: boolean
  is_postponed?: boolean
  has_results?: boolean
  is_completed?: boolean
  session_type?: string
  youtube_id?: string | null
  duration?: string | null
  highlight_video?: {
    youtube_id?: string | null
    youtube_url?: string | null
    duration?: string | null
  } | null
}

export interface SelectHighlightsOptions {
  completedRaces?: number | null
  referenceDate?: Date
  registry?: Record<number, { youtubeId: string; duration?: string }>
}

// Registro oficial controlado de vídeos da Temporada 2026 do canal FORMULA 1 (@Formula1, UCB_qr75-ydFVKSF9Dmo6izg)
// Diretrizes da OP-06.54, OP-06.70, OP-06.53 e OP-09.04:
// - Somente vídeos oficiais da FOM ("Race Highlights | 2026 <GP>") do canal @Formula1 são cadastrados.
// - IDs confirmados via feed Atom oficial do YouTube (@Formula1) e formula1.com:
//   - Round 17 (Singapura, 11/10/2026): "ohgEehLtucc" (8:01) — Race Highlights | 2026 Singapore Grand Prix
//   - Round 18 (Estados Unidos, 25/10/2026): "srLm23RUAH0" (8:02) — Race Highlights | 2026 United States Grand Prix
//   - Round 19 (México, 01/11/2026): "tIiRK7hKScU" (8:08) — Race Highlights | 2026 Mexico City Grand Prix
//   - Round 20 (São Paulo, 08/11/2026): "lkb5kqDJYXk" (8:11) — Race Highlights | 2026 Sao Paulo Grand Prix
//   - Round 21 (Las Vegas, 21/11/2026): "Vyk_6bNm7lo" (8:13) — Race Highlights | 2026 Las Vegas Grand Prix
export const OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY: Record<number, { youtubeId: string; duration?: string }> = {
  17: { youtubeId: "ohgEehLtucc", duration: "8:01" },
  18: { youtubeId: "srLm23RUAH0", duration: "8:02" },
  19: { youtubeId: "tIiRK7hKScU", duration: "8:08" },
  20: { youtubeId: "lkb5kqDJYXk", duration: "8:11" },
  21: { youtubeId: "Vyk_6bNm7lo", duration: "8:13" },
}

// Metadados editoriais oficiais curados da Temporada 2026 (formula1.com)
export const OFFICIAL_2026_RACE_METADATA: Record<number, { name: string; country: string; dateStr: string }> = {
  17: { name: "Grande Prêmio de Singapura", country: "Singapura", dateStr: "11 de Outubro de 2026" },
  18: { name: "Grande Prêmio dos Estados Unidos", country: "Estados Unidos", dateStr: "25 de Outubro de 2026" },
  19: { name: "Grande Prêmio da Cidade do México", country: "México", dateStr: "01 de Novembro de 2026" },
  20: { name: "Grande Prêmio de São Paulo", country: "Brasil", dateStr: "08 de Novembro de 2026" },
  21: { name: "Grande Prêmio de Las Vegas", country: "Estados Unidos", dateStr: "21 de Novembro de 2026" },
}

const GP_NAME_PT_BY_KEYWORD: ReadonlyArray<readonly [string, { name: string; country: string }]> = [
  ["las vegas", { name: "Grande Prêmio de Las Vegas", country: "Estados Unidos" }],
  ["sao paulo", { name: "Grande Prêmio de São Paulo", country: "Brasil" }],
  ["interlagos", { name: "Grande Prêmio de São Paulo", country: "Brasil" }],
  ["brasil", { name: "Grande Prêmio de São Paulo", country: "Brasil" }],
  ["mexico", { name: "Grande Prêmio da Cidade do México", country: "México" }],
  ["united states", { name: "Grande Prêmio dos Estados Unidos", country: "Estados Unidos" }],
  ["austin", { name: "Grande Prêmio dos Estados Unidos", country: "Estados Unidos" }],
  ["singapore", { name: "Grande Prêmio de Singapura", country: "Singapura" }],
  ["singapura", { name: "Grande Prêmio de Singapura", country: "Singapura" }],
  ["qatar", { name: "Grande Prêmio do Catar", country: "Catar" }],
  ["catar", { name: "Grande Prêmio do Catar", country: "Catar" }],
  ["abu dhabi", { name: "Grande Prêmio de Abu Dhabi", country: "Emirados Árabes Unidos" }],
  ["bahrain", { name: "Grande Prêmio do Bahrein", country: "Bahrein" }],
  ["azerbaijan", { name: "Grande Prêmio do Azerbaijão", country: "Azerbaijão" }],
  ["italian", { name: "Grande Prêmio da Itália", country: "Itália" }],
  ["dutch", { name: "Grande Prêmio dos Países Baixos", country: "Países Baixos" }],
  ["hungarian", { name: "Grande Prêmio da Hungria", country: "Hungria" }],
  ["belgian", { name: "Grande Prêmio da Bélgica", country: "Bélgica" }],
  ["british", { name: "Grande Prêmio da Grã-Bretanha", country: "Reino Unido" }],
  ["austrian", { name: "Grande Prêmio da Áustria", country: "Áustria" }],
  ["barcelona", { name: "Grande Prêmio de Barcelona", country: "Espanha" }],
  ["spanish", { name: "Grande Prêmio da Espanha", country: "Espanha" }],
  ["monaco", { name: "Grande Prêmio de Mônaco", country: "Mônaco" }],
  ["canadian", { name: "Grande Prêmio do Canadá", country: "Canadá" }],
  ["miami", { name: "Grande Prêmio de Miami", country: "Estados Unidos" }],
  ["japanese", { name: "Grande Prêmio do Japão", country: "Japão" }],
  ["chinese", { name: "Grande Prêmio da China", country: "China" }],
  ["australian", { name: "Grande Prêmio da Austrália", country: "Austrália" }],
]

const COUNTRY_PT_MAP: Record<string, string> = {
  usa: "Estados Unidos",
  "united states": "Estados Unidos",
  brazil: "Brasil",
  brasil: "Brasil",
  mexico: "México",
  "méxico": "México",
  singapore: "Singapura",
  singapura: "Singapura",
  qatar: "Catar",
  catar: "Catar",
  uae: "Emirados Árabes Unidos",
  "united arab emirates": "Emirados Árabes Unidos",
  "emirados árabes unidos": "Emirados Árabes Unidos",
  australia: "Austrália",
  china: "China",
  japan: "Japão",
}

const NON_MAIN_RACE_SESSION_TYPES = new Set([
  "sprint",
  "sprint_qualifying",
  "sprint_shootout",
  "qualifying",
  "practice",
  "fp1",
  "fp2",
  "fp3",
  "testing",
])

function normalizeAscii(value: string | null | undefined): string {
  if (!value) return ""
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

function resolveEditorialNameAndCountry(race: HighlightRaceCandidate): { name: string; country: string } {
  const normName = normalizeAscii(race.name)
  for (const [kw, editorial] of GP_NAME_PT_BY_KEYWORD) {
    if (normName.includes(kw)) {
      return editorial
    }
  }
  const meta = OFFICIAL_2026_RACE_METADATA[race.round]
  const rawCountry = race.circuit_country?.trim() || ""
  const mappedCountry = COUNTRY_PT_MAP[normalizeAscii(rawCountry)] || rawCountry
  return {
    name: meta?.name ?? race.name,
    country: mappedCountry || meta?.country || "F1",
  }
}

export function mapRaceToHighlightVideo(
  race: HighlightRaceCandidate,
  registry: Record<number, { youtubeId: string; duration?: string }> = OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY,
): HighlightVideo {
  const dynamicVideoId = race.highlight_video?.youtube_id ?? race.youtube_id ?? null
  const dynamicDuration = race.highlight_video?.duration ?? race.duration ?? undefined
  const reg = registry[race.round]
  const yId = dynamicVideoId || reg?.youtubeId || null
  const duration = dynamicDuration || reg?.duration
  const meta = OFFICIAL_2026_RACE_METADATA[race.round]
  const editorial = resolveEditorialNameAndCountry(race)

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
    gpName: editorial.name,
    country: editorial.country,
    season: 2026,
    date: dateStr || "2026",
    youtubeId: yId,
    youtubeUrl: yId ? `https://www.youtube.com/watch?v=${yId}` : null,
    duration,
  }
}

function hasOfficialVideoForRace(
  race: HighlightRaceCandidate,
  registry: Record<number, { youtubeId: string; duration?: string }>,
): boolean {
  const dynamicId = race.highlight_video?.youtube_id ?? race.youtube_id
  if (typeof dynamicId === "string" && dynamicId.trim().length === 11) {
    return true
  }
  return Boolean(registry[race.round]?.youtubeId)
}

/**
 * Seleciona os 3 destaques das corridas principais concluídas da temporada 2026 da Fórmula 1:
 * - Considera apenas corridas principais (Grand Prix) da F1 efetivamente concluídas.
 * - Exclui testes de pré-temporada, corridas sprint, classificações, treinos livres,
 *   corridas canceladas/adiadas e etapas futuras.
 * - Prioriza corridas concluídas que possuam vídeo oficial verificável (via payload dinâmico
 *   do backend ou registro oficial @Formula1).
 * - Se não houver vídeo oficial verificável para uma corrida concluída, utiliza a próxima
 *   corrida concluída que tenha vídeo oficial disponível, preservando os três destaques e
 *   a ordem cronológica decrescente.
 */
export function selectRaceHighlights(
  races: readonly HighlightRaceCandidate[],
  options: SelectHighlightsOptions = {},
): HighlightVideo[] {
  const referenceDate = options.referenceDate ?? new Date()
  const completedRaces = options.completedRaces
  const registry = options.registry ?? OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY

  const hasExplicitResultsFlags =
    (completedRaces === undefined || completedRaces === null) &&
    races.some((r) => typeof r?.has_results === "boolean" || typeof r?.is_completed === "boolean")

  const seenRounds = new Set<number>()
  const completed: HighlightRaceCandidate[] = []

  for (const r of races) {
    if (!r || !r.date) continue
    if (r.is_testing || r.is_cancelled || r.is_postponed) continue
    if (typeof r.round !== "number" || r.round <= 0) continue
    if (r.series && r.series !== "f1") continue
    if (r.session_type && NON_MAIN_RACE_SESSION_TYPES.has(r.session_type.toLowerCase())) {
      continue
    }
    const normName = normalizeAscii(r.name)
    if (
      normName.includes("sprint") ||
      normName.includes("qualifying") ||
      normName.includes("practice") ||
      normName.includes("testing")
    ) {
      continue
    }
    if (typeof completedRaces === "number" && completedRaces > 0 && r.round > completedRaces) {
      continue
    }
    if (hasExplicitResultsFlags && (r.has_results === false || r.is_completed === false)) {
      continue
    }
    const rDate = new Date(r.date + "T23:59:59Z")
    if (Number.isNaN(rDate.getTime()) || rDate > referenceDate) continue
    if (seenRounds.has(r.round)) continue
    seenRounds.add(r.round)
    completed.push(r)
  }

  // Ordem cronológica decrescente (corrida concluída mais recente primeiro)
  completed.sort((a, b) => b.round - a.round)

  const withOfficialVideo = completed.filter((r) => hasOfficialVideoForRace(r, registry))

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

// Três corridas principais mais recentes efetivamente concluídas da temporada 2026 da Fórmula 1
// com vídeo oficial disponível (Rounds 21, 20 e 19 - Ordem cronológica decrescente)
export const DEFAULT_2026_HIGHLIGHTS: HighlightVideo[] = [
  {
    id: "f1-2026-r21",
    round: 21,
    gpName: "Grande Prêmio de Las Vegas",
    country: "Estados Unidos",
    season: 2026,
    date: "21 de Novembro de 2026",
    youtubeId: OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY[21]?.youtubeId ?? null,
    youtubeUrl: OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY[21]?.youtubeId
      ? `https://www.youtube.com/watch?v=${OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY[21].youtubeId}`
      : null,
    duration: OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY[21]?.duration,
  },
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
]
