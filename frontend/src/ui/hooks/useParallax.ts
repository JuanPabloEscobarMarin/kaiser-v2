import { useEffect, useRef } from "react";

/**
 * Parallax suave: desplaza el elemento con el scroll (factor < 1) mientras el
 * hero sigue en viewport. No usa background-attachment: fixed (roto en iOS);
 * listener pasivo + requestAnimationFrame para no costar jank en móviles.
 * No-op con prefers-reduced-motion.
 */
export function useParallax<T extends HTMLElement>(factor = 0.2) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      // Solo mientras el hero puede seguir en pantalla.
      if (y < window.innerHeight) {
        node.style.transform = `translateY(${y * factor}px)`;
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [factor]);

  return ref;
}
