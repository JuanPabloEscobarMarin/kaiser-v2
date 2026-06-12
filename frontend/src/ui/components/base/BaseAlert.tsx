interface Props {
  label: string;
  variant?: "info" | "success" | "warning" | "error";
  /** Activa la animación de salida justo antes de desmontar. */
  leaving?: boolean;
  /** Milisegundos visibles; dibuja la barra de tiempo restante. */
  durationMs?: number;
}

export function BaseAlert({
  label,
  variant,
  leaving = false,
  durationMs = 5000,
}: Readonly<Props>) {
  return (
    <div
      role="alert"
      className={`alert alert-${variant} alert-soft fixed bottom-5 overflow-hidden shadow-lg ${
        leaving ? "animate-toast-out" : "animate-toast-in"
      }`}
    >
      <span>{label}</span>
      <div
        className="absolute bottom-0 left-0 h-0.5 bg-current opacity-40 animate-toast-progress"
        style={{ animationDuration: `${durationMs}ms` }}
      />
    </div>
  );
}
