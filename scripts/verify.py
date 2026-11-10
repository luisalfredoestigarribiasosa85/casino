#!/usr/bin/env python3
"""
Verificación simple del sitio estático (sin dependencias).

Uso:  python3 scripts/verify.py

Errores (exit 1): estructura rota — assets faltantes, rutas absolutas,
config.js ilegible o campañas con formato inválido.
Advertencias (exit 0): faltan datos que debe completar el propietario
en config.js (defaultPhone / campañas). Son esperadas en una instalación
nueva; la página lo muestra con un aviso en lugar de romperse.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
errors, warnings = [], []

def check(cond, ok_msg, err_msg, warn=False):
    if cond:
        print(f"  ✓ {ok_msg}")
    elif warn:
        warnings.append(err_msg)
        print(f"  ⚠ {err_msg}")
    else:
        errors.append(err_msg)
        print(f"  ✗ {err_msg}")

print("== 1. Archivos requeridos ==")
required = ["index.html", "generar.html", "config.js", "assets/css/styles.css", "assets/js/app.js", "README.md"]
for rel in required:
    check((ROOT / rel).is_file(), rel, f"Falta el archivo requerido: {rel}")

print("== 2. Referencias locales en index.html y generar.html existen ==")
for page in ("index.html", "generar.html"):
    html = (ROOT / page).read_text(encoding="utf-8") if (ROOT / page).exists() else ""
    refs = re.findall(r'(?:src|href)="([^"#]+)"', html)
    local_refs = [r for r in refs if not r.startswith(("http://", "https://", "data:", "mailto:", "tel:"))]
    for r in local_refs:
        if r.startswith("/"):
            errors.append(f"Ruta absoluta '{r}' en {page} (rompe en GitHub Pages bajo /<repo>/).")
            print(f"  ✗ [{page}] Ruta absoluta: {r}")
            continue
        check((ROOT / r).exists(), f"[{page}] {r}", f"{page} referencia un archivo inexistente: {r}")

html = (ROOT / "index.html").read_text(encoding="utf-8") if (ROOT / "index.html").exists() else ""
check(not re.search(r'(src|href)="/', html), "Sin rutas desde la raíz del dominio", "index.html contiene rutas absolutas '/...'")

print("== 3. index.html no contiene el panel admin antiguo ni datos fijos de ejemplo ==")
for banned in ["admin-gate", "gate-pin", "admin-root", "DEFAULT_CONFIG", "?admin=1", "595981234567", "wa.me/595"]:
    check(banned not in html, f"Sin rastro de '{banned}'", f"index.html aún contiene '{banned}'")

print("== 4. config.js: sintaxis y formato ==")
RE_PHONE = re.compile(r"^\d{8,15}$")
RE_REF = re.compile(r"^[a-z0-9][a-z0-9_-]{1,29}$")
cfg_path = ROOT / "config.js"
cfg = None
if cfg_path.exists():
    raw = cfg_path.read_text(encoding="utf-8")
    m = re.search(r"window\.SITE_CONFIG\s*=\s*(\{.*\});?\s*$", raw, re.S)
    check(bool(m), "Estructura window.SITE_CONFIG encontrada", "No se pudo localizar window.SITE_CONFIG = {...} en config.js")
    if m:
        body = m.group(1)
        body = re.sub(r"/\*.*?\*/", "", body, flags=re.S)   # comentarios de bloque
        body = re.sub(r"//[^\n]*", "", body)                # comentarios de línea
        try:
            cfg = json.loads(body)
            print("  ✓ config.js parsea como JSON")
        except Exception as e:
            errors.append(f"config.js no parsea tras quitar comentarios: {e}")
            print(f"  ✗ JSON inválido: {e}")

if cfg is not None:
    print("== 5. Contenido de la configuración ==")
    dp = re.sub(r"\D", "", str(cfg.get("defaultPhone") or ""))
    if RE_PHONE.match(dp or "x"):
        print("  ✓ defaultPhone tiene formato válido (8–15 dígitos)")
    else:
        warnings.append("defaultPhone está vacío o es inválido: PENDIENTE de completar por el propietario. La página mostrará el aviso hasta configurarlo.")
        print("  ⚠ defaultPhone vacío/inválido — pendiente del propietario")

    campaigns = cfg.get("campaigns") or {}
    ok = True
    for k, v in campaigns.items():
        phone = re.sub(r"\D", "", str(v))
        if not (RE_REF.match(k) and RE_PHONE.match(phone)):
            ok = False
            errors.append(f"Campaña inválida: '{k}' → '{v}'")
    if ok:
        print(f"  ✓ campaigns: {len(campaigns)} entrada(s) bien formadas")
    if not campaigns:
        warnings.append("campaigns está vacío (válido si solo usás defaultPhone o ?phone=).")
        print("  ⚠ campaigns vacío")

    exp = str(cfg.get("expiresAt") or "").strip()
    if not exp:
        print("  ✓ expiresAt vacío → el contador se oculta (sin urgencia falsa)")
    else:
        has_zone = bool(re.search(r"(Z|z|[+-]\d{2}:?\d{2})$", exp))
        import datetime
        try:
            norm = exp.replace("Z", "+00:00").replace("z", "+00:00")
            datetime.datetime.fromisoformat(norm)
            ok_exp = has_zone
        except ValueError:
            ok_exp = False
        check(ok_exp, "expiresAt válido y con huso horario", f"expiresAt '{exp}' inválido o sin huso horario (ISO 8601 con Z u offset).")

    url = str(cfg.get("siteUrl") or "").strip()
    if not url:
        print("  ✓ siteUrl vacío → no se generan canonical ni og:url (pendiente del propietario)")
    else:
        check(url.startswith("https://"), "siteUrl usa https", f"siteUrl '{url}' debe empezar con https://")

    if re.search(r"\d{8,15}", (ROOT / "assets" / "js" / "app.js").read_text(encoding="utf-8")):
        # que no haya números hardcodeados en la lógica (solo defaults de ejemplo en comentarios)
        hardcoded = re.findall(r'wa\.me/\d', (ROOT / "assets" / "js" / "app.js").read_text(encoding="utf-8"))
        check(not hardcoded, "Sin teléfonos hardcodeados en app.js", f"app.js contiene números fijos: {hardcoded}")

print("== 6. app.js: sin registro de teléfonos en consola ==")
js = (ROOT / "assets" / "js" / "app.js").read_text(encoding="utf-8") if (ROOT / "assets" / "js" / "app.js").exists() else ""
console_lines = [l for l in js.splitlines() if "console." in l]
pII_in_console = [l for l in console_lines if re.search(r"phone|wa\.me/", l)]
check(not pII_in_console, "Sin números en consola", f"app.js registra números en consola: {pII_in_console}")

print()
for w in warnings:
    print(f"ADVERTENCIA: {w}")
for e in errors:
    print(f"ERROR: {e}")
if errors:
    print(f"\nResultado: {len(errors)} error(es), {len(warnings)} advertencia(s) — FALLA")
    sys.exit(1)
print(f"\nResultado: OK ({len(warnings)} advertencia(s), ninguna bloqueante)")
sys.exit(0)
