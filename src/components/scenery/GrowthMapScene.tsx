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
  [60, 500],
  [110, 452],
  [196, 420],
  [236, 380],
  [176, 332],
  [150, 296],
  [206, 254],
  [240, 214],
  [214, 176],
  [196, 150],
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

export const SIGNPOSTS = {
  communication: { x: 282, y: 128 },
  emotions: { x: 300, y: 196 },
  independence: { x: 276, y: 290 },
  routines: { x: 262, y: 368 },
};

function WalkingFox({ progress }: { progress: number }) {
  const b = useStage();
  const level = useMotionLevel();
  const start = pointAt(0.08 + progress * 0.52);
  const x = useSharedValue(start[0]);
  const y = useSharedValue(start[1]);
  useEffect(() => {
    const [nx, ny] = pointAt(0.08 + progress * 0.52);
    const cfg = { duration: level === 'off' ? 0 : 1600, easing: Easing.inOut(Easing.quad) };
    x.value = withTiming(nx, cfg);
    y.value = withTiming(ny, cfg);
  }, [progress, level, x, y]);
  const size = 190 * b.scale;
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
        <Tree x={24} y={174} h={96} />
        <Tree x={70} y={186} h={70} tone="light" />
        <Tree x={110} y={170} h={82} />
        <Tree x={18} y={262} h={80} tone="light" />
        <Tree x={60} y={290} h={100} />
        <Tree x={112} y={230} h={50} tone="light" />
        <Tree x={362} y={170} h={92} />
        <Tree x={376} y={276} h={80} tone="light" />
        <Tree x={348} y={390} h={96} />
        <Tree x={20} y={420} h={90} />
        <Tree x={370} y={470} h={74} tone="light" />
        <Bush x={140} y={200} s={0.9} tone="deep" />
        <Bush x={340} y={220} s={0.8} />
        <Bush x={40} y={508} s={1.3} tone="deep" />
        <Bush x={300} y={510} s={1.1} />
        <Bush x={200} y={500} s={0.9} tone="light" />
        <Tuft x={140} y={380} s={1.2} />
        <Tuft x={320} y={450} s={1.1} />
        <G>
          <Star5 cx={210} cy={470} r={8} fill="#FBE27A" />
          <Star5 cx={108} cy={342} r={6} fill="#FBE27A" />
          <Star5 cx={236} cy={300} r={5} fill="#FBE27A" />
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
