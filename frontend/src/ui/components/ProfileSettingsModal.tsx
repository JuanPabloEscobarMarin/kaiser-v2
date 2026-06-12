import { useEffect, useState, type FormEvent } from "react";
import { ApiError, resourcesApi } from "@/core/api";
import { useAuth } from "@/ui/hooks/useAuth";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const initials = (fullName: string) =>
  fullName
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

type Tab = "profile" | "password";

export function ProfileSettingsModal({ isOpen, onClose }: Props) {
  const { user, updateProfile, changePassword } = useAuth();
  const [tab, setTab] = useState<Tab>("profile");

  // Profile form
  const [username, setUsername] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Feedback
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Reset state whenever the modal is opened or the user changes
  useEffect(() => {
    if (!isOpen) return;
    setTab("profile");
    setUsername(user?.username ?? "");
    setAvatarFile(null);
    setAvatarPreview(null);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
    setSuccess(null);
  }, [isOpen, user]);

  // Build a local preview when a file is picked
  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(null);
      return;
    }
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  if (!isOpen) return null;

  const currentAvatarUrl =
    avatarPreview ??
    (user?.avatarSlug ? resourcesApi.imageUrl(user.avatarSlug) : null);

  const submitProfile = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const payload: { username?: string; avatarSlug?: string | null } = {};

      if (username && username !== user?.username) {
        payload.username = username;
      }

      if (avatarFile) {
        const uploaded = await resourcesApi.upload(avatarFile);
        payload.avatarSlug = uploaded.slug;
      }

      if (Object.keys(payload).length === 0) {
        setError("No hay cambios para guardar");
        return;
      }

      await updateProfile(payload);
      setAvatarFile(null);
      setSuccess("Perfil actualizado correctamente");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al actualizar");
    } finally {
      setSubmitting(false);
    }
  };

  const submitPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setSubmitting(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess("Contraseña actualizada");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al cambiar la contraseña");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg">Mi perfil</h2>
          <button
            type="button"
            className="btn btn-sm btn-circle btn-ghost"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div role="tablist" className="tabs tabs-boxed mb-4">
          <button
            role="tab"
            className={`tab ${tab === "profile" ? "tab-active" : ""}`}
            onClick={() => {
              setTab("profile");
              setError(null);
              setSuccess(null);
            }}
          >
            Perfil
          </button>
          <button
            role="tab"
            className={`tab ${tab === "password" ? "tab-active" : ""}`}
            onClick={() => {
              setTab("password");
              setError(null);
              setSuccess(null);
            }}
          >
            Contraseña
          </button>
        </div>

        {error && <div className="alert alert-error text-sm mb-3">{error}</div>}
        {success && (
          <div className="alert alert-success text-sm mb-3">{success}</div>
        )}

        {tab === "profile" ? (
          <form onSubmit={submitProfile} className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="avatar">
                {currentAvatarUrl ? (
                  <div className="w-20 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                    <img src={currentAvatarUrl} alt="Avatar" />
                  </div>
                ) : (
                  <div className="avatar-placeholder">
                    <div className="bg-neutral text-neutral-content w-20 rounded-full">
                      <span className="text-xl font-bold">
                        {initials(user?.username ?? "?")}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium block mb-1">
                  Foto de perfil
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="file-input file-input-bordered file-input-sm w-full"
                  onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
                />
                <p className="text-xs opacity-60 mt-1">
                  PNG, JPG o WEBP — máx 5 MB
                </p>
              </div>
            </div>

            <fieldset>
              <legend className="text-sm font-medium mb-1">
                Nombre de usuario
              </legend>
              <input
                type="text"
                className="input input-bordered w-full"
                value={username}
                minLength={3}
                maxLength={50}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </fieldset>

            <div className="modal-action">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting && <span className="loading loading-spinner" />}
                Guardar cambios
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={submitPassword} className="space-y-3">
            <fieldset>
              <legend className="text-sm font-medium mb-1">
                Contraseña actual
              </legend>
              <input
                type="password"
                className="input input-bordered w-full"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </fieldset>

            <fieldset>
              <legend className="text-sm font-medium mb-1">
                Nueva contraseña
              </legend>
              <input
                type="password"
                className="input input-bordered w-full"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                required
                autoComplete="new-password"
              />
              <p className="text-xs opacity-60 mt-1">Mínimo 6 caracteres</p>
            </fieldset>

            <fieldset>
              <legend className="text-sm font-medium mb-1">
                Confirmar nueva contraseña
              </legend>
              <input
                type="password"
                className="input input-bordered w-full"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </fieldset>

            <div className="modal-action">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting && <span className="loading loading-spinner" />}
                Cambiar contraseña
              </button>
            </div>
          </form>
        )}
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}
