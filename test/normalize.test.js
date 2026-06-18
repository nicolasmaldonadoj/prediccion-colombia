import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  pickColombiaWinnerEvent,
  buildBoard,
  normalizeColombiaMarket,
} from '../src/normalize.js';

const fixture = JSON.parse(
  readFileSync(new URL('./fixtures/colombia.json', import.meta.url))
);

test('pickColombiaWinnerEvent picks the highest-volume Colombia winner event', () => {
  const ev = pickColombiaWinnerEvent(fixture.events);
  assert.equal(ev.id, '100');
});

test('pickColombiaWinnerEvent excludes non-Colombia events even if higher volume', () => {
  const ev = pickColombiaWinnerEvent(fixture.events);
  assert.notEqual(ev.id, '102');
});

test('pickColombiaWinnerEvent returns null when no Colombia event present', () => {
  const ev = pickColombiaWinnerEvent([
    { id: '999', title: 'France Election 2027', active: true, closed: false, volume: 1 },
  ]);
  assert.equal(ev, null);
});

test('buildBoard returns candidates sorted by probability, leader first', () => {
  const board = buildBoard(fixture.events[0]);
  assert.equal(board.candidatos[0].nombre, 'Gustavo Bolívar');
  assert.equal(board.candidatos[0].probabilidad, 0.62);
  assert.equal(board.candidatos[1].nombre, 'Vicky Dávila');
  assert.ok(board.candidatos[0].probabilidad >= board.candidatos[1].probabilidad);
});

test('buildBoard drops near-zero candidates (<0.005)', () => {
  const board = buildBoard(fixture.events[0]);
  assert.ok(!board.candidatos.some((c) => c.nombre === 'Otro'));
});

test('buildBoard exposes volume, liquidity, timestamp, url', () => {
  const board = buildBoard(fixture.events[0]);
  assert.equal(board.totalInvertido, 4200000);
  assert.equal(board.liquidez, 1100000);
  assert.equal(board.actualizado, '2026-06-18T17:30:00Z');
  assert.equal(board.urlEvento, 'https://polymarket.com/event/colombia-presidential-election-2026');
});

test('buildBoard carries weekly change for sparkline/trend', () => {
  const board = buildBoard(fixture.events[0]);
  assert.equal(board.candidatos[0].cambioSemana, 0.05);
});

test('normalizeColombiaMarket integrates pick + build', () => {
  const board = normalizeColombiaMarket(fixture.events);
  assert.equal(board.titulo, 'Colombia Presidential Election Winner 2026');
  assert.equal(board.candidatos[0].nombre, 'Gustavo Bolívar');
});

test('normalizeColombiaMarket returns null when nothing matches', () => {
  assert.equal(normalizeColombiaMarket([]), null);
});
