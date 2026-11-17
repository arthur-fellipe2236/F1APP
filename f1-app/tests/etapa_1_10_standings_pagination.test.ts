import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

import { flagFromNationality, formatNationality } from "../src/lib/assets"
import { DEFAULT_PAGE_SIZE_OPTIONS, paginateRows } from "../src/lib/pagination-utils"

const srcRoot = path.resolve(import.meta.dirname ?? path.dirname(new URL(import.meta.url).pathname), "../src")

test("Frente A - paginateRows cobre <20, 20, >20 (23/34/81/96/108) com [10, 20, 50, 100, Todos] e ultima pagina incompleta", () => {
  assert.deepEqual([...DEFAULT_PAGE_SIZE_OPTIONS], [10, 20, 50, 100])

  // Menor que 20 (ex.: 11 equipes)
  const r11 = Array.from({ length: 11 }, (_, i) => ({ id: i + 1 }))
  assert.equal(paginateRows(r11, 1, 20).totalPages, 1)
  assert.equal(paginateRows(r11, 1, 20).items.length, 11)
  assert.equal(paginateRows(r11, 2, 10).items.length, 1)
  assert.equal(paginateRows(r11, 2, 10).startIndex, 11)
  assert.equal(paginateRows(r11, 1, "all").items.length, 11)

  // Exatamente 20 registros
  const r20 = Array.from({ length: 20 }, (_, i) => ({ id: i + 1 }))
  const s20 = paginateRows(r20, 1, 20)
  assert.equal(s20.totalPages, 1)
  assert.equal(s20.items.length, 20)
  assert.equal(paginateRows(r20, 2, 10).items.length, 10)

  // Maior que 20 (23 F2 / 34 F3 / 108 1953) com ultima pagina incompleta e sem duplicidade
  for (const total of [21, 23, 34, 81, 96, 108]) {
    const rows = Array.from({ length: total }, (_, i) => ({ id: i + 1 }))
    for (const size of [10, 20, 50, 100, "all"] as const) {
      const first = paginateRows(rows, 1, size)
      const collected: number[] = []
      for (let p = 1; p <= first.totalPages; p++) {
        const slice = paginateRows(rows, p, size)
        collected.push(...slice.items.map((x) => x.id))
      }
      assert.equal(collected.length, total, `Total ${total} com tamanho ${size}`)
      assert.equal(new Set(collected).size, total, `Sem duplicados para total ${total} tamanho ${size}`)
      assert.equal(collected[0], 1)
      assert.equal(collected[total - 1], total)
    }
  }
})

test("Frente A - Pilotos no DashboardPage exibe lista completa (pagination={false}) e Equipes/F1DataTable preservam paginacao", () => {
  const dtSrc = fs.readFileSync(path.join(srcRoot, "components/data-table.tsx"), "utf8")
  const dashSrc = fs.readFileSync(path.join(srcRoot, "pages/dashboard.tsx"), "utf8")

  assert.match(dtSrc, /selectAllRowsItem:\s*true/)
  assert.match(dtSrc, /selectAllRowsItemText:\s*"Todos"/)
  assert.match(dtSrc, /testId="mobile-pagination"/)
  assert.match(dtSrc, /testId="desktop-pagination"/)
  assert.match(dtSrc, /<option value="all">Todos<\/option>/)

  // Classificação de Pilotos no Painel sem paginação / sem limite de linhas
  const driversSection = dashSrc.split('<TabsContent value="drivers">')[1]?.split('<TabsContent value="teams">')[0] ?? ""
  assert.match(driversSection, /pagination=\{false\}/)
  assert.doesNotMatch(driversSection, /paginationRowsPerPageOptions/)
  assert.doesNotMatch(driversSection, /paginationPerPage/)

  // Classificação de Equipes preserva paginação completa
  const teamsSection = dashSrc.split('<TabsContent value="teams">')[1] ?? ""
  assert.match(teamsSection, /pagination=\{!isF12021\}/)
  assert.match(teamsSection, /paginationPerPage=\{20\}/)
  assert.match(teamsSection, /paginationRowsPerPageOptions=\{\[10, 20, 50, 100\]\}/)
  assert.match(teamsSection, /paginationResetDefaultPage=\{resetPaginationToggle\}/)
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

test("Visual - TeamInline/TeamName usam quebra controlada sem truncate e colunas Equipe/Pontos tem larguras explicitas", () => {
  const tnSrc = fs.readFileSync(path.join(srcRoot, "components/team-name.tsx"), "utf8")
  const dashSrc = fs.readFileSync(path.join(srcRoot, "pages/dashboard.tsx"), "utf8")
  const rdSrc = fs.readFileSync(path.join(srcRoot, "pages/race-detail.tsx"), "utf8")
  const vtSrc = fs.readFileSync(path.join(srcRoot, "components/virtual-table.tsx"), "utf8")

  assert.doesNotMatch(tnSrc, /className="truncate"/)
  assert.match(tnSrc, /whitespace-normal break-words/)
  assert.match(dashSrc, /minWidth:\s*"220px"[\s\S]*?wrap:\s*true/)
  assert.match(rdSrc, /minWidth:\s*"220px"[\s\S]*?wrap:\s*true/)
  assert.match(vtSrc, /col\.right \? "flex-end"/)
})
