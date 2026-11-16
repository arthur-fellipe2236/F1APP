import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

import {
  ALL_SEASONS_LABEL,
  ALL_SEASONS_VALUE,
  groupSeasonsByDecade,
  resolveSeasonReset,
  resolveSeasonSelectorValue,
} from "../src/lib/season-utils"
import { useAppStore } from "../src/store"

const srcRoot = path.resolve(import.meta.dirname ?? path.dirname(new URL(import.meta.url).pathname), "../src")

test("H-01 - Não realiza reset prematuro durante loading com fallback de 5 anos", () => {
  const fallbackSeasons = [2026, 2025, 2024, 2023, 2022]

  // F1 (1950) -> F2 enquanto api.seasons("f2") ainda está carregando
  const resetWhileLoading1950 = resolveSeasonReset({
    series: "f2",
    season: "1950",
    seasons: fallbackSeasons,
    loading: true,
    includeAll: true,
  })
  assert.equal(resetWhileLoading1950, null, "Não deve resetar temporada enquanto seasons ainda está carregando")

  // F1 (2022) -> F2 enquanto ainda está carregando
  const resetWhileLoading2022 = resolveSeasonReset({
    series: "f2",
    season: "2022",
    seasons: fallbackSeasons,
    loading: true,
    includeAll: true,
  })
  assert.equal(resetWhileLoading2022, null)
})

test("H-01 - Troca F1 (1950) -> F2/F3 ajusta para 2026 após carregamento da lista real", () => {
  const f2Seasons = [2026]
  const f3Seasons = [2026]

  assert.equal(
    resolveSeasonReset({
      series: "f2",
      season: "1950",
      seasons: f2Seasons,
      loading: false,
      includeAll: true,
    }),
    "2026",
  )

  assert.equal(
    resolveSeasonReset({
      series: "f3",
      season: "1950",
      seasons: f3Seasons,
      loading: false,
      includeAll: true,
    }),
    "2026",
  )

  // Em F1, 1950 continua válida e não deve resetar
  assert.equal(
    resolveSeasonReset({
      series: "f1",
      season: "1950",
      seasons: [2026, 2025, 1950],
      loading: false,
      includeAll: true,
    }),
    null,
  )
})

test("H-03 - Opção 'Todas as temporadas' ('all') e compatibilidade entre páginas", () => {
  assert.equal(ALL_SEASONS_VALUE, "all")
  assert.equal(ALL_SEASONS_LABEL, "Todas as temporadas")

  const f1Seasons = [2026, 2025, 2024, 1950]
  const f2Seasons = [2026]

  // Com includeAll=true (races.tsx e circuits.tsx), "all" é preservado mesmo em F2/F3
  assert.equal(
    resolveSeasonSelectorValue({
      value: "all",
      seasons: f1Seasons,
      loading: false,
      includeAll: true,
    }),
    "all",
  )
  assert.equal(
    resolveSeasonReset({
      series: "f2",
      season: "all",
      seasons: f2Seasons,
      loading: false,
      includeAll: true,
    }),
    null,
  )

  // Sem includeAll (dashboard.tsx, drivers.tsx, teams.tsx), "all" faz fallback seguro para seasons[0]
  assert.equal(
    resolveSeasonSelectorValue({
      value: "all",
      seasons: f1Seasons,
      loading: false,
      includeAll: false,
    }),
    "2026",
  )
  assert.equal(
    resolveSeasonReset({
      series: "f2",
      season: "all",
      seasons: f2Seasons,
      loading: false,
      includeAll: false,
    }),
    "2026",
  )
})

test("H-03 - Alternância entre temporadas numéricas e 'all' no store e agrupamento por década", () => {
  const store = useAppStore.getState()
  store.setSeries("f1")
  store.setSeason("1950")
  assert.equal(useAppStore.getState().season, "1950")

  store.setSeason("all")
  assert.equal(useAppStore.getState().season, "all")

  store.setSeason("2026")
  assert.equal(useAppStore.getState().season, "2026")

  // Seletor impede valor incompatível após carregamento (ex.: 1950 em F2)
  assert.equal(
    resolveSeasonSelectorValue({
      value: "1950",
      seasons: [2026],
      loading: false,
      includeAll: true,
    }),
    "2026",
  )

  // Agrupamento por década preservado para 2026..1950
  const grouped = groupSeasonsByDecade([2026, 2020, 2008, 1994, 1950])
  assert.deepEqual(Object.keys(grouped), ["Anos 2020", "Anos 2000", "Anos 90", "Anos 50"])
  assert.deepEqual(grouped["Anos 2020"], [2026, 2020])
  assert.deepEqual(grouped["Anos 50"], [1950])
})

test("H-01 & H-03 - Verificação estrutural das páginas compatíveis vs padrão", () => {
  const circuitsSrc = fs.readFileSync(path.join(srcRoot, "pages/circuits.tsx"), "utf8")
  const racesSrc = fs.readFileSync(path.join(srcRoot, "pages/races.tsx"), "utf8")
  const dashboardSrc = fs.readFileSync(path.join(srcRoot, "pages/dashboard.tsx"), "utf8")
  const driversSrc = fs.readFileSync(path.join(srcRoot, "pages/drivers.tsx"), "utf8")
  const teamsSrc = fs.readFileSync(path.join(srcRoot, "pages/teams.tsx"), "utf8")

  assert.match(circuitsSrc, /useSeasonsState\(series\)/, "circuits.tsx deve passar series para useSeasonsState")
  assert.match(circuitsSrc, /includeAll/, "circuits.tsx deve habilitar includeAll no SeasonSelector")
  assert.match(racesSrc, /useSeasonsState\(series\)/, "races.tsx deve usar useSeasonsState(series)")
  assert.match(racesSrc, /includeAll/, "races.tsx deve habilitar includeAll no SeasonSelector")

  // Páginas que NÃO habilitam includeAll permanecem inalteradas no comportamento padrão
  assert.doesNotMatch(dashboardSrc, /includeAll/)
  assert.doesNotMatch(driversSrc, /includeAll/)
  assert.doesNotMatch(teamsSrc, /includeAll/)
})
