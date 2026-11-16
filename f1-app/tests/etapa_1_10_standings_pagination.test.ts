import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

import { flagFromNationality, formatNationality } from "../src/lib/assets"
import { DEFAULT_PAGE_SIZE_OPTIONS, paginateRows } from "../src/lib/pagination-utils"

const srcRoot = path.resolve(import.meta.dirname ?? path.dirname(new URL(import.meta.url).pathname), "../src")

test("Frente A - paginateRows cobre 20, 21, 81 (1950) e 96 (1954) registros com [10, 20, 50, 100, Todos]", () => {
  assert.deepEqual([...DEFAULT_PAGE_SIZE_OPTIONS], [10, 20, 50, 100])

  // 20 registros
  const r20 = Array.from({ length: 20 }, (_, i) => ({ id: i + 1 }))
  const s20 = paginateRows(r20, 1, 20)
  assert.equal(s20.totalPages, 1)
  assert.equal(s20.items.length, 20)

  // 21 registros
  const r21 = Array.from({ length: 21 }, (_, i) => ({ id: i + 1 }))
  assert.equal(paginateRows(r21, 1, 20).totalPages, 2)
  assert.equal(paginateRows(r21, 2, 20).items.length, 1)
  assert.equal(paginateRows(r21, 2, 20).startIndex, 21)

  // 81 pilotos (1950) com 10, 20, 50, 100 e "all"
  const r81 = Array.from({ length: 81 }, (_, i) => ({ id: i + 1 }))
  assert.equal(paginateRows(r81, 1, 10).totalPages, 9)
  assert.equal(paginateRows(r81, 5, 20).items.length, 1)
  assert.equal(paginateRows(r81, 2, 50).items.length, 31)
  assert.equal(paginateRows(r81, 1, 100).totalPages, 1)
  assert.equal(paginateRows(r81, 1, "all").items.length, 81)

  // 96 pilotos (1954): sem omissão nem duplicação entre páginas
  const r96 = Array.from({ length: 96 }, (_, i) => ({ id: i + 1 }))
  for (const size of [10, 20, 50, 100, "all"] as const) {
    const first = paginateRows(r96, 1, size)
    const collected: number[] = []
    for (let p = 1; p <= first.totalPages; p++) {
      const slice = paginateRows(r96, p, size)
      collected.push(...slice.items.map((x) => x.id))
    }
    assert.equal(collected.length, 96, `Tamanho ${size} deve cobrir todos os 96 registros`)
    assert.equal(new Set(collected).size, 96, `Tamanho ${size} não pode duplicar registros`)
    assert.equal(collected[0], 1)
    assert.equal(collected[95], 96)
  }
})

test("Frente A - F1DataTable e DashboardPage possuem opções [10, 20, 50, 100] + Todos no desktop e mobile", () => {
  const dtSrc = fs.readFileSync(path.join(srcRoot, "components/data-table.tsx"), "utf8")
  const dashSrc = fs.readFileSync(path.join(srcRoot, "pages/dashboard.tsx"), "utf8")

  assert.match(dtSrc, /selectAllRowsItem:\s*true/)
  assert.match(dtSrc, /selectAllRowsItemText:\s*"Todos"/)
  assert.match(dtSrc, /data-testid="mobile-pagination"/)
  assert.match(dtSrc, /<option value="all">Todos<\/option>/)

  assert.match(dashSrc, /paginationPerPage=\{20\}/)
  assert.match(dashSrc, /paginationRowsPerPageOptions=\{\[10, 20, 50, 100\]\}/)
  assert.match(dashSrc, /paginationResetDefaultPage=\{resetPaginationToggle\}/)
})

test("Frente B - Códigos ISO de F2/F3 e nacionalidades F1 normalizam para PT-BR com bandeira válida", () => {
  const f2f3IsoCases: Array<[string, string, string]> = [
    ["ar", "Argentino", "ar"],
    ["at", "Austríaco", "at"],
    ["ch", "Suíço", "ch"],
    ["co", "Colombiano", "co"],
    ["gb", "Britânico", "gb"],
    ["it", "Italiano", "it"],
    ["nl", "Neerlandês", "nl"],
    ["nz", "Neozelandês", "nz"],
    ["sg", "Singapurense", "sg"],
  ]

  for (const [raw, expectedPt, expectedIso] of f2f3IsoCases) {
    assert.equal(formatNationality(raw), expectedPt)
    assert.equal(flagFromNationality(raw), `https://flagcdn.com/w40/${expectedIso}.png`)
  }
})
