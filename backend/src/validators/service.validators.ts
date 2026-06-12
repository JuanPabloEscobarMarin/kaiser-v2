import { z } from "zod";

const decimalLike = z.union([z.string(), z.number()]).transform((v) => String(v));

export const createServiceSchema = z.object({
  name: z.string().min(1).max(100),
  price: decimalLike,
  duration: z.coerce.number().int().positive(),
  state: z.boolean().optional().default(true),
  discount: decimalLike.optional().default("0"),
  urlImage: z.string().optional(),
  description: z.string().optional(),
});

export const updateServiceSchema = createServiceSchema.partial();

export const deleteManySchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
