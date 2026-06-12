import { prisma } from "../lib/prisma.ts";

const withServices = {
  services: {
    select: {
      service: { select: { id: true, name: true } },
      commission: true,
    },
  },
} as const;

const mapServices = (e: any) => ({
  ...e,
  services: e.services.map((es: any) => ({
    ...es.service,
    commission: String(es.commission ?? "0"),
  })),
});

export const EmployeeRepository = {
  all: async (serviceId?: string) => {
    const employees = await prisma.employee.findMany({
      where: {
        state: true,
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

  create: async (data: { fullName: string; phone: string; state: boolean; salary: string; services: { serviceId: string; commission: number }[] }) => {
    const { services, ...fields } = data;
    const e = await prisma.employee.create({
      data: {
        ...fields,
        ...(services.length
          ? { services: { create: services.map(({ serviceId, commission }) => ({ serviceId, commission })) } }
          : {}),
      },
      include: withServices,
    });
    return mapServices(e);
  },

  update: async (id: string, data: { fullName?: string; phone?: string; state?: boolean; salary?: string; services?: { serviceId: string; commission: number }[] }) => {
    const { services, ...fields } = data;
    const e = await prisma.employee.update({
      where: { id },
      data: {
        ...fields,
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
