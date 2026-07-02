import { z } from "zod";

const decimalLike = z.union([z.string(), z.number()]).transform((v) => String(v));

export const createPackageSchema = z.object({
  name: z.string().min(1).max(100),
  price: decimalLike,
  description: z.string().max(300).optional().nullable(),
  urlImage: z.string().max(200).optional().nullable(),
  state: z.boolean().optional().default(true),
  serviceIds: z
    .array(z.string().uuid())
    .min(1, "Un combo debe incluir al menos un servicio"),
});

export const updatePackageSchema = createPackageSchema.partial();

export type CreatePackageInput = z.infer<typeof createPackageSchema>;
export type UpdatePackageInput = z.infer<typeof updatePackageSchema>;
