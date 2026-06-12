import { Router } from "express";
import { ProductController } from "../controllers/product.controller.ts";
import { asyncHandler } from "../middlewares/async-handler.ts";
import { requireAdmin } from "../middlewares/auth.middleware.ts";
import { idParamSchema, validate } from "../middlewares/validate.middleware.ts";
import {
  createProductSchema,
  updateProductSchema,
} from "../validators/product.validators.ts";

const router = Router();

router.use(asyncHandler(requireAdmin));

router.get("/", asyncHandler(ProductController.list));
router.get("/:id", validate(idParamSchema, "params"), asyncHandler(ProductController.getById));
router.post("/", validate(createProductSchema), asyncHandler(ProductController.create));
router.put(
  "/:id",
  validate(idParamSchema, "params"),
  validate(updateProductSchema),
  asyncHandler(ProductController.update),
);
router.delete(
  "/:id",
  validate(idParamSchema, "params"),
  asyncHandler(ProductController.delete),
);

export default router;
