/**
 * Backfill de snapshots (una sola vez tras el cambio de schema; idempotente,
 * seguro de re-correr — solo toca filas con el campo en NULL):
 *
 *  1. SaleItem.unitCost  ← Product.saleCost actual (ventas pre-snapshot).
 *  2. Appointment.commissionAmount ← comisión sobre lo cobrado con las tasas
 *     ACTUALES de EmployeeService (best-effort: las tasas históricas no
 *     existen; es la misma cifra que los reportes mostraban hasta ahora,
 *     pero congelada para que deje de cambiar).
 *
 * Uso: npm run backfill:snapshots  (respeta el .env activo — verificar con
 * npm run db:current antes de correrlo contra Supabase).
 *
 * Nota: prisma/seed.ts crea citas FINISHED sin snapshot; en dev, re-correr
 * este script después del seed (o dejar que el fallback del cierre diario
 * las cubra).
 */
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";
import { PrismaClient } from "../generated/prisma/client.ts";
import { computeServiceCommission } from "../src/lib/commission.ts";

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function backfillSaleItemCosts() {
  const products = await prisma.product.findMany({
    select: { id: true, saleCost: true },
  });
  let updated = 0;
  for (const p of products) {
    const res = await prisma.saleItem.updateMany({
      where: { productId: p.id, unitCost: null },
      data: { unitCost: p.saleCost },
    });
    updated += res.count;
  }
  console.log(`SaleItem.unitCost: ${updated} filas actualizadas`);
}

async function backfillAppointmentCommissions() {
  const appts = await prisma.appointment.findMany({
    where: { state: "FINISHED", commissionAmount: null },
    include: { service: true, services: { include: { service: true } } },
  });
  const rateRows = await prisma.employeeService.findMany();
  const rates = new Map(
    rateRows.map((r) => [
      `${r.employeeId}:${r.serviceId}`,
      Number(r.commission),
    ]),
  );
  for (const a of appts) {
    const svcs =
      a.services.length > 0 ? a.services.map((x) => x.service) : [a.service];
    const map = new Map(
      svcs.map((s) => [s.id, rates.get(`${a.employeeId}:${s.id}`) ?? 0]),
    );
    const amount = computeServiceCommission(svcs, a.finalPrice, map);
    await prisma.appointment.update({
      where: { id: a.id },
      data: { commissionAmount: String(amount) },
    });
  }
  console.log(`Appointment.commissionAmount: ${appts.length} filas actualizadas`);
}

async function main() {
  await backfillSaleItemCosts();
  await backfillAppointmentCommissions();
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
