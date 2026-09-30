import { Easing } from 'react-native-reanimated';

/** Shared motion tokens so presses, sheets and bars feel like one family. */
export const durations = {
  press: 90,
  fast: 160,
  base: 260,
  slow: 420,
  progress: 600,
} as const;

export const easings = {
  out: Easing.out(Easing.cubic),
  in: Easing.in(Easing.cubic),
} as const;

export const springs = {
  press: { damping: 14, stiffness: 320 },
  pop: { damping: 9, stiffness: 240 },
  settle: { damping: 18, stiffness: 220 },
} as const;
