import { SignJWT, jwtVerify } from "jose";
import { env } from "../config/env.ts";

const secret = new TextEncoder().encode(env.JWT_SECRET);

export interface JwtPayload {
  userId: string;
  role: "CLIENT" | "ADMIN" | "EMPLOYEE";
  employeeId?: string;
}

export const signToken = async (payload: JwtPayload) =>
  new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(secret);

export const verifyToken = async (token: string): Promise<JwtPayload> => {
  const { payload } = await jwtVerify(token, secret);
  const result: JwtPayload = {
    userId: payload.userId as string,
    role: payload.role as "CLIENT" | "ADMIN" | "EMPLOYEE",
  };
  // Only attach employeeId when present (exactOptionalPropertyTypes forbids
  // assigning an explicit `undefined` to an optional property).
  if (payload.employeeId) result.employeeId = payload.employeeId as string;
  return result;
};
