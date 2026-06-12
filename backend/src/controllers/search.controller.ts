import type { Request, Response } from "express";
import { SearchService } from "../services/search.service.ts";
import { BadRequestException } from "../exceptions/HttpException.ts";

export const SearchController = {
  async search(req: Request, res: Response) {
    // ?q[]=a&q[]=b produce un array; sin este check, .replace lanza y da 500.
    const rawParam = req.query.q;
    const raw = typeof rawParam === "string" ? rawParam : "";
    const q = raw.replace(/\+/g, " ").trim();

    if (q.length < 2) {
      throw new BadRequestException("Query must be at least 2 characters");
    }

    const results = await SearchService.search(q);
    res.json({ query: q, total: results.length, results });
  },
};
