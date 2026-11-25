import test from "node:test"
import assert from "node:assert/strict"

import {
  selectTop5Drivers,
  resolveNextRaceCardState,
} from "../src/components/next-race-card"
import type { NextRace, DriverStanding } from "../src/lib/api"

// Mock de pilotos de teste
const MOCK_STANDINGS_2026: DriverStanding[] = [
  { position: 1, driver_id: 1, driver_name: "Andrea Kimi Antonelli", driver_code: "ANT", nationality: "Italian", team_name: "Mercedes", points: 402, wins: 8, podiums: 16, races: 21 },
  { position: 2, driver_id: 2, driver_name: "Max Verstappen", driver_code: "VER", nationality: "Dutch", team_name: "Red Bull Racing", points: 388, wins: 7, podiums: 15, races: 21 },
  { position: 3, driver_id: 3, driver_name: "Lando Norris", driver_code: "NOR", nationality: "British", team_name: "McLaren", points: 345, wins: 4, podiums: 13, races: 21 },
  { position: 4, driver_id: 4, driver_name: "Charles Leclerc", driver_code: "LEC", nationality: "Monegasque", team_name: "Ferrari", points: 310, wins: 2, podiums: 11, races: 21 },
  { position: 5, driver_id: 5, driver_name: "Lewis Hamilton", driver_code: "HAM", nationality: "British", team_name: "Ferrari", points: 205, wins: 0, podiums: 6, races: 21 },
  { position: 6, driver_id: 6, driver_name: "George Russell", driver_code: "RUS", nationality: "British", team_name: "Mercedes", points: 198, wins: 0, podiums: 5, races: 21 },
  { position: 7, driver_id: 7, driver_name: "Oscar Piastri", driver_code: "PIA", nationality: "Australian", team_name: "McLaren", points: 195, wins: 0, podiums: 4, races: 21 },
]

test("OP-06.54 [Cenário 1] Existência de corridas futuras: prioridade 1 (mostra próxima corrida)", () => {
  const futureRace: NextRace = {
    source: "formula1.com+openf1",
    round: 22,
    name: "Qatar Grand Prix",
    country: "Qatar",
    location: "Lusail",
    circuit: "Lusail",
    weekend_start: "2026-11-27",
    weekend_end: "2026-11-29",
    race_start: "2026-11-29T16:00:00+00:00",
  }

  const res = resolveNextRaceCardState({
    nextRaceData: futureRace,
    driverStandings: MOCK_STANDINGS_2026,
  })

  assert.equal(res.type, "race", "Deve priorizar a corrida futura")
  assert.equal(res.isTest, false)
  assert.equal(res.race?.name, "Qatar Grand Prix")
  assert.equal(res.race?.round, 22)
})

test("OP-06.54 [Cenário 2] Ausência de corridas e existência de testes futuros: prioridade 2 (mostra teste)", () => {
  const futureTest: NextRace = {
    source: "openf1",
    round: null,
    name: "Pre-Season Testing 2027",
    country: "Bahrain",
    location: "Sakhir",
    circuit: "Bahrain International Circuit",
    weekend_start: "2027-02-18",
    weekend_end: "2027-02-20",
    race_start: "2027-02-18T07:00:00+00:00",
    is_testing: true,
  }

  const res = resolveNextRaceCardState({
    nextRaceData: futureTest,
    driverStandings: MOCK_STANDINGS_2026,
  })

  assert.equal(res.type, "test", "Deve priorizar o teste de pré ou pós-temporada")
  assert.equal(res.isTest, true)
  assert.equal(res.race?.name, "Pre-Season Testing 2027")
})

test("OP-06.54 [Cenário 3] Ausência de corridas e testes: prioridade 3 (mostra Top 5 da temporada encerrada)", () => {
  const offseasonPayload: NextRace = {
    source: "auto",
    offseason: true,
    season: 2026,
    message: "Temporada de Fórmula 1 encerrada.",
    round: null,
    name: null,
    country: null,
    location: null,
    circuit: null,
    weekend_start: "",
    weekend_end: "",
    race_start: null,
  }

  const res = resolveNextRaceCardState({
    nextRaceData: offseasonPayload,
    driverStandings: MOCK_STANDINGS_2026,
  })

  assert.equal(res.type, "top5", "Deve exibir o Top 5 oficial de pilotos")
  assert.equal(res.season, 2026)
  assert.equal(res.standings?.length, 5, "Exibe exatamente 5 pilotos")
  assert.equal(res.standings?.[0].driver_name, "Andrea Kimi Antonelli")
  assert.equal(res.standings?.[0].position, 1)
  assert.equal(res.standings?.[4].driver_name, "Lewis Hamilton")
  assert.equal(res.standings?.[4].position, 5)
  // Pilotos P6 e P7 não devem estar presentes
  assert.ok(!res.standings?.some((d) => d.position > 5), "Apenas os 5 primeiros entram")
})

test("OP-06.54 [Cenário 4] Temporada nova: transição automática e independente de anos fixos", () => {
  // Simulando transição para a temporada 2027
  const newSeasonRace: NextRace = {
    source: "formula1.com+openf1",
    round: 1,
    name: "Australian Grand Prix",
    country: "Australia",
    location: "Melbourne",
    circuit: "Albert Park",
    weekend_start: "2027-03-12",
    weekend_end: "2027-03-14",
    race_start: "2027-03-14T05:00:00+00:00",
    season: 2027,
  }

  const res = resolveNextRaceCardState({
    nextRaceData: newSeasonRace,
    driverStandings: [], // Temporada nova sem classificação inicial
  })

  assert.equal(res.type, "race", "Volta automaticamente a exibir corrida ao iniciar nova temporada")
  assert.equal(res.season, 2027)
  assert.equal(res.race?.name, "Australian Grand Prix")
})

test("OP-06.54 [Cenário 5] Classificação com menos de 5 pilotos disponíveis", () => {
  const shortStandings: DriverStanding[] = [
    { position: 1, driver_id: 101, driver_name: "Piloto Alfa", driver_code: "ALF", nationality: "BR", team_name: "Equipe A", points: 50, wins: 2, podiums: 2, races: 2 },
    { position: 2, driver_id: 102, driver_name: "Piloto Beta", driver_code: "BET", nationality: "IT", team_name: "Equipe B", points: 36, wins: 0, podiums: 2, races: 2 },
    { position: 3, driver_id: 103, driver_name: "Piloto Gama", driver_code: "GAM", nationality: "FR", team_name: "Equipe C", points: 25, wins: 0, podiums: 1, races: 2 },
  ]

  const top5 = selectTop5Drivers(shortStandings)
  assert.equal(top5.length, 3, "Deve retornar os 3 pilotos disponíveis sem quebrar ou dar erro de índice")
  assert.equal(top5[0].driver_name, "Piloto Alfa")
  assert.equal(top5[2].driver_name, "Piloto Gama")
})

test("OP-06.54 [Cenário 6] Empates e ordenação oficial preservados", () => {
  const tiedStandings: DriverStanding[] = [
    { position: 1, driver_id: 1, driver_name: "Campeão", driver_code: "CAM", nationality: "BR", team_name: "Team A", points: 100, wins: 3, podiums: 5, races: 10 },
    // Empatados em 88 pontos (como no caso real da F3: Théophile Naël P5 e Pedro Clerot P6)
    { position: 5, driver_id: 5, driver_name: "Théophile Naël", driver_code: "NAË", nationality: "FR", team_name: "VAR", points: 88, wins: 0, podiums: 0, races: 9 },
    { position: 6, driver_id: 6, driver_name: "Pedro Clerot", driver_code: "CLE", nationality: "BR", team_name: "Rodin", points: 88, wins: 0, podiums: 0, races: 9 },
    { position: 2, driver_id: 2, driver_name: "Vice", driver_code: "VIC", nationality: "DE", team_name: "Team B", points: 95, wins: 2, podiums: 4, races: 10 },
    { position: 3, driver_id: 3, driver_name: "Terceiro", driver_code: "TER", nationality: "ES", team_name: "Team C", points: 92, wins: 1, podiums: 3, races: 10 },
    { position: 4, driver_id: 4, driver_name: "Quarto", driver_code: "QUA", nationality: "GB", team_name: "Team D", points: 90, wins: 1, podiums: 2, races: 10 },
  ]

  const top5 = selectTop5Drivers(tiedStandings)
  assert.equal(top5.length, 5, "Deve conter exatamente 5 pilotos")
  assert.equal(top5[0].position, 1)
  assert.equal(top5[1].position, 2)
  assert.equal(top5[2].position, 3)
  assert.equal(top5[3].position, 4)
  assert.equal(top5[4].position, 5, "Quinto lugar oficial deve ser Théophile Naël pelo critério de desempate oficial")
  assert.equal(top5[4].driver_name, "Théophile Naël")
  assert.ok(!top5.some((d) => d.driver_name === "Pedro Clerot"), "P6 empatado em pontos não entra no Top 5 oficial")
})
