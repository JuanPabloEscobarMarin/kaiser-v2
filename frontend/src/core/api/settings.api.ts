import { api } from "./client";
import type { BusinessSettings, BusinessSettingsInput } from "../types";

export const settingsApi = {
  get: () => api.get<BusinessSettings>("/settings"),
  update: (data: BusinessSettingsInput) =>
    api.put<{ message: string; data: BusinessSettings }>("/settings", data),
};
