import { z } from "zod";

/** Fecha-hora ISO en string. Compartido por todos los validators. */
export const isoDate = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), "Invalid ISO datetime");
