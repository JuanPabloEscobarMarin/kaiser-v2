import { Router } from "express";
import { InventoryController } from "../controllers/inventory.controller.ts";
import { asyncHandler } from "../middlewares/async-handler.ts";
import { requireAdmin } from "../middlewares/auth.middleware.ts";
import { idParamSchema, validate } from "../middlewares/validate.middleware.ts";
import {
  createCategorySchema,
  createItemSchema,
  updateItemSchema,
} from "../validators/inventory.validators.ts";

const router = Router();

router.use(asyncHandler(requireAdmin));

router.get("/categories", asyncHandler(InventoryController.listCategories));
router.post(
  "/categories",
  validate(createCategorySchema),
  asyncHandler(InventoryController.createCategory),
);
router.delete(
  "/categories/:id",
  validate(idParamSchema, "params"),
  asyncHandler(InventoryController.deleteCategory),
);

router.get("/", asyncHandler(InventoryController.listItems));
router.get("/:id", validate(idParamSchema, "params"), asyncHandler(InventoryController.getItem));
router.post("/", validate(createItemSchema), asyncHandler(InventoryController.createItem));
router.put(
  "/:id",
  validate(idParamSchema, "params"),
  validate(updateItemSchema),
  asyncHandler(InventoryController.updateItem),
);
router.delete(
  "/:id",
  validate(idParamSchema, "params"),
  asyncHandler(InventoryController.deleteItem),
);

export default router;
