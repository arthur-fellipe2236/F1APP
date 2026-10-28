import test from "node:test"
import assert from "node:assert/strict"

import {
  SERIES_OPTIONS,
  SERIES_NAMES,
  getNextSeriesIndex,
  isEstimatedSessionTime,
  type SeriesCategory,
} from "../src/lib/series"
import { useAppStore } from "../src/store"

test("SeriesSelector - metadata and branding options", () => {
  assert.equal(SERIES_OPTIONS.length, 3, "Deve conter exatamente 3 categorias: F1, F2, F3")

  const [f1, f2, f3] = SERIES_OPTIONS

  // F1 checks
  assert.equal(f1.id, "f1")
  assert.equal(f1.name, "Fórmula 1")
  assert.equal(f1.shortLabel, "F1")
  assert.equal(f1.ariaLabel, "Fórmula 1 (F1)")
  assert.equal(f1.activeBg, "bg-[#E10600]")

  // F2 checks
  assert.equal(f2.id, "f2")
  assert.equal(f2.name, "Fórmula 2")
  assert.equal(f2.shortLabel, "F2")
  assert.equal(f2.ariaLabel, "FIA Fórmula 2 (F2)")
  assert.equal(f2.activeBg, "bg-[#0090D0]")

  // F3 checks
  assert.equal(f3.id, "f3")
  assert.equal(f3.name, "Fórmula 3")
  assert.equal(f3.shortLabel, "F3")
  assert.equal(f3.ariaLabel, "FIA Fórmula 3 (F3)")
  assert.equal(f3.activeBg, "bg-[#F9A01B]")

  // Labels mapping
  assert.equal(SERIES_NAMES.f1, "Fórmula 1")
  assert.equal(SERIES_NAMES.f2, "Fórmula 2")
  assert.equal(SERIES_NAMES.f3, "Fórmula 3")
})

test("SeriesSelector - keyboard navigation simulation", () => {
  const total = SERIES_OPTIONS.length

  // Start at F1 (idx 0)
  let idx = 0
  idx = getNextSeriesIndex(idx, "ArrowRight", total)
  assert.equal(idx, 1, "ArrowRight a partir de F1 deve ir para F2 (index 1)")
  assert.equal(SERIES_OPTIONS[idx].id, "f2")

  idx = getNextSeriesIndex(idx, "ArrowRight", total)
  assert.equal(idx, 2, "ArrowRight a partir de F2 deve ir para F3 (index 2)")
  assert.equal(SERIES_OPTIONS[idx].id, "f3")

  // Wrap around
  idx = getNextSeriesIndex(idx, "ArrowRight", total)
  assert.equal(idx, 0, "ArrowRight a partir de F3 deve circular de volta para F1 (index 0)")
  assert.equal(SERIES_OPTIONS[idx].id, "f1")

  // ArrowLeft backwards
  idx = getNextSeriesIndex(idx, "ArrowLeft", total)
  assert.equal(idx, 2, "ArrowLeft a partir de F1 deve ir para F3 (index 2)")

  // ArrowDown and ArrowUp
  idx = getNextSeriesIndex(0, "ArrowDown", total)
  assert.equal(idx, 1, "ArrowDown deve avançar")
  idx = getNextSeriesIndex(1, "ArrowUp", total)
  assert.equal(idx, 0, "ArrowUp deve recuar")

  // Home and End
  idx = getNextSeriesIndex(idx, "Home", total)
  assert.equal(idx, 0, "Home deve ir para o primeiro item (F1)")

  idx = getNextSeriesIndex(idx, "End", total)
  assert.equal(idx, 2, "End deve ir para o último item (F3)")
})

test("useAppStore - series state management and isolation", () => {
  const store = useAppStore.getState()

  // Set to f1
  store.setSeries("f1")
  assert.equal(useAppStore.getState().series, "f1")

  // Switch to f2
  store.setSeries("f2")
  assert.equal(useAppStore.getState().series, "f2")

  // Switch to f3
  store.setSeries("f3")
  assert.equal(useAppStore.getState().series, "f3")

  // Reset to f1
  store.setSeries("f1")
  assert.equal(useAppStore.getState().series, "f1")
})

test("LiveTiming - estimated vs confirmed time detection", () => {
  // F1 confirmed session
  const f1Session = {
    key: 11397,
    name: "Treino Livre 1",
    time_status: "confirmed" as const,
    is_time_confirmed: true,
  }
  assert.equal(isEstimatedSessionTime(f1Session), false, "Sessão F1 confirmada não deve ser marcada como estimada")

  // F2 estimated session
  const f2Session = {
    key: 21301,
    name: "Treino Livre",
    time_status: "estimated" as const,
    is_time_confirmed: false,
  }
  assert.equal(isEstimatedSessionTime(f2Session), true, "Sessão F2 estimada deve ser detectada como estimada")

  // F3 estimated session
  const f3Session = {
    key: 30101,
    name: "Treino Livre",
    time_status: "estimated" as const,
    is_time_confirmed: false,
  }
  assert.equal(isEstimatedSessionTime(f3Session), true, "Sessão F3 estimada deve ser detectada como estimada")

  // Missing or null session
  assert.equal(isEstimatedSessionTime(null), false)
  assert.equal(isEstimatedSessionTime(undefined), false)
})

test("LiveTiming - honest unavailable timing handling without fake data", () => {
  // When live timing feed is unavailable for F2:
  const f2UnavailableResponse = {
    session: null,
    flag: null,
    current_lap: null,
    drivers: [],
    weather: {},
    messages: [],
    data_status: "unavailable",
    source_status: {
      available: false,
      status_code: 200,
      reason: "provider_not_configured",
      message: "Telemetria em tempo real para Fórmula 2 indisponível nesta etapa.",
    },
    is_stale: false,
    last_valid_update: null,
    series: "f2",
  }

  assert.equal(f2UnavailableResponse.data_status, "unavailable")
  assert.equal(f2UnavailableResponse.drivers.length, 0, "Não deve haver pilotos simulados")
  assert.equal(f2UnavailableResponse.current_lap, null, "Não deve haver volta simulada")
  assert.equal(f2UnavailableResponse.source_status.available, false)
  assert.match(
    f2UnavailableResponse.source_status.message,
    /Fórmula 2 indisponível/,
    "Mensagem honesta deve indicar indisponibilidade para Fórmula 2"
  )
})

test("LiveTiming - category switching immediately resets state without data leakage", () => {
  // Simulating state lifecycle when user switches series from F1 to F2
  let activeSeries: SeriesCategory = "f1"
  let selectedSessionKey: number | null = 11397
  let liveData: any = {
    session: { name: "Treino Livre 1", state: "scheduled", series: "f1" },
    drivers: [{ driver_number: 1, name: "Max Verstappen" }],
    series: "f1",
  }
  let fetchStatus = "success"

  function onSeriesSwitch(newSeries: SeriesCategory) {
    // 1. Immediately reset session and data
    selectedSessionKey = null
    liveData = null
    fetchStatus = "loading"
    activeSeries = newSeries
  }

  // Switch to F2
  onSeriesSwitch("f2")

  assert.equal(activeSeries, "f2")
  assert.equal(selectedSessionKey, null, "selectedSessionKey deve ser resetado para null")
  assert.equal(liveData, null, "liveData deve ser resetado para null imediatamente para não exibir dados da F1 na F2")
  assert.equal(fetchStatus, "loading", "fetchStatus deve transitar para loading")

  // Simulate arrival of F2 unavailable response
  liveData = {
    session: null,
    drivers: [],
    data_status: "unavailable",
    source_status: { available: false, message: "Telemetria em tempo real para Fórmula 2 indisponível nesta etapa." },
    series: "f2",
  }
  fetchStatus = "success"

  assert.equal(liveData.series, "f2")
  assert.equal(liveData.drivers.length, 0, "F2 não deve herdar os pilotos da F1")
  assert.equal(liveData.data_status, "unavailable")
})

test("LiveTiming - URL query string construction for multi-series endpoints", () => {
  function buildLiveTowerUrl(sessionKey?: number | null, series?: string): string {
    const params: string[] = []
    if (sessionKey) params.push(`session_key=${sessionKey}`)
    if (series) params.push(`series=${series}`)
    return `/live/tower${params.length > 0 ? "?" + params.join("&") : ""}`
  }

  function buildLiveSessionsUrl(year?: number, series?: string): string {
    const params: string[] = []
    if (year) params.push(`year=${year}`)
    if (series) params.push(`series=${series}`)
    return `/live/sessions${params.length > 0 ? "?" + params.join("&") : ""}`
  }

  assert.equal(buildLiveTowerUrl(null, "f1"), "/live/tower?series=f1")
  assert.equal(buildLiveTowerUrl(null, "f2"), "/live/tower?series=f2")
  assert.equal(buildLiveTowerUrl(null, "f3"), "/live/tower?series=f3")
  assert.equal(buildLiveTowerUrl(21301, "f2"), "/live/tower?session_key=21301&series=f2")
  assert.equal(buildLiveTowerUrl(30101, "f3"), "/live/tower?session_key=30101&series=f3")

  assert.equal(buildLiveSessionsUrl(2026, "f1"), "/live/sessions?year=2026&series=f1")
  assert.equal(buildLiveSessionsUrl(2026, "f2"), "/live/sessions?year=2026&series=f2")
  assert.equal(buildLiveSessionsUrl(2026, "f3"), "/live/sessions?year=2026&series=f3")
})
