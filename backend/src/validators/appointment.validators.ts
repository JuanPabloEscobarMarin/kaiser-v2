import { z } from "zod";
import { isoDate } from "./common.ts";
import { customerSchema } from "./customer.validators.ts";


const baseAppointmentSchema = z.object({
  serviceId: z.string().uuid(),
  employeeId: z.string().uuid(),
  scheduledAt: isoDate,
});

export const bookAppointmentSchema = baseAppointmentSchema.extend({
  customer: customerSchema,
});

export const updateAppointmentSchema = z.object({
  serviceId: z.string().uuid().optional(),
  employeeId: z.string().uuid().optional(),
  scheduledAt: isoDate.optional(),
  state: z.enum(["SCHEDULED", "CANCELLED", "FINISHED"]).optional(),
});

export const listAppointmentsQuerySchema = z.object({
  from: isoDate.optional(),
  to: isoDate.optional(),
  state: z.enum(["SCHEDULED", "CANCELLED", "FINISHED"]).optional(),
});

export const availabilityQuerySchema = z.object({
  employeeId: z.string().uuid(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  serviceId: z.string().uuid(),
});

export type BookAppointmentInput = z.infer<typeof bookAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
export type AvailabilityQueryInput = z.infer<typeof availabilityQuerySchema>;
