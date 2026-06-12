import type { NextFunction, Request, Response } from "express";
import { z, type ZodSchema } from "zod";
import { HttpException } from "../exceptions/HttpException.ts";

type Source = "body" | "params" | "query";

export const validate =
  (schema: ZodSchema, source: Source = "body") =>
  (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const issues = result.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      throw new HttpException(`Validation failed: ${issues}`, 400);
    }
    // Express 5 makes `req.query` and `req.params` read-only getters,
    // so we only mutate `body` (which is safe). Validated query/params
    // pass through untouched, since Zod has already proven they parse.
    if (source === "body") req.body = result.data;
    next();
  };

export const idParamSchema = z.object({
  id: z.string().uuid("Invalid uuid"),
});
