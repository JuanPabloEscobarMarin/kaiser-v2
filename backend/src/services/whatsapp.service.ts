import { env } from "../config/env.ts";

/**
 * Los teléfonos de clientes se guardan sin indicativo (celular colombiano de
 * 10 dígitos); Twilio exige el formato E.164 completo con prefijo "whatsapp:".
 */
const toWhatsAppAddress = (phone: string): string => {
  const digits = phone.replace(/\D/g, "");
  const withCountryCode = digits.length === 10 ? `57${digits}` : digits;
  return `whatsapp:+${withCountryCode}`;
};

/**
 * Envío de WhatsApp vía Twilio (HTTP API, sin SDK). Si faltan credenciales, el
 * envío es un no-op silencioso — mismo patrón que email.service.ts.
 */
export const WhatsAppService = {
  isConfigured: () =>
    Boolean(
      env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_WHATSAPP_FROM,
    ),

  async sendText(to: string, body: string): Promise<void> {
    if (!this.isConfigured()) return;

    const auth = Buffer.from(
      `${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`,
    ).toString("base64");
    const params = new URLSearchParams({
      To: toWhatsAppAddress(to),
      From: env.TWILIO_WHATSAPP_FROM,
      Body: body,
    });

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
      },
    );
    if (!res.ok) {
      console.error("WhatsApp (Twilio) sendText falló:", res.status, await res.text());
    }
  },
};
