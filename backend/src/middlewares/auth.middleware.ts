import type { NextFunction, Request, Response } from "express";
import { verifyToken, type JwtPayload } from "../lib/jwt.ts";
import { HttpException } from "../exceptions/HttpException.ts";

declare global {
  namespace Express {
    interface Request {
      auth?: JwtPayload;
    }
  }
}

export const requireAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const token = req.cookies?.jwt_token;
  if (!token) throw new HttpException("Unauthorized", 401);

  try {
    req.auth = await verifyToken(token);
    next();
  } catch {
    throw new HttpException("Unauthorized", 401);
  }
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
  res: Response,
  next: NextFunction,
) => {
  await requireAuth(req, res, () => {
    if (req.auth?.role !== "ADMIN") {
      throw new HttpException("Forbidden: admin only", 403);
    }
    next();
  });
};

export const requireEmployee = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  await requireAuth(req, res, () => {
    if (req.auth?.role !== "EMPLOYEE") {
      throw new HttpException("Forbidden: employee only", 403);
    }
    next();
  });
};
