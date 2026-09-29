import { Platform } from 'react-native';

let ctx: CanvasRenderingContext2D | null | undefined;

/**
 * Width of `text` rendered at `size` px in `family`. Web only — native
 * platforms shrink text with `adjustsFontSizeToFit` instead — so this
 * returns null anywhere a canvas is unavailable.
 */
export function measureTextWidth(text: string, family: string, size: number, letterSpacing = 0): number | null {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return null;
  if (ctx === undefined) ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return null;
  ctx.font = `${size}px ${family}`;
  return ctx.measureText(text).width + letterSpacing * Math.max(0, text.length - 1);
}

/** Largest font size between `min` and `max` that keeps `text` on one line inside `width`. */
export function fitFontSize(text: string, family: string, max: number, min: number, width: number, letterSpacing = 0): number {
  if (!width) return max;
  const w = measureTextWidth(text, family, max, letterSpacing);
  if (w == null || w <= width) return max;
  return Math.max(min, Math.floor(((max * width) / w) * 2) / 2);
}
