import type { Request, Response } from "express";
import { ProductRepository } from "../repositories/product.repository.ts";
import { NotFoundException } from "../exceptions/HttpException.ts";

export const ProductController = {
  async list(_req: Request, res: Response) {
    res.json(await ProductRepository.all());
  },

  async getById(req: Request, res: Response) {
    const product = await ProductRepository.byId(String(req.params.id));
    if (!product) throw new NotFoundException("Product not found");
    res.json(product);
  },

  async create(req: Request, res: Response) {
    const product = await ProductRepository.create(req.body);
    res.status(201).json({ message: "Product created", data: product });
  },

  async update(req: Request, res: Response) {
    const existing = await ProductRepository.byId(String(req.params.id));
    if (!existing) throw new NotFoundException("Product not found");
    const product = await ProductRepository.update(String(req.params.id), req.body);
    res.json({ message: "Product updated", data: product });
  },

  async delete(req: Request, res: Response) {
    const existing = await ProductRepository.byId(String(req.params.id));
    if (!existing) throw new NotFoundException("Product not found");
    await ProductRepository.delete(String(req.params.id));
    res.json({ message: "Product deleted", id: req.params.id });
  },
};
