import { Router } from "express";
import { SettingsController } from "../controllers/settings.controller.ts";
import { asyncHandler } from "../middlewares/async-handler.ts";
import { requireAdmin } from "../middlewares/auth.middleware.ts";
import { validate } from "../middlewares/validate.middleware.ts";
import { businessSettingsSchema } from "../validators/settings.validators.ts";

const router = Router();

// Public — used by the home page
router.get("/", asyncHandler(SettingsController.get));

// Admin only
router.put(
  "/",
  asyncHandler(requireAdmin),
  validate(businessSettingsSchema),
  asyncHandler(SettingsController.update),
);

export default router;
