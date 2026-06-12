import {
  AppointmentRepository,
  type AppointmentFilters,
  type UpdateAppointmentData,
} from "../repositories/appointment.repository.ts";
import { ServiceService } from "./service.service.ts";
import { EmployeeService } from "./employee.service.ts";
import { CustomerService } from "./customer.service.ts";
import { SettingsService } from "./settings.service.ts";
import { EmployeeBlocksRepository } from "../repositories/employee-blocks.repository.ts";
import {
  resolveDaySchedule,
  isBlocked,
  type BusinessHoursConfig,
} from "../lib/business-hours.ts";
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
    if (!appointment) throw new NotFoundException("Appointment not found");
    return appointment;
  },

  byCustomer: (customerId: string) =>
    AppointmentRepository.byCustomer(customerId),

  /**
   * 30-min start times the employee is free for the requested service on the
   * given day (UTC). Respects business opening hours, existing appointments,
   * and the employee's schedule blocks.
   */
  async availability(input: {
    employeeId: string;
    serviceId: string;
    date: string;
  }) {
    const [service, employee] = await Promise.all([
      ServiceService.getById(input.serviceId),
      EmployeeService.getById(input.employeeId),
    ]);

    if (!employee.state) {
      throw new BadRequestException("Employee is not active");
    }

    const summary = {
      service: {
        id: service.id,
        name: service.name,
        duration: service.duration,
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

    const slots: { start: string; end: string }[] = [];

    // Walk every candidate start time within opening hours that leaves room for
    // the full service duration before closing.
    for (
      let startMin = schedule.openMinutes;
      startMin + service.duration <= schedule.closeMinutes;
      startMin += SLOT_MINUTES
    ) {
      const endMin = startMin + service.duration;
      const slotStart = dateAtMinutes(input.date, startMin);
      const slotEnd = dateAtMinutes(input.date, endMin);

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
    const [service, employee] = await Promise.all([
      ServiceService.getById(data.serviceId),
      EmployeeService.getById(data.employeeId),
    ]);

    if (!options.adminOverride && !service.state) {
      throw new BadRequestException("Service is not active");
    }
    if (!employee.state) {
      throw new BadRequestException("Employee is not active");
    }

    const start = new Date(data.scheduledAt);
    if (start.getTime() < Date.now()) {
      throw new BadRequestException("Cannot schedule in the past");
    }
    const end = computeEndsAt(start, service.duration);

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
        "Employee already has an appointment in this time range",
      );
    }

    const customer = await CustomerService.upsert(data.customer);

    return AppointmentRepository.createWithBooking({
      serviceId: data.serviceId,
      employeeId: data.employeeId,
      scheduledAt: start,
      endsAt: end,
      customerId: customer.id,
    });
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
      throw new BadRequestException("The business is closed on this day");
    }

    const startMin = minutesOfDayUtc(start);
    const endMin = startMin + (end.getTime() - start.getTime()) / 60_000;
    if (startMin < schedule.openMinutes || endMin > schedule.closeMinutes) {
      throw new BadRequestException("Selected time is outside business hours");
    }
    if (isBlocked(blocks, startMin, endMin)) {
      throw new BadRequestException(
        "Selected time is blocked for this employee",
      );
    }
  },

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
        throw new ConflictException("Time conflict with another appointment");
    }

    const update: UpdateAppointmentData = {
      serviceId,
      employeeId,
      scheduledAt,
      endsAt,
    };
    if (data.state !== undefined) update.state = data.state;
    return AppointmentRepository.update(id, update);
  },

  async cancel(id: string) {
    await this.getById(id);
    return AppointmentRepository.update(id, { state: "CANCELLED" });
  },

  async delete(id: string) {
    await this.getById(id);
    return AppointmentRepository.delete(id);
  },
};
