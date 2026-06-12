import { z } from "zod";

export const customerSchema = z.object({
  fullName: z.string().min(2).max(100),
  phone: z.string().min(7).max(20),
  identification: z.string().min(5).max(20),
});

export type CustomerInput = z.infer<typeof customerSchema>;
