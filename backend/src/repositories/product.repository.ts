import { prisma } from "../lib/prisma.ts";
import type { CreateProductInput, UpdateProductInput } from "../validators/product.validators.ts";

export const ProductRepository = {
  all: () =>
    prisma.product.findMany({ orderBy: { createdAt: "desc" } }),

  byId: (id: string) =>
    prisma.product.findUnique({ where: { id } }),

  byIds: (ids: string[]) =>
    prisma.product.findMany({ where: { id: { in: ids } } }),

  create: (data: CreateProductInput) =>
    prisma.product.create({ data: data as any }),

  update: (id: string, data: UpdateProductInput) =>
    prisma.product.update({ where: { id }, data: data as any }),

  delete: (id: string) =>
    prisma.product.delete({ where: { id } }),
};
