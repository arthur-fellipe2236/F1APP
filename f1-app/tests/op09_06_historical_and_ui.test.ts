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

test("OP-09.06 - Drivers page columns have explicit minWidth, wrap and include seasonParam in dependencies", () => {
  const driversSrc = readSrc("pages/drivers.tsx")
  assert.match(driversSrc, /name:\s*"Piloto"[\s\S]*?minWidth:\s*"200px"[\s\S]*?wrap:\s*true/)
  assert.match(driversSrc, /name:\s*"Nacionalidade"[\s\S]*?minWidth:\s*"160px"/)
  assert.match(driversSrc, /name:\s*"Equipe"[\s\S]*?minWidth:\s*"220px"[\s\S]*?wrap:\s*true/)
  assert.match(driversSrc, /\[teamNames,\s*seasonParam\]/)
})

test("OP-09.06 - Circuits page columns have explicit minWidth and wrap for circuit and winner", () => {
  const circuitsSrc = readSrc("pages/circuits.tsx")
  assert.match(circuitsSrc, /name:\s*"Circuito"[\s\S]*?minWidth:\s*"220px"[\s\S]*?wrap:\s*true/)
  assert.match(circuitsSrc, /name:\s*"Vencedor"[\s\S]*?minWidth:\s*"200px"[\s\S]*?wrap:\s*true/)
  assert.match(circuitsSrc, /name:\s*"País"[\s\S]*?minWidth:\s*"140px"/)
})

test("OP-09.06 - Standings and tables preserve full names without truncation across components", () => {
  const teamNameSrc = readSrc("components/team-name.tsx")
  const dashSrc = readSrc("pages/dashboard.tsx")
  const raceDetailSrc = readSrc("pages/race-detail.tsx")

  assert.match(teamNameSrc, /whitespace-normal break-words/)
  assert.match(dashSrc, /minWidth:\s*"220px"[\s\S]*?wrap:\s*true/)
  assert.match(raceDetailSrc, /minWidth:\s*"220px"[\s\S]*?wrap:\s*true/)
})
