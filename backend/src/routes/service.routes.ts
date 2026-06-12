import { Router } from "express";
import { ServiceController } from "../controllers/service.controller.ts";
import { asyncHandler } from "../middlewares/async-handler.ts";
import { requireAdmin } from "../middlewares/auth.middleware.ts";
import {
  idParamSchema,
  validate,
} from "../middlewares/validate.middleware.ts";
import {
  createServiceSchema,
  deleteManySchema,
  updateServiceSchema,
} from "../validators/service.validators.ts";

const router = Router();

router.get("/", asyncHandler(ServiceController.list));
router.get(
  "/:id",
  validate(idParamSchema, "params"),
  asyncHandler(ServiceController.getById),
);

router.post(
  "/",
  asyncHandler(requireAdmin),
  validate(createServiceSchema),
  asyncHandler(ServiceController.create),
);
router.put(
  "/:id",
  asyncHandler(requireAdmin),
  validate(idParamSchema, "params"),
  validate(updateServiceSchema),
  asyncHandler(ServiceController.update),
);
router.delete(
  "/:id",
  asyncHandler(requireAdmin),
  validate(idParamSchema, "params"),
  asyncHandler(ServiceController.delete),
);
router.delete(
  "/",
  asyncHandler(requireAdmin),
  validate(deleteManySchema),
  asyncHandler(ServiceController.deleteMany),
);

export default router;
