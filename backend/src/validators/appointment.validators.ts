import { z } from "zod";
import { isoDate } from "./common.ts";
import { customerSchema } from "./customer.validators.ts";

const decimalLike = z.union([z.string(), z.number()]).transform((v) => String(v));

const baseAppointmentSchema = z.object({
  // Una cita puede tener 1 servicio (serviceId), varios (serviceIds) o venir de
  // un combo (packageId). Al menos uno debe indicarse (ver refine abajo).
  serviceId: z.string().uuid().optional(),
  serviceIds: z.array(z.string().uuid()).optional(),
  packageId: z.string().uuid().optional(),
  employeeId: z.string().uuid(),
  scheduledAt: isoDate,
  // Observación interna que escribe el admin (opcional).
  notes: z.string().max(500).optional(),
});

const hasSomeService = (d: {
  serviceId?: string | undefined;
  serviceIds?: string[] | undefined;
  packageId?: string | undefined;
}) => Boolean(d.serviceId || (d.serviceIds && d.serviceIds.length) || d.packageId);

export const bookAppointmentSchema = baseAppointmentSchema
  .extend({ customer: customerSchema })
  .refine(hasSomeService, {
    message: "Debes indicar al menos un servicio o un combo",
  });

export const updateAppointmentSchema = z.object({
  serviceId: z.string().uuid().optional(),
  employeeId: z.string().uuid().optional(),
  scheduledAt: isoDate.optional(),
  state: z.enum(["SCHEDULED", "CANCELLED", "FINISHED"]).optional(),
  // Precio real cobrado (servicios de precio variable). null lo limpia.
  finalPrice: decimalLike.nullable().optional(),
  notes: z.string().max(500).optional(),
});

export const listAppointmentsQuerySchema = z.object({
  from: isoDate.optional(),
  to: isoDate.optional(),
  state: z.enum(["SCHEDULED", "CANCELLED", "FINISHED"]).optional(),
});

export const availabilityQuerySchema = z
  .object({
    employeeId: z.string().uuid(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe ser AAAA-MM-DD"),
    serviceId: z.string().uuid().optional(),
    // uuids separados por coma, para pedir disponibilidad de varios servicios.
    serviceIds: z.string().optional(),
    packageId: z.string().uuid().optional(),
  })
  .refine((d) => Boolean(d.serviceId || d.serviceIds || d.packageId), {
    message: "Indica un servicio, varios servicios o un combo",
  });

export type BookAppointmentInput = z.infer<typeof bookAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
export type AvailabilityQueryInput = z.infer<typeof availabilityQuerySchema>;
