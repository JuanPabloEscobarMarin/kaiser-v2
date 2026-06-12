import { useEffect, useRef, useState } from "react";
import { useIsMobile } from "./useMobile";

/**
 * Optimización para celular: en lugar de animaciones pesadas, resalta la card
 * que esté centrada en el viewport mientras el usuario hace scroll.
 * En escritorio queda inactivo (devuelve active=false) y el resaltado se
 * delega al hover. Usa un rootMargin que reduce el "área de foco" a una
 * franja central de la pantalla, así solo una card queda activa a la vez.
 */
export function useSpotlight<T extends HTMLElement = HTMLDivElement>() {
  const isMobile = useIsMobile();
  const ref = useRef<T>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !isMobile) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      // Franja central del viewport: ~35% arriba y abajo recortados.
      { threshold: 0, rootMargin: "-35% 0px -35% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [isMobile]);

  // Solo resaltamos en móvil; en escritorio el realce se delega al hover.
  return { ref, active: isMobile && active };
}
