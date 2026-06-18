# Predicción Colombia — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A public, free, no-registration Cloudflare Worker that serves a Spanish landing page showing Polymarket's forecast for the winner of Colombia's presidential election, fetched server-side (edge) to bypass the in-country network block.

**Architecture:** A single Cloudflare Worker handles two routes. `GET /` serves a self-contained HTML page. `GET /api/market` runs on Cloudflare's edge (outside Colombia), queries Polymarket's public Gamma API (`gamma-api.polymarket.com/public-search`), picks the Colombia election-winner event with the highest `volume`, normalizes it into a candidate board, and returns clean JSON (edge-cached ~45s). The browser only ever talks to the Worker, so the block never applies.

**Tech Stack:** Cloudflare Workers (ES modules), Wrangler CLI, Node's built-in test runner (`node:test`) for the pure normalization logic, Cloudflare Web Analytics for traffic metrics.

---

## File Structure

- `package.json` — project metadata, scripts, single dev dep (`wrangler`). `"type":"module"`.
- `wrangler.toml` — Worker config (name, entry, compatibility date).
- `src/normalize.js` — **pure** logic: pick the right event, build the candidate board. No network, no Workers APIs. Fully unit-testable.
- `src/page.js` — exports `PAGE_HTML` (the full landing page as a template string).
- `src/worker.js` — Worker entrypoint: routing, the `getMarketData()` fetch+merge flow, edge caching, error handling.
- `test/fixtures/colombia.json` — synthetic but realistic Gamma `public-search` response used by tests.
- `test/normalize.test.js` — unit tests for `src/normalize.js`.
- `test/worker.test.js` — tests `getMarketData()` with a stubbed `fetch`.

Files that change together live together; `normalize.js` is isolated from Workers runtime so it runs under plain Node in tests.

---

## Task 1: Project scaffolding

**Files:**
- Create: `package.json`
- Create: `wrangler.toml`

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "prediccion-colombia",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test",
    "dev": "wrangler dev",
    "dev:remote": "wrangler dev --remote",
    "deploy": "wrangler deploy"
  },
  "devDependencies": {
    "wrangler": "^3.90.0"
  }
}
```

- [ ] **Step 2: Write `wrangler.toml`**

```toml
name = "prediccion-colombia"
main = "src/worker.js"
compatibility_date = "2026-06-01"

# workers.dev subdomain is enabled by default → prediccion-colombia.<account>.workers.dev
```

- [ ] **Step 3: Install wrangler**

Run: `cd /Users/nicolasmaldonadoj/Documents/Sombra/prediccion-colombia && npm install`
Expected: `node_modules/` created, `wrangler` installed, no errors.

- [ ] **Step 4: Verify wrangler works**

Run: `npx wrangler --version`
Expected: prints a version like `3.x.x`.

- [ ] **Step 5: Commit**

```bash
git add package.json wrangler.toml package-lock.json
git commit -m "chore: scaffold Cloudflare Worker project"
```

---

## Task 2: Pure normalization logic (TDD)

This is the core. It turns a raw Gamma `public-search` response into a sorted candidate board, picking the highest-volume Colombia election event. Built test-first against a realistic fixture.

**Files:**
- Create: `test/fixtures/colombia.json`
- Create: `test/normalize.test.js`
- Create: `src/normalize.js`

- [ ] **Step 1: Create the test fixture**

Create `test/fixtures/colombia.json`. It models a neg-risk event (each candidate is a Yes/No sub-market, the real Polymarket shape), plus decoys to prove the picker filters and ranks correctly. Note `outcomes`/`outcomePrices` are JSON **strings** — exactly as Gamma returns them.

```json
{
  "events": [
    {
      "id": "100",
      "title": "Colombia Presidential Election Winner 2026",
      "slug": "colombia-presidential-election-2026",
      "active": true,
      "closed": false,
      "updatedAt": "2026-06-18T17:30:00Z",
      "volume": 4200000,
      "liquidity": 1100000,
      "markets": [
        {
          "id": "m1", "question": "Will candidate Petro's bloc win?",
          "groupItemTitle": "Gustavo Bolívar", "active": true, "closed": false,
          "outcomes": "[\"Yes\", \"No\"]", "outcomePrices": "[\"0.62\", \"0.38\"]",
          "oneWeekPriceChange": 0.05
        },
        {
          "id": "m2", "question": "Will the opposition win?",
          "groupItemTitle": "Vicky Dávila", "active": true, "closed": false,
          "outcomes": "[\"Yes\", \"No\"]", "outcomePrices": "[\"0.28\", \"0.72\"]",
          "oneWeekPriceChange": -0.03
        },
        {
          "id": "m3", "question": "Will the centrist win?",
          "groupItemTitle": "Sergio Fajardo", "active": true, "closed": false,
          "outcomes": "[\"Yes\", \"No\"]", "outcomePrices": "[\"0.10\", \"0.90\"]",
          "oneWeekPriceChange": 0.00
        },
        {
          "id": "m4", "question": "Will a long-shot win?",
          "groupItemTitle": "Otro", "active": true, "closed": false,
          "outcomes": "[\"Yes\", \"No\"]", "outcomePrices": "[\"0.002\", \"0.998\"]",
          "oneWeekPriceChange": 0.00
        }
      ]
    },
    {
      "id": "101",
      "title": "Colombia presidential election: turnout above 60%?",
      "slug": "colombia-turnout-2026",
      "active": true, "closed": false,
      "updatedAt": "2026-06-18T17:00:00Z",
      "volume": 90000, "liquidity": 5000,
      "markets": [
        {
          "id": "m5", "question": "Will turnout exceed 60%?", "active": true, "closed": false,
          "outcomes": "[\"Yes\", \"No\"]", "outcomePrices": "[\"0.45\", \"0.55\"]",
          "oneWeekPriceChange": 0.01
        }
      ]
    },
    {
      "id": "102",
      "title": "US Presidential Election 2028",
      "slug": "us-2028",
      "active": true, "closed": false,
      "updatedAt": "2026-06-18T17:00:00Z",
      "volume": 99000000, "liquidity": 20000000,
      "markets": [
        {
          "id": "m6", "question": "Will the incumbent party win?", "active": true, "closed": false,
          "outcomes": "[\"Yes\", \"No\"]", "outcomePrices": "[\"0.50\", \"0.50\"]",
          "oneWeekPriceChange": 0.00
        }
      ]
    }
  ]
}
```

Note: event `101` is a Colombia election event too, but it is a *turnout* market, not a *winner* market, and has far lower volume — the picker must still choose `100` (highest-volume winner event). Event `102` is higher volume but not Colombia — must be excluded.

- [ ] **Step 2: Write the failing tests**

Create `test/normalize.test.js`:

```js
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
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Cannot find module '../src/normalize.js'` (or export not found).

- [ ] **Step 4: Implement `src/normalize.js`**

```js
// Pure normalization of Polymarket Gamma `public-search` responses into a
// Colombia election candidate board. No network, no Workers APIs.

const COLOMBIA_RE = /colombia/i;
// Winner-style markets: the event title mentions the contest itself.
const WINNER_RE = /(presiden|elecc|election|elige|ganador|winner)/i;
// Disqualify obvious non-winner sub-questions on the event title.
const NON_WINNER_RE = /(turnout|abstenci|particip|gdp|pib|inflaci|first round|primera vuelta margin)/i;
const MIN_PROB = 0.005;

/** Gamma encodes `outcomes` / `outcomePrices` as JSON strings; tolerate arrays too. */
function parseMaybeJson(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Fallback candidate name from a "Will X win?" question when groupItemTitle is absent. */
export function shortenQuestion(question) {
  const q = String(question || '').trim().replace(/\?+$/, '');
  let m = q.match(
    /^Will\s+(.+?)\s+(?:win|be|become|make|reach|qualify|advance|lead)\b/i
  );
  if (m) return m[1].trim();
  m = q.match(/^Will\s+(.+?)\s+/i);
  if (m && m[1].split(/\s+/).length <= 4) return m[1].trim();
  return q.length > 40 ? q.slice(0, 40) : q;
}

/** Pick the active, highest-`volume` Colombia election-WINNER event, or null. */
export function pickColombiaWinnerEvent(events) {
  const candidates = (events || []).filter((e) => {
    if (!e || e.closed || e.active === false) return false;
    const title = String(e.title || '');
    if (!COLOMBIA_RE.test(title)) return false;
    if (!WINNER_RE.test(title)) return false;
    if (NON_WINNER_RE.test(title)) return false;
    return true;
  });
  candidates.sort(
    (a, b) => (Number(b.volume) || 0) - (Number(a.volume) || 0)
  );
  return candidates[0] || null;
}

/** Build the candidate board from a single event. */
export function buildBoard(event) {
  const markets = (event.markets || []).filter(
    (m) => m && !m.closed && m.active !== false
  );

  const candidatos = [];
  for (const m of markets) {
    const outcomes = parseMaybeJson(m.outcomes);
    const prices = parseMaybeJson(m.outcomePrices).map(Number);
    const lower = outcomes.map((o) => String(o).toLowerCase());
    const isBinary =
      lower.length === 2 && lower.includes('yes') && lower.includes('no');

    if (isBinary) {
      const yesIdx = lower.indexOf('yes');
      const prob = prices[yesIdx];
      if (!(prob > MIN_PROB)) continue;
      candidatos.push({
        nombre: m.groupItemTitle || shortenQuestion(m.question),
        probabilidad: prob,
        cambioSemana: m.oneWeekPriceChange ?? null,
      });
    } else {
      for (let i = 0; i < outcomes.length; i++) {
        const prob = prices[i];
        if (!(prob > MIN_PROB)) continue;
        candidatos.push({
          nombre: String(outcomes[i]),
          probabilidad: prob,
          cambioSemana: null,
        });
      }
    }
  }

  candidatos.sort((a, b) => b.probabilidad - a.probabilidad);

  return {
    titulo: event.title || 'Elecciones Colombia',
    candidatos,
    totalInvertido: Number(event.volume) || 0,
    liquidez: Number(event.liquidity) || 0,
    actualizado: event.updatedAt || null,
    urlEvento: event.slug
      ? `https://polymarket.com/event/${event.slug}`
      : null,
  };
}

/** End-to-end: pick the right event and build its board, or null. */
export function normalizeColombiaMarket(events) {
  const event = pickColombiaWinnerEvent(events);
  if (!event) return null;
  return buildBoard(event);
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test`
Expected: all `normalize.test.js` tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/normalize.js test/normalize.test.js test/fixtures/colombia.json
git commit -m "feat: pure Colombia market normalization with tests"
```

---

## Task 3: Worker fetch flow + routing (TDD where possible)

Adds `getMarketData()` (search → merge → normalize) and the Worker entrypoint with routing, edge caching, CORS, and error handling. `getMarketData()` takes an injectable `fetchImpl` so it is testable without network.

**Files:**
- Create: `test/worker.test.js`
- Create: `src/worker.js`

- [ ] **Step 1: Write the failing tests**

Create `test/worker.test.js`:

```js
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `getMarketData` is not exported from `../src/worker.js`.

- [ ] **Step 3: Implement `src/worker.js`**

```js
import { normalizeColombiaMarket } from './normalize.js';
import { PAGE_HTML } from './page.js';

const SEARCH_BASE = 'https://gamma-api.polymarket.com/public-search';
const SEARCH_QUERIES = [
  'Colombia presidential election',
  'Colombia president',
  'Colombia election',
];
const EDGE_CACHE_SECONDS = 45;

function buildSearchUrl(query) {
  const params = new URLSearchParams({
    q: query,
    events_status: 'active',
    keep_closed_markets: '0',
  });
  return `${SEARCH_BASE}?${params}`;
}

/**
 * Run the Colombia search queries, merge+dedupe events by id, normalize.
 * @param {typeof fetch} fetchImpl injectable for testing.
 * @returns board object, or null if no matching market.
 * @throws if every upstream request fails.
 */
export async function getMarketData(fetchImpl = fetch) {
  const results = await Promise.allSettled(
    SEARCH_QUERIES.map(async (q) => {
      const res = await fetchImpl(buildSearchUrl(q));
      if (!res.ok) throw new Error(`upstream ${res.status}`);
      return res.json();
    })
  );

  const ok = results.filter((r) => r.status === 'fulfilled');
  if (ok.length === 0) {
    throw new Error('all upstream requests failed');
  }

  const byId = new Map();
  for (const r of ok) {
    for (const ev of r.value?.events || []) {
      if (ev?.id && !byId.has(ev.id)) byId.set(ev.id, ev);
    }
  }

  return normalizeColombiaMarket([...byId.values()]);
}

function jsonResponse(body, status, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      ...extraHeaders,
    },
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/api/market') {
      const cache = caches.default;
      const cached = await cache.match(request);
      if (cached) return cached;

      try {
        const board = await getMarketData();
        if (!board) {
          return jsonResponse({ error: 'no-market' }, 404);
        }
        const response = jsonResponse(board, 200, {
          'cache-control': `public, max-age=${EDGE_CACHE_SECONDS}`,
        });
        ctx.waitUntil(cache.put(request, response.clone()));
        return response;
      } catch (e) {
        return jsonResponse({ error: 'upstream' }, 503);
      }
    }

    if (url.pathname === '/' || url.pathname === '') {
      return new Response(PAGE_HTML, {
        headers: { 'content-type': 'text/html; charset=utf-8' },
      });
    }

    return new Response('Not found', { status: 404 });
  },
};
```

Note: `src/worker.js` imports `./page.js`, created in Task 4. Until then `npm test` will fail to import. To unblock TDD now, create a temporary stub.

- [ ] **Step 4: Create a temporary `src/page.js` stub so the import resolves**

```js
// Temporary stub — replaced with the real page in Task 4.
export const PAGE_HTML = '<!doctype html><title>stub</title>';
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test`
Expected: all `normalize.test.js` and `worker.test.js` tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/worker.js src/page.js test/worker.test.js
git commit -m "feat: worker routing + Polymarket proxy fetch with edge cache"
```

---

## Task 4: Landing page (baseline), then polish with impeccable

Replace the stub with a complete, working, mobile-first Spanish page. After it works, run the **impeccable** skill to elevate the visual design — but the baseline below must be fully functional on its own (no placeholders in logic).

**Files:**
- Modify: `src/page.js` (replace stub with full page)

- [ ] **Step 1: Replace `src/page.js` with the full page**

```js
export const PAGE_HTML = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Predicción Elecciones Colombia · Polymarket en vivo</title>
<meta name="description" content="Pronóstico en tiempo real del ganador de las elecciones presidenciales de Colombia según el mercado de predicción Polymarket. Acceso libre, sin registro." />
<style>
  :root {
    --bg: #0b0f1a; --panel: #131a2b; --line: #243049;
    --text: #eef2fb; --muted: #93a0bd; --accent: #ffd23f; --bar: #2a3550;
    --bar-track: #1c2640; --up: #34d399; --down: #f87171;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, system-ui, sans-serif;
    background: radial-gradient(1200px 600px at 50% -10%, #16203a 0%, var(--bg) 55%);
    color: var(--text); min-height: 100vh; line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }
  .wrap { max-width: 640px; margin: 0 auto; padding: 28px 20px 64px; }
  header { text-align: center; margin-bottom: 28px; }
  .kicker { font-size: 12px; letter-spacing: .18em; text-transform: uppercase; color: var(--muted); }
  h1 { font-size: clamp(24px, 6vw, 34px); font-weight: 800; line-height: 1.15; margin: 8px 0 6px; }
  .src { font-size: 13px; color: var(--muted); }
  .src b { color: var(--text); }
  .card { background: var(--panel); border: 1px solid var(--line); border-radius: 18px; padding: 18px; }
  .cand { display: grid; grid-template-columns: 1fr auto; gap: 6px 12px; align-items: center; padding: 14px 0; border-bottom: 1px solid var(--line); }
  .cand:last-child { border-bottom: 0; }
  .name { font-weight: 700; font-size: 16px; }
  .pct { font-variant-numeric: tabular-nums; font-weight: 800; font-size: 20px; }
  .leader .name::after { content: " ★"; color: var(--accent); }
  .leader .pct { color: var(--accent); }
  .track { grid-column: 1 / -1; height: 10px; background: var(--bar-track); border-radius: 999px; overflow: hidden; }
  .fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #5b8cff, #8a6dff); transition: width .6s cubic-bezier(.2,.8,.2,1); }
  .leader .fill { background: linear-gradient(90deg, #ffd23f, #ff9e3f); }
  .trend { font-size: 12px; color: var(--muted); font-variant-numeric: tabular-nums; }
  .trend.up { color: var(--up); } .trend.down { color: var(--down); }
  .meta { display: flex; flex-wrap: wrap; gap: 10px 18px; justify-content: center; margin-top: 18px; font-size: 13px; color: var(--muted); }
  .meta b { color: var(--text); font-variant-numeric: tabular-nums; }
  .bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 20px; }
  button { font: inherit; font-weight: 600; color: var(--text); background: var(--panel); border: 1px solid var(--line); border-radius: 10px; padding: 9px 14px; cursor: pointer; }
  button:hover { border-color: #3a4a6b; }
  button:disabled { opacity: .5; cursor: default; }
  .disclaimer { margin-top: 26px; font-size: 12px; color: var(--muted); text-align: center; line-height: 1.6; }
  .state { text-align: center; padding: 36px 10px; color: var(--muted); }
  .skeleton { height: 56px; border-radius: 12px; background: linear-gradient(90deg, #131a2b, #1b2236, #131a2b); background-size: 200% 100%; animation: sh 1.2s infinite; margin: 10px 0; }
  @keyframes sh { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  @media (prefers-reduced-motion: reduce) { .fill, .skeleton { transition: none; animation: none; } }
</style>
</head>
<body>
  <div class="wrap">
    <header>
      <div class="kicker">Mercado de predicción en vivo</div>
      <h1 id="title">Elecciones Colombia</h1>
      <div class="src">Datos de <b>Polymarket</b> · acceso libre, sin registro</div>
    </header>

    <div class="card">
      <div id="board">
        <div class="skeleton"></div>
        <div class="skeleton"></div>
        <div class="skeleton"></div>
      </div>
    </div>

    <div class="meta" id="meta"></div>

    <div class="bar">
      <span class="src" id="updated">Cargando…</span>
      <button id="refresh">Actualizar</button>
    </div>

    <p class="disclaimer">
      Esto es un <b>mercado de predicción</b> (apuestas), no un resultado oficial ni una encuesta.
      Refleja cuánto dinero apuesta la gente a cada resultado. Las probabilidades cambian
      constantemente. Fuente: Polymarket.
    </p>
  </div>

<script>
  const pctFmt = (p) => Math.round(p * 100) + "%";
  const moneyFmt = (n) =>
    "$" + (n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : Math.round(n / 1e3) + "K");

  function renderBoard(data) {
    document.getElementById("title").textContent = data.titulo || "Elecciones Colombia";
    const board = document.getElementById("board");
    if (!data.candidatos || data.candidatos.length === 0) {
      board.innerHTML = '<div class="state">Aún no hay un mercado activo con candidatos.</div>';
      document.getElementById("meta").innerHTML = "";
      return;
    }
    const max = data.candidatos[0].probabilidad || 1;
    board.innerHTML = data.candidatos
      .map((c, i) => {
        const w = Math.max(2, (c.probabilidad / max) * 100);
        const ch = c.cambioSemana;
        let trend = "";
        if (typeof ch === "number" && Math.abs(ch) >= 0.01) {
          const cls = ch > 0 ? "up" : "down";
          const arrow = ch > 0 ? "▲" : "▼";
          trend = '<span class="trend ' + cls + '">' + arrow + " " + Math.abs(Math.round(ch * 100)) + "% sem</span>";
        }
        return (
          '<div class="cand ' + (i === 0 ? "leader" : "") + '">' +
            '<span class="name">' + escapeHtml(c.nombre) + "</span>" +
            '<span class="pct">' + pctFmt(c.probabilidad) + "</span>" +
            (trend || '<span class="trend"></span>') +
            '<div class="track"><div class="fill" style="width:' + w + '%"></div></div>' +
          "</div>"
        );
      })
      .join("");

    const meta = document.getElementById("meta");
    meta.innerHTML =
      "<span>Total invertido: <b>" + moneyFmt(data.totalInvertido || 0) + "</b></span>" +
      "<span>Liquidez: <b>" + moneyFmt(data.liquidez || 0) + "</b></span>";
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );
  }

  function setUpdated(date) {
    const el = document.getElementById("updated");
    if (!date) { el.textContent = "Actualizado ahora"; return; }
    const diff = Math.max(0, Math.round((Date.now() - new Date(date).getTime()) / 1000));
    const txt = diff < 60 ? "hace " + diff + "s" :
      diff < 3600 ? "hace " + Math.round(diff / 60) + " min" :
      "hace " + Math.round(diff / 3600) + " h";
    el.textContent = "Datos actualizados " + txt;
  }

  async function load() {
    const btn = document.getElementById("refresh");
    btn.disabled = true;
    try {
      const res = await fetch("/api/market", { cache: "no-store" });
      if (res.status === 404) {
        document.getElementById("board").innerHTML =
          '<div class="state">Aún no hay un mercado activo de elecciones de Colombia en Polymarket.</div>';
        document.getElementById("updated").textContent = "";
        return;
      }
      if (!res.ok) throw new Error("status " + res.status);
      const data = await res.json();
      renderBoard(data);
      setUpdated(data.actualizado);
    } catch (e) {
      document.getElementById("board").innerHTML =
        '<div class="state">No pudimos cargar el pronóstico en este momento.<br/>Intenta de nuevo en un momento.</div>';
      document.getElementById("updated").textContent = "";
    } finally {
      btn.disabled = false;
    }
  }

  document.getElementById("refresh").addEventListener("click", load);
  load();
  setInterval(load, 60000);
</script>
<!-- ANALYTICS_BEACON -->
</body>
</html>`;
```

- [ ] **Step 2: Verify the page serves and renders**

Run: `npx wrangler dev --remote --port 8787`
Then in a browser (or `curl`): open `http://localhost:8787/`.
Expected: page loads; `--remote` makes `/api/market` fetch from Cloudflare's edge (not the blocked local network), so the candidate board fills in with live Colombia data. If the local network blocks Polymarket, `--remote` is REQUIRED for the board to populate.

Run: `curl -s http://localhost:8787/api/market | head -c 400`
Expected: JSON with `titulo`, `candidatos`, `totalInvertido`.

- [ ] **Step 3: Polish the visual design with the impeccable skill**

Invoke the `impeccable` skill and apply it to `src/page.js`. Targets: typography scale, color/contrast, spacing rhythm, leader emphasis, loading/empty/error states, mobile layout, motion. Keep all IDs (`#title`, `#board`, `#meta`, `#updated`, `#refresh`) and the JS logic intact — only the markup/CSS evolve. Re-verify with Step 2 after changes.

- [ ] **Step 4: Run the full test suite (page change must not break logic)**

Run: `npm test`
Expected: all tests still PASS.

- [ ] **Step 5: Commit**

```bash
git add src/page.js
git commit -m "feat: Spanish mobile-first landing page (impeccable design)"
```

---

## Task 5: Cloudflare Web Analytics

Adds privacy-friendly traffic analytics (pageviews, unique visitors, country of origin) visible in the Cloudflare dashboard — no admin panel, no cookies.

**Files:**
- Modify: `src/page.js` (replace the `<!-- ANALYTICS_BEACON -->` marker)

- [ ] **Step 1: Create the Web Analytics site (user action, in dashboard)**

In the Cloudflare dashboard: **Analytics & Logs → Web Analytics → Add a site** → enter the eventual `*.workers.dev` hostname → copy the **beacon token** (a hex string). This is a config value the user provides; record it as `CF_ANALYTICS_TOKEN`.

- [ ] **Step 2: Replace the beacon marker in `src/page.js`**

Replace the line `<!-- ANALYTICS_BEACON -->` with (substituting the real token for `PEGAR_TOKEN`):

```html
<script defer src="https://static.cloudflareinsights.com/beacon.min.js"
  data-cf-beacon='{"token": "PEGAR_TOKEN"}'></script>
```

If the token is not yet available at deploy time, leave the marker as-is (an HTML comment — harmless) and add the beacon after the first deploy. Analytics simply won't record until the beacon is present.

- [ ] **Step 3: Verify the beacon is present**

Run: `grep -c "cloudflareinsights" src/page.js`
Expected: `1` (once the token is added).

- [ ] **Step 4: Commit**

```bash
git add src/page.js
git commit -m "feat: add Cloudflare Web Analytics beacon"
```

---

## Task 6: Deploy

**Files:** none (uses `.env` token, never committed).

- [ ] **Step 1: Confirm the token file is present and gitignored**

Run: `grep -q '^\\.env$' .gitignore && test -f .env && echo OK`
Expected: `OK`.

- [ ] **Step 2: Deploy with the scoped token**

Run:
```bash
cd /Users/nicolasmaldonadoj/Documents/Sombra/prediccion-colombia && \
CLOUDFLARE_API_TOKEN=$(grep -E '^CLOUDFLARE_API_TOKEN=' .env | cut -d= -f2-) npx wrangler deploy
```
Expected: wrangler prints the deployed URL, e.g. `https://prediccion-colombia.<account>.workers.dev`.

- [ ] **Step 3: Smoke-test the live deployment**

Run:
```bash
curl -s https://prediccion-colombia.<account>.workers.dev/api/market | head -c 400
```
Expected: live JSON board with current Colombia candidates and probabilities.

Then open the root URL in a browser and confirm the board renders. (This is the live test the user runs once deployed.)

- [ ] **Step 4: Post-launch security step (user action)**

Revoke/rotate the Cloudflare API token in the dashboard (it appeared in chat), and `rm .env`'s token line if desired. The deployed Worker keeps running; the token is only needed for future deploys.

- [ ] **Step 5: Commit any final config**

```bash
git add -A
git commit -m "chore: deployment-ready" || echo "nothing to commit"
```

---

## Self-Review Notes

- **Spec coverage:** proxy (Task 3), pick highest-volume Colombia winner (Task 2), candidate board UI (Task 4), 30–60s edge cache (Task 3, 45s), error/loading states (Tasks 3 & 4), Web Analytics (Task 5), deploy via wrangler+token (Task 6), Spanish/mobile-first (Task 4). All covered.
- **Type consistency:** board shape `{ titulo, candidatos:[{nombre, probabilidad, cambioSemana}], totalInvertido, liquidez, actualizado, urlEvento }` is identical across `normalize.js`, tests, `worker.js`, and `page.js`.
- **Live-test caveat:** unit tests run offline; live `/api/market` validation requires `wrangler dev --remote` or the deployed Worker, because the local/author network blocks Polymarket.
- **Placeholder scan:** logic and CSS are complete and valid; the only intentionally-user-supplied value is `CF_ANALYTICS_TOKEN` (Task 5), a config secret, not a code gap.
