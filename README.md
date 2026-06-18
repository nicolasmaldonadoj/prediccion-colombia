# Predicción Colombia

Landing pública y gratuita que muestra, en tiempo real, el pronóstico del mercado de predicción
**Polymarket** sobre el ganador de las elecciones presidenciales de Colombia.

**En vivo:** https://prediccion-colombia.nicolas-33f.workers.dev

## Por qué existe

El acceso a Polymarket está bloqueado en Colombia a nivel de red/DNS, y el bloqueo alcanza también
el subdominio de su API (`gamma-api.polymarket.com`). Una página que hiciera `fetch` desde el
navegador del visitante fallaría igual, porque la petición saldría desde la red bloqueada.

Este proyecto resuelve eso con un **Cloudflare Worker** que actúa de proxy en el edge (fuera de
Colombia): el visitante solo habla con el Worker, y el Worker consulta Polymarket. Gratis, público,
sin registro.

```
Navegador (Colombia) ──→ Worker (edge, fuera de CO) ──→ gamma-api.polymarket.com
                     ←──        JSON normalizado     ←──
```

## Cómo funciona

- `GET /` sirve la landing (HTML/CSS/JS autocontenido, en español, mobile-first).
- `GET /api/market` busca en la Gamma API, elige el evento de Colombia con **mayor volumen**
  (más dinero invertido), arma el tablero de candidatos y lo devuelve como JSON (cache de edge 45s).

## Estructura

- `src/normalize.js` — lógica pura: elige el mercado y arma el tablero. Sin red, testeable.
- `src/worker.js` — rutas, fetch/merge a Polymarket, cache, manejo de errores.
- `src/page.js` — la landing como string.
- `test/` — tests con `node --test`.

## Desarrollo

```bash
npm install
npm test                 # tests unitarios (offline)
npm run dev:remote       # corre el worker en el edge (fetch real a Polymarket)
```

> El fetch en vivo solo funciona vía `--remote` o ya desplegado: una red colombiana no puede
> alcanzar Polymarket directamente.

## Despliegue

```bash
CLOUDFLARE_API_TOKEN=<tu-token> npx wrangler deploy
```

El token se guarda en `.env` (ignorado por git).
