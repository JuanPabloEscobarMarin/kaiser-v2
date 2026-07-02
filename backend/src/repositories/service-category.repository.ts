import { prisma } from "../lib/prisma.ts";
import type { Prisma } from "../../generated/prisma/client.ts";
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "../validators/service-category.validators.ts";

const compact = (obj: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

export const ServiceCategoryRepository = {
  all: (includeInactive = false) =>
    prisma.serviceCategory.findMany({
      where: includeInactive ? {} : { state: true },
      orderBy: [{ order: "asc" }, { name: "asc" }],
    }),

  byId: (id: string) => prisma.serviceCategory.findUnique({ where: { id } }),

  create: (data: CreateCategoryInput) =>
    prisma.serviceCategory.create({
      data: compact(data) as Prisma.ServiceCategoryCreateInput,
    }),

  update: (id: string, data: UpdateCategoryInput) =>
    prisma.serviceCategory.update({
      where: { id },
      data: compact(data) as Prisma.ServiceCategoryUpdateInput,
    }),

  // Al borrar una categoría, desvincula sus servicios (categoryId → null) para
  // no romper la FK; los servicios quedan como "sin categoría".
  delete: async (id: string) => {
    await prisma.service.updateMany({
      where: { categoryId: id },
      data: { categoryId: null },
    });
    return prisma.serviceCategory.delete({ where: { id } });
  },
};
