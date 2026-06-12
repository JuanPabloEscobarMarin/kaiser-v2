import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { settingsApi } from "@/core/api";
import { applyPrimaryColor } from "@/core/branding/branding";
import type { BusinessSettings } from "@/core/types";

interface BrandingContextValue {
  business: BusinessSettings | null;
  /** Convenience accessor that falls back to "Kaiser" when settings haven't loaded yet. */
  name: string;
  refresh: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextValue | null>(null);

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [business, setBusiness] = useState<BusinessSettings | null>(null);

  const refresh = async () => {
    try {
      const s = await settingsApi.get();
      setBusiness(s);
      applyPrimaryColor(s.primaryColor);
    } catch {
      /* keep DaisyUI defaults if branding can't load */
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const value = useMemo<BrandingContextValue>(
    () => ({
      business,
      name: business?.name ?? "Kaiser",
      refresh,
    }),
    [business],
  );

  return (
    <BrandingContext.Provider value={value}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding(): BrandingContextValue {
  const ctx = useContext(BrandingContext);
  if (!ctx)
    throw new Error("useBranding must be used within a BrandingProvider");
  return ctx;
}
