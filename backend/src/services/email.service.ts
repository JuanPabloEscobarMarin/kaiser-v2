import { env } from "../config/env.ts";

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
    if (!EmailService.isConfigured()) {
      if (env.NODE_ENV !== "production") {
        console.log(
          `[email:noop] to=${params.to} subject="${params.subject}"`,
        );
      }
      return { skipped: true };
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
