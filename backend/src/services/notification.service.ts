import { BadRequestException } from "../exceptions/HttpException.ts";
import { NotificationRepository } from "../repositories/notification.repository.ts";

export const NotificationService = {
  async list(employeeId: string) {
    // Validación: Verificar que el ID del empleado no sea nulo, vacío ni consista solo de espacios.
    if (!employeeId || employeeId.trim().length === 0) {
      throw new BadRequestException("El ID del empleado es obligatorio");
    }

    return NotificationRepository.byEmployee(employeeId.trim());
  },

  async unreadCount(employeeId: string) {
    // Validación: Verificar que el ID del empleado sea válido antes de consultar el contador de no leídos.
    if (!employeeId || employeeId.trim().length === 0) {
      throw new BadRequestException("El ID del empleado es obligatorio");
    }

    return NotificationRepository.unreadCount(employeeId.trim());
  },

  /** Crea una notificación in-app. Pensado para llamarse "fire-and-forget". */
  notifyEmployee: (employeeId: string, title: string, body?: string) => {
    // Validación: El ID del empleado destinatario es obligatorio.
    if (!employeeId || employeeId.trim().length === 0) {
      throw new BadRequestException("El ID del empleado destinatario es obligatorio");
    }

    // Validación: El título de la notificación no puede estar vacío ni consistir solo de espacios.
    if (!title || title.trim().length === 0) {
      throw new BadRequestException("El título de la notificación es obligatorio");
    }

    return NotificationRepository.create({
      employeeId: employeeId.trim(),
      title: title.trim(),
      ...(body && body.trim().length > 0 ? { body: body.trim() } : {}),
    });},

  
  async markRead(id: string) {
    // Validación: Verificar que el ID de la notificación sea válido y no esté vacío.
    if (!id || id.trim().length === 0) {
      throw new BadRequestException("El ID de la notificación es obligatorio");
    }

    return NotificationRepository.markRead(id.trim());
  },

  async markAllRead(employeeId: string) {
    // Validación: Verificar que el ID del empleado no esté vacío para marcar todas como leídas.
    if (!employeeId || employeeId.trim().length === 0) {
      throw new BadRequestException("El ID del empleado es obligatorio");
    }

    return NotificationRepository.markAllRead(employeeId.trim());
  },
};
