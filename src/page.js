export const PAGE_HTML = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>¿Quién va ganando la Presidencia de Colombia? · Pronóstico Polymarket en vivo</title>
<meta name="description" content="Pronóstico en tiempo real del ganador de las elecciones presidenciales de Colombia según el mercado de predicción Polymarket. Acceso libre, sin registro." />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,400;0,600;0,800;1,400&family=Libre+Franklin:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
<style>
  :root {
    --paper:     oklch(0.972 0.008 85);
    --paper-2:   oklch(0.945 0.010 85);
    --ink:       oklch(0.235 0.012 70);
    --ink-soft:  oklch(0.435 0.012 70);
    --ink-faint: oklch(0.620 0.010 75);
    --rule:      oklch(0.855 0.010 80);
    --rule-soft: oklch(0.905 0.008 80);
    --bar-lead:  oklch(0.300 0.022 55);
    --bar-rest:  oklch(0.640 0.012 75);
    --track:     oklch(0.915 0.009 82);
    --live:      oklch(0.560 0.090 195);
    --serif: "Spectral", Georgia, "Times New Roman", serif;
    --sans: "Libre Franklin", -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { -webkit-text-size-adjust: 100%; }
  body {
    font-family: var(--sans);
    background: var(--paper);
    color: var(--ink);
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }
  .sheet {
    max-width: 600px;
    margin: 0 auto;
    padding: clamp(20px, 5vw, 40px) clamp(18px, 5vw, 32px) 56px;
  }

  /* ---- Masthead ---- */
  .top-rule { height: 3px; background: var(--ink); margin-bottom: 14px; }
  .masthead-meta {
    display: flex; align-items: center; justify-content: space-between;
    font-size: 11px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase;
    color: var(--ink-soft);
  }
  .live { display: inline-flex; align-items: center; gap: 7px; color: var(--ink); }
  .dot {
    width: 8px; height: 8px; border-radius: 50%; background: var(--live);
    box-shadow: 0 0 0 0 var(--live); animation: pulse 1.8s infinite;
  }
  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 color-mix(in oklch, var(--live) 55%, transparent); }
    70% { box-shadow: 0 0 0 7px transparent; }
    100% { box-shadow: 0 0 0 0 transparent; }
  }
  h1 {
    font-family: var(--serif);
    font-weight: 800;
    font-size: clamp(30px, 8.5vw, 50px);
    line-height: 1.02;
    letter-spacing: -0.018em;
    margin: 18px 0 12px;
    text-wrap: balance;
  }
  .standfirst {
    font-size: 15px; color: var(--ink-soft); max-width: 48ch;
    border-bottom: 1px solid var(--rule); padding-bottom: 18px; margin-bottom: 4px;
  }
  .standfirst b { color: var(--ink); font-weight: 600; }
  #market {
    display: block; margin-top: 9px; font-size: 12.5px; font-style: italic;
    font-family: var(--serif); color: var(--ink-faint);
  }

  /* ---- Tally ---- */
  .tally { margin-top: 8px; }
  .row {
    display: grid;
    grid-template-columns: 1.6rem 1fr auto;
    column-gap: 14px;
    align-items: baseline;
    padding: 18px 0 16px;
    border-bottom: 1px solid var(--rule-soft);
    opacity: 0; transform: translateY(6px);
    animation: rise .5s cubic-bezier(.2,.8,.2,1) forwards;
  }
  @keyframes rise { to { opacity: 1; transform: none; } }
  .rank {
    font-variant-numeric: tabular-nums; font-weight: 700;
    font-size: 15px; color: var(--ink-faint); line-height: 1.1;
  }
  .nm { font-size: 18px; font-weight: 600; letter-spacing: -0.01em; }
  .row.lead .nm { font-weight: 800; }
  .puntero {
    display: inline-block; margin-left: 9px; vertical-align: 2px;
    font-size: 9.5px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase;
    color: var(--paper); background: var(--ink); padding: 2px 7px; border-radius: 2px;
  }
  .track { grid-column: 2 / 3; height: 7px; margin-top: 11px; background: var(--track); border-radius: 1px; overflow: hidden; }
  .fill { height: 100%; width: 0; background: var(--bar-rest); transition: width .7s cubic-bezier(.2,.85,.2,1); }
  .row.lead .fill { background: var(--bar-lead); }
  .val {
    grid-row: 1 / 2; grid-column: 3 / 4;
    font-variant-numeric: tabular-nums; font-weight: 700;
    font-size: 26px; letter-spacing: -0.02em; line-height: 1;
  }
  .row.lead .val { font-size: 34px; font-weight: 800; }
  .trend {
    grid-column: 3 / 4; justify-self: end; margin-top: 6px;
    font-size: 11px; font-weight: 600; font-variant-numeric: tabular-nums; color: var(--ink-faint);
  }
  .trend.up::before { content: "▲ "; }
  .trend.down::before { content: "▼ "; }

  /* ---- Footer line ---- */
  .stats {
    display: flex; flex-wrap: wrap; gap: 4px 28px;
    margin-top: 22px; padding-top: 16px;
    font-size: 12.5px; color: var(--ink-soft);
  }
  .stats .lbl { letter-spacing: .04em; text-transform: uppercase; font-size: 10.5px; color: var(--ink-faint); display: block; }
  .stats b { font-family: var(--serif); font-size: 19px; font-weight: 600; color: var(--ink); font-variant-numeric: tabular-nums; }

  .actions { display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-top: 26px; }
  #updated { font-size: 12px; color: var(--ink-faint); }
  button {
    font: inherit; font-size: 13px; font-weight: 600; letter-spacing: .02em;
    color: var(--ink); background: transparent; border: 1.5px solid var(--ink);
    border-radius: 2px; padding: 9px 16px; cursor: pointer;
    transition: background .15s ease, color .15s ease;
  }
  button:hover { background: var(--ink); color: var(--paper); }
  button:disabled { opacity: .4; cursor: default; }
  button:disabled:hover { background: transparent; color: var(--ink); }

  .nota {
    margin-top: 30px; padding-top: 18px; border-top: 1px solid var(--rule); max-width: 60ch;
  }
  .nota h2 {
    font-size: 11px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase;
    color: var(--ink-soft); margin-bottom: 10px;
  }
  .nota p { font-size: 13.5px; line-height: 1.6; color: var(--ink-soft); }
  .nota p + p { margin-top: 9px; }
  .nota b { color: var(--ink); font-weight: 600; }
  .nota .aporta { margin-top: 12px; color: var(--ink-faint); }
  .nota a { color: var(--ink); font-weight: 600; text-decoration: underline; text-underline-offset: 2px; }
  .nota a:hover { color: var(--live); }

  .disclaimer {
    margin-top: 22px; padding-top: 16px; border-top: 1px solid var(--rule-soft);
    font-size: 11.5px; line-height: 1.65; color: var(--ink-faint); max-width: 60ch;
  }
  .disclaimer b { color: var(--ink-soft); font-weight: 600; }

  .state { padding: 40px 4px; color: var(--ink-soft); font-size: 15px; line-height: 1.6; }
  .skeleton {
    height: 18px; margin: 24px 0; border-radius: 1px;
    background: linear-gradient(90deg, var(--paper-2), var(--track), var(--paper-2));
    background-size: 200% 100%; animation: sh 1.3s infinite;
  }
  .skeleton:nth-child(2) { width: 82%; } .skeleton:nth-child(3) { width: 64%; }
  @keyframes sh { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

  @media (prefers-reduced-motion: reduce) {
    .fill, .row, .skeleton, .dot { animation: none !important; transition: none !important; opacity: 1 !important; transform: none !important; }
  }
</style>
</head>
<body>
  <div class="sheet">
    <div class="top-rule"></div>
    <div class="masthead-meta">
      <span>Pronóstico electoral</span>
      <span class="live"><span class="dot"></span> En vivo</span>
    </div>

    <h1 id="title">¿Quién va ganando la Presidencia?</h1>
    <p class="standfirst">
      Lo que el dinero apuesta, en tiempo real, sobre el ganador de las elecciones de Colombia.
      Datos de <b>Polymarket</b>. Acceso libre, sin registro.
      <span id="market"></span>
    </p>

    <div class="tally" id="board">
      <div class="skeleton"></div>
      <div class="skeleton"></div>
      <div class="skeleton"></div>
    </div>

    <div class="stats" id="meta"></div>

    <div class="actions">
      <span id="updated">Cargando pronóstico…</span>
      <button id="refresh">Actualizar</button>
    </div>

    <section class="nota">
      <h2>Por qué esta página existe</h2>
      <p>
        El <b>Gobierno colombiano</b> ordenó a los proveedores de internet bloquear Polymarket.
      </p>
      <p>
        A pocos días de las <b>elecciones del domingo</b>, este pronóstico es información de interés
        público. Esta página lo hace accesible para cualquiera, gratis y sin registro.
      </p>
      <p class="aporta">
        Es un proyecto abierto y comunitario. ¿Quieres aportar o mejorarlo? El código es público en
        <a href="https://github.com/nicolasmaldonadoj/prediccion-colombia" target="_blank" rel="noopener">GitHub</a>.
      </p>
    </section>

    <p class="disclaimer">
      Esto es un <b>mercado de predicción</b>: gente apostando dinero real sobre un resultado, no
      una encuesta ni un conteo oficial. El porcentaje es el precio que el mercado le pone a cada
      candidato, y cambia minuto a minuto. Úsalo como una señal más, no como un veredicto.
      Fuente: Polymarket.
    </p>
  </div>

<script>
  var pctFmt = function (p) { return (p * 100).toFixed(1) + "%"; };
  var moneyFmt = function (n) {
    if (n >= 1e6) return "US$" + (n / 1e6).toFixed(1) + " M";
    if (n >= 1e3) return "US$" + Math.round(n / 1e3) + " mil";
    return "US$" + Math.round(n);
  };

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  function renderBoard(data) {
    var market = document.getElementById("market");
    market.textContent = data.titulo ? "Mercado: " + data.titulo : "";

    var board = document.getElementById("board");
    if (!data.candidatos || data.candidatos.length === 0) {
      board.innerHTML = '<div class="state">Aún no hay un mercado activo con candidatos para esta elección.</div>';
      document.getElementById("meta").innerHTML = "";
      return;
    }

    var max = data.candidatos[0].probabilidad || 1;
    board.innerHTML = data.candidatos.map(function (c, i) {
      var w = Math.max(2, (c.probabilidad / max) * 100);
      var ch = c.cambioSemana;
      var trend = '<span class="trend"></span>';
      if (typeof ch === "number" && Math.abs(ch) >= 0.01) {
        var cls = ch > 0 ? "up" : "down";
        trend = '<span class="trend ' + cls + '">' + Math.abs(Math.round(ch * 100)) + " pts sem</span>";
      }
      var puntero = i === 0 ? '<span class="puntero">Puntero</span>' : "";
      var delay = "animation-delay:" + (i * 60) + "ms";
      return (
        '<div class="row ' + (i === 0 ? "lead" : "") + '" style="' + delay + '">' +
          '<span class="rank">' + (i + 1) + "</span>" +
          '<span class="nm">' + escapeHtml(c.nombre) + puntero + "</span>" +
          '<span class="val">' + pctFmt(c.probabilidad) + "</span>" +
          trend +
          '<div class="track"><div class="fill" style="width:' + w + '%"></div></div>' +
        "</div>"
      );
    }).join("");

    document.getElementById("meta").innerHTML =
      '<span><span class="lbl">Total apostado</span><b>' + moneyFmt(data.totalInvertido || 0) + "</b></span>" +
      '<span><span class="lbl">Liquidez</span><b>' + moneyFmt(data.liquidez || 0) + "</b></span>";
  }

  function setUpdated(date) {
    var el = document.getElementById("updated");
    if (!date) { el.textContent = "Actualizado ahora"; return; }
    var diff = Math.max(0, Math.round((Date.now() - new Date(date).getTime()) / 1000));
    var txt = diff < 60 ? "hace " + diff + " s"
      : diff < 3600 ? "hace " + Math.round(diff / 60) + " min"
      : "hace " + Math.round(diff / 3600) + " h";
    el.textContent = "Datos actualizados " + txt;
  }

  function load() {
    var btn = document.getElementById("refresh");
    btn.disabled = true;
    fetch("/api/market", { cache: "no-store" }).then(function (res) {
      if (res.status === 404) {
        document.getElementById("board").innerHTML =
          '<div class="state">Todavía no hay un mercado activo de las elecciones de Colombia en Polymarket. Vuelve cerca de la jornada electoral.</div>';
        document.getElementById("updated").textContent = "";
        return null;
      }
      if (!res.ok) throw new Error("status " + res.status);
      return res.json();
    }).then(function (data) {
      if (!data) return;
      renderBoard(data);
      setUpdated(data.actualizado);
    }).catch(function () {
      document.getElementById("board").innerHTML =
        '<div class="state">No pudimos cargar el pronóstico en este momento.<br/>Intenta de nuevo en unos segundos.</div>';
      document.getElementById("updated").textContent = "";
    }).then(function () {
      btn.disabled = false;
    });
  }

  document.getElementById("refresh").addEventListener("click", load);
  load();
  setInterval(load, 60000);
</script>
<!-- ANALYTICS_BEACON -->
</body>
</html>`;
