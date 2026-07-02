import { prisma } from "../lib/prisma.ts";
import type { CustomerInput } from "../validators/customer.validators.ts";

export const CustomerRepository = {
  all: () =>
    prisma.customer.findMany({ orderBy: { createdAt: "desc" } }),

  byId: (id: string) => prisma.customer.findUnique({ where: { id } }),

  byPhone: (phone: string) =>
    prisma.customer.findUnique({ where: { phone } }),

  // El cliente se identifica de forma única por su teléfono (antes: cédula).
  upsert: (data: CustomerInput) =>
    prisma.customer.upsert({
      where: { phone: data.phone },
      create: data,
      update: {
        fullName: data.fullName,
        // Solo sobrescribe si el cliente aporta el dato (no borra lo ya guardado).
        ...(data.email ? { email: data.email } : {}),
        ...(data.birthDate ? { birthDate: data.birthDate } : {}),
      },
    }),
};
