# Cómo contribuir

¡Gracias por querer mejorar este proyecto! Es de código abierto y comunitario.
El objetivo es simple: dar acceso público y gratuito al pronóstico de Polymarket sobre las
elecciones de Colombia, sin registro ni fricción.

## Cómo proponer un cambio

1. Haz un **fork** del repo.
2. Crea una rama: `git checkout -b mi-mejora`.
3. Instala y corre los tests: `npm install && npm test`.
4. Haz tus cambios. Si tocas la lógica de datos (`src/normalize.js`) o el Worker
   (`src/worker.js`), **agrega o actualiza tests** en `test/`.
5. Abre un **Pull Request** describiendo qué mejora y por qué.

## Probar en vivo

Un fetch directo a Polymarket no funciona desde una red colombiana (está bloqueada). Para probar
el flujo real de datos:

```bash
npm run dev:remote   # corre el Worker en el edge de Cloudflare con tu propia cuenta
```

Necesitas tu propio `CLOUDFLARE_API_TOKEN` en un archivo `.env` local (nunca lo subas; está en
`.gitignore`).

## Modelo de despliegue

Cualquiera puede proponer código, pero el **despliegue a producción lo hace el mantenedor** con su
token de Cloudflare (que no vive en el repo). Tu PR no necesita ningún secreto.

## Ideas bienvenidas

- Mejoras de accesibilidad y rendimiento.
- Histórico/gráfica de evolución de probabilidades.
- Soporte para más mercados o más países bloqueados.
- Traducciones / mejoras de copy.
- Mejoras de diseño (manteniendo la **neutralidad política** del proyecto).

## Principio no negociable

**Neutralidad política absoluta.** Nada de favorecer candidatos en lenguaje, color o diseño.
El proyecto solo refleja datos del mercado, con transparencia sobre qué son (y qué no son).
