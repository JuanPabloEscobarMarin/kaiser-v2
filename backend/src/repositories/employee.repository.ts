import { prisma } from "../lib/prisma.ts";
import type { Prisma } from "../../generated/prisma/client.ts";

const withServices = {
  services: {
    select: {
      service: { select: { id: true, name: true } },
      commission: true,
    },
  },
} as const satisfies Prisma.EmployeeInclude;

type EmployeeRow = Prisma.EmployeeGetPayload<{ include: typeof withServices }>;

const mapServices = (e: EmployeeRow) => ({
  ...e,
  services: e.services.map((es) => ({
    ...es.service,
    commission: String(es.commission ?? "0"),
  })),
});

export const EmployeeRepository = {
  all: async (serviceId?: string, includeInactive = false) => {
    const employees = await prisma.employee.findMany({
      where: {
        ...(includeInactive ? {} : { state: true }),
        ...(serviceId ? { services: { some: { serviceId } } } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: withServices,
    });
    return employees.map(mapServices);
  },

  byId: async (id: string) => {
    const e = await prisma.employee.findUnique({ where: { id }, include: withServices });
    return e ? mapServices(e) : null;
  },

  create: async (data: { fullName: string; phone: string; state: boolean; salary: string; urlImage?: string | null | undefined; services: { serviceId: string; commission: number }[] }) => {
    const { services, urlImage, ...fields } = data;
    const e = await prisma.employee.create({
      data: {
        ...fields,
        ...(urlImage !== undefined ? { urlImage } : {}),
        ...(services.length
          ? { services: { create: services.map(({ serviceId, commission }) => ({ serviceId, commission })) } }
          : {}),
      },
      include: withServices,
    });
    return mapServices(e);
  },

  update: async (id: string, data: { fullName?: string; phone?: string; state?: boolean; salary?: string; urlImage?: string | null | undefined; services?: { serviceId: string; commission: number }[] }) => {
    const { services, urlImage, ...fields } = data;
    const e = await prisma.employee.update({
      where: { id },
      data: {
        ...fields,
        ...(urlImage !== undefined ? { urlImage } : {}),
        ...(services !== undefined
          ? {
              services: {
                deleteMany: {},
                create: services.map(({ serviceId, commission }) => ({ serviceId, commission })),
              },
            }
          : {}),
      },
      include: withServices,
    });
    return mapServices(e);
  },

  delete: (id: string) =>
    prisma.employee.update({ where: { id }, data: { state: false } }),
};
