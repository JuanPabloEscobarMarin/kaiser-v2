import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { settingsApi } from "@/core/api";
import { applyPrimaryColor } from "@/core/branding/branding";
import type { BusinessSettings } from "@/core/types";
import { BrandingContext, type BrandingContextValue } from "./context";

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [business, setBusiness] = useState<BusinessSettings | null>(null);

  const refresh = useCallback(async () => {
    try {
      const s = await settingsApi.get();
      setBusiness(s);
      applyPrimaryColor(s.primaryColor);
    } catch {
      /* keep DaisyUI defaults if branding can't load */
    }
  }, []);

  useEffect(() => {
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
