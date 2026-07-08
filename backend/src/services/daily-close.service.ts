import { prisma } from "../lib/prisma.ts";
import { EmployeeDeductionRepository } from "../repositories/employee-deduction.repository.ts";
import { NotFoundException } from "../exceptions/HttpException.ts";
import { computeServiceCommission, money } from "../lib/commission.ts";
import { businessDayStart, businessDayEnd } from "../lib/business-time.ts";

// Solo para scheduledAt (fake-UTC, hora de pared — ver business-hours.ts):
// el corte `${ymd}Z` YA es el día Bogotá. Para createdAt (instantes reales)
// usar businessDayStart/End, que corrigen las 5 horas de desfase.
const startOfDay = (ymd: string) => new Date(`${ymd}T00:00:00.000Z`);
const endOfDay = (ymd: string) => new Date(`${ymd}T23:59:59.999Z`);

/**
 * Cierre diario económico de un empleado: ingresos por servicios, comisiones,
 * ventas de productos y deducciones → neto a pagar.
 */
export const DailyCloseService = {
  async compute(employeeId: string, date: string) {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { services: true },
    });
    if (!employee) throw new NotFoundException("Empleado no encontrado");

    const start = startOfDay(date);
    const end = endOfDay(date);

    // Comisión por servicio que gana este empleado.
    const commissionMap = new Map(
      employee.services.map((es) => [es.serviceId, Number(es.commission)]),
    );

    const appointments = await prisma.appointment.findMany({
      where: {
        employeeId,
        state: "FINISHED",
        scheduledAt: { gte: start, lte: end },
      },
      include: {
        service: true,
        services: { include: { service: true } },
        booking: { include: { customer: true } },
      },
    });

    let serviceRevenue = 0;
    let serviceCommission = 0;
    const appointmentRows = appointments.map((a) => {
      const svcs =
        a.services.length > 0 ? a.services.map((x) => x.service) : [a.service];
      const basePrice = svcs.reduce(
        (sum, s) => sum + Math.max(0, Number(s.price) - Number(s.discount)),
        0,
      );
      const price = a.finalPrice != null ? Number(a.finalPrice) : basePrice;
      // Snapshot congelado al finalizar; fallback (citas pre-snapshot) con la
      // misma regla sobre lo cobrado y las tasas actuales.
      const commission =
        a.commissionAmount != null
          ? Number(a.commissionAmount)
          : computeServiceCommission(svcs, a.finalPrice, commissionMap);
      serviceRevenue += price;
      serviceCommission += commission;
      return {
        id: a.id,
        scheduledAt: a.scheduledAt,
        customer: a.booking?.customer?.fullName ?? null,
        services: svcs.map((s) => s.name),
        price: money(price),
        commission: money(commission),
      };
    });

    // createdAt es un instante real: el día de negocio va de 00:00 a 23:59
    // hora Colombia, no UTC.
    const sales = await prisma.sale.findMany({
      where: {
        employeeId,
        createdAt: { gte: businessDayStart(date), lte: businessDayEnd(date) },
      },
      include: { items: { include: { product: true } } },
    });
    const productSales = sales.reduce((sum, s) => sum + Number(s.total), 0);
    const productCommission = sales.reduce(
      (sum, s) => sum + Number(s.commissionTotal),
      0,
    );

    const deductions = await EmployeeDeductionRepository.sumInRange(
      employeeId,
      businessDayStart(date),
      businessDayEnd(date),
    );

    const netEarnings =
      serviceCommission + productCommission - deductions.total;

    return {
      employee: { id: employee.id, fullName: employee.fullName },
      date,
      serviceRevenue: money(serviceRevenue),
      serviceCommission: money(serviceCommission),
      appointments: appointmentRows,
      productSales: money(productSales),
      productCommission: money(productCommission),
      sales: sales.map((s) => ({
        id: s.id,
        total: money(Number(s.total)),
        commission: money(Number(s.commissionTotal)),
        items: s.items.map((it) => ({
          product: it.product.name,
          quantity: it.quantity,
          lineTotal: money(Number(it.lineTotal)),
        })),
      })),
      deductions: {
        total: money(deductions.total),
        items: deductions.items.map((d) => ({
          id: d.id,
          type: d.type,
          amount: money(Number(d.amount)),
          note: d.note,
          createdAt: d.createdAt,
        })),
      },
      netEarnings: money(netEarnings),
    };
  },
};
