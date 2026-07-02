import { api } from "./client";

export type CampaignChannel = "EMAIL" | "WHATSAPP" | "BOTH";
export type CampaignSegment = "ALL" | "BIRTHDAY_MONTH" | "INACTIVE" | "BY_SERVICE";

export interface Campaign {
  id: string;
  title: string;
  body: string;
  channel: CampaignChannel;
  segment: CampaignSegment;
  segmentParam: string | null;
  status: string;
  recipientCount: number;
  sentAt: string | null;
  createdAt: string;
}

export interface CampaignInput {
  title: string;
  body: string;
  channel?: CampaignChannel;
  segment?: CampaignSegment;
  segmentParam?: string | null;
}

export interface AudiencePreview {
  total: number;
  withEmail: number;
  withPhone: number;
}

export interface SendResult {
  message: string;
  audienceCount: number;
  emailsSent: number;
  whatsappSent: number;
  emailConfigured: boolean;
}

export const campaignsApi = {
  list: () => api.get<Campaign[]>("/campaigns"),
  audiencePreview: (segment: CampaignSegment, segmentParam?: string | null) => {
    const p = new URLSearchParams({ segment });
    if (segmentParam) p.set("segmentParam", segmentParam);
    return api.get<AudiencePreview>(`/campaigns/audience-preview?${p}`);
  },
  create: (data: CampaignInput) => api.post<SendResult>("/campaigns", data),
};
