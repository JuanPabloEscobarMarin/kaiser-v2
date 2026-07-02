import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(1).max(60),
  order: z.coerce.number().int().min(0).optional().default(0),
  state: z.boolean().optional().default(true),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
