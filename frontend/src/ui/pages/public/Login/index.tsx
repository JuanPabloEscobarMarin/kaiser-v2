import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { LoginForm } from "@/ui/pages/public/Login/components/loginForm";
import {
  InteractiveClock,
  type ClockMode,
} from "@/ui/pages/public/Login/components/InteractiveClock";
import { AparienceSwitcher } from "@/ui/layouts/components/AparienceSwitcher";
import { BaseIcon } from "@/ui/components/base/BaseIcon";
import { useAuth } from "@/ui/hooks/useAuth";
import { useBranding } from "@/ui/contexts/branding/BrandingProvider";
import { ApiError, resourcesApi } from "@/core/api";

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { name, business } = useBranding();
  const logoUrl = business?.logoSlug
    ? resourcesApi.imageUrl(business.logoSlug)
    : null;
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [userLen, setUserLen] = useState(0);
  const [passLen, setPassLen] = useState(0);
  const [mode, setMode] = useState<ClockMode>("idle");
  const [focused, setFocused] = useState(false);
  const [timelapse, setTimelapse] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleTilt = (e: React.MouseEvent) => {
    const el = cardRef.current;
    if (!el || success) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateX(${py * -6}deg) rotateY(${px * 6}deg)`;
  };

  const resetTilt = () => {
    const el = cardRef.current;
    if (el) el.style.transform = "";
  };

  const handleLogin = async (username: string, password: string) => {
    setError(null);
    setTimelapse(true);
    try {
      const user = await login(username, password);
      const target =
        user.role === "ADMIN"
          ? "/admin"
          : user.role === "EMPLOYEE"
            ? "/employee"
            : "/booking";
      resetTilt();
      setSuccess(true);
      setTimeout(() => navigate(target, { viewTransition: true }), 900);
    } catch (err) {
      setTimelapse(false);
      setError(
        err instanceof ApiError
          ? err.message
          : "Error inesperado, intenta de nuevo",
      );
    }
  };

  const clockProps = { userLen, passLen, mode, focused, timelapse };

  return (
    <div className="min-h-screen bg-base-200 relative overflow-hidden">
      {/* Capa ambiental de color */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        aria-hidden="true"
      >
        <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-primary/30 blur-3xl animate-blob" />
        <div className="absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-secondary/30 blur-3xl animate-blob-delayed" />
      </div>

      {/* Theme switcher arriba a la derecha */}
      <div className="absolute top-4 right-4 z-50 bg-base-100/80 backdrop-blur-md rounded-box p-3 shadow">
        <AparienceSwitcher />
      </div>

      <div className="relative flex min-h-screen flex-col lg:flex-row items-center justify-center gap-6 lg:gap-16 xl:gap-24 p-4 pt-20 lg:pt-4">
        {/* Reloj protagonista: lateral en escritorio, sobre la tarjeta en móvil */}
        <div aria-hidden="true">
          <InteractiveClock {...clockProps} />
        </div>

        <div
          ref={cardRef}
          onMouseMove={handleTilt}
          onMouseLeave={resetTilt}
          className="card w-full max-w-md bg-base-100/85 backdrop-blur-xl lg:bg-base-100 shadow-2xl animate-card-in transition-transform duration-200 ease-out will-change-transform"
        >
          <div className="card-body">
            <div className="flex justify-center">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={name}
                  className="h-16 max-w-[200px] object-contain animate-logo-float drop-shadow-md"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-content shadow-inner animate-logo-float">
                  <BaseIcon
                    icon="diamond"
                    size={28}
                    color="currentColor"
                    viewBox="0 0 24 24"
                  />
                </div>
              )}
            </div>

            <h1 className="text-center text-3xl font-bold">{name}</h1>
            <p className="text-center text-sm text-base-content/60 -mt-2">
              Acceso para administradores y empleados
            </p>

            {error && (
              <div className="alert alert-error text-sm mt-2 animate-section-in">
                <span>{error}</span>
              </div>
            )}

            <LoginForm
              onSubmit={handleLogin}
              success={success}
              onUserChange={setUserLen}
              onPassChange={setPassLen}
              onFieldFocus={(field) => {
                setMode(field);
                setFocused(true);
              }}
              onFieldBlur={() => setFocused(false)}
            />

            <div className="divider text-xs text-base-content/40">o</div>

            <Link to="/" className="btn btn-ghost btn-sm">
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>

      {/* Transición de éxito: círculo que cubre la pantalla antes de navegar */}
      {success && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
          <div className="absolute h-[250vmax] w-[250vmax] rounded-full bg-primary animate-circle-expand" />
          <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-primary-content/15 text-primary-content animate-pop-in">
            <BaseIcon icon="check" size={40} viewBox="0 0 24 24" />
          </div>
        </div>
      )}
    </div>
  );
}
