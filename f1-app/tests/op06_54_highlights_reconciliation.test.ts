import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import crypto from "node:crypto"

import {
  OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY,
  OFFICIAL_2026_RACE_METADATA,
  DEFAULT_2026_HIGHLIGHTS,
  selectRaceHighlights,
  type HighlightRaceCandidate,
} from "../src/lib/highlights"

const MOCK_2026_RACES: HighlightRaceCandidate[] = [
  { id: 846, round: 1, series: "f1", name: "Australian Grand Prix", date: "2026-03-08", circuit_country: "Australia" },
  { id: 848, round: 2, series: "f1", name: "Chinese Grand Prix", date: "2026-03-15", circuit_country: "China" },
  { id: 850, round: 17, series: "f1", name: "Singapore Grand Prix", date: "2026-10-11", circuit_country: "Singapura" },
  { id: 939, round: 18, series: "f1", name: "United States Grand Prix", date: "2026-10-25", circuit_country: "Estados Unidos" },
  { id: 940, round: 19, series: "f1", name: "GP do México (Cidade do México)", date: "2026-11-01", circuit_country: "México" },
  { id: 941, round: 20, series: "f1", name: "GP do Brasil (São Paulo - Interlagos)", date: "2026-11-08", circuit_country: "Brasil" },
  { id: 942, round: 21, series: "f1", name: "Las Vegas Grand Prix", date: "2026-11-21", circuit_country: "Estados Unidos" },
]

test("1. Teste de seleção dos três últimos GPs concluídos (09/11/2026: R20, R19, R18)", () => {
  const refDate = new Date("2026-11-09T12:00:00Z")
  const selected = selectRaceHighlights(MOCK_2026_RACES, {
    referenceDate: refDate,
    completedRaces: 20,
  })
  assert.equal(selected.length, 3, "Deve selecionar exatamente 3 corridas")
  assert.equal(selected[0].round, 20, "Primeira deve ser Round 20 (São Paulo)")
  assert.equal(selected[1].round, 19, "Segunda deve ser Round 19 (México)")
  assert.equal(selected[2].round, 18, "Terceira deve ser Round 18 (EUA)")
})

test("2. Teste de exclusão de fixtures", () => {
  const racesWithFixture: HighlightRaceCandidate[] = [
    ...MOCK_2026_RACES,
    { id: 9999, round: 99, series: "demo", name: "Demonstrative Race", date: "2026-10-30" },
  ]
  const refDate = new Date("2026-11-09T12:00:00Z")
  const selected = selectRaceHighlights(racesWithFixture, {
    referenceDate: refDate,
    completedRaces: 20,
  })
  assert.equal(selected.length, 3)
  assert.equal(selected[0].round, 20)
  assert.ok(!selected.some((r) => r.round === 99), "Nenhuma corrida de demonstração deve entrar")
})

test("3. Teste de exclusão de corridas futuras", () => {
  const refDate = new Date("2026-11-09T12:00:00Z")
  const selected = selectRaceHighlights(MOCK_2026_RACES, {
    referenceDate: refDate,
    completedRaces: 20,
  })
  assert.ok(!selected.some((r) => r.round === 21), "GP de Las Vegas (futuro) deve ser excluído")
})

test("4. Teste de exclusão de sessões Sprint, treino e classificação", () => {
  const racesWithSessions: HighlightRaceCandidate[] = [
    ...MOCK_2026_RACES,
    { id: 9401, round: 19, series: "f1-sprint", name: "Sprint Shootout México", date: "2026-10-31" },
    { id: 9402, round: 19, series: "f1-practice", name: "Practice 1 México", date: "2026-10-30" },
  ]
  const refDate = new Date("2026-11-09T12:00:00Z")
  const selected = selectRaceHighlights(racesWithSessions, {
    referenceDate: refDate,
    completedRaces: 20,
  })
  assert.deepEqual(
    selected.map((r) => r.round),
    [20, 19, 18],
    "Apenas corridas principais da F1 entram sem duplicidade",
  )
})

test("5. Teste de reconciliação factual com fonte oficial", () => {
  assert.ok(OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY[17], "Round 17 possui registro oficial")
  assert.equal(OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY[17].youtubeId, "ohgEehLtucc")
  assert.equal(OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY[17].duration, "8:01")

  assert.ok(OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY[18], "Round 18 possui registro oficial")
  assert.equal(OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY[18].youtubeId, "srLm23RUAH0")
  assert.equal(OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY[18].duration, "8:02")

  assert.ok(OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY[19], "Round 19 possui registro oficial")
  assert.equal(OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY[19].youtubeId, "tIiRK7hKScU")
  assert.equal(OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY[19].duration, "8:08")

  assert.ok(OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY[20], "Round 20 possui registro oficial")
  assert.equal(OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY[20].youtubeId, "lkb5kqDJYXk")
  assert.equal(OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY[20].duration, "8:11")

  assert.equal(OFFICIAL_2026_RACE_METADATA[17].dateStr, "11 de Outubro de 2026")
  assert.equal(OFFICIAL_2026_RACE_METADATA[18].dateStr, "25 de Outubro de 2026")
  assert.equal(OFFICIAL_2026_RACE_METADATA[19].dateStr, "01 de Novembro de 2026")
  assert.equal(OFFICIAL_2026_RACE_METADATA[20].dateStr, "08 de Novembro de 2026")
})

test("6. Teste de cards com vídeos oficiais confirmados (Rounds 20, 19, 18 e 17)", () => {
  for (const round of [17, 18, 19, 20]) {
    const entry = OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY[round]
    assert.ok(entry?.youtubeId && entry.youtubeId.length === 11, `Vídeo do Round ${round} tem ID válido`)
  }

  assert.deepEqual(
    DEFAULT_2026_HIGHLIGHTS.map((h) => h.round),
    [20, 19, 18],
    "DEFAULT_2026_HIGHLIGHTS deve exibir Rounds 20, 19 e 18 em ordem cronológica decrescente",
  )

  const defaultR20 = DEFAULT_2026_HIGHLIGHTS.find((h) => h.round === 20)
  assert.equal(defaultR20?.youtubeId, "lkb5kqDJYXk", "Card de São Paulo possui youtubeId oficial comprovado")
  assert.equal(defaultR20?.youtubeUrl, "https://www.youtube.com/watch?v=lkb5kqDJYXk")
  assert.equal(defaultR20?.duration, "8:11")
})

test("7. Teste de fallback para próxima corrida concluída com vídeo oficial disponível", () => {
  // Cenário: Round 21 concluída na data, porém ainda sem vídeo oficial no registro
  const afterLasVegas = new Date("2026-11-22T12:00:00Z")
  const selected = selectRaceHighlights(MOCK_2026_RACES, {
    referenceDate: afterLasVegas,
    completedRaces: 21,
  })
  assert.deepEqual(
    selected.map((h) => h.round),
    [20, 19, 18],
    "Sem vídeo oficial para R21, deve utilizar as próximas corridas concluídas com vídeo oficial (R20, R19, R18)",
  )
  assert.ok(selected.every((h) => Boolean(h.youtubeId)), "Todos os 3 destaques selecionados possuem vídeo oficial")
})

test("8. Teste de integridade visual e ausência de IDs históricos de 2024", () => {
  const componentContent = fs.readFileSync(
    new URL("../src/components/race-highlights-cards.tsx", import.meta.url),
    "utf-8",
  )
  const libContent = fs.readFileSync(
    new URL("../src/lib/highlights.ts", import.meta.url),
    "utf-8",
  )

  for (const text of [componentContent, libContent]) {
    assert.ok(!text.includes("L7eQjBvV3oQ"), "Vídeo de 2024 L7eQjBvV3oQ não pode estar presente")
    assert.ok(!text.includes("dGzF9Y_7qKM"), "Vídeo de 2024 dGzF9Y_7qKM não pode estar presente")
    assert.ok(!text.includes("jfN1B9m4vV8"), "Vídeo de 2024 jfN1B9m4vV8 não pode estar presente")
  }

  assert.ok(componentContent.includes("Vídeo oficial ainda não disponível"))
  assert.ok(!componentContent.includes("Vídeo oficial em processamento"))
})

test("9. Teste de regressão da Home (layout e componentes)", () => {
  const dashboardContent = fs.readFileSync(new URL("../src/pages/dashboard.tsx", import.meta.url), "utf-8")
  const layoutContent = fs.readFileSync(new URL("../src/components/layout.tsx", import.meta.url), "utf-8")
  assert.ok(dashboardContent.includes("RaceHighlightsCards"), "Dashboard deve renderizar RaceHighlightsCards")
  assert.ok(dashboardContent.includes("NextRaceCard"), "Dashboard deve renderizar NextRaceCard")
  assert.ok(
    layoutContent.includes("ALÉM DA PISTA") || layoutContent.includes("Além da Pista"),
    "Layout global deve conter a identidade oficial Além da Pista",
  )
})

test("10. Integridade da logo original (multi-series-logo.png)", () => {
  const EXPECTED_HASH = "5c32eef9a739f4613b66622913f4fc67422f276bd0cdea2b00581be287414118"
  const logoBuffer = fs.readFileSync(new URL("../public/multi-series-logo.png", import.meta.url))
  const actualHash = crypto.createHash("sha256").update(logoBuffer).digest("hex")
  assert.equal(actualHash, EXPECTED_HASH, "O hash SHA-256 da logo original deve ser rigorosamente idêntico")
})
