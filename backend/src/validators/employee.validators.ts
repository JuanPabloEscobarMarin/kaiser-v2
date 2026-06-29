import { z } from "zod";

const decimalLike = z.union([z.string(), z.number()]).transform((v) => String(v));

const serviceAssignmentSchema = z.object({
  serviceId: z.string().uuid(),
  commission: z.number().min(0).max(100).optional().default(0),
});

export const createEmployeeSchema = z.object({
  fullName: z.string().min(1).max(100),
  phone: z.string().min(7).max(20),
  state: z.boolean().optional().default(true),
  salary: decimalLike.optional().default("0"),
  urlImage: z.string().max(200).nullable().optional(),
  services: z.array(serviceAssignmentSchema).optional().default([]),
});

export const updateEmployeeSchema = createEmployeeSchema.partial();

export type ServiceAssignment = z.infer<typeof serviceAssignmentSchema>;
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
