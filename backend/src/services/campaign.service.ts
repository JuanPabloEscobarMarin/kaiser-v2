import { prisma } from "../lib/prisma.ts";
import { EmailService } from "./email.service.ts";
import { WhatsAppService } from "./whatsapp.service.ts";
import type { CreateCampaignInput } from "../validators/campaign.validators.ts";
import {
  BadRequestException,
  NotFoundException,
} from "../exceptions/HttpException.ts";

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

    return prisma.customer.findMany({
      where: {
        bookings: {
          none: {
            appointment: {
              scheduledAt: {
                gte: cutoff,
              },
            },
          },
        },
      },
    });
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

    if (segment === "BY_SERVICE" && (!segmentParam || segmentParam.trim().length === 0)) {
      throw new BadRequestException("Debes especificar el ID del servicio para este segmento");
    }

    if (segment === "INACTIVE" && segmentParam !== null) {
      const days = Number(segmentParam);
      if (isNaN(days) || days <= 0 || !Number.isInteger(days)) {
        throw new BadRequestException("Los días de inactividad deben ser un número entero positivo");
      }
    }

    const audience = await resolveAudience(segment, segmentParam);

    return {
      total: audience.length,
      withEmail: audience.filter((c) => c.email).length,
      withPhone: audience.filter((c) => c.phone).length,
    };
  },

  async createAndSend(input: CreateCampaignInput) {
    // Validación: El título y el cuerpo del mensaje no pueden estar vacíos ni formados únicamente por espacios.
    // Error lanzado: BadRequestException (400)
    if (!input.title || input.title.trim().length === 0) {
      throw new BadRequestException("El título de la campaña es obligatorio");
    }
    if (!input.body || input.body.trim().length === 0) {
      throw new BadRequestException("El mensaje de la campaña es obligatorio");
    }

    // Validación: Si el canal exige WhatsApp o Email, verificar que el proveedor correspondiente esté configurado en el sistema.
    // Error lanzado: BadRequestException (400)
    if ((input.channel === "EMAIL" || input.channel === "BOTH") && !EmailService.isConfigured()) {
      throw new BadRequestException("El servicio de correo electrónico no está configurado");
    }
    if (input.channel === "WHATSAPP" && !WhatsAppService.isConfigured()) {
      throw new BadRequestException("El servicio de WhatsApp no está configurado");
    }

    // Validación: Verificar que el servicio exista en base de datos si el segmento es BY_SERVICE.
    // Error lanzado: NotFoundException (404) o BadRequestException (400)
    if (input.segment === "BY_SERVICE") {
      if (!input.segmentParam || input.segmentParam.trim().length === 0) {
        throw new BadRequestException("Debes especificar el ID del servicio para este segmento");
      }
      const serviceExists = await prisma.service.findUnique({
        where: { id: input.segmentParam },
      });
      if (!serviceExists) {
        throw new NotFoundException("El servicio seleccionado para el segmento no existe");
      }
    }

    // Validación: Días de inactividad válidos si el segmento es INACTIVE.
    // Error lanzado: BadRequestException (400)
    if (input.segment === "INACTIVE" && input.segmentParam) {
      const days = Number(input.segmentParam);
      if (isNaN(days) || days <= 0 || !Number.isInteger(days)) {
        throw new BadRequestException("Los días de inactividad deben ser un número entero positivo");
      }
    }
    const segmentParam = input.segmentParam ?? null;
    const audience = await resolveAudience(input.segment, segmentParam);

    // Validación: Evitar registrar y procesar campañas cuya audiencia resultante sea 0 destinatarios.
    // Error lanzado: BadRequestException (400)
    if (audience.length === 0) {
      throw new BadRequestException("No se encontraron clientes para el segmento y filtros seleccionados");
    }

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
