import { prisma } from "../lib/prisma.ts";
import type { CreateDeductionInput } from "../validators/employee-deduction.validators.ts";

export const EmployeeDeductionRepository = {
  byEmployee: (employeeId: string) =>
    prisma.employeeDeduction.findMany({
      where: { employeeId },
      orderBy: { createdAt: "desc" },
    }),

  /**
   * Listado filtrable para el informe económico: todos los empleados o uno,
   * acotado opcionalmente por rango de fecha de registro.
   */
  list: (filters: { employeeId?: string; from?: Date; to?: Date }) =>
    prisma.employeeDeduction.findMany({
      where: {
        ...(filters.employeeId ? { employeeId: filters.employeeId } : {}),
        ...(filters.from || filters.to
          ? {
              createdAt: {
                ...(filters.from ? { gte: filters.from } : {}),
                ...(filters.to ? { lte: filters.to } : {}),
              },
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
    }),

  byId: (id: string) =>
    prisma.employeeDeduction.findUnique({ where: { id } }),

  create: (data: CreateDeductionInput) =>
    prisma.employeeDeduction.create({
      data: {
        employeeId: data.employeeId,
        type: data.type,
        amount: data.amount,
        note: data.note ?? null,
      },
    }),

  delete: (id: string) =>
    prisma.employeeDeduction.delete({ where: { id } }),

  /** Suma de deducciones del empleado en un rango (para el cierre diario). */
  sumInRange: async (employeeId: string, start: Date, end: Date) => {
    const rows = await prisma.employeeDeduction.findMany({
      where: { employeeId, createdAt: { gte: start, lte: end } },
    });
    const total = rows.reduce((sum, r) => sum + Number(r.amount), 0);
    return { total, items: rows };
  },
};
