import { Router } from "express";
import { ServiceCategoryController } from "../controllers/service-category.controller.ts";
import { asyncHandler } from "../middlewares/async-handler.ts";
import { optionalAuth, requireAdmin } from "../middlewares/auth.middleware.ts";
import { idParamSchema, validate } from "../middlewares/validate.middleware.ts";
import {
  createCategorySchema,
  updateCategorySchema,
} from "../validators/service-category.validators.ts";

const router = Router();

router.get(
  "/",
  asyncHandler(optionalAuth),
  asyncHandler(ServiceCategoryController.list),
);
router.post(
  "/",
  asyncHandler(requireAdmin),
  validate(createCategorySchema),
  asyncHandler(ServiceCategoryController.create),
);
router.put(
  "/:id",
  asyncHandler(requireAdmin),
  validate(idParamSchema, "params"),
  validate(updateCategorySchema),
  asyncHandler(ServiceCategoryController.update),
);
router.delete(
  "/:id",
  asyncHandler(requireAdmin),
  validate(idParamSchema, "params"),
  asyncHandler(ServiceCategoryController.delete),
);

export default router;
