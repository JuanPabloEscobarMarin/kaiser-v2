import type { Request, Response } from "express";
import { ServiceCategoryService } from "../services/service-category.service.ts";

export const ServiceCategoryController = {
  async list(req: Request, res: Response) {
    // Público: solo categorías activas. Admin: todas (gestiona inactivas).
    const isAdmin = req.auth?.role === "ADMIN";
    res.json(await ServiceCategoryService.list(isAdmin));
  },

  async create(req: Request, res: Response) {
    const data = await ServiceCategoryService.create(req.body);
    res.status(201).json({ message: "Categoría creada", data });
  },

  async update(req: Request, res: Response) {
    const data = await ServiceCategoryService.update(
      String(req.params.id),
      req.body,
    );
    res.json({ message: "Categoría actualizada", data });
  },

  async delete(req: Request, res: Response) {
    await ServiceCategoryService.delete(String(req.params.id));
    res.json({ message: "Categoría eliminada", id: String(req.params.id) });
  },
};
