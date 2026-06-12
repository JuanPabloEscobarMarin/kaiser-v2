import type { Service } from "@/core/types";
import placeholder from "@/assets/placeholder-image.webp";
import { resourcesApi } from "@/core/api";

interface Props {
  service: Service;
  checked: boolean;
  isChecked: (id: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  onViewDetails: (service: Service) => void;
}

export function TableRow({
  service,
  checked,
  isChecked,
  onViewDetails,
}: Readonly<Props>) {
  const imageUrl = resourcesApi.imageUrl(service.urlImage) ?? placeholder;

  return (
    <tr
      className="cursor-pointer hover:bg-base-200"
      onClick={() => onViewDetails(service)}
    >
      <td onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          className="checkbox"
          checked={checked}
          onChange={(e) => isChecked(service.id, e)}
          aria-label={`Seleccionar ${service.name}`}
        />
      </td>

      <td>
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="mask mask-squircle h-12 w-12">
              <img
                src={imageUrl}
                onError={(e) =>
                  ((e.target as HTMLImageElement).src = placeholder)
                }
                alt={service.name}
              />
            </div>
          </div>
          <span className="font-bold">{service.name}</span>
        </div>
      </td>

      <td className="max-w-xs truncate" title={service.description ?? ""}>
        {service.description}
      </td>

      <td>${service.price}</td>
      <td>{service.duration} min</td>
      <td>
        <span
          className={`badge ${service.state ? "badge-success" : "badge-error"}`}
        >
          {service.state ? "Activo" : "Inactivo"}
        </span>
      </td>
    </tr>
  );
}
