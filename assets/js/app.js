/* ==========================================================================
   casino — Lógica de la landing
   ==========================================================================
   • Lee la config PÚBLICA desde window.SITE_CONFIG (config.js).
   • ?ref=codigo  → usa campaigns[codigo]   (entrada NO confiable)
   • ?phone=...   → usa ese número          (entrada NO confiable, validada)
   • Si la config o los parámetros no son válidos, NO se genera ningún
     enlace de WhatsApp: se muestra un aviso en su lugar.
   • Sin datos personales en consola ni en analítica.
   ========================================================================== */
"use strict";

(function () {

  /* ========== Validadores ========== */
  var RE_PHONE = /^\d{8,15}$/;
  var RE_REF   = /^[a-z0-9][a-z0-9_-]{1,29}$/;
  var RE_URL   = /^https:\/\/[A-Za-z0-9.-]+(?::\d{2,5})?(?:\/[^\s]*)?$/;
  var MAX_MSG  = 300;

  /* ========== Normalización de la config ========== */
  function normalizeConfig(raw) {
    var cfg = (raw && typeof raw === "object") ? raw : {};
    var out = {
      defaultPhone: "",
      campaigns:    {},
      message:      "Hola, vengo de la campaña",
      expiresAt:    "",
      siteUrl:      "",
      displayPhone: "",
      analytics:    { enabled: false }
    };

    var dp = String(cfg.defaultPhone || "").replace(/\D/g, "");
    if (RE_PHONE.test(dp)) out.defaultPhone = dp;

    var camps = (cfg.campaigns && typeof cfg.campaigns === "object") ? cfg.campaigns : {};
    for (var key in camps) {
      if (!Object.prototype.hasOwnProperty.call(camps, key)) continue;
      var code  = String(key).trim().toLowerCase();
      var phone = String(camps[key] == null ? "" : camps[key]).replace(/\D/g, "");
      if (RE_REF.test(code) && RE_PHONE.test(phone)) out.campaigns[code] = phone;
    }

    if (typeof cfg.message === "string") {
      var msg = cfg.message.replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, MAX_MSG);
      if (msg) out.message = msg;
    }

    if (typeof cfg.expiresAt === "string" && cfg.expiresAt.trim()) {
      var raw_exp = cfg.expiresAt.trim();
      var hasZone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(raw_exp);
      var t = Date.parse(raw_exp);
      if (hasZone && !isNaN(t)) out.expiresAt = raw_exp;
    }

    if (typeof cfg.siteUrl === "string" && RE_URL.test(cfg.siteUrl.trim())) {
      out.siteUrl = cfg.siteUrl.trim().replace(/\/+$/, "") + "/";
    }

    var disp = String(cfg.displayPhone || "").replace(/\D/g, "");
    out.displayPhone = RE_PHONE.test(disp) ? disp : out.defaultPhone;

    out.analytics.enabled = !!(cfg.analytics && cfg.analytics.enabled === true);
    return out;
  }

  var config = normalizeConfig(window.SITE_CONFIG);

  /* ========== Resolución del contacto (?ref / ?phone) ========== */
  function resolveCampaign() {
    var params = new URLSearchParams(window.location.search);
    var refRaw = (params.get("ref") || "").trim().toLowerCase();
    var phoneRaw = (params.get("phone") || "").replace(/\D/g, "");

    // 1) phone directo válido
    if (RE_PHONE.test(phoneRaw)) {
      return { ok: true, phone: phoneRaw, ref: "", source: "phone" };
    }
    // 2) ref conocido
    if (RE_REF.test(refRaw) && Object.prototype.hasOwnProperty.call(config.campaigns, refRaw)) {
      return { ok: true, phone: config.campaigns[refRaw], ref: refRaw, source: "ref" };
    }
    // 3) fallback al número por defecto
    if (config.defaultPhone) {
      return { ok: true, phone: config.defaultPhone, ref: "", source: "default" };
    }
    return { ok: false, phone: "", ref: "", source: "unconfigured" };
  }

  function waUrl(phone) {
    return "https://wa.me/" + phone + "?text=" + encodeURIComponent(config.message);
  }

  var $ = function (id) { return document.getElementById(id); };
  var state = resolveCampaign();

  /* ========== Render del CTA / estado de error ========== */
  function render() {
    var ctaWrap     = $("cta-wrap");
    var altContact  = $("alt-contact");
    var configError = $("config-error");
    var cta         = $("cta-whatsapp");

    if (!state.ok) {
      if (ctaWrap) ctaWrap.hidden = true;
      if (altContact) altContact.hidden = true;
      if (configError) {
        configError.hidden = false;
        configError.setAttribute("role", "alert");
      }
      return;
    }

    // Enlace de WhatsApp válido
    if (cta) {
      cta.href = waUrl(state.phone);
      cta.dataset.campaignSource = state.source;
      cta.dataset.campaignRef = state.ref;
    }

    // Alternativa de contacto: mostrar número e interfaz de copiado
    if (altContact) {
      altContact.hidden = false;
      var dispEl = $("alt-number");
      if (dispEl) {
        var pretty = "+" + state.phone;
        dispEl.textContent = pretty;
        dispEl.href = "tel:+" + state.phone;
      }
    }

    if (configError) configError.hidden = true;
  }

  /* ========== Countdown (solo con vencimiento absoluto configurado) ========== */
  function pad(n) { return String(n).padStart(2, "0"); }

  // Fecha límite "31 de diciembre de 2026 · 23:59 UTC−3" a partir del ISO configurado
  function deadlineText(iso) {
    var m = iso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2})?(?:[.,]\d+)?([zZ]|[+-]\d{2}:?\d{2})$/);
    if (!m) return iso;
    var months = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
    var zone = m[6];
    var zoneTxt = (zone === "Z" || zone === "z") ? "UTC" :
      "UTC" + zone.replace(":", "").replace(/([+-])(\d{2})(\d{2})$/, "$1$2:$3");
    return Number(m[3]) + " de " + months[Number(m[2]) - 1] + " de " + m[1] +
           " · " + m[4] + ":" + m[5] + " " + zoneTxt;
  }

  function initCountdown() {
    var root = $("countdown");
    if (!root) return;

    if (!config.expiresAt) { root.hidden = true; return; } // sin vencimiento → sin urgencia falsa

    var endTs = Date.parse(config.expiresAt);
    var cells = $("countdown-cells");
    var expiredMsg = $("countdown-expired");
    var label = $("countdown-label");
    var deadlineEl = $("countdown-deadline");
    var badge = $("hero-badge");

    if (isNaN(endTs)) { root.hidden = true; return; }

    root.hidden = false;
    if (deadlineEl) deadlineEl.textContent = "La oferta finaliza el " + deadlineText(config.expiresAt);

    function renderExpired() {
      if (cells) cells.hidden = true;
      if (label) label.hidden = true;
      if (expiredMsg) expiredMsg.hidden = false;
      if (badge) badge.textContent = "Promoción finalizada";
      root.setAttribute("aria-label", "La promoción venció");
    }

    function tick() {
      var diff = endTs - Date.now();
      if (diff <= 0) { renderExpired(); clearInterval(timer); return; }
      var h = Math.floor(diff / 3600000),
          m = Math.floor((diff % 3600000) / 60000),
          s = Math.floor((diff % 60000) / 1000);
      $("cd-h").textContent = pad(h);
      $("cd-m").textContent = pad(m);
      $("cd-s").textContent = pad(s);
    }

    var timer = setInterval(tick, 1000);
    tick();
  }

  /* ========== Copiar número (alternativa si WhatsApp no abre) ========== */
  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.cssText = "position:fixed;top:0;left:0;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) { /* noop */ }
    document.body.removeChild(ta);
  }

  function initCopyButton() {
    var btn = $("copy-number");
    var toast = $("toast");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var digits = config.displayPhone || state.phone;
      var text = "+" + digits;
      var done = function () {
        if (toast) {
          toast.textContent = "Número copiado ✓";
          toast.classList.add("toast--show");
          setTimeout(function () { toast.classList.remove("toast--show"); }, 2400);
        }
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
      } else {
        fallbackCopy(text);
        done();
      }
    });
  }

  /* ========== Medición: clic en WhatsApp (sin datos personales) ========== */
  function initAnalytics() {
    var cta = $("cta-whatsapp");
    if (!cta) return;
    cta.addEventListener("click", function () {
      var detail = {
        event: "whatsapp_click",
        ref: state.ref || "",      // código de campaña (no es un dato personal)
        source: state.source       // "ref" | "phone" | "default"
      };
      // Integración opcional: solo si el sitio ya usa dataLayer (p. ej. GTM)
      // y el propietario habilitó analytics.enabled. Nunca incluye el número.
      if (config.analytics.enabled && Array.isArray(window.dataLayer)) {
        window.dataLayer.push(detail);
      }
      // Evento siempre disponible para herramientas locales/QA
      try {
        window.dispatchEvent(new CustomEvent("whatsapp-click", { detail: detail }));
      } catch (e) { /* CustomEvent no disponible: ignorar */ }
    });
  }

  /* ========== Canonical / og:url solo con siteUrl configurada ========== */
  function initSeoLinks() {
    if (!config.siteUrl) return;
    var canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.href = config.siteUrl;
    } else {
      var link = document.createElement("link");
      link.rel = "canonical";
      link.href = config.siteUrl;
      document.head.appendChild(link);
    }
    var ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) {
      ogUrl.setAttribute("content", config.siteUrl);
    } else {
      var meta = document.createElement("meta");
      meta.setAttribute("property", "og:url");
      meta.setAttribute("content", config.siteUrl);
      document.head.appendChild(meta);
    }
  }

  render();
  initCountdown();
  initCopyButton();
  initAnalytics();
  initSeoLinks();
})();
