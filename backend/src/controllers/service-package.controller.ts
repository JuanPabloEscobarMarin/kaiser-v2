import type { Request, Response } from "express";
import { ServicePackageService } from "../services/service-package.service.ts";

export const ServicePackageController = {
  async list(req: Request, res: Response) {
    const isAdmin = req.auth?.role === "ADMIN";
    res.json(await ServicePackageService.list(isAdmin));
  },

  async getById(req: Request, res: Response) {
    res.json(await ServicePackageService.getById(String(req.params.id)));
  },

  async create(req: Request, res: Response) {
    const data = await ServicePackageService.create(req.body);
    res.status(201).json({ message: "Combo creado", data });
  },

  async update(req: Request, res: Response) {
    const data = await ServicePackageService.update(
      String(req.params.id),
      req.body,
    );
    res.json({ message: "Combo actualizado", data });
  },

  async delete(req: Request, res: Response) {
    await ServicePackageService.delete(String(req.params.id));
    res.json({ message: "Combo eliminado", id: String(req.params.id) });
  },
};
