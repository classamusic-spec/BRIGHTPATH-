import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, G, LinearGradient, Path, Stop } from 'react-native-svg';

import { Txt } from '@/components/ui';
import { useMotionLevel } from '@/lib/motion';
import { useUid } from '@/lib/uid';
import { colors } from '@/theme';

/** Rising sun behind a blue cloud — the BrightPath mark. Rays breathe softly. */
export function SunMark({ size = 120 }: { size?: number }) {
  const u = useUid('sm');
  const level = useMotionLevel();
  const t = useSharedValue(0);
  useEffect(() => {
    if (level === 'off') return;
    t.value = withRepeat(withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [level, t]);
  const rays = useAnimatedStyle(() => ({ transform: [{ scale: 0.94 + t.value * 0.08 }, { rotate: `${(t.value - 0.5) * 6}deg` }] }));
  // Box ends a little below the cloud so the wordmark never touches it.
  const h = size * 0.7;
  const rayEls = [];
  for (let i = 0; i < 9; i++) {
    const a = Math.PI + (i / 8) * Math.PI; // upper half only
    const r1 = 31;
    const r2 = 44;
    rayEls.push(
      <Path key={i} d={`M ${50 + Math.cos(a) * r1} ${50 + Math.sin(a) * r1} L ${50 + Math.cos(a) * r2} ${50 + Math.sin(a) * r2}`} stroke="#FDC53A" strokeWidth={6.2} strokeLinecap="round" />,
    );
  }
  return (
    <View style={{ width: size, height: h }} accessibilityRole="image" accessibilityLabel="BrightPath sun">
      <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: size, height: size, transformOrigin: '50% 50%' }, rays]}>
        <Svg width="100%" height="100%" viewBox="0 0 100 100">
          <G>{rayEls}</G>
        </Svg>
      </Animated.View>
      <View style={{ position: 'absolute', left: 0, top: 0, width: size, height: size }}>
        <Svg width="100%" height="100%" viewBox="0 0 100 100">
          <Defs>
            <LinearGradient id={`${u}s`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#FFD55C" />
              <Stop offset="1" stopColor="#F7B425" />
            </LinearGradient>
            <LinearGradient id={`${u}c`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#4F92F4" />
              <Stop offset="1" stopColor="#2B6BE0" />
            </LinearGradient>
          </Defs>
          <Circle cx={50} cy={50} r={24} fill={`url(#${u}s)`} />
          <Path d="M 22 62 C 16 62 15 53 22 52 C 23 45 31 43 36 47 C 39 38 53 36 58 45 C 63 40 74 42 75 51 C 83 51 85 62 77 62 Z" fill={`url(#${u}c)`} />
        </Svg>
      </View>
    </View>
  );
}

export function Wordmark({ size = 48, color = colors.ink }: { size?: number; color?: string }) {
  return (
    <Txt v="logo" color={color} style={{ fontSize: size, lineHeight: size * 1.14, letterSpacing: -size * 0.012 }} accessibilityRole="header">
      BrightPath
    </Txt>
  );
}

export function BrandBlock({ tagline = 'Play. Practice. Feel Good.', size = 50 }: { tagline?: string; size?: number }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <SunMark size={size * 2.5} />
      <Wordmark size={size} />
      <Txt v="bodyLg" color={colors.text} style={{ marginTop: 2, fontSize: 19 }}>
        {tagline}
      </Txt>
    </View>
  );
}
