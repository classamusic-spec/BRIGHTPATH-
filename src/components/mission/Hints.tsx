import { useEffect, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { Txt } from '@/components/ui';
import { GUIDE } from '@/content/cast';
import { announce } from '@/lib/announce';
import { useAccess, useMotionLevel } from '@/lib/motion';
import { useMission } from '@/store/mission';
import { fonts } from '@/theme';

/** Hint colours: a dark amber that reads on white and tinted cards (not colour-only: the pill says it). */
export const HINT_BORDER = '#A86E00';
const PILL_BG = '#FDF3D8';
const PILL_TEXT = '#7A4E00';

/** Accessibility hint for an option the guide is suggesting. */
export const HINT_A11Y = `${GUIDE.name} suggests this one`;

/** Pause before a visual cue appears, paced to the learner's processing time (null = only on request). */
export function hintDelay(processing: 'standard' | 'extended' | 'noTimer' | undefined): number | null {
  if (processing === 'noTimer') return null;
  return processing === 'extended' ? 14000 : 7000;
}

/**
 * Least-intrusive prompting (Framework §12): model-level support shows the
 * hint straight away; visual-cue level shows it after a pause; independent
 * levels only on request (Help).
 */
export function useHintVisible(base: number): { visible: boolean; level: number; reveal: (lvl: number) => void } {
  const helpSignal = useMission((s) => s.helpSignal);
  const processing = useAccess()?.processing;
  const [picked, setLevel] = useState<number>(base >= 5 ? base : 0);
  const [start] = useState(helpSignal);
  // Asking for Help (My Tools) reveals at least a visual cue.
  const level = helpSignal !== start ? Math.max(picked, 3) : picked;
  useEffect(() => {
    const delay = hintDelay(processing);
    if (delay != null && base >= 3 && base < 5) {
      const t = setTimeout(() => setLevel((l) => Math.max(l, 3)), delay);
      return () => clearTimeout(t);
    }
  }, [base, processing]);
  const visible = level > 0;
  const said = useRef(false);
  useEffect(() => {
    if (visible && !said.current) {
      said.current = true;
      announce(`${GUIDE.name} is showing a helpful choice.`);
    }
  }, [visible]);
  return { visible, level: Math.max(level, base), reveal: (lvl) => setLevel((l) => Math.max(l, lvl)) };
}

/** Soft pulsing glow and a "Try this" pill around a suggested option. */
export function Glow({ on, children, radius = 22, pill = true }: { on: boolean; children: ReactNode; radius?: number; pill?: boolean }) {
  const level = useMotionLevel();
  const t = useSharedValue(0);
  useEffect(() => {
    if (!on || level === 'off') {
      cancelAnimation(t);
      t.value = on ? 1 : 0;
      return;
    }
    t.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(t);
  }, [on, level, t]);
  const style = useAnimatedStyle(() => ({ opacity: on ? 0.55 + t.value * 0.45 : 0, transform: [{ scale: 1 + t.value * 0.015 }] }));
  return (
    <View>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius + 4, margin: -4, borderWidth: 3, borderColor: HINT_BORDER }, style]} />
      {children}
      {on && pill ? (
        <View pointerEvents="none" style={styles.pill} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <Txt v="label" color={PILL_TEXT} style={{ fontSize: 14, lineHeight: 18, fontFamily: fonts.extrabold }}>
            Try this
          </Txt>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { position: 'absolute', top: -12, left: 14, backgroundColor: PILL_BG, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 2, borderWidth: 1.5, borderColor: HINT_BORDER },
});
