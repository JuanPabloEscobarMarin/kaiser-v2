import { z } from "zod";

const decimalLike = z.union([z.string(), z.number()]).transform((v) => String(v));

export const createDeductionSchema = z.object({
  employeeId: z.string().uuid(),
  type: z.enum(["ADVANCE", "PRODUCT", "OTHER"]).optional().default("ADVANCE"),
  amount: decimalLike,
  note: z.string().max(300).optional().nullable(),
});

export const listDeductionsQuerySchema = z.object({
  employeeId: z.string().uuid(),
});

export type CreateDeductionInput = z.infer<typeof createDeductionSchema>;
