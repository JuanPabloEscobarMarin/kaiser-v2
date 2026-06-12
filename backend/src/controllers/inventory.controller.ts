import type { Request, Response } from "express";
import { InventoryRepository } from "../repositories/inventory.repository.ts";
import { NotFoundException } from "../exceptions/HttpException.ts";

export const InventoryController = {
  async listCategories(_req: Request, res: Response) {
    res.json(await InventoryRepository.allCategories());
  },

  async createCategory(req: Request, res: Response) {
    const cat = await InventoryRepository.createCategory(req.body);
    res.status(201).json({ message: "Category created", data: cat });
  },

  async deleteCategory(req: Request, res: Response) {
    await InventoryRepository.deleteCategory(String(req.params.id));
    res.json({ message: "Category deleted", id: req.params.id });
  },

  async listItems(_req: Request, res: Response) {
    res.json(await InventoryRepository.allItems());
  },

  async getItem(req: Request, res: Response) {
    const item = await InventoryRepository.itemById(String(req.params.id));
    if (!item) throw new NotFoundException("Item not found");
    res.json(item);
  },

  async createItem(req: Request, res: Response) {
    const item = await InventoryRepository.createItem(req.body);
    res.status(201).json({ message: "Item created", data: item });
  },

  async updateItem(req: Request, res: Response) {
    const existing = await InventoryRepository.itemById(String(req.params.id));
    if (!existing) throw new NotFoundException("Item not found");
    const item = await InventoryRepository.updateItem(String(req.params.id), req.body);
    res.json({ message: "Item updated", data: item });
  },

  async deleteItem(req: Request, res: Response) {
    const existing = await InventoryRepository.itemById(String(req.params.id));
    if (!existing) throw new NotFoundException("Item not found");
    await InventoryRepository.deleteItem(String(req.params.id));
    res.json({ message: "Item deleted", id: req.params.id });
  },
};
