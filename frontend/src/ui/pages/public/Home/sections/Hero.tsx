import { useState } from "react";
import { Link } from "react-router";
import heroDefault from "@/assets/hero-barbershop.jpg";
import { resourcesApi } from "@/core/api";
import type { BusinessSettings, HomeContent } from "@/core/types";
import { FadeImg } from "@/ui/components/FadeImg";
import { useParallax } from "@/ui/hooks/useParallax";

interface Props {
  c: HomeContent;
  business: BusinessSettings | null;
  /** "#servicios" si la sección de servicios está visible; "/booking" si no. */
  secondaryCtaHref: string;
}

export function Hero({ c, business, secondaryCtaHref }: Props) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const parallaxRef = useParallax<HTMLImageElement>(0.2);

  // Nunca pintamos la imagen default de forma especulativa: mientras settings
  // no llega (business === null) el fondo queda neutro y solo entra el texto;
  // la imagen real hace fade-in al terminar de cargar.
  const heroSrc = business
    ? (resourcesApi.imageUrl(business.heroImageSlug) ?? heroDefault)
    : null;

  const logoUrl = business?.logoSlug
    ? resourcesApi.imageUrl(business.logoSlug)
    : null;

  const { hero } = c;
  const overlay = hero.overlayGradient
    ? `linear-gradient(rgba(0,0,0,${hero.overlayOpacity * 0.5}), rgba(0,0,0,${hero.overlayOpacity}))`
    : `rgba(0,0,0,${hero.overlayOpacity})`;
  const alignLeft = hero.align === "left";

  return (
    <section
      className={`relative overflow-hidden bg-neutral flex ${
        hero.height === "full" ? "min-h-svh" : "min-h-[70vh]"
      }`}
    >
      {heroSrc && (
        <img
          ref={parallaxRef}
          src={heroSrc}
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          onLoad={() => setImgLoaded(true)}
          // 130% de alto anclado arriba: deja margen para el parallax sin
          // destapar el fondo por ninguno de los dos bordes.
          className={`absolute inset-x-0 -top-[30%] h-[130%] w-full object-cover will-change-transform transition-opacity duration-700 motion-reduce:transition-none ${
            imgLoaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
      <div className="absolute inset-0" style={{ background: overlay }} />

      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-16">
        <div
          className={`max-w-2xl text-neutral-content ${
            alignLeft ? "text-center md:text-left" : "text-center"
          }`}
        >
          {logoUrl && (
            <div className="animate-hero-item">
              <FadeImg
                src={logoUrl}
                alt={business?.name ?? "Logo"}
                className={`h-16 md:h-20 max-w-[220px] object-contain mb-5 animate-logo-float drop-shadow-lg ${
                  alignLeft ? "mx-auto md:mx-0" : "mx-auto"
                }`}
              />
            </div>
          )}
          <h1
            className="mb-4 text-4xl md:text-6xl font-bold animate-hero-item"
            style={{ animationDelay: "120ms" }}
          >
            {hero.title}
          </h1>
          <p
            className="mb-6 text-lg text-white/90 animate-hero-item"
            style={{ animationDelay: "240ms" }}
          >
            {hero.subtitle}
          </p>
          <div
            className={`flex flex-wrap gap-3 animate-hero-item ${
              alignLeft ? "justify-center md:justify-start" : "justify-center"
            }`}
            style={{ animationDelay: "360ms" }}
          >
            <Link
              to="/booking"
              className="btn btn-primary btn-lg hover:-translate-y-0.5 active:scale-95 transition-transform motion-reduce:transform-none"
            >
              {hero.primaryCta}
            </Link>
            {secondaryCtaHref.startsWith("#") ? (
              <a
                href={secondaryCtaHref}
                className="btn btn-ghost btn-lg text-white"
              >
                {hero.secondaryCta}
              </a>
            ) : (
              <Link
                to={secondaryCtaHref}
                className="btn btn-ghost btn-lg text-white"
              >
                {hero.secondaryCta}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
