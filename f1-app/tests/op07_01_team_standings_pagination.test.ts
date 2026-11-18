import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

import {
  DEFAULT_PAGE_SIZE_OPTIONS,
  paginateRows,
  parsePageSizeOption,
  sortRowsBySelector,
} from "../src/lib/pagination-utils"

const srcRoot = path.resolve(
  import.meta.dirname ?? path.dirname(new URL(import.meta.url).pathname),
  "../src",
)

interface MockTeamStanding {
  position: number
  team_id: number
  team_name: string
  points: number
  races: number
  wins: number
  podiums: number
}

function buildTeamStandings(count: number, season = 2026): MockTeamStanding[] {
  return Array.from({ length: count }, (_, i) => ({
    position: i + 1,
    team_id: season * 100 + i + 1,
    team_name: `Equipe ${season} #${String(i + 1).padStart(3, "0")}`,
    points: Math.max(0, (count - i) * 18),
    races: 24,
    wins: i < 5 ? 5 - i : 0,
    podiums: Math.max(0, 14 - i),
  }))
}

test("OP-07.01 - Opções de exibição [10, 20, 50, 100, Todos] e parsePageSizeOption", () => {
  assert.deepEqual([...DEFAULT_PAGE_SIZE_OPTIONS], [10, 20, 50, 100])
  assert.equal(parsePageSizeOption("10"), 10)
  assert.equal(parsePageSizeOption("20"), 20)
  assert.equal(parsePageSizeOption("50"), 50)
  assert.equal(parsePageSizeOption("100"), 100)
  assert.equal(parsePageSizeOption("all"), "all")
  assert.equal(parsePageSizeOption("invalid", 20), 20)
  assert.equal(parsePageSizeOption(-5, 20), 20)
})

test("OP-07.01 - Estado vazio (0 equipes) e quantidade inferior ao limite selecionado (5, 10, 11 equipes)", () => {
  const empty = paginateRows([], 1, 20)
  assert.equal(empty.totalRows, 0)
  assert.equal(empty.totalPages, 1)
  assert.equal(empty.page, 1)
  assert.equal(empty.startIndex, 0)
  assert.equal(empty.endIndex, 0)
  assert.deepEqual(empty.items, [])

  const emptyAll = paginateRows([], 3, "all")
  assert.equal(emptyAll.totalRows, 0)
  assert.equal(emptyAll.totalPages, 1)
  assert.equal(emptyAll.page, 1)
  assert.equal(emptyAll.startIndex, 0)
  assert.equal(emptyAll.endIndex, 0)

  // Temporada com poucas equipes (ex.: 5 equipes históricas ou 10/11 equipes atuais)
  for (const count of [5, 10, 11]) {
    const teams = buildTeamStandings(count, 2026)
    for (const limit of [20, 50, 100, "all"] as const) {
      const slice = paginateRows(teams, 1, limit)
      assert.equal(slice.totalRows, count)
      assert.equal(slice.totalPages, 1)
      assert.equal(slice.page, 1)
      assert.equal(slice.startIndex, 1)
      assert.equal(slice.endIndex, count)
      assert.equal(slice.items.length, count)
    }
  }
})

test("OP-07.01 - Temporada com várias equipes (22 em 1953, 24 em 1952, 55 e 105): primeira, intermediária e última página sem omissão/duplicação", () => {
  // 22 equipes (F1 1953) com perPage = 10 -> 3 páginas (1..10, 11..20, 21..22)
  const teams1953 = buildTeamStandings(22, 1953)
  const p1 = paginateRows(teams1953, 1, 10)
  assert.equal(p1.page, 1)
  assert.equal(p1.totalPages, 3)
  assert.equal(p1.startIndex, 1)
  assert.equal(p1.endIndex, 10)
  assert.equal(p1.items.length, 10)
  assert.equal(p1.items[0].position, 1)
  assert.equal(p1.items[9].position, 10)

  const p2 = paginateRows(teams1953, 2, 10)
  assert.equal(p2.page, 2)
  assert.equal(p2.totalPages, 3)
  assert.equal(p2.startIndex, 11)
  assert.equal(p2.endIndex, 20)
  assert.equal(p2.items.length, 10)
  assert.equal(p2.items[0].position, 11)
  assert.equal(p2.items[9].position, 20)

  const p3 = paginateRows(teams1953, 3, 10)
  assert.equal(p3.page, 3)
  assert.equal(p3.totalPages, 3)
  assert.equal(p3.startIndex, 21)
  assert.equal(p3.endIndex, 22)
  assert.equal(p3.items.length, 2)
  assert.equal(p3.items[0].position, 21)
  assert.equal(p3.items[1].position, 22)

  // Clamp acima da última página e abaixo da primeira
  assert.equal(paginateRows(teams1953, 99, 10).page, 3)
  assert.equal(paginateRows(teams1953, 0, 10).page, 1)
  assert.equal(paginateRows(teams1953, -2, 10).page, 1)

  // Verificação exaustiva para [10, 20, 50, 100, "all"] em diferentes volumes de equipes
  for (const total of [10, 11, 20, 22, 24, 35, 55, 105]) {
    const teams = buildTeamStandings(total, 1952)
    for (const opt of [10, 20, 50, 100, "all"] as const) {
      const first = paginateRows(teams, 1, opt)
      const expectedPages = opt === "all" ? 1 : Math.ceil(total / opt)
      assert.equal(first.totalPages, expectedPages)

      const seenIds: number[] = []
      for (let page = 1; page <= first.totalPages; page += 1) {
        const slice = paginateRows(teams, page, opt)
        assert.equal(slice.page, page)
        seenIds.push(...slice.items.map((t) => t.team_id))
      }

      assert.equal(seenIds.length, total, `Nenhum registro omitido para total=${total}, opt=${opt}`)
      assert.equal(new Set(seenIds).size, total, `Nenhum registro duplicado para total=${total}, opt=${opt}`)
      assert.deepEqual(seenIds, teams.map((t) => t.team_id))
    }
  }
})

test("OP-07.01 - Ordenação global antes da paginação preserva todos os registros entre páginas sem duplicação", () => {
  const teams = buildTeamStandings(22, 1953)
  const sortedByNameDesc = sortRowsBySelector(teams, (r) => r.team_name, "desc")
  assert.equal(sortedByNameDesc.length, 22)
  assert.equal(sortedByNameDesc[0].team_name, "Equipe 1953 #022")
  assert.equal(sortedByNameDesc[21].team_name, "Equipe 1953 #001")

  const page1 = paginateRows(sortedByNameDesc, 1, 10)
  const page2 = paginateRows(sortedByNameDesc, 2, 10)
  const page3 = paginateRows(sortedByNameDesc, 3, 10)
  const combined = [...page1.items, ...page2.items, ...page3.items]
  assert.equal(combined.length, 22)
  assert.equal(new Set(combined.map((t) => t.team_id)).size, 22)
  assert.equal(combined[0].team_name, "Equipe 1953 #022")
  assert.equal(combined[21].team_name, "Equipe 1953 #001")
})

test("OP-07.01 - Contrato de código em dashboard.tsx e data-table.tsx (Desktop/Mobile, reset em temporada/série, estado vazio)", () => {
  const dtSrc = fs.readFileSync(path.join(srcRoot, "components/data-table.tsx"), "utf8")
  const dashSrc = fs.readFileSync(path.join(srcRoot, "pages/dashboard.tsx"), "utf8")

  // Reset de paginação ao mudar seasonParam ou series
  assert.match(dashSrc, /useEffect\(\(\)\s*=>\s*\{\s*setResetPaginationToggle\(\(prev\)\s*=>\s*!prev\)\s*\},\s*\[seasonParam,\s*series\]\)/)

  // Aba de equipes configurada com paginação ativa em todas as temporadas
  const teamsSection = dashSrc.split('<TabsContent value="teams">')[1] ?? ""
  assert.match(teamsSection, /pagination=\{true\}/)
  assert.match(teamsSection, /paginationResetDefaultPage=\{resetPaginationToggle\}/)
  assert.match(teamsSection, /paginationPerPage=\{20\}/)
  assert.match(teamsSection, /paginationRowsPerPageOptions=\{\[10, 20, 50, 100\]\}/)

  // F1DataTable compartilha currentPage e perPage entre Desktop e Mobile, com estado vazio mobile e sortServer
  assert.match(dtSrc, /testId="mobile-pagination"/)
  assert.match(dtSrc, /testId="desktop-pagination"/)
  assert.match(dtSrc, /data-testid="mobile-empty-state"/)
  assert.match(dtSrc, /sortServer/)
  assert.match(dtSrc, /<option value="all">Todos<\/option>/)
})
