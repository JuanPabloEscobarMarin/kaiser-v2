import { prisma } from "../lib/prisma.ts";
import type { Prisma } from "../../generated/prisma/client.ts";
import type { AppointmentState } from "../../generated/prisma/enums.ts";

export interface AppointmentFilters {
  from?: Date;
  to?: Date;
  state?: AppointmentState;
}

export interface CreateAppointmentData {
  serviceId: string;
  employeeId: string;
  scheduledAt: Date;
  endsAt: Date;
}

export interface UpdateAppointmentData {
  serviceId?: string;
  employeeId?: string;
  scheduledAt?: Date;
  endsAt?: Date;
  state?: AppointmentState;
}

const fullInclude = {
  service: true,
  employee: true,
  booking: { include: { customer: true } },
} as const;

export const AppointmentRepository = {
  all: (filters: AppointmentFilters = {}) => {
    const where: Prisma.AppointmentWhereInput = {};
    if (filters.state) where.state = filters.state;
    if (filters.from || filters.to) {
      where.scheduledAt = {};
      if (filters.from) where.scheduledAt.gte = filters.from;
      if (filters.to) where.scheduledAt.lte = filters.to;
    }
    return prisma.appointment.findMany({
      where,
      include: fullInclude,
      orderBy: { createdAt: "desc" },
    });
  },

  byId: (id: string) =>
    prisma.appointment.findUnique({
      where: { id },
      include: fullInclude,
    }),

  /**
   * Lean variant for availability calculation: only the time window is needed
   * to detect overlaps, so we skip the heavy service/employee/customer joins.
   */
  byEmployeeOnDateLean: (employeeId: string, dayStart: Date, dayEnd: Date) =>
    prisma.appointment.findMany({
      where: {
        employeeId,
        state: { not: "CANCELLED" },
        scheduledAt: { gte: dayStart, lt: dayEnd },
      },
      select: { scheduledAt: true, endsAt: true },
      orderBy: { scheduledAt: "asc" },
    }),

  conflicts: (
    employeeId: string,
    start: Date,
    end: Date,
    excludeId?: string,
  ) => {
    const where: Prisma.AppointmentWhereInput = {
      employeeId,
      state: { not: "CANCELLED" },
      AND: [{ scheduledAt: { lt: end } }, { endsAt: { gt: start } }],
    };
    if (excludeId) where.id = { not: excludeId };
    return prisma.appointment.findFirst({ where });
  },

  byCustomer: (customerId: string) =>
    prisma.appointment.findMany({
      where: { booking: { customerId } },
      include: fullInclude,
      orderBy: { scheduledAt: "asc" },
    }),

  createWithBooking: (data: CreateAppointmentData & { customerId: string }) =>
    prisma.appointment.create({
      data: {
        serviceId: data.serviceId,
        employeeId: data.employeeId,
        scheduledAt: data.scheduledAt,
        endsAt: data.endsAt,
        booking: { create: { customerId: data.customerId } },
      },
      include: fullInclude,
    }),

  update: (id: string, data: UpdateAppointmentData) =>
    prisma.appointment.update({
      where: { id },
      data,
      include: fullInclude,
    }),

  delete: (id: string) => prisma.appointment.delete({ where: { id } }),
};
