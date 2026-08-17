import { BadRequestException } from "../exceptions/HttpException.ts";
import { prisma } from "../lib/prisma.ts";
import type { CustomerInput } from "../validators/customer.validators.ts";

export const CustomerRepository = {
  all: () =>
    prisma.customer.findMany({ orderBy: { createdAt: "desc" } }),

  byId: (id: string) => prisma.customer.findUnique({ where: { id } }),

  byPhone: async (phone: string) => {
    // Validación: Verificar que el teléfono de búsqueda no sea una cadena vacía o espacios en blanco.
    if (!phone || phone.trim().length === 0) {
      throw new BadRequestException("El teléfono es obligatorio para realizar la búsqueda");
    }

    return prisma.customer.findUnique({ where: { phone: phone.trim() } });
  },

  // El cliente se identifica de forma única por su teléfono (antes: cédula).
  upsert: (data: CustomerInput) => {
    // Validación: Asegurar que el teléfono no venga vacío al momento de persistir el registro.
    if (!data.phone || data.phone.trim().length === 0) {
      throw new BadRequestException("El teléfono es requerido para crear o actualizar el cliente");
    }

    // Validación: Asegurar que el nombre completo no venga vacío al momento de persistir el registro.
    if (!data.fullName || data.fullName.trim().length === 0) {
      throw new BadRequestException("El nombre del cliente es obligatorio para el registro");
    }
    return prisma.customer.upsert({
      where: { phone: data.phone },
      create: data,
      update: {
        fullName: data.fullName,
        // Solo sobrescribe si el cliente aporta el dato (no borra lo ya guardado).
        ...(data.email ? { email: data.email } : {}),
        ...(data.birthDate ? { birthDate: data.birthDate } : {}),
      },
    })
  },
};
