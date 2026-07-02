import type { NextFunction, Request, Response } from "express";
import { verifyToken, type JwtPayload } from "../lib/jwt.ts";
import { ForbiddenException, HttpException } from "../exceptions/HttpException.ts";

declare global {
  namespace Express {
    interface Request {
      auth?: JwtPayload;
    }
  }
}

/** Verifica la cookie y devuelve el payload, o lanza 401. */
const authenticate = async (req: Request): Promise<JwtPayload> => {
  const token = req.cookies?.jwt_token;
  if (!token) throw new HttpException("No autorizado", 401);
  try {
    return await verifyToken(token);
  } catch {
    throw new HttpException("No autorizado", 401);
  }
};

export const requireAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  req.auth = await authenticate(req);
  next();
};

/**
 * Populates `req.auth` when a valid token is present, but never rejects.
 * Use on endpoints that are public yet want to tailor their response for an
 * authenticated caller (e.g. exposing sensitive fields only to admins).
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const token = req.cookies?.jwt_token;
  if (token) {
    try {
      req.auth = await verifyToken(token);
    } catch {
      /* ignore invalid/expired tokens — treat as anonymous */
    }
  }
  next();
};

export const requireAdmin = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  req.auth = await authenticate(req);
  if (req.auth.role !== "ADMIN") {
    throw new ForbiddenException("Forbidden: admin only");
  }
  next();
};

export const requireEmployee = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  req.auth = await authenticate(req);
  if (req.auth.role !== "EMPLOYEE") {
    throw new ForbiddenException("Forbidden: employee only");
  }
  next();
};
