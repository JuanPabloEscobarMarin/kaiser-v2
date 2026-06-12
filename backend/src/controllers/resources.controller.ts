import type { Request, Response } from "express";
import { ResourcesService } from "../services/resources.service.ts";

export const ResourcesController = {
  async getImage(req: Request, res: Response) {
    const { stream, contentType } = await ResourcesService.getImage(String(req.params.slug));
    res.setHeader("Content-Type", contentType);
    stream.pipe(res);
  },

  async upload(req: Request, res: Response) {
    const data = await ResourcesService.storeImage(req.file);
    res.status(201).json({ message: "Image uploaded", ...data });
  },
};
