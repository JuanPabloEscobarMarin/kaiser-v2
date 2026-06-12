import { prisma } from "../lib/prisma.ts";
import type { CustomerInput } from "../validators/customer.validators.ts";

export const CustomerRepository = {
  all: () =>
    prisma.customer.findMany({ orderBy: { createdAt: "desc" } }),

  byId: (id: string) => prisma.customer.findUnique({ where: { id } }),

  byIdentification: (identification: string) =>
    prisma.customer.findUnique({ where: { identification } }),

  upsert: (data: CustomerInput) =>
    prisma.customer.upsert({
      where: { identification: data.identification },
      create: data,
      update: { fullName: data.fullName, phone: data.phone },
    }),
};
