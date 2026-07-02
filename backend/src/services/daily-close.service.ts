import { prisma } from "../lib/prisma.ts";
import { EmployeeDeductionRepository } from "../repositories/employee-deduction.repository.ts";
import { NotFoundException } from "../exceptions/HttpException.ts";

const startOfDay = (ymd: string) => new Date(`${ymd}T00:00:00.000Z`);
const endOfDay = (ymd: string) => new Date(`${ymd}T23:59:59.999Z`);
const money = (n: number) => Math.round(n * 100) / 100;

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
      const commission = svcs.reduce(
        (sum, s) => sum + (Number(s.price) * (commissionMap.get(s.id) ?? 0)) / 100,
        0,
      );
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

    const sales = await prisma.sale.findMany({
      where: { employeeId, createdAt: { gte: start, lte: end } },
      include: { items: { include: { product: true } } },
    });
    const productSales = sales.reduce((sum, s) => sum + Number(s.total), 0);
    const productCommission = sales.reduce(
      (sum, s) => sum + Number(s.commissionTotal),
      0,
    );

    const deductions = await EmployeeDeductionRepository.sumInRange(
      employeeId,
      start,
      end,
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
