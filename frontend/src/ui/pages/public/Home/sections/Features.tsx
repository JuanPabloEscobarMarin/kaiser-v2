import { Reveal } from "@/ui/components/Reveal";
import type { SectionCtx } from "./types";

export function Features({ c }: SectionCtx) {
  return (
    <section className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 group/grid">
        {c.features.map((f, i) => (
          <Reveal key={i} index={i} spotlight>
            <Feature title={f.title} desc={f.description} icon={f.icon} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Feature({
  title,
  desc,
  icon,
}: {
  title: string;
  desc: string;
  icon: string;
}) {
  return (
    <div className="card bg-base-100 border border-base-300/60 shadow h-full transition-all duration-300 ease-out hover:scale-[1.03] hover:shadow-2xl hover:border-primary/40 hover:z-10 lg:group-hover/grid:opacity-55 lg:hover:!opacity-100 group/card">
      <div className="card-body items-start">
        {icon ? (
          <div className="text-3xl transition-transform duration-300 group-hover/card:scale-125 group-hover/card:-rotate-6">
            {icon}
          </div>
        ) : null}
        <h3 className="card-title text-lg">{title}</h3>
        <p className="text-sm text-base-content/70">{desc}</p>
      </div>
    </div>
  );
}
