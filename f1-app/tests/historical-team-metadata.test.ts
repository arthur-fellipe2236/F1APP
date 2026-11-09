import test from "node:test"
import assert from "node:assert/strict"
import {
  getTeamMetadata,
  getTeamEngine,
  formatTeamHeadquarters,
  HISTORICAL_TEAM_METADATA,
} from "../src/lib/assets"

test("OP-08.08H — Suíte de Testes de Metadados Históricos de Equipes (Temporada 1950 e Regressões)", async (t) => {
  // =========================================================================
  // 1. TEMPORADA 1950: RESOLUÇÃO DOS CONSTRUTORES HISTÓRICOS
  // =========================================================================

  await t.test("1.1 Alfa Romeo histórica (1950): Portello, Milão, 1910 e Motor Alfa Romeo", () => {
    const meta = getTeamMetadata("Alfa Romeo", 1950)
    assert.ok(meta, "Metadados de Alfa Romeo para 1950 devem existir")
    assert.equal(meta.city, "Portello, Milão")
    assert.equal(meta.country, "Itália")
    assert.equal(meta.founded, 1910)
    assert.equal(meta.engine, "Alfa Romeo")
    assert.equal(meta.competitionScope, "EUROPE")
    assert.ok(meta.foundationEntity?.includes("A.L.F.A."))
    assert.equal(getTeamEngine("Alfa Romeo", 1950), "Alfa Romeo")
    // Garantir que não há dados da Sauber
    assert.notEqual(meta.city, "Hinwil")
    assert.notEqual(meta.country, "Suíça")
    assert.notEqual(meta.engine, "Ferrari")
    assert.notEqual(meta.founded, 2018)
  })

  await t.test("1.2 Ferrari histórica (1950): Maranello, Modena, 1947 e Motor Ferrari", () => {
    const meta = getTeamMetadata("Ferrari", 1950)
    assert.ok(meta, "Metadados da Ferrari para 1950 devem existir")
    assert.equal(meta.city, "Maranello, Modena")
    assert.equal(meta.country, "Itália")
    assert.equal(meta.founded, 1947)
    assert.equal(meta.engine, "Ferrari")
    assert.ok(meta.foundationEntity?.includes("Auto Costruzioni Ferrari"))
    assert.equal(getTeamEngine("Ferrari", 1950), "Ferrari")
  })

  await t.test("1.3 Maserati histórica (1950): Escopo duplo comprovado (Europa e Indy 500)", () => {
    const meta = getTeamMetadata("Maserati", 1950)
    assert.ok(meta, "Metadados da Maserati para 1950 devem existir")
    assert.equal(meta.city, "Modena (Viale Ciro Menotti 322)")
    assert.equal(meta.country, "Itália")
    assert.equal(meta.founded, 1914)
    assert.equal(meta.competitionScope, "DUAL")
    assert.ok(meta.notes?.includes("Lou Rassey") || meta.notes?.includes("8CTF"))
    assert.equal(getTeamEngine("Maserati", 1950), "Maserati")
  })

  await t.test("1.4 Cooper (1950): Surbiton, 1946 e Motor JAP (NÃO Coventry Climax)", () => {
    const meta = getTeamMetadata("Cooper", 1950)
    assert.ok(meta, "Metadados da Cooper para 1950 devem existir")
    assert.equal(meta.city, "Surbiton, Surrey")
    assert.equal(meta.country, "Reino Unido")
    assert.equal(meta.founded, 1946)
    assert.equal(meta.engine, "JAP")
    assert.notEqual(meta.engine, "Coventry Climax")
    assert.notEqual(meta.engine, "Climax")
    assert.equal(getTeamEngine("Cooper", 1950), "JAP")
  })

  await t.test("1.5 Simca-Gordini (1950): Paris, 1946 e Motor Gordini", () => {
    const meta = getTeamMetadata("Simca", 1950)
    assert.ok(meta, "Metadados da Simca para 1950 devem existir")
    assert.equal(meta.city, "Paris (Boulevard Victor) / Nanterre")
    assert.equal(meta.country, "França")
    assert.equal(meta.founded, 1946)
    assert.equal(meta.engine, "Gordini")
    assert.equal(getTeamEngine("Simca", 1950), "Gordini")
  })

  await t.test("1.6 Kurtis Kraft (1950) e Documentação da Exceção Cummins", () => {
    const meta = getTeamMetadata("Kurtis Kraft", 1950)
    assert.ok(meta, "Metadados da Kurtis Kraft para 1950 devem existir")
    assert.equal(meta.city, "Glendale, Califórnia")
    assert.equal(meta.country, "Estados Unidos")
    assert.equal(meta.founded, 1938)
    assert.equal(meta.engine, "Offenhauser")
    assert.ok(meta.notes?.includes("Cummins Model JBS-600 Supercharged Diesel"))
    assert.ok(meta.notes?.includes("Carro #61"))
    assert.equal(getTeamEngine("Kurtis Kraft", 1950), "Offenhauser")
  })

  await t.test("1.7 Construtores Indy 500 sem motor documentado individualmente", () => {
    const indyConstructors = ["Adams", "Deidt", "Ewing", "Langley", "Lesovsky", "Marchese", "Moore", "Nichels", "Olson", "Rae", "Snowberger", "Stevens", "Watson", "Wetteroth"]
    for (const name of indyConstructors) {
      const meta = getTeamMetadata(name, 1950)
      assert.ok(meta, `Construtor Indy ${name} deve resolver em 1950`)
      assert.equal(meta.country, "Estados Unidos")
      assert.equal(meta.engine, "Offenhauser")
      assert.equal(meta.competitionScope, "INDY500")
      assert.ok(meta.founded > 1900, `Ano de fundação de ${name} deve ser válido`)
      assert.equal(getTeamEngine(name, 1950), "Offenhauser")
    }
  })

  await t.test("1.8 Resolução Exata e Única das 24 Entidades Canônicas de 1950", () => {
    const entities1950 = [
      "Adams", "Alfa Romeo", "Alta", "Cooper", "Deidt", "ERA", "Ewing", "Ferrari",
      "Kurtis Kraft", "Langley", "Lesovsky", "Marchese", "Maserati", "Milano",
      "Moore", "Nichels", "Olson", "Rae", "Simca", "Snowberger", "Stevens",
      "Talbot-Lago", "Watson", "Wetteroth"
    ]

    const resolved = new Set<string>()
    for (const name of entities1950) {
      const meta = getTeamMetadata(name, 1950)
      assert.ok(meta, `Entidade ${name} deve ser resolvida em 1950`)
      assert.ok(meta.city, `${name} deve ter sede definida`)
      assert.ok(meta.country, `${name} deve ter país definido`)
      assert.ok(meta.engine, `${name} deve ter motor definido`)
      assert.ok(meta.founded, `${name} deve ter ano de fundação definido`)
      resolved.add(meta.canonicalName || name)
    }

    assert.equal(resolved.size, 24, "Devem existir exatamente 24 entidades canônicas distintas sem duplicação")
  })

  // =========================================================================
  // 2. REGRESSÕES: ISOLAMENTO TEMPORAL DAS TEMPORADAS MODERNAS
  // =========================================================================

  await t.test("2.1 Alfa Romeo 2018–2023: Hinwil, Suíça, 2018 e Motor Ferrari (Sauber moderna)", () => {
    for (const season of [2018, 2019, 2021, 2023]) {
      const meta = getTeamMetadata("Alfa Romeo", season)
      assert.ok(meta, `Alfa Romeo deve resolver em ${season}`)
      assert.equal(meta.city, "Hinwil")
      assert.equal(meta.country, "Suíça")
      assert.equal(meta.engine, "Ferrari")
      assert.equal(meta.founded, 2018)
      assert.notEqual(meta.city, "Portello, Milão")
      assert.notEqual(meta.engine, "Alfa Romeo")
    }
  })

  await t.test("2.2 Ferrari 2020–2026: Maranello, Itália e Motor Ferrari", () => {
    for (const season of [2020, 2022, 2024, 2026]) {
      const meta = getTeamMetadata("Ferrari", season)
      assert.ok(meta, `Ferrari deve resolver em ${season}`)
      assert.equal(meta.city, "Maranello")
      assert.equal(meta.country, "Itália")
      assert.equal(meta.engine, "Ferrari")
      assert.equal(getTeamEngine("Ferrari", season), "Ferrari")
    }
  })

  await t.test("2.3 McLaren 1966–2026: Woking, Reino Unido, fundação 1963", () => {
    const meta2024 = getTeamMetadata("McLaren", 2024)
    assert.ok(meta2024, "McLaren deve resolver em 2024")
    assert.equal(meta2024.city, "Woking")
    assert.equal(meta2024.country, "Reino Unido")
    assert.equal(meta2024.founded, 1963)
    assert.equal(getTeamEngine("McLaren", 2024), "Mercedes")
    assert.equal(getTeamEngine("McLaren", 1988), "Honda")
    assert.equal(getTeamEngine("McLaren", 1982), "Ford Cosworth")
  })

  await t.test("2.4 Mercedes: Segmentação 1954–1955 (Stuttgart) vs 2010–2026 (Brackley)", () => {
    const meta1954 = getTeamMetadata("Mercedes", 1954)
    assert.ok(meta1954, "Mercedes 1954 deve resolver")
    assert.equal(meta1954.city, "Stuttgart")
    assert.equal(meta1954.founded, 1954)

    const meta2024 = getTeamMetadata("Mercedes", 2024)
    assert.ok(meta2024, "Mercedes 2024 deve resolver")
    assert.equal(meta2024.city, "Brackley")
    assert.equal(meta2024.founded, 2010)
  })

  await t.test("2.5 Alpine 2021–2026: Enstone, França, 2021 e Motor Renault", () => {
    const meta = getTeamMetadata("Alpine", 2024)
    assert.ok(meta, "Alpine deve resolver em 2024")
    assert.equal(meta.city, "Enstone")
    assert.equal(meta.country, "França")
    assert.equal(meta.founded, 2021)
    assert.equal(getTeamEngine("Alpine", 2024), "Renault")
  })

  await t.test("2.6 Audi 2026: Neuburg an der Donau, Alemanha, 2026 e Motor Audi", () => {
    const meta = getTeamMetadata("Audi", 2026)
    assert.ok(meta, "Audi deve resolver em 2026")
    assert.equal(meta.city, "Neuburg an der Donau")
    assert.equal(meta.country, "Alemanha")
    assert.equal(meta.founded, 2026)
    assert.equal(meta.engine, "Audi")
  })

  await t.test("2.7 Red Bull Racing: Milton Keynes, Reino Unido, fundação 2005", () => {
    const meta = getTeamMetadata("Red Bull Racing", 2024)
    assert.ok(meta, "Red Bull deve resolver em 2024")
    assert.equal(meta.city, "Milton Keynes")
    assert.equal(meta.country, "Reino Unido")
    assert.equal(meta.founded, 2005)
    assert.equal(getTeamEngine("Red Bull Racing", 2024), "Honda RBPT")
    assert.equal(getTeamEngine("Red Bull Racing", 2010), "Renault")
  })

  // =========================================================================
  // 3. QUALIDADE E RESILIÊNCIA A FALHAS / CASOS DE BORDA
  // =========================================================================

  await t.test("3.1 Temporada ausente (undefined): Retrocompatibilidade com fallback estático", () => {
    const meta = getTeamMetadata("Ferrari")
    assert.ok(meta, "Deve retornar fallback estático quando season é omitida")
    assert.equal(meta.city, "Maranello")
    assert.equal(meta.engine, "Ferrari")

    const metaAlfa = getTeamMetadata("Alfa Romeo")
    assert.ok(metaAlfa, "Alfa Romeo sem season deve retornar fallback estático")
    assert.equal(metaAlfa.city, "Hinwil")
  })

  await t.test("3.2 Resolução por nomes alternativos e variações de caixa", () => {
    const metaKurtis = getTeamMetadata("kurtis-kraft", 1950)
    assert.ok(metaKurtis, "kurtis-kraft em minúsculas com hífen deve resolver")
    assert.equal(metaKurtis.canonicalName, "Kurtis Kraft")

    const metaSimca = getTeamMetadata("simca-gordini", 1950)
    assert.ok(metaSimca, "simca-gordini deve resolver para Simca")
    assert.equal(metaSimca.canonicalName, "Simca")

    const metaTalbot = getTeamMetadata("Talbot Lago", 1950)
    assert.ok(metaTalbot, "Talbot Lago sem hífen deve resolver")
    assert.equal(metaTalbot.canonicalName, "Talbot-Lago")
  })

  await t.test("3.3 Entidade inexistente: Retorna null de forma limpa", () => {
    const meta = getTeamMetadata("Equipe Fantasma F1", 1950)
    assert.equal(meta, null)
    assert.equal(getTeamMetadata(null), null)
    assert.equal(getTeamMetadata(undefined), null)
    assert.equal(getTeamMetadata(""), null)
  })

  await t.test("3.4 Intervalo histórico inválido: Não inventa dados e não causa colisão", () => {
    // Adams correu apenas em 1950 no catálogo temporal desta operação
    const metaAdams1990 = getTeamMetadata("Adams", 1990)
    assert.equal(metaAdams1990, null, "Adams não deve resolver em 1990")

    // Cooper em 1950 usa JAP, em 1980 não usa JAP
    const engineCooper1980 = getTeamEngine("Cooper", 1980)
    assert.notEqual(engineCooper1980, "JAP", "Motor JAP não deve vazar para temporadas modernas")
  })

  await t.test("3.5 formatTeamHeadquarters utilitário: Formatação correta com e sem season", () => {
    const hqAlfa1950 = formatTeamHeadquarters(null, null, "Alfa Romeo", 1950)
    assert.equal(hqAlfa1950, "Portello, Milão, Itália")

    const hqAlfaModerna = formatTeamHeadquarters(null, null, "Alfa Romeo", 2021)
    assert.equal(hqAlfaModerna, "Hinwil, Suíça")

    const hqExplicit = formatTeamHeadquarters("Silverstone", "Reino Unido")
    assert.equal(hqExplicit, "Silverstone, Reino Unido")

    const hqNull = formatTeamHeadquarters(null, null, null)
    assert.equal(hqNull, "—")
  })
})
