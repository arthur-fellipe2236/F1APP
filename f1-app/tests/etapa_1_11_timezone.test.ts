import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

import {
  DISPLAY_TIME_ZONE,
  formatSessionDateTime,
  formatSessionDateTimeLong,
  formatSessionDayMonth,
  formatSessionTime,
  formatSessionTimeSeconds,
  formatSessionWeekdayDate,
  instantMs,
  parseInstant,
} from "../src/lib/datetime"

const srcRoot = path.resolve(import.meta.dirname ?? path.dirname(new URL(import.meta.url).pathname), "../src")
const read = (p: string) => fs.readFileSync(path.join(srcRoot, p), "utf8")

const BROWSER_ZONES = [
  "America/Sao_Paulo",
  "UTC",
  "Europe/Lisbon",
  "Asia/Tokyo",
  "America/Los_Angeles",
  "Pacific/Kiritimati",
  "Australia/Lord_Howe",
]

// Instantes UTC entregues pela API (OpenF1 validada) -> esperado em Brasilia.
const CASES = [
  { name: "Las Vegas - corrida", utc: "2026-11-22T04:00:00+00:00", time: "01:00", dayMonth: "22/11" },
  { name: "Las Vegas - TL2 (cruza a data)", utc: "2026-11-20T04:00:00+00:00", time: "01:00", dayMonth: "20/11" },
  { name: "Catar - corrida", utc: "2026-11-29T16:00:00+00:00", time: "13:00", dayMonth: "29/11" },
  { name: "Singapura - corrida", utc: "2026-10-11T12:00:00+00:00", time: "09:00", dayMonth: "11/10" },
  { name: "Austin - corrida", utc: "2026-10-25T20:00:00+00:00", time: "17:00", dayMonth: "25/10" },
  { name: "Mexico - corrida", utc: "2026-11-01T20:00:00+00:00", time: "17:00", dayMonth: "01/11" },
  { name: "Europa (CEST) - 13:00Z", utc: "2026-09-13T13:00:00+00:00", time: "10:00", dayMonth: "13/09" },
  { name: "Europa (CET) - 14:00Z", utc: "2026-11-01T14:00:00+00:00", time: "11:00", dayMonth: "01/11" },
  { name: "Melbourne - cruza para o dia anterior", utc: "2026-03-06T00:00:00Z", time: "21:00", dayMonth: "05/03" },
  { name: "Offset explicito -03:00 equivale ao mesmo instante", utc: "2026-11-22T01:00:00-03:00", time: "01:00", dayMonth: "22/11" },
]

test("datetime - horarios em Brasilia independem do fuso do navegador (7 fusos x 10 casos)", () => {
  const original = process.env.TZ
  try {
    for (const c of CASES) {
      const results = new Set<string>()
      for (const zone of BROWSER_ZONES) {
        process.env.TZ = zone
        assert.equal(formatSessionTime(c.utc), c.time, `${c.name} @ ${zone}`)
        assert.equal(formatSessionDayMonth(c.utc), c.dayMonth, `${c.name} @ ${zone}`)
        results.add(
          [
            formatSessionTime(c.utc),
            formatSessionDayMonth(c.utc),
            formatSessionWeekdayDate(c.utc),
            formatSessionDateTime(c.utc),
            formatSessionDateTimeLong(c.utc),
            formatSessionTimeSeconds(c.utc),
          ].join("|"),
        )
      }
      assert.equal(results.size, 1, `${c.name}: saida varia com o fuso do navegador`)
    }
  } finally {
    if (original === undefined) delete process.env.TZ
    else process.env.TZ = original
  }
})

test("datetime - Las Vegas: calendario e card usam a mesma regra (corrida dom 22/11 01:00 Brasilia)", () => {
  const race = "2026-11-22T04:00:00+00:00"
  assert.match(formatSessionDateTime(race), /22/)
  assert.match(formatSessionDateTime(race), /01:00/)
  assert.match(formatSessionDateTimeLong(race), /22\/11\/2026/)
  assert.match(formatSessionDateTimeLong(race), /01:00/)
})

test("datetime - horario ausente, sem fuso ou invalido nao e inventado", () => {
  for (const bad of [null, undefined, "", "   ", "lixo", "2026-11-22", "2026-11-22T04:00:00", "2026-11-22T04:00", "2026-13-40T99:00:00Z"]) {
    assert.equal(parseInstant(bad as any), null, String(bad))
    assert.equal(instantMs(bad as any), null, String(bad))
    assert.equal(formatSessionTime(bad as any), "--:--")
  }
  assert.equal(formatSessionDateTime(null), "Horário a confirmar")
  assert.equal(formatSessionDateTimeLong("2026-11-22T04:00:00"), "Horário a confirmar")
})

test("datetime - contagem regressiva usa epoch UTC e corresponde ao instante", () => {
  const iso = "2026-11-22T04:00:00+00:00"
  assert.equal(instantMs(iso), Date.UTC(2026, 10, 22, 4, 0, 0))
  assert.equal(instantMs("2026-11-22T01:00:00-03:00"), instantMs(iso))
  const now = Date.UTC(2026, 10, 21, 22, 0, 0)
  const distance = (instantMs(iso) as number) - now
  assert.equal(distance, 6 * 3_600_000)
})

test("datetime - fuso de exibicao e America/Sao_Paulo", () => {
  assert.equal(DISPLAY_TIME_ZONE, "America/Sao_Paulo")
  const lib = read("lib/datetime.ts")
  assert.match(lib, /timeZone: DISPLAY_TIME_ZONE/)
  assert.match(lib, /"pt-BR"/)
})

test("telas - todas as exibicoes de horario passam pela politica unica (sem fuso do navegador)", () => {
  const files = ["pages/races.tsx", "pages/race-detail.tsx", "pages/live-timing.tsx", "components/next-race-card.tsx"]
  for (const f of files) {
    const src = read(f)
    assert.match(src, /@\/lib\/datetime/, `${f} deve importar lib/datetime`)
    assert.doesNotMatch(src, /toLocaleTimeString|toLocaleDateString/, `${f} usa fuso do navegador`)
    assert.doesNotMatch(src, /new Date\([^)]*date_(start|end)[^)]*\)/, `${f} converte date_* manualmente`)
    assert.doesNotMatch(src, /Seu Fuso Local|horário local\)/, `${f} rotula fuso do navegador`)
  }
  // contagens regressivas baseadas em epoch
  assert.match(read("pages/races.tsx"), /instantMs\(nextSession\.date_start\)/)
  assert.match(read("pages/live-timing.tsx"), /instantMs\(targetDate\)/)
  assert.match(read("components/next-race-card.tsx"), /instantMs\(target\)/)
  // sem offsets fixos manuais
  for (const f of [...files, "lib/datetime.ts"]) {
    assert.doesNotMatch(read(f), /[-+]\s*3\s*\*\s*(60|3600)|getTimezoneOffset|UTC-3|-03:00/, `${f} usa offset manual`)
  }
})

test("telas - indicacao de dados desatualizados e rotulo de Brasilia presentes", () => {
  assert.match(read("components/next-race-card.tsx"), /schedule-stale/)
  assert.match(read("pages/races.tsx"), /DISPLAY_TIME_ZONE_LABEL/)
  assert.match(read("pages/live-timing.tsx"), /DISPLAY_TIME_ZONE_LABEL/)
})
