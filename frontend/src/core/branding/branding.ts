/**
 * Applies a primary brand color across the whole app by overriding the
 * DaisyUI CSS variables on <html>. Works for both light and dark themes.
 *
 * DaisyUI 5 reads `--color-primary` and `--color-primary-content` for
 * the contrasting text color. Setting these on `:root` overrides the
 * theme defaults globally.
 */

const HEX_RE = /^#([0-9a-f]{6})$/i;

const isValidHex = (value: string): boolean => HEX_RE.test(value);

const hexToRgb = (hex: string): [number, number, number] => {
  const m = hex.match(HEX_RE);
  if (!m || !m[1]) return [0, 0, 0];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/**
 * Returns black or white depending on which provides better contrast against
 * the given hex color. Uses sRGB relative luminance per WCAG.
 */
const contrastingTextFor = (hex: string): string => {
  const [r, g, b] = hexToRgb(hex);
  const linear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const luminance =
    0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
  return luminance > 0.5 ? "#000000" : "#ffffff";
};

export const applyPrimaryColor = (hex: string): void => {
  if (!isValidHex(hex)) return;
  const root = document.documentElement;
  root.style.setProperty("--color-primary", hex);
  root.style.setProperty("--color-primary-content", contrastingTextFor(hex));
};

export const resetPrimaryColor = (): void => {
  const root = document.documentElement;
  root.style.removeProperty("--color-primary");
  root.style.removeProperty("--color-primary-content");
};

/** Aplica (o limpia) un color DaisyUI arbitrario por su nombre (secondary/accent). */
const applyThemeColor = (name: string, hex?: string | null): void => {
  const root = document.documentElement;
  if (hex && isValidHex(hex)) {
    root.style.setProperty(`--color-${name}`, hex);
    root.style.setProperty(`--color-${name}-content`, contrastingTextFor(hex));
  } else {
    root.style.removeProperty(`--color-${name}`);
    root.style.removeProperty(`--color-${name}-content`);
  }
};

export const applySecondaryColor = (hex?: string | null): void =>
  applyThemeColor("secondary", hex);

export const applyAccentColor = (hex?: string | null): void =>
  applyThemeColor("accent", hex);

// ---- Tipografías (Google Fonts) -------------------------------------------

/** Set curado de fuentes: nombre visible → especificación para Google Fonts. */
const GOOGLE_FONTS: Record<string, string> = {
  Inter: "Inter:wght@400;500;600;700",
  Poppins: "Poppins:wght@400;500;600;700",
  Montserrat: "Montserrat:wght@400;500;600;700",
  Roboto: "Roboto:wght@400;500;700",
  Lato: "Lato:wght@400;700",
  "Playfair Display": "Playfair+Display:wght@400;600;700",
  Merriweather: "Merriweather:wght@400;700",
  Oswald: "Oswald:wght@400;500;700",
  Raleway: "Raleway:wght@400;500;600;700",
  Nunito: "Nunito:wght@400;600;700",
};

export const AVAILABLE_FONTS = Object.keys(GOOGLE_FONTS);

const loadGoogleFont = (family: string): void => {
  const spec = GOOGLE_FONTS[family];
  if (!spec) return;
  const id = `gf-${family.replace(/\s+/g, "-")}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${spec}&display=swap`;
  document.head.appendChild(link);
};

export const applyFonts = (
  heading?: string | null,
  body?: string | null,
): void => {
  const root = document.documentElement;
  if (heading) {
    loadGoogleFont(heading);
    root.style.setProperty("--font-heading", `'${heading}', sans-serif`);
  } else {
    root.style.removeProperty("--font-heading");
  }
  if (body) {
    loadGoogleFont(body);
    root.style.setProperty("--font-body", `'${body}', sans-serif`);
  } else {
    root.style.removeProperty("--font-body");
  }
};
