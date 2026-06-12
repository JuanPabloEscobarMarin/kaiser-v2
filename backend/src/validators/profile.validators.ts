import { z } from "zod";

export const updateProfileSchema = z
  .object({
    username: z.string().min(3).max(50).optional(),
    avatarSlug: z.string().max(200).nullable().optional(),
  })
  .refine(
    (data) => data.username !== undefined || data.avatarSlug !== undefined,
    { message: "Provide at least one field to update" },
  );

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
