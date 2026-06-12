import { prisma } from "../lib/prisma.ts";
import type { BusinessSettingsInput } from "../validators/settings.validators.ts";
import {
  HOME_CONTENT_DEFAULTS,
  mergeHomeContent,
} from "../lib/home-content-defaults.ts";

const DEFAULTS: BusinessSettingsInput = {
  name: "Kaiser Barbershop",
  phone: "+57 300 123 4567",
  whatsapp: "573001234567",
  email: "hola@kaiser.co",
  address: "Calle 45 #12-34, Chapinero, Bogotá",
  openTimeWeekday: "09:00",
  closeTimeWeekday: "18:00",
  closedWeekday: false,
  openTimeSaturday: "09:00",
  closeTimeSaturday: "17:00",
  closedSaturday: false,
  openTimeSunday: "09:00",
  closeTimeSunday: "14:00",
  closedSunday: true,
  homeContent: HOME_CONTENT_DEFAULTS,
};

const withHomeDefaults = (row: Record<string, unknown>) => ({
  ...row,
  homeContent: mergeHomeContent(row.homeContent),
});

// The settings singleton is read on every availability/booking request but
// changes very rarely. A small in-memory TTL cache avoids a DB round-trip on
// every read; it's invalidated immediately on update.
type Settings = ReturnType<typeof withHomeDefaults>;
const CACHE_TTL_MS = 60_000;
let cache: { value: Settings; expiresAt: number } | null = null;

export const SettingsService = {
  /**
   * Returns the singleton row, creating it with defaults if missing.
   * The home content is always merged with defaults so callers receive a
   * fully-formed object even before any customization. Cached for 60s.
   */
  async get() {
    if (cache && cache.expiresAt > Date.now()) return cache.value;

    const existing = await prisma.businessSettings.findFirst();
    const row = existing
      ? withHomeDefaults(existing)
      : withHomeDefaults(
          await prisma.businessSettings.create({ data: DEFAULTS as any }),
        );

    cache = { value: row, expiresAt: Date.now() + CACHE_TTL_MS };
    return row;
  },

  async update(data: BusinessSettingsInput) {
    const existing = await prisma.businessSettings.findFirst();
    const updated = existing
      ? await prisma.businessSettings.update({
          where: { id: existing.id },
          data: data as any,
        })
      : await prisma.businessSettings.create({ data: data as any });

    const row = withHomeDefaults(updated);
    cache = { value: row, expiresAt: Date.now() + CACHE_TTL_MS }; // refresh cache
    return row;
  },
};
