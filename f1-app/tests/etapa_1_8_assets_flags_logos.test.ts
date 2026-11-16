import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

import {
  driverPhoto,
  flagFromCountry,
  flagFromNationality,
  formatNationality,
  teamLogo,
} from "../src/lib/assets"

const f1AppRoot = path.resolve(import.meta.dirname ?? path.dirname(new URL(import.meta.url).pathname), "..")
const publicDir = path.join(f1AppRoot, "public")
const srcDir = path.join(f1AppRoot, "src")

test("Gordini SVG e demais SVGs em public/teams possuem XML bem formado", () => {
  const teamsDir = path.join(publicDir, "teams")
  const svgs = fs.readdirSync(teamsDir).filter((f) => f.endsWith(".svg"))
  assert.ok(svgs.length > 50, "Deve haver SVGs de equipes em public/teams")

  const gordini = fs.readFileSync(path.join(teamsDir, "gordini.svg"), "utf8")
  assert.match(gordini, /TYPE 16 &amp; 32/, "gordini.svg deve escapar '&' como '&amp;'")

  for (const file of svgs) {
    const content = fs.readFileSync(path.join(teamsDir, file), "utf8")
    const withoutComments = content.replace(/<!--[\s\S]*?-->/g, "")
    assert.match(withoutComments, /<(?:[a-zA-Z0-9_-]+:)?svg[\s>]/, `${file} deve conter tag <svg>`)
    assert.match(withoutComments, /<\/(?:[a-zA-Z0-9_-]+:)?svg>\s*$/, `${file} deve fechar </svg>`)
    // Garante que não há '&' solto fora de comentários e entidades XML válidas
    assert.doesNotMatch(
      withoutComments,
      /&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/,
      `${file} não pode conter '&' não escapado`,
    )
  }
})

test("flagFromNationality cobre nacionalidades históricas e atuais de F1/F2/F3", () => {
  const expected: Array<[string, string]> = [
    ["Rhodesian", "zw"],
    ["East German", "de"],
    ["Uruguayan", "uy"],
    ["Chilean", "cl"],
    ["Czech", "cz"],
    ["Liechtensteiner", "li"],
    ["Russian", "ru"],
    ["Britânico", "gb"],
    ["Italiano", "it"],
    ["Brasileiro", "br"],
  ]

  for (const [nat, iso] of expected) {
    assert.equal(
      flagFromNationality(nat),
      `https://flagcdn.com/w40/${iso}.png`,
      `Nacionalidade '${nat}' deve mapear para ISO '${iso}'`,
    )
  }

  assert.equal(flagFromNationality("N/A"), null)
  assert.equal(flagFromNationality(null), null)
})

test("flagFromCountry cobre países das equipes Jordan, Theodore e Amon", () => {
  assert.equal(flagFromCountry("Irlanda"), "https://flagcdn.com/w40/ie.png")
  assert.equal(flagFromCountry("Hong Kong"), "https://flagcdn.com/w40/hk.png")
  assert.equal(flagFromCountry("Nova Zelândia"), "https://flagcdn.com/w40/nz.png")
  assert.equal(flagFromCountry("Reino Unido"), "https://flagcdn.com/w40/gb.png")
})

test("formatNationality normaliza nacionalidades em inglês para português brasileiro", () => {
  assert.equal(formatNationality("Russian"), "Russo")
  assert.equal(formatNationality("Uruguayan"), "Uruguaio")
  assert.equal(formatNationality("East German"), "Alemão Oriental")
  assert.equal(formatNationality("Rhodesian"), "Rodesiano")
  assert.equal(formatNationality("Chilean"), "Chileno")
  assert.equal(formatNationality("Czech"), "Tcheco")
  assert.equal(formatNationality("Liechtensteiner"), "Liechtensteinense")
  assert.equal(formatNationality("Colombian"), "Colombiano")
  assert.equal(formatNationality("Portuguese"), "Português")
  assert.equal(formatNationality("Venezuelan"), "Venezuelano")
  assert.equal(formatNationality("Indian"), "Indiano")
  assert.equal(formatNationality("Hungarian"), "Húngaro")
  assert.equal(formatNationality("Indonesian"), "Indonésio")
  assert.equal(formatNationality("Malaysian"), "Malaio")

  // Preserva valores já em português e trata N/A/null
  assert.equal(formatNationality("Britânico"), "Britânico")
  assert.equal(formatNationality("Italiano"), "Italiano")
  assert.equal(formatNationality("N/A"), "")
  assert.equal(formatNationality(null), "")
})

test("Fallback de fotos históricas em driverPhoto e circuits.tsx sem avatar de Antonelli", () => {
  assert.equal(driverPhoto("Giuseppe Farina", undefined, null), "/drivers/farina.jpg")
  assert.equal(driverPhoto("Alberto Ascari", undefined, null), "/drivers/ascari.jpg")
  assert.equal(driverPhoto("Piloto Histórico Sem Foto", undefined, null), null)

  const circuitsSrc = fs.readFileSync(path.join(srcDir, "pages/circuits.tsx"), "utf8")
  assert.doesNotMatch(circuitsSrc, /FALLBACK_AVATAR/)
  assert.doesNotMatch(circuitsSrc, /ANDANT01/)
  assert.match(circuitsSrc, /driverPhoto\(/)
  assert.match(circuitsSrc, /WinnerAvatar/)
})

test("Todos os caminhos locais referenciados em assets.ts existem em public/", () => {
  const assetsSrc = fs.readFileSync(path.join(srcDir, "lib/assets.ts"), "utf8")
  const localPaths = [
    ...new Set(
      [...assetsSrc.matchAll(/["'](\/(?:teams|logos|drivers|engines|f2|f3|classic|backgrounds)\/[^"']+)["']/g)].map(
        (m) => m[1],
      ),
    ),
  ]
  assert.ok(localPaths.length > 200, "Deve extrair os caminhos locais de assets.ts")

  const missing = localPaths.filter((p) => !fs.existsSync(path.join(publicDir, p)))
  assert.deepEqual(missing, [], "Nenhum asset local referenciado em assets.ts pode estar ausente")

  assert.equal(teamLogo("Gordini")?.url, "/teams/gordini.svg")
})
