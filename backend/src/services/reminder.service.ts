import { prisma } from "../lib/prisma.ts";
import { EmailService } from "./email.service.ts";
import { WhatsAppService } from "./whatsapp.service.ts";
import { formatWallClock, wallClockNow } from "../lib/business-hours.ts";
import { env } from "../config/env.ts";

/** Ventana de anticipación del recordatorio (horas antes de la cita). */
const LOOKAHEAD_HOURS = 24;

const markSent = (id: string) =>
  prisma.appointment.update({
    where: { id },
    data: { reminderSentAt: new Date() },
  });

export const ReminderService = {
  /**
   * Envía recordatorios de las citas AGENDADAS que ocurren dentro de las
   * próximas LOOKAHEAD_HOURS y que aún no se han recordado. Idempotente:
   * marca `reminderSentAt` para no reenviar.
   */
  async runDueReminders() {
    // Reloj de pared del negocio, no new Date(): scheduledAt está en la
    // convención fake-UTC (ver lib/business-hours.ts).
    const now = wallClockNow(env.BUSINESS_TIMEZONE);
    const until = new Date(now.getTime() + LOOKAHEAD_HOURS * 3_600_000);

    const appts = await prisma.appointment.findMany({
      where: {
        state: "SCHEDULED",
        reminderSentAt: null,
        scheduledAt: { gte: now, lte: until },
      },
      include: {
        service: true,
        employee: true,
        booking: { include: { customer: true } },
      },
    });

    let emailsSent = 0;
    let whatsappSent = 0;

    for (const a of appts) {
      const customer = a.booking?.customer;
      if (!customer) {
        await markSent(a.id);
        continue;
      }

      const msg = `Hola ${customer.fullName}, te recordamos tu cita de ${a.service?.name ?? "servicio"} el ${formatWallClock(a.scheduledAt)} con ${a.employee?.fullName ?? "nuestro equipo"}. ¡Te esperamos!`;

      if (customer.email) {
        try {
          const r = await EmailService.send({
            to: customer.email,
            subject: "Recordatorio de tu cita",
            html: `<div style="font-family:sans-serif;font-size:15px">${msg}</div>`,
          });
          if (!r.skipped) emailsSent++;
        } catch {
          /* un fallo individual no aborta el lote */
        }
      }

      if (customer.phone && WhatsAppService.isConfigured()) {
        try {
          await WhatsAppService.sendText(customer.phone, msg);
          whatsappSent++;
        } catch {
          /* noop (proactivo real requiere plantilla aprobada) */
        }
      }

      await markSent(a.id);
    }

    return {
      processed: appts.length,
      emailsSent,
      whatsappSent,
      emailConfigured: EmailService.isConfigured(),
    };
  },
};
