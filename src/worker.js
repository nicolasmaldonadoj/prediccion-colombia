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
