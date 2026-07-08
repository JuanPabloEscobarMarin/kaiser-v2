// Mantener en sync con backend/src/lib/home-content-defaults.ts
// (mismo shape y mismos defaults; GET /api/settings siempre devuelve el
// objeto ya mergeado con estos defaults).

/** Secciones intermedias reordenables/ocultables. Hero, CTA final y footer son fijos. */
export type SectionId =
  | "features"
  | "services"
  | "howItWorks"
  | "team"
  | "gallery"
  | "testimonials"
  | "contact";

export const SECTION_IDS: SectionId[] = [
  "features",
  "services",
  "howItWorks",
  "team",
  "gallery",
  "testimonials",
  "contact",
];

export interface HomeContent {
  /** Orden de render de las secciones intermedias de la landing. */
  sections: { id: SectionId; enabled: boolean }[];
  hero: {
    title: string;
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
    /** Opacidad del velo oscuro sobre la imagen (0–0.9). */
    overlayOpacity: number;
    /** true = degradado (más oscuro abajo); false = velo uniforme. */
    overlayGradient: boolean;
    height: "normal" | "full";
    align: "center" | "left";
  };
  promoBanner: {
    enabled: boolean;
    text: string;
    linkText: string;
    linkUrl: string;
  };
  features: { icon: string; title: string; description: string }[];
  services: { title: string; subtitle: string };
  howItWorks: {
    title: string;
    subtitle: string;
    steps: { title: string; description: string }[];
  };
  team: { title: string; subtitle: string };
  gallery: { title: string; subtitle: string };
  testimonials: {
    title: string;
    subtitle: string;
    items: { name: string; text: string; rating: number }[];
  };
  contact: {
    title: string;
    subtitle: string;
    hoursTitle: string;
    ctaButton: string;
  };
  finalCta: { title: string; subtitle: string; button: string };
  whatsappButton: { enabled: boolean };
}

export const HOME_CONTENT_DEFAULTS: HomeContent = {
  sections: SECTION_IDS.map((id) => ({ id, enabled: true })),
  hero: {
    title: "Tu próximo corte, sin esperas",
    subtitle:
      "Reserva en menos de 30 segundos. Elige tu profesional, tu día y tu hora — sin necesidad de crear una cuenta.",
    primaryCta: "Reservar ahora",
    secondaryCta: "Ver servicios",
    overlayOpacity: 0.55,
    overlayGradient: false,
    height: "normal",
    align: "center",
  },
  promoBanner: {
    enabled: false,
    text: "",
    linkText: "",
    linkUrl: "",
  },
  features: [
    {
      icon: "📅",
      title: "Reserva online",
      description: "Disponible 24/7. Elige el horario que más te convenga.",
    },
    {
      icon: "✂️",
      title: "Profesionales certificados",
      description:
        "Equipo con años de experiencia en cortes y arreglo de barba.",
    },
    {
      icon: "⚡",
      title: "Sin filas",
      description: "Llega con tu reserva y pasa directo. Tu tiempo vale.",
    },
  ],
  services: {
    title: "Nuestros servicios",
    subtitle: "Lo más pedido por nuestros clientes",
  },
  howItWorks: {
    title: "¿Cómo funciona?",
    subtitle: "Tres pasos y listo",
    steps: [
      {
        title: "Elige tu servicio",
        description: "Corte, barba, combo o tratamiento",
      },
      {
        title: "Profesional, día y hora",
        description: "Vemos disponibilidad en tiempo real",
      },
      {
        title: "Confirma con tus datos",
        description: "Solo nombre, teléfono y cédula",
      },
    ],
  },
  team: {
    title: "Nuestro equipo",
    subtitle: "Profesionales que cuidan cada detalle",
  },
  gallery: {
    title: "Galería",
    subtitle: "Algunos de nuestros trabajos",
  },
  testimonials: {
    title: "Lo que dicen nuestros clientes",
    subtitle: "Opiniones reales de quienes ya reservaron",
    items: [],
  },
  contact: {
    title: "Contáctanos",
    subtitle:
      "¿Prefieres preguntar antes de reservar? Estamos disponibles para resolver cualquier duda.",
    hoursTitle: "🕐 Horarios de atención",
    ctaButton: "Reservar mi cita",
  },
  finalCta: {
    title: "¿Listo para tu próximo corte?",
    subtitle: "Reserva en menos de un minuto, sin necesidad de cuenta",
    button: "Reservar ahora",
  },
  whatsappButton: { enabled: false },
};
