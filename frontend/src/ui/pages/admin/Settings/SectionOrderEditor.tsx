import type { HomeContent, SectionId } from "@/core/types";

const SECTION_LABELS: Record<SectionId, string> = {
  features: "Características destacadas",
  services: "Servicios",
  howItWorks: "¿Cómo funciona?",
  team: "Equipo",
  gallery: "Galería",
  testimonials: "Testimonios",
  contact: "Contacto",
};

interface Props {
  value: HomeContent["sections"];
  onChange: (value: HomeContent["sections"]) => void;
}

export function SectionOrderEditor({ value, onChange }: Props) {
  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target]!, next[index]!];
    onChange(next);
  };

  const toggle = (index: number) =>
    onChange(
      value.map((s, i) => (i === index ? { ...s, enabled: !s.enabled } : s)),
    );

  return (
    <ul className="space-y-1">
      {value.map((s, i) => (
        <li
          key={s.id}
          className="flex items-center gap-2 rounded-box border border-base-300 bg-base-100 px-3 py-1.5"
        >
          <div className="flex flex-col">
            <button
              type="button"
              className="btn btn-xs btn-ghost px-1 leading-none"
              disabled={i === 0}
              onClick={() => move(i, -1)}
              aria-label={`Subir ${SECTION_LABELS[s.id]}`}
            >
              ▲
            </button>
            <button
              type="button"
              className="btn btn-xs btn-ghost px-1 leading-none"
              disabled={i === value.length - 1}
              onClick={() => move(i, 1)}
              aria-label={`Bajar ${SECTION_LABELS[s.id]}`}
            >
              ▼
            </button>
          </div>
          <span
            className={`flex-1 text-sm font-medium ${
              s.enabled ? "" : "opacity-50 line-through"
            }`}
          >
            {SECTION_LABELS[s.id]}
          </span>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs opacity-60 w-12 text-right">
              {s.enabled ? "Visible" : "Oculta"}
            </span>
            <input
              type="checkbox"
              className="toggle toggle-sm toggle-primary"
              checked={s.enabled}
              onChange={() => toggle(i)}
            />
          </label>
        </li>
      ))}
    </ul>
  );
}
