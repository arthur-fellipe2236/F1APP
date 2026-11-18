import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

const srcRoot = path.resolve(
  import.meta.dirname ?? path.dirname(new URL(import.meta.url).pathname),
  "../src",
)

function readSrc(rel: string): string {
  return fs.readFileSync(path.join(srcRoot, rel), "utf-8")
}

test("OP-07.04 - TeamInline and TeamName preserve full names with wrapping and min-w-0", () => {
  const teamName = readSrc("components/team-name.tsx")
  assert.match(teamName, /min-w-0 max-w-full/)
  assert.match(teamName, /whitespace-normal break-words/)
  assert.doesNotMatch(teamName, /\btruncate\b/)
})

test("OP-07.04 - Dashboard standings columns have safe widths and wrap rules", () => {
  const dash = readSrc("pages/dashboard.tsx")
  // Equipe and Piloto columns in getDriverColumns / getTeamColumns wrap with minWidth
  assert.match(dash, /name:\s*"Piloto"[\s\S]*?minWidth:\s*"200px"[\s\S]*?wrap:\s*true/)
  assert.match(dash, /name:\s*"Equipe"[\s\S]*?minWidth:\s*"220px"[\s\S]*?wrap:\s*true/)
  // Corridas header must be >= 104px so 'Corridas' + sort icon never truncates
  assert.doesNotMatch(dash, /name:\s*"Corridas",\s*width:\s*"92px"/)
  const corridasMatches = dash.match(/name:\s*"Corridas",\s*width:\s*"104px"/g) ?? []
  assert.equal(corridasMatches.length, 2)
  // Pagination preserved
  assert.match(dash, /pagination\s*&&|pagination\b/)
})

test("OP-07.04 - Race detail results columns define minWidth and wrap for Piloto, Equipe and Status", () => {
  const raceDetail = readSrc("pages/race-detail.tsx")
  assert.match(raceDetail, /name:\s*"Piloto"[\s\S]*?minWidth:\s*"190px"[\s\S]*?wrap:\s*true/)
  assert.match(raceDetail, /name:\s*"Equipe"[\s\S]*?minWidth:\s*"220px"[\s\S]*?wrap:\s*true/)
  assert.match(raceDetail, /name:\s*"Status"[\s\S]*?minWidth:\s*"120px"[\s\S]*?wrap:\s*true/)
  assert.doesNotMatch(raceDetail, /font-bold text-sm leading-tight flex items-center gap-2 truncate/)
})

test("OP-07.04 - Qualifying and practice tables wrap driver/team cell without scale-90 distortion", () => {
  for (const rel of ["components/qualy-results.tsx", "components/practice-results.tsx"]) {
    const content = readSrc(rel)
    assert.match(content, /name:\s*"Piloto"[\s\S]*?minWidth:\s*"240px"[\s\S]*?wrap:\s*true/)
    assert.doesNotMatch(content, /scale-90/)
    assert.match(content, /tabular-nums/)
  }
})

test("OP-07.04 - VirtualDataTable cells prevent horizontal bleed across sticky/adjacent columns", () => {
  const vtable = readSrc("components/virtual-table.tsx")
  assert.match(vtable, /flex min-w-0 overflow-hidden items-center px-4/)
})
