import test from "node:test"
import assert from "node:assert/strict"
import { teamLogo } from "../src/lib/assets"
import { mapNameToTeamId, resolveTeamLogo } from "../src/lib/team-resolver"

test("OP-08.08H-R3.3 — Testes de Resolução de Logos Históricas (Marchese, Watson, March, ATS)", async (t) => {
  // =========================================================================
  // CENÁRIO A: MARCHESE E WATSON HISTÓRICAS (1950 E 1951)
  // =========================================================================

  await t.test("A.1 Marchese (1950): Deve resolver para /teams/marchese.svg", () => {
    const cId = mapNameToTeamId("Marchese", 1950)
    assert.equal(cId, null, "Marchese não deve ser mapeado para MARCH")
    const logo = teamLogo("Marchese", 1950)
    assert.ok(logo, "Logo de Marchese para 1950 deve existir")
    assert.equal(logo.url, "/teams/marchese.svg")
    assert.equal(logo.color, "#1A1205")
  })

  await t.test("A.2 Marchese (1951): Deve resolver para /teams/marchese.svg", () => {
    const cId = mapNameToTeamId("Marchese", 1951)
    assert.equal(cId, null, "Marchese 1951 não deve ser mapeado para MARCH")
    const logo = teamLogo("Marchese", 1951)
    assert.ok(logo, "Logo de Marchese para 1951 deve existir")
    assert.equal(logo.url, "/teams/marchese.svg")
  })

  await t.test("A.3 Watson (1950): Deve resolver para /teams/watson.svg", () => {
    const cId = mapNameToTeamId("Watson", 1950)
    assert.equal(cId, null, "Watson não deve ser mapeado para ATS")
    const logo = teamLogo("Watson", 1950)
    assert.ok(logo, "Logo de Watson para 1950 deve existir")
    assert.equal(logo.url, "/teams/watson.svg")
    assert.equal(logo.color, "#1C1400")
  })

  await t.test("A.4 Watson (1951): Deve resolver para /teams/watson.svg", () => {
    const cId = mapNameToTeamId("Watson", 1951)
    assert.equal(cId, null, "Watson 1951 não deve ser mapeado para ATS")
    const logo = teamLogo("Watson", 1951)
    assert.ok(logo, "Logo de Watson para 1951 deve existir")
    assert.equal(logo.url, "/teams/watson.svg")
  })

  // =========================================================================
  // CENÁRIO B: MARCH VERDADEIRA (SEM COLISÃO COM MARCHESE)
  // =========================================================================

  await t.test("B.1 March (1970): Deve resolver para /classic/march.svg", () => {
    const cId = mapNameToTeamId("March", 1970)
    assert.equal(cId, "MARCH")
    const resolved = resolveTeamLogo("MARCH", 1970)
    assert.equal(resolved.status, "FOUND")
    assert.equal(resolved.assetPath, "/classic/march.svg")
    const logo = teamLogo("March", 1970)
    assert.ok(logo)
    assert.equal(logo.url, "/classic/march.svg")
  })

  await t.test("B.2 March Engineering (1971): Deve resolver para /classic/march.svg", () => {
    const cId = mapNameToTeamId("March Engineering", 1971)
    assert.equal(cId, "MARCH")
    const logo = teamLogo("March Engineering", 1971)
    assert.ok(logo)
    assert.equal(logo.url, "/classic/march.svg")
  })

  await t.test("B.3 March (1950): Não deve ser classificado como Marchese e deve retornar BEFORE_ORIGIN / null", () => {
    const cId = mapNameToTeamId("March", 1950)
    assert.equal(cId, "MARCH")
    const resolved = resolveTeamLogo("MARCH", 1950)
    assert.equal(resolved.status, "BEFORE_ORIGIN")
    const logo = teamLogo("March", 1950)
    assert.equal(logo, null, "March em 1950 não deve existir e não deve colidir com Marchese")
  })

  // =========================================================================
  // CENÁRIO C: ATS VERDADEIRA (SEM COLISÃO COM WATSON)
  // =========================================================================

  await t.test("C.1 ATS (1980): Deve resolver para /classic/ats.svg", () => {
    const cId = mapNameToTeamId("ATS", 1980)
    assert.equal(cId, "ATS")
    const resolved = resolveTeamLogo("ATS", 1980)
    assert.equal(resolved.status, "FOUND")
    assert.equal(resolved.assetPath, "/classic/ats.svg")
    const logo = teamLogo("ATS", 1980)
    assert.ok(logo)
    assert.equal(logo.url, "/classic/ats.svg")
  })

  await t.test("C.2 ATS Racing Team (1982): Deve resolver para /classic/ats.svg", () => {
    const cId = mapNameToTeamId("ATS Racing Team", 1982)
    assert.equal(cId, "ATS")
    const logo = teamLogo("ATS Racing Team", 1982)
    assert.ok(logo)
    assert.equal(logo.url, "/classic/ats.svg")
  })

  await t.test("C.3 Watson (1950): Não deve ser classificado como ATS", () => {
    const cId = mapNameToTeamId("Watson", 1950)
    assert.notEqual(cId, "ATS")
    const logo = teamLogo("Watson", 1950)
    assert.ok(logo)
    assert.equal(logo.url, "/teams/watson.svg")
  })

  // =========================================================================
  // CENÁRIO D: REGRESSÕES HISTÓRICAS E MODERNAS
  // =========================================================================

  await t.test("D.1 Alfa Romeo 1950: Deve resolver para logo histórica", () => {
    const logo = teamLogo("Alfa Romeo", 1950)
    assert.ok(logo)
    assert.equal(logo.url, "/teams/alfa_romeo_1950.svg")
  })

  await t.test("D.2 Ferrari 1950: Deve resolver para logo clássica de 1950", () => {
    const logo = teamLogo("Ferrari", 1950)
    assert.ok(logo)
    assert.equal(logo.url, "/teams/ferrari_1950.svg")
  })

  await t.test("D.3 Maserati 1950: Deve resolver para /classic/maserati.svg", () => {
    const logo = teamLogo("Maserati", 1950)
    assert.ok(logo)
    assert.equal(logo.url, "/classic/maserati.svg")
  })

  await t.test("D.4 Cooper 1950: Deve resolver para /classic/cooper.svg", () => {
    const logo = teamLogo("Cooper", 1950)
    assert.ok(logo)
    assert.equal(logo.url, "/classic/cooper.svg")
  })

  await t.test("D.5 Mercedes 1954: Deve resolver para Mercedes clássica", () => {
    const logo = teamLogo("Mercedes", 1954)
    assert.ok(logo)
    assert.equal(logo.url, "/teams/mercedes_1954.svg")
  })

  await t.test("D.6 Ferrari moderna (2024): Deve resolver para Scuderia Ferrari HP moderna", () => {
    const logo = teamLogo("Ferrari", 2024)
    assert.ok(logo)
    assert.ok(logo.url.includes("ferrari"))
  })

  await t.test("D.7 McLaren moderna (2024): Deve resolver para McLaren moderna", () => {
    const logo = teamLogo("McLaren", 2024)
    assert.ok(logo)
    assert.equal(logo.url, "/teams/mclaren_papaya.svg")
  })

  await t.test("D.8 Red Bull moderna (2024): Deve resolver para Oracle Red Bull Racing", () => {
    const logo = teamLogo("Red Bull", 2024)
    assert.ok(logo)
    assert.equal(logo.url, "/teams/oracle_red_bull_racing.svg")
  })

  await t.test("D.9 Audi (2026): Deve resolver para Audi oficial", () => {
    const logo = teamLogo("Audi", 2026)
    assert.ok(logo)
    assert.equal(logo.url, "/teams/audi_2026.svg")
  })
})
