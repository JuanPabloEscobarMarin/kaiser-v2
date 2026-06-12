import { prisma } from "../lib/prisma.ts";
import type { CreateServiceInput, UpdateServiceInput } from "../validators/service.validators.ts";

export const ServiceRepository = {
  all: () => prisma.service.findMany({ orderBy: { createdAt: "desc" } }),

  byId: (id: string) => prisma.service.findUnique({ where: { id } }),

  create: (data: CreateServiceInput) =>
    prisma.service.create({ data: data as any }),

  update: (id: string, data: UpdateServiceInput) =>
    prisma.service.update({ where: { id }, data: data as any }),

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
