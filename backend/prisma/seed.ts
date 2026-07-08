import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../generated/prisma/client.ts";

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const BUSINESS_OPEN_HOUR = 9;
const BUSINESS_CLOSE_HOUR = 19;

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

const minutesAfter = (start: Date, mins: number) =>
  new Date(start.getTime() + mins * 60_000);

/** Contenido del home temático de AB Hair Studio. */
const homeContent = {
  hero: {
    title: "AB Hair Studio — saca tu mejor versión",
    subtitle:
      "Color, corte y estilo en el corazón de Medellín. Reserva en línea en menos de un minuto, elige a tu estilista y tu horario.",
    primaryCta: "Reservar ahora",
    secondaryCta: "Ver servicios",
  },
  features: [
    {
      icon: "🎨",
      title: "Expertos en color",
      description: "Balayage, mechas y coloración con productos de alta gama.",
    },
    {
      icon: "✂️",
      title: "Cortes a tu medida",
      description: "Damas y caballeros — asesoría de imagen personalizada.",
    },
    {
      icon: "✨",
      title: "Productos premium",
      description: "Cuidamos tu cabello dentro y fuera del estudio.",
    },
  ],
  services: {
    title: "Nuestros servicios",
    subtitle: "Lo más pedido en el estudio",
  },
  howItWorks: {
    title: "¿Cómo funciona?",
    subtitle: "Reservar toma menos de un minuto",
    steps: [
      { title: "Elige tu servicio", description: "Corte, color, barba o tratamiento" },
      { title: "Estilista, día y hora", description: "Disponibilidad en tiempo real" },
      { title: "Confirma con tus datos", description: "Solo nombre, teléfono y cédula" },
    ],
  },
  team: {
    title: "Nuestro equipo",
    subtitle: "Estilistas y barberos profesionales",
  },
  contact: {
    title: "Visítanos",
    subtitle:
      "¿Tienes dudas antes de reservar? Escríbenos por WhatsApp y te ayudamos a elegir.",
    hoursTitle: "🕐 Horarios de atención",
    ctaButton: "Reservar mi cita",
  },
  finalCta: {
    title: "¿Lista o listo para un cambio?",
    subtitle: "Reserva hoy en AB Hair Studio, sin necesidad de crear cuenta.",
    button: "Reservar ahora",
  },
  testimonials: {
    title: "Lo que dicen nuestros clientes",
    subtitle: "Opiniones reales de quienes ya pasaron por el estudio",
    items: [
      {
        name: "Laura Gómez",
        text: "El balayage me quedó espectacular y la atención fue de 10. Reservar en línea fue rapidísimo.",
        rating: 5,
      },
      {
        name: "Carlos Restrepo",
        text: "Corte y barba impecables. Llegué a mi hora y pasé directo, sin filas.",
        rating: 5,
      },
      {
        name: "Valentina Ruiz",
        text: "Me asesoraron súper bien con el color. Volveré sin duda.",
        rating: 4,
      },
    ],
  },
  whatsappButton: { enabled: true },
};

async function main() {
  // El seed BORRA toda la base. Jamás debe correr contra producción por
  // accidente; exige confirmación explícita vía SEED_FORCE=1.
  if (process.env.NODE_ENV === "production" && process.env.SEED_FORCE !== "1") {
    console.error("❌ NODE_ENV=production: seed bloqueado. Usa SEED_FORCE=1 si de verdad quieres borrar y resembrar la base.");
    process.exit(1);
  }

  console.log("🌱 Seeding AB Hair Studio...");

  console.log("  → Limpiando datos existentes");
  await prisma.booking.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.employeeScheduleBlock.deleteMany();
  await prisma.employeeService.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.inventoryCategory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.service.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.businessSettings.deleteMany();

  console.log("  → Configuración del negocio");
  await prisma.businessSettings.create({
    data: {
      name: "AB Hair Studio",
      phone: "6041234567",
      whatsapp: "573001234567",
      email: "hola@abhairstudio.com",
      address: "Cra. 43A #18-95, El Poblado, Medellín",
      openTimeWeekday: "09:00",
      closeTimeWeekday: "19:00",
      closedWeekday: false,
      openTimeSaturday: "09:00",
      closeTimeSaturday: "18:00",
      closedSaturday: false,
      openTimeSunday: "10:00",
      closeTimeSunday: "16:00",
      closedSunday: true,
      heroImageSlug: "seed-hero.jpg",
      logoSlug: "seed-logo.png",
      primaryColor: "#6d28d9",
      homeContent,
    },
  });

  console.log("  → Usuario admin");
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin123";
  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.warn("  ⚠️  Usando contraseña de admin por defecto (solo dev). Define SEED_ADMIN_PASSWORD para entornos reales.");
  }
  await prisma.user.create({
    data: {
      username: "admin",
      password: await bcrypt.hash(adminPassword, 10),
      phone: "3000000000",
      role: "ADMIN",
    },
  });

  console.log("  → Cuenta de empleado (portal)");
  const employeePassword = process.env.SEED_EMPLOYEE_PASSWORD ?? "andrea123";
  const andreaUser = await prisma.user.create({
    data: {
      username: "andrea",
      password: await bcrypt.hash(employeePassword, 10),
      phone: "3015550010",
      role: "EMPLOYEE",
      avatarSlug: "seed-emp-andrea.jpg",
    },
  });

  console.log("  → Clientes");
  const customers = await Promise.all(
    [
      { fullName: "Laura Gómez", phone: "3001111111", email: "laura.gomez@example.com" },
      { fullName: "Mateo Restrepo", phone: "3002222222", email: "mateo.restrepo@example.com" },
      { fullName: "Valeria Cardona", phone: "3003333333", email: "valeria.cardona@example.com" },
      { fullName: "Santiago Mejía", phone: "3004444444", email: "santiago.mejia@example.com" },
      { fullName: "Isabella Vélez", phone: "3005555555", email: "isabella.velez@example.com" },
      { fullName: "Juan David Ríos", phone: "3006666666", email: "juandavid.rios@example.com" },
      { fullName: "Sara Ramírez", phone: "3007777777", email: "sara.ramirez@example.com" },
      { fullName: "Tomás Arango", phone: "3008888888", email: "tomas.arango@example.com" },
    ].map((data) => prisma.customer.create({ data })),
  );

  console.log("  → Servicios");
  const serviceSpecs = [
    { name: "Corte de dama", description: "Corte, lavado y secado con asesoría de estilo", price: "45000", duration: 45, urlImage: "seed-svc-corte-dama.jpg" },
    { name: "Corte caballero", description: "Corte clásico o moderno a máquina y tijera", price: "30000", duration: 30, urlImage: "seed-svc-corte-caballero.jpg" },
    { name: "Barba y perfilado", description: "Perfilado, recorte y aceite hidratante", price: "22000", duration: 30, urlImage: "seed-svc-barba.jpg" },
    { name: "Afeitado clásico a navaja", description: "Afeitado a navaja con toalla caliente", price: "28000", duration: 30, urlImage: "seed-svc-afeitado.jpg" },
    { name: "Coloración / tinte", description: "Aplicación de color profesional de raíz a puntas", price: "90000", duration: 90, urlImage: "seed-svc-color.jpg" },
    { name: "Mechas / balayage", description: "Iluminación y matiz para un look natural", price: "150000", duration: 120, urlImage: "seed-svc-mechas.jpg" },
    { name: "Peinado y recogido", description: "Peinado para eventos, ondas o recogido", price: "60000", duration: 60, urlImage: "seed-svc-peinado.jpg" },
    { name: "Diseño de barba premium", description: "Diseño, perfilado con navaja y mascarilla", price: "35000", duration: 45, discount: "5000", urlImage: "seed-svc-barba-premium.jpg" },
  ];
  const services = await Promise.all(
    serviceSpecs.map((s) => prisma.service.create({ data: s })),
  );
  const [corteDama, corteCab, barba, afeitado, color, mechas, peinado, barbaPrem] = services;

  console.log("  → Empleados");
  // Cada empleado se crea con sus servicios + comisión (EmployeeService).
  const employees = await Promise.all([
    prisma.employee.create({
      data: {
        fullName: "Andrea Bermúdez",
        phone: "3015550001",
        urlImage: "seed-emp-andrea.jpg",
        userId: andreaUser.id,
        services: {
          create: [
            { serviceId: corteDama!.id, commission: 30 },
            { serviceId: color!.id, commission: 25 },
            { serviceId: mechas!.id, commission: 25 },
            { serviceId: peinado!.id, commission: 30 },
          ],
        },
      },
    }),
    prisma.employee.create({
      data: {
        fullName: "Bryan Acosta",
        phone: "3015550002",
        urlImage: "seed-emp-bryan.jpg",
        services: {
          create: [
            { serviceId: corteCab!.id, commission: 20 },
            { serviceId: barba!.id, commission: 25 },
            { serviceId: afeitado!.id, commission: 25 },
            { serviceId: barbaPrem!.id, commission: 25 },
          ],
        },
      },
    }),
    prisma.employee.create({
      data: {
        fullName: "Camila Ortiz",
        phone: "3015550003",
        urlImage: "seed-emp-camila.jpg",
        services: {
          create: [
            { serviceId: corteDama!.id, commission: 25 },
            { serviceId: color!.id, commission: 22 },
            { serviceId: peinado!.id, commission: 28 },
            { serviceId: mechas!.id, commission: 22 },
          ],
        },
      },
    }),
    prisma.employee.create({
      data: {
        fullName: "Diego Salazar",
        phone: "3015550004",
        urlImage: "seed-emp-diego.jpg",
        services: {
          create: [
            { serviceId: corteCab!.id, commission: 20 },
            { serviceId: barba!.id, commission: 22 },
            { serviceId: afeitado!.id, commission: 22 },
          ],
        },
      },
    }),
    prisma.employee.create({
      data: {
        fullName: "Valentina Ríos",
        phone: "3015550005",
        urlImage: "seed-emp-valentina.jpg",
        services: {
          create: [
            { serviceId: color!.id, commission: 28 },
            { serviceId: mechas!.id, commission: 28 },
            { serviceId: corteDama!.id, commission: 25 },
            { serviceId: peinado!.id, commission: 28 },
          ],
        },
      },
    }),
  ]);
  const [andrea, bryan, camila, diego, valentina] = employees;

  console.log("  → Inventario");
  const [catColor, catCuidado, catHerr, catDesech] = await Promise.all([
    prisma.inventoryCategory.create({ data: { name: "Coloración" } }),
    prisma.inventoryCategory.create({ data: { name: "Cuidado capilar" } }),
    prisma.inventoryCategory.create({ data: { name: "Herramientas" } }),
    prisma.inventoryCategory.create({ data: { name: "Desechables" } }),
  ]);
  await Promise.all(
    [
      { name: "Tinte rubio 7.0", quantity: "12", unit: "tubo", minStock: "5", cost: "18000", categoryId: catColor.id },
      { name: "Tinte castaño 4.0", quantity: "8", unit: "tubo", minStock: "5", cost: "18000", categoryId: catColor.id },
      { name: "Agua oxigenada 20vol", quantity: "6", unit: "litro", minStock: "3", cost: "12000", categoryId: catColor.id },
      { name: "Shampoo neutro 5L", quantity: "4", unit: "garrafa", minStock: "2", cost: "45000", categoryId: catCuidado.id },
      { name: "Acondicionador 5L", quantity: "3", unit: "garrafa", minStock: "2", cost: "48000", categoryId: catCuidado.id },
      { name: "Tijeras profesionales", quantity: "6", unit: "unidad", minStock: "2", cost: "120000", categoryId: catHerr.id },
      { name: "Máquina de corte", quantity: "4", unit: "unidad", minStock: "2", cost: "250000", categoryId: catHerr.id },
      { name: "Capas de corte", quantity: "10", unit: "unidad", minStock: "4", cost: "30000", categoryId: catHerr.id },
      { name: "Toallas", quantity: "50", unit: "unidad", minStock: "20", cost: "2500", categoryId: catDesech.id },
      // Por debajo del mínimo a propósito → muestra alerta de stock bajo.
      { name: "Guantes de nitrilo", quantity: "3", unit: "caja", minStock: "5", cost: "15000", categoryId: catDesech.id },
    ].map((data) => prisma.inventoryItem.create({ data })),
  );

  console.log("  → Productos");
  const productSpecs = [
    { name: "Shampoo fortificante 300ml", description: "Fortalece y reduce la caída", price: 35000, stock: 24, commission: 10, urlImage: "seed-prod-shampoo.jpg" },
    { name: "Acondicionador hidratante 300ml", description: "Hidratación profunda diaria", price: 38000, stock: 18, commission: 10, urlImage: "seed-prod-acond.jpg" },
    { name: "Sérum capilar reparador", description: "Repara puntas abiertas y aporta brillo", price: 52000, stock: 15, commission: 12, urlImage: "seed-prod-serum.jpg" },
    { name: "Aceite de argán 100ml", description: "Nutrición y antifrizz", price: 48000, stock: 20, commission: 12, urlImage: "seed-prod-aceite.jpg" },
    { name: "Crema para peinar", description: "Define y controla el cabello", price: 28000, stock: 30, commission: 8, urlImage: "seed-prod-crema.jpg" },
    { name: "Kit de cuidado completo", description: "Shampoo + acondicionador + sérum", price: 120000, stock: 8, commission: 15, urlImage: "seed-prod-kit.jpg" },
    { name: "Tónico capilar", description: "Estimula el crecimiento", price: 42000, stock: 12, commission: 10, urlImage: "seed-prod-tonico.jpg" },
    { name: "Cera modeladora mate", description: "Fijación fuerte, acabado mate", price: 32000, stock: 25, commission: 8, urlImage: "seed-prod-cera.jpg" },
  ];
  const products: { id: string; price: number; commission: number }[] = [];
  for (const spec of productSpecs) {
    const created = await prisma.product.create({
      data: {
        name: spec.name,
        description: spec.description,
        price: String(spec.price),
        stock: spec.stock,
        commission: spec.commission,
        urlImage: spec.urlImage,
      },
    });
    products.push({ id: created.id, price: spec.price, commission: spec.commission });
  }

  console.log("  → Citas");
  type Appt = {
    serviceId: string;
    employeeId: string;
    scheduledAt: Date;
    duration: number;
    state: "SCHEDULED" | "FINISHED" | "CANCELLED";
    customerId: string;
  };
  const c = customers;
  const seedAppointments: Appt[] = [
    // ── HOY ──
    { serviceId: corteDama!.id, employeeId: andrea!.id, scheduledAt: at(0, 9), duration: corteDama!.duration, state: "FINISHED", customerId: c[0]!.id },
    { serviceId: color!.id, employeeId: valentina!.id, scheduledAt: at(0, 9, 30), duration: color!.duration, state: "FINISHED", customerId: c[4]!.id },
    { serviceId: corteCab!.id, employeeId: bryan!.id, scheduledAt: at(0, 10), duration: corteCab!.duration, state: "FINISHED", customerId: c[1]!.id },
    { serviceId: barba!.id, employeeId: diego!.id, scheduledAt: at(0, 11), duration: barba!.duration, state: "SCHEDULED", customerId: c[7]!.id },
    { serviceId: peinado!.id, employeeId: camila!.id, scheduledAt: at(0, 12), duration: peinado!.duration, state: "SCHEDULED", customerId: c[2]!.id },
    { serviceId: mechas!.id, employeeId: andrea!.id, scheduledAt: at(0, 14), duration: mechas!.duration, state: "SCHEDULED", customerId: c[6]!.id },
    { serviceId: afeitado!.id, employeeId: bryan!.id, scheduledAt: at(0, 16), duration: afeitado!.duration, state: "CANCELLED", customerId: c[3]!.id },

    // ── MAÑANA ──
    { serviceId: corteCab!.id, employeeId: diego!.id, scheduledAt: at(1, 9), duration: corteCab!.duration, state: "SCHEDULED", customerId: c[3]!.id },
    { serviceId: color!.id, employeeId: valentina!.id, scheduledAt: at(1, 10), duration: color!.duration, state: "SCHEDULED", customerId: c[2]!.id },
    { serviceId: corteDama!.id, employeeId: camila!.id, scheduledAt: at(1, 11), duration: corteDama!.duration, state: "SCHEDULED", customerId: c[4]!.id },
    { serviceId: barbaPrem!.id, employeeId: bryan!.id, scheduledAt: at(1, 14), duration: barbaPrem!.duration, state: "SCHEDULED", customerId: c[1]!.id },

    // ── EN 2 DÍAS ──
    { serviceId: mechas!.id, employeeId: andrea!.id, scheduledAt: at(2, 9), duration: mechas!.duration, state: "SCHEDULED", customerId: c[6]!.id },
    { serviceId: corteCab!.id, employeeId: bryan!.id, scheduledAt: at(2, 12), duration: corteCab!.duration, state: "SCHEDULED", customerId: c[5]!.id },
    { serviceId: peinado!.id, employeeId: valentina!.id, scheduledAt: at(2, 15), duration: peinado!.duration, state: "SCHEDULED", customerId: c[0]!.id },

    // ── HISTORIAL ──
    { serviceId: corteDama!.id, employeeId: andrea!.id, scheduledAt: at(-1, 9), duration: corteDama!.duration, state: "FINISHED", customerId: c[4]!.id },
    { serviceId: color!.id, employeeId: valentina!.id, scheduledAt: at(-1, 11), duration: color!.duration, state: "FINISHED", customerId: c[2]!.id },
    { serviceId: corteCab!.id, employeeId: diego!.id, scheduledAt: at(-2, 10), duration: corteCab!.duration, state: "FINISHED", customerId: c[1]!.id },
    { serviceId: barba!.id, employeeId: bryan!.id, scheduledAt: at(-2, 14), duration: barba!.duration, state: "FINISHED", customerId: c[7]!.id },
    { serviceId: mechas!.id, employeeId: camila!.id, scheduledAt: at(-3, 9), duration: mechas!.duration, state: "FINISHED", customerId: c[6]!.id },
    { serviceId: peinado!.id, employeeId: andrea!.id, scheduledAt: at(-3, 15), duration: peinado!.duration, state: "FINISHED", customerId: c[0]!.id },
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
        state: a.state,
        booking: { create: { customerId: a.customerId } },
      },
    });
  }

  console.log("  → Ventas");
  const buildSale = (
    employeeId: string,
    customerId: string | null,
    lines: { index: number; quantity: number }[],
    createdAt: Date,
  ) => {
    const items = lines.map(({ index, quantity }) => {
      const p = products[index]!;
      const lineTotal = p.price * quantity;
      const commissionAmount = (lineTotal * p.commission) / 100;
      return {
        productId: p.id,
        quantity,
        unitPrice: String(p.price),
        commissionPct: String(p.commission),
        lineTotal: String(lineTotal),
        commissionAmount: String(commissionAmount),
      };
    });
    const total = items.reduce((s, i) => s + Number(i.lineTotal), 0);
    const commissionTotal = items.reduce((s, i) => s + Number(i.commissionAmount), 0);
    return prisma.sale.create({
      data: {
        employeeId,
        customerId,
        total: String(total),
        commissionTotal: String(commissionTotal),
        createdAt,
        items: { create: items },
      },
    });
  };

  await Promise.all([
    buildSale(andrea!.id, c[0]!.id, [{ index: 0, quantity: 1 }, { index: 4, quantity: 1 }], at(0, 10)),
    buildSale(valentina!.id, c[4]!.id, [{ index: 5, quantity: 1 }], at(0, 11)),
    buildSale(bryan!.id, c[1]!.id, [{ index: 7, quantity: 2 }], at(0, 12)),
    buildSale(camila!.id, c[2]!.id, [{ index: 1, quantity: 1 }, { index: 2, quantity: 1 }], at(-1, 13)),
    buildSale(andrea!.id, null, [{ index: 3, quantity: 1 }], at(-1, 16)),
    buildSale(diego!.id, c[7]!.id, [{ index: 6, quantity: 1 }, { index: 4, quantity: 1 }], at(-2, 15)),
    buildSale(valentina!.id, c[6]!.id, [{ index: 5, quantity: 1 }, { index: 0, quantity: 1 }], at(-3, 11)),
  ]);

  console.log("  → Bloqueos de horario");
  await Promise.all([
    // Andrea descansa todos los lunes (recurrente, día completo).
    prisma.employeeScheduleBlock.create({
      data: {
        employeeId: andrea!.id,
        dayOfWeek: 1,
        startTime: "00:00",
        endTime: "23:59",
        isFullDay: true,
        reason: "Día libre",
      },
    }),
    // Bryan bloquea su almuerzo pasado mañana.
    prisma.employeeScheduleBlock.create({
      data: {
        employeeId: bryan!.id,
        date: at(2, 0).toISOString().slice(0, 10),
        startTime: "13:00",
        endTime: "14:00",
        isFullDay: false,
        reason: "Almuerzo",
      },
    }),
  ]);

  const counts = {
    settings: await prisma.businessSettings.count(),
    users: await prisma.user.count(),
    customers: await prisma.customer.count(),
    services: await prisma.service.count(),
    employees: await prisma.employee.count(),
    employeeServices: await prisma.employeeService.count(),
    appointments: await prisma.appointment.count(),
    bookings: await prisma.booking.count(),
    inventoryCategories: await prisma.inventoryCategory.count(),
    inventoryItems: await prisma.inventoryItem.count(),
    products: await prisma.product.count(),
    sales: await prisma.sale.count(),
    saleItems: await prisma.saleItem.count(),
    scheduleBlocks: await prisma.employeeScheduleBlock.count(),
  };

  console.log("\n✅ Seed complete");
  console.log(counts);
  console.log("\nAdmin:    admin / " + adminPassword);
  console.log("Empleado: andrea / " + employeePassword + " (portal /employee)");
  console.log("Teléfono de prueba para reservar: 3001111111 (Laura Gómez)");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
