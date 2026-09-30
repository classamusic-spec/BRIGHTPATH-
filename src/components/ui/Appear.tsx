import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';

import { useMotionLevel } from '@/lib/motion';
import { durations } from '@/theme/motion';

/** Entrance for cards and rows: rises in (full), fades in (gentle), or none (off). */
export function Appear({
  children,
  delay = 0,
  from = 'down',
  style,
}: {
  children: ReactNode;
  delay?: number;
  from?: 'down' | 'up' | 'zoom';
  style?: StyleProp<ViewStyle>;
}) {
  const level = useMotionLevel();
  if (level === 'off') return <Animated.View style={style}>{children}</Animated.View>;
  // Gentle motion is a plain fade: no travel, no zoom.
  const entering =
    level === 'gentle' ? FadeIn.delay(delay).duration(durations.slow) : (from === 'zoom' ? ZoomIn : from === 'up' ? FadeInUp : FadeInDown).delay(delay).duration(460);
  return (
    <Animated.View style={style} entering={entering}>
      {children}
    </Animated.View>
  );
}
