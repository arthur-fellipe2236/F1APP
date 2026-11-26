import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { teamLogo, HISTORICAL_HOMOLOGATED_LOGOS } from '../src/lib/assets';
import { resolveTeamLogo, mapNameToTeamId } from '../src/lib/team-resolver';

const PUBLIC_DIR = path.resolve(__dirname, '../public');

test('Validação Completa dos 14 Emblemas Históricos Homologados da Temporada 1950', async (t) => {
  // 1. Integridade Física dos 14 Arquivos de 1950
  await t.test('1. Todos os 14 arquivos PNG de 1950 existem fisicamente e possuem tamanho > 0', () => {
    const teams1950 = HISTORICAL_HOMOLOGATED_LOGOS[1950];
    assert.ok(teams1950, 'Mapeamento de 1950 deve existir');
    
    for (const [teamKey, asset] of Object.entries(teams1950)) {
      const filePath = path.join(PUBLIC_DIR, asset.url.replace(/^\//, ''));
      assert.ok(fs.existsSync(filePath), `Arquivo ausente: ${asset.url} (${teamKey} - 1950)`);
      const stats = fs.statSync(filePath);
      assert.ok(stats.size > 1000, `Arquivo corrompido ou vazio: ${asset.url} (tamanho: ${stats.size} bytes)`);
    }
  });

  // 2. Mapeamento Individual dos 14 Construtores Oficiais de 1950
  await t.test('2. Temporada 1950: Todas as 14 equipes homologadas resolvem com precisão', () => {
    const expected1950 = [
      ['Alfa Romeo', '/teams/historical/1950_alfa_romeo.png'],
      ['Ferrari', '/teams/historical/1950_ferrari.png'],
      ['Maserati', '/teams/historical/1950_maserati.png'],
      ['Talbot-Lago', '/teams/historical/1950_talbot_lago.png'],
      ['Cooper', '/teams/historical/1950_cooper.png'],
      ['Simca-Gordini', '/teams/historical/1950_simca_gordini.png'],
      ['ERA', '/teams/historical/1950_era.png'],
      ['Alta', '/teams/historical/1950_alta.png'],
      ['Milano', '/teams/historical/1950_milano.png'],
      ['Scuderia Ambrosiana', '/teams/historical/1950_scuderia_ambrosiana.png'],
      ['Écurie Belge', '/teams/historical/1950_ecurie_belge.png'],
      ['Écurie Rosier', '/teams/historical/1950_ecurie_rosier.png'],
      ['Écurie Lutetia', '/teams/historical/1950_ecurie_lutetia.png'],
      ['Scuderia Achille Varzi', '/teams/historical/1950_scuderia_achille_varzi.png'],
    ];

    for (const [name, expectedUrl] of expected1950) {
      const logo = teamLogo(name, 1950);
      assert.ok(logo, `Logo deve ser resolvida para ${name} em 1950`);
      assert.equal(logo?.url, expectedUrl, `URL incorreta para ${name} em 1950`);
    }
  });

  // 3. Preservação Estrita das Temporadas Posteriores (1951 a 2026 estritamente intocadas)
  await t.test('3. Temporadas posteriores (1951 a 2026) preservam estritamente seus comportamentos originais', () => {
    // 1951: Não deve carregar /teams/historical/1951_...
    const f1951 = teamLogo('Ferrari', 1951);
    assert.equal(f1951?.url, '/teams/ferrari_1950.svg');

    // 1952: Gordini permanece em quarentena
    const g1952 = teamLogo('Gordini', 1952);
    assert.equal(g1952, null);

    // 1953
    const f1953 = teamLogo('Ferrari', 1953);
    assert.equal(f1953?.url, '/teams/ferrari_1950.svg');

    // 2004
    const f2004 = teamLogo('Ferrari', 2004);
    assert.equal(f2004?.url, '/teams/ferrari_classic.svg');

    // 2024
    const f2024 = teamLogo('Ferrari', 2024);
    assert.equal(f2024?.url, '/teams/ferrari_modern.svg');

    const m2024 = teamLogo('McLaren', 2024);
    assert.equal(m2024?.url, '/teams/mclaren_papaya.svg');
  });

  // 4. Preservação dos Construtores de Indianápolis 500 (1950)
  await t.test('4. Construtores Indy 500 em 1950 continuam sem interferência', () => {
    const kk = teamLogo('Kurtis Kraft', 1950);
    // Kurtis Kraft mantém seu comportamento padrão de resolver via registry ou fallback limpo
    assert.ok(kk === null || kk?.url.includes('kurtis_kraft'));
  });
});
