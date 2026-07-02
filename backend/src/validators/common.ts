import { z } from "zod";

/** Fecha-hora ISO en string. Compartido por todos los validators. */
export const isoDate = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), "Fecha y hora inválida");

/** Correo opcional: acepta vacío/nulo y lo normaliza a null. */
export const optionalEmail = z
  .union([
    z.string().email("Correo inválido").max(150),
    z.literal(""),
    z.null(),
    z.undefined(),
  ])
  .transform((v) => (v ? v : null));

/** Fecha de nacimiento opcional (AAAA-MM-DD) → Date | null. */
export const optionalBirthDate = z
  .union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida (usa AAAA-MM-DD)"),
    z.literal(""),
    z.null(),
    z.undefined(),
  ])
  .transform((v) => (v ? new Date(`${v}T00:00:00.000Z`) : null));
