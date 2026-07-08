import { useState } from "react";
import { resourcesApi } from "@/core/api";
import { Reveal } from "@/ui/components/Reveal";
import { FadeImg } from "@/ui/components/FadeImg";
import { Lightbox } from "@/ui/components/Lightbox";
import type { SectionCtx } from "./types";

export function GallerySection({ c, gallery }: SectionCtx) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (gallery.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-12 max-w-5xl">
      <Reveal>
        <h2 className="text-3xl font-bold text-center mb-2">
          {c.gallery.title}
        </h2>
        <p className="text-center text-base-content/70 mb-8">
          {c.gallery.subtitle}
        </p>
      </Reveal>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {gallery.map((img, i) => (
          <Reveal key={img.id} index={i}>
            <button
              type="button"
              onClick={() => setLightboxIndex(i)}
              aria-label={img.caption ?? "Ampliar imagen de la galería"}
              className="block w-full overflow-hidden rounded-box group aspect-square shadow-sm hover:shadow-xl transition-shadow duration-300 bg-base-300 cursor-zoom-in"
            >
              <FadeImg
                src={resourcesApi.imageUrl(img.slug) ?? undefined}
                alt={img.caption ?? "Trabajo de la barbería"}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
              />
            </button>
          </Reveal>
        ))}
      </div>

      <Lightbox
        images={gallery}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
      />
    </section>
  );
}
