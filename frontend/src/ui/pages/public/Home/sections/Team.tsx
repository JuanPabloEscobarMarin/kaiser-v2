import { resourcesApi } from "@/core/api";
import { Reveal } from "@/ui/components/Reveal";
import { FadeImg } from "@/ui/components/FadeImg";
import { initials } from "@/lib/format";
import type { SectionCtx } from "./types";

export function Team({ c, employees }: SectionCtx) {
  if (employees.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-12 max-w-5xl">
      <h2 className="text-3xl font-bold mb-2">{c.team.title}</h2>
      <p className="text-base-content/70 mb-6">{c.team.subtitle}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 group/grid">
        {employees.map((emp, i) => (
          <Reveal key={emp.id} index={i} spotlight className="h-full">
            <div className="card bg-base-100 border border-base-300/60 shadow items-center p-5 text-center h-full transition-all duration-300 ease-out hover:scale-[1.04] hover:shadow-2xl hover:border-primary/40 hover:z-10 lg:group-hover/grid:opacity-55 lg:hover:!opacity-100 group/card">
              {emp.urlImage ? (
                <div className="avatar">
                  <div className="w-20 rounded-full bg-base-300 transition-transform duration-300 group-hover/card:scale-110">
                    <FadeImg
                      src={resourcesApi.imageUrl(emp.urlImage) ?? undefined}
                      alt={emp.fullName}
                    />
                  </div>
                </div>
              ) : (
                <div className="avatar avatar-placeholder">
                  <div className="bg-neutral text-neutral-content w-20 rounded-full transition-transform duration-300 group-hover/card:scale-110">
                    <span className="text-xl font-bold">
                      {initials(emp.fullName)}
                    </span>
                  </div>
                </div>
              )}
              <h3 className="font-semibold mt-3">{emp.fullName}</h3>
              <p className="text-xs opacity-60">Estilista</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
