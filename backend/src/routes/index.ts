import { Router } from "express";
import { prisma } from "../lib/prisma.ts";
import { asyncHandler } from "../middlewares/async-handler.ts";
import authRoutes from "./auth.routes.ts";
import serviceRoutes from "./service.routes.ts";
import employeeRoutes from "./employee.routes.ts";
import employeeBlocksRoutes from "./employee-blocks.routes.ts";
import appointmentRoutes from "./appointment.routes.ts";
import searchRoutes from "./search.routes.ts";
import resourcesRoutes from "./resources.routes.ts";
import settingsRoutes from "./settings.routes.ts";
import inventoryRoutes from "./inventory.routes.ts";
import productRoutes from "./product.routes.ts";
import saleRoutes from "./sale.routes.ts";
import employeePortalRoutes from "./employee-portal.routes.ts";

const router = Router();

router.get(
  "/health",
  asyncHandler(async (_req, res) => {
    let database = "ok";
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      database = "down";
    }
    res
      .status(database === "ok" ? 200 : 503)
      .json({ status: database === "ok" ? "ok" : "degraded", database, timestamp: new Date().toISOString() });
  }),
);

router.use("/auth", authRoutes);
router.use("/services", serviceRoutes);
router.use("/employees", employeeRoutes);
router.use("/employees/:id/blocks", employeeBlocksRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/search", searchRoutes);
router.use("/resources", resourcesRoutes);
router.use("/settings", settingsRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/products", productRoutes);
router.use("/sales", saleRoutes);
router.use("/employee", employeePortalRoutes);

export default router;
