import { Link } from "react-router";
import type { HomeContent } from "@/core/types";

/** Barra de anuncio entre el navbar y el hero (opt-in desde Configuración). */
export function PromoBanner({ c }: { c: HomeContent }) {
  const b = c.promoBanner;
  if (!b.enabled || !b.text) return null;

  const hasLink = Boolean(b.linkText && b.linkUrl);
  const isExternal = /^https?:\/\//.test(b.linkUrl);

  return (
    <div className="bg-accent text-accent-content text-sm px-4 py-2 text-center">
      <span>{b.text}</span>
      {hasLink &&
        (isExternal ? (
          <a
            href={b.linkUrl}
            target="_blank"
            rel="noreferrer"
            className="link font-semibold ml-2"
          >
            {b.linkText}
          </a>
        ) : (
          <Link to={b.linkUrl} className="link font-semibold ml-2">
            {b.linkText}
          </Link>
        ))}
    </div>
  );
}
