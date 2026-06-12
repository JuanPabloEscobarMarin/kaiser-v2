import { useCallback, type ReactNode } from "react";
import { useReveal } from "@/ui/hooks/useReveal";
import { useSpotlight } from "@/ui/hooks/useSpotlight";

interface Props {
  children: ReactNode;
  /** Posición dentro del grupo: genera el retraso en cascada (staggered). */
  index?: number;
  /** Milisegundos de retraso por cada índice. */
  step?: number;
  /** Activa el resaltado de la card centrada en viewport (solo móvil). */
  spotlight?: boolean;
  className?: string;
}

/**
 * Envuelve cualquier card/sección y le da:
 *  - Entrada en cascada (fade-in-up) disparada por scroll, al bajar y al subir.
 *  - Resaltado de la card centrada en pantalla cuando se usa en móvil.
 * Las micro-interacciones de hover (PC) se dejan en la propia card.
 */
export function Reveal({
  children,
  index = 0,
  step = 90,
  spotlight = false,
  className = "",
}: Props) {
  const { ref: revealRef, visible } = useReveal({ rootMargin: "0px 0px -8% 0px" });
  const { ref: spotRef, active } = useSpotlight();

  // Fusiona ambos refs en el mismo nodo.
  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      revealRef.current = node;
      if (spotlight) spotRef.current = node;
    },
    [revealRef, spotRef, spotlight],
  );

  return (
    <div
      ref={setRefs}
      data-spotlight={spotlight && active ? "on" : undefined}
      style={{ transitionDelay: visible ? `${index * step}ms` : "0ms" }}
      className={[
        "transition-all duration-700 ease-out will-change-transform motion-reduce:transition-none",
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-8 motion-reduce:opacity-100 motion-reduce:translate-y-0",
        spotlight ? "spotlight-target" : "",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
