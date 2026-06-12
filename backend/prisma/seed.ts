import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../generated/prisma/client.ts";

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const BUSINESS_OPEN_HOUR = 9;
const BUSINESS_CLOSE_HOUR = 18;

const startOfDayUtc = (offsetDays: number) => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d;
};

const at = (offsetDays: number, hour: number, minutes = 0) => {
  const d = startOfDayUtc(offsetDays);
  d.setUTCHours(hour, minutes, 0, 0);
  return d;
};

async function main() {
  // El seed BORRA toda la base. Jamás debe correr contra producción por
  // accidente; exige confirmación explícita vía SEED_FORCE=1.
  if (process.env.NODE_ENV === "production" && process.env.SEED_FORCE !== "1") {
    console.error("❌ NODE_ENV=production: seed bloqueado. Usa SEED_FORCE=1 si de verdad quieres borrar y resembrar la base.");
    process.exit(1);
  }

  console.log("🌱 Seeding database...");

  console.log("  → Limpiando datos existentes");
  await prisma.booking.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.service.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  console.log("  → Creando usuarios admin");
  // Credencial configurable: nunca dejar admin123 en una base real.
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin123";
  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.warn("  ⚠️  Usando contraseña de admin por defecto (solo dev). Define SEED_ADMIN_PASSWORD para entornos reales.");
  }
  const adminHash = await bcrypt.hash(adminPassword, 10);
  await prisma.user.create({
    data: {
      username: "admin",
      password: adminHash,
      phone: "3000000000",
      role: "ADMIN",
    },
  });

  console.log("  → Creando clientes");
  const customers = await Promise.all([
    prisma.customer.create({
      data: { fullName: "Juan Pérez", phone: "3001111111", identification: "1010101010" },
    }),
    prisma.customer.create({
      data: { fullName: "María García", phone: "3002222222", identification: "1020202020" },
    }),
    prisma.customer.create({
      data: { fullName: "Carlos López", phone: "3003333333", identification: "1030303030" },
    }),
    prisma.customer.create({
      data: { fullName: "Ana Rodríguez", phone: "3004444444", identification: "1040404040" },
    }),
    prisma.customer.create({
      data: { fullName: "Sofía Martínez", phone: "3005555555", identification: "1050505050" },
    }),
  ]);

  console.log("  → Creando servicios");
  const services = await Promise.all([
    prisma.service.create({
      data: {
        name: "Corte clásico",
        description: "Corte de cabello tradicional con tijera y máquina",
        price: "30000",
        duration: 30,
      },
    }),
    prisma.service.create({
      data: {
        name: "Corte premium",
        description: "Corte personalizado + lavado + peinado profesional",
        price: "45000",
        duration: 45,
      },
    }),
    prisma.service.create({
      data: {
        name: "Arreglo de barba",
        description: "Perfilado, recorte y aceite hidratante",
        price: "20000",
        duration: 30,
      },
    }),
    prisma.service.create({
      data: {
        name: "Afeitado clásico",
        description: "Afeitado a navaja con toalla caliente",
        price: "25000",
        duration: 30,
      },
    }),
    prisma.service.create({
      data: {
        name: "Combo corte + barba",
        description: "Nuestro combo más pedido — ahorra al pedirlos juntos",
        price: "45000",
        duration: 60,
        discount: "5000",
      },
    }),
    prisma.service.create({
      data: {
        name: "Tinte para cabello",
        description: "Aplicación de tinte profesional",
        price: "60000",
        duration: 90,
      },
    }),
    prisma.service.create({
      data: {
        name: "Tratamiento capilar",
        description: "Hidratación profunda y masaje capilar",
        price: "40000",
        duration: 45,
      },
    }),
  ]);

  console.log("  → Creando empleados");
  const employees = await Promise.all([
    prisma.employee.create({
      data: { fullName: "Carlos Pérez", phone: "3010000001", salary: "1800000" },
    }),
    prisma.employee.create({
      data: { fullName: "Andrés Gómez", phone: "3010000002", salary: "1600000" },
    }),
    prisma.employee.create({
      data: { fullName: "Sebastián Ruiz", phone: "3010000003", salary: "1700000" },
    }),
    prisma.employee.create({
      data: { fullName: "Daniel Martínez", phone: "3010000004", salary: "1500000" },
    }),
  ]);

  console.log("  → Creando citas");

  const corte = services[0]!;
  const cortePremium = services[1]!;
  const barba = services[2]!;
  const afeitado = services[3]!;
  const combo = services[4]!;
  const tinte = services[5]!;

  const carlos = employees[0]!;
  const andres = employees[1]!;
  const sebastian = employees[2]!;
  const daniel = employees[3]!;

  const juan = customers[0]!;
  const maria = customers[1]!;
  const carlosCust = customers[2]!;
  const ana = customers[3]!;
  const sofia = customers[4]!;

  const minutesAfter = (start: Date, mins: number) =>
    new Date(start.getTime() + mins * 60_000);

  type AppointmentSeed = {
    serviceId: string;
    employeeId: string;
    scheduledAt: Date;
    duration: number;
    state?: "SCHEDULED" | "FINISHED" | "CANCELLED";
    customerId: string;
  };

  const seedAppointments: AppointmentSeed[] = [
    // ───── HOY ─────
    { serviceId: corte.id, employeeId: carlos.id, scheduledAt: at(0, 9), duration: corte.duration, state: "FINISHED", customerId: juan.id },
    { serviceId: barba.id, employeeId: carlos.id, scheduledAt: at(0, 10), duration: barba.duration, state: "FINISHED", customerId: maria.id },
    { serviceId: combo.id, employeeId: andres.id, scheduledAt: at(0, 9, 30), duration: combo.duration, state: "FINISHED", customerId: sofia.id },
    { serviceId: cortePremium.id, employeeId: sebastian.id, scheduledAt: at(0, 11), duration: cortePremium.duration, state: "SCHEDULED", customerId: ana.id },
    { serviceId: corte.id, employeeId: daniel.id, scheduledAt: at(0, 14), duration: corte.duration, state: "SCHEDULED", customerId: carlosCust.id },
    { serviceId: afeitado.id, employeeId: carlos.id, scheduledAt: at(0, 15), duration: afeitado.duration, state: "SCHEDULED", customerId: juan.id },
    { serviceId: tinte.id, employeeId: andres.id, scheduledAt: at(0, 13), duration: tinte.duration, state: "CANCELLED", customerId: maria.id },

    // ───── MAÑANA ─────
    { serviceId: corte.id, employeeId: carlos.id, scheduledAt: at(1, 9), duration: corte.duration, state: "SCHEDULED", customerId: juan.id },
    { serviceId: combo.id, employeeId: andres.id, scheduledAt: at(1, 10), duration: combo.duration, state: "SCHEDULED", customerId: sofia.id },
    { serviceId: cortePremium.id, employeeId: sebastian.id, scheduledAt: at(1, 11, 30), duration: cortePremium.duration, state: "SCHEDULED", customerId: carlosCust.id },
    { serviceId: barba.id, employeeId: daniel.id, scheduledAt: at(1, 14), duration: barba.duration, state: "SCHEDULED", customerId: ana.id },

    // ───── EN 2 DIAS ─────
    { serviceId: tinte.id, employeeId: andres.id, scheduledAt: at(2, 9), duration: tinte.duration, state: "SCHEDULED", customerId: maria.id },
    { serviceId: combo.id, employeeId: carlos.id, scheduledAt: at(2, 11), duration: combo.duration, state: "SCHEDULED", customerId: juan.id },
    { serviceId: corte.id, employeeId: sebastian.id, scheduledAt: at(2, 15), duration: corte.duration, state: "SCHEDULED", customerId: ana.id },

    // ───── HISTORIAL ─────
    { serviceId: corte.id, employeeId: carlos.id, scheduledAt: at(-1, 9), duration: corte.duration, state: "FINISHED", customerId: sofia.id },
    { serviceId: combo.id, employeeId: andres.id, scheduledAt: at(-1, 10), duration: combo.duration, state: "FINISHED", customerId: maria.id },
    { serviceId: barba.id, employeeId: sebastian.id, scheduledAt: at(-1, 14), duration: barba.duration, state: "FINISHED", customerId: juan.id },
    { serviceId: cortePremium.id, employeeId: carlos.id, scheduledAt: at(-3, 11), duration: cortePremium.duration, state: "FINISHED", customerId: carlosCust.id },
    { serviceId: combo.id, employeeId: andres.id, scheduledAt: at(-3, 14), duration: combo.duration, state: "FINISHED", customerId: ana.id },
  ];

  for (const a of seedAppointments) {
    const start = a.scheduledAt;
    const end = minutesAfter(start, a.duration);
    const inBusinessHours =
      start.getUTCHours() >= BUSINESS_OPEN_HOUR &&
      end.getUTCHours() <= BUSINESS_CLOSE_HOUR;
    if (!inBusinessHours) continue;

    await prisma.appointment.create({
      data: {
        serviceId: a.serviceId,
        employeeId: a.employeeId,
        scheduledAt: start,
        endsAt: end,
        state: a.state ?? "SCHEDULED",
        booking: { create: { customerId: a.customerId } },
      },
    });
  }

  const counts = {
    users: await prisma.user.count(),
    customers: await prisma.customer.count(),
    services: await prisma.service.count(),
    employees: await prisma.employee.count(),
    appointments: await prisma.appointment.count(),
    bookings: await prisma.booking.count(),
  };

  console.log("\n✅ Seed complete");
  console.log(counts);
  console.log("\nUsuario admin: admin / admin123");
  console.log("Cédula de prueba para reservar: 1010101010 (Juan Pérez)");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
