import type { NextFunction, Request, Response } from "express";
import { HttpException } from "../exceptions/HttpException.ts";
import { env } from "../config/env.ts";

export const errorMiddleware = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (error instanceof HttpException) {
    return res.status(error.status).json({ error: error.message });
  }

  if (env.NODE_ENV !== "test") {
    console.error("Unhandled error:", error);
  }

  const message =
    error instanceof Error ? error.message : "Internal server error";
  return res.status(500).json({ error: message });
};
