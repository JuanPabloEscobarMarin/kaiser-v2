import type { ChangeEvent } from "react";
import type { Service } from "@/core/types";
import { ServiceMobileImage } from "./ServiceMobileImage";

interface Props {
  services: Service[];
  isChecked: (id: string, e: ChangeEvent<HTMLInputElement>) => void;
  onViewDetails?: (service: Service) => void;
}

export function ServiceMobileList({ services, isChecked, onViewDetails }: Props) {
  return (
    <ul className="md:hidden space-y-3 stagger-rows">
      {services.map((service) => (
        <li key={service.id}>
          <div
            className="card bg-base-100 shadow-sm cursor-pointer transition-all duration-200 active:scale-[0.99] hover:shadow-md"
            onClick={() => onViewDetails?.(service)}
          >
            <div className="flex justify-between items-center px-4 pt-4">
              <input
                type="checkbox"
                className="checkbox self-start"
                aria-label={`Seleccionar ${service.name}`}
                onChange={(e) => isChecked(service.id, e)}
                onClick={(e) => e.stopPropagation()}
              />
              <div className="flex items-center gap-2">
                <div
                  className={
                    service.state
                      ? "status status-success"
                      : "status status-error"
                  }
                />
                <span className="text-sm">
                  ${service.price} · {service.duration} min
                </span>
              </div>
            </div>
            <figure className="px-10 pt-4">
              <ServiceMobileImage slug={service.urlImage} alt={service.name} />
            </figure>
            <div className="card-body items-center text-center">
              <h2 className="card-title">{service.name}</h2>
              <p className="text-sm opacity-80">{service.description}</p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
