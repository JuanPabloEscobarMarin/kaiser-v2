import { useState, type FormEvent } from "react";
import { ApiError, employeePortalApi } from "@/core/api";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  employeeName: string;
  hasAccount: boolean;
  onSuccess: () => void;
}

export function CreateAccountModal({
  isOpen,
  onClose,
  employeeId,
  employeeName,
  hasAccount,
  onSuccess,
}: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await employeePortalApi.createAccount(employeeId, { username, password, phone });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al crear cuenta");
    } finally {
      setLoading(false);
    }
  };

  const removeAccount = async () => {
    if (!confirm("¿Eliminar la cuenta de acceso de este empleado?")) return;
    setLoading(true);
    try {
      await employeePortalApi.removeAccount(employeeId);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al eliminar cuenta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg">
            {hasAccount ? "Cuenta de empleado" : "Crear cuenta"}
          </h2>
          <button className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>✕</button>
        </div>

        <p className="text-sm opacity-60 mb-4">{employeeName}</p>

        {error && <div className="alert alert-error text-sm mb-3">{error}</div>}

        {hasAccount ? (
          <div className="space-y-3">
            <div className="alert alert-success text-sm">
              Este empleado ya tiene acceso al portal.
            </div>
            <div className="flex justify-end gap-2">
              <button className="btn btn-ghost btn-sm" onClick={onClose}>Cerrar</button>
              <button
                className="btn btn-error btn-sm"
                onClick={removeAccount}
                disabled={loading}
              >
                {loading && <span className="loading loading-spinner loading-xs" />}
                Revocar acceso
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <fieldset>
              <legend className="text-sm font-medium mb-1">Usuario</legend>
              <input
                type="text"
                className="input input-bordered w-full"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                minLength={3}
                required
              />
            </fieldset>
            <fieldset>
              <legend className="text-sm font-medium mb-1">Contraseña</legend>
              <input
                type="password"
                className="input input-bordered w-full"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </fieldset>
            <fieldset>
              <legend className="text-sm font-medium mb-1">Teléfono (para login)</legend>
              <input
                type="tel"
                className="input input-bordered w-full"
                placeholder="3001234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                minLength={7}
                required
              />
            </fieldset>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
                {loading && <span className="loading loading-spinner loading-xs" />}
                Crear cuenta
              </button>
            </div>
          </form>
        )}
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}
