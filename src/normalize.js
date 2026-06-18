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
