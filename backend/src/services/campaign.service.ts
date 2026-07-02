import { prisma } from "../lib/prisma.ts";
import { EmailService } from "./email.service.ts";
import { WhatsAppService } from "./whatsapp.service.ts";
import type { CreateCampaignInput } from "../validators/campaign.validators.ts";

type Segment = CreateCampaignInput["segment"];

interface CustomerLite {
  id: string;
  fullName: string;
  email: string | null;
  phone: string;
  birthDate: Date | null;
}

const INACTIVE_DEFAULT_DAYS = 60;

/** Resuelve los clientes que pertenecen a un segmento de campaña. */
async function resolveAudience(
  segment: Segment,
  segmentParam: string | null,
): Promise<CustomerLite[]> {
  if (segment === "ALL") {
    return prisma.customer.findMany();
  }

  if (segment === "BIRTHDAY_MONTH") {
    const month = new Date().getUTCMonth();
    const all = await prisma.customer.findMany({
      where: { birthDate: { not: null } },
    });
    return all.filter((c) => c.birthDate && c.birthDate.getUTCMonth() === month);
  }

  if (segment === "INACTIVE") {
    const days = Number(segmentParam) || INACTIVE_DEFAULT_DAYS;
    const cutoff = new Date(Date.now() - days * 86_400_000);
    const all = await prisma.customer.findMany({
      include: { bookings: { include: { appointment: true } } },
    });
    return all
      .filter((c) => {
        const times = c.bookings.map((b) => b.appointment.scheduledAt.getTime());
        if (times.length === 0) return true; // nunca ha vuelto
        return Math.max(...times) < cutoff.getTime();
      })
      .map(({ bookings: _b, ...c }) => c);
  }

  if (segment === "BY_SERVICE") {
    if (!segmentParam) return [];
    const bookings = await prisma.booking.findMany({
      where: { appointment: { serviceId: segmentParam } },
      include: { customer: true },
    });
    const map = new Map(bookings.map((b) => [b.customer.id, b.customer]));
    return Array.from(map.values());
  }

  return [];
}

export const CampaignService = {
  list: () => prisma.campaign.findMany({ orderBy: { createdAt: "desc" } }),

  async audiencePreview(segment: Segment, segmentParam: string | null) {
    const audience = await resolveAudience(segment, segmentParam);
    return {
      total: audience.length,
      withEmail: audience.filter((c) => c.email).length,
      withPhone: audience.filter((c) => c.phone).length,
    };
  },

  async createAndSend(input: CreateCampaignInput) {
    const segmentParam = input.segmentParam ?? null;
    const audience = await resolveAudience(input.segment, segmentParam);

    let emailsSent = 0;
    let whatsappSent = 0;

    if (input.channel === "EMAIL" || input.channel === "BOTH") {
      const html = `<div style="font-family:sans-serif;font-size:15px;line-height:1.5">${input.body.replace(/\n/g, "<br>")}</div>`;
      for (const c of audience) {
        if (!c.email) continue;
        try {
          const r = await EmailService.send({
            to: c.email,
            subject: input.title,
            html,
          });
          if (!r.skipped) emailsSent++;
        } catch {
          /* un fallo individual no aborta la campaña */
        }
      }
    }

    if (
      (input.channel === "WHATSAPP" || input.channel === "BOTH") &&
      WhatsAppService.isConfigured()
    ) {
      // Nota: el envío proactivo real requiere plantillas aprobadas por Meta.
      // sendText solo funciona dentro de la ventana de 24h; aquí es best-effort.
      for (const c of audience) {
        if (!c.phone) continue;
        try {
          await WhatsAppService.sendText(c.phone, `*${input.title}*\n\n${input.body}`);
          whatsappSent++;
        } catch {
          /* noop */
        }
      }
    }

    const campaign = await prisma.campaign.create({
      data: {
        title: input.title,
        body: input.body,
        channel: input.channel,
        segment: input.segment,
        segmentParam,
        status: "SENT",
        recipientCount: audience.length,
        sentAt: new Date(),
      },
    });

    return {
      campaign,
      audienceCount: audience.length,
      emailsSent,
      whatsappSent,
      emailConfigured: EmailService.isConfigured(),
    };
  },
};
