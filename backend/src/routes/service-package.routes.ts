import { Router } from "express";
import { ServicePackageController } from "../controllers/service-package.controller.ts";
import { asyncHandler } from "../middlewares/async-handler.ts";
import { optionalAuth, requireAdmin } from "../middlewares/auth.middleware.ts";
import { idParamSchema, validate } from "../middlewares/validate.middleware.ts";
import {
  createPackageSchema,
  updatePackageSchema,
} from "../validators/service-package.validators.ts";

const router = Router();

router.get(
  "/",
  asyncHandler(optionalAuth),
  asyncHandler(ServicePackageController.list),
);
router.get(
  "/:id",
  validate(idParamSchema, "params"),
  asyncHandler(ServicePackageController.getById),
);
router.post(
  "/",
  asyncHandler(requireAdmin),
  validate(createPackageSchema),
  asyncHandler(ServicePackageController.create),
);
router.put(
  "/:id",
  asyncHandler(requireAdmin),
  validate(idParamSchema, "params"),
  validate(updatePackageSchema),
  asyncHandler(ServicePackageController.update),
);
router.delete(
  "/:id",
  asyncHandler(requireAdmin),
  validate(idParamSchema, "params"),
  asyncHandler(ServicePackageController.delete),
);

export default router;
