/**
 * Simple geometric people (Framework §58): Aiden for story scenes and adult
 * avatars for the coach experience. Friendly, non-photorealistic, no faces
 * of real people.
 */
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';

import { useMotionLevel, type MotionLevel } from '@/lib/motion';
import { useUid } from '@/lib/uid';

import { Layer, pivot, Rig } from './Layer';
import { useBlink, useOscillator } from './anim';

const SKIN = '#F9D5B8';
const SKIN_SHADE = '#EDB896';
const HAIR = '#7A4A2B';
const HAIR_DARK = '#5E3620';

function Eye({ x, y, rx = 5.4, ry = 6.6 }: { x: number; y: number; rx?: number; ry?: number }) {
  return (
    <G>
      <Ellipse cx={x} cy={y} rx={rx} ry={ry} fill="#20160F" />
      <Circle cx={x + rx * 0.35} cy={y - ry * 0.33} r={rx * 0.4} fill="#FFFFFF" />
    </G>
  );
}

/* ----------------------------------------------------------------- Aiden */

type AidenProps = { size?: number; mood?: 'sad' | 'calm' | 'happy'; motion?: MotionLevel; style?: StyleProp<ViewStyle> };

function AidenHead({ p, mood }: { p: string; mood: 'sad' | 'calm' | 'happy' }) {
  return (
    <G>
      <Ellipse cx={58} cy={86} rx={9} ry={11} fill={SKIN_SHADE} />
      <Ellipse cx={142} cy={86} rx={9} ry={11} fill={SKIN_SHADE} />
      <Path d="M 100 36 C 134 36 146 62 146 88 C 146 118 126 136 100 136 C 74 136 54 118 54 88 C 54 62 66 36 100 36 Z" fill={`url(#${p}skin)`} />
      <Path
        d="M 52 86 C 46 58 60 30 92 24 C 96 16 104 14 110 20 C 116 12 128 16 130 24 C 150 30 158 56 150 84 C 146 72 138 62 128 58 C 132 66 130 72 126 74 C 120 64 108 58 96 58 C 98 64 96 70 92 72 C 86 64 76 62 68 66 C 62 70 56 78 52 86 Z"
        fill={`url(#${p}hair)`}
      />
      <Path d="M 88 26 C 84 18 86 12 92 10 C 92 16 94 20 98 22 Z M 118 20 C 122 12 128 10 134 12 C 130 16 128 20 128 24 Z" fill={HAIR} />
      <Ellipse cx={74} cy={108} rx={8} ry={5} fill="#FF9C8E" opacity={0.45} />
      <Ellipse cx={126} cy={108} rx={8} ry={5} fill="#FF9C8E" opacity={0.45} />
      {mood === 'sad' ? (
        <G>
          <Path d="M 72 78 Q 80 72 88 76" stroke={HAIR_DARK} strokeWidth={2.6} strokeLinecap="round" fill="none" />
          <Path d="M 112 76 Q 120 72 128 78" stroke={HAIR_DARK} strokeWidth={2.6} strokeLinecap="round" fill="none" />
          <Path d="M 90 118 Q 100 110 110 118" stroke="#8A3B2E" strokeWidth={2.8} strokeLinecap="round" fill="none" />
        </G>
      ) : (
        <G>
          <Path d="M 72 76 Q 80 72 88 75" stroke={HAIR_DARK} strokeWidth={2.4} strokeLinecap="round" fill="none" />
          <Path d="M 112 75 Q 120 72 128 76" stroke={HAIR_DARK} strokeWidth={2.4} strokeLinecap="round" fill="none" />
          <Path d={mood === 'happy' ? 'M 88 112 Q 100 124 112 112' : 'M 90 114 Q 100 120 110 114'} stroke="#8A3B2E" strokeWidth={2.8} strokeLinecap="round" fill="none" />
        </G>
      )}
      <Path d="M 98 98 Q 100 102 103 100" stroke={SKIN_SHADE} strokeWidth={2.2} strokeLinecap="round" fill="none" />
    </G>
  );
}

function AidenDefs({ p }: { p: string }) {
  return (
    <Defs>
      <RadialGradient id={`${p}skin`} cx="50%" cy="40%" rx="60%" ry="65%">
        <Stop offset="0" stopColor="#FFE3CC" />
        <Stop offset="1" stopColor={SKIN} />
      </RadialGradient>
      <LinearGradient id={`${p}hair`} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#8E5A35" />
        <Stop offset="1" stopColor={HAIR_DARK} />
      </LinearGradient>
      <LinearGradient id={`${p}shirt`} x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#3D7FEA" />
        <Stop offset="1" stopColor="#2458C4" />
      </LinearGradient>
      <LinearGradient id={`${p}pants`} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#5B6273" />
        <Stop offset="1" stopColor="#434959" />
      </LinearGradient>
    </Defs>
  );
}

/** Aiden sitting on the floor, chin in hand (Story Scenario). */
export function Aiden({ size = 220, mood = 'sad', motion, style }: AidenProps) {
  const level = useMotionLevel(motion);
  const on = level !== 'off';
  const breath = useOscillator(on, 2400);
  const blink = useBlink(on);
  const p = useUid('aid');
  const W = 200;
  const H = 220;
  const vb = `0 0 ${W} ${H}`;
  const body = useAnimatedStyle(() => ({ transform: [{ scaleY: 1 + breath.value * 0.015 }] }));
  const head = useAnimatedStyle(() => ({ transform: [{ translateY: breath.value * 1.5 }, { rotate: `${-4 + breath.value * 1.5}deg` }] }));
  const eyes = useAnimatedStyle(() => ({ transform: [{ scaleY: 0.1 + 0.9 * blink.value }] }));
  return (
    <View style={[{ width: (size * W) / H, height: size }, style]} accessibilityRole="image" accessibilityLabel="Aiden sitting and feeling frustrated">
      <Rig style={[pivot(100, 216, W, H), body]}>
        <Layer vb={vb}>
          <AidenDefs p={p} />
          <Path d="M 30 206 C 26 184 44 172 70 172 L 132 172 C 158 172 176 184 172 206 C 168 214 150 216 100 216 C 50 216 34 214 30 206 Z" fill={`url(#${p}pants)`} />
          <Path d="M 142 196 C 152 190 170 190 176 198 C 180 206 172 212 160 212 C 150 212 140 206 142 196 Z" fill="#FFFFFF" />
          <Path d="M 144 198 C 150 194 162 194 166 198" stroke="#E4E8F0" strokeWidth={2} fill="none" />
          <Path d="M 62 176 C 58 150 66 130 100 126 C 134 130 142 150 138 176 Z" fill={`url(#${p}shirt)`} />
          <Path d="M 66 150 C 54 160 50 176 60 184 C 70 190 92 188 104 182 L 100 170 C 88 172 78 170 76 162 Z" fill={`url(#${p}shirt)`} />
          <Ellipse cx={100} cy={180} rx={9} ry={7} fill={SKIN} />
          <Path d="M 130 150 C 144 150 150 134 144 116 L 132 112 C 134 126 132 136 124 142 Z" fill={`url(#${p}shirt)`} />
        </Layer>
      </Rig>
      <Rig style={[pivot(100, 132, W, H), head]}>
        <Layer vb={vb}>
          <AidenDefs p={`${p}h`} />
          <G transform="translate(0 -6)">
            <AidenHead p={`${p}h`} mood={mood} />
          </G>
        </Layer>
        <Layer vb={vb} style={[pivot(100, 86, W, H), eyes]}>
          <Eye x={80} y={86} />
          <Eye x={120} y={86} />
        </Layer>
      </Rig>
      <Layer vb={vb}>
        <Path d="M 128 116 C 134 106 146 104 150 112 C 152 120 146 128 138 130 C 132 130 126 124 128 116 Z" fill={SKIN} />
        <Path d="M 132 110 C 136 106 142 106 144 110" stroke={SKIN_SHADE} strokeWidth={1.6} fill="none" />
      </Layer>
    </View>
  );
}

/** Round head-and-shoulders portrait of Aiden (Response Choice cards). */
export function AidenFace({ size = 64, mood = 'sad', motion }: AidenProps) {
  const level = useMotionLevel(motion);
  const blink = useBlink(level !== 'off');
  const p = useUid('aif');
  const eyes = useAnimatedStyle(() => ({ transform: [{ scaleY: 0.1 + 0.9 * blink.value }] }));
  return (
    <View style={{ width: size, height: size }}>
      <Layer vb="0 0 200 200">
        <AidenDefs p={p} />
        <Path d="M 40 200 C 40 170 66 152 100 152 C 134 152 160 170 160 200 Z" fill={`url(#${p}shirt)`} />
        <G transform="translate(0 16)">
          <AidenHead p={p} mood={mood} />
        </G>
      </Layer>
      <Layer vb="0 0 200 200" style={[pivot(100, 102, 200, 200), eyes]}>
        <Eye x={80} y={102} rx={6} ry={7.4} />
        <Eye x={120} y={102} rx={6} ry={7.4} />
      </Layer>
    </View>
  );
}

/* ---------------------------------------------------------------- Adults */

export type PersonLook = {
  hair: 'long' | 'bob' | 'short';
  hairColor?: string;
  skin?: string;
  top: string;
  bg: string;
};

export const PEOPLE: Record<string, PersonLook> = {
  taylor: { hair: 'long', top: '#6FB4F4', bg: '#D9ECFD' },
  you: { hair: 'bob', top: '#2F6FE0', bg: '#CDEFD8' },
  mrsTaylor: { hair: 'long', top: '#9C6BE8', bg: '#D6E9FC', hairColor: '#5E3620' },
  drKim: { hair: 'long', top: '#B07BF0', bg: '#E4E0FB', hairColor: '#6A3F24' },
  jordan: { hair: 'short', top: '#2F5FCF', bg: '#D3E8FC', hairColor: '#6F4426' },
};

export function PersonAvatar({ look, size = 56, motion }: { look: PersonLook; size?: number; motion?: MotionLevel }) {
  const level = useMotionLevel(motion);
  const blink = useBlink(level !== 'off');
  const eyes = useAnimatedStyle(() => ({ transform: [{ scaleY: 0.1 + 0.9 * blink.value }] }));
  const hair = look.hairColor ?? HAIR;
  const skin = look.skin ?? SKIN;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: look.bg }}>
      <Layer vb="0 0 100 100">
        {look.hair === 'long' && <Path d="M 22 86 C 16 50 24 20 50 18 C 76 20 84 50 78 86 Z" fill={hair} />}
        <Path d="M 20 100 C 20 82 34 72 50 72 C 66 72 80 82 80 100 Z" fill={look.top} />
        <Path d="M 43 66 L 57 66 L 56 76 C 53 79 47 79 44 76 Z" fill={SKIN_SHADE} />
        <Ellipse cx={50} cy={48} rx={20} ry={22} fill={skin} />
        {look.hair === 'long' && (
          <Path d="M 29 50 C 27 32 36 22 50 22 C 64 22 74 32 71 50 C 66 42 60 36 52 34 C 46 40 38 44 29 50 Z" fill={hair} />
        )}
        {look.hair === 'bob' && (
          <Path d="M 27 60 C 22 36 32 22 50 22 C 68 22 78 36 73 60 L 68 60 C 68 48 64 40 56 36 C 48 42 38 46 32 48 L 32 60 Z" fill={hair} />
        )}
        {look.hair === 'short' && (
          <Path d="M 29 46 C 28 30 38 22 52 22 C 66 22 74 32 71 46 C 66 38 58 34 50 34 C 42 36 34 40 29 46 Z" fill={hair} />
        )}
        <Ellipse cx={39} cy={57} rx={4} ry={2.4} fill="#FF9C8E" opacity={0.45} />
        <Ellipse cx={61} cy={57} rx={4} ry={2.4} fill="#FF9C8E" opacity={0.45} />
        <Path d="M 44 60 Q 50 65 56 60" stroke="#A0463A" strokeWidth={2} strokeLinecap="round" fill="none" />
      </Layer>
      <Layer vb="0 0 100 100" style={[pivot(50, 50, 100, 100), eyes]}>
        <Ellipse cx={42} cy={50} rx={2.6} ry={3.2} fill="#20160F" />
        <Ellipse cx={58} cy={50} rx={2.6} ry={3.2} fill="#20160F" />
        <Circle cx={43} cy={49} r={0.9} fill="#FFFFFF" />
        <Circle cx={59} cy={49} r={0.9} fill="#FFFFFF" />
      </Layer>
    </View>
  );
}

/** Static mini person glyph used inside icon tiles. */
export function PersonGlyph({ size = 40, color = '#2F9E5E' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Circle cx={20} cy={13} r={7.5} fill={color} />
      <Path d="M 6 36 C 6 26 12 21 20 21 C 28 21 34 26 34 36 Z" fill={color} />
    </Svg>
  );
}
