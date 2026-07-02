import { prisma } from "../lib/prisma.ts";

export const NotificationRepository = {
  byEmployee: (employeeId: string, limit = 30) =>
    prisma.employeeNotification.findMany({
      where: { employeeId },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),

  unreadCount: (employeeId: string) =>
    prisma.employeeNotification.count({
      where: { employeeId, read: false },
    }),

  byId: (id: string) =>
    prisma.employeeNotification.findUnique({ where: { id } }),

  create: (data: {
    employeeId: string;
    title: string;
    body?: string;
    type?: string;
  }) => prisma.employeeNotification.create({ data }),

  markRead: (id: string) =>
    prisma.employeeNotification.update({
      where: { id },
      data: { read: true },
    }),

  markAllRead: (employeeId: string) =>
    prisma.employeeNotification.updateMany({
      where: { employeeId, read: false },
      data: { read: true },
    }),
};
