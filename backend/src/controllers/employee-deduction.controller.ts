import type { Request, Response } from "express";
import { EmployeeDeductionService } from "../services/employee-deduction.service.ts";

export const EmployeeDeductionController = {
  async list(req: Request, res: Response) {
    res.json(
      await EmployeeDeductionService.list({
        ...(req.query.employeeId
          ? { employeeId: String(req.query.employeeId) }
          : {}),
        ...(req.query.from ? { from: String(req.query.from) } : {}),
        ...(req.query.to ? { to: String(req.query.to) } : {}),
      }),
    );
  },

  async create(req: Request, res: Response) {
    const data = await EmployeeDeductionService.create(req.body);
    res.status(201).json({ message: "Deducción registrada", data });
  },

  async delete(req: Request, res: Response) {
    await EmployeeDeductionService.delete(String(req.params.id));
    res.json({ message: "Deducción eliminada", id: String(req.params.id) });
  },
};
