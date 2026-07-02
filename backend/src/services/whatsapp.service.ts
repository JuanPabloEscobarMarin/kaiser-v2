import crypto from "node:crypto";
import { env } from "../config/env.ts";

/**
 * Integración con la WhatsApp Cloud API (Meta). Todo es opcional: si faltan las
 * credenciales, `isConfigured()` es false y los envíos se omiten silenciosamente
 * (el webhook de verificación sigue funcionando solo con WHATSAPP_VERIFY_TOKEN).
 */
export const WhatsAppService = {
  /** ¿Hay credenciales para ENVIAR mensajes salientes? */
  isConfigured: () =>
    Boolean(env.WHATSAPP_ACCESS_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID),

  /**
   * Valida la firma `X-Hub-Signature-256` que Meta adjunta a cada webhook,
   * usando el App Secret. Si no hay App Secret configurado, no se puede validar
   * y se rechaza por seguridad (salvo que tampoco haya secret → modo abierto dev).
   */
  verifySignature(rawBody: Buffer | undefined, signature: string | undefined): boolean {
    // Sin App Secret no podemos verificar: lo permitimos (útil para los webhooks
    // de prueba del panel de Meta antes de tener el secret en producción).
    if (!env.WHATSAPP_APP_SECRET) return true;
    if (!rawBody || !signature) return false;
    const expected =
      "sha256=" +
      crypto.createHmac("sha256", env.WHATSAPP_APP_SECRET).update(rawBody).digest("hex");
    try {
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
      return false;
    }
  },

  /** Envía un mensaje de texto libre (válido dentro de la ventana de 24h). */
  async sendText(to: string, body: string): Promise<void> {
    if (!this.isConfigured()) return;
    const url = `https://graph.facebook.com/${env.WHATSAPP_API_VERSION}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body },
      }),
    });
    if (!res.ok) {
      console.error("WhatsApp sendText falló:", res.status, await res.text());
    }
  },
};
