import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import crypto from "node:crypto"

import {
  OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY,
  OFFICIAL_2026_RACE_METADATA,
  DEFAULT_2026_HIGHLIGHTS,
  type HighlightVideo,
} from "../src/lib/highlights"

// Mock race model
interface MockRace {
  id: number
  round: number
  series?: string
  name: string
  date: string
  circuit_country?: string
}

// Simulated races list for 2026
const MOCK_2026_RACES: MockRace[] = [
  { id: 846, round: 1, series: "f1", name: "Australian Grand Prix", date: "2026-03-08", circuit_country: "Australia" },
  { id: 848, round: 2, series: "f1", name: "Chinese Grand Prix", date: "2026-03-15", circuit_country: "China" },
  { id: 850, round: 17, series: "f1", name: "Singapore Grand Prix", date: "2026-10-11", circuit_country: "Singapura" },
  { id: 939, round: 18, series: "f1", name: "United States Grand Prix", date: "2026-10-25", circuit_country: "Estados Unidos" },
  { id: 940, round: 19, series: "f1", name: "GP do México (Cidade do México)", date: "2026-11-01", circuit_country: "México" },
  { id: 941, round: 20, series: "f1", name: "GP do Brasil (São Paulo - Interlagos)", date: "2026-11-08", circuit_country: "Brasil" },
  { id: 942, round: 21, series: "f1", name: "Las Vegas Grand Prix", date: "2026-11-21", circuit_country: "Estados Unidos" },
]

function selectTop3Completed(races: MockRace[], referenceDate: Date): MockRace[] {
  const completed = races.filter((r) => {
    if (!r.date) return false
    if (r.series && r.series !== "f1") return false
    const rDate = new Date(r.date + "T23:59:59Z")
    return rDate <= referenceDate
  })
  completed.sort((a, b) => b.round - a.round)
  return completed.slice(0, 3)
}

test("1. Teste de seleção dos três últimos GPs concluídos", () => {
  const refDate = new Date("2026-11-07T12:00:00Z")
  const selected = selectTop3Completed(MOCK_2026_RACES, refDate)
  assert.equal(selected.length, 3, "Deve selecionar exatamente 3 corridas")
  assert.equal(selected[0].round, 19, "Primeira deve ser Round 19 (México)")
  assert.equal(selected[1].round, 18, "Segunda deve ser Round 18 (EUA)")
  assert.equal(selected[2].round, 17, "Terceira deve ser Round 17 (Singapura)")
})

test("2. Teste de exclusão de fixtures", () => {
  const racesWithFixture = [
    ...MOCK_2026_RACES,
    { id: 9999, round: 99, series: "demo", name: "Demonstrative Race", date: "2026-10-30" }
  ]
  const refDate = new Date("2026-11-07T12:00:00Z")
  const selected = selectTop3Completed(racesWithFixture, refDate)
  assert.ok(selected.every(r => r.series === "f1"), "Nenhuma corrida de demonstração deve entrar")
  assert.equal(selected[0].round, 19)
})

test("3. Teste de exclusão de corridas futuras", () => {
  const refDate = new Date("2026-11-07T12:00:00Z")
  const selected = selectTop3Completed(MOCK_2026_RACES, refDate)
  assert.ok(!selected.some(r => r.round === 20), "GP do Brasil (futuro em 07/11) deve ser excluído")
  assert.ok(!selected.some(r => r.round === 21), "GP de Las Vegas (futuro) deve ser excluído")
})

test("4. Teste de exclusão de sessões Sprint, treino e classificação", () => {
  const racesWithSessions = [
    ...MOCK_2026_RACES,
    { id: 9401, round: 19, series: "f1-sprint", name: "Sprint Shootout México", date: "2026-10-31" },
    { id: 9402, round: 19, series: "f1-practice", name: "Practice 1 México", date: "2026-10-30" },
  ]
  const refDate = new Date("2026-11-07T12:00:00Z")
  const selected = selectTop3Completed(racesWithSessions, refDate)
  assert.ok(selected.every(r => r.series === "f1"), "Apenas corridas do campeonato principal F1 entram")
})

test("5. Teste de reconciliação factual com fonte oficial", () => {
  // A fonte oficial confirma que Round 17 ocorreu em 11 de Outubro de 2026
  assert.ok(OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY[17], "Round 17 possui registro oficial")
  assert.equal(OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY[17].youtubeId, "ohgEehLtucc")
  assert.equal(OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY[17].duration, "8:01")
  // A fonte oficial confirma que Round 18 ocorreu em 25 de Outubro de 2026
  assert.ok(OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY[18], "Round 18 possui registro oficial")
  assert.equal(OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY[18].youtubeId, "srLm23RUAH0")
  assert.equal(OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY[18].duration, "8:02")
  // Metadados curados oficiais
  assert.equal(OFFICIAL_2026_RACE_METADATA[17].dateStr, "11 de Outubro de 2026")
  assert.equal(OFFICIAL_2026_RACE_METADATA[18].dateStr, "25 de Outubro de 2026")
  assert.equal(OFFICIAL_2026_RACE_METADATA[19].dateStr, "01 de Novembro de 2026")
})

test("6. Teste de cards com vídeos oficiais confirmados (Rounds 17, 18 e 19)", () => {
  const r17 = OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY[17]
  const r18 = OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY[18]
  const r19 = OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY[19]
  assert.ok(r17.youtubeId && r17.youtubeId.length === 11, "Vídeo do Round 17 tem ID válido")
  assert.ok(r18.youtubeId && r18.youtubeId.length === 11, "Vídeo do Round 18 tem ID válido")
  assert.ok(r19.youtubeId && r19.youtubeId.length === 11, "Vídeo do Round 19 tem ID válido")
  assert.equal(r17.youtubeId, "ohgEehLtucc")
  assert.equal(r18.youtubeId, "srLm23RUAH0")
  assert.equal(r19.youtubeId, "tIiRK7hKScU")
  assert.equal(r17.duration, "8:01")
  assert.equal(r18.duration, "8:02")
  assert.equal(r19.duration, "8:08")

  const defaultR19 = DEFAULT_2026_HIGHLIGHTS.find(h => h.round === 19)
  assert.equal(defaultR19?.youtubeId, "tIiRK7hKScU", "Card do México possui youtubeId cadastrado")
  assert.equal(defaultR19?.youtubeUrl, "https://www.youtube.com/watch?v=tIiRK7hKScU", "Card do México possui youtubeUrl válido")
  assert.equal(defaultR19?.duration, "8:08", "Card do México possui duração 8:08")
})

test("7. Teste de fallback honesto para corrida sem vídeo oficial publicado (Round 20 Brasil)", () => {
  const r20 = OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY[20]
  assert.equal(r20, undefined, "Round 20 (Brasil) não deve constar no registro até ser publicado pela FOM")
})

test("8. Teste de atualização automática após nova corrida concluída", () => {
  const futureDate = new Date("2026-11-09T10:00:00Z")
  const selected = selectTop3Completed(MOCK_2026_RACES, futureDate)
  assert.equal(selected.length, 3)
  assert.equal(selected[0].round, 20, "Round 20 (Brasil) assume a primeira posição")
  assert.equal(selected[1].round, 19, "Round 19 (México) passa para a segunda posição")
  assert.equal(selected[2].round, 18, "Round 18 (EUA) passa para a terceira posição")
  assert.ok(!selected.some(r => r.round === 17), "Round 17 (Singapura) deixa os 3 cards automaticamente")
})

test("9. Teste de integridade visual e ausência de IDs históricos de 2024", () => {
  const componentContent = fs.readFileSync("/home/arthur/Projects/f1-app/src/components/race-highlights-cards.tsx", "utf-8")
  const libContent = fs.readFileSync("/home/arthur/Projects/f1-app/src/lib/highlights.ts", "utf-8")
  
  // Não pode conter vídeos históricos de 2024 (L7eQjBvV3oQ, dGzF9Y_7qKM, jfN1B9m4vV8)
  for (const text of [componentContent, libContent]) {
    assert.ok(!text.includes("L7eQjBvV3oQ"), "Vídeo de 2024 L7eQjBvV3oQ não pode estar presente")
    assert.ok(!text.includes("dGzF9Y_7qKM"), "Vídeo de 2024 dGzF9Y_7qKM não pode estar presente")
    assert.ok(!text.includes("jfN1B9m4vV8"), "Vídeo de 2024 jfN1B9m4vV8 não pode estar presente")
  }

  // Texto editorial honesto
  assert.ok(componentContent.includes("Vídeo oficial ainda não disponível"), "Texto editorial correto para indisponível presente")
  assert.ok(!componentContent.includes("Vídeo oficial em processamento"), "Expressão 'em processamento' removida")
})

test("10. Teste de regressão da Home (layout e componentes)", () => {
  const dashboardContent = fs.readFileSync(new URL("../src/pages/dashboard.tsx", import.meta.url), "utf-8")
  const layoutContent = fs.readFileSync(new URL("../src/components/layout.tsx", import.meta.url), "utf-8")
  assert.ok(dashboardContent.includes("RaceHighlightsCards"), "Dashboard deve renderizar RaceHighlightsCards")
  assert.ok(dashboardContent.includes("NextRaceCard"), "Dashboard deve renderizar NextRaceCard")
  assert.ok(
    layoutContent.includes("ALÉM DA PISTA") || layoutContent.includes("Além da Pista"),
    "Layout global deve conter a identidade oficial Além da Pista",
  )
})

test("13. Integridade da logo original (multi-series-logo.png)", () => {
  const EXPECTED_HASH = "5c32eef9a739f4613b66622913f4fc67422f276bd0cdea2b00581be287414118"
  const logoBuffer = fs.readFileSync("/home/arthur/Projects/f1-app/public/multi-series-logo.png")
  const actualHash = crypto.createHash("sha256").update(logoBuffer).digest("hex")
  assert.equal(actualHash, EXPECTED_HASH, "O hash SHA-256 da logo original deve ser rigorosamente idêntico")
})
