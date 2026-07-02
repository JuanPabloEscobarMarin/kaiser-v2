import { z } from "zod";

export const channelEnum = z.enum(["EMAIL", "WHATSAPP", "BOTH"]);
export const segmentEnum = z.enum([
  "ALL",
  "BIRTHDAY_MONTH",
  "INACTIVE",
  "BY_SERVICE",
]);

export const createCampaignSchema = z.object({
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(2000),
  channel: channelEnum.optional().default("EMAIL"),
  segment: segmentEnum.optional().default("ALL"),
  segmentParam: z.string().max(60).nullable().optional(),
});

export const audiencePreviewSchema = z.object({
  segment: segmentEnum.optional().default("ALL"),
  segmentParam: z.string().optional(),
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
