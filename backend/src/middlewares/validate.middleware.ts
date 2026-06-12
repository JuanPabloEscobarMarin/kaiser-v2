import type { NextFunction, Request, Response } from "express";
import { z, type ZodSchema } from "zod";
import { HttpException } from "../exceptions/HttpException.ts";

type Source = "body" | "params" | "query";

declare global {
  namespace Express {
    interface Request {
      /** Datos ya validados por Zod (con defaults/transforms aplicados). */
      validated?: Partial<Record<Exclude<Source, "body">, unknown>>;
    }
  }
}

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
    // so we only mutate `body` (which is safe). Para query/params, el
    // resultado parseado (con defaults/transforms de Zod aplicados) queda en
    // req.validated[source]; los controllers que necesiten transforms deben
    // leer de ahí, no de req.query/req.params crudos.
    if (source === "body") req.body = result.data;
    else {
      req.validated = { ...req.validated, [source]: result.data };
    }
    next();
  };

export const idParamSchema = z.object({
  id: z.string().uuid("Invalid uuid"),
});
