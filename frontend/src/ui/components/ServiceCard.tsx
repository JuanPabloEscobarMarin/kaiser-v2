import { useNavigate } from "react-router";
import type { Service } from "@/core/types";
import { resourcesApi } from "@/core/api";
import placeholder from "@/assets/placeholder-image.webp";
import { formatPrice } from "@/lib/format";

interface Props {
  service: Service;
}

export function ServiceCard({ service }: Props) {
  const navigate = useNavigate();
  const imageUrl = resourcesApi.imageUrl(service.urlImage) ?? placeholder;
  const discount = Number(service.discount);
  const price = Number(service.price);
  const finalPrice = Math.max(0, price - discount);
  const hasDiscount = discount > 0;

  return (
    <article className="card bg-base-100 border border-base-300/60 shadow-md overflow-hidden h-full flex flex-col transition-all duration-300 ease-out hover:scale-[1.03] hover:shadow-2xl hover:border-primary/40 hover:z-10 lg:group-hover/grid:opacity-55 lg:hover:!opacity-100 group/card">
      <figure className="aspect-video bg-base-200 overflow-hidden">
        <img
          src={imageUrl}
          alt={service.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover/card:scale-110"
          onError={(e) => ((e.target as HTMLImageElement).src = placeholder)}
        />
      </figure>
      <div className="card-body p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="card-title text-base leading-tight">{service.name}</h3>
          <span className="badge badge-ghost shrink-0">
            {service.duration} min
          </span>
        </div>

        {service.description && (
          <p className="text-sm text-base-content/70 line-clamp-2">
            {service.description}
          </p>
        )}

        <div className="flex items-end justify-between mt-auto pt-2">
          <div>
            {hasDiscount && (
              <div className="text-xs text-base-content/50 line-through">
                {formatPrice(service.price)}
              </div>
            )}
            <div className="text-xl font-bold text-primary">
              {formatPrice(finalPrice.toString())}
            </div>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => navigate(service.id)}
          >
            Reservar
          </button>
        </div>

        {hasDiscount && (
          <div className="badge badge-secondary badge-sm absolute top-3 right-3 shadow">
            -{formatPrice(service.discount)}
          </div>
        )}
      </div>
    </article>
  );
}
