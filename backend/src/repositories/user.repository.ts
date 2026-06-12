import { prisma } from "../lib/prisma.ts";
import type { Role } from "../../generated/prisma/enums.ts";

export interface CreateUserData {
  username: string;
  password: string;
  phone: string;
  role?: Role;
}

export interface UpdateUserData {
  username?: string;
  password?: string;
  avatarSlug?: string | null;
}

export const UserRepository = {
  all: () => prisma.user.findMany({ omit: { password: true } }),

  byId: (id: string) =>
    prisma.user.findUnique({ where: { id }, omit: { password: true } }),

  byIdWithPassword: (id: string) =>
    prisma.user.findUnique({ where: { id } }),

  byUsername: (username: string) =>
    prisma.user.findUnique({ where: { username } }),

  create: (data: CreateUserData) => prisma.user.create({ data }),

  update: (id: string, data: UpdateUserData) =>
    prisma.user.update({
      where: { id },
      data,
      omit: { password: true },
    }),
};
