import { Router } from "express";
import { asyncHandler } from "../middlewares/async-handler.ts";
import { requireAdmin } from "../middlewares/auth.middleware.ts";
import { validate } from "../middlewares/validate.middleware.ts";
import { CampaignService } from "../services/campaign.service.ts";
import {
  createCampaignSchema,
  audiencePreviewSchema,
} from "../validators/campaign.validators.ts";

const router = Router();

router.use(asyncHandler(requireAdmin));

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json(await CampaignService.list());
  }),
);

router.get(
  "/audience-preview",
  validate(audiencePreviewSchema, "query"),
  asyncHandler(async (req, res) => {
    const q = req.validated?.query as {
      segment: "ALL" | "BIRTHDAY_MONTH" | "INACTIVE" | "BY_SERVICE";
      segmentParam?: string;
    };
    res.json(
      await CampaignService.audiencePreview(q.segment, q.segmentParam ?? null),
    );
  }),
);

router.post(
  "/",
  validate(createCampaignSchema),
  asyncHandler(async (req, res) => {
    const result = await CampaignService.createAndSend(req.body);
    res.status(201).json({ message: "Campaña enviada", ...result });
  }),
);

export default router;
