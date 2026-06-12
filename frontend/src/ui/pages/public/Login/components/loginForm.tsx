import { useState } from "react";
import { BaseIcon } from "@/ui/components/base/BaseIcon";

interface LoginFormProps {
  onSubmit?: (username: string, password: string) => void;
  success?: boolean;
  onUserChange?: (length: number) => void;
  onPassChange?: (length: number) => void;
  onFieldFocus?: (field: "user" | "pass") => void;
  onFieldBlur?: () => void;
}

export function LoginForm({
  onSubmit,
  success = false,
  onUserChange,
  onPassChange,
  onFieldFocus,
  onFieldBlur,
}: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSubmit) return;
    setSubmitting(true);
    try {
      await onSubmit(username, password);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3 mt-2">
      <fieldset>
        <legend className="text-sm font-medium mb-1">Usuario</legend>
        <input
          type="text"
          placeholder="admin"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            onUserChange?.(e.target.value.length);
          }}
          onFocus={() => onFieldFocus?.("user")}
          onBlur={onFieldBlur}
          className="input input-bordered w-full"
          autoComplete="username"
          required
        />
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium mb-1">Contraseña</legend>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              onPassChange?.(e.target.value.length);
            }}
            onFocus={() => onFieldFocus?.("pass")}
            onBlur={onFieldBlur}
            className="input input-bordered w-full pr-12"
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-ghost btn-sm btn-circle"
            aria-label={
              showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
            }
          >
            <BaseIcon
              icon={showPassword ? "eyeOff" : "eye"}
              size={18}
              color="currentColor"
              viewBox="0 0 24 24"
            />
          </button>
        </div>
      </fieldset>

      <button
        type="submit"
        className={`btn w-full mt-2 transition-all duration-300 ${
          success ? "btn-success" : "btn-primary"
        }`}
        disabled={submitting || success}
      >
        {submitting && <span className="loading loading-spinner" />}
        {success ? (
          <span className="flex items-center gap-2 animate-pop-in">
            <BaseIcon icon="check" size={18} viewBox="0 0 24 24" />
            Bienvenido
          </span>
        ) : (
          "Iniciar sesión"
        )}
      </button>
    </form>
  );
}
