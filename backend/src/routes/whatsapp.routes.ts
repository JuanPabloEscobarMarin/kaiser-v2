import { Router } from "express";
import { WhatsAppController } from "../controllers/whatsapp.controller.ts";
import { asyncHandler } from "../middlewares/async-handler.ts";

const router = Router();

// Público: Meta llama estos endpoints. La autenticidad se valida con el
// verify_token (GET) y la firma X-Hub-Signature-256 (POST).
router.get("/webhook", WhatsAppController.verify);
router.post("/webhook", asyncHandler(WhatsAppController.receive));

export default router;
