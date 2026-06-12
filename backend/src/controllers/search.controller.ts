import type { Request, Response } from "express";
import { SearchService } from "../services/search.service.ts";
import { BadRequestException } from "../exceptions/HttpException.ts";

export const SearchController = {
  async search(req: Request, res: Response) {
    const raw = (req.query.q as string | undefined) ?? "";
    const q = raw.replace(/\+/g, " ").trim();

    if (q.length < 2) {
      throw new BadRequestException("Query must be at least 2 characters");
    }

    const results = await SearchService.search(q);
    res.json({ query: q, total: results.length, results });
  },
};
