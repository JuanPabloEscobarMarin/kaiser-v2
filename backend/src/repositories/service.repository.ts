import { prisma } from "../lib/prisma.ts";
import type { Prisma } from "../../generated/prisma/client.ts";
import type { CreateServiceInput, UpdateServiceInput } from "../validators/service.validators.ts";

/**
 * Elimina claves con valor undefined: zod marca opcionales como
 * `string | undefined`, pero Prisma (con exactOptionalPropertyTypes) exige
 * que la clave simplemente no esté. El cast posterior es estrecho y queda
 * verificado contra los tipos generados de Prisma, no contra `any`.
 */
const compact = (obj: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

export const ServiceRepository = {
  all: (includeInactive = false) =>
    prisma.service.findMany({
      where: includeInactive ? {} : { state: true },
      orderBy: { createdAt: "desc" },
    }),

  byId: (id: string) => prisma.service.findUnique({ where: { id } }),

  create: (data: CreateServiceInput) =>
    prisma.service.create({ data: compact(data) as Prisma.ServiceCreateInput }),

  update: (id: string, data: UpdateServiceInput) =>
    prisma.service.update({ where: { id }, data: compact(data) as Prisma.ServiceUpdateInput }),

  delete: (id: string) => prisma.service.delete({ where: { id } }),

  deleteMany: (ids: string[]) =>
    prisma.service.deleteMany({ where: { id: { in: ids } } }),

  searchByTokens: (tokens: string[]) =>
    prisma.service.findMany({
      where: {
        state: true,
        OR: tokens.map((t) => ({
          name: { contains: t, mode: "insensitive" as const },
        })),
      },
    }),
};
