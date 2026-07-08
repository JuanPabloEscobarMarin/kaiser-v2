import { Link } from "react-router";
import { ServiceCard } from "@/ui/components/ServiceCard";
import { Reveal } from "@/ui/components/Reveal";
import type { SectionCtx } from "./types";

export function ServicesSection({ c, services }: SectionCtx) {
  return (
    <section id="servicios" className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="flex items-end justify-between mb-6 flex-wrap gap-2">
        <div>
          <h2 className="text-3xl font-bold">{c.services.title}</h2>
          <p className="text-base-content/70">{c.services.subtitle}</p>
        </div>
        <Link to="/booking" className="btn btn-ghost btn-sm">
          Ver todos →
        </Link>
      </div>

      {services.length === 0 ? (
        <p className="text-center opacity-60 py-6">Cargando servicios...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 group/grid">
          {services.map((s, i) => (
            <Reveal key={s.id} index={i} spotlight className="h-full">
              <ServiceCard service={s} />
            </Reveal>
          ))}
        </div>
      )}
    </section>
  );
}
