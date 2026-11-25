import assert from "node:assert/strict"
import { fetchAll, fetchAllRaceResults } from "../src/lib/api"

async function run() {
  // 1. fetchAll com concorrência limitada a 4 e 24 páginas (1167 corridas)
  let active = 0
  let maxActive = 0
  const totalPages = 24

  const items = await fetchAll(
    async ({ page, per_page }) => {
      active += 1
      maxActive = Math.max(maxActive, active)
      await new Promise((r) => setTimeout(r, 2))
      active -= 1
      const count = page === totalPages ? 17 : per_page
      const data = Array.from({ length: count }, (_, idx) => ({
        id: (page - 1) * per_page + idx + 1,
      }))
      return {
        data,
        meta: { page, per_page, total: 1167, pages: totalPages },
      }
    },
    { concurrency: 4 },
  )

  assert.ok(maxActive <= 4, `Concorrência excedeu 4: ${maxActive}`)
  assert.equal(items.length, 1167)
  assert.equal(new Set(items.map((x) => x.id)).size, 1167)
  assert.equal(items[0].id, 1)
  assert.equal(items[items.length - 1].id, 1167)

  // 2. fetchAllRaceResults > 50 resultados preservando results_state e meta.total
  const origFetch = globalThis.fetch
  let calls = 0
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    calls += 1
    const url = String(input)
    const isPage2 = url.includes("page=2")
    const page = isPage2 ? 2 : 1
    const count = isPage2 ? 15 : 50
    const data = Array.from({ length: count }, (_, idx) => ({
      id: (page - 1) * 50 + idx + 1,
      race_id: 999,
      driver_id: (page - 1) * 50 + idx + 1,
      driver_name: `Piloto ${(page - 1) * 50 + idx + 1}`,
      driver_code: null,
      driver_nationality: null,
      team_id: 1,
      team_name: "Team",
      position: (page - 1) * 50 + idx + 1,
      points: 0,
      sprint_points: 0,
      grid: null,
      laps: 50,
      status: "Finished",
      fastest_lap: false,
    }))
    return new Response(
      JSON.stringify({
        data,
        meta: { page, per_page: 50, total: 65, pages: 2 },
        results_state: { state: "available", final: true, message: null },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    )
  }) as typeof fetch

  try {
    const res = await fetchAllRaceResults(999)
    assert.equal(calls, 2)
    assert.equal(res.data.length, 65)
    assert.equal(new Set(res.data.map((r) => r.driver_id)).size, 65)
    assert.equal(res.meta.total, 65)
    assert.equal(res.results_state?.state, "available")
    assert.equal(res.results_state?.final, true)

    // 3. Erro em página subsequente não mascara lista incompleta
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes("page=2")) {
        return new Response(JSON.stringify({ error: "Falha página 2" }), { status: 500 })
      }
      return new Response(
        JSON.stringify({
          data: [{ id: 1 }],
          meta: { page: 1, per_page: 50, total: 60, pages: 2 },
          results_state: { state: "available", final: true, message: null },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      )
    }) as typeof fetch

    await assert.rejects(() => fetchAllRaceResults(999), /Falha página 2/)
  } finally {
    globalThis.fetch = origFetch
  }

  console.log("etapa_1_3_pagination.test.ts: 3/3 PASSED")
}

run()
