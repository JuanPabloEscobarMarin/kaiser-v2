import { UserRepository } from "../repositories/user.repository.ts";
import { hashPassword, verifyPassword } from "../lib/password.ts";
import { signToken, type JwtPayload } from "../lib/jwt.ts";
import { prisma } from "../lib/prisma.ts";
import {
  ConflictException,
  HttpException,
  NotFoundException,
} from "../exceptions/HttpException.ts";
import type { LoginInput } from "../validators/auth.validators.ts";
import type {
  ChangePasswordInput,
  UpdateProfileInput,
} from "../validators/profile.validators.ts";

const publicUser = (u: {
  id: string;
  username: string;
  role: "ADMIN" | "CLIENT" | "EMPLOYEE";
  avatarSlug?: string | null;
}) => ({
  id: u.id,
  username: u.username,
  role: u.role,
  avatarSlug: u.avatarSlug ?? null,
});

export const AuthService = {
  async login(data: LoginInput) {
    const user = await UserRepository.byUsername(data.username);
    if (!user) throw new HttpException("Credenciales inválidas", 401);

    const valid = await verifyPassword(data.password, user.password);
    if (!valid) throw new HttpException("Credenciales inválidas", 401);

    const payload: JwtPayload = { userId: user.id, role: user.role };
    if (user.role === "EMPLOYEE") {
      const emp = await prisma.employee.findFirst({ where: { userId: user.id } });
      if (emp) payload.employeeId = emp.id;
    }

    const token = await signToken(payload);
    return { token, user: publicUser(user) };
  },

  async getProfile(userId: string) {
    const user = await UserRepository.byId(userId);
    if (!user) throw new NotFoundException("Usuario no encontrado");
    return publicUser(user);
  },

  async updateProfile(userId: string, data: UpdateProfileInput) {
    const current = await UserRepository.byId(userId);
    if (!current) throw new NotFoundException("Usuario no encontrado");

    if (data.username && data.username !== current.username) {
      const taken = await UserRepository.byUsername(data.username);
      if (taken && taken.id !== userId) {
        throw new ConflictException("El nombre de usuario ya está en uso");
      }
    }

    const update: { username?: string; avatarSlug?: string | null } = {};
    if (data.username !== undefined) update.username = data.username;
    if (data.avatarSlug !== undefined) update.avatarSlug = data.avatarSlug;

    const updated = await UserRepository.update(userId, update);
    return publicUser(updated);
  },

  async changePassword(userId: string, data: ChangePasswordInput) {
    const user = await UserRepository.byIdWithPassword(userId);
    if (!user) throw new NotFoundException("Usuario no encontrado");

    const valid = await verifyPassword(data.currentPassword, user.password);
    if (!valid) throw new HttpException("Current password is incorrect", 401);

    const hashed = await hashPassword(data.newPassword);
    await UserRepository.update(userId, { password: hashed });
    return { message: "Password updated" };
  },
};
