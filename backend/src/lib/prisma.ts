import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.ts";
import { env } from "../config/env.ts";

// En serverless (Vercel) cada instancia de la función mantiene su propio pool.
// Con el default (max 10) varias instancias concurrentes agotan el límite del
// pooler de Supabase y este rechaza conexiones (econnrefused / 08006). Limitamos
// a 1 conexión por instancia: el pooler de transacción de Supabase (puerto 6543)
// multiplexa, así que el throughput se mantiene sin saturar el límite.
const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL,
  max: 1,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 10_000,
});

export const prisma = new PrismaClient({ adapter });
