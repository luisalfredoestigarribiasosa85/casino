# casino

Landing page estática para campañas promocionales con contacto directo por WhatsApp.
Sin backend, sin build, sin dependencias: HTML + CSS + JavaScript vanilla.
Funciona en GitHub Pages tal cual está.

## Estructura del proyecto

```
index.html                 Página principal (marcado semántico)
config.js                  ⚙️  Configuración pública — EDITAR ACÁ
assets/css/styles.css      Estilos
assets/js/app.js           Lógica (validación, contador, tracking opcional)
dev/config-editor.html     Herramienta LOCAL para generar config.js (ver abajo)
scripts/verify.py          Verificación simple, sin dependencias
README.md
```

## Inicio rápido

1. **Completá `config.js`** (único archivo que tenés que tocar):
   - `defaultPhone`: número de WhatsApp por defecto, **solo dígitos**, con código de país (ej. `595981234567`).
   - `campaigns`: mapa `"codigo" → "número"` para tus campañas. Cada anuncio usa `?ref=codigo` en la URL.
   - `message`: texto pre-cargado en el chat.
   - `expiresAt`: vencimiento **absoluto** en ISO 8601 **con huso horario** (ej. `2026-12-31T23:59:59-03:00`). Vacío → el contador no se muestra.
   - `siteUrl`: URL pública del sitio cuando esté publicado. Vacío → no se generan `canonical` ni `og:url`.
2. Probá localmente (desde la raíz del repo):

   ```bash
   python3 -m http.server 8000
   # abrí http://localhost:8000
   ```

3. Corré la verificación:

   ```bash
   python3 scripts/verify.py
   ```

Mientras `defaultPhone` esté vacío, la página muestra un aviso de "promoción no disponible"
en lugar del botón de WhatsApp. No se genera ningún enlace inválido.

## Parámetros de URL

| URL | Efecto |
|---|---|
| `?ref=casino` | Usa el número de la campaña `casino` definida en `config.js` |
| `?ref=otro` | Código desconocido → usa `defaultPhone` |
| `?phone=595981234567` | Usa ese número directamente (validado: 8–15 dígitos) |
| `?phone=abc` | Teléfono inválido → usa `defaultPhone` (o el aviso si tampoco está configurado) |
| sin parámetros | Usa `defaultPhone` |

Los parámetros se tratan como **entrada no confiable**: se normalizan, validan y sanean antes de usarse.

## Contador y urgencia

El contador **solo aparece** si `expiresAt` está configurado con una fecha/hora válida y con huso horario:

- Cuenta hasta ese **instante fijo**; no se reinicia cada día ni usa medianoche local del visitante.
- Muestra la fecha y hora límite según el huso configurado (texto generado desde el propio ISO).
- Cuando vence, el contador se oculta y se muestra **"La promoción finalizó"**; el botón de WhatsApp sigue disponible para consultas.
- Si la promoción no tiene una fecha de cierre real, dejá `expiresAt: ""`: no hay urgencia falsa.

## Medición (opcional, desactivada por defecto)

- Cada clic en el botón de WhatsApp dispara:
  - un `CustomEvent("whatsapp-click", { detail: { event, ref, source } })` en `window`, y
  - si `config.analytics.enabled === true` **y** ya existe `window.dataLayer` (p. ej. Google Tag Manager), un `push` con la misma data.
- **Nunca** se envía el número de teléfono ni datos personales. Solo el código de campaña y el origen (`ref` / `phone` / `default`).
- El sitio no carga ningún script externo de analítica por su cuenta. Para integrarlo, configurá GTM (o tu herramienta) en GitHub Pages según la documentación de esa herramienta y activá `analytics.enabled`.

## `dev/config-editor.html` — herramienta de desarrollo

Página pública (cualquiera puede abrirla) que genera el contenido de `config.js` desde el navegador: editá los campos → generá → copiá/descargá → reemplazá `config.js` → commit y push.

**No es seguridad ni autenticación.** No ingreses datos privados. Sus cambios **no se publican solos**; hay que actualizar `config.js` en el repositorio y hacer push. Se incluye por comodidad; si no la querés, borrá la carpeta `dev/`.

> El panel con PIN de versiones anteriores se eliminó: era una barrera visual en JavaScript
> que cualquier visitante podía saltarse inspeccionando el código.

## Publicación en GitHub Pages

1. Subí el proyecto al repositorio y confirmá `index.html` en la raíz.
2. **Settings → Pages → Build and deployment → Deploy from a branch**: rama `main`, carpeta `/ (root)`.
3. La URL será `https://USUARIO.github.io/REPOSITORIO/`. Abrila y probá el botón de WhatsApp,
   `?ref=...`, el contador (o su ausencia) y la versión móvil.
4. Tras publicar, poné esa URL en `config.js → siteUrl` y hacé push de nuevo: habilita `canonical` y `og:url`.
5. Rutas siempre **relativas** (`assets/...`, `config.js`): nunca `/assets/...`, que rompería bajo `/REPOSITORIO/`.

## Seguridad y privacidad

- Todo lo publicado es **público**: `config.js`, HTML, CSS y JS se pueden leer por cualquiera.
  No pongas contraseñas, tokens ni datos privados en ningún archivo del repo.
- No se registran números ni datos personales en consola, en `localStorage` ni en analítica.
- La página funciona sin cuentas ni cookies.

## Accesibilidad y rendimiento

- HTML semántico, salto de contenido (`Skip link`), foco visible, FAQ con `<details>/<summary>` nativo,
  `role="alert"` en el aviso de configuración y estados con `aria-live`.
- Contraste legible, `prefers-reduced-motion` respetado, sin animaciones que dificulten la lectura.
- Sin frameworks, sin imágenes pesadas, fuentes con `display=swap` y alternativas del sistema
  (`Inter` → `system-ui`; `Fraunces` → `Georgia`): la página se ve bien aunque Google Fonts no responda.

## Verificación

`python3 scripts/verify.py` controla: archivos requeridos, que los recursos referenciados existan,
que no haya rutas absolutas, que `config.js` parsee y tenga formato válido, que no queden restos del
panel antiguo ni teléfonos fijos inventados, y que no se registren números en consola.
Advertencias (datos PENDIENTES del propietario) no frenan el resultado.

## Notas para el propietario (pendientes)

- [ ] `defaultPhone` y (si aplica) `campaigns` en `config.js` — hoy vacíos por diseño.
- [ ] Decidir la vigencia real de la oferta y completar `expiresAt`, o dejarlo vacío.
- [ ] `siteUrl` una vez publicado el sitio (habilita canonical y og:url).
- [ ] Si querés imagen al compartir en redes, agregá una imagen **existente** y su `og:image` (hoy no se declara ninguna).
- [ ] No se incluyen datos estructurados (schema.org) porque no hay nombre legal, dirección ni datos verificados del negocio; si los tenés, agregá JSON-LD con esos datos reales.
