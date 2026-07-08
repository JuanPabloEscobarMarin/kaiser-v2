import { Link } from "react-router";
import { resourcesApi } from "@/core/api";
import type { BusinessSettings } from "@/core/types";
import { FadeImg } from "@/ui/components/FadeImg";
import { SocialLinks } from "@/ui/components/SocialLinks";

interface Props {
  business: BusinessSettings | null;
  /** Controlan las anclas: se ocultan si su sección está deshabilitada. */
  servicesEnabled: boolean;
  contactEnabled: boolean;
}

export function Footer({ business, servicesEnabled, contactEnabled }: Props) {
  const logoUrl = business?.logoSlug
    ? resourcesApi.imageUrl(business.logoSlug)
    : null;

  return (
    <footer className="bg-neutral text-neutral-content">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            {logoUrl && (
              <FadeImg
                src={logoUrl}
                alt={business?.name ?? "Logo"}
                className="h-10 max-w-[140px] object-contain mb-2"
              />
            )}
            <h3 className="text-xl font-bold">{business?.name ?? "Kaiser"}</h3>
            <p className="text-sm opacity-70">{business?.address ?? ""}</p>
            <SocialLinks
              business={business}
              className="flex items-center gap-4 mt-3"
            />
          </div>
          <nav className="flex flex-wrap gap-4 text-sm">
            <Link to="/booking" className="link link-hover">
              Reservar
            </Link>
            {servicesEnabled && (
              <a href="#servicios" className="link link-hover">
                Servicios
              </a>
            )}
            {contactEnabled && (
              <a href="#contacto" className="link link-hover">
                Contacto
              </a>
            )}
            <Link to="/login" className="link link-hover">
              Acceso admin
            </Link>
          </nav>
        </div>
        <div className="text-xs opacity-60 mt-6 pt-4 border-t border-neutral-content/20">
          © {new Date().getFullYear()} {business?.name ?? "Kaiser"}. Todos los
          derechos reservados.
        </div>
      </div>
    </footer>
  );
}
