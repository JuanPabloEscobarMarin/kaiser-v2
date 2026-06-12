import { Router } from "express";
import { AppointmentController } from "../controllers/appointment.controller.ts";
import { asyncHandler } from "../middlewares/async-handler.ts";
import { requireAdmin } from "../middlewares/auth.middleware.ts";
import {
  idParamSchema,
  validate,
} from "../middlewares/validate.middleware.ts";
import {
  availabilityQuerySchema,
  bookAppointmentSchema,
  listAppointmentsQuerySchema,
  updateAppointmentSchema,
} from "../validators/appointment.validators.ts";

const router = Router();

router.get(
  "/availability",
  validate(availabilityQuerySchema, "query"),
  asyncHandler(AppointmentController.availability),
);

router.post(
  "/book",
  validate(bookAppointmentSchema),
  asyncHandler(AppointmentController.book),
);

router.post(
  "/admin-book",
  asyncHandler(requireAdmin),
  validate(bookAppointmentSchema),
  asyncHandler(AppointmentController.adminBook),
);

router.get(
  "/",
  asyncHandler(requireAdmin),
  validate(listAppointmentsQuerySchema, "query"),
  asyncHandler(AppointmentController.list),
);
router.get(
  "/:id",
  asyncHandler(requireAdmin),
  validate(idParamSchema, "params"),
  asyncHandler(AppointmentController.getById),
);
router.put(
  "/:id",
  asyncHandler(requireAdmin),
  validate(idParamSchema, "params"),
  validate(updateAppointmentSchema),
  asyncHandler(AppointmentController.update),
);
router.post(
  "/:id/cancel",
  asyncHandler(requireAdmin),
  validate(idParamSchema, "params"),
  asyncHandler(AppointmentController.cancel),
);
router.delete(
  "/:id",
  asyncHandler(requireAdmin),
  validate(idParamSchema, "params"),
  asyncHandler(AppointmentController.delete),
);

export default router;
