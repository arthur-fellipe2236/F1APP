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

// Registro oficial controlado de vídeos da Temporada 2026 do canal FORMULA 1 (@Formula1)
// Diretrizes da OP-06.54 e OP-06.70:
// - Somente vídeos oficiais da FOM da temporada 2026 do canal @Formula1 (UCB_qr75-ydFVKSF9Dmo6izg) são cadastrados.
// - IDs confirmados:
//   - Round 17 (Singapura, 11/10/2026): "ohgEehLtucc" (8:01)
//   - Round 18 (Estados Unidos, 25/10/2026): "srLm23RUAH0" (8:02)
//   - Round 19 (México, 01/11/2026): "tIiRK7hKScU" (8:08)
// - Round 20 (Brasil, 08/11/2026): Vídeo oficial de melhores momentos ainda não disponível no canal oficial.
export const OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY: Record<number, { youtubeId: string; duration?: string }> = {
  17: { youtubeId: "ohgEehLtucc", duration: "8:01" },
  18: { youtubeId: "srLm23RUAH0", duration: "8:02" },
  19: { youtubeId: "tIiRK7hKScU", duration: "8:08" },
}

// Metadados editoriais oficiais curados da Temporada 2026 (formula1.com)
// Isola o pipeline editorial de qualquer discrepância de formatação ou seed interno
export const OFFICIAL_2026_RACE_METADATA: Record<number, { name: string; country: string; dateStr: string }> = {
  17: { name: "Grande Prêmio de Singapura", country: "Singapura", dateStr: "11 de Outubro de 2026" },
  18: { name: "Grande Prêmio dos Estados Unidos", country: "Estados Unidos", dateStr: "25 de Outubro de 2026" },
  19: { name: "Grande Prêmio da Cidade do México", country: "México", dateStr: "01 de Novembro de 2026" },
  20: { name: "Grande Prêmio de São Paulo", country: "Brasil", dateStr: "08 de Novembro de 2026" },
}

// Três corridas mais recentes efetivamente concluídas da temporada 2026 da Fórmula 1
// (Rounds 19, 18 e 17 - Auditadas com resultados confirmados no calendário oficial da F1)
export const DEFAULT_2026_HIGHLIGHTS: HighlightVideo[] = [
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
  {
    id: "f1-2026-r17",
    round: 17,
    gpName: "Grande Prêmio de Singapura",
    country: "Singapura",
    season: 2026,
    date: "11 de Outubro de 2026",
    youtubeId: OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY[17]?.youtubeId ?? null,
    youtubeUrl: OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY[17]?.youtubeId
      ? `https://www.youtube.com/watch?v=${OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY[17].youtubeId}`
      : null,
    duration: OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY[17]?.duration,
  },
]
