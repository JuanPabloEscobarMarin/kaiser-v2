import type { Request, Response } from "express";
import { ServiceService } from "../services/service.service.ts";

export const ServiceController = {
  async list(req: Request, res: Response) {
    // Público: solo servicios activos. Admin: catálogo completo (gestiona
    // también los desactivados).
    const isAdmin = req.auth?.role === "ADMIN";
    res.json(await ServiceService.list(isAdmin));
  },

  async getById(req: Request, res: Response) {
    res.json(await ServiceService.getById(String(req.params.id)));
  },

  async create(req: Request, res: Response) {
    const data = await ServiceService.create(req.body);
    res.status(201).json({ message: "Service created", data });
  },

  async update(req: Request, res: Response) {
    const data = await ServiceService.update(String(req.params.id), req.body);
    res.json({ message: "Service updated", data });
  },

  async delete(req: Request, res: Response) {
    await ServiceService.delete(String(req.params.id));
    res.json({ message: "Service deleted", id: String(req.params.id) });
  },

  async deleteMany(req: Request, res: Response) {
    const { count } = await ServiceService.deleteMany(req.body.ids);
    res.json({ message: "Services deleted", count });
  },
};
