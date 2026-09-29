/**
 * Supporting buddies: Pip (penguin), Tilly (turtle) and Roo (puppy).
 * Same layered rig as Finn so they breathe, blink and wiggle on the UI thread.
 */
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useAnimatedStyle } from 'react-native-reanimated';
import { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';

import { useMotionLevel, type MotionLevel } from '@/lib/motion';
import { useUid } from '@/lib/uid';

import { Layer, pivot, Rig } from './Layer';
import { useBlink, useOscillator, useTwitch } from './anim';

type BuddyProps = {
  size?: number;
  mood?: 'happy' | 'frustrated' | 'calm';
  motion?: MotionLevel;
  style?: StyleProp<ViewStyle>;
};

function Eye({ x, y, rx = 7, ry = 8.6 }: { x: number; y: number; rx?: number; ry?: number }) {
  return (
    <G>
      <Ellipse cx={x} cy={y} rx={rx} ry={ry} fill="#1B1414" />
      <Circle cx={x + rx * 0.35} cy={y - ry * 0.32} r={rx * 0.38} fill="#FFFFFF" />
      <Circle cx={x - rx * 0.3} cy={y + ry * 0.45} r={rx * 0.15} fill="#FFFFFF" opacity={0.85} />
    </G>
  );
}

function useBuddyAnim(level: MotionLevel) {
  const on = level !== 'off';
  const breath = useOscillator(on, 1800);
  const blink = useBlink(on);
  const sway = useOscillator(on, level === 'full' ? 2400 : 3400, { rest: 0.5 });
  const twitch = useTwitch(on && level === 'full', 2400, 6000);
  return { breath, blink, sway, twitch };
}

/* ------------------------------------------------------------------ Pip */

export function Pip({ size = 160, mood = 'happy', motion, style }: BuddyProps) {
  const level = useMotionLevel(motion);
  const a = useBuddyAnim(level);
  const p = useUid('pip');
  const W = 200;
  const H = 200;
  const vb = `0 0 ${W} ${H}`;
  const body = useAnimatedStyle(() => ({
    transform: [{ scaleY: 1 + a.breath.value * 0.018 }, { rotate: `${(a.sway.value - 0.5) * 3}deg` }],
  }));
  const eyes = useAnimatedStyle(() => ({ transform: [{ scaleY: 0.1 + 0.9 * a.blink.value }] }));
  const wingL = useAnimatedStyle(() => ({ transform: [{ rotate: `${a.twitch.value * 14 + (a.breath.value - 0.5) * 4}deg` }] }));
  const wingR = useAnimatedStyle(() => ({ transform: [{ rotate: `${-a.twitch.value * 14 - (a.breath.value - 0.5) * 4}deg` }] }));
  const frustrated = mood === 'frustrated';
  return (
    <View style={[{ width: size, height: size }, style]} accessibilityRole="image" accessibilityLabel="Pip the penguin">
      <Rig style={[pivot(100, 190, W, H), body]}>
        <Layer vb={vb} style={[pivot(52, 118, W, H), wingL]}>
          <Defs>
            <LinearGradient id={`${p}w1`} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#3F78E0" />
              <Stop offset="1" stopColor="#2152B8" />
            </LinearGradient>
          </Defs>
          <Path d="M 56 112 C 40 118 28 138 26 156 C 25 164 32 166 38 160 C 48 150 58 138 64 126 Z" fill={`url(#${p}w1)`} />
          <Path d="M 34 150 C 30 156 29 162 32 164 C 36 164 42 158 44 152 Z" fill="#F6B73C" opacity={0.9} />
        </Layer>
        <Layer vb={vb} style={[pivot(148, 118, W, H), wingR]}>
          <Defs>
            <LinearGradient id={`${p}w2`} x1="1" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#3F78E0" />
              <Stop offset="1" stopColor="#2152B8" />
            </LinearGradient>
          </Defs>
          <Path d="M 144 112 C 160 118 172 138 174 156 C 175 164 168 166 162 160 C 152 150 142 138 136 126 Z" fill={`url(#${p}w2)`} />
          <Path d="M 166 150 C 170 156 171 162 168 164 C 164 164 158 158 156 152 Z" fill="#F6B73C" opacity={0.9} />
        </Layer>
        <Layer vb={vb}>
          <Defs>
            <RadialGradient id={`${p}b`} cx="45%" cy="30%" rx="65%" ry="70%">
              <Stop offset="0" stopColor="#4C86EC" />
              <Stop offset="0.7" stopColor="#2E62CF" />
              <Stop offset="1" stopColor="#1F4CAE" />
            </RadialGradient>
            <RadialGradient id={`${p}f`} cx="50%" cy="40%" rx="60%" ry="60%">
              <Stop offset="0" stopColor="#FFFFFF" />
              <Stop offset="1" stopColor="#EEF3FB" />
            </RadialGradient>
          </Defs>
          <Ellipse cx={80} cy={188} rx={16} ry={7} fill="#F2A33A" />
          <Ellipse cx={120} cy={188} rx={16} ry={7} fill="#F2A33A" />
          <Path d="M 92 30 C 88 20 90 12 96 8 C 97 16 100 20 104 22 C 106 14 112 10 118 10 C 114 18 112 24 112 30 Z" fill="#2E62CF" />
          <Path d="M 100 26 C 146 26 168 64 166 110 C 164 158 138 188 100 188 C 62 188 36 158 34 110 C 32 64 54 26 100 26 Z" fill={`url(#${p}b)`} />
          <Path d="M 100 112 C 128 112 144 132 144 154 C 144 174 126 186 100 186 C 74 186 56 174 56 154 C 56 132 72 112 100 112 Z" fill={`url(#${p}f)`} />
          <Path d="M 100 56 C 90 44 64 46 56 70 C 50 90 58 112 78 120 C 88 124 96 122 100 118 C 104 122 112 124 122 120 C 142 112 150 90 144 70 C 136 46 110 44 100 56 Z" fill={`url(#${p}f)`} />
          <Ellipse cx={66} cy={102} rx={9} ry={5} fill="#FF9AA8" opacity={0.5} />
          <Ellipse cx={134} cy={102} rx={9} ry={5} fill="#FF9AA8" opacity={0.5} />
          <Path d="M 88 98 C 92 92 108 92 112 98 C 110 106 104 110 100 110 C 96 110 90 106 88 98 Z" fill="#F7B23B" />
          <Path d="M 90 99 C 96 96 104 96 110 99" stroke="#E08C1E" strokeWidth={1.6} fill="none" />
        </Layer>
        <Layer vb={vb} style={[pivot(100, 86, W, H), eyes]}>
          <Eye x={79} y={86} rx={7.2} ry={9} />
          <Eye x={121} y={86} rx={7.2} ry={9} />
          {frustrated && (
            <G>
              {/* heavy, droopy upper lids + worried brows */}
              <Path d="M 69 74 L 90 74 L 90 84 C 84 80 76 80 69 84 Z" fill="#FFFFFF" />
              <Path d="M 110 74 L 131 74 L 131 84 C 124 80 116 80 110 84 Z" fill="#FFFFFF" />
              <Path d="M 70 84 C 76 80 84 80 89 83" stroke="#1B1414" strokeWidth={2.4} strokeLinecap="round" fill="none" />
              <Path d="M 111 83 C 116 80 124 80 130 84" stroke="#1B1414" strokeWidth={2.4} strokeLinecap="round" fill="none" />
              <Path d="M 72 70 Q 80 66 88 70" stroke="#2A4FA8" strokeWidth={2.4} strokeLinecap="round" fill="none" />
              <Path d="M 112 70 Q 120 66 128 70" stroke="#2A4FA8" strokeWidth={2.4} strokeLinecap="round" fill="none" />
            </G>
          )}
        </Layer>
      </Rig>
    </View>
  );
}

/* ---------------------------------------------------------------- Tilly */

export function Tilly({ size = 160, motion, style }: BuddyProps) {
  const level = useMotionLevel(motion);
  const a = useBuddyAnim(level);
  const p = useUid('til');
  const W = 200;
  const H = 200;
  const vb = `0 0 ${W} ${H}`;
  const head = useAnimatedStyle(() => ({
    transform: [{ translateY: -a.breath.value * 2 }, { rotate: `${(a.sway.value - 0.5) * 5}deg` }],
  }));
  const eyes = useAnimatedStyle(() => ({ transform: [{ scaleY: 0.1 + 0.9 * a.blink.value }] }));
  const body = useAnimatedStyle(() => ({ transform: [{ scaleY: 1 + a.breath.value * 0.015 }] }));
  return (
    <View style={[{ width: size, height: size }, style]} accessibilityRole="image" accessibilityLabel="Tilly the turtle">
      <Rig style={[pivot(100, 190, W, H), body]}>
        <Layer vb={vb}>
          <Defs>
            <RadialGradient id={`${p}s`} cx="40%" cy="35%" rx="70%" ry="70%">
              <Stop offset="0" stopColor="#5DBB63" />
              <Stop offset="1" stopColor="#2F8A48" />
            </RadialGradient>
            <LinearGradient id={`${p}g`} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#7BD87A" />
              <Stop offset="1" stopColor="#46B25A" />
            </LinearGradient>
          </Defs>
          <Path d="M 24 150 C 20 112 44 92 78 92 L 96 92 L 96 180 L 44 180 C 30 176 24 164 24 150 Z" fill={`url(#${p}s)`} />
          <Path d="M 36 128 L 52 116 L 70 122 L 70 142 L 52 150 L 36 142 Z M 36 152 L 52 156 L 58 172 L 42 174 Z M 74 146 L 90 138 L 94 160 L 80 170 L 64 164 Z" fill="#3F9E52" opacity={0.75} />
          <Ellipse cx={58} cy={184} rx={20} ry={10} fill={`url(#${p}g)`} />
          <Ellipse cx={142} cy={184} rx={20} ry={10} fill={`url(#${p}g)`} />
          <Path d="M 100 112 C 128 112 146 132 146 156 C 146 178 128 190 100 190 C 72 190 56 178 56 156 C 56 132 72 112 100 112 Z" fill={`url(#${p}g)`} />
          <Path d="M 100 128 C 118 128 128 142 128 160 C 128 176 116 186 100 186 C 84 186 72 176 72 160 C 72 142 82 128 100 128 Z" fill="#F7E08A" />
          <Path d="M 74 150 L 126 150 M 72 166 L 128 166 M 100 128 L 100 186 M 86 132 L 86 184 M 114 132 L 114 184" stroke="#E4C35C" strokeWidth={2} />
          <Path d="M 56 132 C 44 136 36 148 38 158 C 40 164 48 164 54 158 Z" fill={`url(#${p}g)`} />
          <Path d="M 144 132 C 156 136 164 148 162 158 C 160 164 152 164 146 158 Z" fill={`url(#${p}g)`} />
        </Layer>
        <Rig style={[pivot(100, 118, W, H), head]}>
          <Layer vb={vb}>
            <Defs>
              <RadialGradient id={`${p}h`} cx="45%" cy="35%" rx="60%" ry="65%">
                <Stop offset="0" stopColor="#86DE84" />
                <Stop offset="1" stopColor="#4CB55C" />
              </RadialGradient>
            </Defs>
            <Ellipse cx={100} cy={76} rx={48} ry={44} fill={`url(#${p}h)`} />
            <Ellipse cx={72} cy={92} rx={8} ry={5} fill="#FF9AA0" opacity={0.45} />
            <Ellipse cx={128} cy={92} rx={8} ry={5} fill="#FF9AA0" opacity={0.45} />
            <Path d="M 88 96 Q 100 106 112 96" stroke="#1F5A2C" strokeWidth={3} strokeLinecap="round" fill="none" />
          </Layer>
          <Layer vb={vb} style={[pivot(100, 78, W, H), eyes]}>
            <Eye x={82} y={78} rx={7} ry={8.6} />
            <Eye x={118} y={78} rx={7} ry={8.6} />
          </Layer>
        </Rig>
      </Rig>
    </View>
  );
}

/* ------------------------------------------------------------------ Roo */

export function Roo({ size = 160, motion, style }: BuddyProps) {
  const level = useMotionLevel(motion);
  const a = useBuddyAnim(level);
  const p = useUid('roo');
  const W = 200;
  const H = 200;
  const vb = `0 0 ${W} ${H}`;
  const head = useAnimatedStyle(() => ({
    transform: [{ translateY: -a.breath.value * 1.6 }, { rotate: `${(a.sway.value - 0.5) * 7}deg` }],
  }));
  const earL = useAnimatedStyle(() => ({ transform: [{ rotate: `${a.twitch.value * 10 + (a.sway.value - 0.5) * 5}deg` }] }));
  const earR = useAnimatedStyle(() => ({ transform: [{ rotate: `${-a.twitch.value * 10 - (a.sway.value - 0.5) * 5}deg` }] }));
  const eyes = useAnimatedStyle(() => ({ transform: [{ scaleY: 0.1 + 0.9 * a.blink.value }] }));
  return (
    <View style={[{ width: size, height: size }, style]} accessibilityRole="image" accessibilityLabel="Roo the puppy">
      <Layer vb={vb}>
        <Defs>
          <LinearGradient id={`${p}b`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#E9C39A" />
            <Stop offset="1" stopColor="#D9A874" />
          </LinearGradient>
        </Defs>
        <Path d="M 52 196 C 48 158 70 132 100 132 C 130 132 152 158 148 196 Z" fill={`url(#${p}b)`} />
        <Path d="M 58 150 C 50 150 44 160 46 172 L 62 176 Z M 142 150 C 150 150 156 160 154 172 L 138 176 Z" fill="#E86A4A" />
        <Ellipse cx={74} cy={190} rx={18} ry={10} fill="#E2B888" />
        <Ellipse cx={126} cy={190} rx={18} ry={10} fill="#E2B888" />
        <Path d="M 76 134 L 124 134 L 116 150 L 100 156 L 84 150 Z" fill="#2F6FE0" />
      </Layer>
      <Rig style={[pivot(100, 132, W, H), head]}>
        <Layer vb={vb} style={[pivot(58, 60, W, H), earL]}>
          <Path d="M 60 50 C 40 48 26 64 26 88 C 26 108 34 118 44 116 C 54 114 58 98 62 84 Z" fill="#8A5634" />
        </Layer>
        <Layer vb={vb} style={[pivot(142, 60, W, H), earR]}>
          <Path d="M 140 50 C 160 48 174 64 174 88 C 174 108 166 118 156 116 C 146 114 142 98 138 84 Z" fill="#8A5634" />
        </Layer>
        <Layer vb={vb}>
          <Defs>
            <RadialGradient id={`${p}h`} cx="50%" cy="35%" rx="60%" ry="65%">
              <Stop offset="0" stopColor="#F4D8B4" />
              <Stop offset="1" stopColor="#E0B284" />
            </RadialGradient>
          </Defs>
          <Path d="M 100 38 C 136 38 150 62 150 88 C 150 116 128 134 100 134 C 72 134 50 116 50 88 C 50 62 64 38 100 38 Z" fill={`url(#${p}h)`} />
          <Ellipse cx={100} cy={108} rx={24} ry={18} fill="#F7E6D0" />
          <Ellipse cx={72} cy={104} rx={8} ry={5} fill="#FF9A9A" opacity={0.45} />
          <Ellipse cx={128} cy={104} rx={8} ry={5} fill="#FF9A9A" opacity={0.45} />
          <Path d="M 92 98 C 92 92 108 92 108 98 C 108 103 103 106 100 106 C 97 106 92 103 92 98 Z" fill="#2A1A18" />
          <Path d="M 100 106 L 100 112 M 92 113 Q 100 120 108 113" stroke="#2A1A18" strokeWidth={2.2} strokeLinecap="round" fill="none" />
          <Path d="M 95 116 C 97 124 103 124 105 116 Z" fill="#F27D8C" />
        </Layer>
        <Layer vb={vb} style={[pivot(100, 84, W, H), eyes]}>
          <Eye x={82} y={84} rx={6.6} ry={8} />
          <Eye x={118} y={84} rx={6.6} ry={8} />
        </Layer>
      </Rig>
    </View>
  );
}
