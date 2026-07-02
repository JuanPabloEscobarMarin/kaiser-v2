import type { Request, Response } from "express";
import { EmployeeDeductionService } from "../services/employee-deduction.service.ts";

export const EmployeeDeductionController = {
  async list(req: Request, res: Response) {
    res.json(
      await EmployeeDeductionService.listByEmployee(
        String(req.query.employeeId),
      ),
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
