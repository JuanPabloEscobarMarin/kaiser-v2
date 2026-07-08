import { useEffect } from "react";
import { resourcesApi } from "@/core/api";
import type { GalleryImage } from "@/core/api/gallery.api";

interface Props {
  images: GalleryImage[];
  /** Índice de la imagen abierta; null = cerrado. */
  index: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

/** Visor de imágenes de la galería: modal DaisyUI con navegación ‹ › y teclado. */
export function Lightbox({ images, index, onClose, onNavigate }: Props) {
  const open = index !== null && images[index] !== undefined;

  const prev = () =>
    onNavigate(((index ?? 0) - 1 + images.length) % images.length);
  const next = () => onNavigate(((index ?? 0) + 1) % images.length);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!open) return null;
  const img = images[index]!;

  return (
    <div
      className="modal modal-open"
      role="dialog"
      aria-modal="true"
      aria-label={img.caption ?? "Imagen de la galería"}
    >
      <div className="modal-box max-w-4xl p-2 animate-pop-in">
        <button
          type="button"
          className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3 z-10 bg-base-100/60"
          onClick={onClose}
          aria-label="Cerrar"
        >
          ✕
        </button>
        <figure className="relative">
          <img
            src={resourcesApi.imageUrl(img.slug) ?? undefined}
            alt={img.caption ?? "Trabajo de la barbería"}
            className="w-full max-h-[75vh] object-contain rounded-box bg-base-300"
          />
          {images.length > 1 && (
            <>
              <button
                type="button"
                className="btn btn-circle btn-sm absolute left-2 top-1/2 -translate-y-1/2 bg-base-100/70"
                onClick={prev}
                aria-label="Imagen anterior"
              >
                ‹
              </button>
              <button
                type="button"
                className="btn btn-circle btn-sm absolute right-2 top-1/2 -translate-y-1/2 bg-base-100/70"
                onClick={next}
                aria-label="Imagen siguiente"
              >
                ›
              </button>
            </>
          )}
        </figure>
        {img.caption && (
          <p className="text-center text-sm py-2 opacity-80">{img.caption}</p>
        )}
      </div>
      <button
        type="button"
        className="modal-backdrop"
        onClick={onClose}
        aria-label="Cerrar"
      />
    </div>
  );
}
