import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, G, Path, RadialGradient, Stop } from 'react-native-svg';

import type { Feeling } from '@/engine/types';
import { useMotionLevel } from '@/lib/motion';
import { useUid } from '@/lib/uid';

export const FEELINGS: { key: Feeling; label: string; tone: 'mint' | 'sky' | 'butter' | 'lavender' | 'blush'; face: [string, string]; ink: string }[] = [
  { key: 'happy', label: 'Happy', tone: 'mint', face: ['#6FD794', '#3BB56A'], ink: '#10301C' },
  { key: 'calm', label: 'Calm', tone: 'sky', face: ['#9CCDFC', '#5AA6F6'], ink: '#1B3F86' },
  { key: 'okay', label: 'Okay', tone: 'butter', face: ['#FFD95E', '#F6B92A'], ink: '#3A2A08' },
  { key: 'sad', label: 'Sad', tone: 'lavender', face: ['#CFB0FB', '#A77EF2'], ink: '#35205F' },
  { key: 'worried', label: 'Worried', tone: 'blush', face: ['#FFA8BA', '#F2708E'], ink: '#4B1424' },
  { key: 'tired', label: 'Tired', tone: 'lavender', face: ['#C8B4FB', '#9D86F0'], ink: '#35205F' },
];

function FaceFeatures({ kind, ink }: { kind: Feeling | 'neutral' | 'uneasy'; ink: string }) {
  switch (kind) {
    case 'happy':
      return (
        <G>
          <Ellipse cx={17} cy={20} rx={2.6} ry={3.2} fill={ink} />
          <Ellipse cx={31} cy={20} rx={2.6} ry={3.2} fill={ink} />
          <Path d="M 15 27.5 Q 24 36 33 27.5" stroke={ink} strokeWidth={2.8} strokeLinecap="round" fill="none" />
        </G>
      );
    case 'calm':
      return (
        <G stroke={ink} strokeWidth={2.4} strokeLinecap="round" fill="none">
          <Path d="M 13 21 Q 17 24.5 21 21" />
          <Path d="M 27 21 Q 31 24.5 35 21" />
          <Path d="M 18 29 Q 24 33.5 30 29" />
        </G>
      );
    case 'okay':
    case 'neutral':
      return (
        <G>
          <Ellipse cx={17} cy={21} rx={2.6} ry={3} fill={ink} />
          <Ellipse cx={31} cy={21} rx={2.6} ry={3} fill={ink} />
          <Path d="M 16 31 L 32 31" stroke={ink} strokeWidth={2.8} strokeLinecap="round" />
        </G>
      );
    case 'uneasy':
      return (
        <G>
          <Ellipse cx={17} cy={21} rx={2.6} ry={3} fill={ink} />
          <Ellipse cx={31} cy={21} rx={2.6} ry={3} fill={ink} />
          <Path d="M 16.5 32 Q 24 28 31.5 32" stroke={ink} strokeWidth={2.6} strokeLinecap="round" fill="none" />
        </G>
      );
    case 'sad':
      return (
        <G stroke={ink} strokeWidth={2.4} strokeLinecap="round" fill="none">
          <Path d="M 13 20 Q 17 23 21 20" />
          <Path d="M 27 20 Q 31 23 35 20" />
          <Path d="M 16.5 33 Q 24 26.5 31.5 33" strokeWidth={2.6} />
        </G>
      );
    case 'worried':
      return (
        <G>
          <Path d="M 13.5 15.5 L 20 13.5 M 34.5 15.5 L 28 13.5" stroke={ink} strokeWidth={2.2} strokeLinecap="round" />
          <Ellipse cx={17.5} cy={21.5} rx={2.6} ry={3} fill={ink} />
          <Ellipse cx={30.5} cy={21.5} rx={2.6} ry={3} fill={ink} />
          <Path d="M 17 33 Q 24 27.5 31 33" stroke={ink} strokeWidth={2.6} strokeLinecap="round" fill="none" />
        </G>
      );
    case 'tired':
      return (
        <G>
          <Path d="M 13 21 Q 17 24 21 21 M 27 21 Q 31 24 35 21" stroke={ink} strokeWidth={2.4} strokeLinecap="round" fill="none" />
          <Ellipse cx={24} cy={31} rx={3.4} ry={2.8} fill="#FFFFFF" opacity={0.9} />
        </G>
      );
  }
  return null;
}

/** Round feeling face. Gently bobs when `alive`. */
export function FeelingFace({ feeling, size = 72, alive = true, delay = 0 }: { feeling: Feeling; size?: number; alive?: boolean; delay?: number }) {
  const f = FEELINGS.find((x) => x.key === feeling)!;
  const u = useUid('ff');
  const level = useMotionLevel();
  const t = useSharedValue(0);
  useEffect(() => {
    if (!alive || level === 'off') {
      cancelAnimation(t);
      t.value = 0;
      return;
    }
    t.value = withDelay(delay, withRepeat(withTiming(1, { duration: 1600 + delay / 3, easing: Easing.inOut(Easing.sin) }), -1, true));
    return () => cancelAnimation(t);
  }, [alive, level, delay, t]);
  const bob = useAnimatedStyle(() => ({ transform: [{ translateY: -t.value * 2.5 }, { rotate: `${(t.value - 0.5) * 4}deg` }] }));
  return (
    <Animated.View style={[{ width: size, height: size }, bob]}>
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Defs>
          <RadialGradient id={`${u}g`} cx="40%" cy="32%" rx="70%" ry="70%">
            <Stop offset="0" stopColor={f.face[0]} />
            <Stop offset="1" stopColor={f.face[1]} />
          </RadialGradient>
        </Defs>
        <Circle cx={24} cy={24} r={22} fill={`url(#${u}g)`} />
        <Ellipse cx={17} cy={11.5} rx={6} ry={3.4} fill="#FFFFFF" opacity={0.3} />
        <FaceFeatures kind={feeling} ink={f.ink} />
      </Svg>
    </Animated.View>
  );
}

/** Static status face for coach views (Doing well / Needs support). */
export function StatusFace({ kind, size = 64 }: { kind: 'good' | 'support'; size?: number }) {
  const u = useUid('sf');
  const [a, b] = kind === 'good' ? ['#6FD794', '#3BB56A'] : ['#FFD95E', '#F6B92A'];
  return (
    <View>
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Defs>
          <RadialGradient id={`${u}g`} cx="40%" cy="32%" rx="70%" ry="70%">
            <Stop offset="0" stopColor={a} />
            <Stop offset="1" stopColor={b} />
          </RadialGradient>
        </Defs>
        <Circle cx={24} cy={24} r={22} fill={`url(#${u}g)`} />
        <FaceFeatures kind={kind === 'good' ? 'happy' : 'uneasy'} ink={kind === 'good' ? '#10301C' : '#3A2A08'} />
      </Svg>
    </View>
  );
}

/** A twinkling star used in celebrations. */
export function TwinkleStar({ size = 36, delay = 0, style }: { size?: number; delay?: number; style?: object }) {
  const level = useMotionLevel();
  const s = useSharedValue(level === 'off' ? 1 : 0);
  useEffect(() => {
    if (level === 'off') {
      cancelAnimation(s);
      s.value = 1;
      return;
    }
    s.value = withDelay(
      delay,
      withSequence(
        withTiming(1.15, { duration: 320, easing: Easing.out(Easing.back(2)) }),
        withTiming(1, { duration: 160 }),
        withRepeat(withSequence(withTiming(0.82, { duration: 900 + delay / 2 }), withTiming(1, { duration: 900 + delay / 2 })), -1, true),
      ),
    );
    return () => cancelAnimation(s);
  }, [level, delay, s]);
  const anim = useAnimatedStyle(() => ({ opacity: Math.min(1, s.value * 1.2), transform: [{ scale: s.value }, { rotate: `${(1 - s.value) * 40}deg` }] }));
  return (
    <Animated.View style={[{ position: 'absolute', width: size, height: size }, style, anim]} pointerEvents="none">
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Path
          d="M 24 4.8 C 25.2 4.8 26.1 5.5 26.6 6.6 L 30.9 15.4 L 40.5 16.8 C 43 17.2 44 20.2 42.2 21.9 L 35.2 28.7 L 36.9 38.3 C 37.3 40.8 34.7 42.6 32.5 41.4 L 24 36.9 L 15.5 41.4 C 13.3 42.6 10.7 40.8 11.1 38.3 L 12.8 28.7 L 5.8 21.9 C 4 20.2 5 17.2 7.5 16.8 L 17.1 15.4 L 21.4 6.6 C 21.9 5.5 22.8 4.8 24 4.8 Z"
          fill="#FDC53A"
        />
      </Svg>
    </Animated.View>
  );
}
