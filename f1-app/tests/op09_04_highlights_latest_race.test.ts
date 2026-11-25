import test from "node:test"
import assert from "node:assert/strict"

import {
  DEFAULT_2026_HIGHLIGHTS,
  OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY,
  selectRaceHighlights,
  type HighlightRaceCandidate,
} from "../src/lib/highlights"

const RACES_2026: HighlightRaceCandidate[] = [
  { id: 850, round: 17, series: "f1", name: "Singapore Grand Prix", date: "2026-10-09", circuit_country: "Singapore", has_results: true },
  { id: 939, round: 18, series: "f1", name: "United States Grand Prix", date: "2026-10-25", circuit_country: "USA", has_results: true },
  { id: 940, round: 19, series: "f1", name: "Mexico City Grand Prix", date: "2026-10-30", circuit_country: "Mexico", has_results: true },
  { id: 941, round: 20, series: "f1", name: "São Paulo Grand Prix", date: "2026-11-06", circuit_country: "Brazil", has_results: true },
  { id: 942, round: 21, series: "f1", name: "Las Vegas Grand Prix", date: "2026-11-20", circuit_country: "United States", has_results: true },
  { id: 943, round: 22, series: "f1", name: "Qatar Grand Prix", date: "2026-11-29", circuit_country: "Catar", has_results: false },
  { id: 944, round: 23, series: "f1", name: "Abu Dhabi Grand Prix", date: "2026-12-06", circuit_country: "Emirados Árabes Unidos", has_results: false },
]

test("OP-09.04 [1] Seleciona o GP de Las Vegas (Round 21) como corrida concluída mais recente em 24/11/2026 (R21 -> R20 -> R19)", () => {
  const selected = selectRaceHighlights(RACES_2026, {
    referenceDate: new Date("2026-11-24T20:00:00Z"),
    completedRaces: 21,
  })

  assert.equal(selected.length, 3)
  assert.deepEqual(
    selected.map((h) => h.round),
    [21, 20, 19],
  )
  assert.equal(selected[0].gpName, "Grande Prêmio de Las Vegas")
  assert.equal(selected[0].country, "Estados Unidos")
  assert.equal(selected[0].youtubeId, "Vyk_6bNm7lo")
  assert.equal(selected[0].youtubeUrl, "https://www.youtube.com/watch?v=Vyk_6bNm7lo")
  assert.equal(selected[0].duration, "8:13")
  assert.equal(selected[1].round, 20)
  assert.equal(selected[1].youtubeId, "lkb5kqDJYXk")
  assert.equal(selected[2].round, 19)
  assert.equal(selected[2].youtubeId, "tIiRK7hKScU")

  assert.equal(DEFAULT_2026_HIGHLIGHTS[0].round, 21)
  assert.equal(DEFAULT_2026_HIGHLIGHTS[0].youtubeId, "Vyk_6bNm7lo")
  assert.equal(OFFICIAL_2026_F1_HIGHLIGHTS_REGISTRY[21].youtubeId, "Vyk_6bNm7lo")
})

test("OP-09.04 [2] Corridas futuras (Catar R22 e Abu Dhabi R23), adiadas, canceladas, Sprint ou Qualifying não são selecionadas", () => {
  const candidates: HighlightRaceCandidate[] = [
    ...RACES_2026,
    { id: 9901, round: 22, series: "f1", name: "Qatar Sprint Race", date: "2026-11-23", session_type: "sprint", has_results: true },
    { id: 9902, round: 22, series: "f1", name: "Qatar Qualifying", date: "2026-11-23", session_type: "qualifying", has_results: true },
    { id: 9903, round: 22, series: "f1", name: "Qatar Postponed GP", date: "2026-11-23", is_postponed: true, has_results: true },
    { id: 9904, round: 22, series: "f1", name: "Qatar Cancelled GP", date: "2026-11-23", is_cancelled: true, has_results: true },
  ]

  const selected = selectRaceHighlights(candidates, {
    referenceDate: new Date("2026-11-24T20:00:00Z"),
    completedRaces: 21,
  })

  assert.deepEqual(
    selected.map((h) => h.round),
    [21, 20, 19],
  )
})

test("OP-09.04 [3] Resolução dinâmica via payload highlight_video do backend funciona sem depender de registro fixo por round", () => {
  const withDynamicQatar: HighlightRaceCandidate[] = [
    ...RACES_2026.map((r) =>
      r.round === 22
        ? {
            ...r,
            has_results: true,
            highlight_video: {
              youtube_id: "AbCdEf12345",
              duration: "8:05",
            },
          }
        : r,
    ),
  ]

  const selected = selectRaceHighlights(withDynamicQatar, {
    referenceDate: new Date("2026-11-30T12:00:00Z"),
    completedRaces: 22,
  })

  assert.deepEqual(
    selected.map((h) => h.round),
    [22, 21, 20],
  )
  assert.equal(selected[0].gpName, "Grande Prêmio do Catar")
  assert.equal(selected[0].country, "Catar")
  assert.equal(selected[0].youtubeId, "AbCdEf12345")
  assert.equal(selected[0].duration, "8:05")
})
