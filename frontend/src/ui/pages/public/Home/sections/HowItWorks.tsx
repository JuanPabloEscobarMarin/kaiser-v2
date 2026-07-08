import { Reveal } from "@/ui/components/Reveal";
import type { SectionCtx } from "./types";

export function HowItWorks({ c }: SectionCtx) {
  return (
    <section className="bg-base-100 border-y border-base-300">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <h2 className="text-3xl font-bold text-center mb-2">
          {c.howItWorks.title}
        </h2>
        <p className="text-center text-base-content/70 mb-10">
          {c.howItWorks.subtitle}
        </p>

        <ul className="steps steps-vertical sm:steps-horizontal w-full">
          {c.howItWorks.steps.map((step, i) => (
            <li
              key={i}
              className="step step-primary"
              data-content={String(i + 1)}
            >
              <Reveal index={i} className="px-3 pt-2 max-w-[220px]">
                <h3 className="font-semibold mb-1">{step.title}</h3>
                <p className="text-xs opacity-70">{step.description}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
