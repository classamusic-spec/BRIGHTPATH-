import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';

import { useMotionLevel } from '@/lib/motion';

/** Gentle entrance for cards and rows. Disabled with Reduced Motion. */
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
  const d = level === 'gentle' ? 380 : 460;
  const base = from === 'zoom' ? ZoomIn : from === 'up' ? FadeInUp : FadeInDown;
  return (
    <Animated.View style={style} entering={base.delay(delay).duration(d)}>
      {children}
    </Animated.View>
  );
}
