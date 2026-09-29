import type { ReactNode } from 'react';
import { Pressable, type AccessibilityRole, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { tapHaptic } from '@/lib/feedback';
import { useMotionLevel } from '@/lib/motion';
import { playSound } from '@/lib/sound';

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
  accessibilityState?: { selected?: boolean; checked?: boolean; disabled?: boolean };
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
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <AnimatedPressable
      testID={testID}
      disabled={disabled}
      hitSlop={hitSlop}
      onPressIn={() => {
        if (level !== 'off') s.set(withTiming(scale, { duration: 90 }));
      }}
      onPressOut={() => {
        s.set(withSpring(1, { damping: 12, stiffness: 260 }));
      }}
      onPress={() => {
        if (haptic) tapHaptic();
        if (sound) playSound('tap', 0.4);
        onPress?.();
      }}
      onLongPress={onLongPress}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled, ...accessibilityState }}
      accessibilityHint={accessibilityHint}
      style={[style, anim, disabled ? { opacity: 0.5 } : null]}
    >
      {children}
    </AnimatedPressable>
  );
}
