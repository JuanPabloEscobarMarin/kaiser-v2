import { z } from "zod";

const decimalLike = z.union([z.string(), z.number()]).transform((v) => String(v));

export const createDeductionSchema = z.object({
  employeeId: z.string().uuid(),
  type: z.enum(["ADVANCE", "PRODUCT", "OTHER"]).optional().default("ADVANCE"),
  amount: decimalLike,
  note: z.string().max(300).optional().nullable(),
});

// employeeId opcional: sin él se listan las de todos los empleados (informe
// económico global). from/to acotan por fecha de registro (YYYY-MM-DD).
export const listDeductionsQuerySchema = z.object({
  employeeId: z.string().uuid().optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type CreateDeductionInput = z.infer<typeof createDeductionSchema>;
export type ListDeductionsQuery = z.infer<typeof listDeductionsQuerySchema>;
