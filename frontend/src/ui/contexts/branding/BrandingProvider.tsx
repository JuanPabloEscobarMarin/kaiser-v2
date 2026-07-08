import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { settingsApi } from "@/core/api";
import {
  applyPrimaryColor,
  applySecondaryColor,
  applyAccentColor,
  applyFonts,
} from "@/core/branding/branding";
import type { BusinessSettings } from "@/core/types";
import { BrandingContext, type BrandingContextValue } from "./context";

const STORAGE_KEY = "kaiser:settings";

const readCached = (): BusinessSettings | null => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as BusinessSettings) : null;
  } catch {
    return null;
  }
};

const applyBranding = (s: BusinessSettings) => {
  applyPrimaryColor(s.primaryColor);
  applySecondaryColor(s.secondaryColor);
  applyAccentColor(s.accentColor);
  applyFonts(s.fontHeading, s.fontBody);
};

export function BrandingProvider({ children }: { children: ReactNode }) {
  // Hidratación instantánea desde sessionStorage: evita el "flash" de
  // contenido default mientras llega /api/settings en visitas repetidas.
  const [business, setBusiness] = useState<BusinessSettings | null>(readCached);

  const refresh = useCallback(async () => {
    try {
      const s = await settingsApi.get();
      setBusiness(s);
      applyBranding(s);
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s));
      } catch {
        /* storage lleno o bloqueado: seguimos sin cache */
      }
    } catch {
      /* keep DaisyUI defaults if branding can't load */
    }
  }, []);

  useEffect(() => {
    // Aplica el branding cacheado de inmediato; el fetch lo refresca después
    // (staleness máxima: un paint).
    const cached = readCached();
    if (cached) applyBranding(cached);
    // setBusiness ocurre tras un await: nunca de forma síncrona en el efecto.
    void (async () => {
      await refresh();
    })();
  }, [refresh]);

  const value = useMemo<BrandingContextValue>(
    () => ({
      business,
      name: business?.name ?? "Kaiser",
      refresh,
    }),
    [business, refresh],
  );

  return (
    <BrandingContext.Provider value={value}>
      {children}
    </BrandingContext.Provider>
  );
}
