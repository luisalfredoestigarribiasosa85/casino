/* ==========================================================================
   CONFIGURACIÓN PÚBLICA DEL SITIO
   ==========================================================================
   Este archivo es PÚBLICO (se sirve en el navegador). No pongas acá datos
   privados ni contraseñas: solo datos que pueden ver tus visitantes.

   👉 El PROPIETARIO debe completar los valores marcados con "PENDIENTE".
      Mientras estén vacíos, la página muestra un aviso de configuración
      incompleta y NO genera ningún enlace de WhatsApp.

   Formato de teléfonos: código de país + número, SOLO DÍGITOS.
   Sin "+", sin espacios, sin guiones. Ej.: "595981234567"
   ========================================================================== */
window.SITE_CONFIG = {

  /* PENDIENTE: número de WhatsApp por defecto (fallback), solo dígitos.
     Obligatorio para que el botón funcione. */
  "defaultPhone": "",

  /* Campañas: "codigo" (minúsculas, letras/números/guiones) → número.
     Los enlaces de los anuncios usan ?ref=codigo
     Ejemplo ilustrativo (reemplazá o borrá estas entradas):
       campana1: "595XXXXXXXXX",
       campana2: "595XXXXXXXXX" */
  "campaigns": {
  },

  /* Mensaje pre-cargado del chat de WhatsApp. Máx. 300 caracteres. */
  "message": "Hola, vengo de la campaña",

  /* Fecha/hora de vencimiento ABSOLUTA de la oferta, en formato ISO 8601
     CON huso horario. Ej.: "2026-12-31T23:59:59-03:00"
     • Vacío ("") → el contador NO se muestra (recomendado si la oferta
       no vence en una fecha fija).
     • Vencida → se muestra "La promoción venció" y se oculta el contador.
     • El contador apunta a ese instante fijo; no se reinicia cada día. */
  "expiresAt": "",

  /* PENDIENTE: URL pública del sitio cuando esté publicado, p. ej.
     "https://USUARIO.github.io/casino/". Se usa para canonical y og:url.
     Si está vacía, esos metadatos no se generan. No inventes un dominio. */
  "siteUrl": "",

  /* Teléfono a mostrar en la alternativa de contacto (se deriva solo si
     está vacío: se usa defaultPhone). No hace falta tocarlo. */
  "displayPhone": "",

  /* Analítica: DESACTIVADA por defecto.
     Si window.dataLayer existe (p. ej. con Google Tag Manager), cada clic
     en el botón de WhatsApp empuja un evento sin datos personales ni números:
       { event: "whatsapp_click", ref: "codigo-de-campana", source: "ref|phone|default" }
     Ningún script externo se carga desde este sitio; la integración se
     activa únicamente cuando el propietario la configura en su hosting. */
  "analytics": {
    "enabled": false
  }
};
