import { Platform, type ViewStyle } from 'react-native';

import { colors } from './colors';

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

/** Horizontal gutter used by every screen (≈22pt on a 390pt-wide phone). */
export const GUTTER = 20;

export const radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 30,
  pill: 999,
} as const;

function shadow(opacity: number, radiusPx: number, y: number, elevation: number): ViewStyle {
  return Platform.select<ViewStyle>({
    web: {
      boxShadow: `0px ${y}px ${radiusPx * 2}px rgba(46, 74, 140, ${opacity})`,
    } as ViewStyle,
    default: {
      shadowColor: colors.shadow,
      shadowOpacity: opacity,
      shadowRadius: radiusPx,
      shadowOffset: { width: 0, height: y },
      elevation,
    },
  })!;
}

export const shadows = {
  none: {} as ViewStyle,
  soft: shadow(0.07, 10, 3, 2),
  card: shadow(0.09, 14, 5, 3),
  raised: shadow(0.14, 18, 8, 6),
  button: shadow(0.22, 12, 6, 5),
};
