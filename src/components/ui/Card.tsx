import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, shadows, tones, type Tone } from '@/theme';

import { Tap } from './Tap';

export function Card({
  children,
  style,
  tone,
  onPress,
  flat,
  accessibilityLabel,
  selected,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  tone?: Tone | 'tint' | 'soft';
  onPress?: () => void;
  flat?: boolean;
  accessibilityLabel?: string;
  selected?: boolean;
}) {
  const bg = !tone ? colors.card : tone === 'tint' ? colors.cardTint : tone === 'soft' ? colors.cardSoft : tones[tone].bg;
  const base: ViewStyle = {
    backgroundColor: bg,
    borderRadius: radius.lg,
    ...(flat || (tone && tone !== 'white') ? {} : shadows.soft),
    ...(selected ? { borderWidth: 2.5, borderColor: colors.primary } : null),
  };
  if (onPress) {
    return (
      <Tap onPress={onPress} style={[base, style]} accessibilityLabel={accessibilityLabel} accessibilityState={{ selected }}>
        {children}
      </Tap>
    );
  }
  return <View style={[base, style]}>{children}</View>;
}

/** Rounded square tile holding an icon (list rows, tiles). */
export function IconTile({ children, tone = 'blue', size = 56, style, radiusPx }: { children: ReactNode; tone?: Tone; size?: number; style?: StyleProp<ViewStyle>; radiusPx?: number }) {
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: radiusPx ?? size * 0.28,
          backgroundColor: tones[tone].bg,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
