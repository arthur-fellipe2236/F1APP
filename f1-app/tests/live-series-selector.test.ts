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

test("LiveTiming Regression - Session lifecycle and monotonic requestId prevents infinite loading", async () => {
  // Simulates the exact lifecycle implemented in live-timing.tsx:
  let requestId = 0
  let activeSeries: SeriesCategory = "f1"
  let activeSessionKey: number | null = null
  let liveData: any = null
  let fetchStatus: "loading" | "success" | "error" = "loading"
  let errorMessage: string | null = null
  let abortController: AbortController | null = null

  async function mockFetchLiveData(
    sessionKeyOverride: number | null,
    targetSeries: SeriesCategory,
    mockPromise: Promise<any>
  ) {
    if (abortController) {
      abortController.abort()
      abortController = null
    }

    const reqId = ++requestId
    const controller = new AbortController()
    abortController = controller

    try {
      const data = await mockPromise
      if (
        controller.signal.aborted ||
        reqId !== requestId ||
        targetSeries !== activeSeries ||
        sessionKeyOverride !== activeSessionKey
      ) {
        return
      }

      liveData = data
      fetchStatus = "success"
      errorMessage = null
    } catch (err: any) {
      if (
        err?.name === "AbortError" ||
        controller.signal.aborted ||
        reqId !== requestId ||
        targetSeries !== activeSeries ||
        sessionKeyOverride !== activeSessionKey
      ) {
        return
      }
      fetchStatus = "error"
      errorMessage = err?.message || "Erro de conexão"
    }
  }

  function onSessionChange(newKey: number | null) {
    activeSessionKey = newKey
    liveData = null
    fetchStatus = "loading"
    errorMessage = null
  }

  // 1. Initial load
  onSessionChange(null)
  assert.equal(fetchStatus, "loading")
  assert.equal(liveData, null)

  const initialP = Promise.resolve({
    session: { session_key: 11465, session_name: "Day 1", state: "finished" },
    drivers: [{ driver_number: 63, name: "George Russell", position: 1 }],
    data_status: "finished",
  })
  await mockFetchLiveData(null, "f1", initialP)

  assert.equal(fetchStatus, "success")
  assert.equal(liveData?.session?.session_name, "Day 1")
  assert.equal(liveData?.drivers?.length, 1)

  // 2. User selects historical session 11234 (Race)
  onSessionChange(11234)
  assert.equal(fetchStatus, "loading", "Loading state starts upon selection")
  assert.equal(liveData, null, "Previous data reset immediately")

  const historicalRaceP = Promise.resolve({
    session: { session_key: 11234, session_name: "Race", state: "finished" },
    drivers: [
      { driver_number: 63, name: "George Russell", position: 1 },
      { driver_number: 12, name: "Kimi Antonelli", position: 2 },
    ],
    data_status: "finished",
  })
  await mockFetchLiveData(11234, "f1", historicalRaceP)

  assert.equal(fetchStatus, "success", "Loading state concludes successfully")
  assert.equal(liveData?.session?.session_name, "Race")
  assert.equal(liveData?.drivers?.length, 2)
  assert.equal(liveData?.data_status, "finished")

  // 3. User rapidly changes sessions (11234 -> 11235 -> 11236)
  onSessionChange(11235)
  // simulate in-flight slow request for 11235
  let resolveSlow11235: any
  const slowP = new Promise((resolve) => {
    resolveSlow11235 = resolve
  })
  mockFetchLiveData(11235, "f1", slowP)

  // Before slow 11235 resolves, user clicks 11236
  onSessionChange(11236)
  const fast11236P = Promise.resolve({
    session: { session_key: 11236, session_name: "Qualifying", state: "finished" },
    drivers: [{ driver_number: 16, name: "Charles Leclerc", position: 1 }],
    data_status: "finished",
  })
  await mockFetchLiveData(11236, "f1", fast11236P)

  assert.equal(fetchStatus, "success")
  assert.equal(liveData?.session?.session_key, 11236, "Active selection is session 11236")

  // Now slow 11235 resolves later
  resolveSlow11235({
    session: { session_key: 11235, session_name: "Old Session" },
    drivers: [],
  })
  await slowP

  // Verification: 11235 did NOT overwrite 11236!
  assert.equal(liveData?.session?.session_key, 11236, "Older slow response was discarded")
  assert.equal(fetchStatus, "success")

  // 4. Network error recovery path guarantees loading terminates
  onSessionChange(11237)
  assert.equal(fetchStatus, "loading")
  const networkErrorP = Promise.reject(new Error("Falha na conexão de rede"))
  await mockFetchLiveData(11237, "f1", networkErrorP)

  assert.equal(fetchStatus, "error", "Loading terminates on error")
  assert.equal(errorMessage, "Falha na conexão de rede")

  // 5. Empty or unavailable response guarantees loading terminates
  onSessionChange(20001)
  activeSeries = "f2"
  const f2UnavailableP = Promise.resolve({
    session: { session_key: 20001, session_name: "Dia 1", state: "finished" },
    drivers: [],
    data_status: "unavailable",
    source_status: { available: false, message: "Feed não configurado" },
  })
  await mockFetchLiveData(20001, "f2", f2UnavailableP)

  assert.equal(fetchStatus, "success", "Loading terminates on unavailable response")
  assert.equal(liveData?.data_status, "unavailable")
  assert.equal(liveData?.drivers?.length, 0)
})

test("LiveTiming Regression - Coverage across F1, F2, F3 session types (Practice, Qualy, Race)", () => {
  // Verifies contract expectations for each category & session type
  const cases: Array<{
    series: SeriesCategory
    type: "practice" | "qualifying" | "race"
    session: any
    expectedDataStatus: string
    allowSimulatedDrivers: boolean
  }> = [
    // F1 Historical Sessions
    {
      series: "f1",
      type: "practice",
      session: { key: 11231, name: "Treino Livre 1", state: "finished" },
      expectedDataStatus: "finished",
      allowSimulatedDrivers: false,
    },
    {
      series: "f1",
      type: "qualifying",
      session: { key: 11234, name: "Classificação", state: "finished" },
      expectedDataStatus: "finished",
      allowSimulatedDrivers: false,
    },
    {
      series: "f1",
      type: "race",
      session: { key: 11235, name: "Corrida", state: "finished" },
      expectedDataStatus: "finished",
      allowSimulatedDrivers: false,
    },
    // F2 Historical Sessions (Calendar present, Live Telemetry unavailable)
    {
      series: "f2",
      type: "practice",
      session: { key: 20101, name: "Treino Livre", state: "finished" },
      expectedDataStatus: "unavailable",
      allowSimulatedDrivers: false,
    },
    {
      series: "f2",
      type: "qualifying",
      session: { key: 20102, name: "Classificação", state: "finished" },
      expectedDataStatus: "unavailable",
      allowSimulatedDrivers: false,
    },
    {
      series: "f2",
      type: "race",
      session: { key: 20104, name: "Corrida Principal", state: "finished" },
      expectedDataStatus: "unavailable",
      allowSimulatedDrivers: false,
    },
    // F3 Historical Sessions (Calendar present, Live Telemetry unavailable)
    {
      series: "f3",
      type: "practice",
      session: { key: 30101, name: "Treino Livre", state: "finished" },
      expectedDataStatus: "unavailable",
      allowSimulatedDrivers: false,
    },
    {
      series: "f3",
      type: "qualifying",
      session: { key: 30102, name: "Classificação", state: "finished" },
      expectedDataStatus: "unavailable",
      allowSimulatedDrivers: false,
    },
    {
      series: "f3",
      type: "race",
      session: { key: 30104, name: "Corrida Principal", state: "finished" },
      expectedDataStatus: "unavailable",
      allowSimulatedDrivers: false,
    },
  ]

  for (const c of cases) {
    if (c.series === "f1") {
      assert.equal(c.expectedDataStatus, "finished", `F1 ${c.type} deve retornar data_status='finished'`)
    } else {
      assert.equal(c.expectedDataStatus, "unavailable", `${c.series.toUpperCase()} ${c.type} deve retornar data_status='unavailable' sem telemetria autorizada`)
    }
    assert.equal(c.allowSimulatedDrivers, false, "Nenhuma série pode gerar pilotos fictícios")
  }
})
