import { z } from "zod";
import { optionalEmail, optionalBirthDate } from "./common.ts";

export const customerSchema = z.object({
  fullName: z.string().min(2).max(100),
  phone: z.string().min(7).max(20),
  email: optionalEmail,
  birthDate: optionalBirthDate,
});

export type CustomerInput = z.infer<typeof customerSchema>;
