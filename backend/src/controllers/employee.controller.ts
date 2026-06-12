import type { Request, Response } from "express";
import { EmployeeService } from "../services/employee.service.ts";

export const EmployeeController = {
  async list(req: Request, res: Response) {
    const serviceId = req.query.serviceId ? String(req.query.serviceId) : undefined;
    const isAdmin = req.auth?.role === "ADMIN";
    res.json(await EmployeeService.list(serviceId, isAdmin));
  },

  async getById(req: Request, res: Response) {
    const isAdmin = req.auth?.role === "ADMIN";
    const id = String(req.params.id);
    res.json(
      isAdmin
        ? await EmployeeService.getById(id)
        : await EmployeeService.getPublicById(id),
    );
  },

  async create(req: Request, res: Response) {
    const data = await EmployeeService.create(req.body);
    res.status(201).json({ message: "Employee created", data });
  },

  async update(req: Request, res: Response) {
    const data = await EmployeeService.update(String(req.params.id), req.body);
    res.json({ message: "Employee updated", data });
  },

  async delete(req: Request, res: Response) {
    await EmployeeService.delete(String(req.params.id));
    res.json({ message: "Employee deactivated", id: String(req.params.id) });
  },
};
