import { Router } from "express";
import { EmployeeDeductionController } from "../controllers/employee-deduction.controller.ts";
import { asyncHandler } from "../middlewares/async-handler.ts";
import { requireAdmin } from "../middlewares/auth.middleware.ts";
import { idParamSchema, validate } from "../middlewares/validate.middleware.ts";
import {
  createDeductionSchema,
  listDeductionsQuerySchema,
} from "../validators/employee-deduction.validators.ts";

const router = Router();

router.use(asyncHandler(requireAdmin));

router.get(
  "/",
  validate(listDeductionsQuerySchema, "query"),
  asyncHandler(EmployeeDeductionController.list),
);
router.post(
  "/",
  validate(createDeductionSchema),
  asyncHandler(EmployeeDeductionController.create),
);
router.delete(
  "/:id",
  validate(idParamSchema, "params"),
  asyncHandler(EmployeeDeductionController.delete),
);

export default router;
