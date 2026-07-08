import type { HomeContent } from "@/core/types";
import { EmojiPicker } from "@/ui/components/EmojiPicker";
import { SectionOrderEditor } from "./SectionOrderEditor";
import { TestimonialsEditor } from "./TestimonialsEditor";

interface Props {
  value: HomeContent;
  onChange: (value: HomeContent) => void;
}

const Field = ({
  label,
  value,
  onChange,
  textarea,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
  placeholder?: string;
}) => (
  <fieldset>
    <legend className="text-sm font-medium mb-1">{label}</legend>
    {textarea ? (
      <textarea
        className="textarea textarea-bordered w-full"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
      />
    ) : (
      <input
        type="text"
        className="input input-bordered w-full"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    )}
  </fieldset>
);

const Group = ({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => (
  <details
    className="collapse collapse-arrow bg-base-200 border border-base-300"
    open={defaultOpen}
  >
    <summary className="collapse-title font-semibold">{title}</summary>
    <div className="collapse-content space-y-3">{children}</div>
  </details>
);

export function HomeContentSection({ value, onChange }: Props) {
  const update = <K extends keyof HomeContent>(
    key: K,
    patch: Partial<HomeContent[K]>,
  ) => {
    onChange({ ...value, [key]: { ...value[key], ...patch } });
  };

  const updateFeature = (
    index: number,
    patch: Partial<HomeContent["features"][number]>,
  ) => {
    const next = value.features.map((f, i) =>
      i === index ? { ...f, ...patch } : f,
    );
    onChange({ ...value, features: next });
  };

  const updateStep = (
    index: number,
    patch: Partial<HomeContent["howItWorks"]["steps"][number]>,
  ) => {
    const next = value.howItWorks.steps.map((s, i) =>
      i === index ? { ...s, ...patch } : s,
    );
    onChange({
      ...value,
      howItWorks: { ...value.howItWorks, steps: next },
    });
  };

  return (
    <section className="card bg-base-100 shadow">
      <div className="card-body">
        <h2 className="font-bold text-lg">Contenido de la página de inicio</h2>
        <p className="text-sm text-base-content/70 -mt-2">
          Personaliza todos los textos y emojis que se muestran a los clientes
          en{" "}
          <code className="text-xs bg-base-200 px-1 rounded">/</code>.
        </p>

        <div className="space-y-3 mt-2">
          {/* Orden y visibilidad de secciones */}
          <Group title="Secciones y orden" defaultOpen>
            <p className="text-xs opacity-60">
              Reordena las secciones intermedias de la página y oculta las que
              no quieras mostrar. El hero y la llamada a la acción final son
              fijos.
            </p>
            <SectionOrderEditor
              value={value.sections}
              onChange={(next) => onChange({ ...value, sections: next })}
            />
          </Group>

          {/* Hero */}
          <Group title="Sección principal (hero)" defaultOpen>
            <Field
              label="Título"
              value={value.hero.title}
              onChange={(v) => update("hero", { title: v })}
            />
            <Field
              label="Subtítulo"
              value={value.hero.subtitle}
              onChange={(v) => update("hero", { subtitle: v })}
              textarea
            />
            <div className="grid sm:grid-cols-2 gap-3">
              <Field
                label="Texto botón primario"
                value={value.hero.primaryCta}
                onChange={(v) => update("hero", { primaryCta: v })}
              />
              <Field
                label="Texto botón secundario"
                value={value.hero.secondaryCta}
                onChange={(v) => update("hero", { secondaryCta: v })}
              />
            </div>

            <div className="divider text-xs">Apariencia del hero</div>

            <fieldset>
              <legend className="text-sm font-medium mb-1">
                Oscurecido de la imagen ({Math.round(value.hero.overlayOpacity * 100)}%)
              </legend>
              <input
                type="range"
                min={0}
                max={90}
                step={5}
                className="range range-sm range-primary"
                value={Math.round(value.hero.overlayOpacity * 100)}
                onChange={(e) =>
                  update("hero", {
                    overlayOpacity: Number(e.target.value) / 100,
                  })
                }
              />
              <p className="text-xs opacity-60 mt-1">
                Un velo oscuro sobre la imagen mejora la legibilidad del texto.
              </p>
            </fieldset>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="toggle toggle-sm toggle-primary"
                checked={value.hero.overlayGradient}
                onChange={(e) =>
                  update("hero", { overlayGradient: e.target.checked })
                }
              />
              <span className="text-sm">
                Degradado (más oscuro hacia abajo)
              </span>
            </label>

            <div className="grid sm:grid-cols-2 gap-3">
              <fieldset>
                <legend className="text-sm font-medium mb-1">Altura</legend>
                <select
                  className="select select-bordered w-full"
                  value={value.hero.height}
                  onChange={(e) =>
                    update("hero", {
                      height: e.target.value as HomeContent["hero"]["height"],
                    })
                  }
                >
                  <option value="normal">Normal</option>
                  <option value="full">Pantalla completa</option>
                </select>
              </fieldset>
              <fieldset>
                <legend className="text-sm font-medium mb-1">
                  Alineación del texto
                </legend>
                <select
                  className="select select-bordered w-full"
                  value={value.hero.align}
                  onChange={(e) =>
                    update("hero", {
                      align: e.target.value as HomeContent["hero"]["align"],
                    })
                  }
                >
                  <option value="center">Centrado</option>
                  <option value="left">Izquierda</option>
                </select>
              </fieldset>
            </div>
          </Group>

          {/* Banner promocional */}
          <Group title="Banner promocional">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="toggle toggle-sm toggle-primary"
                checked={value.promoBanner.enabled}
                onChange={(e) =>
                  update("promoBanner", { enabled: e.target.checked })
                }
              />
              <span className="text-sm">
                Mostrar barra de anuncio arriba del hero
              </span>
            </label>
            <Field
              label="Texto del anuncio"
              value={value.promoBanner.text}
              onChange={(v) => update("promoBanner", { text: v })}
              placeholder="✨ 20% de descuento en tu primera visita"
            />
            <div className="grid sm:grid-cols-2 gap-3">
              <Field
                label="Texto del enlace (opcional)"
                value={value.promoBanner.linkText}
                onChange={(v) => update("promoBanner", { linkText: v })}
                placeholder="Reservar ahora"
              />
              <Field
                label="URL del enlace"
                value={value.promoBanner.linkUrl}
                onChange={(v) => update("promoBanner", { linkUrl: v })}
                placeholder="/booking o https://..."
              />
            </div>
          </Group>

          {/* Features */}
          <Group title="Características destacadas (3 tarjetas)">
            {value.features.map((f, i) => (
              <div
                key={i}
                className="rounded-box border border-base-300 p-3 space-y-2 bg-base-100"
              >
                <p className="text-xs font-semibold opacity-70">
                  Característica {i + 1}
                </p>
                <div className="grid grid-cols-[120px_1fr] gap-2">
                  <EmojiPicker
                    label="Emoji"
                    value={f.icon}
                    onChange={(v) => updateFeature(i, { icon: v })}
                  />
                  <Field
                    label="Título"
                    value={f.title}
                    onChange={(v) => updateFeature(i, { title: v })}
                  />
                </div>
                <Field
                  label="Descripción"
                  value={f.description}
                  onChange={(v) => updateFeature(i, { description: v })}
                  textarea
                />
              </div>
            ))}
          </Group>

          {/* Servicios */}
          <Group title="Encabezado: Servicios">
            <Field
              label="Título"
              value={value.services.title}
              onChange={(v) => update("services", { title: v })}
            />
            <Field
              label="Subtítulo"
              value={value.services.subtitle}
              onChange={(v) => update("services", { subtitle: v })}
            />
          </Group>

          {/* Cómo funciona */}
          <Group title="¿Cómo funciona? (3 pasos)">
            <Field
              label="Título"
              value={value.howItWorks.title}
              onChange={(v) => update("howItWorks", { title: v })}
            />
            <Field
              label="Subtítulo"
              value={value.howItWorks.subtitle}
              onChange={(v) => update("howItWorks", { subtitle: v })}
            />
            {value.howItWorks.steps.map((s, i) => (
              <div
                key={i}
                className="rounded-box border border-base-300 p-3 space-y-2 bg-base-100"
              >
                <p className="text-xs font-semibold opacity-70">
                  Paso {i + 1}
                </p>
                <Field
                  label="Título"
                  value={s.title}
                  onChange={(v) => updateStep(i, { title: v })}
                />
                <Field
                  label="Descripción"
                  value={s.description}
                  onChange={(v) => updateStep(i, { description: v })}
                />
              </div>
            ))}
          </Group>

          {/* Equipo */}
          <Group title="Encabezado: Equipo">
            <Field
              label="Título"
              value={value.team.title}
              onChange={(v) => update("team", { title: v })}
            />
            <Field
              label="Subtítulo"
              value={value.team.subtitle}
              onChange={(v) => update("team", { subtitle: v })}
            />
          </Group>

          {/* Galería */}
          <Group title="Encabezado: Galería">
            <Field
              label="Título"
              value={value.gallery.title}
              onChange={(v) => update("gallery", { title: v })}
            />
            <Field
              label="Subtítulo"
              value={value.gallery.subtitle}
              onChange={(v) => update("gallery", { subtitle: v })}
            />
          </Group>

          {/* Testimonios */}
          <Group title="Testimonios">
            <Field
              label="Título"
              value={value.testimonials.title}
              onChange={(v) => update("testimonials", { title: v })}
            />
            <Field
              label="Subtítulo"
              value={value.testimonials.subtitle}
              onChange={(v) => update("testimonials", { subtitle: v })}
            />
            <TestimonialsEditor
              value={value.testimonials.items}
              onChange={(items) => update("testimonials", { items })}
            />
          </Group>

          {/* Contacto */}
          <Group title="Sección de contacto">
            <Field
              label="Título"
              value={value.contact.title}
              onChange={(v) => update("contact", { title: v })}
            />
            <Field
              label="Subtítulo"
              value={value.contact.subtitle}
              onChange={(v) => update("contact", { subtitle: v })}
              textarea
            />
            <div className="grid sm:grid-cols-2 gap-3">
              <Field
                label="Título de la card de horarios"
                value={value.contact.hoursTitle}
                onChange={(v) => update("contact", { hoursTitle: v })}
                placeholder="🕐 Horarios de atención"
              />
              <Field
                label="Botón en la card de horarios"
                value={value.contact.ctaButton}
                onChange={(v) => update("contact", { ctaButton: v })}
              />
            </div>
          </Group>

          {/* Final CTA */}
          <Group title="Llamada a la acción final">
            <Field
              label="Título"
              value={value.finalCta.title}
              onChange={(v) => update("finalCta", { title: v })}
            />
            <Field
              label="Subtítulo"
              value={value.finalCta.subtitle}
              onChange={(v) => update("finalCta", { subtitle: v })}
            />
            <Field
              label="Texto del botón"
              value={value.finalCta.button}
              onChange={(v) => update("finalCta", { button: v })}
            />
          </Group>

          {/* Botón flotante de WhatsApp */}
          <Group title="Botón flotante de WhatsApp">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="toggle toggle-sm toggle-primary"
                checked={value.whatsappButton.enabled}
                onChange={(e) =>
                  update("whatsappButton", { enabled: e.target.checked })
                }
              />
              <span className="text-sm">
                Mostrar botón flotante de WhatsApp en la página de inicio
              </span>
            </label>
            <p className="text-xs opacity-60">
              Usa el número de WhatsApp configurado en la sección
              &ldquo;Contacto&rdquo;.
            </p>
          </Group>
        </div>
      </div>
    </section>
  );
}
