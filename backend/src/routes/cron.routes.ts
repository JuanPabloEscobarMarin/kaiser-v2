import { Router } from "express";
import { asyncHandler } from "../middlewares/async-handler.ts";
import { ForbiddenException } from "../exceptions/HttpException.ts";
import { env } from "../config/env.ts";
import { ReminderService } from "../services/reminder.service.ts";

const router = Router();

/**
 * Endpoint invocado por Vercel Cron (GET). Protegido por CRON_SECRET: Vercel
 * envía `Authorization: Bearer <CRON_SECRET>`. En producción es obligatorio;
 * en desarrollo, si no hay secreto configurado, se permite para pruebas.
 */
const assertCronAuth = (authHeader?: string, querySecret?: string) => {
  const secret = env.CRON_SECRET;
  if (!secret) {
    if (env.NODE_ENV === "production") {
      throw new ForbiddenException("CRON_SECRET no configurado");
    }
    return; // dev sin secreto: permitido
  }
  const provided = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : querySecret;
  if (provided !== secret) throw new ForbiddenException("Cron no autorizado");
};

router.get(
  "/reminders",
  asyncHandler(async (req, res) => {
    assertCronAuth(req.headers.authorization, req.query.secret as string);
    res.json(await ReminderService.runDueReminders());
  }),
);

export default router;
