import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.ts";
import { asyncHandler } from "../middlewares/async-handler.ts";
import { requireAuth } from "../middlewares/auth.middleware.ts";
import { validate } from "../middlewares/validate.middleware.ts";
import { loginSchema } from "../validators/auth.validators.ts";
import {
  changePasswordSchema,
  updateProfileSchema,
} from "../validators/profile.validators.ts";

const router = Router();

router.post(
  "/login",
  validate(loginSchema),
  asyncHandler(AuthController.login),
);
router.post("/logout", AuthController.logout);

router.get(
  "/me",
  asyncHandler(requireAuth),
  asyncHandler(AuthController.me),
);

router.patch(
  "/me",
  asyncHandler(requireAuth),
  validate(updateProfileSchema),
  asyncHandler(AuthController.updateProfile),
);

router.post(
  "/me/password",
  asyncHandler(requireAuth),
  validate(changePasswordSchema),
  asyncHandler(AuthController.changePassword),
);

export default router;
