# Predicción Colombia — Landing pública del pronóstico de Polymarket

**Fecha:** 2026-06-18
**Estado:** Diseño aprobado, pendiente revisión del spec

## Problema

El gobierno de Colombia bloquea el acceso a Polymarket **a nivel de red/DNS**, y el bloqueo
alcanza también el subdominio de la API (`gamma-api.polymarket.com`). Verificado: una conexión
a la API desde una red colombiana expira contra una IP de *sinkhole*
(`166.210.35.97` / IPv6 falso `2001:1:2:3::f5f5:1d`).

Esto significa que **una página estática que haga `fetch` desde el navegador del visitante NO
funciona**: ese `fetch` sale desde la red bloqueada y falla igual.

Con elecciones presidenciales el domingo, el objetivo es dar acceso público, gratuito y sin
registro al pronóstico de Polymarket sobre el ganador.

## Solución

Un **Cloudflare Worker** (un solo archivo) que cumple dos roles:

- `GET /` → sirve el HTML/CSS/JS de la landing (autocontenido, embebido).
- `GET /api/market` → **proxy** que corre en el edge de Cloudflare (fuera de Colombia),
  consulta Polymarket y devuelve JSON limpio.

El visitante en Colombia nunca toca Polymarket directamente; habla solo con el Worker (dominio
`*.workers.dev`, no bloqueado). Esto evade el bloqueo y elimina cualquier problema de CORS.

```
Navegador (Colombia) ──→ Worker (edge, fuera de CO) ──→ gamma-api.polymarket.com
                     ←──        JSON normalizado     ←──
```

## Componentes

### 1. Proxy `/api/market` (server-side, en el Worker)

Responsabilidad: encontrar el mercado correcto y normalizarlo a un tablero de candidatos.

1. Consulta `https://gamma-api.polymarket.com/public-search` con varios términos
   (`Colombia president`, `Colombia election`, `Colombia presidential election`).
2. Filtra eventos: activos, no cerrados, cuyo título indique *ganador de elección de Colombia*.
3. **Elige el evento con mayor `volume`** (más dinero invertido) — criterio explícito del usuario.
4. Para ese evento, arma el tablero de candidatos:
   - Caso típico (neg-risk): cada candidato es un sub-mercado "¿Ganará X?" con precio Sí/No.
     Probabilidad del candidato = precio del "Sí". Nombre = `groupItemTitle` del market, o
     se deriva de la pregunta (lógica `synth_outcomes` del skill `last30days`).
   - Caso mercado único multi-outcome: usar `outcomes` + `outcomePrices` directo.
5. Devuelve JSON:
   ```json
   {
     "titulo": "...",
     "candidatos": [{ "nombre": "...", "probabilidad": 0.62, "cambioSemana": 0.05 }],
     "totalInvertido": 4200000,
     "liquidez": 1100000,
     "actualizado": "2026-06-18T18:00:00Z",
     "urlEvento": "https://polymarket.com/event/..."
   }
   ```
6. **Caché de edge ~30–60s** (Cloudflare Cache API) para frescura "casi en vivo" sin martillear
   la API ni colapsar ante picos de tráfico.

> La función de normalización (respuesta cruda → tablero) se escribe **pura/aislada** para poder
> testearla localmente contra el fixture `polymarket_sample.json` del skill, sin red.

### 2. Landing `/` (cliente)

- HTML/CSS/JS embebido, en **español**, **mobile-first** (la mayoría entrará desde celular).
- Diseño con el skill `impeccable`: tablero de candidatos ordenado por probabilidad, con barras,
  **líder destacado**, total invertido y "actualizado hace Xs".
- Botón **Actualizar** + auto-refresh cada 60s.
- **Disclaimer** claro: es un mercado de predicción, no resultados oficiales; datos de Polymarket.
- Estados de error y carga cuidados (ver abajo).

### 3. Analytics

- **Cloudflare Web Analytics** (gratis, sin cookies): se agrega el *beacon* al HTML.
- Mide vistas, visitantes únicos y **país de origen** (para ver el impacto/tráfico desde Colombia).
- Sin panel de admin propio; los datos se ven en el dashboard de Cloudflare.
- Métricas técnicas del Worker (requests, errores) ya vienen automáticas en el dashboard.

## Manejo de errores

- API no responde / timeout → el proxy devuelve `503` con `{ "error": "..." }`; la página muestra
  mensaje amable en español ("No pudimos cargar el pronóstico ahora; intenta en un momento").
- No se encuentra mercado de Colombia → mensaje específico ("Aún no hay un mercado activo").
- Estado de carga visible mientras llega `/api/market`.

## Testing

- **Unitario (local, sin red):** función de normalización contra `polymarket_sample.json`.
- **En vivo:** `wrangler dev --remote` (el `fetch` sale desde Cloudflare, no desde la red
  bloqueada) y luego en el despliegue real. *La validación en vivo no es posible desde la red del
  usuario.*

## Despliegue

- **Cloudflare Workers** vía `wrangler`, autenticado con `CLOUDFLARE_API_TOKEN` (en `.env`,
  gitignored). Dominio gratuito `*.workers.dev`.
- Comando: `CLOUDFLARE_API_TOKEN=$(grep CLOUDFLARE_API_TOKEN .env | cut -d= -f2) npx wrangler deploy`.
- GitHub **no** es necesario para desplegar (solo opcional para respaldo).

## Fuera de alcance (YAGNI)

- Histórico de precios / gráficas de evolución.
- Múltiples mercados o países.
- Registro, cuentas, panel de admin propio.
- Dominio personalizado (se puede agregar después).

## Restricciones / notas

- El token de Cloudflare quedó visible en chat: **revocar/rotar tras el despliegue**.
- Frescura objetivo: 30–60s (no streaming en tiempo real estricto).
