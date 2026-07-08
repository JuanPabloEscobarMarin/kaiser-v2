import { z } from "zod";

const decimalLike = z.union([z.string(), z.number()]).transform((v) => String(v));

export const createProductSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(300).optional().nullable(),
  price: decimalLike,
  // Costo de venta (compra + gastos). Utilidad = price - saleCost.
  saleCost: decimalLike.optional(),
  stock: z.number().int().min(0).optional().default(0),
  commission: decimalLike.optional(),
  urlImage: z.string().max(200).optional().nullable(),
  state: z.boolean().optional().default(true),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
