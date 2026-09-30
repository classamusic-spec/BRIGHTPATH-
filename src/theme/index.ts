import type { ViewStyle } from 'react-native';

export { colors, tones, type Tone, type ColorName } from './colors';
export { fonts, type } from './typography';

export const space = {
  xxs: 4,
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  xxl: 28,
  xxxl: 36,
} as const;

/** Horizontal gutter used by every screen (≈16pt on a 390pt-wide phone, as on the boards). */
export const GUTTER = 16;

export const radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 30,
  pill: 999,
} as const;

/**
 * Soft navy shadow. RN 0.86 renders CSS `boxShadow` natively on iOS and
 * Android, so every platform gets the same blurred shadow (no elevation).
 */
function shadow(opacity: number, radiusPx: number, y: number): ViewStyle {
  return { boxShadow: `0px ${y}px ${radiusPx * 2}px rgba(46, 74, 140, ${opacity})` };
}

export const shadows = {
  none: {} as ViewStyle,
  soft: shadow(0.07, 10, 3),
  card: shadow(0.09, 14, 5),
  raised: shadow(0.14, 18, 8),
  button: shadow(0.22, 12, 6),
};
