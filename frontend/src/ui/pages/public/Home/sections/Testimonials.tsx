import { Reveal } from "@/ui/components/Reveal";
import type { SectionCtx } from "./types";

export function Testimonials({ c }: SectionCtx) {
  const t = c.testimonials;
  if (t.items.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-12 max-w-5xl">
      <Reveal>
        <h2 className="text-3xl font-bold text-center mb-2">{t.title}</h2>
        <p className="text-center text-base-content/70 mb-8">{t.subtitle}</p>
      </Reveal>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 group/grid">
        {t.items.map((item, i) => (
          <Reveal key={i} index={i} spotlight className="h-full">
            <figure className="card bg-base-100 border border-base-300/60 shadow h-full transition-all duration-300 ease-out hover:scale-[1.03] hover:shadow-2xl hover:border-primary/40 hover:z-10 lg:group-hover/grid:opacity-55 lg:hover:!opacity-100">
              <div className="card-body">
                <Stars rating={item.rating} />
                <blockquote className="text-sm text-base-content/80">
                  “{item.text}”
                </blockquote>
                <figcaption className="font-semibold text-sm mt-auto pt-2">
                  — {item.name}
                </figcaption>
              </div>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <div
      className="text-warning text-lg leading-none"
      role="img"
      aria-label={`${rating} de 5 estrellas`}
    >
      {[1, 2, 3, 4, 5].map((r) => (
        <span key={r} className={r <= rating ? "" : "opacity-25"} aria-hidden="true">
          ★
        </span>
      ))}
    </div>
  );
}
