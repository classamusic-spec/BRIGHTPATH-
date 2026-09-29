import { useEffect, type ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { Fox } from '@/components/characters/fox/Fox';
import { useOscillator } from '@/components/characters/anim';
import { useMotionLevel } from '@/lib/motion';
import { useUid } from '@/lib/uid';

import { Bush, CloudShape, Mountain, SCENE, Star5, Tree, Tuft } from './elements';
import { Stage, StageLayer, StageNode, useStage } from './Stage';

export const GROWTH_VB = { w: 390, h: 520 };

/** Path the fox walks (viewBox units), from the meadow up into the hills. */
const TRAIL: [number, number][] = [
  [132, 530],
  [100, 482],
  [94, 432],
  [122, 386],
  [168, 352],
  [206, 318],
  [190, 272],
  [168, 236],
  [200, 196],
  [226, 158],
];

function pointAt(t: number): [number, number] {
  const seg = TRAIL.length - 1;
  const x = Math.max(0, Math.min(0.9999, t)) * seg;
  const i = Math.floor(x);
  const f = x - i;
  const [ax, ay] = TRAIL[i];
  const [bx, by] = TRAIL[i + 1];
  return [ax + (bx - ax) * f, ay + (by - ay) * f];
}

/**
 * The fox stays on the lower, left-hand stretch of the trail (as on the board)
 * and only walks as far as the evidence shows.
 */
function along(progress: number): [number, number] {
  return pointAt(0.06 + Math.max(0, Math.min(1, progress)) * 0.3);
}

export const SIGNPOSTS = {
  communication: { x: 268, y: 118 },
  emotions: { x: 294, y: 196 },
  independence: { x: 264, y: 284 },
  routines: { x: 256, y: 366 },
};

function WalkingFox({ progress }: { progress: number }) {
  const b = useStage();
  const level = useMotionLevel();
  const start = along(progress);
  const x = useSharedValue(start[0]);
  const y = useSharedValue(start[1]);
  useEffect(() => {
    const [nx, ny] = along(progress);
    const cfg = { duration: level === 'off' ? 0 : 1600, easing: Easing.inOut(Easing.quad) };
    x.value = withTiming(nx, cfg);
    y.value = withTiming(ny, cfg);
  }, [progress, level, x, y]);
  const size = 228 * b.scale;
  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    left: b.left + x.value * b.scale - size / 2,
    top: b.top + y.value * b.scale - size * 0.96,
    width: size,
    height: size,
  }));
  return (
    <Animated.View style={style}>
      <Fox pose="walk" size={size} />
    </Animated.View>
  );
}

function Clouds() {
  const level = useMotionLevel();
  const t = useOscillator(level !== 'off', 9000);
  const s = useAnimatedStyle(() => ({ transform: [{ translateX: (t.value - 0.5) * 16 }] }));
  return (
    <StageLayer style={s}>
      <CloudShape x={70} y={36} s={0.65} />
      <CloudShape x={214} y={40} s={0.55} />
    </StageLayer>
  );
}

export function GrowthMapScene({ progress, style, children }: { progress: number; style?: StyleProp<ViewStyle>; children?: ReactNode }) {
  const u = useUid('gm');
  const trail = `M ${TRAIL.map(([x, y]) => `${x} ${y}`).join(' L ')}`;
  return (
    <Stage vbW={GROWTH_VB.w} vbH={GROWTH_VB.h} fit="slice" align="center" style={style}>
      <StageLayer>
        <Defs>
          <LinearGradient id={`${u}sky`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#D9EEFD" />
            <Stop offset="1" stopColor="#EEF8FE" />
          </LinearGradient>
          <LinearGradient id={`${u}land`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#C9ECA6" />
            <Stop offset="1" stopColor="#A6DB88" />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={390} height={520} fill={`url(#${u}sky)`} />
        <Mountain x={150} y={150} w={170} h={80} color="#9CBEF3" />
        <Mountain x={272} y={146} w={190} h={104} color="#86ADEF" />
        <Mountain x={372} y={150} w={140} h={76} color="#A9C8F5" />
        <Path d="M 0 132 C 90 116 190 126 280 138 C 330 144 360 140 390 134 L 390 520 L 0 520 Z" fill={`url(#${u}land)`} />
        <Path d="M 0 240 C 100 226 220 236 390 250 L 390 520 L 0 520 Z" fill="#B4E295" opacity={0.6} />
        <Path d={trail} stroke={SCENE.pathEdge} strokeWidth={34} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Path d={trail} stroke={SCENE.path} strokeWidth={27} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Tree x={22} y={176} h={96} />
        <Tree x={64} y={188} h={70} tone="light" />
        <Tree x={112} y={172} h={82} />
        <Tree x={250} y={170} h={60} tone="light" />
        <Tree x={362} y={172} h={92} />
        <Tree x={16} y={300} h={84} tone="light" />
        <Tree x={376} y={272} h={80} tone="light" />
        <Tree x={352} y={404} h={96} />
        <Tree x={18} y={452} h={92} />
        <Tree x={232} y={452} h={66} tone="light" />
        <Tree x={372} y={488} h={74} tone="light" />
        <Bush x={146} y={202} s={0.9} tone="deep" />
        <Bush x={336} y={226} s={0.8} />
        <Bush x={44} y={512} s={1.3} tone="deep" />
        <Bush x={300} y={512} s={1.1} />
        <Bush x={206} y={506} s={0.9} tone="light" />
        <Tuft x={252} y={392} s={1.2} />
        <Tuft x={322} y={456} s={1.1} />
        <G>
          <Star5 cx={262} cy={480} r={8} fill="#FBE27A" />
          <Star5 cx={60} cy={380} r={6} fill="#FBE27A" />
          <Star5 cx={236} cy={250} r={5} fill="#FBE27A" />
        </G>
        {Object.values(SIGNPOSTS).map((p, i) => (
          <Path key={i} d={`M ${p.x - 60} ${p.y + 16} L ${p.x - 60} ${p.y + 50}`} stroke="#2F3C7A" strokeWidth={5} strokeLinecap="round" />
        ))}
      </StageLayer>
      <Clouds />
      <WalkingFox progress={progress} />
      {children}
    </Stage>
  );
}

export { StageNode as GrowthNode };
