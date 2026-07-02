import { useEffect, useState } from "react";
import { ApiError, galleryApi, resourcesApi } from "@/core/api";
import type { GalleryImage } from "@/core/api/gallery.api";
import { useNotify } from "@/ui/hooks/useNotify";

export function GallerySection() {
  const notify = useNotify();
  const [items, setItems] = useState<GalleryImage[]>([]);
  const [uploading, setUploading] = useState(false);

  const load = () => galleryApi.list().then(setItems).catch(() => setItems([]));

  useEffect(() => {
    load();
  }, []);

  const fail = (err: unknown) => {
    notify.setMessage({
      label: err instanceof ApiError ? err.message : "Error",
      type: "error",
    });
    notify.notify();
  };

  const onFile = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const up = await resourcesApi.upload(file);
      await galleryApi.create({ slug: up.slug, order: items.length });
      await load();
    } catch (err) {
      fail(err);
    } finally {
      setUploading(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await galleryApi.remove(id);
      await load();
    } catch (err) {
      fail(err);
    }
  };

  return (
    <section className="card bg-base-100 shadow">
      <div className="card-body">
        <h2 className="font-bold text-lg">Galería / portafolio</h2>
        <p className="text-sm text-base-content/70 -mt-1">
          Fotos de trabajos o del local que se muestran en la página de inicio.
        </p>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-2">
          {items.map((img) => (
            <div key={img.id} className="relative group">
              <img
                src={resourcesApi.imageUrl(img.slug) ?? undefined}
                alt={img.caption ?? "Foto de galería"}
                className="w-full aspect-square object-cover rounded-lg border border-base-300"
              />
              <button
                type="button"
                className="btn btn-xs btn-circle btn-error absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition"
                onClick={() => remove(img.id)}
                aria-label="Eliminar"
              >
                ✕
              </button>
            </div>
          ))}
          <label className="flex items-center justify-center aspect-square rounded-lg border-2 border-dashed border-base-300 cursor-pointer hover:border-primary/50 transition">
            {uploading ? (
              <span className="loading loading-spinner" />
            ) : (
              <span className="text-3xl opacity-40">＋</span>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
      </div>
    </section>
  );
}
