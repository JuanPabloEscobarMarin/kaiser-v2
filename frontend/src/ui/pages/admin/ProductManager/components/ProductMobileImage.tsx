import placeholder from "@/assets/placeholder-image.webp";
import { resourcesApi } from "@/core/api";

interface Props {
  slug: string | null | undefined;
  alt: string;
}

export function ProductMobileImage({ slug, alt }: Readonly<Props>) {
  const url = resourcesApi.imageUrl(slug) ?? placeholder;
  return (
    <img
      src={url}
      alt={alt}
      className="rounded-xl size-40 object-cover"
      onError={(e) => ((e.target as HTMLImageElement).src = placeholder)}
    />
  );
}
