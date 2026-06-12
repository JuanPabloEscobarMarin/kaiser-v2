import { SignJWT, jwtVerify, decodeJwt } from "jose";
import { randomUUID } from "node:crypto";
import { env } from "../config/env.ts";

const secret = new TextEncoder().encode(env.JWT_SECRET);

export interface JwtPayload {
  userId: string;
  role: "CLIENT" | "ADMIN" | "EMPLOYEE";
  employeeId?: string;
}

/**
 * Denylist de tokens revocados (logout). En memoria: suficiente para una
 * instancia única; cada entrada expira sola cuando el token habría expirado.
 * Si la app escala a varias instancias, mover a Redis o similar.
 */
const revoked = new Map<string, number>(); // jti → exp (ms)

const purgeExpired = () => {
  const now = Date.now();
  for (const [jti, exp] of revoked) {
    if (exp <= now) revoked.delete(jti);
  }
};
setInterval(purgeExpired, 10 * 60 * 1000).unref();

export const signToken = async (payload: JwtPayload) =>
  new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setJti(randomUUID())
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(secret);

export const verifyToken = async (token: string): Promise<JwtPayload> => {
  const { payload } = await jwtVerify(token, secret);
  if (payload.jti && revoked.has(payload.jti)) {
    throw new Error("Token revoked");
  }
  const result: JwtPayload = {
    userId: payload.userId as string,
    role: payload.role as "CLIENT" | "ADMIN" | "EMPLOYEE",
  };
  // Only attach employeeId when present (exactOptionalPropertyTypes forbids
  // assigning an explicit `undefined` to an optional property).
  if (payload.employeeId) result.employeeId = payload.employeeId as string;
  return result;
};

/** Invalida un token (logout) hasta su expiración natural. */
export const revokeToken = (token: string): void => {
  try {
    const { jti, exp } = decodeJwt(token);
    if (jti && exp) revoked.set(jti, exp * 1000);
  } catch {
    /* token ilegible: nada que revocar */
  }
};
