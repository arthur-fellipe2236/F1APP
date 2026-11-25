import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveTeamLogo, getTeamHistoricalBounds, getAllCatalogedTeamIds, HISTORICAL_REGISTRY } from '../src/lib/team-resolver';

test('1. Temporadas Canônicas Representativas (1950, 1970, 1990, 2010, 2026)', (t) => {
  // 1950: Maserati
  const maserati1950 = resolveTeamLogo('MASERATI', 1950);
  assert.equal(maserati1950.status, 'FOUND');
  assert.equal(maserati1950.selectedEntry?.logo_id, 'MAS-1950');
  assert.equal(maserati1950.assetPath, '/classic/maserati.svg');

  // 1970: March
  const march1970 = resolveTeamLogo('MARCH', 1970);
  assert.equal(march1970.status, 'FOUND');
  assert.equal(march1970.selectedEntry?.logo_id, 'MAR-1970');
  assert.equal(march1970.assetPath, '/classic/march.svg');

  // 1990: Minardi
  const minardi1990 = resolveTeamLogo('MINARDI', 1990);
  assert.equal(minardi1990.status, 'FOUND');
  assert.equal(minardi1990.selectedEntry?.logo_id, 'MIN-1985');
  assert.equal(minardi1990.assetPath, '/teams/minardi.svg');

  // 2010: Red Bull
  const rbr2010 = resolveTeamLogo('RED_BULL_RACING', 2010);
  assert.equal(rbr2010.status, 'FOUND');
  assert.equal(rbr2010.selectedEntry?.logo_id, 'RBR-2005');

  // 2026: Audi e Cadillac
  const audi2026 = resolveTeamLogo('AUDI_WORKS', 2026);
  assert.equal(audi2026.status, 'FOUND');
  assert.equal(audi2026.selectedEntry?.logo_id, 'AUDI-2026');

  const cadillac2026 = resolveTeamLogo('CADILLAC_WORKS', 2026);
  assert.equal(cadillac2026.status, 'FOUND');
  assert.equal(cadillac2026.selectedEntry?.logo_id, 'CAD-2026');
});

test('2. Transição Temporal de Eras da Ferrari', (t) => {
  const f1950 = resolveTeamLogo('FERRARI', 1950);
  assert.equal(f1950.status, 'FOUND');
  assert.equal(f1950.selectedEntry?.logo_id, 'FER-1950');

  const f2004 = resolveTeamLogo('FERRARI', 2004);
  assert.equal(f2004.status, 'FOUND');
  assert.equal(f2004.selectedEntry?.logo_id, 'FER-1997');

  const f2024 = resolveTeamLogo('FERRARI', 2024);
  assert.equal(f2024.status, 'FOUND');
  assert.equal(f2024.selectedEntry?.logo_id, 'FER-2020');
});

test('3. Transição Temporal de Eras da McLaren', (t) => {
  const m1974 = resolveTeamLogo('MCLAREN', 1974);
  assert.equal(m1974.status, 'FOUND');
  assert.equal(m1974.selectedEntry?.logo_id, 'MCL-1967');

  const m1988 = resolveTeamLogo('MCLAREN', 1988);
  assert.equal(m1988.status, 'FOUND');
  assert.equal(m1988.selectedEntry?.logo_id, 'MCL-1981');

  const m2008 = resolveTeamLogo('MCLAREN', 2008);
  assert.equal(m2008.status, 'FOUND');
  assert.equal(m2008.selectedEntry?.logo_id, 'MCL-1997');

  const m2024 = resolveTeamLogo('MCLAREN', 2024);
  assert.equal(m2024.status, 'FOUND');
  assert.equal(m2024.selectedEntry?.logo_id, 'MCL-2017');
});

test('4. Discriminação Rigorosa de Homônimos', (t) => {
  // Team Lotus (Chapman 1958-1994) vs Lotus F1 Team (Enstone 2012-2015)
  const lotusChapman = resolveTeamLogo('LOTUS_CLASSIC', 1972);
  const lotusEnstone = resolveTeamLogo('LOTUS_ENSTONE', 2012);
  assert.equal(lotusChapman.status, 'FOUND');
  assert.equal(lotusEnstone.status, 'FOUND');
  assert.notEqual(lotusChapman.selectedEntry?.lineage_id, lotusEnstone.selectedEntry?.lineage_id);
  assert.equal(lotusChapman.selectedEntry?.lineage_id, 'INDEP-LOTUS');
  assert.equal(lotusEnstone.selectedEntry?.lineage_id, 'LIN-ENSTONE');

  // Alfa Romeo fábrica 1950 vs Alfa Romeo Sauber 2019
  const alfa1950 = resolveTeamLogo('ALFA_ROMEO_WORKS1', 1950);
  const alfa2019 = resolveTeamLogo('ALFA_ROMEO_SAUBER', 2019);
  assert.equal(alfa1950.status, 'FOUND');
  assert.equal(alfa2019.status, 'FOUND');
  assert.notEqual(alfa1950.selectedEntry?.lineage_id, alfa2019.selectedEntry?.lineage_id);
  assert.equal(alfa1950.selectedEntry?.lineage_id, 'PIONEER-ALFA');
  assert.equal(alfa2019.selectedEntry?.lineage_id, 'LIN-HINWIL');
});

test('5. Isolamento de Linhagem Industrial (Tyrrell vs Mercedes)', (t) => {
  const tyrrell1971 = resolveTeamLogo('TYRRELL', 1971);
  const mercedes2014 = resolveTeamLogo('MERCEDES_MODERN', 2014);
  assert.equal(tyrrell1971.status, 'FOUND');
  assert.equal(mercedes2014.status, 'FOUND');
  assert.equal(tyrrell1971.selectedEntry?.lineage_id, 'LIN-BRACKLEY');
  assert.equal(mercedes2014.selectedEntry?.lineage_id, 'LIN-BRACKLEY');
  assert.equal(tyrrell1971.selectedEntry?.constructor_name, 'Tyrrell');
  assert.equal(mercedes2014.selectedEntry?.constructor_name, 'Mercedes');
  assert.notEqual(tyrrell1971.assetPath, mercedes2014.assetPath);
});

test('6. Validação de Fronteiras Cronológicas (BEFORE_ORIGIN e AFTER_DECEASE)', (t) => {
  // Red Bull antes de 2005
  const rbr1995 = resolveTeamLogo('RED_BULL_RACING', 1995);
  assert.equal(rbr1995.status, 'BEFORE_ORIGIN');
  assert.equal(rbr1995.matched, false);
  assert.equal(rbr1995.selectedEntry, null);

  // Williams antes de 1977
  const wil1970 = resolveTeamLogo('WILLIAMS', 1970);
  assert.equal(wil1970.status, 'BEFORE_ORIGIN');

  // Tyrrell após 1998
  const tyr2005 = resolveTeamLogo('TYRRELL', 2005);
  assert.equal(tyr2005.status, 'AFTER_DECEASE');

  // Brawn GP após 2009
  const brawn2010 = resolveTeamLogo('BRAWN', 2010);
  assert.equal(brawn2010.status, 'AFTER_DECEASE');
});

test('7. Temporadas Exatamente nas Bordas do Intervalo (Inclusive Bounds)', (t) => {
  // Brawn GP iniciou e terminou em 2009
  const brawnExact = resolveTeamLogo('BRAWN', 2009);
  assert.equal(brawnExact.status, 'FOUND');
  assert.equal(brawnExact.selectedEntry?.logo_id, 'BRAWN-2009');

  // Minardi: início em 1985 e fim em 2005
  const minardiStart = resolveTeamLogo('MINARDI', 1985);
  assert.equal(minardiStart.status, 'FOUND');

  const minardiEnd = resolveTeamLogo('MINARDI', 2005);
  assert.equal(minardiEnd.status, 'FOUND');
});

test('8. Equipe Inexistente', (t) => {
  const fake = resolveTeamLogo('EQUIPE_FANTASMA_123', 2024);
  assert.equal(fake.status, 'TEAM_NOT_FOUND');
  assert.equal(fake.matched, false);
  assert.equal(fake.reasonCode, 'ERR_UNKNOWN_TEAM');
});

test('9. Quarentena e Rejeição de Ativos Inconsistentes', (t) => {
  // Gordini tem sintaxe XML inconsistente no arquivo original (& não escapado)
  const gordini = resolveTeamLogo('GORDINI', 1952);
  assert.equal(gordini.status, 'QUARANTINED_OR_INVALID');
  assert.equal(gordini.matched, false);
  assert.equal(gordini.reasonCode, 'SEC_RIGHTS_OR_CORRUPT_ASSET');

  // Com allowQuarantined: true, deve retornar o registro para inspeção
  const gordiniAllowed = resolveTeamLogo('GORDINI', 1952, { allowQuarantined: true });
  assert.equal(gordiniAllowed.status, 'FOUND');
  assert.equal(gordiniAllowed.selectedEntry?.logo_id, 'GOR-1950');
});

test('10. Ausência de Fallback Automático Anacrônico', (t) => {
  // Consulta de temporada pós-morte não deve retornar a logo moderna da sucessora
  const tolemanModern = resolveTeamLogo('TOLEMAN', 2024);
  assert.equal(tolemanModern.status, 'AFTER_DECEASE');
  assert.equal(tolemanModern.assetPath, null);
  assert.equal(tolemanModern.matched, false);
});

test('11. Determinismo de Variantes e Prioridade', (t) => {
  const f2024 = resolveTeamLogo('FERRARI', 2024, { variantPreference: 'primary_official' });
  assert.equal(f2024.status, 'FOUND');
  assert.equal(f2024.selectedVariant, 'primary_official');
});

test('12. Utilitários Auxiliares de Consulta', (t) => {
  const bounds = getTeamHistoricalBounds('FERRARI');
  assert.ok(bounds);
  assert.equal(bounds.minSeason, 1950);
  assert.equal(bounds.maxSeason, 2026);

  const allTeams = getAllCatalogedTeamIds();
  assert.ok(allTeams.length >= 30);
  assert.ok(allTeams.includes('FERRARI'));
  assert.ok(allTeams.includes('WILLIAMS'));
  assert.ok(allTeams.includes('MCLAREN'));
});


// ============================================================================
// OP-08.06B-T1: VALIDAÇÕES ESPECÍFICAS DOS OITO REAPONTAMENTOS TIER 1
// ============================================================================

test('13. Kick Sauber: 2024-2025 resolve para kicksauber.svg e limites temporais', (t) => {
  const ks2024 = resolveTeamLogo('KICK_SAUBER', 2024);
  assert.equal(ks2024.status, 'FOUND');
  assert.equal(ks2024.assetPath, '/teams/kicksauber.svg');
  assert.equal(ks2024.selectedEntry?.logo_id, 'KICK-2024');

  const ks2025 = resolveTeamLogo('KICK_SAUBER', 2025);
  assert.equal(ks2025.status, 'FOUND');
  assert.equal(ks2025.assetPath, '/teams/kicksauber.svg');

  // Fora do intervalo (2023 é Alfa Romeo / pós 2025 é Audi)
  const ks2023 = resolveTeamLogo('KICK_SAUBER', 2023);
  assert.equal(ks2023.status, 'BEFORE_ORIGIN');
  assert.equal(ks2023.assetPath, null);

  const ks2026 = resolveTeamLogo('KICK_SAUBER', 2026);
  assert.equal(ks2026.status, 'AFTER_DECEASE');
  assert.equal(ks2026.assetPath, null);
});

test('14. Red Bull Racing: Segmentação 2005-2021 (clássica) vs 2022-2026 (Oracle)', (t) => {
  // Clássica sem Oracle
  const rbr2005 = resolveTeamLogo('RED_BULL_RACING', 2005);
  assert.equal(rbr2005.status, 'FOUND');
  assert.equal(rbr2005.assetPath, '/teams/red_bull_racing_classic.svg');
  assert.ok(!rbr2005.assetPath?.includes('oracle'));

  const rbr2010 = resolveTeamLogo('RED_BULL_RACING', 2010);
  assert.equal(rbr2010.status, 'FOUND');
  assert.equal(rbr2010.assetPath, '/teams/red_bull_racing_classic.svg');

  const rbr2021 = resolveTeamLogo('RED_BULL_RACING', 2021);
  assert.equal(rbr2021.status, 'FOUND');
  assert.equal(rbr2021.assetPath, '/teams/red_bull_racing_classic.svg');
  assert.equal(rbr2021.selectedEntry?.logo_id, 'RBR-2005');

  // Contemporânea com Oracle
  const rbr2022 = resolveTeamLogo('RED_BULL_RACING', 2022);
  assert.equal(rbr2022.status, 'FOUND');
  assert.equal(rbr2022.assetPath, '/teams/oracle_red_bull_racing.svg');
  assert.equal(rbr2022.selectedEntry?.logo_id, 'RBR-2022');

  const rbr2024 = resolveTeamLogo('RED_BULL_RACING', 2024);
  assert.equal(rbr2024.status, 'FOUND');
  assert.equal(rbr2024.assetPath, '/teams/oracle_red_bull_racing.svg');

  const rbr2026 = resolveTeamLogo('RED_BULL_RACING', 2026);
  assert.equal(rbr2026.status, 'FOUND');
  assert.equal(rbr2026.assetPath, '/teams/oracle_red_bull_racing.svg');
});

test('15. Lotus: Team Lotus Chapman (1958-1994) vs Lotus Enstone (2012-2015)', (t) => {
  // Colin Chapman
  const cl1958 = resolveTeamLogo('LOTUS_CLASSIC', 1958);
  assert.equal(cl1958.status, 'FOUND');
  assert.equal(cl1958.assetPath, '/teams/teamlotus.svg');
  assert.equal(cl1958.selectedEntry?.logo_id, 'LOT-1958');

  const cl1972 = resolveTeamLogo('LOTUS_CLASSIC', 1972);
  assert.equal(cl1972.status, 'FOUND');
  assert.equal(cl1972.assetPath, '/teams/teamlotus.svg');

  const cl1994 = resolveTeamLogo('LOTUS_CLASSIC', 1994);
  assert.equal(cl1994.status, 'FOUND');
  assert.equal(cl1994.assetPath, '/teams/teamlotus.svg');

  // Enstone
  const en2012 = resolveTeamLogo('LOTUS_ENSTONE', 2012);
  assert.equal(en2012.status, 'FOUND');
  assert.equal(en2012.assetPath, '/teams/lotusf1.svg');
  assert.equal(en2012.selectedEntry?.logo_id, 'LOT-2012');

  const en2015 = resolveTeamLogo('LOTUS_ENSTONE', 2015);
  assert.equal(en2015.status, 'FOUND');
  assert.equal(en2015.assetPath, '/teams/lotusf1.svg');

  assert.notEqual(cl1972.assetPath, en2012.assetPath);
});

test('16. Midland 2006 e Spyker 2007: Isolamento rigoroso de identidades', (t) => {
  const mid2006 = resolveTeamLogo('MIDLAND', 2006);
  assert.equal(mid2006.status, 'FOUND');
  assert.equal(mid2006.assetPath, '/teams/mf1_racing.svg');
  assert.equal(mid2006.selectedEntry?.logo_id, 'MID-2006');

  const spy2007 = resolveTeamLogo('SPYKER', 2007);
  assert.equal(spy2007.status, 'FOUND');
  assert.equal(spy2007.assetPath, '/teams/spyker_f1.svg');
  assert.equal(spy2007.selectedEntry?.logo_id, 'SPY-2007');

  assert.notEqual(mid2006.assetPath, spy2007.assetPath);

  // Não ocorre substituição entre anos
  assert.equal(resolveTeamLogo('MIDLAND', 2007).status, 'AFTER_DECEASE');
  assert.equal(resolveTeamLogo('SPYKER', 2006).status, 'BEFORE_ORIGIN');
});

test('17. Stewart Grand Prix: Segmentação 1997 vs 1998-1999', (t) => {
  const stw1997 = resolveTeamLogo('STEWART', 1997);
  assert.equal(stw1997.status, 'FOUND');
  assert.equal(stw1997.assetPath, '/teams/stewart_1997.svg');
  assert.equal(stw1997.selectedEntry?.logo_id, 'STW-1997');

  const stw1998 = resolveTeamLogo('STEWART', 1998);
  assert.equal(stw1998.status, 'FOUND');
  assert.equal(stw1998.assetPath, '/teams/stewart_1998.svg');
  assert.equal(stw1998.selectedEntry?.logo_id, 'STW-1998');

  const stw1999 = resolveTeamLogo('STEWART', 1999);
  assert.equal(stw1999.status, 'FOUND');
  assert.equal(stw1999.assetPath, '/teams/stewart_1998.svg');

  assert.notEqual(stw1997.assetPath, stw1998.assetPath);
});

test('18. Arrows / Footwork: 1978-1990 e 1997-2002 válidos; Lacuna Footwork 1991-1996 protegida', (t) => {
  // Fase Arrows 1
  const arr1978 = resolveTeamLogo('ARROWS_FOOTWORK', 1978);
  assert.equal(arr1978.status, 'FOUND');
  assert.equal(arr1978.assetPath, '/teams/arrows_classic.svg');

  const arr1990 = resolveTeamLogo('ARROWS_FOOTWORK', 1990);
  assert.equal(arr1990.status, 'FOUND');
  assert.equal(arr1990.assetPath, '/teams/arrows_classic.svg');

  // Fase Footwork (1991-1996) -> HISTORICAL_GAP sem fallback anacrônico
  const arr1991 = resolveTeamLogo('ARROWS_FOOTWORK', 1991);
  assert.equal(arr1991.status, 'HISTORICAL_GAP');
  assert.equal(arr1991.matched, false);
  assert.equal(arr1991.assetPath, null);

  const arr1994 = resolveTeamLogo('ARROWS_FOOTWORK', 1994);
  assert.equal(arr1994.status, 'HISTORICAL_GAP');
  assert.equal(arr1994.matched, false);
  assert.equal(arr1994.assetPath, null);

  const arr1996 = resolveTeamLogo('ARROWS_FOOTWORK', 1996);
  assert.equal(arr1996.status, 'HISTORICAL_GAP');
  assert.equal(arr1996.matched, false);
  assert.equal(arr1996.assetPath, null);

  // Fase Arrows 2
  const arr1997 = resolveTeamLogo('ARROWS_FOOTWORK', 1997);
  assert.equal(arr1997.status, 'FOUND');
  assert.equal(arr1997.assetPath, '/teams/arrows_classic.svg');

  const arr2002 = resolveTeamLogo('ARROWS_FOOTWORK', 2002);
  assert.equal(arr2002.status, 'FOUND');
  assert.equal(arr2002.assetPath, '/teams/arrows_classic.svg');
});

test('19. OP-08.06D2: Homologação dos Dez Ativos Históricos Promovidos (T2, T3 e T4)', (t) => {
  // Ferrari: 1950 (novo), 2004 (preservado clássico), 2024 (novo moderno)
  const f1950 = resolveTeamLogo('FERRARI', 1950);
  assert.equal(f1950.status, 'FOUND');
  assert.equal(f1950.assetPath, '/teams/ferrari_1950.svg');
  assert.equal(f1950.selectedEntry?.logo_id, 'FER-1950');

  const f2004 = resolveTeamLogo('FERRARI', 2004);
  assert.equal(f2004.status, 'FOUND');
  assert.equal(f2004.assetPath, '/teams/ferrari_classic.svg');
  assert.equal(f2004.selectedEntry?.logo_id, 'FER-1997');

  const f2024 = resolveTeamLogo('FERRARI', 2024);
  assert.equal(f2024.status, 'FOUND');
  assert.equal(f2024.assetPath, '/teams/ferrari_modern.svg');
  assert.equal(f2024.selectedEntry?.logo_id, 'FER-2020');

  // McLaren: 1974 (Kiwi), 1988 (Marlboro preservado), 2008 (Speedmark), 2024 (Papaya)
  const m1974 = resolveTeamLogo('MCLAREN', 1974);
  assert.equal(m1974.status, 'FOUND');
  assert.equal(m1974.assetPath, '/teams/mclaren_kiwi.svg');
  assert.equal(m1974.selectedEntry?.logo_id, 'MCL-1967');

  const m1988 = resolveTeamLogo('MCLAREN', 1988);
  assert.equal(m1988.status, 'FOUND');
  assert.equal(m1988.assetPath, '/teams/mclaren_classic.svg');
  assert.equal(m1988.selectedEntry?.logo_id, 'MCL-1981');

  const m2008 = resolveTeamLogo('MCLAREN', 2008);
  assert.equal(m2008.status, 'FOUND');
  assert.equal(m2008.assetPath, '/teams/mclaren_speedmark.svg');
  assert.equal(m2008.selectedEntry?.logo_id, 'MCL-1997');

  const m2024 = resolveTeamLogo('MCLAREN', 2024);
  assert.equal(m2024.status, 'FOUND');
  assert.equal(m2024.assetPath, '/teams/mclaren_papaya.svg');
  assert.equal(m2024.selectedEntry?.logo_id, 'MCL-2017');

  // Mercedes: 1954 (W196 clássico) vs 2014 (AMG moderna)
  const merc1954 = resolveTeamLogo('MERCEDES_CLASSIC', 1954);
  assert.equal(merc1954.status, 'FOUND');
  assert.equal(merc1954.assetPath, '/teams/mercedes_1954.svg');
  assert.equal(merc1954.selectedEntry?.logo_id, 'MER-1954');

  const merc2014 = resolveTeamLogo('MERCEDES_MODERN', 2014);
  assert.equal(merc2014.status, 'FOUND');
  assert.equal(merc2014.assetPath, '/teams/mercedes_amg_petronas.svg');
  assert.notEqual(merc1954.assetPath, merc2014.assetPath);

  // Alfa Romeo: 1950 como símbolo secundário esportivo
  const alfa1950 = resolveTeamLogo('ALFA_ROMEO_WORKS1', 1950);
  assert.equal(alfa1950.status, 'FOUND');
  assert.equal(alfa1950.assetPath, '/teams/alfa_romeo_1950.svg');
  assert.equal(alfa1950.selectedVariant, 'secondary_sports');
  assert.equal(alfa1950.selectedEntry?.logo_id, 'ALF-1950');

  // Alpine: 2021 a 2026 unificado
  const alp2021 = resolveTeamLogo('ALPINE', 2021);
  assert.equal(alp2021.status, 'FOUND');
  assert.equal(alp2021.assetPath, '/teams/alpine_2021.svg');
  assert.equal(alp2021.selectedEntry?.logo_id, 'ALP-2021');

  // Audi: 2026 em diante
  const audi2026 = resolveTeamLogo('AUDI_WORKS', 2026);
  assert.equal(audi2026.status, 'FOUND');
  assert.equal(audi2026.assetPath, '/teams/audi_2026.svg');
  assert.equal(audi2026.selectedEntry?.logo_id, 'AUDI-2026');

  // Gordini: preserva quarentena e aponta para o arquivo corrigido
  const gor = resolveTeamLogo('GORDINI', 1952);
  assert.equal(gor.status, 'QUARANTINED_OR_INVALID');
  const gorAllowed = resolveTeamLogo('GORDINI', 1952, { allowQuarantined: true });
  assert.equal(gorAllowed.status, 'FOUND');
  assert.equal(gorAllowed.assetPath, '/teams/gordini.svg');
  assert.equal(gorAllowed.selectedEntry?.logo_id, 'GOR-1950');
});
