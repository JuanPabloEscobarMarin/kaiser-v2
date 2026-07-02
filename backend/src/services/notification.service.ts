import { NotificationRepository } from "../repositories/notification.repository.ts";

export const NotificationService = {
  list: (employeeId: string) => NotificationRepository.byEmployee(employeeId),

  unreadCount: (employeeId: string) =>
    NotificationRepository.unreadCount(employeeId),

  /** Crea una notificación in-app. Pensado para llamarse "fire-and-forget". */
  notifyEmployee: (employeeId: string, title: string, body?: string) =>
    NotificationRepository.create({
      employeeId,
      title,
      ...(body ? { body } : {}),
    }),

  markRead: (id: string) => NotificationRepository.markRead(id),

  markAllRead: (employeeId: string) =>
    NotificationRepository.markAllRead(employeeId),
};
