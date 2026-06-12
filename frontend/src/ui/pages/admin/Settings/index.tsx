import { useEffect, useState, type FormEvent } from "react";
import { ApiError, resourcesApi, settingsApi } from "@/core/api";
import type { BusinessSettingsInput, HomeContent } from "@/core/types";
import { useNotify } from "@/ui/hooks/useNotify";
import { applyPrimaryColor } from "@/core/branding/branding";
import { HOME_CONTENT_DEFAULTS } from "@/core/branding/home-content";
import { useBranding } from "@/ui/contexts/branding/context";
import { HomeContentSection } from "./HomeContentSection";
import heroDefault from "@/assets/hero-barbershop.jpg";

const DEFAULT_PRIMARY = "#570df8";

const empty: BusinessSettingsInput = {
  name: "",
  phone: "",
  whatsapp: "",
  email: "",
  address: "",
  openTimeWeekday: "09:00",
  closeTimeWeekday: "18:00",
  closedWeekday: false,
  openTimeSaturday: "09:00",
  closeTimeSaturday: "17:00",
  closedSaturday: false,
  openTimeSunday: "09:00",
  closeTimeSunday: "14:00",
  closedSunday: true,
  heroImageSlug: null,
  logoSlug: null,
  primaryColor: DEFAULT_PRIMARY,
  homeContent: HOME_CONTENT_DEFAULTS,
};

const COLOR_PRESETS = [
  "#570df8", // Default DaisyUI purple
  "#4f46e5", // Indigo
  "#0ea5e9", // Sky
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#ec4899", // Pink
  "#1f2937", // Slate
];

export function BusinessSettingsPage() {
  const [form, setForm] = useState<BusinessSettingsInput>(empty);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [heroPreview, setHeroPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const notify = useNotify();
  const branding = useBranding();

  useEffect(() => {
    settingsApi
      .get()
      .then((data) => {
        const { id: _id, updatedAt: _u, ...rest } = data;
        setForm(rest);
      })
      .catch(() => setError("No se pudo cargar la configuración"))
      .finally(() => setLoading(false));
  }, []);

  // Build a local preview when a new hero file is picked
  useEffect(() => {
    if (!heroFile) { setHeroPreview(null); return; }
    const url = URL.createObjectURL(heroFile);
    setHeroPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [heroFile]);

  // Build a local preview when a new logo file is picked
  useEffect(() => {
    if (!logoFile) { setLogoPreview(null); return; }
    const url = URL.createObjectURL(logoFile);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  const onChange =
    (key: keyof BusinessSettingsInput) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload: BusinessSettingsInput = { ...form };
      if (heroFile) {
        const uploaded = await resourcesApi.upload(heroFile);
        payload.heroImageSlug = uploaded.slug;
      }
      if (logoFile) {
        const uploaded = await resourcesApi.upload(logoFile);
        payload.logoSlug = uploaded.slug;
      }
      const { data } = await settingsApi.update(payload);
      const { id: _id, updatedAt: _u, ...rest } = data;
      setForm(rest);
      setHeroFile(null);
      setLogoFile(null);
      // Refresh shared branding so the navbar / sidebar pick up the new name + color
      await branding.refresh();
      notify.setMessage({
        label: "Configuración guardada",
        type: "success",
      });
      notify.notify();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al guardar");
    } finally {
      setSubmitting(false);
    }
  };

  const removeHero = () => {
    setForm((f) => ({ ...f, heroImageSlug: null }));
    setHeroFile(null);
  };

  const removeLogo = () => {
    setForm((f) => ({ ...f, logoSlug: null }));
    setLogoFile(null);
  };

  const currentLogoUrl =
    logoPreview ??
    (form.logoSlug ? resourcesApi.imageUrl(form.logoSlug) : null);

  const onHomeContentChange = (next: HomeContent) =>
    setForm((f) => ({ ...f, homeContent: next }));

  // Live preview: apply the color globally as the user picks
  const onColorChange = (hex: string) => {
    setForm((f) => ({ ...f, primaryColor: hex }));
    applyPrimaryColor(hex);
  };

  const currentHeroUrl =
    heroPreview ??
    (form.heroImageSlug
      ? resourcesApi.imageUrl(form.heroImageSlug)
      : heroDefault);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Configuración del negocio</h1>
      <p className="text-sm text-base-content/70 mb-6">
        Esta información se muestra a los clientes en la página principal.
      </p>

      {error && <div className="alert alert-error text-sm mb-4">{error}</div>}

      <form onSubmit={submit} className="space-y-6">
        {/* Identidad */}
        <section className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="font-bold text-lg">Identidad</h2>

            <fieldset>
              <legend className="text-sm font-medium mb-1">
                Nombre del negocio
              </legend>
              <input
                type="text"
                className="input input-bordered w-full"
                value={form.name}
                onChange={onChange("name")}
                required
              />
            </fieldset>

            <fieldset className="mt-2">
              <legend className="text-sm font-medium mb-1">Logo del negocio</legend>
              <div className="flex items-center gap-4 mb-2">
                {currentLogoUrl ? (
                  <img
                    src={currentLogoUrl}
                    alt="Logo actual"
                    className="h-16 max-w-[160px] object-contain rounded border border-base-300 bg-base-200 p-1"
                  />
                ) : (
                  <div className="h-16 w-32 flex items-center justify-center text-xs opacity-50 border border-dashed border-base-300 rounded">
                    Sin logo
                  </div>
                )}
                <div className="flex-1 space-y-1">
                  <input
                    type="file"
                    accept="image/*"
                    className="file-input file-input-bordered file-input-sm w-full"
                    onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                  />
                  {(form.logoSlug || logoFile) && (
                    <button type="button" className="btn btn-xs btn-ghost" onClick={removeLogo}>
                      Quitar logo
                    </button>
                  )}
                  <p className="text-xs opacity-60">PNG o SVG con fondo transparente. Máx 5 MB.</p>
                </div>
              </div>
            </fieldset>

            <fieldset className="mt-2">
              <legend className="text-sm font-medium mb-1">
                Imagen principal del home
              </legend>
              <div className="rounded-box overflow-hidden border border-base-300 mb-2 bg-base-200 aspect-video">
                {currentHeroUrl ? (
                  <img
                    src={currentHeroUrl}
                    alt="Vista previa imagen principal"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm opacity-60">
                    Sin imagen
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  className="file-input file-input-bordered file-input-sm flex-1 min-w-[200px]"
                  onChange={(e) => setHeroFile(e.target.files?.[0] ?? null)}
                />
                {(form.heroImageSlug || heroFile) && (
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    onClick={removeHero}
                  >
                    Usar imagen por defecto
                  </button>
                )}
              </div>
              <p className="text-xs opacity-60 mt-1">
                Se muestra como portada en la página de inicio. Recomendado:
                horizontal, mín. 1600×900 px, máx. 5 MB.
              </p>
            </fieldset>
          </div>
        </section>

        {/* Apariencia */}
        <section className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="font-bold text-lg">Apariencia</h2>

            <fieldset>
              <legend className="text-sm font-medium mb-1">
                Color principal
              </legend>
              <p className="text-xs opacity-60 mb-3">
                Es el color de los botones, badges y enlaces destacados (como
                "Reservar"). Se aplica en todo el sitio.
              </p>

              <div className="flex flex-wrap items-center gap-3 mb-3">
                <input
                  type="color"
                  className="h-12 w-16 rounded cursor-pointer border border-base-300 bg-base-100"
                  value={form.primaryColor}
                  onChange={(e) => onColorChange(e.target.value)}
                  aria-label="Selector de color"
                />
                <input
                  type="text"
                  className="input input-bordered w-32 font-mono uppercase"
                  value={form.primaryColor}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForm((f) => ({ ...f, primaryColor: v }));
                    if (/^#[0-9a-fA-F]{6}$/.test(v)) applyPrimaryColor(v);
                  }}
                  pattern="^#[0-9a-fA-F]{6}$"
                  maxLength={7}
                />
                <button
                  type="button"
                  onClick={() => onColorChange(DEFAULT_PRIMARY)}
                  className="btn btn-sm btn-ghost"
                >
                  Restablecer
                </button>

                {/* Vista previa */}
                <div className="ml-auto flex items-center gap-2">
                  <button type="button" className="btn btn-primary btn-sm">
                    Reservar
                  </button>
                  <span className="badge badge-primary">badge</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => onColorChange(c)}
                    className={`h-8 w-8 rounded-full border-2 transition ${
                      form.primaryColor.toLowerCase() === c.toLowerCase()
                        ? "border-base-content scale-110"
                        : "border-base-300 hover:scale-105"
                    }`}
                    style={{ backgroundColor: c }}
                    aria-label={`Usar color ${c}`}
                    title={c}
                  />
                ))}
              </div>
            </fieldset>
          </div>
        </section>

        {/* Contacto */}
        <section className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="font-bold text-lg">Contacto</h2>

            <div className="grid sm:grid-cols-2 gap-3">
              <fieldset>
                <legend className="text-sm font-medium mb-1">Teléfono</legend>
                <input
                  type="tel"
                  className="input input-bordered w-full"
                  placeholder="+57 300 123 4567"
                  value={form.phone}
                  onChange={onChange("phone")}
                  required
                />
              </fieldset>

              <fieldset>
                <legend className="text-sm font-medium mb-1">WhatsApp</legend>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="573001234567"
                  value={form.whatsapp}
                  onChange={onChange("whatsapp")}
                  pattern="[0-9]+"
                  required
                />
                <p className="text-xs opacity-60 mt-1">
                  Solo números, sin + ni espacios. Ej:{" "}
                  <code>573001234567</code>
                </p>
              </fieldset>

              <fieldset className="sm:col-span-2">
                <legend className="text-sm font-medium mb-1">Email</legend>
                <input
                  type="email"
                  className="input input-bordered w-full"
                  value={form.email}
                  onChange={onChange("email")}
                  required
                />
              </fieldset>
            </div>
          </div>
        </section>

        {/* Ubicación */}
        <section className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="font-bold text-lg">Ubicación</h2>

            <fieldset>
              <legend className="text-sm font-medium mb-1">Dirección</legend>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="Calle 45 #12-34, Bogotá"
                value={form.address}
                onChange={onChange("address")}
                required
              />
              <p className="text-xs opacity-60 mt-1">
                Se usa también para abrir la dirección en Google Maps
              </p>
            </fieldset>
          </div>
        </section>

        {/* Horarios */}
        <section className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="font-bold text-lg">Horarios de atención</h2>
            <p className="text-sm text-base-content/70 -mt-2">
              Estos horarios determinan los turnos disponibles en el sistema de reservas.
            </p>

            <div className="space-y-3">
              {(
                [
                  { label: "Lunes – Viernes", openKey: "openTimeWeekday", closeKey: "closeTimeWeekday", closedKey: "closedWeekday" },
                  { label: "Sábados", openKey: "openTimeSaturday", closeKey: "closeTimeSaturday", closedKey: "closedSaturday" },
                  { label: "Domingos", openKey: "openTimeSunday", closeKey: "closeTimeSunday", closedKey: "closedSunday" },
                ] as const
              ).map(({ label, openKey, closeKey, closedKey }) => (
                <div key={label} className="flex flex-wrap items-center gap-3 p-3 rounded-box border border-base-300">
                  <span className="text-sm font-medium w-32">{label}</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="toggle toggle-error toggle-sm"
                      checked={!!form[closedKey]}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, [closedKey]: e.target.checked }))
                      }
                    />
                    <span className="text-xs opacity-70">Cerrado</span>
                  </label>
                  {!form[closedKey] && (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        className="input input-bordered input-sm"
                        value={form[openKey] as string}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, [openKey]: e.target.value }))
                        }
                      />
                      <span className="text-xs opacity-50">a</span>
                      <input
                        type="time"
                        className="input input-bordered input-sm"
                        value={form[closeKey] as string}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, [closeKey]: e.target.value }))
                        }
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contenido del home */}
        <HomeContentSection
          value={form.homeContent}
          onChange={onHomeContentChange}
        />

        <div className="flex justify-end pt-2">
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
    </div>
  );
}
