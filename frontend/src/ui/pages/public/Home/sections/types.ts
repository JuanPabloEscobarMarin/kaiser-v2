import type { BusinessSettings, Employee, HomeContent, Service } from "@/core/types";
import type { GalleryImage } from "@/core/api/gallery.api";

/** Contexto compartido que recibe cada sección de la landing. */
export interface SectionCtx {
  c: HomeContent;
  business: BusinessSettings | null;
  services: Service[];
  employees: Employee[];
  gallery: GalleryImage[];
}
