import type { Request, Response } from "express";
import { env } from "../config/env.ts";
import { WhatsAppService } from "../services/whatsapp.service.ts";
import { AppointmentService } from "../services/appointment.service.ts";

/** Cuerpo crudo capturado por express.json (para validar la firma de Meta). */
type RawReq = Request & { rawBody?: Buffer };

export const WhatsAppController = {
  /**
   * Handshake de verificación (GET). Meta llama con hub.mode/verify_token/challenge
   * cuando guardas el webhook; hay que devolver el challenge si el token coincide.
   */
  verify(req: Request, res: Response) {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    if (
      mode === "subscribe" &&
      env.WHATSAPP_VERIFY_TOKEN &&
      token === env.WHATSAPP_VERIFY_TOKEN
    ) {
      return res.status(200).send(String(challenge ?? ""));
    }
    return res.sendStatus(403);
  },

  /** Recepción de eventos (POST): valida firma, responde 200 y procesa en background. */
  receive(req: Request, res: Response) {
    const signature = req.header("x-hub-signature-256");
    if (!WhatsAppService.verifySignature((req as RawReq).rawBody, signature)) {
      return res.sendStatus(401);
    }
    // Responder 200 cuanto antes: Meta reintenta si tarda o falla.
    res.sendStatus(200);
    WhatsAppController.process(req.body).catch((e) =>
      console.error("WhatsApp webhook error:", e),
    );
  },

  /** Recorre el payload de Meta y actúa sobre cada respuesta de botón. */
  async process(body: unknown): Promise<void> {
    const entries = (body as { entry?: unknown[] })?.entry ?? [];
    for (const entry of entries) {
      const changes = (entry as { changes?: unknown[] })?.changes ?? [];
      for (const change of changes) {
        const value = (change as { value?: { messages?: unknown[] } })?.value;
        for (const msg of value?.messages ?? []) {
          const m = msg as {
            from?: string;
            button?: { payload?: string };
            interactive?: { button_reply?: { id?: string } };
          };
          const payload = m.button?.payload ?? m.interactive?.button_reply?.id;
          if (payload && m.from) {
            await WhatsAppController.handleAction(String(payload), String(m.from));
          }
        }
      }
    }
  },

  /**
   * Los botones se envían con payload `ACCION:appointmentId`
   * (CONFIRM / CANCEL / RESCHEDULE). Aquí se resuelve la acción.
   */
  async handleAction(payload: string, from: string): Promise<void> {
    const [action, appointmentId] = payload.split(":");
    if (!appointmentId) return;

    if (action === "CANCEL") {
      await AppointmentService.cancel(appointmentId).catch(() => {});
      await WhatsAppService.sendText(
        from,
        "Tu cita fue cancelada. ¡Esperamos verte pronto en AB Hair Studio! 💈",
      );
    } else if (action === "CONFIRM") {
      await WhatsAppService.sendText(
        from,
        "¡Gracias! Tu cita quedó confirmada. Te esperamos. ✅",
      );
    } else if (action === "RESCHEDULE") {
      const link = `${env.APP_PUBLIC_URL}/booking`;
      await WhatsAppService.sendText(
        from,
        `Para reagendar tu cita entra aquí: ${link}`,
      );
    }
  },
};
