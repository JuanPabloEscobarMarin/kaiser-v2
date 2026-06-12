import type { Request, Response } from "express";
import { SettingsService } from "../services/settings.service.ts";

export const SettingsController = {
  async get(_req: Request, res: Response) {
    res.json(await SettingsService.get());
  },

  async update(req: Request, res: Response) {
    const data = await SettingsService.update(req.body);
    res.json({ message: "Settings updated", data });
  },
};
