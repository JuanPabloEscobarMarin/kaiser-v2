import { prisma } from "../lib/prisma.ts";
import type { CreateBlockInput } from "../validators/employee-blocks.validators.ts";

export const EmployeeBlocksRepository = {
  allByEmployee: (employeeId: string) =>
    prisma.employeeScheduleBlock.findMany({
      where: { employeeId },
      orderBy: { createdAt: "desc" },
    }),

  create: (employeeId: string, data: CreateBlockInput) =>
    prisma.employeeScheduleBlock.create({
      // Normalize optional fields to null so the create input never carries
      // `undefined` (rejected under exactOptionalPropertyTypes).
      data: {
        employeeId,
        date: data.date ?? null,
        dayOfWeek: data.dayOfWeek ?? null,
        startTime: data.startTime,
        endTime: data.endTime,
        isFullDay: data.isFullDay ?? false,
        reason: data.reason ?? null,
      },
    }),

  delete: (id: string) =>
    prisma.employeeScheduleBlock.delete({ where: { id } }),

  byId: (id: string) =>
    prisma.employeeScheduleBlock.findUnique({ where: { id } }),

  activeOnDate: (employeeId: string, dateYmd: string) => {
    const dow = new Date(`${dateYmd}T00:00:00.000Z`).getUTCDay();
    return prisma.employeeScheduleBlock.findMany({
      where: {
        employeeId,
        OR: [
          { date: dateYmd },
          { dayOfWeek: dow },
        ],
      },
    });
  },
};
