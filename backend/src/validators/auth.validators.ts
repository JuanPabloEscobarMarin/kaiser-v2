import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1, "username is required"),
  password: z.string().min(1, "password is required"),
});

export const registerSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6, "password must be at least 6 characters"),
  phone: z.string().min(7).max(20),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
