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

    if (!data.username?.trim() || !data.password) {
      throw new HttpException("El usuario y la contraseña son requeridos", 400);
    }

    const user = await UserRepository.byUsername(data.username);
    if (!user) throw new HttpException("Credenciales inválidas", 401);

    const valid = await verifyPassword(data.password, user.password);
    if (!valid) throw new HttpException("Credenciales inválidas", 401);

    const payload: JwtPayload = { userId: user.id, role: user.role };
    if (user.role === "EMPLOYEE") {
      const emp = await prisma.employee.findFirst({ where: { userId: user.id } });
      
      if (!emp || !emp.state) {
        throw new HttpException("El perfil de empleado no está disponible o está inactivo", 403);
      }
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

    if (data.username === undefined && data.avatarSlug === undefined) {
      throw new HttpException("Debes enviar al menos un campo para actualizar", 400);
    }

    if (data.username !== undefined && data.username.trim().length === 0) {
      throw new HttpException("El nombre de usuario no puede estar vacío", 400);
    }

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
    if (!data.newPassword || data.newPassword.trim().length < 6) {
      throw new HttpException("La nueva contraseña debe tener al menos 6 caracteres", 400);
    }

    if (data.currentPassword === data.newPassword) {
      throw new HttpException("La nueva contraseña no puede ser idéntica a la actual", 400);
    }
    const user = await UserRepository.byIdWithPassword(userId);
    if (!user) throw new NotFoundException("Usuario no encontrado");

    const valid = await verifyPassword(data.currentPassword, user.password);
    if (!valid) throw new HttpException("Current password is incorrect", 401);

    const hashed = await hashPassword(data.newPassword);
    await UserRepository.update(userId, { password: hashed });
    return { message: "Password updated" };
  },
};
