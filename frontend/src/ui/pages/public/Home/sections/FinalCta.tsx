import { Link } from "react-router";
import { Reveal } from "@/ui/components/Reveal";
import type { HomeContent } from "@/core/types";

export function FinalCta({ c }: { c: HomeContent }) {
  return (
    <section className="container mx-auto px-4 py-12 max-w-3xl text-center">
      <Reveal>
        <h2 className="text-3xl font-bold mb-3">{c.finalCta.title}</h2>
        <p className="text-base-content/70 mb-6">{c.finalCta.subtitle}</p>
        <Link
          to="/booking"
          className="btn btn-primary btn-lg hover:-translate-y-0.5 active:scale-95 transition-transform motion-reduce:transform-none"
        >
          {c.finalCta.button}
        </Link>
      </Reveal>
    </section>
  );
}
