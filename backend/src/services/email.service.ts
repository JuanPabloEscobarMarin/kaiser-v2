import { env } from "../config/env.ts";
import { BadRequestException } from "../exceptions/HttpException.ts";

/**
 * Envío de correo vía Resend (HTTP API, sin SDK). Si RESEND_API_KEY no está
 * configurado, el envío es un no-op silencioso (la app funciona igual) — mismo
 * patrón que la integración de WhatsApp.
 */
export const EmailService = {
  isConfigured: () => Boolean(env.RESEND_API_KEY),

  async send(params: {
    to: string;
    subject: string;
    html?: string;
    text?: string;
  }): Promise<{ skipped: boolean }> {
    // Validación: Verificar que el correo destinatario esté presente y no sea una cadena vacía o espacios.
    if (!params.to || params.to.trim().length === 0) {
      throw new BadRequestException("El correo electrónico del destinatario es obligatorio");
    }

    // Validación: Verificar que el formato del correo destinatario sea válido antes de llamar a la API externa.
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanTo = params.to.trim().toLowerCase();
    if (!emailRegex.test(cleanTo)) {
      throw new BadRequestException("El formato del correo destinatario no es válido");
    }

    // Validación: Verificar que el asunto del correo no esté vacío ni compuesto solo por espacios.
    if (!params.subject || params.subject.trim().length === 0) {
      throw new BadRequestException("El asunto del correo no puede estar vacío");
    }

    // Validación: Asegurar que se proporcione al menos un cuerpo de contenido (HTML o texto plano).
    const hasHtml = Boolean(params.html && params.html.trim().length > 0);
    const hasText = Boolean(params.text && params.text.trim().length > 0);
    if (!hasHtml && !hasText) {
      throw new BadRequestException("Debes proporcionar al menos el contenido HTML o texto del correo");
    }

    if (!EmailService.isConfigured()) {
      if (env.NODE_ENV !== "production") {
        console.log(
          `[email:noop] to=${params.to} subject="${params.subject}"`,
        );
      }
      return { skipped: true };
    }

    // Validación: Verificar que el remitente (RESEND_FROM) esté configurado en el entorno si la API key está activa.
    if (!env.RESEND_FROM || env.RESEND_FROM.trim().length === 0) {
      throw new Error("RESEND_FROM no está configurado en las variables de entorno");
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.RESEND_FROM,
        to: params.to,
        subject: params.subject,
        ...(params.html ? { html: params.html } : {}),
        ...(params.text ? { text: params.text } : {}),
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Resend error ${res.status}: ${body.slice(0, 200)}`);
    }
    return { skipped: false };
  },
};
