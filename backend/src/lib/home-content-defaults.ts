export interface HomeContent {
  hero: {
    title: string;
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
  };
  features: { icon: string; title: string; description: string }[];
  services: { title: string; subtitle: string };
  howItWorks: {
    title: string;
    subtitle: string;
    steps: { title: string; description: string }[];
  };
  team: { title: string; subtitle: string };
  contact: { title: string; subtitle: string; hoursTitle: string; ctaButton: string };
  finalCta: { title: string; subtitle: string; button: string };
}

export const HOME_CONTENT_DEFAULTS: HomeContent = {
  hero: {
    title: "Tu próximo corte, sin esperas",
    subtitle:
      "Reserva en menos de 30 segundos. Elige tu profesional, tu día y tu hora — sin necesidad de crear una cuenta.",
    primaryCta: "Reservar ahora",
    secondaryCta: "Ver servicios",
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
};

/**
 * Deep-merges a partial home content payload into the defaults so the API
 * always returns a fully-formed object even if the admin only edited a few
 * fields.
 */
export const mergeHomeContent = (
  partial: unknown,
): HomeContent => {
  const d = HOME_CONTENT_DEFAULTS;
  const p = (partial ?? {}) as Partial<HomeContent>;
  return {
    hero: { ...d.hero, ...(p.hero ?? {}) },
    features:
      Array.isArray(p.features) && p.features.length > 0
        ? p.features.map((f, i) => ({ ...d.features[i % 3]!, ...f }))
        : d.features,
    services: { ...d.services, ...(p.services ?? {}) },
    howItWorks: {
      ...d.howItWorks,
      ...(p.howItWorks ?? {}),
      steps:
        Array.isArray(p.howItWorks?.steps) && p.howItWorks.steps.length > 0
          ? p.howItWorks.steps.map((s, i) => ({
              ...d.howItWorks.steps[i % 3]!,
              ...s,
            }))
          : d.howItWorks.steps,
    },
    team: { ...d.team, ...(p.team ?? {}) },
    contact: { ...d.contact, ...(p.contact ?? {}) },
    finalCta: { ...d.finalCta, ...(p.finalCta ?? {}) },
  };
};
