# casino

Landing page estática para campañas promocionales con contacto directo por WhatsApp.
Sin backend, sin build, sin dependencias: HTML + CSS + JavaScript vanilla.
Funciona en GitHub Pages tal cual está.

## Estructura del proyecto

```
index.html                 Página principal (marcado semántico)
generar.html               🔗 Generador de enlaces de campaña (protegido con PIN, ver abajo)
config.js                  ⚙️  Configuración pública — campañas fijas
assets/css/styles.css      Estilos
assets/js/app.js           Lógica (validación, contador, tracking opcional)
dev/config-editor.html     Herramienta LOCAL para generar config.js (ver abajo)
scripts/verify.py          Verificación simple, sin dependencias
README.md
```

## Autoadministración: generador de enlaces (`generar.html`)

"¿Cómo hago una campaña con otro número sin tocar código?" → **Abriendo `generar.html`** (enlazado al pie del sitio):

### Acceso con PIN (solo propietario)

`generar.html` está protegido por un **PIN de acceso** (definido por el propietario;
valor por defecto acordado al crearlo — no se publica en este README) para que el
generador no lo use cualquier visitante.

- **Cómo entrar:** abrí `generar.html`, ingresá el PIN y listo. La sesión queda
  desbloqueada solo hasta cerrar la pestaña; si marcás "Recordar en este dispositivo",
  queda desbloqueado en ese navegador hasta que toques "Bloquear de nuevo".
- **El PIN nunca se guarda en texto plano:** solo se compara el hash SHA-256 del PIN
  escrito con el hash publicado en el código de la página.
- **Cambiar el PIN:**

  ```bash
  printf '%s' 'TU_NUEVO_PIN' | sha256sum
  # copiá el hash y reemplazá PIN_HASH en el <script> de generar.html
  ```

  Después de cambiarlo, hacé commit y push para publicarlo.

> **Limitación honesta (léela):** esto NO es autenticación ni seguridad real.
> El sitio es estático y público: cualquiera puede leer el código fuente de la
> página, saltarse la barrera o romper el hash por fuerza bruta offline (un PIN
> de 8 dígitos tiene solo 100 millones de combinaciones). Sirve para frenar al
> visitante casual — no protege contra alguien con conocimientos ni contra la
> difusión deliberada del PIN. Además, `config.js` y los enlaces siguen siendo
> públicos para cualquiera que ya conozca la URL: el PIN solo oculta la UI del
> generador. Si en el futuro necesitás seguridad real, hace falta un backend o
> una protección a nivel servidor (p. ej. Cloudflare Access, HTTP Basic Auth en
> el hosting, etc.).

### Cómo se usa

1. Completás el número, el mensaje y —opcional— el vencimiento.
2. Copiás el enlace generado, p. ej.
   `https://USUARIO.github.io/casino/?phone=595981234567&msg=Sorpresa%20de%20noviembre&expires=2026-12-31T23%3A59%3A00-03%3A00`
3. Ese enlace va directo a tus anuncios. Cada visitante ve el botón apuntando a ese número, con ese mensaje y ese vencimiento.

No hace falta hacer commit ni push para cada campaña nueva: **la URL es la campaña**.
También lista botones rápidos para copiar enlaces `?ref=codigo` de las campañas ya fijas en `config.js`.

El PIN oculta la interfaz del generador, pero no hace privado nada del sitio: todo lo que el generador produce son URLs públicas. No pongas datos privados en ningún enlace.

⚠️ Los enlaces generados apuntan a `index.html` y funcionan solo cuando el sitio está publicado en GitHub Pages (o probándola con un servidor local).

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
| `?msg=Texto%20aquí` | Pisa el mensaje de `config.js` (máx. 300 caracteres, se sanea) |
| `?expires=2026-12-31T23:59:59-03:00` | Activa el contador hasta ese instante (Pisa `expiresAt` de `config.js`) |
| `?ref=x&phone=595...&msg=...` | Combinable: el número directo gana; `ref` queda para analítica |
| sin parámetros | Usa `config.js` tal cual |

Los parámetros se tratan como **entrada no confiable**: se normalizan, validan y sanean antes de usarse. Lo genera/valida `generar.html` si no querés armar URLs a mano.

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

> `generar.html` lleva un gate por PIN client-side (pedido expreso del propietario).
> Es una barrera visual mejorada — hash SHA-256 en lugar de texto plano — pero sigue
> siendo saltable leyendo el código, como cualquier protección sin backend.
> El panel admin de versiones muy antiguas (con el PIN en texto plano y datos
> embebidos) sí se eliminó y `scripts/verify.py` vigila que no regrese al index.

## Publicación en GitHub Pages

1. Subí el proyecto al repositorio y confirmá `index.html` en la raíz.
2. **Settings → Pages → Build and deployment → Deploy from a branch**: rama `main`, carpeta `/ (root)`.
3. La URL será `https://USUARIO.github.io/REPOSITORIO/`. Abrila y probá el botón de WhatsApp,
   `?ref=...`, el contador (o su ausencia) y la versión móvil.
4. Tras publicar, poné esa URL en `config.js → siteUrl` y hacé push de nuevo: habilita `canonical` y `og:url`.
5. Rutas siempre **relativas** (`assets/...`, `config.js`): nunca `/assets/...`, que rompería bajo `/REPOSITORIO/`.
6. Compartí `.../generar.html` solo con quien gestione las campañas. El PIN frena al visitante casual, pero no es seguridad real (ver limitaciones arriba), así que evitá difundirlo masivamente: cada persona con acceso puede armar enlaces con cualquier número.

## Verificación

`python3 scripts/verify.py` controla: archivos requeridos, que los recursos referenciados existan,
que no haya rutas absolutas, que `config.js` parsee y tenga formato válido, que no queden restos del
panel antiguo ni teléfonos fijos inventados, y que no se registren números en consola.
Advertencias (datos PENDIENTES del propietario) no frenan el resultado.

## Seguridad y privacidad

- Todo lo publicado es **público**: `config.js`, HTML, CSS y JS se pueden leer por cualquiera.
  No pongas contraseñas, tokens ni datos privados en ningún archivo del repo.
- El PIN de `generar.html` tampoco se guarda en texto plano: solo su hash SHA-256.
  Aun así, tratalo como un PIN desechable (único para esta página) — no reutilices
  uno de tu banco, correo ni nada importante.
- No se registran números ni datos personales en consola, en `localStorage`/`sessionStorage`
  ni en analítica. (El desbloqueo del PIN se recuerda en
  `sessionStorage`/`localStorage` — solo una bandera `"generar-unlocked": "1"`, nunca el PIN.)
- La página funciona sin cuentas ni cookies.

## Accesibilidad y rendimiento

- HTML semántico, salto de contenido (`Skip link`), foco visible, FAQ con `<details>/<summary>` nativo,
  `role="alert"` en el aviso de configuración y estados con `aria-live`.
- Contraste legible, `prefers-reduced-motion` respetado, sin animaciones que dificulten la lectura.
- Sin frameworks, sin imágenes pesadas, fuentes con `display=swap` y alternativas del sistema
  (`Inter` → `system-ui`; `Fraunces` → `Georgia`): la página se ve bien aunque Google Fonts no responda.

## Notas para el propietario (pendientes)

- [ ] `defaultPhone` y (si aplica) `campaigns` en `config.js`, o directamente no tocar nada y usar `generar.html` por campaña.
- [ ] Si no querés usar el PIN por defecto de `generar.html`, cambialo (hash SHA-256, ver sección "Acceso con PIN"). No lo reutilices de otros servicios.
- [ ] Decidir la vigencia real de la oferta y completar `expiresAt`, o dejarlo vacío.
- [ ] `siteUrl` una vez publicado el sitio (habilita canonical y og:url).
- [ ] Si querés imagen al compartir en redes, agregá una imagen **existente** y su `og:image` (hoy no se declara ninguna).
- [ ] No se incluyen datos estructurados (schema.org) porque no hay nombre legal, dirección ni datos verificados del negocio; si los tenés, agregá JSON-LD con esos datos reales.
