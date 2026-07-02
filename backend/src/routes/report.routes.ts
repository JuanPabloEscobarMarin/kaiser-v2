import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middlewares/async-handler.ts";
import { requireAdmin } from "../middlewares/auth.middleware.ts";
import { validate } from "../middlewares/validate.middleware.ts";
import { DailyCloseService } from "../services/daily-close.service.ts";

const router = Router();

const dailyCloseQuery = z.object({
  employeeId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe ser AAAA-MM-DD"),
});

// Cierre diario económico de cualquier empleado (admin).
router.get(
  "/daily-close",
  asyncHandler(requireAdmin),
  validate(dailyCloseQuery, "query"),
  asyncHandler(async (req, res) => {
    res.json(
      await DailyCloseService.compute(
        String(req.query.employeeId),
        String(req.query.date),
      ),
    );
  }),
);

export default router;
