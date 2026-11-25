import test from 'node:test';
import assert from 'node:assert/strict';
import { teamLogo } from '../src/lib/assets';
import { resolveTeamLogo, mapNameToTeamId } from '../src/lib/team-resolver';

test('1. Contextos Históricos Canônicos no teamLogo()', (t) => {
  // Ferrari 1950, 2004, 2024
  const f1950 = teamLogo('Ferrari', 1950);
  assert.ok(f1950);
  assert.equal(f1950?.url, '/teams/ferrari_1950.svg');

  const f2004 = teamLogo('Scuderia Ferrari', 2004);
  assert.ok(f2004);
  assert.equal(f2004?.url, '/teams/ferrari_classic.svg');

  const f2024 = teamLogo('Ferrari', 2024);
  assert.ok(f2024);
  assert.equal(f2024?.url, '/teams/ferrari_modern.svg');

  // McLaren 1974, 1988, 2008, 2024
  const m1974 = teamLogo('McLaren', 1974);
  assert.ok(m1974);
  assert.equal(m1974?.url, '/teams/mclaren_kiwi.svg');

  const m1988 = teamLogo('Marlboro McLaren International', 1988);
  assert.ok(m1988);
  assert.equal(m1988?.url, '/teams/mclaren_classic.svg');

  const m2008 = teamLogo('McLaren Mercedes', 2008);
  assert.ok(m2008);
  assert.equal(m2008?.url, '/teams/mclaren_speedmark.svg');

  const m2024 = teamLogo('McLaren', 2024);
  assert.ok(m2024);
  assert.equal(m2024?.url, '/teams/mclaren_papaya.svg');

  // March 1970
  const march1970 = teamLogo('March', 1970);
  assert.ok(march1970);
  assert.equal(march1970?.url, '/classic/march.svg');

  // Minardi 1990
  const minardi1990 = teamLogo('Minardi', 1990);
  assert.ok(minardi1990);
  assert.equal(minardi1990?.url, '/teams/minardi.svg');

  // Red Bull 2010
  const rbr2010 = teamLogo('Red Bull Racing', 2010);
  assert.ok(rbr2010);
  assert.ok(rbr2010?.url.includes('red_bull') || rbr2010?.url.includes('oracle'));

  // Audi 2026
  const audi2026 = teamLogo('Audi', 2026);
  assert.ok(audi2026);
  assert.equal(audi2026?.url, '/teams/audi_2026.svg');

  // Cadillac 2026
  const cadillac2026 = teamLogo('Cadillac', 2026);
  assert.ok(cadillac2026);
  assert.equal(cadillac2026?.url, '/teams/cadillac.svg');
});

test('2. Discriminação de Homônimos Críticos', (t) => {
  // Team Lotus (Chapman 1972) vs Lotus Enstone (2012)
  const lotusChapman = teamLogo('Lotus', 1972);
  const lotusEnstone = teamLogo('Lotus F1 Team', 2012);
  assert.ok(lotusChapman);
  assert.ok(lotusEnstone);
  assert.equal(lotusChapman?.url, '/teams/teamlotus.svg');
  assert.equal(lotusEnstone?.url, '/teams/lotusf1.svg');

  // Alfa Romeo fábrica 1950 vs Alfa Romeo Sauber 2019
  const alfa1950 = teamLogo('Alfa Romeo', 1950);
  const alfa2019 = teamLogo('Alfa Romeo Racing', 2019);
  assert.ok(alfa1950);
  assert.ok(alfa2019);
  assert.equal(alfa1950?.url, '/teams/alfa_romeo_1950.svg');
  assert.equal(alfa2019?.url, '/teams/alfaromeo.svg');

  // Linhagem Brackley: Tyrrell 1971 vs Mercedes 2014
  const tyrrell1971 = teamLogo('Tyrrell', 1971);
  const merc2014 = teamLogo('Mercedes', 2014);
  assert.ok(tyrrell1971);
  assert.ok(merc2014);
  assert.equal(tyrrell1971?.url, '/teams/tyrrell.svg');
  assert.equal(merc2014?.url, '/teams/mercedes_amg_petronas.svg');
  assert.notEqual(tyrrell1971?.url, merc2014?.url);
});

test('3. Situações Especiais: Quarentena, Pré-Estreia e Pós-Extinção retornam null para placeholder', (t) => {
  // Red Bull em 1995 (antecede fundação em 2005)
  const rbr1995 = teamLogo('Red Bull Racing', 1995);
  assert.equal(rbr1995, null);

  // Tyrrell em 2005 (fechou em 1998)
  const tyr2005 = teamLogo('Tyrrell', 2005);
  assert.equal(tyr2005, null);

  // Brawn GP em 2010 (disputou somente 2009)
  const brawn2010 = teamLogo('Brawn', 2010);
  assert.equal(brawn2010, null);

  // Gordini 1952 (ativo sob quarentena técnica por & não escapado)
  const gordini1952 = teamLogo('Gordini', 1952);
  assert.equal(gordini1952, null);

  // Equipe inexistente
  const fakeTeam = teamLogo('Equipe_Fantasma_XYZ', 1990);
  assert.equal(fakeTeam, null);
});

test('4. Contexto sem Temporada Preserva Comportamento Legado (Não Temporal)', (t) => {
  // Chamada genérica de tema contemporâneo sem season
  const ferrariGeneric = teamLogo('Ferrari');
  assert.ok(ferrariGeneric);
  assert.ok(ferrariGeneric?.url);

  const mercGeneric = teamLogo('Mercedes');
  assert.ok(mercGeneric);
  assert.equal(mercGeneric?.url, '/teams/mercedes_amg_petronas.svg');

  const rbrGeneric = teamLogo('Red Bull Racing');
  assert.ok(rbrGeneric);
  assert.ok(rbrGeneric?.url);
});


test('5. OP-08.06B-T1: Integração de UI para os Reapontamentos do Tier 1', (t) => {
  // Kick Sauber 2024
  const ks = teamLogo('Kick Sauber', 2024);
  assert.ok(ks);
  assert.equal(ks?.url, '/teams/kicksauber.svg');

  // Red Bull 2010 (clássica) vs 2024 (Oracle)
  const rbrClassic = teamLogo('Red Bull Racing', 2010);
  assert.ok(rbrClassic);
  assert.equal(rbrClassic?.url, '/teams/red_bull_racing_classic.svg');

  const rbrOracle = teamLogo('Red Bull Racing', 2024);
  assert.ok(rbrOracle);
  assert.equal(rbrOracle?.url, '/teams/oracle_red_bull_racing.svg');

  // Midland 2006
  const mid = teamLogo('Midland', 2006);
  assert.ok(mid);
  assert.equal(mid?.url, '/teams/mf1_racing.svg');

  // Spyker 2007
  const spy = teamLogo('Spyker', 2007);
  assert.ok(spy);
  assert.equal(spy?.url, '/teams/spyker_f1.svg');

  // Stewart 1997 vs 1998
  const stw97 = teamLogo('Stewart', 1997);
  assert.ok(stw97);
  assert.equal(stw97?.url, '/teams/stewart_1997.svg');

  const stw98 = teamLogo('Stewart', 1998);
  assert.ok(stw98);
  assert.equal(stw98?.url, '/teams/stewart_1998.svg');

  // Arrows 1980 vs Footwork 1994 (degrada graciosamente para null gerando badge com iniciais)
  const arr80 = teamLogo('Arrows', 1980);
  assert.ok(arr80);
  assert.equal(arr80?.url, '/teams/arrows_classic.svg');

  const fw94 = teamLogo('Arrows', 1994);
  assert.equal(fw94, null); // HISTORICAL_GAP gera null de forma segura sem anacronismo
});

test('6. OP-08.06D2: Homologação Integrada dos Novos Ativos Promovidos (T2, T3 e T4)', (t) => {
  // Mercedes 1954 vs Mercedes Moderna 2014
  const merc1954 = teamLogo('Mercedes-Benz', 1954);
  assert.ok(merc1954);
  assert.equal(merc1954?.url, '/teams/mercedes_1954.svg');

  const merc2014 = teamLogo('Mercedes', 2014);
  assert.ok(merc2014);
  assert.equal(merc2014?.url, '/teams/mercedes_amg_petronas.svg');
  assert.notEqual(merc1954?.url, merc2014?.url);

  // Alpine 2021-2026
  const alp2021 = teamLogo('Alpine', 2021);
  assert.ok(alp2021);
  assert.equal(alp2021?.url, '/teams/alpine_2021.svg');

  const alp2024 = teamLogo('Alpine', 2024);
  assert.ok(alp2024);
  assert.equal(alp2024?.url, '/teams/alpine_2021.svg');

  // Audi 2026
  const aud2026 = teamLogo('Audi', 2026);
  assert.ok(aud2026);
  assert.equal(aud2026?.url, '/teams/audi_2026.svg');

  // Gordini 1952 permanece retido sob quarentena para consumo público não autenticado
  const gor = teamLogo('Gordini', 1952);
  assert.equal(gor, null);
});
