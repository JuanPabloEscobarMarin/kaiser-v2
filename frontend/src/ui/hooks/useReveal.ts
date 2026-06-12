import { useEffect, useRef, useState } from "react";

interface RevealOptions {
  /** Porción del elemento visible para disparar la animación (0-1). */
  threshold?: number;
  /** Si es true, la animación solo ocurre una vez (no se oculta al salir). */
  once?: boolean;
  /** Margen del root del observer; recorta el viewport para anticipar/retrasar. */
  rootMargin?: string;
}

/**
 * Observa un elemento y reporta cuándo entra/sale del viewport.
 * Reutilizable para animaciones de entrada disparadas por scroll, tanto al
 * bajar como al subir. Respeta prefers-reduced-motion mostrando todo de una.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(
  options: RevealOptions = {},
) {
  const { threshold = 0.15, once = false, rootMargin = "0px 0px -10% 0px" } =
    options;
  const ref = useRef<T>(null);
  // Si el usuario prefiere menos movimiento, arrancamos visible (sin animar).
  const [visible, setVisible] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, once, rootMargin]);

  return { ref, visible };
}
