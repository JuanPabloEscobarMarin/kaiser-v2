import { Router } from "express";
import { SaleController } from "../controllers/sale.controller.ts";
import { asyncHandler } from "../middlewares/async-handler.ts";
import { requireAdmin } from "../middlewares/auth.middleware.ts";
import { idParamSchema, validate } from "../middlewares/validate.middleware.ts";
import {
  createSaleSchema,
  listSalesQuerySchema,
} from "../validators/sale.validators.ts";

const router = Router();

router.use(asyncHandler(requireAdmin));

router.get(
  "/",
  validate(listSalesQuerySchema, "query"),
  asyncHandler(SaleController.list),
);
router.get(
  "/:id",
  validate(idParamSchema, "params"),
  asyncHandler(SaleController.getById),
);
router.post("/", validate(createSaleSchema), asyncHandler(SaleController.create));
router.delete(
  "/:id",
  validate(idParamSchema, "params"),
  asyncHandler(SaleController.delete),
);

export default router;
