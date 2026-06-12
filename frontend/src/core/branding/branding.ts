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
