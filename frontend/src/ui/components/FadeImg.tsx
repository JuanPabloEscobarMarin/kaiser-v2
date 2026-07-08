import { useState } from "react";

/**
 * <img> que entra con fade cuando termina de cargar, evitando el "pop" de
 * imágenes que llegan de la red. El contenedor decide el fondo visible
 * mientras tanto (bg-base-200/300, etc.).
 */
export function FadeImg({
  className = "",
  onLoad,
  ...rest
}: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [loaded, setLoaded] = useState(false);

  return (
    <img
      {...rest}
      // Las imágenes ya en cache pueden completar antes de que React enganche
      // onLoad: el ref callback cubre ese caso.
      ref={(node) => {
        if (node?.complete && node.naturalWidth > 0) setLoaded(true);
      }}
      onLoad={(e) => {
        setLoaded(true);
        onLoad?.(e);
      }}
      className={`transition-opacity duration-500 motion-reduce:transition-none ${
        loaded ? "opacity-100" : "opacity-0"
      } ${className}`}
    />
  );
}
