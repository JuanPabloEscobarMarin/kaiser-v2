import { Router, type Request } from "express";
import { z } from "zod";
import { asyncHandler } from "../middlewares/async-handler.ts";
import { requireEmployee } from "../middlewares/auth.middleware.ts";
import { validate } from "../middlewares/validate.middleware.ts";
import { createBlockSchema } from "../validators/employee-blocks.validators.ts";
import { createSaleSchema } from "../validators/sale.validators.ts";
import { EmployeeBlocksRepository } from "../repositories/employee-blocks.repository.ts";
import { AppointmentRepository } from "../repositories/appointment.repository.ts";
import { SaleService } from "../services/sale.service.ts";
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
  if (!emp) throw new NotFoundException("Employee not found");
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
    if (!emp) throw new NotFoundException("Employee not found");
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
});

// An employee has full control over the status of their own appointments:
// confirm/reopen (SCHEDULED), close out (FINISHED) or cancel (CANCELLED).
router.patch(
  "/me/appointments/:id/status",
  validate(updateStatusSchema),
  asyncHandler(async (req, res) => {
    const emp = await getMyEmployee(req);
    const appointment = await AppointmentRepository.byId(String(req.params.id));
    if (!appointment) throw new NotFoundException("Appointment not found");
    if (appointment.employeeId !== emp.id) {
      throw new ForbiddenException("This appointment is not yours");
    }
    const updated = await AppointmentRepository.update(appointment.id, {
      state: req.body.state,
    });
    res.json({ message: "Appointment updated", data: updated });
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
    if (!block) throw new NotFoundException("Block not found");
    if (block.employeeId !== emp.id) {
      throw new ForbiddenException("This block is not yours");
    }
    await EmployeeBlocksRepository.delete(block.id);
    res.json({ message: "Block deleted", id: block.id });
  }),
);

// ---- Sales (self-service POS) ---------------------------------------------

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
