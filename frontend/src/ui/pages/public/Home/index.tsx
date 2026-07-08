import { useEffect, useState } from "react";
import { employeesApi, galleryApi, servicesApi } from "@/core/api";
import type { Employee, Service } from "@/core/types";
import type { GalleryImage } from "@/core/api/gallery.api";
import {
  HOME_CONTENT_DEFAULTS,
  type SectionId,
} from "@/core/branding/home-content";
import { useBranding } from "@/ui/contexts/branding/context";
import Navbar from "@/ui/layouts/components/NavBar";
import type { SectionCtx } from "./sections/types";
import { Hero } from "./sections/Hero";
import { PromoBanner } from "./sections/PromoBanner";
import { Features } from "./sections/Features";
import { ServicesSection } from "./sections/ServicesSection";
import { HowItWorks } from "./sections/HowItWorks";
import { Team } from "./sections/Team";
import { GallerySection } from "./sections/GallerySection";
import { Testimonials } from "./sections/Testimonials";
import { Contact } from "./sections/Contact";
import { FinalCta } from "./sections/FinalCta";
import { Footer } from "./sections/Footer";
import { WhatsAppFloat } from "./sections/WhatsAppFloat";

/** Secciones intermedias reordenables desde admin → Configuración. */
const SECTION_COMPONENTS: Record<SectionId, React.FC<SectionCtx>> = {
  features: Features,
  services: ServicesSection,
  howItWorks: HowItWorks,
  team: Team,
  gallery: GallerySection,
  testimonials: Testimonials,
  contact: Contact,
};

export function HomePage() {
  // Settings llegan del BrandingProvider (con cache en sessionStorage):
  // evita un segundo fetch y el flash de contenido default.
  const { business } = useBranding();
  const [services, setServices] = useState<Service[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);

  useEffect(() => {
    servicesApi
      .list()
      .then((arr) => setServices(arr.filter((s) => s.state).slice(0, 3)))
      .catch(() => setServices([]));
    employeesApi
      .list()
      .then((arr) => setEmployees(arr.filter((e) => e.state)))
      .catch(() => setEmployees([]));
    galleryApi
      .list()
      .then(setGallery)
      .catch(() => setGallery([]));
  }, []);

  const c = business?.homeContent ?? HOME_CONTENT_DEFAULTS;
  // Guard por si un cache viejo de settings no trae el shape nuevo.
  const sections = c.sections ?? HOME_CONTENT_DEFAULTS.sections;

  const ctx: SectionCtx = { c, business, services, employees, gallery };
  const isEnabled = (id: SectionId) =>
    sections.some((s) => s.id === id && s.enabled);

  return (
    <div className="bg-base-200">
      <Navbar />
      <PromoBanner c={c} />
      <Hero
        c={c}
        business={business}
        secondaryCtaHref={isEnabled("services") ? "#servicios" : "/booking"}
      />

      {sections
        .filter((s) => s.enabled)
        .map((s) => {
          const Section = SECTION_COMPONENTS[s.id];
          return Section ? <Section key={s.id} {...ctx} /> : null;
        })}

      <FinalCta c={c} />
      <Footer
        business={business}
        servicesEnabled={isEnabled("services")}
        contactEnabled={isEnabled("contact")}
      />
      <WhatsAppFloat c={c} business={business} />
    </div>
  );
}
