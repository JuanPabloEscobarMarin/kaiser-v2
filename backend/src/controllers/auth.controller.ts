import type { Request, Response } from "express";
import { AuthService } from "../services/auth.service.ts";
import { revokeToken } from "../lib/jwt.ts";
import { env } from "../config/env.ts";
import { HttpException } from "../exceptions/HttpException.ts";

const COOKIE_NAME = "jwt_token";
const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: env.NODE_ENV === "production",
  maxAge: 2 * 60 * 60 * 1000,
};

const requireAuth = (req: Request) => {
  if (!req.auth) throw new HttpException("No autorizado", 401);
  return req.auth;
};

export const AuthController = {
  async login(req: Request, res: Response) {
    const { token, user } = await AuthService.login(req.body);
    res.cookie(COOKIE_NAME, token, COOKIE_OPTS).json({
      message: "Login successful",
      user,
    });
  },

  logout(req: Request, res: Response) {
    // Revoca el JWT además de borrar la cookie: el token deja de ser válido
    // de inmediato aunque alguien lo haya copiado.
    const token = req.cookies?.[COOKIE_NAME];
    if (token) revokeToken(token);
    res.clearCookie(COOKIE_NAME).json({ message: "Logged out" });
  },

  async me(req: Request, res: Response) {
    const auth = requireAuth(req);
    const user = await AuthService.getProfile(auth.userId);
    res.json({ user });
  },

  async updateProfile(req: Request, res: Response) {
    const auth = requireAuth(req);
    const user = await AuthService.updateProfile(auth.userId, req.body);
    res.json({ message: "Profile updated", user });
  },

  async changePassword(req: Request, res: Response) {
    const auth = requireAuth(req);
    const result = await AuthService.changePassword(auth.userId, req.body);
    res.json(result);
  },
};
