import { Outlet } from "react-router";
import { AuthProvider } from "@/ui/contexts/auth/AuthContext";
import { BrandingProvider } from "@/ui/contexts/branding/BrandingProvider";

export function RootLayout() {
  return (
    <BrandingProvider>
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    </BrandingProvider>
  );
}
