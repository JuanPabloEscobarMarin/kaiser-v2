import { Router } from "express";
import { EmployeeBlocksController } from "../controllers/employee-blocks.controller.ts";
import { asyncHandler } from "../middlewares/async-handler.ts";
import { requireAdmin } from "../middlewares/auth.middleware.ts";
import { idParamSchema, validate } from "../middlewares/validate.middleware.ts";
import { createBlockSchema } from "../validators/employee-blocks.validators.ts";
import { z } from "zod";

const router = Router({ mergeParams: true });

const blockIdParamSchema = z.object({
  id: z.string().uuid(),
  blockId: z.string().uuid(),
});

const employeeIdParamSchema = z.object({ id: z.string().uuid() });

router.use(asyncHandler(requireAdmin));

router.get(
  "/",
  validate(employeeIdParamSchema, "params"),
  asyncHandler(EmployeeBlocksController.list),
);
router.post(
  "/",
  validate(employeeIdParamSchema, "params"),
  validate(createBlockSchema),
  asyncHandler(EmployeeBlocksController.create),
);
router.delete(
  "/:blockId",
  validate(blockIdParamSchema, "params"),
  asyncHandler(EmployeeBlocksController.delete),
);

export default router;
