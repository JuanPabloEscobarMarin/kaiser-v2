import type { Request, Response } from "express";
import { AppointmentService } from "../services/appointment.service.ts";
import type { AppointmentFilters } from "../repositories/appointment.repository.ts";
import type { AppointmentState } from "../../generated/prisma/enums.ts";

export const AppointmentController = {
  async list(req: Request, res: Response) {
    const filters: AppointmentFilters = {};
    if (req.query.from) filters.from = new Date(String(req.query.from));
    if (req.query.to) filters.to = new Date(String(req.query.to));
    if (req.query.state) filters.state = String(req.query.state) as AppointmentState;
    res.json(await AppointmentService.list(filters));
  },

  async getById(req: Request, res: Response) {
    res.json(await AppointmentService.getById(String(req.params.id)));
  },

  async availability(req: Request, res: Response) {
    res.json(
      await AppointmentService.availability(
        {
          employeeId: req.query.employeeId as string,
          date: req.query.date as string,
          ...(req.query.serviceId
            ? { serviceId: req.query.serviceId as string }
            : {}),
          ...(req.query.serviceIds
            ? { serviceIds: req.query.serviceIds as string }
            : {}),
          ...(req.query.packageId
            ? { packageId: req.query.packageId as string }
            : {}),
        },
        { adminOverride: req.auth?.role === "ADMIN" },
      ),
    );
  },

  async book(req: Request, res: Response) {
    const data = await AppointmentService.book(req.body);
    res.status(201).json({ message: "Appointment booked", data });
  },

  async adminBook(req: Request, res: Response) {
    const data = await AppointmentService.adminBook(req.body);
    res.status(201).json({ message: "Appointment booked", data });
  },

  async update(req: Request, res: Response) {
    const data = await AppointmentService.update(
      String(req.params.id),
      req.body,
    );
    res.json({ message: "Appointment updated", data });
  },

  async cancel(req: Request, res: Response) {
    const data = await AppointmentService.cancel(String(req.params.id));
    res.json({ message: "Appointment cancelled", data });
  },

  async delete(req: Request, res: Response) {
    await AppointmentService.delete(String(req.params.id));
    res.json({ message: "Appointment deleted", id: req.params.id });
  },
};
