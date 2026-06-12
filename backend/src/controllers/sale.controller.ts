import type { Request, Response } from "express";
import { SaleService } from "../services/sale.service.ts";
import type { SaleFilters } from "../repositories/sale.repository.ts";

const readFilters = (req: Request): SaleFilters => {
  const filters: SaleFilters = {};
  if (req.query.from) filters.from = new Date(String(req.query.from));
  if (req.query.to) filters.to = new Date(String(req.query.to));
  if (req.query.employeeId) filters.employeeId = String(req.query.employeeId);
  return filters;
};

export const SaleController = {
  async list(req: Request, res: Response) {
    res.json(await SaleService.list(readFilters(req)));
  },

  async getById(req: Request, res: Response) {
    res.json(await SaleService.getById(String(req.params.id)));
  },

  async create(req: Request, res: Response) {
    const data = await SaleService.create(req.body);
    res.status(201).json({ message: "Sale registered", data });
  },

  async delete(req: Request, res: Response) {
    await SaleService.void(String(req.params.id));
    res.json({ message: "Sale voided", id: String(req.params.id) });
  },
};
