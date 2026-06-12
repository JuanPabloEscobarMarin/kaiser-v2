import { Router } from "express";
import { EmployeeController } from "../controllers/employee.controller.ts";
import { asyncHandler } from "../middlewares/async-handler.ts";
import { requireAdmin, optionalAuth } from "../middlewares/auth.middleware.ts";
import {
  idParamSchema,
  validate,
} from "../middlewares/validate.middleware.ts";
import {
  createEmployeeSchema,
  updateEmployeeSchema,
} from "../validators/employee.validators.ts";
import { z } from "zod";
import { prisma } from "../lib/prisma.ts";
import { hashPassword } from "../lib/password.ts";
import { ConflictException } from "../exceptions/HttpException.ts";

const createAccountSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
  phone: z.string().min(7).max(20),
});

const router = Router();

// Public listing/detail, but `optionalAuth` lets an authenticated admin receive
// the full record (salary, commission, account linkage) instead of the public
// projection. See EmployeeController.
router.get("/", asyncHandler(optionalAuth), asyncHandler(EmployeeController.list));
router.get(
  "/:id",
  asyncHandler(optionalAuth),
  validate(idParamSchema, "params"),
  asyncHandler(EmployeeController.getById),
);

router.post(
  "/",
  asyncHandler(requireAdmin),
  validate(createEmployeeSchema),
  asyncHandler(EmployeeController.create),
);
router.put(
  "/:id",
  asyncHandler(requireAdmin),
  validate(idParamSchema, "params"),
  validate(updateEmployeeSchema),
  asyncHandler(EmployeeController.update),
);
router.delete(
  "/:id",
  asyncHandler(requireAdmin),
  validate(idParamSchema, "params"),
  asyncHandler(EmployeeController.delete),
);

router.post(
  "/:id/create-account",
  asyncHandler(requireAdmin),
  validate(idParamSchema, "params"),
  validate(createAccountSchema),
  asyncHandler(async (req, res) => {
    const emp = await prisma.employee.findUnique({ where: { id: String(req.params.id) } });
    if (!emp) {
      res.status(404).json({ message: "Employee not found" });
      return;
    }
    if (emp.userId) {
      res.status(409).json({ message: "Este empleado ya tiene cuenta" });
      return;
    }
    const { username, password, phone } = req.body;
    const existing = await prisma.user.findFirst({
      where: { OR: [{ username }, { phone }] },
    });
    if (existing) throw new ConflictException("Username or phone already taken");

    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: { username, password: hashed, phone, role: "EMPLOYEE" },
    });
    await prisma.employee.update({
      where: { id: emp.id },
      data: { userId: user.id },
    });
    res.status(201).json({ message: "Account created", userId: user.id });
  }),
);

router.delete(
  "/:id/remove-account",
  asyncHandler(requireAdmin),
  validate(idParamSchema, "params"),
  asyncHandler(async (req, res) => {
    const emp = await prisma.employee.findUnique({ where: { id: String(req.params.id) } });
    if (!emp || !emp.userId) {
      res.status(404).json({ message: "No account to remove" });
      return;
    }
    await prisma.employee.update({ where: { id: emp.id }, data: { userId: null } });
    await prisma.user.delete({ where: { id: emp.userId } });
    res.json({ message: "Account removed" });
  }),
);

export default router;
