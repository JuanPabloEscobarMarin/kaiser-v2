import { createContext, useContext } from "react";
import type { BusinessSettings } from "@/core/types";

export interface BrandingContextValue {
  business: BusinessSettings | null;
  /** Convenience accessor that falls back to "Kaiser" when settings haven't loaded yet. */
  name: string;
  refresh: () => Promise<void>;
}

export const BrandingContext = createContext<BrandingContextValue | null>(null);

export function useBranding(): BrandingContextValue {
  const ctx = useContext(BrandingContext);
  if (!ctx)
    throw new Error("useBranding must be used within a BrandingProvider");
  return ctx;
}
