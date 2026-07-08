import type { BusinessSettings, HomeContent } from "@/core/types";

interface Props {
  c: HomeContent;
  business: BusinessSettings | null;
}

/** Botón flotante de WhatsApp (opt-in; usa el número de Configuración → Contacto). */
export function WhatsAppFloat({ c, business }: Props) {
  if (!c.whatsappButton.enabled || !business?.whatsapp) return null;

  return (
    <a
      href={`https://wa.me/${business.whatsapp}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      title="Escríbenos por WhatsApp"
      className="btn btn-circle btn-success btn-lg fixed bottom-5 right-5 z-50 shadow-lg animate-pop-in hover:scale-110 transition-transform motion-reduce:transform-none"
      style={{ animationDelay: "700ms" }}
    >
      <svg
        className="w-7 h-7"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M17.5 14.4c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.5 0 1.47 1.07 2.89 1.22 3.09.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.62.71.23 1.36.2 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35ZM12 2a10 10 0 0 0-8.53 15.26L2 22l4.86-1.44A10 10 0 1 0 12 2Z" />
      </svg>
    </a>
  );
}
