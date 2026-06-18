import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getMarketData } from '../src/worker.js';

const fixture = JSON.parse(
  readFileSync(new URL('./fixtures/colombia.json', import.meta.url))
);

function fakeFetchOk() {
  return async () => ({ ok: true, json: async () => fixture });
}
function fakeFetchFail() {
  return async () => ({ ok: false, status: 500, json: async () => ({}) });
}

test('getMarketData returns a normalized board from the search response', async () => {
  const board = await getMarketData(fakeFetchOk());
  assert.equal(board.candidatos[0].nombre, 'Gustavo Bolívar');
  assert.equal(board.totalInvertido, 4200000);
});

test('getMarketData dedupes events that appear across multiple queries', async () => {
  // Same fixture returned for every query → must not duplicate candidates.
  const board = await getMarketData(fakeFetchOk());
  const names = board.candidatos.map((c) => c.nombre);
  assert.equal(new Set(names).size, names.length);
});

test('getMarketData throws when every upstream request fails', async () => {
  await assert.rejects(() => getMarketData(fakeFetchFail()));
});
