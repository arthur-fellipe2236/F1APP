import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import crypto from "node:crypto"

import {
  OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY,
  DEFAULT_2026_HIGHLIGHTS,
  selectRaceHighlights,
  type HighlightRaceCandidate,
} from "../src/lib/highlights"
import { computeSeasonProgress } from "../src/lib/season-progress"

const CALENDAR_2026: HighlightRaceCandidate[] = [
  { id: 846, round: 1, series: "f1", name: "Australian Grand Prix", date: "2026-03-08", circuit_country: "Australia" },
  { id: 850, round: 17, series: "f1", name: "Singapore Grand Prix", date: "2026-10-11", circuit_country: "Singapura" },
  { id: 939, round: 18, series: "f1", name: "United States Grand Prix", date: "2026-10-25", circuit_country: "Estados Unidos" },
  { id: 940, round: 19, series: "f1", name: "Mexico City Grand Prix", date: "2026-11-01", circuit_country: "México" },
  { id: 941, round: 20, series: "f1", name: "São Paulo Grand Prix", date: "2026-11-08", circuit_country: "Brasil" },
  { id: 942, round: 21, series: "f1", name: "Las Vegas Grand Prix", date: "2026-11-21", circuit_country: "Estados Unidos" },
  { id: 943, round: 22, series: "f1", name: "Qatar Grand Prix", date: "2026-11-29", circuit_country: "Qatar" },
  { id: 944, round: 23, series: "f1", name: "Abu Dhabi Grand Prix", date: "2026-12-06", circuit_country: "UAE" },
]

test("OP-06.53 [1] Destaques exibem três corridas válidas em ordem cronológica correta (R20 -> R19 -> R18)", () => {
  const highlights = selectRaceHighlights(CALENDAR_2026, {
    completedRaces: 20,
    referenceDate: new Date("2026-11-09T18:00:00Z"),
  })

  assert.equal(highlights.length, 3)
  assert.deepEqual(
    highlights.map((h) => h.round),
    [20, 19, 18],
  )
  assert.equal(highlights[0].youtubeId, "lkb5kqDJYXk")
  assert.equal(highlights[0].duration, "8:11")
  assert.equal(highlights[1].youtubeId, "tIiRK7hKScU")
  assert.equal(highlights[1].duration, "8:08")
  assert.equal(highlights[2].youtubeId, "srLm23RUAH0")
  assert.equal(highlights[2].duration, "8:02")

  assert.deepEqual(
    DEFAULT_2026_HIGHLIGHTS.map((h) => h.round),
    [20, 19, 18],
  )
})

test("OP-06.53 [2] Quando não há vídeo oficial para uma corrida concluída, usa-se a próxima corrida concluída com vídeo oficial disponível", () => {
  // Simula registro onde R20 ainda não possui vídeo oficial, mas R19, R18 e R17 possuem
  const registryWithoutR20: Record<number, { youtubeId: string; duration?: string }> = {
    17: OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY[17],
    18: OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY[18],
    19: OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY[19],
  }

  const fallbackHighlights = selectRaceHighlights(CALENDAR_2026, {
    completedRaces: 20,
    referenceDate: new Date("2026-11-09T18:00:00Z"),
    registry: registryWithoutR20,
  })

  assert.equal(fallbackHighlights.length, 3)
  assert.deepEqual(
    fallbackHighlights.map((h) => h.round),
    [19, 18, 17],
    "Deve pular R20 sem vídeo e manter os 3 destaques com vídeo oficial em ordem cronológica (19 -> 18 -> 17)",
  )
  assert.ok(fallbackHighlights.every((h) => Boolean(h.youtubeId && h.youtubeUrl)))
})

test("OP-06.53 [3 & 6] Clique em notícia abre modal de resumo antes de redirecionamento e preserva botão 'Ler na íntegra'", () => {
  const newsComponent = fs.readFileSync(
    new URL("../src/components/race-news-cards.tsx", import.meta.url),
    "utf-8",
  )

  // O card inteiro deve ser um DialogTrigger com <button type="button">, nunca um link externo <a href=...> direto no card
  assert.ok(
    newsComponent.includes("<Dialog>") && newsComponent.includes("<DialogTrigger asChild>"),
    "NewsCard deve abrir um Dialog ao clicar no card",
  )
  assert.ok(
    newsComponent.includes('<button type="button" className="group block w-full text-left outline-none">'),
    "O gatilho do card deve ser um button que abre o modal, não um redirecionamento externo",
  )
  assert.ok(
    newsComponent.includes("<ArticleSummary"),
    "O modal deve renderizar o componente ArticleSummary com o resumo editorial",
  )
  assert.ok(
    newsComponent.includes("Ler na íntegra") &&
      newsComponent.includes('href={item.url}') &&
      newsComponent.includes('target="_blank"'),
    "O botão explícito 'Ler na íntegra' deve apontar para a URL original da matéria",
  )
  assert.ok(
    newsComponent.includes("summary_source") && newsComponent.includes("limitation_note"),
    "ArticleSummary deve exibir aviso claro quando o resumo vier de metadados editoriais",
  )
})

test("OP-06.53 [7 & 8] Contador de corridas disputadas reflete corridas com resultados confirmados (20 de 23) e exclui futuras/duplicadas", () => {
  // Mesmo que todas as 23 corridas estejam na lista do calendário (ou com registros duplicados),
  // apenas as 20 corridas com resultados confirmados entram em completedRaces
  const duplicatedCalendar = [
    ...CALENDAR_2026,
    { id: 9941, round: 20, series: "f1", name: "São Paulo Grand Prix Duplicate", date: "2026-11-08" },
  ]

  const progress = computeSeasonProgress({
    series: "f1",
    season: 2026,
    driverStandings: {
      completed_races: 20,
      total_races: 23,
      pending_results: false,
      data: [{ races: 20 }, { races: 20 }],
    },
    teamStandings: {
      completed_races: 20,
      total_races: 23,
      pending_results: false,
      data: [{ races: 20 }],
    },
    racesMeta: {
      total: 23,
      championship_total: 23,
      completed_races: 20,
      pending_results: false,
    },
    racesList: duplicatedCalendar,
  })

  assert.equal(progress.completedRaces, 20, "Deve refletir exatamente 20 corridas concluídas com resultados válidos")
  assert.equal(progress.totalRaces, 23, "Total deve ser 23 GPs oficiais sem duplicidade")
  assert.equal(progress.remainingRaces, 3, "Devem restar 3 GPs (Las Vegas, Catar, Abu Dhabi)")
  assert.equal(progress.progressPercentage, 87, "20/23 corresponde a 87%")
  assert.equal(progress.resultsPending, false)

  // Teste de proteção contra contagem duplicada em row.races quando a API informa completed_races
  const progressNoDup = computeSeasonProgress({
    series: "f1",
    season: 2026,
    driverStandings: {
      completed_races: 20,
      total_races: 23,
      pending_results: false,
      data: [{ races: 22 }], // mesmo que um registro individual tivesse contagem inflada
    },
    racesMeta: {
      total: 23,
      championship_total: 23,
      completed_races: 20,
      pending_results: false,
    },
  })
  assert.equal(
    progressNoDup.completedRaces,
    20,
    "Prioriza completed_races oficial da API evitando contagem duplicada",
  )
})

test("OP-06.53 [9] Classificação do Campeonato na Home consome dados da API sem tabelas estáticas para 2026", () => {
  const dashboardContent = fs.readFileSync(
    new URL("../src/pages/dashboard.tsx", import.meta.url),
    "utf-8",
  )

  assert.ok(
    dashboardContent.includes("api.driverStandings(seasonParam, series)"),
    "Home deve consultar api.driverStandings para a temporada e série selecionadas",
  )
  assert.ok(
    dashboardContent.includes("api.teamStandings(seasonParam, series)"),
    "Home deve consultar api.teamStandings para a temporada e série selecionadas",
  )
  assert.ok(
    !dashboardContent.includes("F1_2026_DRIVERS") && !dashboardContent.includes("F1_2026_TEAMS"),
    "Não deve existir tabela estática paralela para a temporada 2026",
  )
  assert.ok(
    dashboardContent.includes("<SeasonSelector value={effectiveSeason} onValueChange={setSeason} />"),
    "Seletor de temporada deve ser integralmente preservado",
  )
})

test("OP-06.53 Preservação de identidade visual e logo multi-series-logo.png", () => {
  const EXPECTED_HASH = "5c32eef9a739f4613b66622913f4fc67422f276bd0cdea2b00581be287414118"
  const logoBuffer = fs.readFileSync(new URL("../public/multi-series-logo.png", import.meta.url))
  const actualHash = crypto.createHash("sha256").update(logoBuffer).digest("hex")
  assert.equal(actualHash, EXPECTED_HASH)
})
