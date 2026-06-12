import { z } from "zod";

const decimalLike = z.union([z.string(), z.number()]).transform((v) => String(v));

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
});

export const createItemSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(300).optional().nullable(),
  quantity: decimalLike.optional().default("0"),
  unit: z.string().min(1).max(30).optional().default("unidad"),
  minStock: decimalLike.optional().default("0"),
  cost: decimalLike.optional().default("0"),
  categoryId: z.string().uuid().optional().nullable(),
});

export const updateItemSchema = createItemSchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
