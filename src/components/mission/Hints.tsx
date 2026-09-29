import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { useMotionLevel } from '@/lib/motion';
import { useMission } from '@/store/mission';
import { colors } from '@/theme';

/**
 * Least-intrusive prompting (Framework §12): model-level support shows the
 * hint straight away; visual-cue level shows it after a pause; independent
 * levels only on request (Help).
 */
export function useHintVisible(base: number): { visible: boolean; level: number; reveal: (lvl: number) => void } {
  const helpSignal = useMission((s) => s.helpSignal);
  const [picked, setLevel] = useState<number>(base >= 5 ? base : 0);
  const [start] = useState(helpSignal);
  // Asking for Help (My Tools) reveals at least a visual cue.
  const level = helpSignal !== start ? Math.max(picked, 3) : picked;
  useEffect(() => {
    if (base >= 3 && base < 5) {
      const t = setTimeout(() => setLevel((l) => Math.max(l, 3)), 7000);
      return () => clearTimeout(t);
    }
  }, [base]);
  return { visible: level > 0, level: Math.max(level, base), reveal: (lvl) => setLevel((l) => Math.max(l, lvl)) };
}

/** Soft pulsing glow around a helpful option. */
export function Glow({ on, children, radius = 22 }: { on: boolean; children: ReactNode; radius?: number }) {
  const level = useMotionLevel();
  const t = useSharedValue(0);
  useEffect(() => {
    if (!on || level === 'off') {
      t.value = on ? 1 : 0;
      return;
    }
    t.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [on, level, t]);
  const style = useAnimatedStyle(() => ({ opacity: on ? 0.35 + t.value * 0.65 : 0, transform: [{ scale: 1 + t.value * 0.015 }] }));
  return (
    <View>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius + 4, margin: -4, borderWidth: 3, borderColor: colors.star }, style]} />
      {children}
    </View>
  );
}
