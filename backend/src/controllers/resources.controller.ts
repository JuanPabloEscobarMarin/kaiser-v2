import type { Request, Response } from "express";
import { ResourcesService } from "../services/resources.service.ts";

// Los uploads reales usan slug uuid y nunca se sobreescriben (re-subir genera
// un slug nuevo), así que su contenido es inmutable. Los slugs sin uuid
// (imágenes de seed) pueden cambiar al re-seedear: cache corto.
const UUID_SLUG =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z0-9]+$/i;

export const ResourcesController = {
  async getImage(req: Request, res: Response) {
    const slug = String(req.params.slug);
    const { stream, contentType } = await ResourcesService.getImage(slug);
    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Cache-Control",
      UUID_SLUG.test(slug)
        ? "public, max-age=31536000, immutable"
        : "public, max-age=3600",
    );
    stream.pipe(res);
  },

  async upload(req: Request, res: Response) {
    const data = await ResourcesService.storeImage(req.file);
    res.status(201).json({ message: "Image uploaded", ...data });
  },
};
