import type { ReactNode } from 'react';
import { Pressable, StyleSheet, type AccessibilityRole, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { tapHaptic } from '@/lib/feedback';
import { useMotionLevel } from '@/lib/motion';
import { playSound } from '@/lib/sound';
import { durations, easings, springs } from '@/theme/motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type TapProps = {
  onPress?: () => void;
  onLongPress?: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  /** Squish amount on press (0.96 default). */
  scale?: number;
  sound?: boolean;
  haptic?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: { selected?: boolean; checked?: boolean | 'mixed'; disabled?: boolean; expanded?: boolean; busy?: boolean };
  accessibilityHint?: string;
  hitSlop?: number;
  testID?: string;
};

/** Pressable with a soft, springy squish — the tactile language of BrightPath. */
export function Tap({
  onPress,
  onLongPress,
  children,
  style,
  disabled,
  scale = 0.96,
  sound = false,
  haptic = true,
  accessibilityLabel,
  accessibilityRole = 'button',
  accessibilityState,
  accessibilityHint,
  hitSlop = 4,
  testID,
}: TapProps) {
  const level = useMotionLevel();
  const s = useSharedValue(1);
  // With motion off the squish is replaced by a plain dim while pressed.
  const o = useSharedValue(1);
  // Keep any opacity the caller set (e.g. a used chip); disabled always reads at half.
  const base = StyleSheet.flatten(style)?.opacity;
  const dim = disabled ? 0.5 : typeof base === 'number' ? base : 1;
  const anim = useAnimatedStyle(() => ({ opacity: dim * o.value, transform: [{ scale: s.value }] }));
  const st = { disabled, ...accessibilityState };
  return (
    <AnimatedPressable
      testID={testID}
      disabled={disabled}
      hitSlop={hitSlop}
      onPressIn={() => {
        if (level === 'off') o.set(0.8);
        else s.set(withTiming(scale, { duration: durations.press, easing: easings.out }));
      }}
      onPressOut={() => {
        o.set(1);
        s.set(level === 'off' ? 1 : withSpring(1, springs.press));
      }}
      onPress={() => {
        if (haptic) tapHaptic();
        if (sound) playSound('tap', 0.4);
        onPress?.();
      }}
      onLongPress={onLongPress}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={st}
      accessibilityHint={accessibilityHint}
      aria-disabled={!!st.disabled}
      aria-selected={st.selected}
      aria-checked={st.checked}
      aria-expanded={st.expanded}
      aria-busy={st.busy}
      style={[style, anim]}
    >
      {children}
    </AnimatedPressable>
  );
}
