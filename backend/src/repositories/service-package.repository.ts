import { prisma } from "../lib/prisma.ts";
import type { Prisma } from "../../generated/prisma/client.ts";
import type {
  CreatePackageInput,
  UpdatePackageInput,
} from "../validators/service-package.validators.ts";

const compact = (obj: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

const withItems = {
  items: {
    include: {
      service: {
        select: { id: true, name: true, price: true, duration: true },
      },
    },
  },
} as const;

export const ServicePackageRepository = {
  all: (includeInactive = false) =>
    prisma.servicePackage.findMany({
      where: includeInactive ? {} : { state: true },
      orderBy: { createdAt: "desc" },
      include: withItems,
    }),

  byId: (id: string) =>
    prisma.servicePackage.findUnique({ where: { id }, include: withItems }),

  create: (data: CreatePackageInput) => {
    const { serviceIds, ...rest } = data;
    return prisma.servicePackage.create({
      data: {
        ...compact(rest),
        items: { create: serviceIds.map((serviceId) => ({ serviceId })) },
      } as Prisma.ServicePackageCreateInput,
      include: withItems,
    });
  },

  update: (id: string, data: UpdatePackageInput) => {
    const { serviceIds, ...rest } = data;
    return prisma.servicePackage.update({
      where: { id },
      data: {
        ...compact(rest),
        // Reemplaza la lista de servicios del combo cuando se envía.
        ...(serviceIds
          ? {
              items: {
                deleteMany: {},
                create: serviceIds.map((serviceId) => ({ serviceId })),
              },
            }
          : {}),
      } as Prisma.ServicePackageUpdateInput,
      include: withItems,
    });
  },

  delete: (id: string) => prisma.servicePackage.delete({ where: { id } }),
};
