import { z } from "zod";

const timeHHMM = z
  .string()
  .regex(/^\d{2}:\d{2}$/, "Formato de hora inválido (usa HH:MM)");

export const createBlockSchema = z
  .object({
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe ser YYYY-MM-DD")
      .optional()
      .nullable(),
    dayOfWeek: z.number().int().min(0).max(6).optional().nullable(),
    startTime: timeHHMM,
    endTime: timeHHMM,
    isFullDay: z.boolean().optional().default(false),
    reason: z.string().max(200).optional().nullable(),
  })
  .refine((d) => d.date != null || d.dayOfWeek != null, {
    message: "Debe especificar una fecha puntual o un día de semana recurrente",
  });

export type CreateBlockInput = z.infer<typeof createBlockSchema>;
