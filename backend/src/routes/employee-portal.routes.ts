import { Router, type Request } from "express";
import { z } from "zod";
import { asyncHandler } from "../middlewares/async-handler.ts";
import { requireEmployee } from "../middlewares/auth.middleware.ts";
import { validate } from "../middlewares/validate.middleware.ts";
import { createBlockSchema } from "../validators/employee-blocks.validators.ts";
import { createSaleSchema } from "../validators/sale.validators.ts";
import { EmployeeBlocksRepository } from "../repositories/employee-blocks.repository.ts";
import { AppointmentRepository } from "../repositories/appointment.repository.ts";
import { ProductRepository } from "../repositories/product.repository.ts";
import { SaleService } from "../services/sale.service.ts";
import { NotificationService } from "../services/notification.service.ts";
import { NotificationRepository } from "../repositories/notification.repository.ts";
import { DailyCloseService } from "../services/daily-close.service.ts";
import { prisma } from "../lib/prisma.ts";
import {
  ForbiddenException,
  NotFoundException,
} from "../exceptions/HttpException.ts";

const router = Router();

router.use(asyncHandler(requireEmployee));

/**
 * Resolve the Employee row linked to the authenticated user. All portal data is
 * derived from the JWT — the client never supplies an employeeId — so an
 * employee can only ever read/modify their own records.
 */
const getMyEmployee = async (req: Request) => {
  const emp = await prisma.employee.findFirst({
    where: { userId: req.auth!.userId },
  });
  if (!emp) throw new NotFoundException("Empleado no encontrado");
  return emp;
};

// ---- Profile ---------------------------------------------------------------

router.get(
  "/me",
  asyncHandler(async (req, res) => {
    const emp = await prisma.employee.findFirst({
      where: { userId: req.auth!.userId },
      include: {
        services: {
          select: {
            service: { select: { id: true, name: true } },
            commission: true,
          },
        },
      },
    });
    if (!emp) throw new NotFoundException("Empleado no encontrado");
    res.json({
      ...emp,
      services: emp.services.map((s) => ({
        ...s.service,
        commission: String(s.commission ?? "0"),
      })),
    });
  }),
);

// ---- Appointments ----------------------------------------------------------

router.get(
  "/me/appointments",
  asyncHandler(async (req, res) => {
    const emp = await getMyEmployee(req);
    const appointments = await prisma.appointment.findMany({
      where: { employeeId: emp.id },
      orderBy: { scheduledAt: "desc" },
      include: {
        service: true,
        booking: { include: { customer: true } },
      },
    });
    res.json(appointments);
  }),
);

const updateStatusSchema = z.object({
  state: z.enum(["SCHEDULED", "FINISHED", "CANCELLED"]),
  // Precio real cobrado al cerrar una cita de precio variable (opcional).
  finalPrice: z
    .union([z.string(), z.number()])
    .transform((v) => String(v))
    .nullable()
    .optional(),
});

// An employee has full control over the status of their own appointments:
// confirm/reopen (SCHEDULED), close out (FINISHED) or cancel (CANCELLED).
router.patch(
  "/me/appointments/:id/status",
  validate(updateStatusSchema),
  asyncHandler(async (req, res) => {
    const emp = await getMyEmployee(req);
    const appointment = await AppointmentRepository.byId(String(req.params.id));
    if (!appointment) throw new NotFoundException("Cita no encontrada");
    if (appointment.employeeId !== emp.id) {
      throw new ForbiddenException("Esta cita no es tuya");
    }
    const updated = await AppointmentRepository.update(appointment.id, {
      state: req.body.state,
      ...(req.body.finalPrice !== undefined
        ? { finalPrice: req.body.finalPrice }
        : {}),
    });
    res.json({ message: "Appointment updated", data: updated });
  }),
);

// ---- Agenda de todo el equipo (solo lectura) -------------------------------

// Cualquier empleado puede ver la agenda de todos (coordinación). Las
// mutaciones siguen restringidas al dueño de la cita en el endpoint /status.
router.get(
  "/agenda",
  asyncHandler(async (req, res) => {
    await getMyEmployee(req);
    const filters: { from?: Date; to?: Date } = {};
    if (req.query.from) filters.from = new Date(String(req.query.from));
    if (req.query.to) filters.to = new Date(String(req.query.to));
    res.json(await AppointmentRepository.all(filters));
  }),
);

// ---- Cierre diario del propio empleado -------------------------------------

router.get(
  "/me/daily-close",
  asyncHandler(async (req, res) => {
    const emp = await getMyEmployee(req);
    const date = String(
      req.query.date ?? new Date().toISOString().slice(0, 10),
    );
    res.json(await DailyCloseService.compute(emp.id, date));
  }),
);

// ---- Notificaciones in-app (campana) ---------------------------------------

router.get(
  "/me/notifications",
  asyncHandler(async (req, res) => {
    const emp = await getMyEmployee(req);
    res.json({
      items: await NotificationService.list(emp.id),
      unread: await NotificationService.unreadCount(emp.id),
    });
  }),
);

router.post(
  "/me/notifications/read-all",
  asyncHandler(async (req, res) => {
    const emp = await getMyEmployee(req);
    await NotificationService.markAllRead(emp.id);
    res.json({ message: "ok" });
  }),
);

router.patch(
  "/me/notifications/:id/read",
  asyncHandler(async (req, res) => {
    const emp = await getMyEmployee(req);
    const n = await NotificationRepository.byId(String(req.params.id));
    if (!n) throw new NotFoundException("Notificación no encontrada");
    if (n.employeeId !== emp.id) {
      throw new ForbiddenException("Esta notificación no es tuya");
    }
    res.json(await NotificationService.markRead(n.id));
  }),
);

// ---- Schedule blocks (self-service time off) -------------------------------

router.get(
  "/me/blocks",
  asyncHandler(async (req, res) => {
    const emp = await getMyEmployee(req);
    res.json(await EmployeeBlocksRepository.allByEmployee(emp.id));
  }),
);

router.post(
  "/me/blocks",
  validate(createBlockSchema),
  asyncHandler(async (req, res) => {
    const emp = await getMyEmployee(req);
    const block = await EmployeeBlocksRepository.create(emp.id, req.body);
    res.status(201).json({ message: "Block created", data: block });
  }),
);

router.delete(
  "/me/blocks/:blockId",
  asyncHandler(async (req, res) => {
    const emp = await getMyEmployee(req);
    const block = await EmployeeBlocksRepository.byId(String(req.params.blockId));
    if (!block) throw new NotFoundException("Bloqueo no encontrado");
    if (block.employeeId !== emp.id) {
      throw new ForbiddenException("Este bloqueo no es tuyo");
    }
    await EmployeeBlocksRepository.delete(block.id);
    res.json({ message: "Block deleted", id: block.id });
  }),
);

// ---- Sales (self-service POS) ---------------------------------------------

// Catálogo de productos para que el empleado pueda vender desde el portal.
// Los productos no son sensibles ni específicos del empleado, pero solo se
// exponen a empleados autenticados (el catálogo completo de admin sigue en /products).
router.get(
  "/products",
  asyncHandler(async (_req, res) => {
    res.json(await ProductRepository.all());
  }),
);

router.get(
  "/me/sales",
  asyncHandler(async (req, res) => {
    const emp = await getMyEmployee(req);
    res.json(await SaleService.listByEmployee(emp.id));
  }),
);

router.post(
  "/me/sales",
  validate(createSaleSchema),
  asyncHandler(async (req, res) => {
    const emp = await getMyEmployee(req);
    // Force the seller to the logged-in employee; body employeeId is ignored.
    const data = await SaleService.create(req.body, { sellerEmployeeId: emp.id });
    res.status(201).json({ message: "Sale registered", data });
  }),
);

export default router;
