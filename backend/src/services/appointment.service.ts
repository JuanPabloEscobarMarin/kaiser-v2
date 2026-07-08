import {
  AppointmentRepository,
  type AppointmentFilters,
  type UpdateAppointmentData,
} from "../repositories/appointment.repository.ts";
import { ServiceService } from "./service.service.ts";
import { ServicePackageService } from "./service-package.service.ts";
import { EmployeeService } from "./employee.service.ts";
import { CustomerService } from "./customer.service.ts";
import { SettingsService } from "./settings.service.ts";
import { NotificationService } from "./notification.service.ts";
import { EmailService } from "./email.service.ts";
import { WhatsAppService } from "./whatsapp.service.ts";
import { EmployeeBlocksRepository } from "../repositories/employee-blocks.repository.ts";
import {
  resolveDaySchedule,
  isBlocked,
  wallClockNow,
  formatWallClock,
  type BusinessHoursConfig,
} from "../lib/business-hours.ts";
import { computeServiceCommission } from "../lib/commission.ts";
import { env } from "../config/env.ts";
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "../exceptions/HttpException.ts";
import type {
  BookAppointmentInput,
  UpdateAppointmentInput,
} from "../validators/appointment.validators.ts";

/** Granularity of offered start times, in minutes. */
const SLOT_MINUTES = 30;

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const startOfDay = (yyyyMmDd: string) => new Date(`${yyyyMmDd}T00:00:00.000Z`);
const endOfDay = (yyyyMmDd: string) => new Date(`${yyyyMmDd}T23:59:59.999Z`);

const computeEndsAt = (start: Date, durationMinutes: number) =>
  new Date(start.getTime() + durationMinutes * 60_000);

/** "YYYY-MM-DD" (UTC) for a Date. */
const dateYmdOf = (d: Date) => d.toISOString().slice(0, 10);

/** Minutes since 00:00 UTC for a Date (its UTC time-of-day). */
const minutesOfDayUtc = (d: Date) => d.getUTCHours() * 60 + d.getUTCMinutes();

/** A Date for the given UTC day at `minutes` past midnight. */
const dateAtMinutes = (dateYmd: string, minutes: number) => {
  const d = startOfDay(dateYmd);
  d.setUTCMinutes(minutes); // normalizes values >59 into hours
  return d;
};

/**
 * Load the business opening hours. The settings row structurally contains the
 * BusinessHoursConfig fields; this narrows the loosely-typed settings object to
 * just the shape this service needs.
 */
const loadBusinessHours = async (): Promise<BusinessHoursConfig> =>
  (await SettingsService.get()) as unknown as BusinessHoursConfig;

export const AppointmentService = {
  list: (filters?: AppointmentFilters) => AppointmentRepository.all(filters),

  async getById(id: string) {
    const appointment = await AppointmentRepository.byId(id);
    if (!appointment) throw new NotFoundException("Cita no encontrada");
    return appointment;
  },

  byCustomer: (customerId: string) =>
    AppointmentRepository.byCustomer(customerId),

  /**
   * 30-min start times the employee is free for the requested service on the
   * given day (UTC). Respects business opening hours, existing appointments,
   * and the employee's schedule blocks.
   */
  /**
   * Resuelve la lista de servicios de una cita a partir de un servicio suelto,
   * varios servicios o un combo/paquete. Devuelve los servicios cargados, sus
   * ids, la duración total y (si aplica) el id del combo.
   */
  async resolveServices(
    input: {
      serviceId?: string | undefined;
      serviceIds?: string[] | undefined;
      packageId?: string | undefined;
    },
    options: { adminOverride: boolean },
  ) {
    let serviceIds: string[];
    let packageId: string | null = null;
    // Un combo tiene precio propio; se registra como finalPrice de la cita para
    // que los reportes cobren el combo (no la suma de servicios).
    let packagePrice: string | null = null;

    if (input.packageId) {
      const pkg = await ServicePackageService.getById(input.packageId);
      if (!options.adminOverride && !pkg.state) {
        throw new BadRequestException("El combo no está disponible");
      }
      serviceIds = pkg.items.map((i) => i.serviceId);
      packageId = pkg.id;
      packagePrice = String(pkg.price);
    } else if (input.serviceIds && input.serviceIds.length) {
      serviceIds = input.serviceIds;
    } else if (input.serviceId) {
      serviceIds = [input.serviceId];
    } else {
      throw new BadRequestException("Debes indicar al menos un servicio o un combo");
    }

    if (serviceIds.length === 0) {
      throw new BadRequestException("El combo no tiene servicios");
    }

    const services = await Promise.all(
      serviceIds.map((id) => ServiceService.getById(id)),
    );
    const totalDuration = services.reduce((sum, s) => sum + s.duration, 0);
    return { serviceIds, packageId, packagePrice, services, totalDuration };
  },

  /**
   * Verifica que el empleado tenga asignados TODOS los servicios pedidos.
   * Sin esto un cliente puede combinar servicios de distintos profesionales
   * (p. ej. corte de dama + barba con una estilista) y crear citas que el
   * empleado no puede atender — y por las que además no cobraría comisión.
   */
  assertEmployeeHasServices(
    employee: { fullName: string; services: { id: string }[] },
    services: { id: string; name: string }[],
  ) {
    const assigned = new Set(employee.services.map((s) => s.id));
    const missing = services.filter((s) => !assigned.has(s.id));
    if (missing.length > 0) {
      throw new BadRequestException(
        `${employee.fullName} no realiza: ${missing.map((s) => s.name).join(", ")}. Elige otro profesional o quita esos servicios.`,
      );
    }
  },

  async availability(
    input: {
      employeeId: string;
      serviceId?: string;
      serviceIds?: string;
      packageId?: string;
      date: string;
    },
    options: { adminOverride?: boolean } = {},
  ) {
    const adminOverride = options.adminOverride ?? false;
    const employee = await EmployeeService.getById(input.employeeId);
    if (!employee.state) {
      throw new BadRequestException("El empleado no está activo");
    }

    const parsedIds = input.serviceIds
      ? input.serviceIds.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined;
    const { services, totalDuration } = await this.resolveServices(
      {
        ...(input.packageId ? { packageId: input.packageId } : {}),
        ...(parsedIds && parsedIds.length ? { serviceIds: parsedIds } : {}),
        ...(input.serviceId ? { serviceId: input.serviceId } : {}),
      },
      { adminOverride },
    );

    // El admin puede consultar cualquier combinación (mismo bypass que
    // adminBook); a los clientes no se les ofrecen horas de servicios que el
    // profesional no realiza.
    if (!adminOverride) {
      this.assertEmployeeHasServices(employee, services);
    }

    const summary = {
      service: {
        id: services[0]!.id,
        name: services.map((s) => s.name).join(" + "),
        duration: totalDuration,
      },
      employee: { id: employee.id, fullName: employee.fullName },
      date: input.date,
    };

    const [taken, blocks, hours] = await Promise.all([
      AppointmentRepository.byEmployeeOnDateLean(
        input.employeeId,
        startOfDay(input.date),
        endOfDay(input.date),
      ),
      EmployeeBlocksRepository.activeOnDate(input.employeeId, input.date),
      loadBusinessHours(),
    ]);

    const schedule = resolveDaySchedule(hours, input.date);
    if (schedule.closed) return { ...summary, slots: [] };

    const now = wallClockNow(env.BUSINESS_TIMEZONE);
    const slots: { start: string; end: string }[] = [];

    // Walk every candidate start time within opening hours that leaves room for
    // the full (combined) service duration before closing.
    for (
      let startMin = schedule.openMinutes;
      startMin + totalDuration <= schedule.closeMinutes;
      startMin += SLOT_MINUTES
    ) {
      const endMin = startMin + totalDuration;
      const slotStart = dateAtMinutes(input.date, startMin);
      const slotEnd = dateAtMinutes(input.date, endMin);

      // Nunca ofrecer horas que ya pasaron (hoy: solo de la hora actual en
      // adelante; días anteriores: nada).
      if (slotStart.getTime() <= now.getTime()) continue;

      const overlaps = taken.some(
        (a) => a.scheduledAt < slotEnd && a.endsAt > slotStart,
      );
      if (overlaps) continue;
      if (isBlocked(blocks, startMin, endMin)) continue;

      slots.push({
        start: slotStart.toISOString(),
        end: slotEnd.toISOString(),
      });
    }

    return { ...summary, slots };
  },

  /** Client-facing booking: enforces visibility, opening hours and blocks. */
  book(data: BookAppointmentInput) {
    return this.createBooking(data, { adminOverride: false });
  },

  /**
   * Admin booking: may book otherwise-hidden services and outside the
   * published opening hours / schedule blocks. Double-booking another
   * appointment is still rejected.
   */
  adminBook(data: BookAppointmentInput) {
    return this.createBooking(data, { adminOverride: true });
  },

  async createBooking(
    data: BookAppointmentInput,
    options: { adminOverride: boolean },
  ) {
    const employee = await EmployeeService.getById(data.employeeId);
    if (!employee.state) {
      throw new BadRequestException("El empleado no está activo");
    }

    const { serviceIds, packageId, packagePrice, services, totalDuration } =
      await this.resolveServices(data, options);

    if (!options.adminOverride && services.some((s) => !s.state)) {
      throw new BadRequestException("El servicio no está activo");
    }

    // Los clientes solo pueden agendar servicios que el profesional realiza.
    // El admin conserva el bypass (mostrador puede asignar casos especiales),
    // aunque la comisión de servicios no asignados será 0.
    if (!options.adminOverride) {
      this.assertEmployeeHasServices(employee, services);
    }

    const start = new Date(data.scheduledAt);
    // Comparar contra la hora de pared del negocio, no Date.now(): scheduledAt
    // viene en la convención fake-UTC y el reloj real del servidor (UTC) va
    // horas adelante de Colombia.
    if (start.getTime() < wallClockNow(env.BUSINESS_TIMEZONE).getTime()) {
      throw new BadRequestException("No se puede agendar en el pasado");
    }
    const end = computeEndsAt(start, totalDuration);

    // Clients must stay within opening hours and outside the employee's blocks.
    // Admins bypass this (the create-appointment UI already restricts them to
    // valid slots) but never bypass the hard double-booking check below.
    if (!options.adminOverride) {
      await this.assertWithinAvailability(data.employeeId, start, end);
    }

    const conflict = await AppointmentRepository.conflicts(
      data.employeeId,
      start,
      end,
    );
    if (conflict) {
      throw new ConflictException(
        "El empleado ya tiene una cita en este horario",
      );
    }

    const customer = await CustomerService.upsert(data.customer);

    const appointment = await AppointmentRepository.createWithBooking({
      serviceId: serviceIds[0]!,
      serviceIds,
      packageId,
      employeeId: data.employeeId,
      scheduledAt: start,
      endsAt: end,
      customerId: customer.id,
      ...(packagePrice !== null ? { finalPrice: packagePrice } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
    });

    // Alerta in-app al empleado (fire-and-forget: no bloquea la reserva).
    void NotificationService.notifyEmployee(
      data.employeeId,
      "Nueva cita agendada",
      `${customer.fullName} · ${services.map((s) => s.name).join(" + ")} · ${start.toISOString().slice(0, 16).replace("T", " ")}`,
    ).catch(() => {});

    // Notificación de confirmación al cliente por correo y/o WhatsApp
    // (fire-and-forget: un fallo de envío no debe tumbar la reserva ya creada).
    if (customer.email || (customer.phone && WhatsAppService.isConfigured())) {
      void this.notifyCustomerOfBooking({
        customerName: customer.fullName,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        employeeName: employee.fullName,
        serviceNames: services.map((s) => s.name).join(" + "),
        start,
        packagePrice,
        services,
        notes: data.notes ?? null,
      }).catch(() => {});
    }

    return appointment;
  },

  async notifyCustomerOfBooking(input: {
    customerName: string;
    customerEmail: string | null;
    customerPhone: string;
    employeeName: string;
    serviceNames: string;
    start: Date;
    packagePrice: string | null;
    services: { price: unknown; discount: unknown; variablePrice: boolean }[];
    notes: string | null;
  }) {
    // SettingsService.get() solo tipa `homeContent` (ver loadBusinessHours
    // arriba, mismo caso); los campos planos del negocio existen en runtime.
    const settings = (await SettingsService.get()) as unknown as {
      name: string;
      phone: string;
      address: string;
    };

    const priceLabel = input.packagePrice
      ? currency.format(Number(input.packagePrice))
      : `${input.services.some((s) => s.variablePrice) ? "Desde " : ""}${currency.format(
          input.services.reduce(
            (sum, s) => sum + Math.max(0, Number(s.price) - Number(s.discount)),
            0,
          ),
        )}`;

    if (input.customerEmail) {
      const contactLines = [
        settings.address ? `📍 ${settings.address}` : "",
        settings.phone ? `📞 ${settings.phone}` : "",
      ]
        .filter(Boolean)
        .join("<br>");

      const html = `
        <div style="font-family:sans-serif;font-size:15px;line-height:1.6">
          <h2 style="margin-bottom:4px">¡Cita confirmada!</h2>
          <p>Hola ${input.customerName}, tu cita en <strong>${settings.name}</strong> quedó agendada con estos datos:</p>
          <ul style="padding-left:18px">
            <li><strong>Servicio:</strong> ${input.serviceNames}</li>
            <li><strong>Profesional:</strong> ${input.employeeName}</li>
            <li><strong>Fecha y hora:</strong> ${formatWallClock(input.start)}</li>
            <li><strong>Precio:</strong> ${priceLabel}</li>
            ${input.notes ? `<li><strong>Notas:</strong> ${input.notes}</li>` : ""}
          </ul>
          ${contactLines ? `<p>${contactLines}</p>` : ""}
          <p style="color:#888;font-size:13px">Si necesitas cancelar o reagendar, contáctanos.</p>
        </div>
      `;

      await EmailService.send({
        to: input.customerEmail,
        subject: `Confirmación de tu cita en ${settings.name}`,
        html,
      }).catch(() => {});
    }

    if (input.customerPhone && WhatsAppService.isConfigured()) {
      const waText = [
        `¡Hola ${input.customerName}! Tu cita en ${settings.name} quedó confirmada:`,
        `📅 ${formatWallClock(input.start)}`,
        `💈 ${input.serviceNames}`,
        `🧑 ${input.employeeName}`,
        `💰 ${priceLabel}`,
        ...(input.notes ? [`📝 ${input.notes}`] : []),
        `¡Te esperamos!`,
      ].join("\n");

      await WhatsAppService.sendText(input.customerPhone, waText).catch(() => {});
    }
  },

  /**
   * Guard a requested [start, end) slot against the published opening hours and
   * the employee's schedule blocks. Mirrors the filtering done in availability()
   * so a hand-crafted request can't book a closed or blocked time.
   */
  async assertWithinAvailability(employeeId: string, start: Date, end: Date) {
    const dateYmd = dateYmdOf(start);
    const [blocks, hours] = await Promise.all([
      EmployeeBlocksRepository.activeOnDate(employeeId, dateYmd),
      loadBusinessHours(),
    ]);

    const schedule = resolveDaySchedule(hours, dateYmd);
    if (schedule.closed) {
      throw new BadRequestException("El negocio está cerrado este día");
    }

    const startMin = minutesOfDayUtc(start);
    const endMin = startMin + (end.getTime() - start.getTime()) / 60_000;
    if (startMin < schedule.openMinutes || endMin > schedule.closeMinutes) {
      throw new BadRequestException("La hora seleccionada está fuera del horario de atención");
    }
    // La hora debe caer exactamente en la grilla de slots ofrecida (cada
    // SLOT_MINUTES desde la apertura). Sin esto, un request manual a las
    // 10:07:23 fragmentaría la agenda del resto de clientes.
    if (
      start.getUTCSeconds() !== 0 ||
      start.getUTCMilliseconds() !== 0 ||
      (startMin - schedule.openMinutes) % SLOT_MINUTES !== 0
    ) {
      throw new BadRequestException(
        "La hora seleccionada no es un horario disponible",
      );
    }
    if (isBlocked(blocks, startMin, endMin)) {
      throw new BadRequestException(
        "La hora seleccionada está bloqueada para este empleado",
      );
    }
  },

  /**
   * Edición admin-only. A diferencia del booking público, NO valida horario
   * de apertura ni bloqueos del empleado: es la misma capacidad que
   * adminBook() (reprogramar fuera de horario es un caso de uso real del
   * mostrador). El chequeo duro de no-solape con otras citas sí se aplica
   * SIEMPRE, más abajo.
   */
  async update(id: string, data: UpdateAppointmentInput) {
    const current = await this.getById(id);

    let scheduledAt = current.scheduledAt;
    let endsAt = current.endsAt;
    let serviceId = current.serviceId;
    let employeeId = current.employeeId;

    if (data.serviceId) {
      const service = await ServiceService.getById(data.serviceId);
      serviceId = data.serviceId;
      if (data.scheduledAt) scheduledAt = new Date(data.scheduledAt);
      endsAt = computeEndsAt(scheduledAt, service.duration);
    } else if (data.scheduledAt) {
      scheduledAt = new Date(data.scheduledAt);
      const service = await ServiceService.getById(current.serviceId);
      endsAt = computeEndsAt(scheduledAt, service.duration);
    }

    if (data.employeeId) {
      await EmployeeService.getById(data.employeeId);
      employeeId = data.employeeId;
    }

    if (data.scheduledAt || data.employeeId || data.serviceId) {
      const conflict = await AppointmentRepository.conflicts(
        employeeId,
        scheduledAt,
        endsAt,
        id,
      );
      if (conflict)
        throw new ConflictException("La hora choca con otra cita");
    }

    const update: UpdateAppointmentData = {
      serviceId,
      employeeId,
      scheduledAt,
      endsAt,
    };
    if (data.state !== undefined) update.state = data.state;
    if (data.finalPrice !== undefined) update.finalPrice = data.finalPrice;
    if (data.notes !== undefined) update.notes = data.notes;
    const updated = await AppointmentRepository.update(id, update);
    return this.syncCommissionSnapshot(updated);
  },

  /**
   * Mantiene Appointment.commissionAmount coherente con el estado de la cita:
   * FINISHED → congela la comisión sobre lo cobrado (finalPrice o precio con
   * descuento, repartido proporcionalmente en multi-servicio) con las tasas
   * VIGENTES del empleado; cualquier otro estado → null. Re-finalizar o editar
   * finalPrice de una cita FINISHED recalcula; reabrir borra el snapshot.
   */
  async syncCommissionSnapshot(
    appt: Awaited<ReturnType<typeof AppointmentRepository.update>>,
  ) {
    let amount: number | null = null;
    if (appt.state === "FINISHED") {
      const svcs =
        appt.services.length > 0
          ? appt.services.map((x) => x.service)
          : [appt.service];
      const employee = await EmployeeService.getById(appt.employeeId);
      const rates = new Map(
        (employee.services ?? []).map((s) => [s.id, Number(s.commission)]),
      );
      amount = computeServiceCommission(svcs, appt.finalPrice, rates);
    }
    const current =
      appt.commissionAmount == null ? null : Number(appt.commissionAmount);
    if (current === amount) return appt;
    return AppointmentRepository.update(appt.id, {
      commissionAmount: amount == null ? null : String(amount),
    });
  },

  async cancel(id: string) {
    await this.getById(id);
    return AppointmentRepository.update(id, {
      state: "CANCELLED",
      commissionAmount: null,
    });
  },

  async delete(id: string) {
    await this.getById(id);
    return AppointmentRepository.delete(id);
  },
};
