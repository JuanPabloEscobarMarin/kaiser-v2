import type { HomeContent } from "@/core/types";

type Testimonial = HomeContent["testimonials"]["items"][number];

const MAX_ITEMS = 12;

interface Props {
  value: Testimonial[];
  onChange: (value: Testimonial[]) => void;
}

export function TestimonialsEditor({ value, onChange }: Props) {
  const update = (index: number, patch: Partial<Testimonial>) =>
    onChange(value.map((t, i) => (i === index ? { ...t, ...patch } : t)));

  const remove = (index: number) =>
    onChange(value.filter((_, i) => i !== index));

  const add = () => onChange([...value, { name: "", text: "", rating: 5 }]);

  return (
    <div className="space-y-3">
      {value.length === 0 && (
        <p className="text-xs opacity-60">
          Sin testimonios la sección no se muestra en la página.
        </p>
      )}
      {value.map((t, i) => (
        <div
          key={i}
          className="rounded-box border border-base-300 p-3 space-y-2 bg-base-100"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold opacity-70">
              Testimonio {i + 1}
            </p>
            <button
              type="button"
              className="btn btn-xs btn-ghost text-error"
              onClick={() => remove(i)}
            >
              Eliminar
            </button>
          </div>
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="Nombre del cliente"
            value={t.name}
            onChange={(e) => update(i, { name: e.target.value })}
          />
          <textarea
            className="textarea textarea-bordered w-full"
            rows={2}
            placeholder="¿Qué dijo el cliente?"
            value={t.text}
            onChange={(e) => update(i, { text: e.target.value })}
          />
          <div className="flex items-center gap-3">
            <span className="text-xs opacity-70">Calificación</span>
            <div className="rating rating-sm">
              {[1, 2, 3, 4, 5].map((r) => (
                <input
                  key={r}
                  type="radio"
                  name={`testimonial-rating-${i}`}
                  className="mask mask-star-2 bg-warning"
                  checked={t.rating === r}
                  onChange={() => update(i, { rating: r })}
                  aria-label={`${r} estrellas`}
                />
              ))}
            </div>
          </div>
        </div>
      ))}
      {value.length < MAX_ITEMS && (
        <button type="button" className="btn btn-sm btn-outline" onClick={add}>
          + Agregar testimonio
        </button>
      )}
    </div>
  );
}
